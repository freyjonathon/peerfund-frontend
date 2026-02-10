import React, { useEffect, useState } from 'react';

const RepaymentForm = ({ loanId, onPaymentSubmitted }) => {
  const [repaymentDetails, setRepaymentDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchRepaymentDetails = async () => {
      try {
        setLoading(true);

        const res = await fetch(`/api/repayments/${loanId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error('Failed to load repayments');
        const repayments = await res.json();

        const nextRepayment = Array.isArray(repayments)
          ? repayments.find((r) => r.status === 'PENDING')
          : null;

        if (!nextRepayment) {
          setRepaymentDetails(null);
          return;
        }

        setRepaymentDetails(nextRepayment);
      } catch (err) {
        console.error('Error fetching repayment info:', err);
        alert('⚠️ Could not load repayment details.');
        setRepaymentDetails(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRepaymentDetails();
  }, [loanId, token]);

  if (loading) return <p>Loading repayment form...</p>;
  if (!repaymentDetails) return <p>✅ All repayments are complete!</p>;

  const {
    id: repaymentId,
    basePayment = 0,
    platformFee = 0,
    bankFee = 0,
    dueDate,
  } = repaymentDetails;

  const totalDue = (
    Number(basePayment) +
    Number(platformFee || 0) +
    Number(bankFee || 0)
  ).toFixed(2);

  const startCheckout = async () => {
    try {
      setIsStartingCheckout(true);

      const res = await fetch('/api/payments/repayment-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          loanId,
          repaymentId, // let backend lock the amount and add metadata
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Could not create checkout session');
      }

      const data = await res.json();

      // ✅ Use the prop so ESLint passes, and parent can refresh UI if needed
      if (typeof onPaymentSubmitted === 'function') {
        await onPaymentSubmitted({ loanId, repaymentId, checkoutUrl: data?.url });
      }

      if (data?.url) {
        window.location.href = data.url; // redirect to Stripe Checkout
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      console.error('Start checkout error:', err);
      alert('⚠️ There was a problem starting checkout. Please try again.');
      setIsStartingCheckout(false);
    }
  };

  return (
    <div style={{ marginTop: '1rem' }}>
      <h4>Make a Repayment</h4>
      <p>
        <strong>Due Date:</strong> {new Date(dueDate).toLocaleDateString()}
      </p>
      <ul>
        <li>Principal + Interest: ${Number(basePayment).toFixed(2)}</li>
        <li>Banking Fee (1%): ${Number(bankFee).toFixed(2)}</li>
        <li>
          PeerFund Fee (1%): ${Number(platformFee).toFixed(2)}{' '}
          {Number(platformFee) === 0 && <em>(Waived for SuperUsers 💎)</em>}
        </li>
        <li>
          <strong>Total Due:</strong> ${totalDue}
        </li>
      </ul>

      {/* Amount is locked to what backend will charge via Stripe */}
      <label>
        Amount Charged ($):
        <input type="number" value={totalDue} readOnly />
      </label>
      <br />

      <button
        type="button"
        onClick={startCheckout}
        disabled={isStartingCheckout}
        style={{ marginTop: '0.5rem' }}
      >
        {isStartingCheckout ? 'Starting checkout…' : 'Pay with Card'}
      </button>
    </div>
  );
};

export default RepaymentForm;

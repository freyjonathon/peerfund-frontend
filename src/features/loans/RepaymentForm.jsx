// src/features/loans/RepaymentForm.jsx
import React, { useEffect, useState } from 'react';

const RepaymentForm = ({ loanId, onPaymentSubmitted }) => {
  const [repaymentDetails, setRepaymentDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentSource, setPaymentSource] = useState('wallet'); // wallet | card
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchRepaymentDetails = async () => {
      try {
        setLoading(true);
        setError('');

        const res = await fetch(`/api/repayments/${loanId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error('Failed to load repayments');

        const repayments = await res.json();

        const nextRepayment = Array.isArray(repayments)
          ? repayments.find((r) => r.status === 'PENDING')
          : null;

        setRepaymentDetails(nextRepayment || null);
      } catch (err) {
        console.error('Error fetching repayment info:', err);
        setError('Could not load repayment details.');
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
    peerfundFee = 0,
    platformFee = 0,
    bankingFee = 0,
    bankFee = 0,
    totalCharged,
    dueDate,
  } = repaymentDetails;

  const displayPeerfundFee = Number(peerfundFee || platformFee || 0);
  const displayBankingFee = Number(bankingFee || bankFee || 0);

  const calculatedTotal =
    Number(basePayment || 0) + displayPeerfundFee + displayBankingFee;

  const totalDue = Number(
    typeof totalCharged === 'number' && totalCharged > 0
      ? totalCharged
      : calculatedTotal
  );

  const submitPayment = async () => {
    try {
      setIsPaying(true);
      setError('');

      const res = await fetch(`/api/loans/${loanId}/pay-next`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ paymentSource }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Payment failed');
      }

      const data = await res.json();

      if (typeof onPaymentSubmitted === 'function') {
        await onPaymentSubmitted({
          loanId,
          repaymentId,
          paymentSource,
          response: data,
        });
      }

      alert('✅ Repayment submitted successfully.');
    } catch (err) {
      console.error('Repayment submit error:', err);
      setError(err.message || 'There was a problem submitting payment.');
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div style={{ marginTop: '1rem' }}>
      <h4>Make a Repayment</h4>

      {error && (
        <div
          style={{
            marginBottom: 8,
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#7f1d1d',
            borderRadius: 8,
            padding: '8px 10px',
          }}
        >
          {error}
        </div>
      )}

      <p>
        <strong>Due Date:</strong> {new Date(dueDate).toLocaleDateString()}
      </p>

      <ul>
        <li>Principal + Interest: ${Number(basePayment).toFixed(2)}</li>
        <li>Banking / processing fee: ${displayBankingFee.toFixed(2)}</li>
        <li>
          PeerFund Fee: ${displayPeerfundFee.toFixed(2)}{' '}
          {displayPeerfundFee === 0 && <em>(Waived for SuperUsers 💎)</em>}
        </li>
        <li>
          <strong>Total repayment:</strong> ${totalDue.toFixed(2)}
        </li>
      </ul>

      <div style={{ marginTop: 10, marginBottom: 10 }}>
        <strong>Pay from:</strong>

        <label style={{ marginLeft: 10 }}>
          <input
            type="radio"
            value="wallet"
            checked={paymentSource === 'wallet'}
            onChange={() => setPaymentSource('wallet')}
          />{' '}
          PeerFund wallet balance
        </label>

        <label style={{ marginLeft: 10 }}>
          <input
            type="radio"
            value="card"
            checked={paymentSource === 'card'}
            onChange={() => setPaymentSource('card')}
          />{' '}
          Saved funding card
        </label>
      </div>

      {paymentSource === 'card' && (
        <p style={{ fontSize: 13, color: '#64748b' }}>
          Card payments may include Stripe processing fees added on top.
        </p>
      )}

      <label>
        Amount Applied to Repayment ($):
        <input type="number" value={totalDue.toFixed(2)} readOnly />
      </label>

      <br />

      <button
        type="button"
        onClick={submitPayment}
        disabled={isPaying}
        style={{ marginTop: '0.5rem' }}
      >
        {isPaying ? 'Processing…' : 'Submit Repayment'}
      </button>
    </div>
  );
};

export default RepaymentForm;
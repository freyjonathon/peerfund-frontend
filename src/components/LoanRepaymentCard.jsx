import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoanRepaymentCard.css'; // ✅ New CSS file

const LoanRepaymentCard = ({ loan }) => {
  const navigate = useNavigate();
  const { id, amount, interestRate, duration, purpose, lender } = loan;

  const totalWithInterest = amount + (amount * (interestRate / 100));
  const installment = parseFloat((totalWithInterest / duration).toFixed(2));
  const [paymentAmount, setPaymentAmount] = useState(installment);
  const [repayments, setRepayments] = useState([]);

  useEffect(() => {
    const fetchRepayments = async () => {
      try {
        const res = await fetch(`/api/loans/${id}/repayments`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (!res.ok) throw new Error('Failed to fetch repayments');
        const data = await res.json();
        setRepayments(data);
      } catch (err) {
        console.error('Error loading repayment history:', err);
      }
    };

    fetchRepayments();
  }, [id]);

  const handleSubmit = async () => {
    try {
      const res = await fetch(`/api/repayments/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          amountPaid: paymentAmount,
          note: `Slider payment of $${paymentAmount}`,
        }),
      });

      if (!res.ok) throw new Error('Payment failed');
      alert('✅ Payment submitted!');
    } catch (err) {
      alert(`❌ Error submitting payment: ${err.message}`);
    }
  };

  const next = repayments.find(r => r.status === 'PENDING');

  return (
    <div className="loan-repay-card">
      <div className="loan-section">
        <p><strong>Lender:</strong> {lender?.name || '—'}</p>
        <p><strong>Amount:</strong> ${amount.toFixed(2)}</p>
        <p><strong>Interest Rate:</strong> {interestRate}%</p>
        <p><strong>Platform & Banking Fees:</strong> 3%</p>
        <p><strong>Duration:</strong> {duration} months</p>
        <p><strong>Purpose:</strong> {purpose}</p>
        <p><strong>Installment:</strong> ${installment.toFixed(2)}</p>
        <p><strong>Total with Interest:</strong> ${totalWithInterest.toFixed(2)}</p>
      </div>

      <div className="repay-slider">
        <input
          type="range"
          min="0"
          max={totalWithInterest}
          step="0.01"
          value={paymentAmount}
          onChange={(e) => setPaymentAmount(parseFloat(e.target.value))}
        />
        <p>Paying: <strong>${paymentAmount.toFixed(2)}</strong></p>
        <button onClick={handleSubmit} className="action-btn">💸 Make Payment</button>
        <button onClick={() => navigate(`/loan/${loan.id}/messages`)} className="action-btn alt">💬 Messages</button>
        <button onClick={() => navigate(`/documents/${id}`)} className="action-btn alt">📄 View Contract</button>
      </div>

      <div className="repay-summary">
        <h4>📅 Repayment Schedule</h4>
        <p className="repay-note">Includes all installments (paid and unpaid)</p>
        {next ? (
          <p className="next-due">
            ⏳ <strong>Next due:</strong> {new Date(next.dueDate).toLocaleDateString()} — ${next.amountDue.toFixed(2)}
          </p>
        ) : (
          <p className="paid-out">✅ All repayments completed</p>
        )}

        {repayments.length > 0 ? (
          <ul className="repay-list">
            {repayments.map((r, idx) => (
              <li key={idx}>
                📅 <strong>{new Date(r.dueDate).toLocaleDateString()}</strong> — 💰 ${r.amountDue.toFixed(2)}
                {r.amountPaid > 0 && (
                  <>
                    , ✅ Paid: ${r.amountPaid.toFixed(2)} on {r.paidAt ? new Date(r.paidAt).toLocaleDateString() : '—'}
                  </>
                )}
                <span className={`status ${r.status.toLowerCase()}`}>[{r.status}]</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No repayments found.</p>
        )}
      </div>
    </div>
  );
};

export default LoanRepaymentCard;

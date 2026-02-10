// src/components/RepaymentTracker.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const RepaymentTracker = () => {
  const { loanId } = useParams();
  const [repayments, setRepayments] = useState([]);

  useEffect(() => {
    const fetchRepayments = async () => {
      try {
        const token = localStorage.getItem('token');

        const res = await fetch(`/api/loans/${loanId}/repayments`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.ok) throw new Error('Failed to fetch repayments');

        const data = await res.json();
        setRepayments(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching repayments:', err);
      }
    };

    if (loanId) fetchRepayments();
  }, [loanId]);

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Repayment History</h2>
      {repayments.length === 0 ? (
        <p>No repayments found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Due Date</th>
              <th>Amount</th>
              <th>Amount Paid</th>
              <th>Status</th>
              <th>Paid At</th>
            </tr>
          </thead>
          <tbody>
            {repayments.map((repayment) => (
              <tr key={repayment.id}>
                <td>{new Date(repayment.dueDate).toLocaleDateString()}</td>
                <td>${Number(repayment.amount || 0).toFixed(2)}</td>
                <td>${Number(repayment.amountPaid || 0).toFixed(2)}</td>
                <td>{repayment.status}</td>
                <td>
                  {repayment.paidAt
                    ? new Date(repayment.paidAt).toLocaleDateString()
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default RepaymentTracker;

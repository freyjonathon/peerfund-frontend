// src/components/RepaymentTracker.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';


const RepaymentTracker = () => {
  const { loanId } = useParams();
  const [repayments, setRepayments] = useState([]);

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchRepayments = async () => {
      try {
        const res = await fetch(`/api/loans/${loanId}/repayments`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error('Failed to fetch repayments');

        const data = await res.json();
        setRepayments(data);
      } catch (err) {
        console.error('Error fetching repayments:', err);
      }
    };

    fetchRepayments();
  }, [loanId, token]);

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
                <td>${repayment.amount.toFixed(2)}</td>
                <td>${repayment.amountPaid.toFixed(2)}</td>
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

import React, { useState } from 'react';

const SubmitRepayment = ({ loanId, onRepaymentSubmitted }) => {
  const [form, setForm] = useState({ amount: '', dueDate: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      const res = await fetch(`/api/contracts/${loanId}/repayments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          amount: parseFloat(form.amount),
          dueDate: new Date(form.dueDate).toISOString(),
        }),
      });

      if (!res.ok) throw new Error('Failed to submit repayment');

      const data = await res.json();
      alert('Repayment logged!');
      setForm({ amount: '', dueDate: '' });
      if (onRepaymentSubmitted) onRepaymentSubmitted(data);
    } catch (err) {
      console.error(err);
      alert('Error submitting repayment');
    }
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      <h4>Log a Repayment</h4>
      <label>
        Amount ($): <br />
        <input
          type="number"
          name="amount"
          value={form.amount}
          onChange={handleChange}
          step="0.01"
        />
      </label>
      <br /><br />
      <label>
        Due Date: <br />
        <input
          type="date"
          name="dueDate"
          value={form.dueDate}
          onChange={handleChange}
        />
      </label>
      <br /><br />
      <button onClick={handleSubmit}>Submit Repayment</button>
    </div>
  );
};

export default SubmitRepayment;

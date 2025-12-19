import React, { useState } from 'react';

const SubmitLoanOffer = ({ loanId }) => {
  const [form, setForm] = useState({
    amount: '',
    duration: '',
    interestRate: '',
    message: ''
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`http://localhost:5050/api/offers/${loanId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(form)
      });

      const data = await res.json();
      if (res.ok) {
        alert('Offer submitted!');
        setForm({ amount: '', duration: '', interestRate: '', message: '' });
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('Submission failed.');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
      <h3>Submit Offer</h3>
      <input
        type="number"
        name="amount"
        placeholder="Amount"
        value={form.amount}
        onChange={handleChange}
        required
      /><br />
      <input
        type="number"
        name="duration"
        placeholder="Duration (months)"
        value={form.duration}
        onChange={handleChange}
        required
      /><br />
      <input
        type="number"
        name="interestRate"
        placeholder="Interest Rate %"
        value={form.interestRate}
        onChange={handleChange}
        required
      /><br />
      <textarea
        name="message"
        placeholder="Optional note to borrower"
        value={form.message}
        onChange={handleChange}
      /><br />
      <button type="submit">Send Offer</button>
    </form>
  );
};

export default SubmitLoanOffer;

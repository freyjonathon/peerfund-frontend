import React from 'react';

const ContractModal = ({ offer, borrower, onConfirm, onCancel }) => {
  if (!offer || !borrower) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '10%',
      left: '10%',
      width: '80%',
      backgroundColor: 'white',
      border: '2px solid black',
      padding: '2rem',
      zIndex: 1000
    }}>
      <h2>Loan Contract Agreement</h2>
      <p><strong>Borrower:</strong> {borrower.name}</p>
      <p><strong>Lender:</strong> {offer.lender?.name || 'Unknown'}</p>
      <p><strong>Amount:</strong> ${offer.amount}</p>
      <p><strong>Duration:</strong> {offer.duration} months</p>
      <p><strong>Interest Rate:</strong> {offer.interestRate}%</p>
      <p>This agreement is legally binding and outlines the repayment obligations.</p>

      <button onClick={onConfirm} style={{ marginRight: '1rem' }}>Sign & Finalize</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  );
};

export default ContractModal;

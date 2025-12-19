// NOT USED? 
// src/features/loans/LinkLoanBankButton.jsx
import React, { useState } from 'react';
import { useStripe } from '@stripe/react-stripe-js';

export default function LinkLoanBankButton({ onLinked }) {
  const stripe = useStripe();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const linkBankForLoan = async () => {
    try {
      setLoading(true);
      setError('');

      // Step 0️⃣: Ensure Stripe Customer exists (borrower identity)
      await fetch('/api/stripe/ensure-customer', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      // Step 1️⃣: Create SetupIntent specifically for loan ACH funding
      const res = await fetch('/api/stripe/create-bank-setup-intent', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!data.client_secret) throw new Error('Missing client secret from SetupIntent');

      // Step 2️⃣: Collect bank account using Financial Connections
      const result = await stripe.collectBankAccountForSetup({
        clientSecret: data.client_secret,
        params: { payment_method_type: 'us_bank_account' },
      });

      if (result.error) throw result.error;

      // Step 3️⃣: Confirm and attach to customer
      const confirmed = await stripe.confirmBankAccountSetup(data.client_secret);
      if (confirmed.error) throw confirmed.error;

      const paymentMethodId = confirmed?.setupIntent?.payment_method;
      if (!paymentMethodId) throw new Error('No paymentMethod returned from Stripe');

      // Step 4️⃣: Tell backend to save PM AS LOAN FUNDING PM (isForLoans=true)
      const saveRes = await fetch('/api/stripe/save-loan-payment-method', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId }),
      });

      const saveJson = await saveRes.json();
      if (!saveJson.success) throw new Error(saveJson.error || 'Failed to save loan PM');

      if (onLinked) onLinked(paymentMethodId);
      alert('✅ Bank linked for loan funding successfully!');
    } catch (err) {
      console.error('Loan bank linking error:', err);
      setError(err.message || 'Failed to link bank for loan funding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 10 }}>
      <button
        onClick={linkBankForLoan}
        disabled={loading || !stripe}
        style={{
          background: '#4f46e5',
          color: 'white',
          padding: '8px 12px',
          borderRadius: 6,
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Linking…' : 'Link Bank for Loan Funding'}
      </button>
      {error && (
        <div style={{ color: 'red', marginTop: 8 }}>
          {error}
        </div>
      )}
    </div>
  );
}

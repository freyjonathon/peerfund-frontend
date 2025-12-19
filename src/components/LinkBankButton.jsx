// src/components/LinkBankButton.jsx
import React, { useState } from 'react';
import { useStripe } from '@stripe/react-stripe-js';

export default function LinkBankButton({ onLinked }) {
  const stripe = useStripe();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const linkBank = async () => {
    try {
      setLoading(true);
      setError('');

      // 1️⃣ Create SetupIntent from backend
      const res = await fetch('/api/stripe/create-bank-setup-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (!data.client_secret) throw new Error('Missing client secret');

      // 2️⃣ Use Stripe Financial Connections modal
      const result = await stripe.collectBankAccountForSetup({
        clientSecret: data.client_secret,
        params: { payment_method_type: 'us_bank_account' },
      });

      if (result.error) throw result.error;

      // 3️⃣ Confirm the bank account setup
      const confirmed = await stripe.confirmBankAccountSetup(
        data.client_secret
      );

      if (confirmed.error) throw confirmed.error;

      // confirmed.setupIntent.payment_method → "pm_xxx"
      const paymentMethodId = confirmed?.setupIntent?.payment_method;

      if (!paymentMethodId) throw new Error('No payment method returned');

      // 4️⃣ Save the payment method in your DB
      await fetch('/api/payment-method/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ paymentMethodId }),
      });

      if (onLinked) onLinked(paymentMethodId);
      alert('✅ Bank account linked successfully!');
    } catch (err) {
      console.error('Bank linking error', err);
      setError(err.message || 'Failed to link bank');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={linkBank}
        disabled={loading || !stripe}
        style={{ padding: '8px 12px', background: '#0a66ff', color: 'white', borderRadius: '4px' }}
      >
        {loading ? 'Linking...' : 'Link Bank Account'}
      </button>
      {error && <p style={{ color: 'red', marginTop: '8px' }}>{error}</p>}
    </div>
  );
}

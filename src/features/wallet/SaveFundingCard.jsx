// src/features/wallet/SaveFundingCard.jsx
import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { apiFetch } from '../../utils/api';

export default function SaveFundingCard({ onSaved }) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);

  const handleSave = async () => {
    if (!stripe || !elements) return;

    try {
      setBusy(true);

      // 1) Ask backend for SetupIntent
      const setupData = await apiFetch('/api/billing/card/setup-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const clientSecret = setupData?.clientSecret;
      if (!clientSecret) {
        throw new Error('No clientSecret returned from server');
      }

      // 2) Confirm card setup with CardElement
      const card = elements.getElement(CardElement);
      if (!card) {
        throw new Error('Card input is not ready');
      }

      const { error, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card,
        },
      });

      if (error) throw error;

      const pmId = setupIntent?.payment_method;
      if (!pmId) {
        throw new Error('No payment method returned from Stripe');
      }

      // 3) Tell backend which payment_method to store
      await apiFetch('/api/billing/card/set-funding-method', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentMethodId: pmId }),
      });

      alert('Funding card saved!');
      onSaved?.();
    } catch (e) {
      console.error('SaveFundingCard error:', e);
      alert(e?.message || 'Failed to save card');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <h3>Funding card</h3>
      <p style={{ fontSize: 14, color: '#4b5563' }}>
        This card will be used for deposits, repayments, and SuperUser fees.
      </p>

      <div
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          padding: 10,
          margin: '8px 0 12px',
          background: '#fff',
        }}
      >
        <CardElement options={{ hidePostalCode: false }} />
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={busy || !stripe || !elements}
        style={{
          background: '#4f46e5',
          border: '1px solid #4f46e5',
          color: '#fff',
          fontWeight: 600,
          padding: '8px 14px',
          borderRadius: 999,
          cursor: busy ? 'not-allowed' : 'pointer',
        }}
      >
        {busy ? 'Saving…' : 'Save funding card'}
      </button>
    </div>
  );
}
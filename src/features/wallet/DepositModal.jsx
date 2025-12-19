import React, { useMemo, useState } from 'react';
import { createDepositIntent, devConfirmDeposit } from './walletApi';

// Stripe libs (safe to import; we only initialize if a key exists)
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

// CRA/Webpack-style env var
const PUBLISHABLE_KEY = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '';

// Lazy-initialize Stripe only if a key is provided
let stripePromise = null;
function ensureStripe() {
  if (!PUBLISHABLE_KEY) return null;
  if (!stripePromise) stripePromise = loadStripe(PUBLISHABLE_KEY);
  return stripePromise;
}

export default function DepositModal({ onClose, onDeposited }) {
  const [amount, setAmount] = useState('25.00');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [clientSecret, setClientSecret] = useState(null); // when present -> show Stripe step

  const onContinue = async () => {
    setError('');

    const num = Number(String(amount).replace(/[$,\s]/g, ''));
    if (!Number.isFinite(num) || num <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    setBusy(true);
    try {
      const resp = await createDepositIntent(num);

      if (resp && resp.clientSecret) {
        // Stripe path
        setClientSecret(resp.clientSecret);
      } else if (resp && resp.simulated && resp.ledgerId) {
        // Simulated path (no Stripe configured on backend)
        await devConfirmDeposit(resp.ledgerId);
        if (typeof onDeposited === 'function') onDeposited(true);
        if (typeof onClose === 'function') onClose();
      } else {
        setError('Unexpected response from server.');
      }
    } catch (e) {
      setError(e.message || 'Could not create deposit.');
    } finally {
      setBusy(false);
    }
  };

  const stripe = ensureStripe();
  const hasStripeKey = Boolean(PUBLISHABLE_KEY);
  const stripeOptions = useMemo(
    () => (clientSecret ? { clientSecret, appearance: { theme: 'stripe' } } : undefined),
    [clientSecret]
  );

  return (
    <div className="modal">
      <div className="modal-header">
        <h3>Deposit to PeerFund Balance</h3>
        <button className="icon-btn" onClick={onClose} aria-label="Close">×</button>
      </div>

      {!clientSecret ? (
        <>
          {error && <div className="form-error">{error}</div>}

          <label className="label">Amount</label>
          <div className="input-prefix">
            <span>$</span>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              placeholder="25.00"
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} disabled={busy}>Cancel</button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={onContinue}
              disabled={busy}
            >
              {busy ? 'Processing...' : 'Continue'}
            </button>
          </div>
        </>
      ) : hasStripeKey && stripe ? (
        <Elements stripe={stripe} options={stripeOptions}>
          <StripePaymentStep onClose={onClose} onDeposited={onDeposited} />
        </Elements>
      ) : (
        <>
          <div className="form-error">
            Stripe publishable key is not configured on the frontend.
            Set <code>REACT_APP_STRIPE_PUBLISHABLE_KEY</code> in your <code>.env</code>.
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose}>Close</button>
          </div>
        </>
      )}
    </div>
  );
}

function StripePaymentStep({ onClose, onDeposited }) {
  const stripe = useStripe();
  const elements = useElements();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const confirm = async () => {
    setError('');
    if (!stripe || !elements) return;

    setBusy(true);
    try {
      const { error: payErr } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });
      if (payErr) {
        setError(payErr.message || 'Payment failed');
      } else {
        if (typeof onDeposited === 'function') onDeposited(true);
        if (typeof onClose === 'function') onClose();
      }
    } catch (e) {
      setError(e.message || 'Payment failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div style={{ marginBottom: 12 }}>
        <PaymentElement />
      </div>
      {error && <div className="form-error">{error}</div>}
      <div className="modal-actions">
        <button type="button" onClick={onClose} disabled={busy}>Cancel</button>
        <button
          type="button"
          className="btn btn--primary"
          onClick={confirm}
          disabled={busy || !stripe || !elements}
        >
          {busy ? 'Processing…' : 'Pay'}
        </button>
      </div>
    </>
  );
}

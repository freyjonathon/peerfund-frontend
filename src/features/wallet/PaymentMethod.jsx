// src/features/wallet/PaymentMethod.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe } from '@stripe/react-stripe-js';
import { apiFetch } from '../../utils/api';

/* ---------------- Stripe publishable key ---------------- */
const rawPk = (process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '').trim();
const pk = /^pk_(test|live)_[A-Za-z0-9_]+$/.test(rawPk) ? rawPk : '';

/* ---------------- Stripe init (cached) ---------------- */
let cachedStripePromise;
function getStripePromise() {
  if (!pk) return null;
  if (!cachedStripePromise) cachedStripePromise = loadStripe(pk);
  return cachedStripePromise;
}

/* ================================================================== */
/*                     One-card Bank Setup / Management                */
/* ================================================================== */

export default function PaymentMethodPage() {
  const [clientSecret, setClientSecret] = useState(null);

  // current primary method (default or first)
  const [currentPM, setCurrentPM] = useState(null);

  // UI state
  const [linking, setLinking] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(true);

  // Prefilled identity for first-time link
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  const stripePromise = useMemo(getStripePromise, []);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErrorMsg('');

        // Prefill name/email (uses apiFetch so it hits backend base URL)
        try {
          const u = await apiFetch('/api/users/profile');
          if (!alive) return;
          if (u?.name) setFullName(u.name);
          if (u?.email) setEmail(u.email);
        } catch (e) {
          // non-fatal
          console.warn('PaymentMethod: profile prefill failed:', e?.message || e);
        }

        await refreshPrimary();
      } catch (e) {
        console.error('PaymentMethod init error:', e);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshPrimary() {
    try {
      const d = await apiFetch('/api/payment-method/mine');
      const list = Array.isArray(d?.items) ? d.items : [];
      const primary = list.find((x) => x.isDefault) || list[0] || null;
      setCurrentPM(primary);
    } catch (e) {
      // if 404/empty, treat as no PM
      setCurrentPM(null);
    }
  }

  async function startBankLink() {
    setLinking(true);
    setErrorMsg('');

    try {
      // IMPORTANT: use apiFetch so this goes to backend, not Vercel
      const data = await apiFetch('/api/stripe/create-bank-setup-intent', {
        method: 'POST',
      });

      const client_secret = data?.client_secret || data?.clientSecret || null;
      if (!client_secret) throw new Error('No client_secret returned from server.');

      setClientSecret(client_secret);
    } catch (e) {
      const msg = e?.message || 'Failed to create SetupIntent.';
      setErrorMsg(msg);
    } finally {
      setLinking(false);
    }
  }

  const hasPM = !!currentPM;
  const stripeReady = !!pk && !!stripePromise;
  const disabledBtn = linking || !stripeReady || (!hasPM && !fullName);

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>Payment Method</h2>

      {!pk && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#7f1d1d',
            padding: '10px 12px',
            borderRadius: 8,
            marginBottom: 12,
          }}
        >
          Missing Stripe publishable key. Add{' '}
          <code>REACT_APP_STRIPE_PUBLISHABLE_KEY</code> to your frontend env.
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            background: '#fff7ed',
            border: '1px solid #fed7aa',
            color: '#7c2d12',
            padding: '10px 12px',
            borderRadius: 8,
            marginBottom: 12,
          }}
        >
          {errorMsg}
        </div>
      )}

      <section
        style={{
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          background: '#fff',
          padding: 14,
          opacity: loading ? 0.7 : 1,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>
              {hasPM ? currentPM?.brand || 'Bank account' : 'No bank account on file'}
            </div>
            <div style={{ fontSize: 13, color: '#475569', marginBottom: 6 }}>
              {hasPM
                ? currentPM?.last4
                  ? `•••• ${currentPM.last4}`
                  : '—'
                : 'Link your bank to send and receive money on PeerFund.'}
            </div>
            {hasPM && (
              <small style={{ color: '#64748b' }}>
                Used for <strong>both</strong> funding and payouts. Updating replaces your current
                bank.
              </small>
            )}
          </div>

          <button
            onClick={startBankLink}
            disabled={disabledBtn}
            style={{
              background: '#4f46e5',
              color: '#fff',
              border: '1px solid #4f46e5',
              padding: '10px 14px',
              borderRadius: 10,
              fontWeight: 800,
              cursor: disabledBtn ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {hasPM
              ? linking
                ? 'Starting…'
                : 'Update bank account'
              : linking
              ? 'Starting…'
              : 'Link bank account'}
          </button>
        </div>

        {/* First-time: show identity fields below the button */}
        {!hasPM && (
          <div
            style={{
              display: 'grid',
              gap: 8,
              marginTop: 12,
              background: '#fafafa',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              padding: 10,
            }}
          >
            <div style={{ fontSize: 14, color: '#6b7280' }}>Account holder</div>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Account holder full name"
              style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 8 }}
            />

            <small style={{ color: '#6b7280' }}>
              We pass this to Stripe only to label your bank method.
            </small>
          </div>
        )}
      </section>

      {/* Stripe bank link + SAVE to backend */}
      {clientSecret && stripePromise && (
        <Elements stripe={stripePromise}>
          <BankLinkFlow
            clientSecret={clientSecret}
            fullName={fullName}
            email={email}
            onSaved={async () => {
              setClientSecret(null);
              await refreshPrimary();
            }}
            onError={(msg) => {
              setClientSecret(null);
              setErrorMsg(msg);
            }}
          />
        </Elements>
      )}
    </div>
  );
}

/* ---------------- Flow: collect + confirm + SAVE (auto-run) ---------------- */
function BankLinkFlow({ clientSecret, fullName, email, onSaved, onError }) {
  const stripe = useStripe();
  const [working, setWorking] = useState(true);
  const startedRef = useRef(false);

  async function saveToBackend(paymentMethodId) {
    // IMPORTANT: use apiFetch so it hits backend base URL
    await apiFetch('/api/payment-method/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentMethodId,
        makeDefault: true,
        useForLoans: true,
      }),
    });
  }

  useEffect(() => {
    if (!stripe || !clientSecret || startedRef.current) return;

    if (!fullName) {
      onError?.('Please enter the account holder’s full name.');
      return;
    }

    startedRef.current = true;

    (async () => {
      try {
        // 1) Open Financial Connections
        const { error: collectError } = await stripe.collectBankAccountForSetup({
          clientSecret,
          params: {
            payment_method_type: 'us_bank_account',
            payment_method_data: {
              billing_details: { name: fullName, ...(email ? { email } : {}) },
            },
          },
        });
        if (collectError) throw collectError;

        // 2) Confirm SetupIntent
        const { setupIntent, error: confirmError } =
          await stripe.confirmUsBankAccountSetup(clientSecret);
        if (confirmError) throw confirmError;

        const pmId = setupIntent?.payment_method;
        if (!pmId) throw new Error('Missing payment method id from Stripe.');

        // 3) Persist
        await saveToBackend(pmId);

        onSaved?.();
      } catch (e) {
        onError?.(e?.message || 'Failed to link bank account.');
      } finally {
        setWorking(false);
      }
    })();
  }, [stripe, clientSecret, fullName, email, onSaved, onError]);

  return (
    <div
      style={{
        marginTop: 12,
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        padding: '10px 12px',
        fontSize: 14,
        color: '#334155',
      }}
    >
      {working ? 'Opening secure bank link…' : 'Done.'}
    </div>
  );
}

BankLinkFlow.propTypes = {
  clientSecret: PropTypes.string.isRequired,
  fullName: PropTypes.string.isRequired,
  email: PropTypes.string,
  onSaved: PropTypes.func,
  onError: PropTypes.func,
};

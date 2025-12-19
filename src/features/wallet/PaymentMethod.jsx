// src/features/wallet/PaymentMethod.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe } from '@stripe/react-stripe-js';

/* ---------------- Stripe publishable key ---------------- */
const rawPk = (process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '').trim();
const pk = /^pk_(test|live)_[A-Za-z0-9_]+$/.test(rawPk) ? rawPk : '';

/* ---------------- Auth header helpers ---------------- */
function getToken() {
  let t = localStorage.getItem('token') || '';
  t = t.replace(/^"|"$/g, '');
  if (t.toLowerCase().startsWith('bearer ')) t = t.slice(7);
  return t || null;
}
function authHeaders() {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

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

  const stripePromise = useMemo(getStripePromise, [pk]);

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        // Prefill name/email
        try {
          const r = await fetch('/api/users/profile', {
            headers: { ...authHeaders() },
            signal: ac.signal,
          });
          if (r.ok) {
            const u = await r.json();
            if (u?.name) setFullName(u.name);
            if (u?.email) setEmail(u.email);
          }
        } catch {
          /* noop */
        }

        await refreshPrimary(ac.signal);
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshPrimary(signal) {
    try {
      const r = await fetch('/api/payment-method/mine', {
        headers: { ...authHeaders() },
        signal,
      });
      if (!r.ok) {
        setCurrentPM(null);
        return;
      }
      const d = await r.json();
      const list = Array.isArray(d?.items) ? d.items : [];
      const primary = list.find((x) => x.isDefault) || list[0] || null;
      setCurrentPM(primary);
    } catch {
      setCurrentPM(null);
    }
  }

  async function startBankLink() {
    setLinking(true);
    setErrorMsg('');
    try {
      const r = await fetch('/api/stripe/create-bank-setup-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
      });
      if (r.status === 401) {
        setErrorMsg('Your session expired. Please log in again, then return here.');
        return;
      }
      if (!r.ok) throw new Error((await r.text()) || 'Failed to create SetupIntent.');
      const { client_secret } = await r.json();
      if (!client_secret) throw new Error('No client_secret returned from server.');
      setClientSecret(client_secret);
    } catch (e) {
      setErrorMsg(e.message || 'Could not start bank link.');
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
          <code>REACT_APP_STRIPE_PUBLISHABLE_KEY</code> to your <code>.env</code>.
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
            {hasPM ? (linking ? 'Starting…' : 'Update bank account') : linking ? 'Starting…' : 'Link bank account'}
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

      {/* Stripe bank link + SAVE to backend (makes it Default + Payout) */}
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
              setClientSecret(null); // hide the flow if user cancels/errors
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
    const r = await fetch('/api/payment-method/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({
        paymentMethodId,
        makeDefault: true,
        useForLoans: true,
      }),
    });
    if (!r.ok) {
      const t = await r.text().catch(() => '');
      throw new Error(t || 'Failed to save payment method to your PeerFund account.');
    }
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
        // 1) Open Financial Connections immediately
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

        // 2) Confirm the SetupIntent
        const { setupIntent, error: confirmError } =
          await stripe.confirmUsBankAccountSetup(clientSecret);
        if (confirmError) throw confirmError;

        const pmId = setupIntent?.payment_method;
        if (!pmId) throw new Error('Missing payment method id from Stripe.');

        // 3) Persist as default + payout
        await saveToBackend(pmId);

        // 4) Finish quietly; parent will refresh and show last4
        onSaved?.();
      } catch (e) {
        onError?.(e?.message || 'Failed to link bank account.');
      } finally {
        setWorking(false);
      }
    })();
  }, [stripe, clientSecret, fullName, email, onSaved, onError]);

  // Minimal inline “working” hint while the Stripe modal opens/finishes.
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

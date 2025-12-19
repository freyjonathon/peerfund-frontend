// src/features/wallet/ConnectPayoutsCard.jsx
import { useEffect, useState } from 'react';

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

export default function ConnectPayoutsCard() {
  const [loading, setLoading] = useState(true);
  const [ensuring, setEnsuring] = useState(false);
  const [onboarding, setOnboarding] = useState(false);
  const [error, setError] = useState('');

  const [hasAccount, setHasAccount] = useState(false);
  const [detailsSubmitted, setDetailsSubmitted] = useState(false);
  const [payoutsEnabled, setPayoutsEnabled] = useState(false);
  const [requirementsDue, setRequirementsDue] = useState([]);

  async function loadStatus() {
    setLoading(true);
    setError('');
    try {
      const r = await fetch('/api/stripe/connect-account', { headers: { ...authHeaders() } });
      if (!r.ok) throw new Error(await r.text());
      const d = await r.json();
      setHasAccount(!!d.hasAccount);
      setDetailsSubmitted(!!d.details_submitted);
      setPayoutsEnabled(!!d.payouts_enabled);
      setRequirementsDue(d.requirements_due || []);
    } catch (e) {
      setError(e?.message || 'Failed to load Connect account status.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadStatus(); }, []);

  async function ensureAccount() {
    setEnsuring(true);
    setError('');
    try {
      const r = await fetch('/api/stripe/ensure-connect-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
      });
      if (!r.ok) throw new Error(await r.text());
      await loadStatus();
    } catch (e) {
      setError(e?.message || 'Could not create Connect account.');
    } finally {
      setEnsuring(false);
    }
  }

  async function startOnboarding() {
    setOnboarding(true);
    setError('');
    try {
      // Ensure an account first (idempotent on server)
      await ensureAccount();
      const r = await fetch('/api/stripe/connect-onboarding-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
      });
      if (!r.ok) throw new Error(await r.text());
      const { url } = await r.json();
      if (url) window.location.href = url;
    } catch (e) {
      setError(e?.message || 'Could not start onboarding.');
      setOnboarding(false);
    }
  }

  const badge = (text, tone) => (
    <span style={{
      display: 'inline-block',
      borderRadius: 999,
      padding: '2px 8px',
      fontSize: 12,
      fontWeight: 700,
      border: '1px solid',
      ...(tone === 'ok'
        ? { background: '#dcfce7', color: '#166534', borderColor: '#86efac' }
        : tone === 'warn'
        ? { background: '#fef3c7', color: '#92400e', borderColor: '#fde68a' }
        : { background: '#e2e8f0', color: '#334155', borderColor: '#cbd5e1' }),
    }}>
      {text}
    </span>
  );

  return (
    <div style={{
      marginBottom: 16,
      padding: 12,
      border: '1px solid #e2e8f0',
      borderRadius: 10,
      background: '#ffffff',
    }}>
      <h3 style={{ margin: '0 0 6px' }}>Get Paid (Lender Payouts)</h3>
      <p style={{ margin: '0 0 10px', color: '#475569' }}>
        Enable payouts to your bank with Stripe Connect (required for lenders).
      </p>

      {error && (
        <div style={{
          background: '#fff7ed',
          border: '1px solid #fed7aa',
          color: '#7c2d12',
          padding: '10px 12px',
          borderRadius: 8,
          marginBottom: 10,
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <p>Checking Connect status…</p>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <div>Status:</div>
            {hasAccount ? badge('Account created', 'ok') : badge('No account', 'warn')}
            {detailsSubmitted ? badge('Onboarding complete', 'ok') : badge('Onboarding needed', 'warn')}
            {payoutsEnabled ? badge('Payouts enabled', 'ok') : badge('Payouts disabled', 'warn')}
          </div>

          {requirementsDue?.length > 0 && (
            <div style={{
              background: '#fef3c7',
              border: '1px solid #fde68a',
              color: '#7c2d12',
              padding: '8px 10px',
              borderRadius: 8,
              marginBottom: 10,
              fontSize: 14
            }}>
              Additional info required: {requirementsDue.join(', ')}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            {!hasAccount && (
              <button
                onClick={ensureAccount}
                disabled={ensuring || onboarding}
                style={{
                  background: '#0ea5e9',
                  border: '1px solid #0ea5e9',
                  color: '#fff',
                  padding: '8px 12px',
                  borderRadius: 8,
                  cursor: ensuring ? 'not-allowed' : 'pointer',
                }}
              >
                {ensuring ? 'Creating…' : 'Create Connect Account'}
              </button>
            )}

            {!detailsSubmitted && (
              <button
                onClick={startOnboarding}
                disabled={onboarding}
                style={{
                  background: '#4f46e5',
                  border: '1px solid #4f46e5',
                  color: '#fff',
                  padding: '8px 12px',
                  borderRadius: 8,
                  cursor: onboarding ? 'not-allowed' : 'pointer',
                }}
              >
                {onboarding ? 'Opening…' : 'Start Onboarding'}
              </button>
            )}

            <button
              onClick={loadStatus}
              disabled={loading || onboarding || ensuring}
              style={{
                background: '#e2e8f0',
                border: '1px solid #cbd5e1',
                color: '#334155',
                padding: '8px 12px',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              Refresh
            </button>
          </div>
        </>
      )}
    </div>
  );
}

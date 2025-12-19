// src/features/loans/LoanFundingPanel.jsx
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

/* ------------ auth helpers (same pattern as other screens) ------------ */
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

/**
 * LoanFundingPanel
 *
 * Lets the lender fund a specific loan *from their wallet balance*.
 * - Shows wallet balance + loan amount
 * - Calls POST /api/loans/:loanId/fund
 * - If balance is too low, calls onNeedMoreFunds() so parent can open WalletPanel
 */
export default function LoanFundingPanel({
  loan,
  walletAvailableCents,
  onWalletSynced,
  onNeedMoreFunds,
  onFunded,
}) {
  const [availableCents, setAvailableCents] = useState(
    typeof walletAvailableCents === 'number' ? walletAvailableCents : null
  );
  const [loading, setLoading] = useState(!walletAvailableCents);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const principalCents =
    typeof loan.principalCents === 'number' && loan.principalCents > 0
      ? loan.principalCents
      : Math.round((loan.amount || 0) * 100);

  const loanAmountDollars = (principalCents / 100).toFixed(2);
  const availDollars =
    typeof availableCents === 'number' ? (availableCents / 100).toFixed(2) : null;

  const hasEnough =
    typeof availableCents === 'number' && availableCents >= principalCents;

  /* ----------------------------- load wallet ---------------------------- */
  useEffect(() => {
    if (typeof walletAvailableCents === 'number') return; // parent already synced
    let cancelled = false;

    async function loadWallet() {
      setLoading(true);
      setErrorMsg('');
      try {
        const res = await fetch('/api/wallet/me', {
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
        });
        if (!res.ok) {
          throw new Error((await res.text()) || 'Failed to load wallet.');
        }
        const data = await res.json();
        const cents =
          typeof data.availableCents === 'number'
            ? data.availableCents
            : Math.round((data.available || 0) * 100);

        if (!cancelled) {
          setAvailableCents(cents);
          onWalletSynced?.(cents);
        }
      } catch (e) {
        if (!cancelled) {
          setErrorMsg(e.message || 'Could not load wallet balance.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadWallet();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------------------------- fund from wallet -------------------------- */
  async function handleFund() {
    setErrorMsg('');
    setSuccessMsg('');

    if (!hasEnough) {
      onNeedMoreFunds?.();
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`/api/loans/${loan.id}/fund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || 'Failed to fund loan.');
      }

      const payload = await res.json().catch(() => ({}));
      setSuccessMsg('Loan funded successfully from your PeerFund balance.');

      // re-sync wallet after funding
      try {
        const wRes = await fetch('/api/wallet/me', {
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
        });
        if (wRes.ok) {
          const wData = await wRes.json();
          const cents =
            typeof wData.availableCents === 'number'
              ? wData.availableCents
              : Math.round((wData.available || 0) * 100);
          setAvailableCents(cents);
          onWalletSynced?.(cents);
        }
      } catch {
        // soft-fail; not critical
      }

      onFunded?.(payload.loan || loan);
    } catch (e) {
      setErrorMsg(e.message || 'Could not fund loan.');
    } finally {
      setBusy(false);
    }
  }

  /* --------------------------------- UI -------------------------------- */
  return (
    <section
      style={{
        marginTop: 16,
        padding: 16,
        borderRadius: 12,
        border: '1px solid #e2e8f0',
        background: '#ffffff',
        maxWidth: 520,
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: 8 }}>Fund this Loan</h3>

      <p style={{ margin: '4px 0', color: '#475569', fontSize: 14 }}>
        Loan amount:{' '}
        <strong>${loanAmountDollars}</strong>
      </p>

      <p style={{ margin: '4px 0 12px', color: '#475569', fontSize: 14 }}>
        Your PeerFund balance:{' '}
        {loading ? (
          <span>Loading…</span>
        ) : (
          <strong>${availDollars ?? '0.00'}</strong>
        )}
      </p>

      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
        <button
          type="button"
          onClick={handleFund}
          disabled={busy || loading}
          style={{
            background: hasEnough ? '#4f46e5' : '#9ca3af',
            color: '#fff',
            border: '1px solid transparent',
            padding: '8px 14px',
            borderRadius: 8,
            fontWeight: 600,
            cursor: busy || loading ? 'not-allowed' : 'pointer',
            fontSize: 14,
          }}
        >
          {busy ? 'Funding…' : hasEnough ? 'Fund from wallet' : 'Fund from wallet (add funds)'}
        </button>

        <button
          type="button"
          onClick={() => onNeedMoreFunds?.()}
          style={{
            background: '#ffffff',
            color: '#4b5563',
            border: '1px solid #d1d5db',
            padding: '8px 14px',
            borderRadius: 8,
            fontWeight: 500,
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          Add funds / update bank
        </button>
      </div>

      {errorMsg && (
        <div
          style={{
            marginTop: 10,
            fontSize: 13,
            color: '#b91c1c',
            background: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: 6,
            padding: '6px 8px',
          }}
        >
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div
          style={{
            marginTop: 10,
            fontSize: 13,
            color: '#166534',
            background: '#dcfce7',
            border: '1px solid #bbf7d0',
            borderRadius: 6,
            padding: '6px 8px',
          }}
        >
          {successMsg}
        </div>
      )}
    </section>
  );
}

LoanFundingPanel.propTypes = {
  loan: PropTypes.shape({
    id: PropTypes.string.isRequired,
    principalCents: PropTypes.number,
    amount: PropTypes.number,
  }).isRequired,
  walletAvailableCents: PropTypes.number,
  onWalletSynced: PropTypes.func,
  onNeedMoreFunds: PropTypes.func,
  onFunded: PropTypes.func,
};

// src/features/wallet/WalletPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import WalletPanel from './WalletPanel';
import {
  fetchWallet,
  withdrawFromWallet,
  createConnectOnboardingLink,
  fetchConnectAccountStatus,
} from './walletApi';
import SaveFundingCard from './SaveFundingCard';

/**
 * Withdraw modal.
 * Backend route: POST /api/wallet/withdraw
 * Body: { amountDollars }
 *
 * Real withdrawal flow:
 * - Requires Stripe Connect payout setup
 * - Transfers funds to connected account
 * - Debits PeerFund wallet
 */
function WithdrawPanel({ onClose, onBalanceUpdated, maxDollars }) {
  const [amount, setAmount] = useState('25.00');
  const [busy, setBusy] = useState(false);
  const [setupBusy, setSetupBusy] = useState(false);
  const [error, setError] = useState('');
  const [connectStatus, setConnectStatus] = useState(null);

  const { clamped, exceedsBalance, canSubmit } = useMemo(() => {
    const raw = (amount || '').replace(/[^0-9.]/g, '');
    const numeric = Number(raw || 0);
    const clampedVal = Number.isFinite(numeric) && numeric > 0 ? numeric : 0;

    const exceeds =
      typeof maxDollars === 'number' && clampedVal > maxDollars + 1e-6;

    const can = !busy && !setupBusy && clampedVal > 0 && !exceeds;

    return { clamped: clampedVal, exceedsBalance: exceeds, canSubmit: can };
  }, [amount, busy, setupBusy, maxDollars]);

  async function loadConnectStatus() {
    try {
      const status = await fetchConnectAccountStatus();
      setConnectStatus(status || null);
    } catch (e) {
      // Non-fatal. Withdraw request will still return exact setup error if needed.
      console.warn('Could not load Connect status:', e);
    }
  }

  useEffect(() => {
    loadConnectStatus();
  }, []);

  async function startPayoutSetup() {
    try {
      setSetupBusy(true);
      setError('');

      const data = await createConnectOnboardingLink();

      if (!data?.url) {
        throw new Error('Could not create Stripe payout setup link.');
      }

      window.location.assign(data.url);
    } catch (e) {
      console.error('Payout setup failed:', e);
      setError(e?.message || 'Could not start payout setup.');
    } finally {
      setSetupBusy(false);
    }
  }

  function needsPayoutSetupFromError(message = '') {
    const m = String(message).toLowerCase();
    return (
      m.includes('connect') ||
      m.includes('payout') ||
      m.includes('onboarding') ||
      m.includes('payout account') ||
      m.includes('stripe payout')
    );
  }

  async function withdraw() {
    if (!canSubmit) return;

    try {
      setBusy(true);
      setError('');

      await withdrawFromWallet({ amountDollars: clamped });

      await onBalanceUpdated?.();
    } catch (e) {
      console.error('Withdraw failed:', e);

      const msg = e?.message || 'Failed to withdraw funds';
      setError(msg);

      if (needsPayoutSetupFromError(msg)) {
        await loadConnectStatus();
      }
    } finally {
      setBusy(false);
    }
  }

  const hasConnectAccount = !!connectStatus?.hasAccount;
  const payoutsEnabled = !!connectStatus?.payouts_enabled;
  const detailsSubmitted = !!connectStatus?.details_submitted;

  const showSetupHint =
    connectStatus &&
    (!hasConnectAccount || !detailsSubmitted || !payoutsEnabled);

  return (
    <div className="withdraw-panel">
      <h3>Withdraw funds</h3>

      {typeof maxDollars === 'number' && (
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
          Available to withdraw: <strong>${maxDollars.toFixed(2)}</strong>
        </p>
      )}

      <p style={{ fontSize: 13, color: '#6b7280', marginTop: 8 }}>
        Withdrawals are sent to your Stripe payout account. You may need to complete payout setup
        before your first withdrawal.
      </p>

      {showSetupHint && (
        <div
          style={{
            marginTop: 10,
            background: '#fffbeb',
            border: '1px solid #fde68a',
            color: '#92400e',
            borderRadius: 8,
            padding: '8px 10px',
            fontSize: 13,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 4 }}>
            Payout setup required
          </div>
          <div>
            Complete Stripe payout onboarding before withdrawing funds from your PeerFund wallet.
          </div>
          <button
            type="button"
            onClick={startPayoutSetup}
            disabled={setupBusy}
            style={{
              marginTop: 8,
              padding: '7px 12px',
              borderRadius: 999,
              border: '1px solid #92400e',
              background: '#92400e',
              color: '#fff',
              fontWeight: 700,
              cursor: setupBusy ? 'not-allowed' : 'pointer',
            }}
          >
            {setupBusy ? 'Opening…' : 'Set up payouts'}
          </button>
        </div>
      )}

      {error && (
        <div
          style={{
            marginTop: 8,
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#7f1d1d',
            borderRadius: 8,
            padding: '8px 10px',
          }}
        >
          <div>{error}</div>

          {needsPayoutSetupFromError(error) && (
            <button
              type="button"
              onClick={startPayoutSetup}
              disabled={setupBusy}
              style={{
                marginTop: 8,
                padding: '7px 12px',
                borderRadius: 999,
                border: '1px solid #7f1d1d',
                background: '#7f1d1d',
                color: '#fff',
                fontWeight: 700,
                cursor: setupBusy ? 'not-allowed' : 'pointer',
              }}
            >
              {setupBusy ? 'Opening…' : 'Set up payouts'}
            </button>
          )}
        </div>
      )}

      <div className="row" style={{ marginTop: 12 }}>
        <label>Amount</label>

        <div className="input-wrap" style={{ display: 'flex', gap: 4 }}>
          <span
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              background: '#f9fafb',
              fontSize: 14,
            }}
          >
            $
          </span>

          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            placeholder="25.00"
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
            }}
          />
        </div>

        {exceedsBalance && (
          <div style={{ marginTop: 6, fontSize: 12, color: '#b91c1c' }}>
            Amount exceeds your available balance.
          </div>
        )}
      </div>

      <div className="row right" style={{ marginTop: 16, textAlign: 'right' }}>
        <button
          className="btn"
          onClick={onClose}
          disabled={busy || setupBusy}
          style={{ marginRight: 8 }}
        >
          Cancel
        </button>

        <button
          className="btn primary"
          onClick={withdraw}
          disabled={!canSubmit}
          style={{
            padding: '8px 14px',
            borderRadius: 999,
            border: '1px solid #4f46e5',
            background: canSubmit ? '#4f46e5' : '#9ca3af',
            color: '#fff',
            fontWeight: 700,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
          }}
        >
          {busy ? 'Processing…' : 'Withdraw'}
        </button>
      </div>
    </div>
  );
}

export default function WalletPage() {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showDepositPanel, setShowDepositPanel] = useState(false);
  const [showWithdrawPanel, setShowWithdrawPanel] = useState(false);

  const [error, setError] = useState('');

  async function loadWallet() {
    try {
      setError('');
      const w = await fetchWallet();
      setWallet(w || null);
    } catch (e) {
      console.error('loadWallet error', e);
      setWallet(null);
      setError(e?.message || 'Failed to load wallet.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      await loadWallet();
      if (cancelled) return;
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const availableCents = wallet?.availableCents ?? 0;
  const pendingCents = wallet?.pendingCents ?? 0;

  const availableFloat = availableCents / 100;
  const availableDollars = (availableCents / 100).toFixed(2);
  const pendingDollars = (pendingCents / 100).toFixed(2);

  const anyModalOpen = showDepositPanel || showWithdrawPanel;

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Wallet</h2>

      {error && (
        <div
          style={{
            marginTop: 8,
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#7f1d1d',
            borderRadius: 8,
            padding: '8px 10px',
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <p>Loading wallet…</p>
      ) : (
        <>
          {/* Balance card */}
          <div
            style={{
              marginTop: 12,
              padding: '12px 14px',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
              maxWidth: 420,
            }}
          >
            <div style={{ fontSize: 14, color: '#64748b', marginBottom: 4 }}>
              PeerFund balance
            </div>

            <div style={{ fontSize: 24, fontWeight: 700 }}>
              ${availableDollars}
            </div>

            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
              Pending: ${pendingDollars}
            </div>

            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <button
                style={{
                  flex: 1,
                  padding: '8px 14px',
                  borderRadius: 999,
                  border: '1px solid #4f46e5',
                  background: '#4f46e5',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
                onClick={() => setShowDepositPanel(true)}
              >
                Add funds
              </button>

              <button
                style={{
                  flex: 1,
                  padding: '8px 14px',
                  borderRadius: 999,
                  border: '1px solid #0f172a',
                  background: '#0f172a',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: availableFloat > 0 ? 'pointer' : 'not-allowed',
                  opacity: availableFloat > 0 ? 1 : 0.6,
                }}
                disabled={availableFloat <= 0}
                onClick={() => setShowWithdrawPanel(true)}
              >
                Withdraw
              </button>
            </div>
          </div>

          {/* Funding card section – only show when no modal is open */}
          {!anyModalOpen && (
            <div
              style={{
                marginTop: 20,
                padding: '12px 14px',
                borderRadius: 12,
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                maxWidth: 420,
              }}
            >
              <div style={{ fontSize: 14, color: '#64748b', marginBottom: 8 }}>
                Funding card
              </div>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>
                This card is used when you deposit to your PeerFund wallet, repay
                loans, or pay the SuperUser fee.
              </p>

              <SaveFundingCard />
            </div>
          )}

          {/* Add-funds modal */}
          {showDepositPanel && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(15,23,42,0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 50,
              }}
              onClick={() => setShowDepositPanel(false)}
            >
              <div
                style={{
                  background: '#fff',
                  borderRadius: 16,
                  padding: 20,
                  minWidth: 320,
                  maxWidth: 420,
                  boxShadow: '0 20px 40px rgba(15,23,42,0.25)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <WalletPanel
                  onClose={() => setShowDepositPanel(false)}
                  onBalanceUpdated={async () => {
                    setShowDepositPanel(false);
                    setLoading(true);
                    await loadWallet();
                  }}
                />
              </div>
            </div>
          )}

          {/* Withdraw modal */}
          {showWithdrawPanel && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(15,23,42,0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 50,
              }}
              onClick={() => setShowWithdrawPanel(false)}
            >
              <div
                style={{
                  background: '#fff',
                  borderRadius: 16,
                  padding: 20,
                  minWidth: 320,
                  maxWidth: 420,
                  boxShadow: '0 20px 40px rgba(15,23,42,0.25)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <WithdrawPanel
                  maxDollars={availableFloat}
                  onClose={() => setShowWithdrawPanel(false)}
                  onBalanceUpdated={async () => {
                    setShowWithdrawPanel(false);
                    setLoading(true);
                    await loadWallet();
                  }}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
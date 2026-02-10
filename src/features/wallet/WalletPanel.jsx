// src/features/wallet/WalletPanel.jsx
import React, { useMemo, useState } from 'react';
import { createDeposit } from './walletApi';

export default function WalletPanel({ onClose, onBalanceUpdated }) {
  const [amount, setAmount] = useState('25.00');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const amountDollars = useMemo(() => {
    const raw = (amount || '').replace(/[^0-9.]/g, '');
    const numeric = Number(raw || 0);
    if (!Number.isFinite(numeric) || numeric <= 0) return 0;
    return Math.max(1, numeric);
  }, [amount]);

  const canSubmit = !busy && amountDollars >= 1;

  async function deposit() {
    if (!canSubmit) return;

    try {
      setBusy(true);
      setError('');

      await createDeposit({ amountDollars });

      // Tell parent to refresh (parent already closes modal + reloads wallet)
      await onBalanceUpdated?.();
    } catch (e) {
      console.error('Deposit failed:', e);
      setError(e?.message || 'Deposit failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wallet-panel">
      <h3>Add funds</h3>

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

      <div className="row" style={{ marginTop: 12 }}>
        <label>Amount</label>
        <div className="input-wrap" style={{ display: 'flex', gap: 6 }}>
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
        {!canSubmit && (
          <div style={{ marginTop: 6, fontSize: 12, color: '#64748b' }}>
            Enter at least $1.00
          </div>
        )}
      </div>

      <div className="row right" style={{ marginTop: 16, textAlign: 'right' }}>
        <button className="btn" onClick={onClose} disabled={busy}>
          Cancel
        </button>
        <button
          className="btn primary"
          onClick={deposit}
          disabled={!canSubmit}
          style={{
            marginLeft: 8,
            padding: '8px 14px',
            borderRadius: 999,
            border: '1px solid #4f46e5',
            background: canSubmit ? '#4f46e5' : '#9ca3af',
            color: '#fff',
            fontWeight: 700,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
          }}
        >
          {busy ? 'Processing…' : 'Continue'}
        </button>
      </div>
    </div>
  );
}

// src/features/wallet/WithdrawPanel.jsx
import React, { useState } from 'react';
import { withdrawFromWallet } from './walletApi';

export default function WithdrawPanel({ onClose, onBalanceUpdated }) {
  const [amount, setAmount] = useState('25.00');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const amountDollars = Math.max(
    1,
    Number((amount || '').replace(/[^0-9.]/g, '')) || 0
  );

  async function handleWithdraw() {
    try {
      setBusy(true);
      setError('');

      const data = await withdrawFromWallet({ amountDollars });

      // refresh balance if callback provided
      if (onBalanceUpdated) {
        onBalanceUpdated(data.availableCents);
      }

      onClose?.();
    } catch (e) {
      console.error('Withdraw failed:', e);
      setError(e?.response?.data?.error || e.message || 'Withdraw failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wallet-panel">
      <h3>Withdraw funds</h3>

      {error && (
        <div
          style={{
            marginBottom: 8,
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

      <div className="row">
        <label>Amount</label>
        <div className="input-wrap">
          <span>$</span>
          <input
            value={amount}
            onChange={e => setAmount(e.target.value)}
            inputMode="decimal"
            placeholder="25.00"
          />
        </div>
      </div>

      <p style={{ fontSize: 13, color: '#6b7280', marginTop: 8 }}>
        Funds will be sent to your linked payout bank account.
      </p>

      <div className="row right" style={{ marginTop: 16 }}>
        <button className="btn" onClick={onClose} disabled={busy}>
          Cancel
        </button>
        <button className="btn primary" onClick={handleWithdraw} disabled={busy}>
          {busy ? 'Processing…' : 'Withdraw'}
        </button>
      </div>
    </div>
  );
}

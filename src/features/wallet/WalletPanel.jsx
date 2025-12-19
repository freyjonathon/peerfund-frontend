// src/features/wallet/WalletPanel.jsx
import React, { useState } from 'react';
import { createDeposit, fetchWallet } from './walletApi';

export default function WalletPanel({ onClose, onBalanceUpdated }) {
  const [amount, setAmount] = useState('25.00');
  const [busy, setBusy] = useState(false);

  const amountDollars = Math.max(
    1,
    Number((amount || '').replace(/[^0-9.]/g, '')) || 0
  );

  async function deposit() {
    try {
      setBusy(true);

      // 1) Ask backend to charge saved funding card & credit wallet
      await createDeposit({ amountDollars });

      // 2) Refresh wallet
      const w = await fetchWallet();
      onBalanceUpdated?.(w.availableCents);
      onClose?.();
    } catch (e) {
      console.error('Deposit failed:', e);
      alert(e.message || 'Deposit failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wallet-panel">
      <h3>Add funds</h3>

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

      <div className="row right" style={{ marginTop: 16 }}>
        <button className="btn" onClick={onClose} disabled={busy}>
          Cancel
        </button>
        <button className="btn primary" onClick={deposit} disabled={busy}>
          {busy ? 'Processing…' : 'Continue'}
        </button>
      </div>
    </div>
  );
}

// src/features/wallet/WalletPanel.jsx
import React, { useMemo, useState } from 'react';
import { createDeposit } from './walletApi';

const STRIPE_CARD_PERCENT = 0.029;
const STRIPE_CARD_FIXED = 0.30;
const PEERFUND_DEPOSIT_FEE_RATE = 0.01;

function money(n) {
  return `$${Number(n || 0).toFixed(2)}`;
}

function estimateGrossCharge(netDollars) {
  const netCents = Math.round(Number(netDollars || 0) * 100);
  if (!netCents || netCents <= 0) {
    return {
      net: 0,
      stripeFee: 0,
      peerfundFee: 0,
      totalFees: 0,
      gross: 0,
    };
  }

  const fixedCents = Math.round(STRIPE_CARD_FIXED * 100);
  const totalPercent = STRIPE_CARD_PERCENT + PEERFUND_DEPOSIT_FEE_RATE;

  const grossCents = Math.ceil((netCents + fixedCents) / (1 - totalPercent));
  const stripeFeeCents = Math.ceil(grossCents * STRIPE_CARD_PERCENT + fixedCents);
  const peerfundFeeCents = Math.max(0, grossCents - netCents - stripeFeeCents);

  return {
    net: netCents / 100,
    stripeFee: stripeFeeCents / 100,
    peerfundFee: peerfundFeeCents / 100,
    totalFees: (grossCents - netCents) / 100,
    gross: grossCents / 100,
  };
}

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

  const feePreview = useMemo(() => estimateGrossCharge(amountDollars), [amountDollars]);

  const canSubmit = !busy && amountDollars >= 1;

  async function deposit() {
    if (!canSubmit) return;

    try {
      setBusy(true);
      setError('');

      await createDeposit({ amountDollars });

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

      <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
        The amount you enter is what will be added to your PeerFund wallet. Processing and
        PeerFund fees are added on top.
      </p>

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
        <label>Amount to add to wallet</label>
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

      {amountDollars >= 1 && (
        <div
          style={{
            marginTop: 14,
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: '10px 12px',
            background: '#f8fafc',
            fontSize: 14,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span>Added to wallet</span>
            <strong>{money(feePreview.net)}</strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span>Estimated Stripe processing fee</span>
            <span>{money(feePreview.stripeFee)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span>PeerFund deposit fee</span>
            <span>{money(feePreview.peerfundFee)}</span>
          </div>

          <div
            style={{
              borderTop: '1px solid #e2e8f0',
              paddingTop: 8,
              marginTop: 8,
              display: 'flex',
              justifyContent: 'space-between',
              fontWeight: 700,
            }}
          >
            <span>Total charged</span>
            <span>{money(feePreview.gross)}</span>
          </div>

          <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>
            Final fee calculation is confirmed by the server when the deposit is processed.
          </div>
        </div>
      )}

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
          {busy ? 'Processing…' : `Charge ${money(feePreview.gross)}`}
        </button>
      </div>
    </div>
  );
}
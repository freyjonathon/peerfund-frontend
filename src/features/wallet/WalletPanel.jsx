// src/features/wallet/WalletPanel.jsx
import React, { useMemo, useState } from 'react';
import { useStripe } from '@stripe/react-stripe-js';
import {
  createDeposit,
  createAchDeposit,
  createBankSetupIntent,
  saveAchPaymentMethod,
} from './walletApi';

const STRIPE_CARD_PERCENT = 0.029;
const STRIPE_CARD_FIXED = 0.30;
const PEERFUND_DEPOSIT_FEE_RATE = 0.01;

const STRIPE_ACH_PERCENT = 0.008;
const STRIPE_ACH_MAX_FEE = 5.0;
const PEERFUND_ACH_DEPOSIT_FEE_RATE = 0.01;

function money(n) {
  return `$${Number(n || 0).toFixed(2)}`;
}

function estimateCardGross(netDollars) {
  const netCents = Math.round(Number(netDollars || 0) * 100);
  if (!netCents || netCents <= 0) return { net: 0, stripeFee: 0, peerfundFee: 0, totalFees: 0, gross: 0 };

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

function estimateAchGross(netDollars) {
  const netCents = Math.round(Number(netDollars || 0) * 100);
  if (!netCents || netCents <= 0) return { net: 0, stripeFee: 0, peerfundFee: 0, totalFees: 0, gross: 0 };

  const peerfundFeeCents = Math.ceil(netCents * PEERFUND_ACH_DEPOSIT_FEE_RATE);
  const preliminaryGross = Math.ceil((netCents + peerfundFeeCents) / (1 - STRIPE_ACH_PERCENT));
  const achFeeCents = Math.min(
    Math.round(STRIPE_ACH_MAX_FEE * 100),
    Math.ceil(preliminaryGross * STRIPE_ACH_PERCENT)
  );
  const grossCents = netCents + peerfundFeeCents + achFeeCents;

  return {
    net: netCents / 100,
    stripeFee: achFeeCents / 100,
    peerfundFee: peerfundFeeCents / 100,
    totalFees: (grossCents - netCents) / 100,
    gross: grossCents / 100,
  };
}

export default function WalletPanel({ onClose, onBalanceUpdated }) {
  const stripe = useStripe();

  const [amount, setAmount] = useState('25.00');
  const [method, setMethod] = useState('card'); // card | ach
  const [busy, setBusy] = useState(false);
  const [linkingBank, setLinkingBank] = useState(false);
  const [error, setError] = useState('');
  const [achReady, setAchReady] = useState(false);

  const amountDollars = useMemo(() => {
    const raw = (amount || '').replace(/[^0-9.]/g, '');
    const numeric = Number(raw || 0);
    if (!Number.isFinite(numeric) || numeric <= 0) return 0;
    return Math.max(1, numeric);
  }, [amount]);

  const feePreview = useMemo(() => {
    return method === 'ach'
      ? estimateAchGross(amountDollars)
      : estimateCardGross(amountDollars);
  }, [amountDollars, method]);

  const canSubmit = !busy && amountDollars >= 1 && (method === 'card' || achReady);

  async function linkBankAccount() {
    if (!stripe) {
      setError('Stripe is not ready yet. Please refresh and try again.');
      return;
    }

    try {
      setLinkingBank(true);
      setError('');

      const setup = await createBankSetupIntent();
      const clientSecret = setup?.client_secret || setup?.clientSecret;

      if (!clientSecret) {
        throw new Error('No bank setup client secret returned.');
      }

      const collectResult = await stripe.collectBankAccountForSetup({
        clientSecret,
        params: {
          payment_method_type: 'us_bank_account',
          payment_method_data: {
            billing_details: {
              name: 'PeerFund User',
            },
          },
        },
      });

      if (collectResult.error) {
        throw new Error(collectResult.error.message || 'Bank linking was cancelled.');
      }

      const confirmResult = await stripe.confirmUsBankAccountSetup(clientSecret);

      if (confirmResult.error) {
        throw new Error(confirmResult.error.message || 'Could not confirm bank setup.');
      }

      const pmId = confirmResult.setupIntent?.payment_method;
      if (!pmId) {
        throw new Error('No ACH payment method returned from Stripe.');
      }

      await saveAchPaymentMethod({ paymentMethodId: pmId });

      setAchReady(true);
      alert('Bank account linked for ACH deposits.');
    } catch (e) {
      console.error('ACH bank link failed:', e);
      setError(e?.message || 'Could not link bank account.');
    } finally {
      setLinkingBank(false);
    }
  }

  async function deposit() {
    if (!canSubmit) return;

    try {
      setBusy(true);
      setError('');

      if (method === 'ach') {
        await createAchDeposit({ amountDollars });
      } else {
        await createDeposit({ amountDollars });
      }

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
        Card deposits are instant. ACH deposits have lower fees but stay pending until Stripe confirms settlement.
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

      <div style={{ marginTop: 12, display: 'flex', gap: 10, fontSize: 13 }}>
        <label>
          <input
            type="radio"
            name="deposit-method"
            value="card"
            checked={method === 'card'}
            onChange={() => setMethod('card')}
          />{' '}
          Card — instant
        </label>

        <label>
          <input
            type="radio"
            name="deposit-method"
            value="ach"
            checked={method === 'ach'}
            onChange={() => setMethod('ach')}
          />{' '}
          ACH bank — lower fee, pending
        </label>
      </div>

      {method === 'ach' && !achReady && (
        <div
          style={{
            marginTop: 10,
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: 10,
            padding: '8px 10px',
            fontSize: 13,
            color: '#92400e',
          }}
        >
          <strong>ACH bank required.</strong>
          <div style={{ marginTop: 4 }}>
            Link a bank account before starting an ACH deposit.
          </div>
          <button
            type="button"
            onClick={linkBankAccount}
            disabled={linkingBank || !stripe}
            style={{
              marginTop: 8,
              padding: '7px 12px',
              borderRadius: 999,
              border: '1px solid #92400e',
              background: '#92400e',
              color: '#fff',
              fontWeight: 700,
              cursor: linkingBank ? 'not-allowed' : 'pointer',
            }}
          >
            {linkingBank ? 'Linking…' : 'Link bank account'}
          </button>
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

        {amountDollars < 1 && (
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
            <span>{method === 'ach' ? 'Pending wallet deposit' : 'Added to wallet'}</span>
            <strong>{money(feePreview.net)}</strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span>
              Estimated {method === 'ach' ? 'ACH' : 'card'} processing fee
            </span>
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

          {method === 'ach' && (
            <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>
              ACH deposits will show as pending first and become available after settlement.
            </div>
          )}
        </div>
      )}

      <div className="row right" style={{ marginTop: 16, textAlign: 'right' }}>
        <button className="btn" onClick={onClose} disabled={busy || linkingBank}>
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
          {busy
            ? 'Processing…'
            : method === 'ach'
            ? `Start ACH ${money(feePreview.gross)}`
            : `Charge ${money(feePreview.gross)}`}
        </button>
      </div>
    </div>
  );
}
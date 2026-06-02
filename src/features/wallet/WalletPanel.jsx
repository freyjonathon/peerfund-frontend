// src/features/wallet/WalletPanel.jsx
import React, { useEffect, useState } from 'react';
import { useStripe } from '@stripe/react-stripe-js';
import {
  createBankSetupIntent,
  saveAchPaymentMethod,
  fetchAchPaymentMethod,
} from './walletApi';

export default function WalletPanel({ onClose, onBalanceUpdated }) {
  const stripe = useStripe();

  const [linkingBank, setLinkingBank] = useState(false);
  const [loadingAch, setLoadingAch] = useState(true);
  const [error, setError] = useState('');
  const [achReady, setAchReady] = useState(false);
  const [achMethod, setAchMethod] = useState(null);

  async function loadSavedAchMethod() {
    try {
      setLoadingAch(true);
      setError('');

      const data = await fetchAchPaymentMethod();

      if (data?.hasAch) {
        setAchReady(true);
        setAchMethod(data.paymentMethod || null);
      } else {
        setAchReady(false);
        setAchMethod(null);
      }
    } catch (e) {
      console.warn('Could not load ACH payment method:', e);
      setAchReady(false);
      setAchMethod(null);
      setError(e?.message || 'Could not check saved payment method.');
    } finally {
      setLoadingAch(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        setLoadingAch(true);
        const data = await fetchAchPaymentMethod();

        if (!mounted) return;

        if (data?.hasAch) {
          setAchReady(true);
          setAchMethod(data.paymentMethod || null);
        } else {
          setAchReady(false);
          setAchMethod(null);
        }
      } catch (e) {
        console.warn('Could not load ACH payment method:', e);
        if (!mounted) return;
        setAchReady(false);
        setAchMethod(null);
      } finally {
        if (mounted) setLoadingAch(false);
      }
    }

    run();

    return () => {
      mounted = false;
    };
  }, []);

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
        throw new Error(
          collectResult.error.message || 'Bank linking was cancelled.'
        );
      }

      const confirmResult = await stripe.confirmUsBankAccountSetup(clientSecret);

      if (confirmResult.error) {
        throw new Error(
          confirmResult.error.message || 'Could not confirm bank setup.'
        );
      }

      const pmId = confirmResult.setupIntent?.payment_method;

      if (!pmId) {
        throw new Error('No payment method returned from Stripe.');
      }

      const saved = await saveAchPaymentMethod({ paymentMethodId: pmId });

      setAchReady(true);
      setAchMethod({
        id: saved?.id || null,
        last4: saved?.last4 || null,
        bankName: saved?.bankName || 'Bank account',
        accountType: saved?.accountType || null,
      });

      await loadSavedAchMethod();
      await onBalanceUpdated?.();
    } catch (e) {
      console.error('Payment method link failed:', e);
      setError(e?.message || 'Could not link payment method.');
    } finally {
      setLinkingBank(false);
    }
  }

  const achLabel = achMethod
    ? `${achMethod.bankName || 'Bank account'}${
        achMethod.last4 ? ` •••• ${achMethod.last4}` : ''
      }`
    : 'Saved bank account';

  return (
    <div className="wallet-panel">
      <h3>Save payment method</h3>

      <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
        Save a bank account to fund loans and make repayments. You do not need
        to manually deposit funds into your PeerFund wallet before lending.
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

      {loadingAch && (
        <div style={{ marginTop: 10, fontSize: 13, color: '#64748b' }}>
          Checking saved payment method…
        </div>
      )}

      {!loadingAch && !achReady && (
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
          <strong>No payment method linked yet.</strong>

          <div style={{ marginTop: 4 }}>
            Link a bank account once, then PeerFund can use it for loan funding
            and repayments.
          </div>

          <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={linkBankAccount}
              disabled={linkingBank || !stripe}
              style={{
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

            <button
              type="button"
              onClick={loadSavedAchMethod}
              disabled={loadingAch || linkingBank}
              style={{
                padding: '7px 12px',
                borderRadius: 999,
                border: '1px solid #92400e',
                background: '#ffffff',
                color: '#92400e',
                fontWeight: 700,
                cursor: loadingAch || linkingBank ? 'not-allowed' : 'pointer',
              }}
            >
              Refresh saved bank
            </button>
          </div>
        </div>
      )}

      {!loadingAch && achReady && (
        <div
          style={{
            marginTop: 10,
            background: '#ecfdf5',
            border: '1px solid #bbf7d0',
            borderRadius: 10,
            padding: '8px 10px',
            fontSize: 13,
            color: '#166534',
          }}
        >
          <strong>Payment method ready.</strong>

          <div style={{ marginTop: 4 }}>
            Loan funding and repayments will use <strong>{achLabel}</strong>.
          </div>

          <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={linkBankAccount}
              disabled={linkingBank || !stripe}
              style={{
                padding: '7px 12px',
                borderRadius: 999,
                border: '1px solid #166534',
                background: '#ffffff',
                color: '#166534',
                fontWeight: 700,
                cursor: linkingBank ? 'not-allowed' : 'pointer',
              }}
            >
              {linkingBank ? 'Linking…' : 'Replace bank'}
            </button>

            <button
              type="button"
              onClick={loadSavedAchMethod}
              disabled={loadingAch || linkingBank}
              style={{
                padding: '7px 12px',
                borderRadius: 999,
                border: '1px solid #166534',
                background: '#ffffff',
                color: '#166534',
                fontWeight: 700,
                cursor: loadingAch || linkingBank ? 'not-allowed' : 'pointer',
              }}
            >
              Refresh saved bank
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          marginTop: 14,
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          padding: '10px 12px',
          background: '#f8fafc',
          fontSize: 13,
          color: '#334155',
          lineHeight: 1.5,
        }}
      >
        <strong>How this payment method is used:</strong>
        <ul style={{ paddingLeft: 18, marginTop: 8, marginBottom: 0 }}>
          <li>Funding accepted loans</li>
          <li>Making borrower repayments</li>
          <li>SuperUser subscription billing</li>
          <li>Your wallet only shows funds you have received</li>
        </ul>
      </div>

      <div className="row right" style={{ marginTop: 16, textAlign: 'right' }}>
        <button
          className="btn"
          onClick={onClose}
          disabled={linkingBank}
        >
          Close
        </button>
      </div>
    </div>
  );
}
// src/features/repayments/RepaymentButton.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';

function getAuthHeader() {
  let t = localStorage.getItem('token') || '';
  t = t.replace(/^"|"$/g, '');
  return t ? { Authorization: `Bearer ${t}` } : {};
}

/**
 * Props:
 *  - loanId: string
 *  - amount: number (installment this period – display only)
 *  - onPaid?: () => void | Promise<void>
 */
export default function RepaymentButton({ loanId, amount, onPaid }) {
  const [source, setSource] = useState('wallet'); // 'wallet' | 'bank'
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [okMsg, setOkMsg] = useState('');

  const displayAmount =
    typeof amount === 'number' && Number.isFinite(amount) ? `$${amount.toFixed(2)}` : null;

  const handlePay = async () => {
    setLoading(true);
    setErrorMsg('');
    setOkMsg('');

    try {
      await axios.post(
        `/api/loans/${loanId}/pay-next`,
        { source }, // 👈 send selected source
        {
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
          },
          withCredentials: true,
        }
      );

      setOkMsg('Payment submitted successfully.');
      if (typeof onPaid === 'function') {
        await onPaid();
      }
    } catch (err) {
      console.error('payNextInstallment error', err);
      const msg = err?.response?.data?.error || err?.message || 'Payment failed';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 12 }}>
      {/* Optional amount display */}
      {displayAmount && (
        <div style={{ marginBottom: 8, fontSize: 13, color: '#334155' }}>
          <strong>Next installment:</strong> {displayAmount}
        </div>
      )}

      {/* Source selector */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center',
          marginBottom: 8,
          fontSize: 13,
          color: '#475569',
        }}
      >
        <span style={{ fontWeight: 600 }}>Pay from:</span>

        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <input
            type="radio"
            name={`pay-source-${loanId}`}
            value="wallet"
            checked={source === 'wallet'}
            onChange={() => setSource('wallet')}
          />
          PeerFund wallet balance
        </label>

        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <input
            type="radio"
            name={`pay-source-${loanId}`}
            value="bank"
            checked={source === 'bank'}
            onChange={() => setSource('bank')}
          />
          Linked bank (payment method)
        </label>
      </div>

      <button
        type="button"
        onClick={handlePay}
        disabled={loading}
        style={{
          background: '#4f46e5',
          color: '#fff',
          border: '1px solid #4f46e5',
          padding: '10px 16px',
          borderRadius: 999,
          fontWeight: 800,
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Processing…' : 'Pay next installment'}
      </button>

      {errorMsg && (
        <div
          style={{
            marginTop: 6,
            fontSize: 12,
            color: '#b91c1c',
            background: '#fee2e2',
            borderRadius: 8,
            padding: '4px 8px',
          }}
        >
          {errorMsg}
        </div>
      )}

      {okMsg && (
        <div
          style={{
            marginTop: 6,
            fontSize: 12,
            color: '#166534',
            background: '#dcfce7',
            borderRadius: 8,
            padding: '4px 8px',
          }}
        >
          {okMsg}
        </div>
      )}
    </div>
  );
}

RepaymentButton.propTypes = {
  loanId: PropTypes.string.isRequired,
  amount: PropTypes.number,
  onPaid: PropTypes.func,
};

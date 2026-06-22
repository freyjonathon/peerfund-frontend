// src/features/loans/RepaymentButton.jsx

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { apiFetch } from '../../utils/api';

export default function RepaymentButton({ loanId, amount, onPaid }) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [okMsg, setOkMsg] = useState('');

  const displayAmount =
    typeof amount === 'number' && Number.isFinite(amount)
      ? `$${amount.toFixed(2)}`
      : null;

  const handlePay = async () => {
    if (!loanId) return;

    const confirmed = window.confirm(
      'This payment will be withdrawn from your linked bank account via ACH. Continue?'
    );

    if (!confirmed) return;

    setLoading(true);
    setErrorMsg('');
    setOkMsg('');

    try {
      await apiFetch(`/api/loans/${loanId}/pay-next`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      setOkMsg(
        'Payment submitted successfully. ACH transfers may take 1–3 business days to settle.'
      );

      if (typeof onPaid === 'function') {
        await onPaid();
      }
    } catch (err) {
      console.error('pay-next error:', err);
      setErrorMsg(err?.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 12 }}>
      {displayAmount && (
        <div
          style={{
            marginBottom: 8,
            fontSize: 13,
            color: '#334155',
          }}
        >
          <strong>Next installment:</strong> {displayAmount}
        </div>
      )}

      <div
        style={{
          marginBottom: 12,
          padding: '10px 12px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 10,
          fontSize: 13,
          color: '#334155',
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 4 }}>
          Payment Method
        </div>

        <div>
          ✓ Linked Bank Account (ACH)
        </div>

        <div
          style={{
            marginTop: 4,
            fontSize: 12,
            color: '#64748b',
          }}
        >
          Repayments are automatically withdrawn from your saved bank account.
          ACH transfers may take 1–3 business days to fully settle.
        </div>
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
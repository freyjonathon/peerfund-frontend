// src/features/direct/DirectRequestConfirm.jsx
import React, { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';

export default function DirectRequestConfirm() {
  const navigate = useNavigate();
  const { lenderId } = useParams();
  const [sp] = useSearchParams();
  const { state } = useLocation();     // <= also support history state

  // prefer query params, fall back to `location.state`
  const amount = Number(sp.get('amount') ?? state?.amount ?? 0);
  const rate   = Number(sp.get('rate')   ?? state?.rate   ?? 0);
  const months = Number(sp.get('months') ?? state?.months ?? 0);

  const [submitting, setSubmitting] = useState(false);
  const canSubmit = useMemo(
    () => lenderId && Number.isFinite(amount) && amount > 0 && Number.isFinite(rate) && months > 0,
    [lenderId, amount, rate, months]
  );

  const onCancel = () => navigate(-1);

  const onConfirm = async () => {
    if (!canSubmit) return;
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token') || '';
      const res = await fetch('/api/direct-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ lenderId, amount, months, apr: rate }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to submit request');
      alert('Direct loan request sent!');
      navigate('/money-summary');
    } catch (e) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card" style={{ maxWidth: 520 }}>
        <div className="auth-header">
          <div className="auth-logo">PF</div>
          <div className="auth-title">Confirm Direct Loan Request</div>
        </div>

        <div className="auth-sub">Review and confirm your request.</div>

        <div style={{ marginTop: 12 }}>
          <p><strong>Lender ID:</strong> {lenderId}</p>
          <p><strong>Amount:</strong> ${amount.toFixed(2)}</p>
          <p><strong>APR:</strong> {rate}%</p>
          <p><strong>Months:</strong> {months}</p>
        </div>

        <div className="auth-actions" style={{ marginTop: 16 }}>
          <button className="auth-btn" onClick={onCancel} disabled={submitting}>Back</button>
          <button className="auth-btn primary" onClick={onConfirm} disabled={submitting || !canSubmit}>
            {submitting ? 'Submitting…' : 'Confirm & Send'}
          </button>
        </div>
      </div>
    </div>
  );
}

// components/UserProfileCard.jsx
import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import './UserProfileCard.css';

/** Robust token reader (strips quotes and optional 'Bearer ') */
function getToken() {
  let t = localStorage.getItem('token') || '';
  t = t.replace(/^"|"$/g, ''); // remove accidental JSON quotes
  if (t.toLowerCase().startsWith('bearer ')) t = t.slice(7);
  return t || null;
}

/** Backend origin; set VITE_API_URL or REACT_APP_API_URL to your API */
const API_BASE =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
  process.env.REACT_APP_API_URL ||
  'http://localhost:5000'; // ← change if your API runs elsewhere

const UserProfileCard = ({ user, onRequestLoan, hideActions = false }) => {
  const navigate = useNavigate();
  const [selectedTerm, setSelectedTerm] = useState(null); // { amount, rate } | null
  const [months, setMonths] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const given =
    user?.stats?.loansGivenCount ??
    (Array.isArray(user?.loansAsLender) ? user.loansAsLender.length : 0);

  const initials =
    (user?.name || '')
      .split(' ')
      .map((p) => p[0])
      .filter(Boolean)
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U';

  // Terms: read whatever keys exist and are enabled, sorted asc by amount
  const terms = useMemo(() => {
    const raw = user?.lendingTerms || {};
    const items = Object.entries(raw)
      .filter(([, v]) => v && v.enabled)
      .map(([k, v]) => ({
        amount: Number(k),
        rate: Number(v.rate),
      }))
      .filter((t) => Number.isFinite(t.amount) && t.amount > 0 && Number.isFinite(t.rate));
    items.sort((a, b) => a.amount - b.amount);
    return items;
  }, [user?.lendingTerms]);

  const handleCancel = () => {
    setSelectedTerm(null);
    setMonths(1);
  };

  const handleContinue = async () => {
    if (!selectedTerm || submitting) return;

    // Align to DirectLoanRequest schema: months + apr
    const payload = {
      lenderId: user?.id,
      amount: Number(selectedTerm.amount),
      months: Number(months),
      apr: Number(selectedTerm.rate),
      notes: '',
    };

    // Allow parent override
    if (typeof onRequestLoan === 'function') {
      onRequestLoan(payload);
      return;
    }

    try {
      const token = getToken();
      if (!token) {
        alert('Your session has expired. Please sign in again.');
        navigate('/login');
        return;
      }

      setSubmitting(true);

      const res = await fetch(`${API_BASE}/api/direct-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      let data = null;
      const text = await res.text();
      try {
      data = text ? JSON.parse(text) : null;
    } catch (err) {
      // Non-JSON response (e.g., empty body or HTML error). Keep data as null.
    }

      if (!res.ok) {
        const msg = data?.message || data?.error || `${res.status} ${res.statusText}`;
        if (res.status === 401) {
          alert('Your session expired or token is invalid. Please sign in again.');
          navigate('/login');
          return;
        }
        throw new Error(msg || 'Failed to create request');
      }

      // Success → reset and navigate
      setSelectedTerm(null);
      setMonths(1);
      const id = data?.id;
      navigate(id ? `/requests/${id}` : '/requests');
    } catch (e) {
      alert(e.message || 'Failed to create request');
    } finally {
      setSubmitting(false);
    }
  };

  const memberSince =
    user?.signupDate || user?.createdAt ? new Date(user.signupDate || user.createdAt).toLocaleDateString() : '—';

  return (
    <div className="user-card" role="region" aria-label={`${user?.name || 'User'} profile`}>
      {/* Header */}
      <div className="user-card__header">
        <div className="user-card__avatar" aria-hidden="true">{initials}</div>
        <div className="user-card__meta">
          <h2 className="user-card__name">
            {user?.name || 'Unknown'}
            {user?.isSuperUser && <span className="user-card__badge" title="SuperUser">SuperUser</span>}
          </h2>
          <div className="user-card__sub">
            {user?.location ? <span>{user.location} • </span> : null}
            Member since: {memberSince}
            <div style={{ marginTop: 4 }}>
              <span className="user-card__stat-label">Loans Given: {given}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Available Terms */}
      <div className="user-card__section">
        <div className="user-card__section-title">Available Terms</div>

        {terms.length ? (
          <>
            <div className="user-card__terms" role="list">
              {terms.map(({ amount, rate }) => {
                const key = `${amount}-${rate}`;
                const isSelected =
                  selectedTerm &&
                  selectedTerm.amount === amount &&
                  selectedTerm.rate === rate;
                return (
                  <button
                    key={key}
                    type="button"
                    className={`user-card__term ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => setSelectedTerm({ amount, rate })}
                    title={`Request $${amount} at ${rate}% APR`}
                    aria-pressed={isSelected}
                    role="listitem"
                  >
                    <div className="user-card__term-amt">
                      ${Number.isInteger(amount) ? amount : amount.toFixed(2)}
                    </div>
                    <div className="user-card__term-rate">{rate}% Interest</div>
                  </button>
                );
              })}
            </div>

            {/* Months picker */}
            <div className="user-card__picker">
              <label htmlFor="months">Choose repayment term</label>
              <span className="select-wrapper">
                <select
                  id="months"
                  className="select"
                  value={months}
                  onChange={(e) => setMonths(Number(e.target.value))}
                  aria-label="Repayment months"
                >
                  {[1, 2, 3, 4, 5, 6, 9, 12].map((m) => (
                    <option key={m} value={m}>
                      {m} {m === 1 ? 'month' : 'months'}
                    </option>
                  ))}
                </select>
              </span>
            </div>

            {/* Actions */}
            {!hideActions && (
              <div className="btn-row">
                <button type="button" className="btn btn--ghost" onClick={handleCancel}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={handleContinue}
                  disabled={!selectedTerm || submitting}
                  aria-disabled={!selectedTerm || submitting}
                >
                  {submitting ? 'Sending…' : 'Continue'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="user-card__muted">No preset terms shared.</div>
        )}
      </div>
    </div>
  );
};

UserProfileCard.propTypes = {
  user: PropTypes.object.isRequired,
  onRequestLoan: PropTypes.func, // optional override: ({ lenderId, amount, months, apr, notes }) => void
  hideActions: PropTypes.bool,
};

export default UserProfileCard;

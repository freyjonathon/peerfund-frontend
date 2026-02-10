// src/features/loans/CreateLoan.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../utils/api';
import './CreateLoan.css';

const CreateLoan = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    amount: '',
    duration: '',
    interestRate: '',
    purpose: '',
  });

  const [isSuperUser, setIsSuperUser] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchUserStatus = async () => {
      try {
        const profile = await apiFetch('/api/users/profile');
        if (cancelled) return;
        setIsSuperUser(!!profile?.isSuperUser);
      } catch (err) {
        console.error('Failed to fetch user status', err);
        // treat as auth issue if profile fails
        localStorage.removeItem('token');
        navigate('/login', { replace: true });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchUserStatus();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      amount: Number(formData.amount),
      duration: Number(formData.duration),
      interestRate: Number(formData.interestRate),
      purpose: (formData.purpose || '').trim(),
    };

    // quick client-side validation (prevents NaN)
    if (!Number.isFinite(payload.amount) || payload.amount <= 0) {
      alert('Please enter a valid loan amount.');
      return;
    }
    if (!Number.isFinite(payload.duration) || payload.duration < 1) {
      alert('Please enter a valid duration (months).');
      return;
    }
    if (!Number.isFinite(payload.interestRate) || payload.interestRate < 0) {
      alert('Please enter a valid interest rate (APR).');
      return;
    }

    try {
      const data = await apiFetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('Loan submitted:', data);
      alert('Loan request submitted successfully!');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('Error submitting loan request:', error);
      alert(
        `There was a problem submitting your loan request:\n${error?.message || error}`
      );
    }
  };

  if (loading) {
    return (
      <div className="cl-shell">
        <div className="cl-card cl-card--loading">Loading loan form…</div>
      </div>
    );
  }

  return (
    <div className="cl-shell">
      <header className="cl-header">
        <div className="cl-eyebrow">Borrow</div>
        <h2 className="cl-title">Create a New Loan Request</h2>
        <p className="cl-subtitle">
          Set the amount, duration, and rate that work for you. Lenders will review your
          request and send offers directly in PeerFund.
        </p>
      </header>

      {/* SuperUser / fees note */}
      {isSuperUser ? (
        <div className="cl-alert cl-alert--success">
          <span className="cl-alert-icon">💎</span>
          <div>
            <div className="cl-alert-title">SuperUser perks unlocked</div>
            <div className="cl-alert-text">
              The 3% PeerFund platform fee is waived on principal and payments.
              A 3% banking fee still applies.
            </div>
          </div>
        </div>
      ) : (
        <div className="cl-alert cl-alert--warn">
          <span className="cl-alert-icon">⚠️</span>
          <div>
            <div className="cl-alert-title">Standard fees apply</div>
            <div className="cl-alert-text">
              A 3% PeerFund platform fee applies to principal and payments.
              Upgrade to SuperUser to waive the PeerFund fee
              (a 3% banking fee still applies).
            </div>
          </div>
        </div>
      )}

      <form className="cl-card" onSubmit={handleSubmit}>
        <div className="cl-grid">
          <div className="cl-field">
            <div className="cl-label-row">
              <label htmlFor="amount">Loan amount</label>
              <span className="cl-label-meta">USD · Required</span>
            </div>
            <input
              id="amount"
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              required
              min="0"
              max="250000"
              step="1"
              placeholder="e.g. 2,500"
            />
            <div className="cl-hint">Max $250,000</div>
          </div>

          <div className="cl-field">
            <div className="cl-label-row">
              <label htmlFor="duration">Duration</label>
              <span className="cl-label-meta">Months</span>
            </div>
            <input
              id="duration"
              type="number"
              name="duration"
              value={formData.duration}
              onChange={handleInputChange}
              required
              min="1"
              max="36"
              placeholder="e.g. 12"
            />
            <div className="cl-hint">Typical requests are 6–24 months.</div>
          </div>

          <div className="cl-field">
            <div className="cl-label-row">
              <label htmlFor="interestRate">Interest rate</label>
              <span className="cl-label-meta">APR</span>
            </div>
            <input
              id="interestRate"
              type="number"
              name="interestRate"
              step="0.01"
              value={formData.interestRate}
              onChange={handleInputChange}
              required
              min="0"
              max="25"
              placeholder="e.g. 9.5"
            />
            <div className="cl-hint">Max 25%. Be realistic to attract lenders.</div>
          </div>
        </div>

        <div className="cl-field cl-field--full">
          <div className="cl-label-row">
            <label htmlFor="purpose">Purpose</label>
            <span className="cl-label-meta optional">Optional</span>
          </div>
          <textarea
            id="purpose"
            name="purpose"
            rows={4}
            value={formData.purpose}
            onChange={handleInputChange}
            placeholder="Tell lenders briefly why you need this loan and how you plan to repay it."
          />
          <div className="cl-hint">Strong, specific descriptions get better offers.</div>
        </div>

        <div className="cl-divider" />

        <div className="cl-actions">
          <button type="button" className="btn btn--ghost" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <button type="submit" className="btn btn--primary btn--lg">
            Post Loan Request
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateLoan;

// src/features/loans/LoanMarketplace.jsx
import React, { useEffect, useMemo, useState } from 'react';
import './LoanMarketplace.css';
import UserProfileModal from '../../components/UserProfileModal';
import OfferModal from '../../components/OfferModal';
import { apiFetch } from '../../utils/api';

const fmtMoney = (n) =>
  typeof n === 'number' && !Number.isNaN(n) ? `$${n.toFixed(2)}` : '—';

function safeNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function getCurrentUserId() {
  let t = localStorage.getItem('token') || '';
  t = t.replace(/^"|"$/g, '');
  if (!t) return null;

  try {
    const payload = JSON.parse(atob(t.split('.')[1] || ''));
    return payload?.userId ?? payload?.id ?? null;
  } catch {
    return null;
  }
}

function loanIdOf(loan) {
  return loan?.id || loan?._id || loan?.loanId || null;
}

export default function LoanMarketplace() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    amount: '',
    purpose: '',
    duration: '',
  });

  const [profileUserId, setProfileUserId] = useState(null);
  const [selectedLoanId, setSelectedLoanId] = useState(null);

  const currentUserId = getCurrentUserId();

  useEffect(() => {
    let alive = true;

    const fetchLoans = async () => {
      try {
        setLoading(true);
        setError('');

        const data = await apiFetch('/api/loans/open');

        const items = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
            ? data.items
            : Array.isArray(data?.loans)
              ? data.loans
              : [];

        if (!alive) return;

        const cleaned = items.filter((x) => loanIdOf(x));
        setLoans(cleaned);
      } catch (err) {
        console.error('Error fetching open loans:', err);

        if (!alive) return;

        setError(err?.message || 'Failed to load open loan requests. Please try again.');
        setLoans([]);
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchLoans();

    return () => {
      alive = false;
    };
  }, []);

  const handleFilterChange = (e) =>
    setFilters((f) => ({ ...f, [e.target.name]: e.target.value }));

  const visible = useMemo(() => {
    const notMine = loans.filter((loan) => {
      const borrowerId = loan.borrower?.id || loan.borrower?._id || loan.borrowerId;
      return !currentUserId || !borrowerId || String(borrowerId) !== String(currentUserId);
    });

    return notMine.filter((loan) => {
      const amt = safeNumber(loan.amount);
      const dur = safeNumber(loan.duration);

      const minAmt = filters.amount ? safeNumber(filters.amount) : null;
      const durFilter = filters.duration ? safeNumber(filters.duration) : null;

      const matchesAmount = !minAmt || (amt != null && amt >= minAmt);

      const matchesPurpose =
        !filters.purpose ||
        String(loan.purpose || '')
          .toLowerCase()
          .includes(filters.purpose.toLowerCase());

      const matchesDuration = !durFilter || (dur != null && dur === durFilter);

      return matchesAmount && matchesPurpose && matchesDuration;
    });
  }, [loans, filters, currentUserId]);

  return (
    <div className="lm-container">
      <h2 className="lm-heading">Open Loan Marketplace</h2>

      <div className="lm-filters">
        <label className="lm-filter">
          <span>Min Amount</span>
          <input
            type="number"
            name="amount"
            value={filters.amount}
            onChange={handleFilterChange}
            placeholder="e.g. 75"
          />
        </label>

        <label className="lm-filter">
          <span>Duration (months)</span>
          <input
            type="number"
            name="duration"
            value={filters.duration}
            onChange={handleFilterChange}
            placeholder="e.g. 2"
          />
        </label>
      </div>

      {error && <div className="lm-error">{error}</div>}

      {loading ? (
        <div className="lm-skeleton-grid">
          {[...Array(6)].map((_, i) => (
            <div className="lm-card lm-skeleton" key={i} />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <p className="lm-empty">No open loan requests match your filters.</p>
      ) : (
        <div className="lm-grid">
          {visible.map((loan) => {
            const id = loanIdOf(loan);

            const borrower = loan.borrower || {};
            const borrowerId = borrower.id || borrower._id || loan.borrowerId;
            const name = borrower.name || borrower.fullName || 'Unknown';

            const duration = safeNumber(loan.duration);
            const interest = loan.interestRate != null ? `${loan.interestRate}%` : '—';
            const amount = safeNumber(loan.amount) ?? 0;

            const offerCount =
              (typeof loan.offerCount === 'number' && loan.offerCount) ??
              (loan._count?.loanOffers ??
                (Array.isArray(loan.loanOffers) ? loan.loanOffers.length : 0));

            return (
              <div className="lm-card" key={id}>
                <div className="lm-card-header">
                  <div className="lm-header-left">
                    <button
                      type="button"
                      className="pf-linklike"
                      onClick={() => borrowerId && setProfileUserId(borrowerId)}
                      title="View profile"
                    >
                      <div className="lm-title">{name}</div>
                    </button>

                    <div className="lm-subtitle">Borrower</div>
                  </div>

                  <div className="lm-header-right">
                    <div className="lm-amount-label">Amount</div>
                    <div className="lm-amount-value">{fmtMoney(amount)}</div>
                  </div>

                  <div className="lm-header-right">
                    <div style={{ fontSize: '.75rem', color: '#64748b' }}>
                      Duration
                    </div>
                    <div style={{ fontWeight: 600 }}>
                      {duration != null ? `${duration} months` : '—'}
                    </div>
                  </div>

                  <div className="lm-header-right">
                    <div style={{ fontSize: '.75rem', color: '#64748b' }}>
                      Interest
                    </div>
                    <div style={{ fontWeight: 600 }}>{interest}</div>
                  </div>

                  <div className="lm-header-right">
                    <div style={{ fontSize: '.75rem', color: '#64748b' }}>
                      Offers
                    </div>
                    <div style={{ fontWeight: 600 }}>{offerCount}</div>
                  </div>

                  <div className="lm-actions-top" style={{ gap: '.5rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="action-btn primary"
                      onClick={() => setSelectedLoanId(id)}
                    >
                      💬 View Convo / 💵 Make Offer
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {profileUserId && (
        <UserProfileModal
          userId={profileUserId}
          onClose={() => setProfileUserId(null)}
        />
      )}

      {selectedLoanId && (
        <OfferModal
          loanId={selectedLoanId}
          onClose={() => setSelectedLoanId(null)}
        />
      )}
    </div>
  );
}
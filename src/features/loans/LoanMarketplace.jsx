// src/features/loans/LoanMarketplace.jsx
import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import './LoanMarketplace.css';
import InlineDiscussion from './InlineDiscussion';
import UserProfileModal from '../../components/UserProfileModal';
import OfferModal from '../../components/OfferModal'; // ✅ new import

const fmtMoney = (n) =>
  typeof n === 'number' && !Number.isNaN(n) ? `$${n.toFixed(2)}` : '—';

// Decode JWT to get the current user id (so we can hide their own requests)
function getCurrentUserId() {
  const t = localStorage.getItem('token');
  if (!t) return null;
  try {
    const payload = JSON.parse(atob(t.split('.')[1] || ''));
    return payload?.userId ?? null;
  } catch {
    return null;
  }
}

export default function LoanMarketplace() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ amount: '', purpose: '', duration: '' });

  // expanded state per loan id
  const [expanded, setExpanded] = useState({});
  // which user profile to show in the modal
  const [profileUserId, setProfileUserId] = useState(null);
  // NEW: track which loan’s offer modal is open
  const [selectedLoanId, setSelectedLoanId] = useState(null);

  const currentUserId = getCurrentUserId();

  const toggle = (id) =>
    setExpanded((prev) => {
      const collapsed = Object.keys(prev).reduce((acc, k) => ({ ...acc, [k]: false }), {});
      return { ...collapsed, [id]: !prev[id] };
    });

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await axios.get('/api/loans/open', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        const data = Array.isArray(res.data) ? res.data : res.data?.items || [];
        setLoans(data);
      } catch (err) {
        console.error('Error fetching loan requests:', err);
        setError('Failed to load open loan requests. Please try again.');
        setLoans([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLoans();
  }, []);

  const handleFilterChange = (e) =>
    setFilters((f) => ({ ...f, [e.target.name]: e.target.value }));

  // Exclude the viewer's own requests first, then apply filters
  const visible = useMemo(() => {
    const notMine = loans.filter((loan) => {
      const borrowerId = loan.borrower?.id || loan.borrowerId;
      return !currentUserId || !borrowerId || borrowerId !== currentUserId;
    });

    return notMine.filter((loan) => {
      const amount = Number(loan.amount);
      const matchesAmount =
        !filters.amount || (Number.isFinite(amount) && amount >= Number(filters.amount));
      const matchesPurpose =
        !filters.purpose ||
        (loan.purpose || '').toLowerCase().includes(filters.purpose.toLowerCase());
      const matchesDuration =
        !filters.duration || Number(loan.duration) === Number(filters.duration);
      return matchesAmount && matchesPurpose && matchesDuration;
    });
  }, [loans, filters, currentUserId]);

  return (
    <div className="lm-container">
      <h2 className="lm-heading">Open Loan Marketplace</h2>

      {/* Filter bar */}
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
            const borrower = loan.borrower || {};
            const borrowerId = borrower.id || borrower._id || loan.borrowerId;
            const name = borrower.name || borrower.fullName || 'Unknown';
            const duration = Number(loan.duration);
            const interest = loan.interestRate != null ? `${loan.interestRate}%` : '—';
            const amount = Number(loan.amount) || 0;
            const isOpen = !!expanded[loan.id];

            // robust offer count
            const offerCount =
              (typeof loan.offerCount === 'number' && loan.offerCount) ??
              (loan._count?.loanOffers ??
                (Array.isArray(loan.loanOffers) ? loan.loanOffers.length : 0));

            return (
              <div className="lm-card" key={loan.id}>
                {/* Header row */}
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
                    <div style={{ fontSize: '.75rem', color: '#64748b' }}>Duration</div>
                    <div style={{ fontWeight: 600 }}>
                      {Number.isFinite(duration) ? `${duration} months` : '—'}
                    </div>
                  </div>

                  <div className="lm-header-right">
                    <div style={{ fontSize: '.75rem', color: '#64748b' }}>Interest</div>
                    <div style={{ fontWeight: 600 }}>{interest}</div>
                  </div>

                  {/* Offers count */}
                  <div className="lm-header-right">
                    <div style={{ fontSize: '.75rem', color: '#64748b' }}>Offers</div>
                    <div style={{ fontWeight: 600 }}>{offerCount}</div>
                  </div>

                  {/* Actions */}
                  <div className="lm-actions-top" style={{ gap: '.5rem', flexWrap: 'wrap' }}>
                    {/* UPDATED: instead of Link, open modal */}
                    <button
                      className="action-btn primary"
                      onClick={() => setSelectedLoanId(loan.id)}
                    >
                      💬 View Convo / 💵 Make Offer
                    </button>
 
                  </div>
                </div>

                {/* Collapsible details */}
                {isOpen && (
                  <div
                    id={`loan-details-${loan.id}`}
                    className="lm-details"
                    role="region"
                    aria-label={`Loan details for ${name}`}
                  >
                    <div className="lm-details-grid" />
                    {/* Inline public discussion */}
                    <InlineDiscussion threadId={loan.id} limit={5} compact showHeader={false} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Profile modal */}
      {profileUserId && (
        <UserProfileModal userId={profileUserId} onClose={() => setProfileUserId(null)} />
      )}

      {/* Offer modal */}
      {selectedLoanId && (
        <OfferModal loanId={selectedLoanId} onClose={() => setSelectedLoanId(null)} />
      )}
    </div>
  );
}


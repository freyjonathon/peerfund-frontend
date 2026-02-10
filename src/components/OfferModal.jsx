// src/components/OfferModal.jsx
import React, { useEffect, useMemo, useState } from 'react';
import './OfferModal.css';
import InlineDiscussion from '../features/loans/InlineDiscussion';
import { apiFetch, getToken } from '../utils/api';

const fmtMoney = (n) =>
  typeof n === 'number' && !Number.isNaN(n) ? `$${n.toFixed(2)}` : '—';

function getCurrentUserIdFromJwt() {
  const t = getToken();
  if (!t) return null;
  try {
    const payload = JSON.parse(atob((t.split('.')[1] || '').replace(/-/g, '+').replace(/_/g, '/')));
    return payload?.userId ?? payload?.id ?? null;
  } catch {
    return null;
  }
}

export default function OfferModal({ loanId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [loan, setLoan] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [acceptingId, setAcceptingId] = useState(null);

  const [offerForm, setOfferForm] = useState({
    amount: '',
    duration: '',
    interestRate: '',
    message: '',
  });

  const me = useMemo(() => getCurrentUserIdFromJwt(), []);

  // Borrower detection that survives different backend shapes
  const borrowerId =
    loan?.borrowerId ||
    loan?.borrower?.id ||
    loan?.userId || // fallback some apps use
    null;

  const isBorrower = borrowerId && me && String(borrowerId) === String(me);

  // Determine status (some backends call it OPEN/ACCEPTED/FUNDED on request, some have loanRequestStatus)
  const requestStatus = String(
    loan?.status || loan?.loanRequestStatus || loan?.state || 'OPEN'
  ).toUpperCase();

  // fetch loan (offers + borrower)
  useEffect(() => {
    let alive = true;

    (async () => {
      if (!loanId) return;
      try {
        setLoading(true);
        setErr('');

        // IMPORTANT: apiFetch prefixes API_BASE_URL + attaches token
        const data = await apiFetch(`/api/loans/${loanId}`);

        if (!alive) return;
        setLoan(data || null);
      } catch (e) {
        console.error('OfferModal load error:', e);

        // If token is invalid and apiFetch causes logout elsewhere, we just show message
        if (alive) setErr(e?.message || 'Failed to load loan/offers.');
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [loanId]);

  const onChange = (e) =>
    setOfferForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const reloadLoan = async () => {
    const data = await apiFetch(`/api/loans/${loanId}`);
    setLoan(data || null);
  };

  const submitOffer = async () => {
    // basic validation
    if (!offerForm.amount || !offerForm.duration || !offerForm.interestRate) {
      alert('Please fill amount, duration, and interest rate.');
      return;
    }

    const payload = {
      amount: Number(offerForm.amount),
      duration: Number(offerForm.duration),
      interestRate: Number(offerForm.interestRate),
      message: (offerForm.message || '').trim(),
    };

    if (!Number.isFinite(payload.amount) || payload.amount <= 0) {
      alert('Amount must be a positive number.');
      return;
    }
    if (!Number.isFinite(payload.duration) || payload.duration <= 0) {
      alert('Duration must be a positive number of months.');
      return;
    }
    if (!Number.isFinite(payload.interestRate) || payload.interestRate < 0) {
      alert('Interest rate must be a valid number.');
      return;
    }

    try {
      setSubmitting(true);
      setErr('');

      const created = await apiFetch(`/api/loans/${loanId}/offers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // optimistic update if backend returns the created offer
      setLoan((prev) => {
        if (!prev) return prev;
        const prevOffers = Array.isArray(prev.loanOffers) ? prev.loanOffers : [];
        return created
          ? { ...prev, loanOffers: [created, ...prevOffers] }
          : { ...prev, loanOffers: prevOffers };
      });

      setOfferForm({ amount: '', duration: '', interestRate: '', message: '' });

      // If created is not returned (some backends return {ok:true}), refresh
      if (!created?.id) {
        await reloadLoan();
      }
    } catch (e) {
      console.error('OfferModal submitOffer error:', e);
      alert(e?.message || 'Could not submit offer.');
    } finally {
      setSubmitting(false);
    }
  };

  const acceptOffer = async (offerId) => {
    if (!window.confirm('Accept this offer and create the loan contract?')) return;

    try {
      setErr('');
      setAcceptingId(offerId);

      await apiFetch(`/api/loans/offers/${offerId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      alert('Offer accepted. Contract created!');
      onClose?.();
    } catch (e) {
      console.error('OfferModal acceptOffer error:', e);
      alert(e?.message || 'Failed to accept offer.');
    } finally {
      setAcceptingId(null);
    }
  };

  if (!loanId) return null;

  const offers = Array.isArray(loan?.loanOffers) ? loan.loanOffers : [];

  return (
    <div className="ofm-backdrop" onClick={onClose}>
      <div className="ofm-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="ofm-header">
          <div className="ofm-title">Offers for this request</div>
          <button type="button" className="ofm-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="ofm-body">
          {loading ? (
            <div>Loading…</div>
          ) : err ? (
            <div className="pf-error">{err}</div>
          ) : !loan ? (
            <div className="pf-error">Not found.</div>
          ) : (
            <>
              {/* Snapshot */}
              <div className="ofm-stats">
                <div className="ofm-stat">
                  <div className="ofm-stat-label">Amount</div>
                  <div className="ofm-stat-value">{fmtMoney(Number(loan.amount))}</div>
                </div>
                <div className="ofm-stat">
                  <div className="ofm-stat-label">Duration</div>
                  <div className="ofm-stat-value">{Number(loan.duration) || '—'} months</div>
                </div>
                <div className="ofm-stat">
                  <div className="ofm-stat-label">Interest</div>
                  <div className="ofm-stat-value">
                    {Number.isFinite(Number(loan.interestRate)) ? `${Number(loan.interestRate)}%` : '—'}
                  </div>
                </div>
              </div>

              {/* Offers list */}
              <div style={{ marginBottom: 12 }}>
                <div className="ofm-section-title" style={{ fontWeight: 700, marginBottom: 6 }}>
                  Current Offers ({offers.length})
                </div>

                {offers.length ? (
                  offers.map((o) => {
                    const oStatus = String(o.status || '').toUpperCase(); // optional, depends on backend
                    const badgeText =
                      requestStatus !== 'OPEN'
                        ? 'Closed'
                        : oStatus === 'ACCEPTED'
                        ? 'Accepted'
                        : 'Pending';

                    const badgeStyle =
                      oStatus === 'ACCEPTED' || requestStatus !== 'OPEN'
                        ? { background: '#dcfce7', color: '#166534', borderColor: '#86efac' }
                        : { background: '#fef3c7', color: '#92400e', borderColor: '#fde68a' };

                    return (
                      <div key={o.id} className="ofm-offer-card">
                        <div className="ofm-offer-header">
                          <div className="ofm-offer-title">
                            <span
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: 999,
                                background: '#6366f1',
                                display: 'inline-block',
                              }}
                            />
                            <span>{o.lender?.name || 'Lender'}</span>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              gap: 12,
                              alignItems: 'center',
                              color: '#334155',
                              fontSize: 14,
                              flexWrap: 'wrap',
                              justifyContent: 'flex-end',
                            }}
                          >
                            <span>{fmtMoney(Number(o.amount))}</span>
                            <span>{Number(o.interestRate)}%</span>
                            <span>{Number(o.duration)} mo</span>
                            <span className="ofm-offer-badge" style={badgeStyle}>
                              {badgeText}
                            </span>
                          </div>
                        </div>

                        <div className="ofm-offer-body">
                          {o.message && (
                            <div style={{ marginBottom: 8, color: '#334155' }}>
                              <strong>Message:</strong> {o.message}
                            </div>
                          )}

                          {requestStatus === 'OPEN' && isBorrower && (
                            <button
                              type="button"
                              className="action-btn primary"
                              onClick={() => acceptOffer(o.id)}
                              disabled={acceptingId === o.id}
                              style={{
                                background: '#4f46e5',
                                color: '#fff',
                                border: '1px solid #4f46e5',
                                borderRadius: 10,
                                padding: '6px 10px',
                                fontWeight: 700,
                                cursor: acceptingId === o.id ? 'not-allowed' : 'pointer',
                                opacity: acceptingId === o.id ? 0.7 : 1,
                              }}
                            >
                              {acceptingId === o.id ? 'Accepting…' : 'Accept'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ color: '#64748b' }}>No offers yet—be the first!</div>
                )}
              </div>

              {/* Inline public discussion */}
              <div className="lm-details-grid" />
              <InlineDiscussion threadId={loan.id} limit={5} compact showHeader={false} />

              {/* Submit offer (for lenders) */}
              {requestStatus === 'OPEN' && !isBorrower && (
                <div className="ofm-offer-form">
                  <div className="ofm-section-title" style={{ fontWeight: 700, marginBottom: 8 }}>
                    Submit an Offer
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10 }}>
                    <div>
                      <label>Amount ($)</label>
                      <input type="number" name="amount" value={offerForm.amount} onChange={onChange} />
                    </div>
                    <div>
                      <label>Duration (months)</label>
                      <input type="number" name="duration" value={offerForm.duration} onChange={onChange} />
                    </div>
                    <div>
                      <label>Interest Rate (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="interestRate"
                        value={offerForm.interestRate}
                        onChange={onChange}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <label>Message (optional)</label>
                    <textarea
                      name="message"
                      rows={3}
                      value={offerForm.message}
                      onChange={onChange}
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <button
                      type="button"
                      className="action-btn"
                      onClick={reloadLoan}
                      disabled={submitting}
                    >
                      Refresh
                    </button>
                    <button type="button" disabled={submitting} onClick={submitOffer}>
                      {submitting ? 'Submitting…' : 'Submit Offer'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

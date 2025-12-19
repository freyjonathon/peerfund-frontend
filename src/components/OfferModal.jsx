// src/components/OfferModal.jsx
import React, { useEffect, useMemo, useState } from 'react';
import './OfferModal.css';
import InlineDiscussion from '../features/loans/InlineDiscussion';

const fmtMoney = (n) =>
  typeof n === 'number' && !Number.isNaN(n) ? `$${n.toFixed(2)}` : '—';

function getToken() {
  return localStorage.getItem('token') || '';
}
function getCurrentUserId() {
  const t = getToken();
  if (!t) return null;
  try {
    const payload = JSON.parse(atob(t.split('.')[1] || ''));
    return payload?.userId ?? null;
  } catch {
    return null;
  }
}

export default function OfferModal({ loanId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [loan, setLoan] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [offerForm, setOfferForm] = useState({
    amount: '',
    duration: '',
    interestRate: '',
    message: '',
  });

  const token = getToken();
  const me = useMemo(() => getCurrentUserId(), []);
  const isBorrower = loan?.borrower?.id && loan.borrower.id === me;

  // fetch loan (offers + borrower)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr('');
        const res = await fetch(`/api/loans/${loanId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        if (alive) setLoan(data);
      } catch (e) {
        if (alive) setErr('Failed to load loan/offers.');
        console.error(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [loanId, token]);

  const onChange = (e) =>
    setOfferForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submitOffer = async () => {
    if (!offerForm.amount || !offerForm.duration || !offerForm.interestRate) {
      alert('Please fill amount, duration, and interest rate.');
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch(`/api/loans/${loanId}/offers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(offerForm),
      });
      if (!res.ok) throw new Error(await res.text());
      const created = await res.json();

      // optimistic update
      setLoan((prev) =>
        prev
          ? { ...prev, loanOffers: [created, ...(prev.loanOffers || [])] }
          : prev
      );
      setOfferForm({ amount: '', duration: '', interestRate: '', message: '' });
    } catch (e) {
      console.error(e);
      alert('Could not submit offer.');
    } finally {
      setSubmitting(false);
    }
  };

  const acceptOffer = async (offerId) => {
    if (!window.confirm('Accept this offer and create the loan contract?')) return;
    try {
      const res = await fetch(`/api/loans/offers/${offerId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error(await res.text());
      await res.json();
      alert('Offer accepted. Contract created!');
      onClose?.();
    } catch (e) {
      console.error(e);
      alert('Failed to accept offer.');
    }
  };

  if (!loanId) return null;

  return (
    <div className="ofm-backdrop" onClick={onClose}>
      <div className="ofm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ofm-header">
          <div className="ofm-title">Offers for this request</div>
          <button className="ofm-close" onClick={onClose}>✕</button>
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
                  <div className="ofm-stat-value">{loan.duration} months</div>
                </div>
                <div className="ofm-stat">
                  <div className="ofm-stat-label">Interest</div>
                  <div className="ofm-stat-value">{loan.interestRate}%</div>
                </div>
              </div>

              {/* Offers list */}
              <div style={{ marginBottom: 12 }}>
                <div className="ofm-section-title" style={{ fontWeight: 700, marginBottom: 6 }}>
                  Current Offers ({loan.loanOffers?.length || 0})
                </div>

                {loan.loanOffers?.length ? (
                  loan.loanOffers.map((o) => (
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
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center', color: '#334155', fontSize: 14 }}>
                          <span>{fmtMoney(Number(o.amount))}</span>
                          <span>{o.interestRate}%</span>
                          <span>{o.duration} mo</span>
                          <span
                            className="ofm-offer-badge"
                            style={{
                              background: loan.status === 'FUNDED' ? '#dcfce7' : '#fef3c7',
                              color: loan.status === 'FUNDED' ? '#166534' : '#92400e',
                              borderColor: loan.status === 'FUNDED' ? '#86efac' : '#fde68a',
                            }}
                          >
                            {loan.status === 'FUNDED' ? 'Accepted' : 'Pending'}
                          </span>
                        </div>
                      </div>

                      <div className="ofm-offer-body">
                        {o.message && (
                          <div style={{ marginBottom: 8, color: '#334155' }}>
                            <strong>Message:</strong> {o.message}
                          </div>
                        )}

                        {loan.status === 'OPEN' && isBorrower && (
                          <button
                            className="action-btn primary"
                            onClick={() => acceptOffer(o.id)}
                            style={{
                              background: '#4f46e5',
                              color: '#fff',
                              border: '1px solid #4f46e5',
                              borderRadius: 10,
                              padding: '6px 10px',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Accept
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ color: '#64748b' }}>No offers yet—be the first!</div>
                )}
              </div>

                <div className="lm-details-grid" />
                                    {/* Inline public discussion */}
                                    <InlineDiscussion threadId={loan.id} limit={5} compact showHeader={false} />
                                  

              {/* Submit offer (for lenders) */}
              {loan.status === 'OPEN' && (!isBorrower) && (
                <div className="ofm-offer-form">
                  <div className="ofm-section-title" style={{ fontWeight: 700, marginBottom: 8 }}>
                    Submit an Offer
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10 }}>
                    <div>
                      <label>Amount ($)</label>
                      <input
                        type="number"
                        name="amount"
                        value={offerForm.amount}
                        onChange={onChange}
                      />
                    </div>
                    <div>
                      <label>Duration (months)</label>
                      <input
                        type="number"
                        name="duration"
                        value={offerForm.duration}
                        onChange={onChange}
                      />
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

                  <div style={{ marginTop: 10 }}>
                    <button
                      disabled={submitting}
                      onClick={submitOffer}
                    >
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

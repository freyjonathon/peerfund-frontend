// src/features/money/MoneySummary.jsx
import React, { useEffect, useState, useCallback } from 'react';
import './MoneySummary.css';
import LoanThreadModal from '../loans/LoanThreadModal';
import OfferModal from '../../components/OfferModal';
import RepaymentButton from '../loans/RepaymentButton';

/* ----------------------- helpers ----------------------- */

// decode JWT for current user id
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

const fmtMoney = (n) =>
  typeof n === 'number' && !Number.isNaN(n) ? `$${n.toFixed(2)}` : '—';

// compact row layout
const ROW_GRID = {
  display: 'grid',
  gridTemplateColumns: 'minmax(140px,1fr) 120px 140px auto auto',
  alignItems: 'center',
  gap: 10,
};

async function authFetch(url, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });
  if (res.status === 401) {
    try {
      console.warn('401 on', url, await res.text());
    } catch {}
    window.location.assign('/login');
    throw new Error('Unauthorized');
  }
  return res;
}

function isLoanPaidOff(loan) {
  const s = (loan.status || '').toUpperCase();

  // Explicit status flags
  if (['PAID_OFF', 'COMPLETED', 'CLOSED'].includes(s)) return true;

  // Remaining principal flags
  if (typeof loan.remainingPrincipal === 'number' && loan.remainingPrincipal <= 0) {
    return true;
  }
  if (
    typeof loan.remainingPrincipalCents === 'number' &&
    loan.remainingPrincipalCents <= 0
  ) {
    return true;
  }

  // Frontend-only inference (no next due date + no installment amount)
  const hasNextDue = !!loan.nextDueDate;
  const installment =
    typeof loan.installmentAmount === 'number' ? loan.installmentAmount : null;

  if (!hasNextDue && (installment === null || installment <= 0)) {
    return true;
  }

  return false;
}

function sortLoansWithPaidOffLast(list) {
  return [...list].sort((a, b) => {
    const aDone = isLoanPaidOff(a);
    const bDone = isLoanPaidOff(b);
    if (aDone === bDone) return 0;
    return aDone ? 1 : -1; // active first, paid-off last
  });
}

/* ------------------------- Small inline modal ------------------------- */

function LinkBankFirstModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 520,
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
          padding: 20,
        }}
      >
        <h3 style={{ margin: 0 }}>Add a bank to receive funds</h3>
        <p style={{ color: '#334155', marginTop: 8 }}>
          Before you can accept an offer, please link a bank account for loan
          disbursement on the Payment Method page.
        </p>
        <div
          style={{
            display: 'flex',
            gap: 8,
            justifyContent: 'flex-end',
            marginTop: 14,
          }}
        >
          <button className="action-btn sm" onClick={onClose}>
            Close
          </button>
          <button
            className="action-btn sm primary"
            onClick={() => {
              window.location.assign('/payment-method');
            }}
          >
            Go to Payment Method
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------- Open request row ------------------------- */

function OpenRequestRow({
  req,
  isExpanded,
  onToggle,
  actionLoading,
  offersContent, // React node for market/borrower offers list
  onMakeOffer, // fn for market/lender to open OfferModal
  onAcceptDirect, // fn for direct approve
  onDeclineDirect, // fn for direct decline
}) {
  const isMarket = req.type === 'market';
  const isBorrowing = req.role === 'Borrowing';

  return (
    <div className="ms-card" key={req.id}>
      {/* ONE-LINE TOP ROW */}
      <div className="ms-card-row" style={ROW_GRID}>
        <div>
          <div className="ms-label">Counterparty</div>
          <div className="ms-value-strong">
            {req.counterpartyName || 'Unknown'}
            <span style={{ marginLeft: 8, color: '#64748b', fontWeight: 600 }}>
              • {req.role}
            </span>
          </div>
        </div>

        <div>
          <div className="ms-label">Amount</div>
          <div className="ms-value-strong">{fmtMoney(req.amount)}</div>
        </div>

        <div style={{ justifySelf: 'end' }}>
          <span className="ms-badge ms-badge--warn">Open</span>
        </div>

        <div style={{ justifySelf: 'end', display: 'flex', gap: 8 }}>
          <button
            className="action-btn sm"
            onClick={onToggle}
            title="View request"
          >
            {isExpanded ? '🔽 Hide' : '📄 View'}
          </button>
        </div>
      </div>

      {/* DETAILS */}
      {isExpanded && (
        <div className="ms-details">
          <p className="mt-6">
            <strong>Status:</strong> {req.status ?? 'OPEN'}
          </p>
          <p className="mt-6">
            <strong>Interest Rate:</strong>{' '}
            {Number.isFinite(req.interestRate) ? `${req.interestRate}%` : '—'}
          </p>
          <p className="mt-6">
            <strong>Duration:</strong>{' '}
            {Number.isFinite(req.duration) ? `${req.duration} months` : '—'}
          </p>
          {req.purpose ? (
            <p className="mt-6">
              <strong>Reason:</strong> {req.purpose}
            </p>
          ) : null}

          {/* MARKET: Borrowing => show the actual offers placed by lenders */}
          {isMarket && isBorrowing && offersContent}

          {/* MARKET: Lending => allow me to place an offer */}
          {isMarket && !isBorrowing && (
            <div
              className="mt-8"
              style={{ display: 'flex', justifyContent: 'flex-end' }}
            >
              <button className="action-btn sm primary" onClick={onMakeOffer}>
                💵 Make Offer
              </button>
            </div>
          )}

          {/* DIRECT requests => approve/decline */}
          {!isMarket && (
            <div
              className="mt-8"
              style={{
                display: 'flex',
                gap: 8,
                justifyContent: 'flex-end',
              }}
            >
              <button
                className="action-btn sm primary"
                onClick={onAcceptDirect}
                disabled={!!actionLoading[req.id]}
              >
                {actionLoading[req.id] ? 'Working…' : 'Accept'}
              </button>
              <button
                className="action-btn sm"
                onClick={onDeclineDirect}
                disabled={!!actionLoading[req.id]}
              >
                {actionLoading[req.id] ? 'Working…' : 'Decline'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* -------------------------------- Parent -------------------------------- */

export default function MoneySummary() {
  const [summary, setSummary] = useState({
    loansGiven: [],
    loansReceived: [],
    myOpenRequests: [],
  });
  const [loading, setLoading] = useState(true);

  const [expanded, setExpanded] = useState({});
  const [openSec, setOpenSec] = useState({
    open: true,
    given: true,
    received: true,
  });

  const [actionLoading, setActionLoading] = useState({});
  const [threadLoanId, setThreadLoanId] = useState(null);

  // marketplace offers cache per loanId
  const [offersByLoanId, setOffersByLoanId] = useState({});
  const [offersLoading, setOffersLoading] = useState({});
  const [offerWorking, setOfferWorking] = useState({});
  const [offerModalLoanId, setOfferModalLoanId] = useState(null);

  // cached: does borrower have a payment method for loan funding
  const [hasLoanPM, setHasLoanPM] = useState(null); // null=unknown, true/false known
  const [showLinkModal, setShowLinkModal] = useState(false);

  const checkHasLoanPaymentMethod = useCallback(async () => {
    if (hasLoanPM !== null) return hasLoanPM;
    try {
      const r = await authFetch('/api/stripe/has-loan-payment-method');
      if (!r.ok) throw new Error('has-loan-payment-method failed');
      const d = await r.json();
      const val = !!d?.hasLoanPaymentMethod;
      setHasLoanPM(val);
      return val;
    } catch {
      setHasLoanPM(false);
      return false;
    }
  }, [hasLoanPM]);

  /* ------------------ Fetch helpers (market + direct) ------------------ */

  const fetchMarketOpenRequests = useCallback(async () => {
    const me = getCurrentUserId();
    if (!me) return [];

    const rows = [];

    // (A) Requests where I am the LENDER (I’ve made an offer)
    try {
      const r = await authFetch('/api/loans/offers/mine');
      if (r.ok) {
        const data = await r.json();
        const items = Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data)
          ? data
          : [];
        for (const it of items) {
          rows.push({
            type: 'market',
            id: it.id, // loanRequest id
            amount: Number(it.amount),
            duration: Number(it.duration),
            interestRate: Number(it.myOffer?.interestRate ?? it.interestRate),
            purpose: it.purpose || '',
            createdAt: it.createdAt || null,
            borrowerId: it.borrower?.id,
            borrowerName: it.borrower?.name || 'Borrower',
            counterpartyName: it.borrower?.name || 'Borrower',
            role: 'Lending',
            status: it.status || 'OPEN',
            myOffer: it.myOffer
              ? {
                  id: it.myOffer.id,
                  amount: Number(it.myOffer.amount),
                  duration: Number(it.myOffer.duration),
                  interestRate: Number(it.myOffer.interestRate),
                  createdAt: it.myOffer.createdAt,
                }
              : null,
          });
        }
      }
    } catch {
      /* ignore */
    }

    // (B) My OPEN requests that already have offers
    let mineOpen = [];
    try {
      const rAll = await authFetch('/api/loans/open');
      if (rAll.ok) {
        const rawAll = await rAll.json();
        const listAll = Array.isArray(rawAll) ? rawAll : rawAll?.items || [];
        mineOpen = listAll.filter(
          (x) =>
            (x.status || 'OPEN').toUpperCase() === 'OPEN' &&
            String(x.borrowerId || x?.borrower?.id) === String(me)
        );
      }
    } catch {
      /* ignore */
    }

    const keepNow = [];
    const toProbe = [];
    for (const req of mineOpen) {
      const offersArr = Array.isArray(req.loanOffers) ? req.loanOffers : [];
      const offerCount =
        typeof req?._count?.loanOffers === 'number'
          ? req._count.loanOffers
          : offersArr.length;

      if (offerCount > 0) keepNow.push(req);
      else toProbe.push(req);
    }

    if (toProbe.length) {
      const probed = await Promise.all(
        toProbe.map(async (req) => {
          try {
            const r = await authFetch(`/api/loans/${req.id}/offers`);
            const arr = r.ok ? await r.json() : [];
            if (Array.isArray(arr) && arr.length > 0) {
              setOffersByLoanId((m) => ({ ...m, [req.id]: arr }));
              return req;
            }
          } catch {}
          return null;
        })
      );
      keepNow.push(...probed.filter(Boolean));
    }

    for (const req of keepNow) {
      const borrowerId = req.borrowerId || req?.borrower?.id || me;
      rows.push({
        type: 'market',
        id: req.id,
        amount: Number(req.amount),
        duration: Number(req.duration ?? req.months),
        interestRate: Number(req.interestRate ?? req.apr),
        purpose: req.purpose || '',
        createdAt: req.createdAt || null,
        borrowerId,
        borrowerName: req?.borrower?.name || 'You',
        counterpartyName: '— Borrowing',
        role: 'Borrowing',
        status: req.status || 'OPEN',
      });
    }

    const seen = new Set();
    return rows.filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)));
  }, []);

  const fetchDirectOpenRequests = useCallback(async () => {
    const me = getCurrentUserId();
    if (!me) return [];
    try {
      const r = await authFetch('/api/direct-requests/open/mine');
      if (!r.ok) return [];
      const rows = await r.json();
      return (Array.isArray(rows) ? rows : []).map((d) => {
        const borrowerId = d.borrowerId || d?.borrower?.id;
        const lenderId = d.lenderId || d?.lender?.id;
        const iAmBorrower = String(borrowerId) === String(me);
        return {
          type: 'direct',
          id: d.id,
          amount: Number(d.amount),
          duration: Number(d.months ?? d.duration),
          interestRate: Number(d.apr ?? d.interestRate),
          createdAt: d.createdAt || null,
          borrowerId,
          borrowerName: d?.borrower?.name || (iAmBorrower ? 'You' : ''),
          lenderId,
          lenderName: d?.lender?.name || (!iAmBorrower ? 'You' : ''),
          counterpartyName: iAmBorrower
            ? d?.lender?.name || 'Lender'
            : d?.borrower?.name || 'Borrower',
          role: iAmBorrower ? 'Borrowing' : 'Lending',
          status: d.status || 'PENDING',
        };
      });
    } catch {
      return [];
    }
  }, []);

  const fetchSummary = useCallback(
    async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      setLoading(true);
      try {
        const res = await authFetch('/api/users/my-money-summary');
        let loansGiven = [];
        let loansReceived = [];

        if (res.ok) {
          const data = await res.json();
          loansGiven = Array.isArray(data.loansGiven)
            ? data.loansGiven
            : Array.isArray(data.loansAsLender)
            ? data.loansAsLender
            : [];
          loansReceived = Array.isArray(data.loansReceived)
            ? data.loansReceived
            : Array.isArray(data.loansAsBorrower)
            ? data.loansAsBorrower
            : [];
        }

        const [marketOpen, directOpen] = await Promise.all([
          fetchMarketOpenRequests(),
          fetchDirectOpenRequests(),
        ]);

        setSummary({
          loansGiven: sortLoansWithPaidOffLast(loansGiven),
          loansReceived: sortLoansWithPaidOffLast(loansReceived),
          myOpenRequests: [...marketOpen, ...directOpen],
        });
      } catch (err) {
        console.error('Error fetching money summary:', err);
        setSummary({ loansGiven: [], loansReceived: [], myOpenRequests: [] });
      } finally {
        setLoading(false);
      }
    },
    [fetchMarketOpenRequests, fetchDirectOpenRequests]
  );

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const toggleDetails = async (req) => {
    setExpanded((prev) => {
      const collapsed = Object.keys(prev).reduce(
        (acc, k) => ({ ...acc, [k]: false }),
        {}
      );
      return { ...collapsed, [req.id]: !prev[req.id] };
    });

    if (req.type === 'market' && req.role === 'Borrowing') {
      if (!offersByLoanId[req.id] && !offersLoading[req.id]) {
        await loadOffers(req.id);
      }
    }
  };

  /* -------------------- Offers (marketplace) -------------------- */

  const loadOffers = async (loanId) => {
    setOffersLoading((m) => ({ ...m, [loanId]: true }));
    try {
      const r = await authFetch(`/api/loans/${loanId}/offers`);
      const items = r.ok ? await r.json() : [];
      setOffersByLoanId((m) => ({
        ...m,
        [loanId]: Array.isArray(items) ? items : [],
      }));
    } catch (e) {
      console.error('loadOffers error', e);
      setOffersByLoanId((m) => ({ ...m, [loanId]: [] }));
    } finally {
      setOffersLoading((m) => ({ ...m, [loanId]: false }));
    }
  };

  const acceptOffer = async (offer) => {
    setOfferWorking((m) => ({ ...m, [offer.id]: true }));

    try {
      // 1) Optional: ensure borrower has payout method on file
      const ok = await checkHasLoanPaymentMethod();
      if (!ok) {
        setShowLinkModal(true);
        setOfferWorking((m) => ({ ...m, [offer.id]: false }));
        return;
      }

      // 2) Accept the offer -> server creates the Loan (status: ACCEPTED)
      const r = await authFetch(`/api/loans/offers/${offer.id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = r.ok ? await r.json() : null;

      if (!r.ok || !data?.loan?.id) {
        const t = !r.ok ? await r.text().catch(() => '') : '';
        throw new Error(t || data?.error || 'Failed to accept offer');
      }

      console.log('✅ Offer accepted response:', data);

      // 3) Just refresh the summary; funding is done later by the lender
      await fetchSummary();
      alert('Loan accepted and contract saved. Waiting for lender to fund from their PeerFund wallet.');
    } catch (e) {
      console.error(e);
      alert(`Action failed:\n${e.message || e}`);
    } finally {
      setOfferWorking((m) => ({ ...m, [offer.id]: false }));
    }
  };

  /* -------------------- Direct request actions -------------------- */

  async function tryEndpoints(methods, url, body) {
    const optionsBase = {
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    };
    let lastErr = null;
    for (const method of methods) {
      try {
        const r = await authFetch(url, { method, ...optionsBase });
        if (r.ok) return r;
        const txt = await r.text().catch(() => '');
        lastErr = new Error(
          `${r.status} ${r.statusText}${txt ? ` • ${txt}` : ''}`
        );
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr || new Error('All methods failed');
  }

  const acceptDirect = async (req) => {
    setActionLoading((m) => ({ ...m, [req.id]: true }));
    try {
      const urls = [
        `/api/direct-requests/${req.id}/approve`,
        `/api/direct-requests/${req.id}/accept`,
        `/api/direct-requests/${req.id}/respond?action=ACCEPT`,
      ];
      let ok = false;
      let last = null;
      for (const u of urls) {
        try {
          await tryEndpoints(['POST', 'PUT', 'PATCH'], u);
          ok = true;
          break;
        } catch (e) {
          last = e;
        }
      }
      if (!ok) throw last || new Error('Approve failed');
      await fetchSummary();
    } catch (e) {
      console.error(e);
      alert(`Action failed:\n${e.message || e}`);
    } finally {
      setActionLoading((m) => ({ ...m, [req.id]: false }));
    }
  };

  const declineDirect = async (req) => {
    setActionLoading((m) => ({ ...m, [req.id]: true }));
    try {
      const urls = [
        `/api/direct-requests/${req.id}/decline`,
        `/api/direct-requests/${req.id}/reject`,
        `/api/direct-requests/${req.id}/respond?action=DECLINE`,
      ];
      let ok = false;
      let last = null;
      for (const u of urls) {
        try {
          await tryEndpoints(['POST', 'PUT', 'PATCH'], u);
          ok = true;
          break;
        } catch (e) {
          last = e;
        }
      }
      if (!ok) throw last || new Error('Decline failed');
      await fetchSummary();
    } catch (e) {
      console.error(e);
      alert(`Action failed:\n${e.message || e}`);
    } finally {
      setActionLoading((m) => ({ ...m, [req.id]: false }));
    }
  };

  /* ------------------------------- Funding (lender-side) ------------------------------- */

  const [funding, setFunding] = useState({}); // track loading per-loan

  const handleFundLoan = async (loanId) => {
    if (!loanId) return;
    setFunding((m) => ({ ...m, [loanId]: true }));
    try {
      const res = await authFetch(`/api/loans/${loanId}/fund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        console.error('Fund loan failed:', res.status, txt);
        alert(
          `Funding failed (${res.status}).\n${
            txt || 'Check backend logs for details.'
          }`
        );
        return;
      }

      const data = await res.json().catch(() => ({}));
      console.log('✅ Loan funded response:', data);
      alert('Loan successfully funded from your PeerFund wallet.');
      // Refresh Money Summary + wallets/transactions in UI
      await fetchSummary();
    } catch (err) {
      console.error('Fund loan error:', err);
      alert(`Funding error:\n${err.message || err}`);
    } finally {
      setFunding((m) => ({ ...m, [loanId]: false }));
    }
  };

  /* ------------------------------- Renderers ------------------------------- */

  const renderOffersBlock = (loanId) => {
    const loading = !!offersLoading[loanId];
    const offers = offersByLoanId[loanId] || [];
    return (
      <div className="mt-8">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 6,
          }}
        >
          <strong>Active Offers</strong>
          <button
            className="action-btn xs"
            onClick={() => loadOffers(loanId)}
            disabled={loading}
            title="Refresh offers"
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
        {loading ? (
          <p className="ms-muted">Loading offers…</p>
        ) : offers.length === 0 ? (
          <p className="ms-muted">No offers yet—be the first!</p>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {offers.map((of) => (
              <div
                key={of.id}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  padding: '8px 10px',
                  display: 'grid',
                  gridTemplateColumns:
                    'minmax(160px,1fr) 120px 120px 120px auto',
                  gap: 8,
                  alignItems: 'center',
                }}
              >
                <div style={{ fontWeight: 600 }}>
                  {of?.lender?.name || 'Lender'}
                </div>
                <div>{fmtMoney(Number(of.amount) || 0)}</div>
                <div>
                  {Number.isFinite(of.duration) ? `${of.duration} mo` : '—'}
                </div>
                <div>
                  {Number.isFinite(of.interestRate)
                    ? `${of.interestRate}%`
                    : '—'}
                </div>
                <div
                  style={{
                    justifySelf: 'end',
                    display: 'flex',
                    gap: 6,
                  }}
                >
                  <button
                    className="action-btn xs primary"
                    onClick={() => acceptOffer(of)}
                    disabled={!!offerWorking[of.id]}
                  >
                    {offerWorking[of.id] ? 'Working…' : 'Accept'}
                  </button>
                </div>
                {of.message ? (
                  <div
                    style={{
                      gridColumn: '1 / -1',
                      color: '#334155',
                      fontSize: 13,
                    }}
                  >
                    <strong>Message:</strong> {of.message}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderLoanCard = (loan, isLender, idx) => {
    const key = loan?.id || loan?._id || String(idx);
    const loanId = loan.id || loan._id;
    const isExpanded = !!expanded[key];
    const otherParty = isLender ? loan.borrowerName : loan.lenderName;

    const rawStatus = (loan.status || '').toUpperCase();
    const isPaidOff = isLoanPaidOff(loan);
    const isBorrower = !isLender;

    const badgeClass =
      isPaidOff
        ? 'ms-badge ms-badge--muted'
        : rawStatus === 'FUNDED'
        ? 'ms-badge ms-badge--ok'
        : 'ms-badge ms-badge--warn';

    const cardClass = `ms-card${isPaidOff ? ' ms-card--paid-off' : ''}`;

    return (
      <div className={cardClass} key={key}>
        <div className="ms-card-row" style={ROW_GRID}>
          <div>
            <div className="ms-label">{isLender ? 'Borrower' : 'Lender'}</div>
            <div className="ms-value-strong">{otherParty || 'Unknown'}</div>
          </div>

          <div>
            <div className="ms-label">Amount</div>
            <div className="ms-value-strong">{fmtMoney(loan.amount)}</div>
          </div>

          {/* simple status in the header row */}
          <div>
            <div className="ms-label">Status</div>
            <div className="ms-value-strong">
              <span className={badgeClass}>{loan.status || '—'}</span>
            </div>
          </div>

          <div style={{ justifySelf: 'end', display: 'flex', gap: 8 }}>
            <button
              onClick={() => setThreadLoanId(loanId)}
              className="action-btn sm"
              title="Open conversation"
            >
              💬 Messages
            </button>
            <button
              onClick={() => setExpanded((m) => ({ ...m, [key]: !isExpanded }))}
              className="action-btn sm"
              title="View contract"
            >
              {isExpanded ? '🔽 Hide' : '📄 View'}
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="ms-details">
            {loan.status && (
              <p className="mt-6">
                <strong>Status:</strong> {loan.status}
              </p>
            )}
            <p className="mt-6">
              <strong>Interest Rate:</strong>{' '}
              {typeof loan.interestRate === 'number'
                ? `${loan.interestRate}%`
                : '—'}
            </p>
            <p className="mt-6">
              <strong>Duration:</strong>{' '}
              {typeof loan.duration === 'number'
                ? `${loan.duration} months`
                : '—'}
            </p>
            <p className="mt-6">
              <strong>Next Due Date:</strong>{' '}
              {loan.nextDueDate
                ? new Date(loan.nextDueDate).toLocaleDateString()
                : '—'}
            </p>
            <p className="mt-6">
              <strong>Installment (this period):</strong>{' '}
              {fmtMoney(loan.installmentAmount)}
            </p>

            {/* Paid-off note */}
            {isPaidOff && (
              <p className="mt-6 ms-muted">
                <strong>Repayment:</strong> Loan fully repaid. No further
                installments.
              </p>
            )}

            {/* Borrower view: pay next installment */}
            {isBorrower && !isPaidOff && (
              <div className="mt-8">
                <RepaymentButton loanId={loanId} onPaid={fetchSummary} />
              </div>
            )}

            {/* Lender view: fund ACCEPTED loans from wallet */}
            {isLender && !isPaidOff && rawStatus === 'ACCEPTED' && (
              <div className="mt-8" style={{ display: 'flex', gap: 8 }}>
                <button
                  className="action-btn sm primary"
                  onClick={() => handleFundLoan(loanId)}
                  disabled={!!funding[loanId]}
                >
                  {funding[loanId] ? 'Funding…' : 'Fund from PeerFund wallet'}
                </button>
                <span className="ms-muted" style={{ alignSelf: 'center' }}>
                  Requires enough wallet balance
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  /* ------------------------------- Render ------------------------------- */

  if (loading)
    return (
      <p className="ms-loading ms-container">Loading money summary...</p>
    );

  const given = Array.isArray(summary.loansGiven) ? summary.loansGiven : [];
  const received = Array.isArray(summary.loansReceived)
    ? summary.loansReceived
    : [];
  const myOpen = Array.isArray(summary.myOpenRequests)
    ? summary.myOpenRequests
    : [];

  return (
    <div className="ms-container">
      <h2 className="ms-heading">💵 My Money Summary</h2>

      {/* Section: Open Requests */}
      <div className="ms-section">
        <button
          className="ms-section-head"
          onClick={() => setOpenSec((s) => ({ ...s, open: !s.open }))}
          aria-expanded={openSec.open}
        >
          <div className="ms-subheading">My Open Loan Requests</div>
          <div className="ms-caret">{openSec.open ? '▾' : '▸'}</div>
        </button>
        {openSec.open && (
          <div className="ms-section-body">
            {myOpen.length === 0 ? (
              <p className="ms-empty">You have no open requests.</p>
            ) : (
              myOpen.map((req) => (
                <OpenRequestRow
                  key={req.id}
                  req={req}
                  isExpanded={!!expanded[req.id]}
                  onToggle={() => toggleDetails(req)}
                  actionLoading={actionLoading}
                  // MARKET + Borrowing: offers block (as a React node)
                  offersContent={
                    req.type === 'market' && req.role === 'Borrowing'
                      ? renderOffersBlock(req.id)
                      : undefined
                  }
                  // MARKET + Lending: open OfferModal
                  onMakeOffer={
                    req.type === 'market' && req.role === 'Lending'
                      ? () => setOfferModalLoanId(req.id)
                      : undefined
                  }
                  // DIRECT actions
                  onAcceptDirect={
                    req.type === 'direct'
                      ? () => acceptDirect(req)
                      : undefined
                  }
                  onDeclineDirect={
                    req.type === 'direct'
                      ? () => declineDirect(req)
                      : undefined
                  }
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Section: Loans Given */}
      <div className="ms-section">
        <button
          className="ms-section-head"
          onClick={() => setOpenSec((s) => ({ ...s, given: !s.given }))}
          aria-expanded={openSec.given}
        >
          <div className="ms-subheading">Loans Given (I'm the Lender)</div>
          <div className="ms-caret">{openSec.given ? '▾' : '▸'}</div>
        </button>
        {openSec.given && (
          <div className="ms-section-body">
            {given.length === 0 ? (
              <p className="ms-empty">No loans given yet.</p>
            ) : (
              given.map((loan, idx) => renderLoanCard(loan, true, idx))
            )}
          </div>
        )}
      </div>

      {/* Section: Loans Received */}
      <div className="ms-section">
        <button
          className="ms-section-head"
          onClick={() =>
            setOpenSec((s) => ({ ...s, received: !s.received }))
          }
          aria-expanded={openSec.received}
        >
          <div className="ms-subheading">
            Loans Received (I'm the Borrower)
          </div>
          <div className="ms-caret">{openSec.received ? '▾' : '▸'}</div>
        </button>
        {openSec.received && (
          <div className="ms-section-body">
            {received.length === 0 ? (
              <p className="ms-empty">No loans received yet.</p>
            ) : (
              received.map((loan, idx) => renderLoanCard(loan, false, idx))
            )}
          </div>
        )}
      </div>

      {threadLoanId && (
        <LoanThreadModal
          loanId={threadLoanId}
          onClose={() => setThreadLoanId(null)}
        />
      )}

      {offerModalLoanId && (
        <OfferModal
          loanId={offerModalLoanId}
          onClose={() => setOfferModalLoanId(null)}
        />
      )}

      <LinkBankFirstModal
        open={showLinkModal}
        onClose={() => setShowLinkModal(false)}
      />
    </div>
  );
}

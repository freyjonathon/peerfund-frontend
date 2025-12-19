// src/features/direct/DirectRequestForm.jsx
import React, { useEffect, useState, useMemo } from 'react';

const authHeaders = () => {
  const t = localStorage.getItem('token');
  return t ? { Authorization: `Bearer ${t}` } : {};
};

export default function DirectRequestForm({ lenderId }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  // form fields
  const [selectedListingId, setSelectedListingId] = useState('');
  const [amount, setAmount] = useState('');
  const [months, setMonths] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const chosen = useMemo(
    () => listings.find(l => l.id === selectedListingId),
    [listings, selectedListingId]
  );

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      setLoading(true);
      setErr('');
      try {
        const r = await fetch(`/api/direct-requests/listings/${lenderId}`, {
          headers: { ...authHeaders() },
          signal: ac.signal,
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const d = await r.json();
        setListings(d.items || []);
        if ((d.items || []).length) setSelectedListingId(d.items[0].id);
      } catch (e) {
        setErr(e.message || 'Failed to load listings.');
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [lenderId]);

  const withinRange = (n, min, max) =>
    Number.isFinite(n) && (min == null || n >= min) && (max == null || n <= max);

  async function submitRequest(e) {
    e.preventDefault();
    setErr('');
    setResult(null);

    if (!selectedListingId) { setErr('Please choose a listing.'); return; }

    const amt = Number(amount);
    const mon = Number(months);

    if (!withinRange(amt, chosen?.minAmount, chosen?.maxAmount)) {
      setErr(`Amount must be between ${chosen?.minAmount} and ${chosen?.maxAmount}.`);
      return;
    }
    if (!withinRange(mon, chosen?.minMonths, chosen?.maxMonths)) {
      setErr(`Months must be between ${chosen?.minMonths} and ${chosen?.maxMonths}.`);
      return;
    }

    setSubmitting(true);
    try {
      const r = await fetch('/api/direct-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          listingId: selectedListingId,
          amount: amt,
          months: mon,
          message: message || undefined,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed to create request');
      setResult(d);
    } catch (e) {
      setErr(e.message || 'Request failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p>Loading lender’s offers…</p>;
  if (err) return <div style={{color:'#7c2d12', background:'#fff7ed', border:'1px solid #fed7aa', padding:10, borderRadius:8}}>{err}</div>;
  if (!listings.length) return <p>This lender has no active listings.</p>;

  return (
    <form onSubmit={submitRequest} style={{display:'grid', gap:10, maxWidth:480}}>
      <label>
        Lender Offer
        <select
          value={selectedListingId}
          onChange={e => setSelectedListingId(e.target.value)}
          style={{width:'100%', padding:'8px 10px', border:'1px solid #e2e8f0'}}
        >
          {listings.map(l => (
            <option key={l.id} value={l.id}>
              {`${l.apr}% APR • $${l.minAmount}-${l.maxAmount} • ${l.minMonths}-${l.maxMonths} mo`}
              {l.autoApprove ? ' • Auto-approve' : ''}
            </option>
          ))}
        </select>
      </label>

      {chosen && (
        <div style={{fontSize:12, color:'#475569'}}>
          {chosen.description ? <div>{chosen.description}</div> : null}
          Range: ${chosen.minAmount}–${chosen.maxAmount}, {chosen.minMonths}–{chosen.maxMonths} months.
          {chosen.autoApprove && (
            <> Auto-approve up to ${chosen.autoApproveUpTo ?? chosen.maxAmount}.</>
          )}
        </div>
      )}

      <label>
        Amount
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="e.g., 500"
          style={{width:'100%', padding:'8px 10px', border:'1px solid #e2e8f0'}}
          required
        />
      </label>

      <label>
        Months
        <input
          type="number"
          value={months}
          onChange={e => setMonths(e.target.value)}
          placeholder="e.g., 6"
          style={{width:'100%', padding:'8px 10px', border:'1px solid #e2e8f0'}}
          required
        />
      </label>

      <label>
        Message <span style={{color:'#64748b'}}>(optional)</span>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={3}
          style={{width:'100%', padding:'8px 10px', border:'1px solid #e2e8f0'}}
          placeholder="Any context you want to share with the lender…"
        />
      </label>

      <button
        type="submit"
        disabled={submitting}
        style={{background:'#4f46e5', color:'#fff', border:'1px solid #4f46e5', padding:'10px 14px', cursor:'pointer'}}
      >
        {submitting ? 'Sending…' : 'Send Request'}
      </button>

      {result && (
        <div style={{background:'#ecfeff', border:'1px solid #a5f3fc', padding:10}}>
          {result.autoApproved
            ? '✅ Auto-approved! A loan record was created.'
            : '✅ Request sent to lender.'}
        </div>
      )}
    </form>
  );
}

import React, { useEffect, useState } from 'react';

const authHeaders = () => {
  const t = localStorage.getItem('token');
  return t ? { Authorization: `Bearer ${t}` } : {};
};

function Row({ r }) {
  return (
    <tr>
      <td>{r.borrower?.name}</td>
      <td>{r.lender?.name}</td>
      <td>${Number(r.amount).toFixed(2)}</td>
      <td>{r.months} mo</td>
      <td>{r.apr}%</td>
      <td>{r.status}</td>
      <td>{r.decidedAt ? new Date(r.decidedAt).toLocaleDateString() : '—'}</td>
    </tr>
  );
}

export default function MyDirectRequests() {
  const [role, setRole] = useState('borrower'); // or 'lender'
  const [items, setItems] = useState([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      setLoading(true);
      setErr('');
      try {
        const r = await fetch(`/api/direct-requests?role=${role}`, {
          headers: { ...authHeaders() },
          signal: ac.signal,
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
        setItems(d.items || []);
      } catch (e) {
        setErr(e.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [role]);

  return (
    <div style={{maxWidth:900}}>
      <h2>My Direct Requests</h2>

      <div style={{display:'flex', gap:8, margin:'10px 0'}}>
        <button onClick={() => setRole('borrower')} disabled={role==='borrower'}>
          As Borrower
        </button>
        <button onClick={() => setRole('lender')} disabled={role==='lender'}>
          As Lender
        </button>
      </div>

      {loading ? <p>Loading…</p> : err ? (
        <div style={{color:'#7c2d12', background:'#fff7ed', border:'1px solid #fed7aa', padding:10}}>{err}</div>
      ) : (
        <table width="100%" cellPadding="8" style={{borderCollapse:'collapse'}}>
          <thead>
            <tr style={{background:'#f1f5f9'}}>
              <th>Borrower</th>
              <th>Lender</th>
              <th>Amount</th>
              <th>Months</th>
              <th>APR</th>
              <th>Status</th>
              <th>Decision</th>
            </tr>
          </thead>
          <tbody>
            {items.length ? items.map(r => <Row key={r.id} r={r} />) : (
              <tr><td colSpan="7" align="center">No requests yet.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

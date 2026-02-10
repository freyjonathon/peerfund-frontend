// src/features/profile/LendingTermsEditor.jsx
import React, { useEffect, useMemo, useState } from 'react';
import './LendingTermsEditor.css';
import { apiFetch } from '../../utils/api';

function clampRate(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return Math.round(n * 100) / 100;
}

function clampAmount(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return 0;
  // Whole dollars (still allows typing; we store numeric)
  return Math.round(n);
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export default function LendingTermsEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  // rows: { id, amount, enabled, rate }
  const [rows, setRows] = useState([]);

  // Load existing terms -> rows
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErr('');
        setOk('');

        // ✅ production-safe (base URL + token + JSON guard)
        const d = await apiFetch('/api/users/me/lending-terms');

        const map = d?.lendingTerms || {};
        const parsed = Object.entries(map).map(([k, v]) => ({
          id: uid(),
          amount: clampAmount(k),
          enabled: !!v?.enabled,
          rate: clampRate(v?.rate),
        }));

        parsed.sort((a, b) => a.amount - b.amount);
        if (alive) setRows(parsed);
      } catch (e) {
        console.error('LendingTermsEditor load error:', e);
        if (alive) setErr(e?.message || 'Failed to load lending terms.');
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // duplicate-amount detection
  const dupAmounts = useMemo(() => {
    const seen = new Map();
    for (const r of rows) {
      const key = String(r.amount);
      seen.set(key, (seen.get(key) || 0) + 1);
    }
    return new Set([...seen.entries()].filter(([, c]) => c > 1).map(([k]) => k));
  }, [rows]);

  function addRow() {
    setErr('');
    setOk('');
    setRows((rs) => [...rs, { id: uid(), amount: 50, enabled: true, rate: 10 }]);
  }

  function removeRow(id) {
    setErr('');
    setOk('');
    setRows((rs) => rs.filter((r) => r.id !== id));
  }

  function updateRow(id, patch) {
    setErr('');
    setOk('');
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  async function save() {
    setErr('');
    setOk('');

    // validation
    const badAmount = rows.find((r) => !Number.isFinite(r.amount) || r.amount <= 0);
    if (badAmount) {
      setErr('Amounts must be positive numbers.');
      return;
    }
    if (dupAmounts.size > 0) {
      setErr('Duplicate amounts detected. Each tier must be unique.');
      return;
    }

    // rows -> map keyed by amount string
    const map = Object.fromEntries(
      rows
        .slice()
        .sort((a, b) => a.amount - b.amount)
        .map((r) => [
          String(r.amount),
          { enabled: !!r.enabled, rate: clampRate(r.rate) },
        ])
    );

    try {
      setSaving(true);

      // ✅ production-safe save
      await apiFetch('/api/users/me/lending-terms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lendingTerms: map }),
      });

      setOk('Lending terms saved.');
    } catch (e) {
      console.error('LendingTermsEditor save error:', e);
      setErr(e?.message || 'Failed to save lending terms.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <section className="lt-card">Loading lending terms…</section>;
  }

  return (
    <section className="lt-card">
      <header className="lt-header">
        <div className="lt-eyebrow">Lending preferences</div>
        <h3 className="lt-title">Lending Terms</h3>
        <p className="lt-subtitle">
          Add the amounts you’re willing to fund and the APR you’ll charge.
          Toggle tiers on or off as your risk appetite changes.
        </p>
      </header>

      {err && <div className="lt-alert lt-alert--err">{err}</div>}
      {ok && <div className="lt-alert lt-alert--ok">{ok}</div>}

      <div className="lt-body">
        {rows.length === 0 && (
          <div className="lt-empty">
            You don’t have any lending tiers yet. Add one to get started.
          </div>
        )}

        {rows.map((r) => {
          const isDup = dupAmounts.has(String(r.amount));
          return (
            <div className="lt-row" key={r.id}>
              <button
                type="button"
                className={`lt-toggle-pill ${
                  r.enabled ? 'lt-toggle-pill--on' : 'lt-toggle-pill--off'
                }`}
                onClick={() => updateRow(r.id, { enabled: !r.enabled })}
              >
                {r.enabled ? 'Active' : 'Paused'}
              </button>

              <div className="lt-row-fields">
                <div className="lt-field">
                  <label className="lt-field-label">Amount</label>
                  <div className="lt-input-shell lt-input-shell--prefix">
                    <span className="lt-prefix">$</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={Number.isFinite(r.amount) && r.amount > 0 ? r.amount : ''}
                      onChange={(e) =>
                        updateRow(r.id, { amount: clampAmount(e.target.value) })
                      }
                      className={isDup ? 'lt-input lt-input--error' : 'lt-input'}
                      placeholder="e.g. 1000"
                    />
                  </div>
                  {isDup && <div className="lt-hint-error">Duplicate amount</div>}
                </div>

                <div className="lt-field">
                  <label className="lt-field-label">APR</label>
                  <div className="lt-input-shell lt-input-shell--suffix">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.25"
                      value={Number.isFinite(r.rate) ? r.rate : 0}
                      onChange={(e) =>
                        updateRow(r.id, { rate: clampRate(e.target.value) })
                      }
                      disabled={!r.enabled}
                      className="lt-input"
                      placeholder="10"
                    />
                    <span className="lt-suffix">% APR</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="lt-remove"
                onClick={() => removeRow(r.id)}
                title="Remove tier"
              >
                Remove
              </button>
            </div>
          );
        })}
      </div>

      <footer className="lt-footer">
        <button type="button" className="btn btn--soft btn--lg" onClick={addRow}>
          + Add Tier
        </button>
        <button
          type="button"
          className="btn btn--primary btn--lg"
          onClick={save}
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save Terms'}
        </button>
      </footer>
    </section>
  );
}

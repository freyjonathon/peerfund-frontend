// src/components/UserProfileModal.jsx
import React, { useEffect, useState } from 'react';
import './UserProfileModal.css';

function fmtMoney(n) {
  const v = Number(n || 0);
  return Number.isFinite(v) ? `$${v.toFixed(2)}` : '—';
}

export default function UserProfileModal({ userId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [profile, setProfile] = useState(null);

  // lock background scroll + close on Escape
  useEffect(() => {
    if (!userId) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [userId, onClose]);

  // fetch profile
  useEffect(() => {
    if (!userId) return;
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr('');
        const token = localStorage.getItem('token') || '';
        const res = await fetch(`/api/users/${userId}/profile`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        if (alive) setProfile(data);
      } catch (e) {
        console.error(e);
        if (alive) setErr('Failed to load profile.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [userId]);

  if (!userId) return null;

  const initials =
    (profile?.name || '')
      .split(' ')
      .map((p) => p[0])
      .filter(Boolean)
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U';

  return (
    <div className="pfm-backdrop" onClick={onClose} aria-hidden="true">
      <div
        className="pfm-modal pfm-animate-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pfm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="pfm-close" onClick={onClose} aria-label="Close">✕</button>

        {loading ? (
          <div className="pfm-body pfm-center">
            <div className="pfm-spinner" />
          </div>
        ) : err ? (
          <div className="pfm-body pfm-error">{err}</div>
        ) : (
          <div className="pfm-body">
            {/* Header */}
            <header className="pfm-header">
              <div className="pfm-avatar" aria-hidden="true">{initials}</div>
              <div className="pfm-header-meta">
                <h2 id="pfm-title" className="pfm-name">
                  {profile?.name || 'Unknown'}
                  {profile?.isSuperUser && <span className="pfm-badge">SuperUser</span>}
                </h2>
                <div className="pfm-sub">
                  {profile?.location ? <span>{profile.location} • </span> : null}
                  Member since:{' '}
                  {profile?.signupDate ? new Date(profile.signupDate).toLocaleDateString() : '—'}
                </div>
                {profile?.lastActiveAt && (
                  <div className="pfm-last-active">
                    Last active: {new Date(profile.lastActiveAt).toLocaleString()}
                  </div>
                )}
              </div>
            </header>

            {/* About */}
            {profile?.summary && (
              <>
                <div className="pfm-section-title">About</div>
                <p className="pfm-summary">{profile.summary}</p>
              </>
            )}

            {/* Stats */}
            <div className="pfm-section-title">Stats</div>
            <div className="pfm-stats">
              <div className="pfm-stat">
                <div className="pfm-stat-label">Loans Given</div>
                <div className="pfm-stat-value">{profile?.stats?.loansGivenCount ?? 0}</div>
                <div className="pfm-stat-sub">{fmtMoney(profile?.stats?.totalLent)}</div>
              </div>

              <div className="pfm-stat">
                <div className="pfm-stat-label">Loans Received</div>
                <div className="pfm-stat-value">{profile?.stats?.loansReceivedCount ?? 0}</div>
                <div className="pfm-stat-sub">{fmtMoney(profile?.stats?.totalBorrowed)}</div>
              </div>

              <div className="pfm-stat">
                <div className="pfm-stat-label">Open Requests</div>
                <div className="pfm-stat-value">{profile?.stats?.openRequestsCount ?? 0}</div>
                <div className="pfm-stat-sub">currently open</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

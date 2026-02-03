// src/features/admin/AdminVerificationDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5050').replace(/\/$/, '');

const AdminVerificationDetail = () => {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState(null);

  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    if (!userId || !token) return;

    const loadDetail = async () => {
      try {
        setError('');
        setLoading(true);

        const res = await fetch(`${API_BASE_URL}/api/admin/verification/${userId}/detail`, {
          headers: authHeaders,
        });

        const contentType = res.headers.get('content-type') || '';
        const text = await res.text();

        if (!res.ok) throw new Error(text || 'Failed to load detail');

        if (!contentType.includes('application/json')) {
          throw new Error('Server returned non-JSON response (check API base URL)');
        }

        const data = text ? JSON.parse(text) : null;
        setDetail(data);
      } catch (e) {
        console.error('AdminVerificationDetail load error:', e);
        setError(e.message || 'Failed to load verification detail');
      } finally {
        setLoading(false);
      }
    };

    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, token]);

  if (!token) {
    return <div className="admin-shell">Not authenticated.</div>;
  }

  if (loading) {
    return (
      <div className="admin-shell">
        <div className="admin-loading">Loading verification detail…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-shell">
        <button className="admin-back" onClick={() => navigate('/admin')} type="button">
          ← Back to admin
        </button>
        <div className="admin-error">{error}</div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="admin-shell">
        <button className="admin-back" onClick={() => navigate('/admin')} type="button">
          ← Back to admin
        </button>
        <div>No detail found.</div>
      </div>
    );
  }

  const { user, docs, checklist } = detail;

  const idFront = docs.find((d) => d.type === 'ID_FRONT');
  const idBack = docs.find((d) => d.type === 'ID_BACK');
  const selfie = docs.find((d) => d.type === 'SELFIE');

  const renderDocCard = (label, doc) => {
    if (!doc) {
      return (
        <div className="admin-doc-card admin-doc-card--missing">
          <h3>{label}</h3>
          <p>Not submitted.</p>
        </div>
      );
    }

    return (
      <div className="admin-doc-card">
        <h3>{label}</h3>
        <p>{doc.title || doc.type}</p>
        <p className="admin-doc-meta">
          {doc.mimeType} • {doc.createdAt ? new Date(doc.createdAt).toLocaleString() : 'unknown time'}
        </p>

        {/* This opens your FRONTEND viewer route */}
        <a
          href={`/documents/${doc.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="admin-btn"
        >
          Open in viewer
        </a>
      </div>
    );
  };

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <button className="admin-back" onClick={() => navigate('/admin')} type="button">
          ← Back to admin
        </button>
        <h1>Verification detail</h1>
        <p>
          Reviewing documents for <strong>{user.name || user.email}</strong>.
        </p>
      </header>

      <section className="admin-card">
        <h2>User info</h2>
        <div className="admin-user-info">
          <div>
            <div><strong>Name:</strong> {user.name || '—'}</div>
            <div><strong>Email:</strong> {user.email}</div>
            <div>
              <strong>Joined:</strong> {user.createdAt ? new Date(user.createdAt).toLocaleString() : '—'}
            </div>
          </div>
          <div>
            <div>
              <strong>Status:</strong> {user.verificationStatus || checklist?.status || 'UNKNOWN'}
            </div>
            <div><strong>ID front:</strong> {checklist?.hasIdFront ? '✓' : '—'}</div>
            <div><strong>ID back:</strong> {checklist?.hasIdBack ? '✓' : '—'}</div>
            <div><strong>Selfie:</strong> {checklist?.hasSelfie ? '✓' : '—'}</div>
          </div>
        </div>
      </section>

      <section className="admin-card">
        <h2>Documents</h2>
        <div className="admin-doc-grid">
          {renderDocCard('ID front', idFront)}
          {renderDocCard('ID back', idBack)}
          {renderDocCard('Selfie', selfie)}
        </div>
      </section>
    </div>
  );
};

export default AdminVerificationDetail;

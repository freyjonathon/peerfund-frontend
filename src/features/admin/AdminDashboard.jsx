// src/features/admin/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css'; // optional – you can remove this line if you don't want custom styles

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'verifications' | 'transactions'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [users, setUsers] = useState([]);
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  /* ------------------------ Loaders ------------------------ */

  const loadUsers = async () => {
    try {
      setError('');
      setLoading(true);
      const res = await fetch('/api/admin/users', { headers: authHeaders });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : data.users || []);
    } catch (e) {
      console.error('loadUsers error:', e);
      setError(e.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadPendingVerifications = async () => {
    try {
      setError('');
      setLoading(true);
      const res = await fetch('/api/admin/verification/pending', {
        headers: authHeaders,
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setPendingVerifications(Array.isArray(data) ? data : data.items || []);
    } catch (e) {
      console.error('loadPendingVerifications error:', e);
      setError(e.message || 'Failed to load pending verifications');
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      setError('');
      setLoading(true);
      const res = await fetch('/api/admin/transactions', {
        headers: authHeaders,
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setTransactions(Array.isArray(data) ? data : data.transactions || []);
    } catch (e) {
      console.error('loadTransactions error:', e);
      setError(e.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    // Load a bit of everything on first visit
    loadUsers();
    loadPendingVerifications();
    // loadTransactions(); // uncomment when your admin transactions endpoint is ready
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  /* -------------------- Verification actions -------------------- */

  const handleApprove = async (userId) => {
    if (!window.confirm('Approve this user for full access?')) return;

    try {
      setError('');
      setLoading(true);
      const res = await fetch(`/api/admin/verification/${userId}/approve`, {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error(await res.text());
      await res.json().catch(() => ({}));

      // Remove from pending list and refresh users
      setPendingVerifications((prev) =>
        prev.filter((v) => v.userId !== userId && v.id !== userId)
      );
      loadUsers();
    } catch (e) {
      console.error('handleApprove error:', e);
      setError(e.message || 'Failed to approve user');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (userId) => {
    if (!window.confirm('Reject this verification request?')) return;

    try {
      setError('');
      setLoading(true);
      const res = await fetch(`/api/admin/verification/${userId}/reject`, {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error(await res.text());
      await res.json().catch(() => ({}));

      setPendingVerifications((prev) =>
        prev.filter((v) => v.userId !== userId && v.id !== userId)
      );
      loadUsers();
    } catch (e) {
      console.error('handleReject error:', e);
      setError(e.message || 'Failed to reject user');
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------ Render helpers ------------------------ */

  const renderUsersTab = () => (
    <div className="admin-card">
      <h2>All users</h2>
      <p style={{ marginBottom: 12, color: '#64748b' }}>
        Quick overview of users, roles, SuperUser status, and verification
        status.
      </p>
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Created</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>SuperUser</th>
              <th>Verification</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 16 }}>
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td>
                    {u.createdAt
                      ? new Date(u.createdAt).toLocaleString()
                      : '—'}
                  </td>
                  <td>{u.name || '—'}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{u.isSuperUser ? 'Yes' : 'No'}</td>
                  <td>{u.verificationStatus || 'UNSET'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderVerificationsTab = () => (
    <div className="admin-card">
      <h2>Pending verifications</h2>
      <p style={{ marginBottom: 12, color: '#64748b' }}>
        Review ID front/back and selfie uploads, then approve or reject.
      </p>
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Submitted</th>
              <th>Name</th>
              <th>Email</th>
              <th>ID front</th>
              <th>ID back</th>
              <th>Selfie</th>
              <th>Status</th>
              <th>Review</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingVerifications.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: 16 }}>
                  No pending verifications 🎉
                </td>
              </tr>
            ) : (
              pendingVerifications.map((item) => {
                const userId = item.userId || item.id;
                const name = item.name || item.userName || '—';
                const email = item.email || item.userEmail || '—';
                const status =
                  item.verificationStatus || item.status || 'PENDING';

                return (
                  <tr key={userId}>
                    <td>
                      {item.submittedAt || item.createdAt
                        ? new Date(
                            item.submittedAt || item.createdAt
                          ).toLocaleString()
                        : '—'}
                    </td>
                    <td>{name}</td>
                    <td>{email}</td>
                    <td>{item.hasIdFront ? '✓' : '—'}</td>
                    <td>{item.hasIdBack ? '✓' : '—'}</td>
                    <td>{item.hasSelfie ? '✓' : '—'}</td>
                    <td>{status}</td>
                    <td>
                      <button
                        className="admin-btn admin-btn--ghost"
                        type="button"
                        onClick={() =>
                          navigate(`/admin/verification/${userId}`)
                        }
                      >
                        View
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="admin-btn"
                        type="button"
                        onClick={() => handleApprove(userId)}
                      >
                        Approve
                      </button>
                      <button
                        className="admin-btn admin-btn--danger"
                        type="button"
                        onClick={() => handleReject(userId)}
                        style={{ marginLeft: 8 }}
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTransactionsTab = () => (
    <div className="admin-card">
      <h2>Platform transactions</h2>
      <p style={{ marginBottom: 12, color: '#64748b' }}>
        High-level view of PeerFund fees, bank fees, and SuperUser
        subscriptions.
      </p>
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Amount</th>
              <th>From</th>
              <th>To</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 16 }}>
                  No platform transactions yet.
                </td>
              </tr>
            ) : (
              transactions.map((t) => (
                <tr key={t.id}>
                  <td>
                    {t.timestamp
                      ? new Date(t.timestamp).toLocaleString()
                      : '—'}
                  </td>
                  <td>{t.type}</td>
                  <td>${Number(t.amount || 0).toFixed(2)}</td>
                  <td>{t.fromUser?.name || '—'}</td>
                  <td>{t.toUser?.name || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* --------------------------- Render --------------------------- */

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <div>
            <h1>Admin dashboard</h1>
            <p>Monitor PeerFund activity and review user verifications.</p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="admin-btn"
          >
            ← Back to app
          </button>
        </div>
      </header>

      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'users' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('users')}
          type="button"
        >
          Users
        </button>
        <button
          className={`admin-tab ${
            activeTab === 'verifications' ? 'is-active' : ''
          }`}
          onClick={() => setActiveTab('verifications')}
          type="button"
        >
          Verifications
        </button>
        <button
          className={`admin-tab ${
            activeTab === 'transactions' ? 'is-active' : ''
          }`}
          onClick={() => {
            setActiveTab('transactions');
            if (transactions.length === 0) {
              loadTransactions();
            }
          }}
          type="button"
        >
          Transactions
        </button>
      </div>

      {loading && <div className="admin-loading">Loading…</div>}
      {error && <div className="admin-error">{error}</div>}

      {activeTab === 'users' && renderUsersTab()}
      {activeTab === 'verifications' && renderVerificationsTab()}
      {activeTab === 'transactions' && renderTransactionsTab()}
    </div>
  );
};

export default AdminDashboard;

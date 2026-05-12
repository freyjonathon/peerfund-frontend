// src/features/admin/AdminDashboard.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const API_BASE = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');

async function safeJson(res) {
  const contentType = res.headers.get('content-type') || '';
  const text = await res.text();

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text.slice(0, 200)}`);
  }

  if (!contentType.includes('application/json')) {
    throw new Error(
      `Expected JSON but got "${contentType || 'unknown'}". Response starts with: ${text.slice(0, 120)}`
    );
  }

  return JSON.parse(text);
}

const moneyFromCents = (cents) => `$${((Number(cents) || 0) / 100).toFixed(2)}`;

const moneyFromTx = (tx) => {
  if (typeof tx.amountCents === 'number') return moneyFromCents(tx.amountCents);
  return `$${Number(tx.amount || 0).toFixed(2)}`;
};

const displayDate = (tx) => {
  const raw = tx.createdAt || tx.timestamp || tx.processedAt || tx.date;
  return raw ? new Date(raw).toLocaleString() : '—';
};

const displayUser = (user) => {
  if (!user) return '—';
  return user.name || user.email || `User …${String(user.id || '').slice(-6)}`;
};

const displaySource = (tx) => tx.source || 'Transaction';

const displayType = (tx) => {
  const type = String(tx.type || '').toUpperCase();

  switch (type) {
    case 'DEPOSIT':
    case 'WALLET_DEPOSIT':
      return 'Wallet Deposit';
    case 'WITHDRAWAL':
    case 'WALLET_WITHDRAWAL':
      return 'Wallet Withdrawal';
    case 'DISBURSE':
    case 'DISBURSEMENT':
      return 'Loan Disbursement';
    case 'REPAYMENT':
      return 'Loan Repayment';
    case 'SUPERUSER_FEE':
      return 'SuperUser Fee';
    case 'BANK_FEE':
    case 'BANKING_FEE':
    case 'STRIPE_FEE':
      return 'Bank/Stripe Fee';
    case 'PLATFORM_FEE':
    case 'PEERFUND_FEE':
      return 'PeerFund Fee';
    default:
      return tx.type || 'Other';
  }
};

const displayFrom = (tx) => {
  if (tx.source === 'WalletLedger') {
    if (tx.direction === 'DEBIT') return displayUser(tx.user);
    if (tx.direction === 'CREDIT') return 'External / Platform';
    return displayUser(tx.user);
  }

  return displayUser(tx.fromUser);
};

const displayTo = (tx) => {
  if (tx.source === 'WalletLedger') {
    if (tx.direction === 'CREDIT') return displayUser(tx.user);
    if (tx.direction === 'DEBIT') return 'External / Platform';
    return displayUser(tx.user);
  }

  return displayUser(tx.toUser);
};

const displayReference = (tx) => {
  if (tx.loanId) return `Loan …${String(tx.loanId).slice(-6)}`;
  if (tx.referenceId) return `${tx.referenceType || 'Ref'} …${String(tx.referenceId).slice(-6)}`;
  if (tx.repaymentId) return `Repayment …${String(tx.repaymentId).slice(-6)}`;
  if (tx.id) return `Tx …${String(tx.id).slice(-6)}`;
  return '—';
};

const displayBalanceAfter = (tx) => {
  if (typeof tx.balanceAfterCents === 'number') return moneyFromCents(tx.balanceAfterCents);
  return '—';
};

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [users, setUsers] = useState([]);
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [transactionStats, setTransactionStats] = useState({
    count: 0,
    transactionCount: 0,
    walletLedgerCount: 0,
  });

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  const apiUrl = (path) => `${API_BASE}${path}`;

  const loadUsers = async () => {
    try {
      setError('');
      setLoading(true);

      const res = await fetch(apiUrl('/api/admin/users'), {
        headers: authHeaders,
      });

      const data = await safeJson(res);
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

      const res = await fetch(apiUrl('/api/admin/verification/pending'), {
        headers: authHeaders,
      });

      const data = await safeJson(res);
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

      const res = await fetch(apiUrl('/api/admin/transactions?limit=500'), {
        headers: authHeaders,
      });

      const data = await safeJson(res);
      const rows = Array.isArray(data) ? data : data.transactions || [];

      setTransactions(rows);
      setTransactionStats({
        count: data.count ?? rows.length,
        transactionCount: data.transactionCount ?? rows.filter((t) => t.source === 'Transaction').length,
        walletLedgerCount:
          data.walletLedgerCount ?? rows.filter((t) => t.source === 'WalletLedger').length,
      });
    } catch (e) {
      console.error('loadTransactions error:', e);
      setError(e.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    loadUsers();
    loadPendingVerifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleApprove = async (userId) => {
    if (!window.confirm('Approve this user for full access?')) return;

    try {
      setError('');
      setLoading(true);

      const res = await fetch(apiUrl(`/api/admin/verification/${userId}/approve`), {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
        },
      });

      await safeJson(res).catch(() => ({}));

      setPendingVerifications((prev) =>
        prev.filter((v) => v.userId !== userId && v.id !== userId)
      );

      await loadUsers();
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

      const res = await fetch(apiUrl(`/api/admin/verification/${userId}/reject`), {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
        },
      });

      await safeJson(res).catch(() => ({}));

      setPendingVerifications((prev) =>
        prev.filter((v) => v.userId !== userId && v.id !== userId)
      );

      await loadUsers();
    } catch (e) {
      console.error('handleReject error:', e);
      setError(e.message || 'Failed to reject user');
    } finally {
      setLoading(false);
    }
  };

  const renderUsersTab = () => (
    <div className="admin-card">
      <h2>All users</h2>
      <p style={{ marginBottom: 12, color: '#64748b' }}>
        Quick overview of users, roles, SuperUser status, and verification status.
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
                  <td>{u.createdAt ? new Date(u.createdAt).toLocaleString() : '—'}</td>
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
                const status = item.verificationStatus || item.status || 'PENDING';

                return (
                  <tr key={userId}>
                    <td>
                      {item.submittedAt || item.createdAt
                        ? new Date(item.submittedAt || item.createdAt).toLocaleString()
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
                        onClick={() => navigate(`/admin/verification/${userId}`)}
                      >
                        View
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="admin-btn" type="button" onClick={() => handleApprove(userId)}>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
        <div>
          <h2>Platform transactions</h2>
          <p style={{ marginBottom: 12, color: '#64748b' }}>
            Platform-wide view of wallet deposits, withdrawals, disbursements, fees, repayments,
            and internal wallet ledger activity.
          </p>
          <p style={{ marginBottom: 12, color: '#64748b', fontSize: 14 }}>
            Showing {transactionStats.count} rows — {transactionStats.transactionCount} transaction rows
            and {transactionStats.walletLedgerCount} wallet ledger rows.
          </p>
        </div>

        <button className="admin-btn" type="button" onClick={loadTransactions}>
          Refresh
        </button>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Source</th>
              <th>Type</th>
              <th>Amount</th>
              <th>From</th>
              <th>To</th>
              <th>Direction</th>
              <th>Balance After</th>
              <th>Reference</th>
            </tr>
          </thead>

          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: 16 }}>
                  No platform transactions yet.
                </td>
              </tr>
            ) : (
              transactions.map((t) => (
                <tr key={`${t.source || 'Transaction'}-${t.id}`}>
                  <td>{displayDate(t)}</td>
                  <td>{displaySource(t)}</td>
                  <td>{displayType(t)}</td>
                  <td>{moneyFromTx(t)}</td>
                  <td>{displayFrom(t)}</td>
                  <td>{displayTo(t)}</td>
                  <td>{t.direction || '—'}</td>
                  <td>{displayBalanceAfter(t)}</td>
                  <td>{displayReference(t)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <h1>Admin dashboard</h1>
            <p>Monitor PeerFund activity and review user verifications.</p>
          </div>

          <button type="button" onClick={() => navigate('/dashboard')} className="admin-btn">
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
          className={`admin-tab ${activeTab === 'verifications' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('verifications')}
          type="button"
        >
          Verifications
        </button>

        <button
          className={`admin-tab ${activeTab === 'transactions' ? 'is-active' : ''}`}
          onClick={() => {
            setActiveTab('transactions');
            if (transactions.length === 0) loadTransactions();
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
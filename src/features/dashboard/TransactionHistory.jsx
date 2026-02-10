// src/features/dashboard/TransactionHistory.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { CSVLink } from 'react-csv';
import { useNavigate } from 'react-router-dom';

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [totals, setTotals] = useState({ sent: 0, received: 0, net: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // --- helpers -----------------------------------------------------------

  const getAmountCents = (tx) => {
    if (typeof tx.amountCents === 'number') return tx.amountCents;
    if (typeof tx.amount === 'number') return Math.round(tx.amount * 100);
    return 0;
  };

  const formatDollars = (cents) => (cents / 100).toFixed(2);

  const getDisplayDate = (tx) => {
    const raw = tx.createdAt || tx.timestamp || tx.date;
    if (!raw) return '';
    return new Date(raw).toLocaleString();
  };

  const getDisplayType = (tx) => {
    const t = (tx.type || '').toUpperCase();
    switch (t) {
      case 'DEPOSIT':
        return 'Deposit to wallet';
      case 'WITHDRAWAL':
        return 'Withdrawal';
      case 'REPAYMENT':
        return 'Loan repayment';
      case 'DISBURSEMENT':
        return 'Loan disbursement';
      case 'SUPERUSER_FEE':
      case 'FEE':
        return 'SuperUser fee';
      case 'BANK_FEE':
        return 'Bank fee';
      case 'PLATFORM_FEE':
        return 'Platform fee';
      default:
        return tx.type || 'Other';
    }
  };

  // classify as money sent or received (best-effort, won’t crash)
  const classifyFlow = (tx) => {
    const t = (tx.type || '').toUpperCase();
    const direction = (tx.direction || '').toUpperCase?.() || '';

    if (direction === 'DEBIT') return 'sent';
    if (direction === 'CREDIT') return 'received';

    if (
      ['DISBURSEMENT', 'WITHDRAWAL', 'SUPERUSER_FEE', 'FEE', 'BANK_FEE', 'PLATFORM_FEE'].includes(
        t
      )
    ) {
      return 'sent';
    }
    if (['DEPOSIT', 'REPAYMENT'].includes(t)) {
      return 'received';
    }
    return null;
  };

  const getLoanLabel = (tx) => {
    if (!tx.loanId) return '';
    // Show a short label like "Loan …abcd12" instead of full ObjectId
    const id = String(tx.loanId);
    const tail = id.slice(-6);
    return `Loan …${tail}`;
  };

  const handleLoanClick = (loanId) => {
    if (!loanId) return;
    navigate(`/loan/${loanId}`);
  };

  // --- fetch on mount ----------------------------------------------------

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setError('');
        setLoading(true);

        const res = await axios.get('/api/transactions', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });

        const txs = Array.isArray(res.data) ? res.data : [];
        setTransactions(txs);

        let sentCents = 0;
        let receivedCents = 0;

        txs.forEach((tx) => {
          const cents = getAmountCents(tx);
          const flow = classifyFlow(tx);
          if (flow === 'sent') sentCents += cents;
          if (flow === 'received') receivedCents += cents;
        });

        setTotals({
          sent: sentCents,
          received: receivedCents,
          net: receivedCents - sentCents,
        });
      } catch (err) {
        console.error('Failed to fetch transactions:', err);
        setError('Failed to fetch transactions. Please try again later.');
        setTransactions([]);
        setTotals({ sent: 0, received: 0, net: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  // --- CSV export data ---------------------------------------------------

  const csvData = transactions.map((tx) => ({
    date: getDisplayDate(tx),
    type: getDisplayType(tx),
    amount: formatDollars(getAmountCents(tx)),
    loanId: tx.loanId || '',
    from: tx.fromUser?.name || tx.fromName || '',
    to: tx.toUser?.name || tx.toName || '',
  }));

  const csvHeaders = [
    { label: 'Date', key: 'date' },
    { label: 'Type', key: 'type' },
    { label: 'Amount (USD)', key: 'amount' },
    { label: 'Loan ID', key: 'loanId' },
    { label: 'From', key: 'from' },
    { label: 'To', key: 'to' },
  ];

  // --- render ------------------------------------------------------------

  return (
    <div style={{ padding: '2rem' }}>
      <h2 style={{ marginBottom: '1rem' }}>Transaction History</h2>

      {error && (
        <div
          style={{
            marginBottom: '1rem',
            background: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            padding: '0.75rem 1rem',
            borderRadius: 8,
          }}
        >
          {error}
        </div>
      )}

      {/* Summary cards */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.25rem',
        }}
      >
        <div
          style={{
            flex: '1 1 180px',
            minWidth: 180,
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            padding: '0.75rem 1rem',
            background: '#f8fafc',
          }}
        >
          <div style={{ fontSize: 13, color: '#64748b' }}>Total Sent</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#b91c1c' }}>
            ${formatDollars(totals.sent)}
          </div>
        </div>

        <div
          style={{
            flex: '1 1 180px',
            minWidth: 180,
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            padding: '0.75rem 1rem',
            background: '#f8fafc',
          }}
        >
          <div style={{ fontSize: 13, color: '#64748b' }}>Total Received</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#166534' }}>
            ${formatDollars(totals.received)}
          </div>
        </div>

        <div
          style={{
            flex: '1 1 180px',
            minWidth: 180,
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            padding: '0.75rem 1rem',
            background: '#f8fafc',
          }}
        >
          <div style={{ fontSize: 13, color: '#64748b' }}>Net</div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: totals.net >= 0 ? '#166534' : '#b91c1c',
            }}
          >
            ${formatDollars(totals.net)}
          </div>
        </div>

        <div
          style={{
            flex: '0 0 auto',
            alignSelf: 'flex-end',
          }}
        >
          <CSVLink data={csvData} headers={csvHeaders} filename="transactions.csv" style={{ textDecoration: 'none' }}>
            <button
              style={{
                padding: '0.5rem 0.9rem',
                borderRadius: 999,
                border: '1px solid #0f172a',
                background: '#0f172a',
                color: '#f9fafb',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ⬇️ Download CSV
            </button>
          </CSVLink>
        </div>
      </div>

      {/* Table */}
      <div
        style={{
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          background: '#ffffff',
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 14,
          }}
        >
          <thead
            style={{
              background: '#f1f5f9',
              textAlign: 'left',
            }}
          >
            <tr>
              <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0' }}>Date</th>
              <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0' }}>Type</th>
              <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0' }}>Amount</th>
              <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0' }}>Loan</th>
              <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0' }}>From</th>
              <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0' }}>To</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>
                  Loading transactions…
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>
                  No transactions yet. Deposits, repayments, withdrawals, and fees will appear here.
                </td>
              </tr>
            ) : (
              transactions.map((tx) => {
                const cents = getAmountCents(tx);
                const flow = classifyFlow(tx);
                const amountColor =
                  flow === 'sent' ? '#b91c1c' : flow === 'received' ? '#166534' : '#0f172a';

                const loanLabel = getLoanLabel(tx);

                return (
                  <tr key={tx.id}>
                    <td style={{ padding: '0.6rem 1rem', borderBottom: '1px solid #e2e8f0' }}>
                      {getDisplayDate(tx)}
                    </td>
                    <td style={{ padding: '0.6rem 1rem', borderBottom: '1px solid #e2e8f0' }}>
                      {getDisplayType(tx)}
                    </td>
                    <td
                      style={{
                        padding: '0.6rem 1rem',
                        borderBottom: '1px solid #e2e8f0',
                        fontWeight: 600,
                        color: amountColor,
                      }}
                    >
                      ${formatDollars(cents)}
                    </td>
                    <td style={{ padding: '0.6rem 1rem', borderBottom: '1px solid #e2e8f0' }}>
                      {tx.loanId ? (
                        <button
                          type="button"
                          onClick={() => handleLoanClick(tx.loanId)}
                          aria-label={`Open ${loanLabel}`}
                          style={{
                            padding: '2px 8px',
                            borderRadius: 999,
                            border: '1px solid #e2e8f0',
                            background: '#f8fafc',
                            fontSize: 12,
                            cursor: 'pointer',
                          }}
                        >
                          {loanLabel}
                        </button>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td style={{ padding: '0.6rem 1rem', borderBottom: '1px solid #e2e8f0' }}>
                      {tx.fromUser?.name || tx.fromName || '—'}
                    </td>
                    <td style={{ padding: '0.6rem 1rem', borderBottom: '1px solid #e2e8f0' }}>
                      {tx.toUser?.name || tx.toName || '—'}
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
};

export default TransactionHistory;

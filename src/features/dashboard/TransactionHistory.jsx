// src/features/dashboard/TransactionHistory.jsx
import React, { useEffect, useState } from 'react';
import { CSVLink } from 'react-csv';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../utils/api';

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [totals, setTotals] = useState({ sent: 0, received: 0, net: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdminView, setIsAdminView] = useState(false);
  const navigate = useNavigate();

  const getAmountCents = (tx) => {
    if (typeof tx.amountCents === 'number') return tx.amountCents;
    if (typeof tx.amount === 'number') return Math.round(tx.amount * 100);
    return 0;
  };

  const formatDollars = (cents) => (cents / 100).toFixed(2);

  const getDisplayDate = (tx) => {
    const raw = tx.createdAt || tx.timestamp || tx.date || tx.processedAt;
    if (!raw) return '';
    return new Date(raw).toLocaleString();
  };

  const getDisplayType = (tx) => {
    const t = (tx.type || '').toUpperCase();

    switch (t) {
      case 'DEPOSIT':
      case 'WALLET_DEPOSIT':
        return 'Deposit to wallet';
      case 'WITHDRAWAL':
      case 'WALLET_WITHDRAWAL':
        return 'Withdrawal';
      case 'REPAYMENT':
        return 'Loan repayment';
      case 'DISBURSEMENT':
        return 'Loan disbursement';
      case 'SUPERUSER_FEE':
        return 'SuperUser fee';
      case 'FEE':
        return 'Fee';
      case 'BANK_FEE':
      case 'BANKING_FEE':
      case 'STRIPE_FEE':
        return 'Bank/Stripe fee';
      case 'PLATFORM_FEE':
      case 'PEERFUND_FEE':
        return 'PeerFund platform fee';
      default:
        return tx.type || 'Other';
    }
  };

  const classifyFlow = (tx) => {
    const t = (tx.type || '').toUpperCase();
    const direction = String(tx.direction || '').toUpperCase();

    if (direction === 'DEBIT') return 'sent';
    if (direction === 'CREDIT') return 'received';

    // Transaction table rows usually use fromUserId/toUserId rather than direction.
    // For admin view, we classify platform-wide totals as transaction volume.
    if (
      [
        'DISBURSEMENT',
        'WITHDRAWAL',
        'WALLET_WITHDRAWAL',
        'SUPERUSER_FEE',
        'FEE',
        'BANK_FEE',
        'BANKING_FEE',
        'STRIPE_FEE',
        'PLATFORM_FEE',
        'PEERFUND_FEE',
      ].includes(t)
    ) {
      return 'sent';
    }

    if (['DEPOSIT', 'WALLET_DEPOSIT', 'REPAYMENT'].includes(t)) {
      return 'received';
    }

    return null;
  };

  const getLoanLabel = (tx) => {
    if (!tx.loanId && !tx.referenceId) return '';
    const id = String(tx.loanId || tx.referenceId);
    return `Loan …${id.slice(-6)}`;
  };

  const getDirectionLabel = (tx) => {
    if (tx.direction) return tx.direction;

    if (tx.fromUser || tx.toUser) {
      const from = tx.fromUser?.name || tx.fromUser?.email || 'Unknown';
      const to = tx.toUser?.name || tx.toUser?.email || 'Unknown';
      return `${from} → ${to}`;
    }

    if (tx.fromUserId || tx.toUserId) {
      const from = tx.fromUserId ? `…${String(tx.fromUserId).slice(-6)}` : '—';
      const to = tx.toUserId ? `…${String(tx.toUserId).slice(-6)}` : '—';
      return `${from} → ${to}`;
    }

    return '—';
  };

  const getReferenceLabel = (tx) => {
    if (tx.loanId || tx.referenceId) return getLoanLabel(tx);
    if (tx.repaymentId) return `Repayment …${String(tx.repaymentId).slice(-6)}`;
    if (tx.id) return `Tx …${String(tx.id).slice(-6)}`;
    return '—';
  };

  const handleLoanClick = (loanId) => {
    if (!loanId) return;
    navigate(`/loan/${loanId}`);
  };

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setError('');
        setLoading(true);

        /*
          Primary source:
          /api/transactions should return:
          - all transactions for ADMIN
          - own transactions for normal users

          Supported response shapes:
          - []
          - { transactions: [] }
          - { isAdmin: true, transactions: [] }
        */
        let data;
        try {
          data = await apiFetch('/api/transactions');
        } catch (txErr) {
          console.warn('/api/transactions failed, falling back to wallet ledger:', txErr);
          data = null;
        }

        let rows = Array.isArray(data)
          ? data
          : Array.isArray(data?.transactions)
          ? data.transactions
          : [];

        setIsAdminView(!!data?.isAdmin);

        /*
          Fallback:
          If /api/transactions has no rows, still show the user's wallet ledger
          so deposits/withdrawals/ledger activity do not disappear.
        */
        if (rows.length === 0) {
          try {
            const walletData = await apiFetch('/api/wallet/me');
            const ledger = Array.isArray(walletData?.ledger) ? walletData.ledger : [];
            rows = ledger;
          } catch (walletErr) {
            console.warn('/api/wallet/me fallback failed:', walletErr);
          }
        }

        setTransactions(rows);

        let sentCents = 0;
        let receivedCents = 0;

        rows.forEach((tx) => {
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

  const csvData = transactions.map((tx) => ({
    date: getDisplayDate(tx),
    type: getDisplayType(tx),
    amount: formatDollars(getAmountCents(tx)),
    loanId: tx.loanId || tx.referenceId || '',
    from: tx.fromUser?.name || tx.fromUser?.email || tx.fromName || tx.fromUserId || '',
    to: tx.toUser?.name || tx.toUser?.email || tx.toName || tx.toUserId || '',
    direction: getDirectionLabel(tx),
    balanceAfter:
      typeof tx.balanceAfterCents === 'number'
        ? formatDollars(tx.balanceAfterCents)
        : '',
  }));

  const csvHeaders = [
    { label: 'Date', key: 'date' },
    { label: 'Type', key: 'type' },
    { label: 'Amount (USD)', key: 'amount' },
    { label: 'Loan ID / Reference', key: 'loanId' },
    { label: 'From', key: 'from' },
    { label: 'To', key: 'to' },
    { label: 'Direction', key: 'direction' },
    { label: 'Balance After', key: 'balanceAfter' },
  ];

  return (
    <div style={{ padding: '2rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: '1rem',
        }}
      >
        <h2 style={{ margin: 0 }}>Transaction History</h2>

        {isAdminView && (
          <span
            style={{
              border: '1px solid #bfdbfe',
              background: '#eff6ff',
              color: '#1d4ed8',
              borderRadius: 999,
              padding: '4px 10px',
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            Admin view: all platform transactions
          </span>
        )}
      </div>

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

        <div style={{ flex: '0 0 auto', alignSelf: 'flex-end' }}>
          <CSVLink
            data={csvData}
            headers={csvHeaders}
            filename="transactions.csv"
            style={{ textDecoration: 'none' }}
          >
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

      <div
        style={{
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          overflowX: 'auto',
          background: '#ffffff',
        }}
      >
        <table
          style={{
            width: '100%',
            minWidth: 900,
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
              <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0' }}>
                Date
              </th>
              <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0' }}>
                Type
              </th>
              <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0' }}>
                Amount
              </th>
              <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0' }}>
                Reference
              </th>
              <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0' }}>
                Direction / Parties
              </th>
              <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0' }}>
                Balance After
              </th>
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
                  No transactions yet. Deposits, withdrawals, loan funding, fees, and wallet activity
                  will appear here.
                </td>
              </tr>
            ) : (
              transactions.map((tx) => {
                const cents = getAmountCents(tx);
                const flow = classifyFlow(tx);
                const amountColor =
                  flow === 'sent'
                    ? '#b91c1c'
                    : flow === 'received'
                    ? '#166534'
                    : '#0f172a';

                const refLabel = getReferenceLabel(tx);
                const loanId = tx.loanId || (tx.referenceType === 'Loan' ? tx.referenceId : null);

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
                      {loanId ? (
                        <button
                          type="button"
                          onClick={() => handleLoanClick(loanId)}
                          aria-label={`Open ${refLabel}`}
                          style={{
                            padding: '2px 8px',
                            borderRadius: 999,
                            border: '1px solid #e2e8f0',
                            background: '#f8fafc',
                            fontSize: 12,
                            cursor: 'pointer',
                          }}
                        >
                          {refLabel}
                        </button>
                      ) : (
                        refLabel
                      )}
                    </td>

                    <td style={{ padding: '0.6rem 1rem', borderBottom: '1px solid #e2e8f0' }}>
                      {getDirectionLabel(tx)}
                    </td>

                    <td style={{ padding: '0.6rem 1rem', borderBottom: '1px solid #e2e8f0' }}>
                      {typeof tx.balanceAfterCents === 'number'
                        ? `$${formatDollars(tx.balanceAfterCents)}`
                        : '—'}
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
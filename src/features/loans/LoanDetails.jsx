// src/features/loans/LoanDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import RepaymentForm from './RepaymentForm';
import ContractModal from '../../components/ContractModal';
import UserProfileModal from '../../components/UserProfileModal';
import LinkLoanBankButton from './LinkLoanBankButton';
import LoanFundingPanel from './LoanFundingPanel';
import WalletPanel from '../wallet/WalletPanel';

const LoanDetails = () => {
  const { loanId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [loan, setLoan] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showRepaymentForm, setShowRepaymentForm] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [showContractModal, setShowContractModal] = useState(false);
  const [hasLoanBank, setHasLoanBank] = useState(false);

  const [expandedOffer, setExpandedOffer] = useState({});
  const [offerForm, setOfferForm] = useState({
    amount: '',
    duration: '',
    interestRate: '',
    message: '',
  });

  // New: wallet + funding UX state (lender)
  const [walletAvailableCents, setWalletAvailableCents] = useState(null);
  const [showWalletPanel, setShowWalletPanel] = useState(false);

  const token = localStorage.getItem('token');
  const userId = token ? JSON.parse(atob(token.split('.')[1])).userId : null;

  const handleOfferChange = (e) => {
    const { name, value } = e.target;
    setOfferForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitOffer = async () => {
    try {
      const payload = {
        amount: Number(loan.amount),
        duration: Number(offerForm.duration),
        interestRate: Number(offerForm.interestRate),
        message: (offerForm.message || '').trim() || undefined,
      };

      if (!Number.isFinite(payload.duration) || payload.duration < 1) {
        alert('Please enter a valid duration (months).');
        return;
      }
      if (!Number.isFinite(payload.interestRate) || payload.interestRate < 0) {
        alert('Please enter a valid interest rate (APR).');
        return;
      }

      const res = await fetch(`/api/loans/${loanId}/offers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error((await res.text()) || 'Failed to submit offer');
      const data = await res.json();
      alert('Offer submitted!');
      setLoan((prev) => ({
        ...prev,
        loanOffers: [data, ...(prev.loanOffers || [])],
      }));
      setOfferForm((f) => ({ ...f, message: '' }));
    } catch (err) {
      console.error('Error submitting offer:', err);
      alert('There was a problem submitting your offer.');
    }
  };

  const fetchLoanDetails = async () => {
    try {
      const res = await fetch(`/api/loans/${loanId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setLoan(data);
      setMessages(data.messages || []);

      // If I am the borrower, check if I already have a loan funding payment method
      if (data.borrower?.id === userId) {
        try {
          const pmRes = await fetch('/api/stripe/has-loan-payment-method', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (pmRes.ok) {
            const pmData = await pmRes.json();
            setHasLoanBank(!!pmData.hasLoanPaymentMethod);
          } else {
            setHasLoanBank(false);
          }
        } catch (err) {
          console.warn('Error checking loan payment method:', err);
          setHasLoanBank(false);
        }
      }
    } catch (err) {
      console.error('Error fetching loan details:', err);
    }
  };

  useEffect(() => {
    fetchLoanDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loanId]);

  useEffect(() => {
    if (!loan) return;
    setOfferForm({
      amount: Number(loan.amount || 0),
      duration: Number(loan.duration || 1),
      interestRate: Number(loan.interestRate ?? loan.apr ?? 0),
      message: '',
    });
  }, [loan]);

  useEffect(() => {
    if (searchParams.get('tab') === 'discussion' && loan) {
      setTimeout(() => {
        const el = document.getElementById('discussion-thread');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 0);
    }
  }, [searchParams, loan]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      const res = await fetch(`/api/loans/${loanId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newMessage }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, data]);
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleAcceptOffer = (offer) => {
    setSelectedOffer(offer);
    setShowContractModal(true);
  };

  const toggleOffer = (offerId) =>
    setExpandedOffer((prev) => ({ ...prev, [offerId]: !prev[offerId] }));

  // Who am I in this context?
  const iAmBorrower = userId === loan?.borrower?.id;
  // Detect if *my* offer was accepted -> I'm the lender for this loan
  const isLenderOnThisLoan =
    !!loan?.loanOffers?.some(
      (o) =>
        String(o.lender?.id) === String(userId) &&
        (o.status || 'OPEN').toUpperCase() === 'ACCEPTED'
    );

  if (!loan) return <p>Loading loan details...</p>;

  const statusUpper = (loan.status || '').toUpperCase();
  const bannerStyle = {
    margin: '12px 0',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #e2e8f0',
    background:
      statusUpper === 'FUNDED'
        ? '#ecfdf5'
        : statusUpper === 'PROCESSING'
        ? '#eff6ff'
        : statusUpper === 'FAILED'
        ? '#fef2f2'
        : '#f8fafc',
    color: '#0f172a',
  };

  return (
    <div style={{ padding: '2rem', position: 'relative' }}>
      <h2>Loan Request by {loan.borrower?.name || 'Unknown User'}</h2>

      <div
        style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start',
          marginBottom: '1rem',
        }}
      >
        <UserProfileModal user={loan.borrower} />
      </div>

      <p>
        <strong>Amount:</strong> ${loan.amount}
      </p>
      <p>
        <strong>Duration:</strong> {loan.duration} months
      </p>
      <p>
        <strong>Reason:</strong> {loan.purpose}
      </p>

      {/* Status banner */}
      <div style={bannerStyle}>
        <strong>Status:</strong> {loan.status}
        {statusUpper === 'FAILED' && (
          <span style={{ marginLeft: 6, color: '#b91c1c' }}>
            (You can retry disbursement once issues are resolved.)
          </span>
        )}
        {statusUpper === 'PROCESSING' && (
          <span style={{ marginLeft: 6, color: '#334155' }}>
            Transfer in progress — refresh shortly to see the final state.
          </span>
        )}
      </div>

      {/* Lender funding panel, when borrower has accepted our offer */}
      {isLenderOnThisLoan && ['ACCEPTED', 'PROCESSING'].includes(statusUpper) && (
        <LoanFundingPanel
          loan={loan}
          walletAvailableCents={walletAvailableCents}
          onWalletSynced={(cents) => setWalletAvailableCents(cents)}
          onNeedMoreFunds={() => setShowWalletPanel(true)}
          onFunded={async () => {
            // after funding completes, refresh the loan
            await fetchLoanDetails();
          }}
        />
      )}

      <hr />
      <h3>Offers</h3>

      {loan.loanOffers?.length > 0 ? (
        loan.loanOffers.map((offer) => {
          const isOpen = !!expandedOffer[offer.id];
          const statusLabel =
            (offer.status || '').toUpperCase() === 'ACCEPTED'
              ? 'Accepted'
              : 'Pending';
          const badgeStyle =
            statusLabel === 'Accepted'
              ? {
                  background: '#dcfce7',
                  color: '#166534',
                  borderColor: '#86efac',
                }
              : {
                  background: '#fef3c7',
                  color: '#92400e',
                  borderColor: '#fde68a',
                };

          return (
            <div
              key={offer.id}
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                background: '#fff',
                marginBottom: 12,
                overflow: 'hidden',
              }}
            >
              {/* Header row */}
              <button
                onClick={() => toggleOffer(offer.id)}
                aria-expanded={isOpen}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: '#f8fafc',
                  border: 0,
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      background: '#6366f1',
                      display: 'inline-block',
                    }}
                  />
                  <span
                    style={{ fontWeight: 700, color: '#0f172a' }}
                  >
                    Offer from {offer.lender?.name || 'Unknown'}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: 12,
                    alignItems: 'center',
                    color: '#334155',
                    fontSize: 14,
                  }}
                >
                  <span>${Number(offer.amount || 0).toFixed(2)}</span>
                  <span>{offer.interestRate}%</span>
                  <span>{offer.duration} mo</span>
                  <span
                    style={{
                      borderRadius: 999,
                      padding: '2px 8px',
                      fontSize: 12,
                      fontWeight: 700,
                      border: '1px solid',
                      ...badgeStyle,
                    }}
                  >
                    {statusLabel}
                  </span>
                  <span style={{ fontSize: 18, color: '#64748b' }}>
                    {isOpen ? '▾' : '▸'}
                  </span>
                </div>
              </button>

              {/* Body */}
              {isOpen && (
                <div
                  style={{
                    padding: '12px 14px 14px',
                    borderTop: '1px solid #e2e8f0',
                  }}
                >
                  <p>
                    <strong>Message:</strong> {offer.message || '—'}
                  </p>

                  {statusUpper === 'OPEN' && iAmBorrower && (
                    <button
                      onClick={() => handleAcceptOffer(offer)}
                      style={{
                        background: '#4f46e5',
                        border: '1px solid #4f46e5',
                        color: '#fff',
                        fontWeight: 700,
                        padding: '8px 12px',
                        borderRadius: 10,
                        cursor: 'pointer',
                      }}
                    >
                      Accept Offer
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })
      ) : (
        <p>No offers yet.</p>
      )}

      {/* Borrower: link bank for receiving funds */}
      {statusUpper === 'ACCEPTED' && iAmBorrower && !hasLoanBank && (
        <div
          style={{
            marginTop: '2rem',
            padding: '1rem',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            background: '#f8fafc',
          }}
        >
          <h3 style={{ marginTop: 0 }}>Before we disburse your loan…</h3>
          <p style={{ color: '#334155' }}>
            You must link a bank account in order to receive your loan funds.
          </p>
          <LinkLoanBankButton onLinked={() => setHasLoanBank(true)} />
        </div>
      )}

      {/* Repayment section (borrower) */}
      {statusUpper === 'FUNDED' && iAmBorrower && (
        <div style={{ marginTop: '2rem' }}>
          <h3>Repayments</h3>
          <button onClick={() => setShowRepaymentForm(true)}>
            Make a Payment
          </button>
          <button onClick={() => navigate(`/loan/${loan.id}/repayments`)}>
            View Repayment Tracker
          </button>
          {showRepaymentForm && <RepaymentForm loanId={loan.id} />}
        </div>
      )}

      <hr />

      {/* Discussion thread */}
      <div id="discussion-thread" style={{ marginTop: '1.5rem' }}>
        <h3>Public Discussion</h3>
        {messages.length === 0 ? (
          <p>No messages yet. Start the conversation!</p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              style={{
                borderTop: '1px solid #e5e7eb',
                padding: '8px 0',
              }}
            >
              <strong>{m.user?.name || 'User'}:</strong> {m.content}
            </div>
          ))
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <textarea
            placeholder="Write your message…"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            style={{
              flex: 1,
              padding: 8,
              border: '1px solid #e5e7eb',
              borderRadius: 8,
            }}
          />
          <button
            onClick={handleSendMessage}
            style={{
              background: '#4f46e5',
              border: '1px solid #4f46e5',
              color: '#fff',
              fontWeight: 700,
              padding: '8px 12px',
              borderRadius: 10,
              cursor: 'pointer',
              height: 40,
              alignSelf: 'center',
            }}
          >
            Send
          </button>
        </div>
      </div>

      {showContractModal && selectedOffer && (
        <ContractModal
          offer={selectedOffer}
          borrower={loan.borrower}
          onConfirm={async () => {
            try {
              const res = await fetch(
                `/api/loans/offers/${selectedOffer.id}/accept`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              if (!res.ok) {
                const errorText = await res.text();
                alert(`❌ ${errorText || 'Something went wrong'}`);
                return;
              }

              await res.json();
              alert('✅ Loan contract created and saved!');
              setShowContractModal(false);
              navigate('/dashboard');
            } catch (err) {
              console.error('❌ Error finalizing contract:', err);
              alert('Network or server error occurred.');
            }
          }}
          onCancel={() => setShowContractModal(false)}
        />
      )}

      {/* Wallet modal for adding funds (lender) */}
      {showWalletPanel && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 40,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 12,
              padding: 16,
              minWidth: 320,
              maxWidth: 420,
              boxShadow:
                '0 10px 15px -3px rgba(15, 23, 42, 0.2), 0 4px 6px -2px rgba(15, 23, 42, 0.1)',
            }}
          >
            <WalletPanel
              onClose={() => setShowWalletPanel(false)}
              onBalanceUpdated={(cents) => {
                setWalletAvailableCents(cents);
                setShowWalletPanel(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanDetails;

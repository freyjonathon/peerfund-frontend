// src/features/loans/LoanThread.jsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../../utils/api';

const LoanThread = () => {
  const { loanId } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  const listRef = useRef(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }
    }, 0);
  };

  const fetchMessages = useCallback(async () => {
    if (!loanId) return;
    try {
      setErrMsg('');
      setLoading(true);

      const data = await apiFetch(`/api/loans/${loanId}/messages`);
      setMessages(Array.isArray(data) ? data : []);
      scrollToBottom();
    } catch (err) {
      console.warn('LoanThread: fetchMessages failed', err);

      // If token is bad, apiFetch may have cleared it — just route to login
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login', { replace: true });
        return;
      }

      setMessages([]);
      setErrMsg('Could not load messages. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [loanId, navigate]);

  const sendMessage = useCallback(async () => {
    const text = newMessage.trim();
    if (!text || !loanId) return;

    try {
      setErrMsg('');
      setSending(true);

      await apiFetch(`/api/loans/${loanId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      });

      setNewMessage('');
      await fetchMessages();
      scrollToBottom();
    } catch (err) {
      console.warn('LoanThread: sendMessage failed', err);
      setErrMsg('Could not send message.');
    } finally {
      setSending(false);
    }
  }, [loanId, newMessage, fetchMessages]);

  useEffect(() => {
    if (!loanId) return;
    fetchMessages();
  }, [loanId, fetchMessages]);

  return (
    <div style={{ padding: '2rem', maxWidth: 760, margin: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <h2 style={{ margin: 0 }}>💬 Loan Messages</h2>
        <button type="button" className="action-btn sm" onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>

      {errMsg && (
        <div
          style={{
            marginTop: 12,
            padding: '10px 12px',
            borderRadius: 10,
            background: '#fee2e2',
            color: '#991b1b',
            fontSize: 13,
          }}
        >
          {errMsg}
        </div>
      )}

      {loading ? (
        <p style={{ marginTop: 16 }}>Loading messages...</p>
      ) : (
        <>
          <div
            ref={listRef}
            style={{
              marginTop: 16,
              marginBottom: 16,
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: 12,
              maxHeight: 420,
              overflowY: 'auto',
              background: '#fff',
            }}
          >
            {messages.length === 0 ? (
              <p style={{ margin: 0 }}>No messages yet. Start the conversation!</p>
            ) : (
              messages.map((msg) => {
                const mine = !!msg.isMine; // if backend provides it
                const name = msg.user?.name || msg.sender?.name || 'User';
                const when = msg.createdAt ? new Date(msg.createdAt).toLocaleString() : '';

                return (
                  <div
                    key={msg.id || msg._id || when}
                    style={{
                      marginBottom: 10,
                      padding: 10,
                      borderRadius: 10,
                      background: mine ? '#e8f5e9' : '#f1f5f9',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                      <strong>{name}:</strong>
                      <small style={{ color: '#64748b' }}>{when}</small>
                    </div>
                    <div style={{ marginTop: 6, whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                  </div>
                );
              })
            )}
          </div>

          <textarea
            rows={3}
            style={{ width: '100%', marginBottom: 10 }}
            placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="action-btn sm"
              onClick={fetchMessages}
              disabled={loading || sending}
            >
              Refresh
            </button>
            <button
              type="button"
              className="action-btn sm primary"
              onClick={sendMessage}
              disabled={sending || !newMessage.trim()}
            >
              {sending ? 'Sending…' : 'Send Message'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default LoanThread;

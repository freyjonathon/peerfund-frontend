// src/features/loans/LoanThreadModal.jsx
import React, { useEffect, useRef, useState } from 'react';
import './LoanThreadModal.css';

function getToken() {
  return localStorage.getItem('token') || '';
}

export default function LoanThreadModal({ loanId, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  const token = getToken();

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/loans/${loanId}/messages`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to load messages');
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
      // scroll to bottom after initial load
      setTimeout(() => {
        if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
      }, 0);
    }
  };

  const sendMessage = async () => {
    const text = newMessage.trim();
    if (!text) return;
    try {
      setSending(true);
      const res = await fetch(`/api/loans/${loanId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content: text }),
      });
      if (!res.ok) throw new Error('Failed to send message');
      setNewMessage('');
      await fetchMessages(); // refresh
      // keep view pinned to bottom
      setTimeout(() => {
        if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
      }, 0);
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Could not send message.');
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (!loanId) return;
    fetchMessages();
    // optional: poll every 15s (comment out if not desired)
    // const id = setInterval(fetchMessages, 15000);
    // return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loanId]);

  if (!loanId) return null;

  return (
    <div className="pf-modal-backdrop" onClick={onClose}>
      <div
        className="pf-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 720 }}
      >
        <div className="pf-modal-header">
          <div className="pf-modal-title">💬 Loan Conversation</div>
          <button className="pf-modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="pf-modal-body">
          {loading ? (
            <div className="ltm-loading">Loading messages…</div>
          ) : (
            <>
              <div className="ltm-list" ref={listRef}>
                {messages.length === 0 ? (
                  <div className="ltm-empty">No messages yet. Start the conversation!</div>
                ) : (
                  messages.map((msg) => {
                    const name = msg.user?.name || msg.sender?.name || 'User';
                    const when = msg.createdAt
                      ? new Date(msg.createdAt).toLocaleString()
                      : '';
                    return (
                      <div key={msg.id} className="ltm-item">
                        <div className="ltm-item-head">
                          <span className="ltm-name">{name}</span>
                          <span className="ltm-when">{when}</span>
                        </div>
                        <div className="ltm-text">{msg.content}</div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="ltm-composer">
                <textarea
                  rows={3}
                  placeholder="Type your message…"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <div className="ltm-actions">
                  <button
                    className="action-btn primary"
                    onClick={sendMessage}
                    disabled={sending || !newMessage.trim()}
                    title="Send message"
                  >
                    {sending ? 'Sending…' : 'Send'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

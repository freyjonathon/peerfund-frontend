// src/features/loans/LoanThreadModal.jsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import './LoanThreadModal.css';
import { apiFetch } from '../../utils/api';

export default function LoanThreadModal({ loanId, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  const listRef = useRef(null);

  const scrollToBottom = () => {
    // next tick so DOM has rendered
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
      console.warn('LoanThreadModal: fetchMessages failed', err);
      setMessages([]);
      setErrMsg('Could not load messages. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [loanId]);

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
      console.warn('LoanThreadModal: sendMessage failed', err);
      setErrMsg('Could not send message.');
    } finally {
      setSending(false);
    }
  }, [loanId, newMessage, fetchMessages]);

  // Load messages when opened / loan changes
  useEffect(() => {
    if (!loanId) return;
    fetchMessages();
  }, [loanId, fetchMessages]);

  // Close on ESC
  useEffect(() => {
    const onEsc = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [onClose]);

  if (!loanId) return null;

  return (
    <div className="pf-modal-backdrop" onClick={onClose}>
      <div
        className="pf-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 720 }}
        role="dialog"
        aria-modal="true"
      >
        <div className="pf-modal-header">
          <div className="pf-modal-title">💬 Loan Conversation</div>
          <button
            type="button"
            className="pf-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="pf-modal-body">
          {loading ? (
            <div className="ltm-loading">Loading messages…</div>
          ) : (
            <>
              {errMsg && (
                <div
                  style={{
                    marginBottom: 10,
                    padding: '8px 10px',
                    borderRadius: 10,
                    background: '#fee2e2',
                    color: '#991b1b',
                    fontSize: 13,
                  }}
                >
                  {errMsg}
                </div>
              )}

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
                      <div key={msg.id || msg._id || when} className="ltm-item">
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
                  onKeyDown={(e) => {
                    // Enter sends, Shift+Enter newline
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <div className="ltm-actions">
                  <button
                    type="button"
                    className="action-btn"
                    onClick={fetchMessages}
                    disabled={loading || sending}
                    title="Refresh"
                  >
                    Refresh
                  </button>
                  <button
                    type="button"
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

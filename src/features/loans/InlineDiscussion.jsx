import React, { useEffect, useMemo, useRef, useState } from 'react';

function getToken() {
  return localStorage.getItem('token') || '';
}
function getCurrentUserId() {
  const t = getToken();
  if (!t) return null;
  try {
    const payload = JSON.parse(atob(t.split('.')[1] || ''));
    return payload?.userId ?? null;
  } catch {
    return null;
  }
}

/**
 * Inline discussion for a LOAN REQUEST thread (public).
 * Props:
 *   threadId: string  (loanRequest.id)
 *   limit?: number    (default 5 messages)
 *   pollMs?: number   (default 5000)
 */
export default function InlineDiscussion({ threadId, limit = 5, pollMs = 5000 }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [err, setErr] = useState('');
  const bottomRef = useRef(null);

  const currentUserId = useMemo(() => getCurrentUserId(), []);

  const baseUrl = `/api/loans/${threadId}/_messages`; // <-- underscore route

  const scrollToBottom = () =>
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });

  const fetchMessages = async () => {
    try {
      setErr('');
      const token = getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(baseUrl, { headers });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      // Normalize to what the UI needs; backend returns { user: { id, name }, userId }
      const normalized = (Array.isArray(data) ? data : []).map((m) => ({
        ...m,
        _displayName: m?.user?.name || 'User',
      }));
      setMessages(normalized);
    } catch (e) {
      console.error(e);
      setErr('Failed to load thread.');
    } finally {
      setLoading(false);
      setTimeout(scrollToBottom, 0);
    }
  };

  const send = async () => {
    const content = text.trim();
    if (!content) return;

    try {
      const token = getToken();
      if (!token) {
        alert('Please log in to post.');
        return;
      }
      setPosting(true);
      const res = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error(await res.text());
      const saved = await res.json();
      setMessages((prev) => [
        ...prev,
        { ...saved, _displayName: saved?.user?.name || 'You' },
      ]);
      setText('');
      setTimeout(scrollToBottom, 0);
    } catch (e) {
      console.error(e);
      alert('Failed to send message.');
    } finally {
      setPosting(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const id = setInterval(fetchMessages, pollMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  const last = messages.slice(-limit);

  return (
    <div className="lm-thread">
      <div className="lm-thread-header">Public Discussion</div>
      {err && <div className="lm-thread-error">{err}</div>}
      {loading ? (
        <div className="lm-thread-loading">Loading…</div>
      ) : (
        <>
          {last.length === 0 ? (
            <div className="lm-thread-empty">No messages yet. Start the conversation!</div>
          ) : (
            <div className="lm-thread-list">
              {last.map((m) => {
                const mine =
                  (m.userId && currentUserId && m.userId === currentUserId) ||
                  (m.user?.id && currentUserId && m.user.id === currentUserId);
                return (
                  <div key={m.id} className={`lm-msg ${mine ? 'mine' : ''}`}>
                    <div className="lm-msg-name">{m._displayName}</div>
                    <div className="lm-msg-body">{m.content}</div>
                    <div className="lm-msg-time">
                      {m.createdAt ? new Date(m.createdAt).toLocaleString() : ''}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          )}

          <div className="lm-thread-input">
            <textarea
              rows={2}
              placeholder="Write your message…"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button className="action-btn primary" onClick={send} disabled={posting}>
              {posting ? 'Sending…' : 'Send'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

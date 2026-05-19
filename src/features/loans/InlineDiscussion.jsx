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

export default function InlineDiscussion({
  threadId,
  limit = 5,
  pollMs = 5000,
}) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [err, setErr] = useState('');

  const bottomRef = useRef(null);

  const currentUserId = useMemo(() => getCurrentUserId(), []);

  // FIXED ROUTE
  const baseUrl = `/api/loans/${threadId}/messages`;

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  };

  const fetchMessages = async () => {
    try {
      setErr('');

      const token = getToken();

      const headers = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(baseUrl, { headers });

      // Better error handling
      if (!res.ok) {
        const text = await res.text();
        console.error('Thread fetch failed:', text);
        throw new Error(text);
      }

      const data = await res.json();

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

      if (!res.ok) {
        const text = await res.text();
        console.error('Send failed:', text);
        throw new Error(text);
      }

      const saved = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          ...saved,
          _displayName: saved?.user?.name || 'You',
        },
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
  }, [threadId]);

  const last = messages.slice(-limit);

  return (
    <div className="lm-thread">
      <div className="lm-thread-header">
        Public Discussion
      </div>

      {err && (
        <div className="lm-thread-error">
          {err}
        </div>
      )}

      {loading ? (
        <div className="lm-thread-loading">
          Loading…
        </div>
      ) : (
        <>
          {last.length === 0 ? (
            <div className="lm-thread-empty">
              No messages yet. Start the conversation!
            </div>
          ) : (
            <div className="lm-thread-list">
              {last.map((m) => {
                const mine =
                  (m.userId &&
                    currentUserId &&
                    m.userId === currentUserId) ||
                  (m.user?.id &&
                    currentUserId &&
                    m.user.id === currentUserId);

                return (
                  <div
                    key={m.id}
                    className={`lm-msg ${mine ? 'mine' : ''}`}
                  >
                    <div className="lm-msg-name">
                      {m._displayName}
                    </div>

                    <div className="lm-msg-body">
                      {m.content}
                    </div>

                    <div className="lm-msg-time">
                      {m.createdAt
                        ? new Date(
                            m.createdAt
                          ).toLocaleString()
                        : ''}
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
              placeholder="Write your message..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />

            <button
              className="action-btn primary"
              onClick={send}
              disabled={posting}
            >
              {posting ? 'Sending…' : 'Send'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
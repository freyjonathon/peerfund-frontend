import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const LoanThread = () => {
  const { loanId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/loans/${loanId}/messages`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!res.ok) throw new Error('Failed to load messages');
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  }, [loanId]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const res = await fetch(`/api/loans/${loanId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ content: newMessage }),
      });

      if (!res.ok) throw new Error('Failed to send message');
      setNewMessage('');
      await fetchMessages(); // Refresh messages
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  useEffect(() => {
    if (!loanId) return;
    setLoading(true);
    fetchMessages();
  }, [loanId, fetchMessages]);

  return (
    <div style={{ padding: '2rem', maxWidth: '700px', margin: 'auto' }}>
      <h2>💬 Loan Messages</h2>

      {loading ? (
        <p>Loading messages...</p>
      ) : (
        <div style={{ marginBottom: '2rem' }}>
          {messages.length === 0 ? (
            <p>No messages yet. Start the conversation!</p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  marginBottom: '1rem',
                  padding: '1rem',
                  borderRadius: '8px',
                  backgroundColor:
                    msg.senderId === msg.currentUserId ? '#e8f5e9' : '#f1f1f1',
                }}
              >
                <strong>{msg.sender?.name || 'User'}:</strong>
                <p>{msg.content}</p>
                <small>{new Date(msg.createdAt).toLocaleString()}</small>
              </div>
            ))
          )}
        </div>
      )}

      <div>
        <textarea
          rows="3"
          style={{ width: '100%', marginBottom: '1rem' }}
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button type="button" onClick={sendMessage}>
          Send Message
        </button>
      </div>
    </div>
  );
};

export default LoanThread;

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const Messaging = () => {
  const { loanId } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    if (!loanId || loanId === 'undefined') {
      console.warn('Loan ID is undefined. Skipping fetch.');
      return;
    }

    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/loans/${loanId}/messages`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (!res.ok) throw new Error('Failed to load messages');
        const data = await res.json();
        setMessages(data);
      } catch (err) {
        console.error('Error loading messages:', err.message);
      }
    };

    fetchMessages();
  }, [loanId]);

  const handleSend = async () => {
    if (!newMessage.trim() || !loanId || loanId === 'undefined') return;

    try {
      const res = await fetch(`/api/loans/${loanId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ text: newMessage }),
      });

      if (!res.ok) throw new Error('Failed to send message');
      const updated = await res.json();
      setMessages((prev) => [...prev, updated]);
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err.message);
      alert('Failed to send message.');
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      {/* Navigation */}
      <div style={{ marginBottom: '1rem' }}>
        <button onClick={() => navigate('/create-loan')}>Request a Loan</button>
        <button onClick={() => navigate('/loan-marketplace')}>View Open Loans</button>
        <button onClick={() => navigate('/money-summary')}>My Money Summary</button>
        <button onClick={() => navigate('/messages')}>My Messages</button>
        <button onClick={() => navigate('/history')}>History</button>
        <button onClick={() => navigate('/profile')}>Edit Profile</button>
        <button onClick={() => navigate('/payment-method')}>My Payment Method</button>
        <button onClick={() => navigate('/documents')}>My Documents</button>
      </div>

      <h2>📨 Direct Messaging {loanId ? `for Loan #${loanId}` : '(No Loan Selected)'}</h2>

      <div style={{ border: '1px solid #ccc', padding: '1rem', height: '300px', overflowY: 'scroll' }}>
        {messages.length === 0 ? (
          <p>No messages yet.</p>
        ) : (
          messages.map((msg, index) => (
            <div key={index} style={{ marginBottom: '1rem' }}>
              <strong>{msg.sender?.name || 'Unknown'}:</strong> {msg.text}
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: '1rem' }}>
        <input
          type="text"
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          style={{ width: '70%' }}
        />
        <button onClick={handleSend} style={{ marginLeft: '1rem' }} disabled={!loanId || loanId === 'undefined'}>
          Send
        </button>
      </div>
    </div>
  );
};

export default Messaging;

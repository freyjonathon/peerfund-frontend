import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Inbox = () => {
  const navigate = useNavigate();
  const [threads, setThreads] = useState([]);
  const userId = localStorage.getItem('userId'); // ← make sure this is set on login

  useEffect(() => {
    const fetchThreads = async () => {
      try {
        const res = await fetch('/api/messages/thread', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!res.ok) throw new Error('Failed to load threads');
        const data = await res.json();
        setThreads(data);
      } catch (err) {
        console.error('Error fetching message threads:', err.message);
      }
    };

    fetchThreads();
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h2>📬 Your Inbox</h2>

      {threads.length === 0 ? (
        <p>No conversations yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {threads.map((thread) => {
            const otherUser = thread.participants.find(p => p.id !== userId);
            const lastMessage = thread.messages[0]?.content || '(No messages yet)';
            const displayLoanId = thread.loanId || 'N/A';

            return (
              <li key={thread.id} style={{ marginBottom: '1rem', cursor: 'pointer' }}
                  onClick={() => navigate(`/loan/${displayLoanId}/messages`)}>
                <strong>Chat with {otherUser?.name || 'Unknown'}</strong><br />
                <small>Loan ID: {displayLoanId}</small><br />
                <em>Last message: {lastMessage}</em>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default Inbox;

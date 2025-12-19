import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Documents = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    fetch('/api/documents', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setDocuments(data);
        } else if (Array.isArray(data.documents)) {
          setDocuments(data.documents);
        } else {
          console.error('Unexpected document format:', data);
          setDocuments([]);
        }
      })
      .catch(err => console.error('Error loading documents:', err));
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <nav style={{ marginBottom: '2rem', borderBottom: '1px solid #ccc', paddingBottom: '1rem' }}>
        <button onClick={() => navigate('/')} style={navBtnStyle}>Home</button>
        <button onClick={() => navigate('/dashboard')} style={navBtnStyle}>Dashboard</button>
        <button onClick={() => navigate('/create-loan')} style={navBtnStyle}>Request a Loan</button>
        <button onClick={() => navigate('/loan-marketplace')} style={navBtnStyle}>Open Loans</button>
        <button onClick={() => navigate('/messages')} style={navBtnStyle}>Messages</button>
        <button onClick={() => navigate('/profile')} style={navBtnStyle}>Profile</button>
      </nav>

      <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>My Documents</h2>
      <p style={{ marginBottom: '2rem' }}>This section will contain all your loan agreements and received documents.</p>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/money-summary')} style={actionBtnStyle}>My Money Summary</button>
        <button onClick={() => navigate('/history')} style={actionBtnStyle}>Loan History</button>
        <button onClick={() => navigate('/payment-method')} style={actionBtnStyle}>My Payment Method</button>
        <button onClick={() => navigate('/documents')} style={actionBtnStyle}>My Documents</button>
      </div>

      {documents.length === 0 ? (
        <p style={{ marginTop: '2rem' }}>No documents yet.</p>
      ) : (
        <ul style={{ marginTop: '2rem' }}>
          {documents.map(doc => (
            <li key={doc.id} style={{ marginBottom: '1rem' }}>
              <strong>{doc.title}</strong> ({doc.type}) —{' '}
              <button
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/documents/${doc.id}`, {
                      headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                      },
                    });

                    if (!res.ok) throw new Error('Failed to fetch document');
                    const blob = await res.blob();
                    const url = window.URL.createObjectURL(blob);
                    window.open(url, '_blank');
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                  } catch (err) {
                    console.error('Error opening document:', err);
                    alert('Unable to open contract document.');
                  }
                }}
                style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }}
              >
                View Contract
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const navBtnStyle = {
  marginRight: '1rem',
  padding: '0.5rem 1rem',
  fontSize: '1rem',
  backgroundColor: '#f5f5f5',
  border: '1px solid #ccc',
  cursor: 'pointer',
};

const actionBtnStyle = {
  padding: '0.75rem 1.5rem',
  fontSize: '1rem',
  backgroundColor: '#e0f7fa',
  border: '1px solid #0097a7',
  borderRadius: '4px',
  cursor: 'pointer',
};

export default Documents;

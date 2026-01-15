// src/features/verification/VerificationPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './VerificationPage.css';

// ✅ Vercel env var. Locally falls back to localhost
const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5050').replace(/\/$/, '');

const VerificationPage = () => {
  const navigate = useNavigate();

  const [status, setStatus] = useState('LOADING'); // APPROVED | PENDING | REJECTED | ERROR
  const [notes, setNotes] = useState('');
  const [checklist, setChecklist] = useState(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const token = localStorage.getItem('token');

  const safeJson = async (res) => {
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      // If server returns HTML or plain text, this prevents "Unexpected token <"
      throw new Error(text || 'Non-JSON response from server');
    }
    return data;
  };

  const fetchStatus = async () => {
    if (!token) {
      setError('Not logged in');
      setStatus('ERROR');
      return;
    }

    try {
      setError('');

      // ✅ IMPORTANT: call the API domain, not the frontend domain
      const res = await fetch(`${API_BASE_URL}/api/verification/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to load verification status');
      }

      const data = await safeJson(res);
      console.log('[Verification] status response:', data);

      setChecklist(data);
      setStatus(data.status || 'PENDING');
      setNotes(data.notes || '');
    } catch (err) {
      console.error('VerificationPage fetchStatus error:', err);
      setError(err.message || 'Failed to load verification status');
      setStatus('ERROR');
    }
  };

  useEffect(() => {
    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If user already approved, don’t trap them here
  useEffect(() => {
    if (status === 'APPROVED') {
      navigate('/dashboard', { replace: true });
    }
  }, [status, navigate]);

  /**
   * Upload a single file to a given endpoint.
   * fieldId: id of <input type="file" ...>
   * endpoint: backend route, e.g. /api/verification/id/front
   */
  const uploadOne = async (fieldId, endpoint) => {
    if (!token) {
      setError('Not logged in');
      return;
    }

    const input = document.getElementById(fieldId);
    if (!input || !input.files || !input.files[0]) {
      alert('Please choose a file first.');
      return;
    }

    const file = input.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      setError('');
      setSubmitMessage('');

      // ✅ IMPORTANT: prefix API_BASE_URL
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Upload failed');
      }

      const data = await safeJson(res);
      console.log('[Verification] upload response:', data);

      if (data?.checklist) {
        setChecklist(data.checklist);
        setStatus(data.checklist.status || status);
      } else {
        await fetchStatus();
      }

      alert('Upload successful.');
    } catch (err) {
      console.error('uploadOne error:', err);
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const renderStatusMessage = () => {
    if (status === 'LOADING') return 'Checking your verification status…';
    if (status === 'PENDING') {
      return 'Your verification is pending. Please make sure all three photos are uploaded.';
    }
    if (status === 'REJECTED') {
      return (
        <>
          Your verification was rejected. Please re-upload clear, readable photos of your ID and selfie.
          {notes ? <div style={{ marginTop: 8 }}>Admin note: {notes}</div> : null}
        </>
      );
    }
    if (status === 'APPROVED') return 'You are verified! Redirecting to dashboard…';
    if (status === 'ERROR') return 'We were unable to load your verification status. Please try again in a moment.';
    return 'Unknown status.';
  };

  const allUploaded = checklist?.hasIdFront && checklist?.hasIdBack && checklist?.hasSelfie;

  const handleSubmitForReview = async () => {
    await fetchStatus();
    if (allUploaded) {
      setSubmitMessage(
        'Your photos are saved. An admin will review your account shortly. You will get full access once you are approved.'
      );
    } else {
      setSubmitMessage('Please upload front of ID, back of ID, and a selfie before submitting.');
    }
  };

  return (
    <div className="verify-shell">
      <div className="verify-card">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              padding: 0,
              color: '#0f172a',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span style={{ fontSize: 18 }}>←</span>
            <span>Back</span>
          </button>
          <span style={{ fontSize: 12, color: '#64748b' }}>
            Identity check – required before you can use PeerFund
          </span>
        </div>

        <h1>Verify your identity</h1>
        <p className="verify-status">{renderStatusMessage()}</p>

        {error && <div className="verify-error">{error}</div>}

        <div className="verify-grid">
          <div className="verify-field">
            <h3>Front of ID</h3>
            <p>Upload a clear photo of the front of your government-issued ID.</p>
            <input type="file" id="idFront" accept="image/*" />
            <button
              type="button"
              onClick={() => uploadOne('idFront', '/api/verification/id/front')}
              disabled={uploading}
            >
              Upload front of ID
            </button>
            {checklist?.hasIdFront && <div className="verify-ok">✓ Front of ID on file</div>}
          </div>

          <div className="verify-field">
            <h3>Back of ID</h3>
            <p>Upload a clear photo of the back of your ID.</p>
            <input type="file" id="idBack" accept="image/*" />
            <button
              type="button"
              onClick={() => uploadOne('idBack', '/api/verification/id/back')}
              disabled={uploading}
            >
              Upload back of ID
            </button>
            {checklist?.hasIdBack && <div className="verify-ok">✓ Back of ID on file</div>}
          </div>

          <div className="verify-field">
            <h3>Selfie</h3>
            <p>Upload a selfie. Make sure your face is clearly visible.</p>
            <input type="file" id="selfie" accept="image/*" />
            <button
              type="button"
              onClick={() => uploadOne('selfie', '/api/verification/selfie')}
              disabled={uploading}
            >
              Upload selfie
            </button>
            {checklist?.hasSelfie && <div className="verify-ok">✓ Selfie on file</div>}
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <button
            type="button"
            onClick={handleSubmitForReview}
            disabled={uploading}
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              border: 'none',
              cursor: !uploading ? 'pointer' : 'not-allowed',
              background: '#0f172a',
              color: '#f9fafb',
              fontWeight: 500,
            }}
          >
            Submit for review
          </button>
        </div>

        {submitMessage && (
          <p className="verify-footnote" style={{ marginTop: 12 }}>
            {submitMessage}
          </p>
        )}

        <p className="verify-footnote">
          Once all three photos are uploaded and submitted, an admin will review your account.
          You’ll get full access to PeerFund after approval.
        </p>
      </div>
    </div>
  );
};

export default VerificationPage;

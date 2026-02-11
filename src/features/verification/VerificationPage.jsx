// src/features/verification/VerificationPage.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './VerificationPage.css';

// ✅ Vercel env var. Locally falls back to localhost
const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5050').replace(/\/$/, '');

function getToken() {
  let t = localStorage.getItem('token') || '';
  t = t.replace(/^"|"$/g, '');
  if (t.toLowerCase().startsWith('bearer ')) t = t.slice(7);
  return t || '';
}

// Safer JSON parsing for non-JSON responses (HTML, plain text, etc.)
async function readJsonOrText(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text; // return raw text so caller can show it
  }
}

export default function VerificationPage() {
  const navigate = useNavigate();

  const [status, setStatus] = useState('LOADING'); // APPROVED | PENDING | REJECTED | ERROR
  const [notes, setNotes] = useState('');
  const [checklist, setChecklist] = useState(null);

  const [error, setError] = useState('');
  const [uploadingField, setUploadingField] = useState(null); // 'idFront' | 'idBack' | 'selfie' | null
  const [submitMessage, setSubmitMessage] = useState('');

  const token = useMemo(getToken, []);
  const mountedRef = useRef(true);

  const allUploaded = !!(checklist?.hasIdFront && checklist?.hasIdBack && checklist?.hasSelfie);

  async function fetchStatus() {
    if (!token) {
      setError('Not logged in');
      setStatus('ERROR');
      return;
    }

    try {
      setError('');
      const res = await fetch(`${API_BASE_URL}/api/verification/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const body = await readJsonOrText(res);

      if (!res.ok) {
        const msg =
          (typeof body === 'object' && body?.error) ||
          (typeof body === 'string' && body) ||
          `Failed to load verification status (${res.status})`;
        throw new Error(msg);
      }

      // checklist is returned directly from backend
      const data = body && typeof body === 'object' ? body : null;

      if (!data) {
        throw new Error('Unexpected response from server (empty or non-JSON).');
      }

      if (!mountedRef.current) return;

      setChecklist(data);
      setStatus(data.status || data.verificationStatus || 'PENDING');
      setNotes(data.notes || '');
    } catch (err) {
      console.error('VerificationPage fetchStatus error:', err);
      if (!mountedRef.current) return;
      setError(err?.message || 'Failed to load verification status');
      setStatus('ERROR');
    }
  }

  useEffect(() => {
    mountedRef.current = true;
    fetchStatus();
    return () => {
      mountedRef.current = false;
    };
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
   * inputId: id of <input type="file" ...>
   * endpoint: backend route, e.g. /api/verification/id/front
   */
  async function uploadOne(inputId, endpoint) {
    if (!token) {
      setError('Not logged in');
      return;
    }

    const input = document.getElementById(inputId);
    const file = input?.files?.[0];
    if (!file) {
      setError('Please choose a file first.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadingField(inputId);
      setError('');
      setSubmitMessage('');

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          // DO NOT set Content-Type for FormData; browser will set boundary
        },
        body: formData,
      });

      const body = await readJsonOrText(res);

      if (!res.ok) {
        const msg =
          (typeof body === 'object' && body?.error) ||
          (typeof body === 'string' && body) ||
          `Upload failed (${res.status})`;
        throw new Error(msg);
      }

      // expected: { message, checklist }
      const nextChecklist =
        body && typeof body === 'object' ? body?.checklist || body?.data?.checklist : null;

      if (nextChecklist) {
        setChecklist(nextChecklist);
        setStatus(nextChecklist.status || nextChecklist.verificationStatus || status);
      } else {
        await fetchStatus();
      }

      // reset the file input so user can re-upload same file if needed
      if (input) input.value = '';

      setSubmitMessage('Upload successful.');
    } catch (err) {
      console.error('uploadOne error:', err);
      setError(err?.message || 'Upload failed');
    } finally {
      setUploadingField(null);
    }
  }

  function renderStatusMessage() {
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
  }

  async function handleSubmitForReview() {
    await fetchStatus();
    if (allUploaded) {
      setSubmitMessage(
        'Your photos are saved. An admin will review your account shortly. You will get full access once you are approved.'
      );
    } else {
      setSubmitMessage('Please upload front of ID, back of ID, and a selfie before submitting.');
    }
  }

  const isUploading = !!uploadingField;

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
          {/* Front of ID */}
          <div className="verify-field">
            <h3>Front of ID</h3>
            <p>Upload a clear photo of the front of your government-issued ID.</p>

            <input type="file" id="idFront" accept="image/*" />

            <button
              type="button"
              onClick={() => uploadOne('idFront', '/api/verification/id/front')}
              disabled={isUploading}
            >
              {uploadingField === 'idFront' ? 'Uploading…' : 'Upload front of ID'}
            </button>

            {checklist?.hasIdFront && <div className="verify-ok">✓ Front of ID on file</div>}
          </div>

          {/* Back of ID */}
          <div className="verify-field">
            <h3>Back of ID</h3>
            <p>Upload a clear photo of the back of your ID.</p>

            <input type="file" id="idBack" accept="image/*" />

            <button
              type="button"
              onClick={() => uploadOne('idBack', '/api/verification/id/back')}
              disabled={isUploading}
            >
              {uploadingField === 'idBack' ? 'Uploading…' : 'Upload back of ID'}
            </button>

            {checklist?.hasIdBack && <div className="verify-ok">✓ Back of ID on file</div>}
          </div>

          {/* Selfie */}
          <div className="verify-field">
            <h3>Selfie</h3>
            <p>Upload a selfie. Make sure your face is clearly visible.</p>

            <input type="file" id="selfie" accept="image/*" />

            <button
              type="button"
              onClick={() => uploadOne('selfie', '/api/verification/selfie')}
              disabled={isUploading}
            >
              {uploadingField === 'selfie' ? 'Uploading…' : 'Upload selfie'}
            </button>

            {checklist?.hasSelfie && <div className="verify-ok">✓ Selfie on file</div>}
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <button
            type="button"
            onClick={handleSubmitForReview}
            disabled={isUploading}
            style={{
              padding: '8px 16px',
              borderRadius: 999,
              border: 'none',
              cursor: !isUploading ? 'pointer' : 'not-allowed',
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
          Once all three (3) photos are uploaded and submitted, an admin will review your account.
          You’ll get full access to PeerFund after approval.
        </p>
      </div>
    </div>
  );
}

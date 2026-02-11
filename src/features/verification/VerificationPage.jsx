// src/features/verification/VerificationPage.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './VerificationPage.css';

const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5050').replace(/\/$/, '');

function getToken() {
  let t = localStorage.getItem('token') || '';
  t = t.replace(/^"|"$/g, '');
  if (t.toLowerCase().startsWith('bearer ')) t = t.slice(7);
  return t || null;
}

async function safeJson(res) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    throw new Error(text || 'Non-JSON response from server');
  }
}

/**
 * Resize/compress an image file in the browser to avoid 413 payload limits.
 * - maxDim: max width/height
 * - quality: jpeg quality
 */
async function compressImageFile(file, { maxDim = 1600, quality = 0.82 } = {}) {
  // If not an image, just return original
  if (!file?.type?.startsWith('image/')) return file;

  const img = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = URL.createObjectURL(file);
  });

  const { width, height } = img;
  const scale = Math.min(1, maxDim / Math.max(width, height));
  const targetW = Math.round(width * scale);
  const targetH = Math.round(height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, targetW, targetH);

  const blob = await new Promise((resolve) => {
    canvas.toBlob(
      (b) => resolve(b),
      'image/jpeg',
      quality
    );
  });

  // Cleanup object URL
  try { URL.revokeObjectURL(img.src); } catch {}

  if (!blob) return file;

  return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
}

export default function VerificationPage() {
  const navigate = useNavigate();

  const [status, setStatus] = useState('LOADING'); // APPROVED | PENDING | REJECTED | ERROR
  const [notes, setNotes] = useState('');
  const [checklist, setChecklist] = useState(null);
  const [error, setError] = useState('');
  const [uploadingField, setUploadingField] = useState(''); // 'idFront' | 'idBack' | 'selfie'
  const [submitMessage, setSubmitMessage] = useState('');

  const token = useMemo(() => getToken(), []);

  const idFrontRef = useRef(null);
  const idBackRef = useRef(null);
  const selfieRef = useRef(null);

  const allUploaded = checklist?.hasIdFront && checklist?.hasIdBack && checklist?.hasSelfie;

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

      if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(t || 'Failed to load verification status');
      }

      const data = await safeJson(res);
      setChecklist(data);
      setStatus(data?.status || 'PENDING');
      setNotes(data?.notes || '');
    } catch (err) {
      console.error('VerificationPage fetchStatus error:', err);
      setError(err?.message || 'Failed to load verification status');
      setStatus('ERROR');
    }
  }

  useEffect(() => {
    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (status === 'APPROVED') {
      navigate('/dashboard', { replace: true });
    }
  }, [status, navigate]);

  function renderStatusMessage() {
    if (status === 'LOADING') return 'Checking your verification status…';
    if (status === 'PENDING') return 'Your verification is pending. Please make sure all three photos are uploaded.';
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

  async function uploadOne(which, endpoint) {
    if (!token) {
      setError('Not logged in');
      return;
    }

    const ref =
      which === 'idFront' ? idFrontRef :
      which === 'idBack' ? idBackRef :
      selfieRef;

    const file = ref?.current?.files?.[0];
    if (!file) {
      alert('Please choose a file first.');
      return;
    }

    try {
      setUploadingField(which);
      setError('');
      setSubmitMessage('');

      // Client-side safety: big files tend to fail on hosted APIs
      // We compress images to reduce size dramatically.
      const compressed = await compressImageFile(file, { maxDim: 1600, quality: 0.82 });

      // Extra guard: if still massive, stop early (tune this as needed)
      const maxBytes = 4.5 * 1024 * 1024; // 4.5MB
      if (compressed.size > maxBytes) {
        throw new Error('That photo is still too large after compression. Please choose a smaller image.');
      }

      const formData = new FormData();
      formData.append('file', compressed);

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const t = await res.text().catch(() => '');
        // If proxy returns 413, make it explicit
        if (res.status === 413) throw new Error('Upload too large (413). Try a smaller photo.');
        throw new Error(t || `Upload failed (${res.status})`);
      }

      const data = await safeJson(res);

      // Prefer server returned checklist if provided
      if (data?.checklist) {
        setChecklist(data.checklist);
        setStatus(data.checklist.status || status);
      } else {
        await fetchStatus();
      }
    } catch (err) {
      console.error('uploadOne error:', err);
      setError(err?.message || 'Upload failed');
    } finally {
      setUploadingField('');
    }
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

  const uploading = !!uploadingField;

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
            <input ref={idFrontRef} type="file" accept="image/*" />
            <button
              type="button"
              onClick={() => uploadOne('idFront', '/api/verification/id/front')}
              disabled={uploading}
            >
              {uploadingField === 'idFront' ? 'Uploading…' : 'Upload front of ID'}
            </button>
            {checklist?.hasIdFront && <div className="verify-ok">✓ Front of ID on file</div>}
          </div>

          <div className="verify-field">
            <h3>Back of ID</h3>
            <p>Upload a clear photo of the back of your ID.</p>
            <input ref={idBackRef} type="file" accept="image/*" />
            <button
              type="button"
              onClick={() => uploadOne('idBack', '/api/verification/id/back')}
              disabled={uploading}
            >
              {uploadingField === 'idBack' ? 'Uploading…' : 'Upload back of ID'}
            </button>
            {checklist?.hasIdBack && <div className="verify-ok">✓ Back of ID on file</div>}
          </div>

          <div className="verify-field">
            <h3>Selfie</h3>
            <p>Upload a selfie. Make sure your face is clearly visible.</p>
            <input ref={selfieRef} type="file" accept="image/*" />
            <button
              type="button"
              onClick={() => uploadOne('selfie', '/api/verification/selfie')}
              disabled={uploading}
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
          Once all three (3) photos are uploaded and submitted, an admin will review your account.
          You’ll get full access to PeerFund after approval.
        </p>
      </div>
    </div>
  );
}

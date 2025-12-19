// src/components/DocumentViewer.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const DocumentViewer = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [doc, setDoc] = useState(null);
  const [objectUrl, setObjectUrl] = useState('');

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        setLoading(true);
        setErr('');

        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login', { replace: true });
          return;
        }

        const res = await fetch(`/api/documents/${documentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // If unauthorized, force re-login
        if (res.status === 401) {
          navigate('/login', { replace: true });
          return;
        }

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || 'Failed to load document');
        }

        // Expecting JSON like: { id, title, mimeType, fileName, base64 }
        const data = await res.json();

        if (!alive) return;
        setDoc(data);

        // If backend returns base64 for binary docs, create a blob URL
        if (data?.base64 && data?.mimeType) {
          const byteChars = atob(data.base64);
          const byteNumbers = new Array(byteChars.length);
          for (let i = 0; i < byteChars.length; i++) {
            byteNumbers[i] = byteChars.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: data.mimeType });
          const url = URL.createObjectURL(blob);
          setObjectUrl(url);
        }
      } catch (e) {
        console.error('DocumentViewer load error:', e);
        if (alive) setErr(e.message || 'Error: Document not found');
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();

    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  if (loading) return <div style={{ padding: 16 }}>Loading…</div>;
  if (err) return <div style={{ padding: 16 }}>Error: {err}</div>;
  if (!doc) return <div style={{ padding: 16 }}>Error: Document not found</div>;

  const mime = doc.mimeType || '';
  const isImage = mime.startsWith('image/');
  const isPdf = mime === 'application/pdf';

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <h2 style={{ margin: 0 }}>{doc.title || doc.fileName || 'Document'}</h2>
        <button onClick={() => navigate(-1)}>← Back</button>
      </div>

      <div style={{ marginTop: 12, color: '#64748b' }}>
        <div><b>Type:</b> {doc.type || '—'}</div>
        <div><b>File:</b> {doc.fileName || '—'}</div>
        <div><b>MIME:</b> {doc.mimeType || '—'}</div>
      </div>

      <hr style={{ margin: '16px 0' }} />

      {!objectUrl ? (
        <div>No preview available.</div>
      ) : isImage ? (
        <img
          src={objectUrl}
          alt={doc.title || doc.fileName || 'Uploaded document'}
          style={{ maxWidth: '100%', borderRadius: 12, border: '1px solid #e5e7eb' }}
        />
      ) : isPdf ? (
        <iframe
          title="PDF Preview"
          src={objectUrl}
          style={{ width: '100%', height: '80vh', border: '1px solid #e5e7eb', borderRadius: 12 }}
        />
      ) : (
        <div>
          <p>This file type can’t be previewed here.</p>
          <a href={objectUrl} download={doc.fileName || 'document'}>
            Download file
          </a>
        </div>
      )}
    </div>
  );
};

export default DocumentViewer;

// src/features/auth/VerifiedRoute.jsx
import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5050').replace(/\/$/, '');

function getJwtPayload(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function VerifiedRoute() {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      setAllowed(false);
      setLoading(false);
      return;
    }

    // ✅ Admins bypass verification entirely
    const payload = getJwtPayload(token);
    const role = (payload?.role || '').toUpperCase();
    if (role === 'ADMIN') {
      setAllowed(true);
      setLoading(false);
      return;
    }

    const run = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/verification/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const contentType = res.headers.get('content-type') || '';
        const text = await res.text();

        if (!res.ok) {
          setAllowed(false);
          return;
        }

        // Prevent "Unexpected token <" by refusing HTML responses
        if (!contentType.includes('application/json')) {
          console.error('VerifiedRoute got non-JSON response:', text.slice(0, 200));
          setAllowed(false);
          return;
        }

        const data = text ? JSON.parse(text) : null;
        const status = (data?.status || 'PENDING').toUpperCase();
        setAllowed(status === 'APPROVED');
      } catch (e) {
        console.error('VerifiedRoute error:', e);
        setAllowed(false);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  if (loading) return null;
  if (!allowed) return <Navigate to="/verify" replace />;
  return <Outlet />;
}

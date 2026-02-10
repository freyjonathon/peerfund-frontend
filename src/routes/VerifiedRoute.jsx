// src/features/auth/VerifiedRoute.jsx
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { apiFetch } from '../../utils/api';

const VerifiedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [allow, setAllow] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        if (!cancelled) {
          setAllow(false);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);

        // 1) profile (role)
        const profile = await apiFetch('/api/users/profile');

        // Admin bypass
        if (String(profile?.role || '').toUpperCase() === 'ADMIN') {
          if (!cancelled) setAllow(true);
          return;
        }

        // 2) verification status
        const ver = await apiFetch('/api/verification/status');
        const status = String(ver?.status || '').toUpperCase();

        if (!cancelled) setAllow(status === 'APPROVED');
      } catch (err) {
        console.error('VerifiedRoute error:', err);
        if (!cancelled) setAllow(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div style={{ padding: 24 }}>Checking your account status…</div>;
  if (!allow) return <Navigate to="/verify" replace />;
  return children;
};

export default VerifiedRoute;

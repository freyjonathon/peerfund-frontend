// src/features/auth/VerifiedRoute.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';

// ✅ Use the same API base logic as VerificationPage
const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5050').replace(/\/$/, '');

async function safeJson(res) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    throw new Error(text || 'Non-JSON response from server');
  }
}

const VerifiedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [allow, setAllow] = useState(false);

  const token = useMemo(() => localStorage.getItem('token'), []);
  const headers = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!token) {
        if (!cancelled) {
          setAllow(false);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);

        // 1) Load profile so we can see the user's role
        const profileRes = await fetch(`${API_BASE_URL}/api/users/profile`, { headers });
        if (!profileRes.ok) {
          const text = await profileRes.text();
          throw new Error(text || 'Failed to load profile');
        }
        const profile = await safeJson(profileRes);

        // If ADMIN, skip verification entirely
        if (profile?.role === 'ADMIN') {
          if (!cancelled) setAllow(true);
          return;
        }

        // 2) For normal users, check verification status
        const verRes = await fetch(`${API_BASE_URL}/api/verification/status`, { headers });
        if (!verRes.ok) {
          const text = await verRes.text();
          throw new Error(text || 'Failed to load verification status');
        }
        const data = await safeJson(verRes);

        const status = String(data?.status || '').toUpperCase();
        if (!cancelled) setAllow(status === 'APPROVED');
      } catch (err) {
        console.error('VerifiedRoute error:', err);
        // Fail closed: send to verify if anything is unknown
        if (!cancelled) setAllow(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [token, headers]);

  if (loading) {
    return <div style={{ padding: 24 }}>Checking your account status…</div>;
  }

  if (!allow) {
    return <Navigate to="/verify" replace />;
  }

  return children;
};

export default VerifiedRoute;

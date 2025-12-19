// src/features/auth/VerifiedRoute.jsx
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

const VerifiedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [allow, setAllow] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      setAllow(false);
      return;
    }

    const run = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };

        // 1) Load profile so we can see the user's role
        const profileRes = await fetch('/api/users/profile', { headers });
        if (!profileRes.ok) {
          throw new Error('Failed to load profile');
        }
        const profile = await profileRes.json();

        // If ADMIN, skip verification entirely
        if (profile.role === 'ADMIN') {
          setAllow(true);
          setLoading(false);
          return;
        }

        // 2) For normal users, check verification status
        const verRes = await fetch('/api/verification/status', { headers });
        if (!verRes.ok) {
          throw new Error('Failed to load verification status');
        }
        const data = await verRes.json();

        // Expect data.status from your verification controller
        if (data.status === 'APPROVED') {
          setAllow(true);
        } else {
          // PENDING / REJECTED / anything else → must go to /verify
          setAllow(false);
        }
      } catch (err) {
        console.error('VerifiedRoute error:', err);
        // On error, be safe and send user to /verify instead of crashing
        setAllow(false);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        Checking your account status…
      </div>
    );
  }

  if (!allow) {
    return <Navigate to="/verify" replace />;
  }

  return children;
};

export default VerifiedRoute;

// src/components/RequireAdmin.jsx
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

const RequireAdmin = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      setIsAdmin(false);
      return;
    }

    const checkAdmin = async () => {
      try {
        const res = await fetch('/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error('Failed to load profile');
        }

        const data = await res.json();
        // Your backend returns role: 'ADMIN' | 'USER' | 'SUPERUSER'
        if (data.role === 'ADMIN') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (err) {
        console.error('RequireAdmin error:', err);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '1rem' }}>
        Checking admin access…
      </div>
    );
  }

  if (!isAdmin) {
    // They’re logged in but not an admin – send back to normal app
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default RequireAdmin;

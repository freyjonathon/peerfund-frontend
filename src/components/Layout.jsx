// src/components/Layout.jsx
import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { apiFetch } from '../utils/api';

const Layout = () => {
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const token = localStorage.getItem('token');
    if (!token) {
      setUserLoading(false);
      return () => {
        cancelled = true;
      };
    }

    const loadProfile = async () => {
      try {
        const data = await apiFetch('/api/users/profile');
        if (!cancelled) setUser(data);
      } catch (err) {
        console.error('Layout: failed to load user profile', err);

        // If token is invalid/expired, stop the cascade of errors on every page
        const msg = String(err?.message || '');
        if (msg.includes('HTTP 401') || msg.includes('HTTP 403')) {
          try {
            localStorage.removeItem('token');
          } catch {
            // ignore
          }
        }

        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setUserLoading(false);
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <Navbar user={user} />
      <div style={{ display: 'flex' }}>
        <Sidebar user={user} userLoading={userLoading} />
        <main style={{ flexGrow: 1, padding: '1rem' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;

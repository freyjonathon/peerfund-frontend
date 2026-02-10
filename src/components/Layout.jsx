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

    const loadProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        if (!cancelled) setUserLoading(false);
        return;
      }

      try {
        const data = await apiFetch('/api/users/profile');
        if (!cancelled) setUser(data); // expects { role, name, isSuperUser, ... }
      } catch (err) {
        console.error('Layout: failed to load user profile', err);
        // Optional: if you want to hard-reset auth on failure:
        // localStorage.removeItem('token');
        // window.location.href = '/login';
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
      {/* Navbar can optionally use the user (e.g. show name / role) */}
      <Navbar user={user} />

      <div style={{ display: 'flex' }}>
        {/* Sidebar gets user + loading so it can show admin link conditionally */}
        <Sidebar user={user} userLoading={userLoading} />

        <main style={{ flexGrow: 1, padding: '1rem' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;

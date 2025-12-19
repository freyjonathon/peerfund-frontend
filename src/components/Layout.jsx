// src/components/Layout.jsx
import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout = () => {
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUserLoading(false);
      return;
    }

    const loadProfile = async () => {
      try {
        const res = await fetch('/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          throw new Error('Failed to load profile');
        }
        const data = await res.json();
        setUser(data); // expects { role, name, isSuperUser, ... }
      } catch (err) {
        console.error('Layout: failed to load user profile', err);
      } finally {
        setUserLoading(false);
      }
    };

    loadProfile();
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

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
    const token = localStorage.getItem('token');
    if (!token) {
      setUserLoading(false);
      return;
    }

    const loadProfile = async () => {
      try {
        const data = await apiFetch('/api/users/profile');
        setUser(data);
      } catch (err) {
        console.error('Layout: failed to load user profile', err);
        setUser(null);
      } finally {
        setUserLoading(false);
      }
    };

    loadProfile();
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

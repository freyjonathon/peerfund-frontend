// src/features/auth/AdminRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

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

export default function AdminRoute() {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;

  const payload = getJwtPayload(token);
  const role = (payload?.role || '').toUpperCase();

  if (role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

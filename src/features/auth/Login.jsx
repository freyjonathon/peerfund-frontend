// src/features/auth/Login.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

function normalizePhone(p) {
  return (p || '').replace(/\D+/g, '').slice(0, 15);
}

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

const Login = () => {
  const [formData, setFormData] = useState({ phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((s) => ({
      ...s,
      [name]: name === 'phone' ? normalizePhone(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const text = await res.text();
      let data = null;
      try {
      data = text ? JSON.parse(text) : null;
      } catch (parseError) {
      console.warn('Login response was not valid JSON.', parseError);
      }


      if (!res.ok || !data?.token) {
        setErr(data?.error || data?.message || 'Login failed');
        return;
      }

      localStorage.setItem('token', data.token);

      // ✅ Route Admins to admin dashboard, everyone else to normal dashboard
      const payload = getJwtPayload(data.token);
      const role = payload?.role;

      if (role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      console.error('Login error:', error);
      setErr('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-header">
          <div className="auth-logo">PF</div>
          <div className="auth-title">Welcome Back</div>
        </div>

        <div className="auth-sub">Sign in to continue to your PeerFund account.</div>

        <div className="auth-field">
          <label className="auth-label" htmlFor="phone">Phone</label>
          <input
            id="phone"
            name="phone"
            className="auth-input"
            type="tel"
            autoComplete="tel"
            value={formData.phone}
            onChange={handleChange}
            required
          />
        </div>

        <div className="auth-field">
          <label className="auth-label" htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            className="auth-input"
            type="password"
            autoComplete="current-password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        {err && <div className="auth-error">{err}</div>}

        <div className="auth-actions">
          <button className="auth-btn primary" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Login'}
          </button>
          <Link className="auth-btn ghost" to="/signup">Create account</Link>
        </div>

        <div className="auth-footer">
          <button type="button" className="auth-link" onClick={() => navigate('/')}>
            ← Back to Home
          </button>
          <Link to="/reset-password" className="auth-link">Forgot Password?</Link>
        </div>
      </form>
    </div>
  );
};

export default Login;

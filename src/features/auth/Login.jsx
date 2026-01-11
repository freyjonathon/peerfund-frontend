// src/features/auth/Login.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

// ✅ Uses env var in Vercel, defaults to local for dev
const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5050').replace(/\/$/, '');

const Login = () => {
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');

    try {
      setLoading(true);

      // ✅ Call your deployed backend (or localhost in dev)
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // ok even if you aren't using cookies
        body: JSON.stringify(formData),
      });

      const text = await res.text();
      let data = null;

      try {
        data = text ? JSON.parse(text) : null;
      } catch (err) {
        // Not JSON (could be HTML error), keep data null
      }

      if (res.ok && data?.token) {
        localStorage.setItem('token', data.token);
        navigate('/dashboard');
      } else {
        setErr(data?.error || data?.message || 'Login failed');
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
        <div className="auth-sub">
          Sign in to continue to your PeerFund account.
        </div>

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
          <button
            type="button"
            className="auth-link"
            onClick={() => navigate('/')}
          >
            ← Back to Home
          </button>
          <Link to="/reset-password" className="auth-link">
            Forgot Password?
          </Link>
        </div>
      </form>
    </div>
  );
};

export default Login;

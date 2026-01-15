// src/features/auth/SignUp.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

// ✅ Vercel env var. Locally falls back to localhost
const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5050').replace(/\/$/, '');

function normalizePhone(p) {
  return (p || '').replace(/\D+/g, '').slice(0, 15);
}
function normalizeEmail(e) {
  return (e || '').trim().toLowerCase();
}
function niceConflictMessage(errText = '') {
  const t = String(errText || '').toLowerCase();
  if (t.includes('email') && t.includes('already')) return 'That email is already registered.';
  if (t.includes('phone') && t.includes('already')) return 'That phone number is already registered.';
  if (t.includes('p2002')) return 'An account already exists with these details.';
  return 'Account already exists with these details.';
}

export default function SignUp() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });
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
    if (loading) return;

    setErr('');

    const payload = {
      name: formData.name.trim(),
      email: normalizeEmail(formData.email),
      phone: normalizePhone(formData.phone),
      password: formData.password,
    };

    // client-side checks
    if (!payload.name || !payload.email || !payload.phone || !payload.password) {
      setErr('Please fill out all fields.');
      return;
    }
    if (payload.password.length < 6) {
      setErr('Password must be at least 6 characters.');
      return;
    }
    if (payload.phone.length < 10) {
      setErr('Please enter a valid phone number.');
      return;
    }

    try {
      setLoading(true);

      // ✅ matches your backend controller: POST /api/auth/register
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (_) {
        // non-JSON response (HTML error page, etc.)
      }

      if (!res.ok) {
        const serverMsg = data?.error || data?.message || text || '';
        if (res.status === 409) throw new Error(niceConflictMessage(serverMsg));
        throw new Error(serverMsg || 'Registration failed.');
      }

      const token = data?.token;
      if (token) localStorage.setItem('token', token);
      navigate('/dashboard');
    } catch (e) {
      console.error('Registration error:', e);
      setErr(e?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <div className="auth-header">
          <div className="auth-logo">PF</div>
          <div className="auth-title">Create Your Account</div>
        </div>

        <div className="auth-sub">
          Join PeerFund and start lending or borrowing with your community.
        </div>

        <div className="auth-field">
          <label className="auth-label" htmlFor="name">Name</label>
          <input
            id="name"
            name="name"
            className="auth-input"
            type="text"
            autoComplete="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="auth-field">
          <label className="auth-label" htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            className="auth-input"
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
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
            autoComplete="new-password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={6}
          />
        </div>

        {err && <div className="auth-error">{err}</div>}

        <div className="auth-actions">
          <button className="auth-btn primary" type="submit" disabled={loading}>
            {loading ? 'Registering…' : 'Sign Up'}
          </button>
          <Link className="auth-btn ghost" to="/login">Already have an account?</Link>
        </div>

        <div className="auth-footer">
          <button type="button" className="auth-link" onClick={() => navigate('/')}>
            ← Back to Home
          </button>
        </div>
      </form>
    </div>
  );
}

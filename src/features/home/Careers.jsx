// src/features/home/Careers.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import peerfundGlobe from '../../assets/PeerFundGlobe.png';

export default function Careers() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    linkedin: '',
    role: '',
    whyPeerFund: '',
  });
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(false);

  const API_BASE = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.role || !resume) {
      alert('Please complete name, email, role, and upload a PDF resume.');
      return;
    }

    if (resume.type !== 'application/pdf') {
      alert('Please upload your resume as a PDF.');
      return;
    }

    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => body.append(key, value));
    body.append('resume', resume);

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/api/careers/apply`, {
        method: 'POST',
        body,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Application failed.');
      }

      alert('Application submitted! Thanks for your interest in PeerFund.');

      setForm({
        name: '',
        email: '',
        phone: '',
        linkedin: '',
        role: '',
        whyPeerFund: '',
      });
      setResume(null);
    } catch (err) {
      alert(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home">
      <nav className="container hero__nav" aria-label="Careers navigation">
        <div className="hero__brand">
          <button className="btn btn--ghost hero__brand-btn" onClick={() => navigate('/')}>
            ← PeerFund
          </button>
        </div>

        <div className="hero__links hide-sm">
          <button className="btn btn--ghost" onClick={() => navigate('/about')}>About</button>
          <button className="btn btn--ghost" onClick={() => navigate('/how-it-works')}>How it works</button>
          <button className="btn btn--ghost" onClick={() => navigate('/contact')}>Contact</button>
        </div>

        <div className="hero__auth">
          <button className="btn btn--ghost" onClick={() => navigate('/login')}>Log in</button>
          <button className="btn btn--primary" onClick={() => navigate('/signup')}>Sign up</button>
        </div>
      </nav>

      <section className="hero">
        <span className="hero__glow hero__glow--a" aria-hidden />
        <span className="hero__glow hero__glow--b" aria-hidden />

        <div className="container hero__copy">
          <div className="hero__logo-showcase">
            <img src={peerfundGlobe} alt="PeerFund" className="hero__logo-large" />
          </div>

          <div className="hero__kicker">Careers</div>
          <h1 className="hero__title">Help build the future of community lending</h1>

          <p className="hero__meta" style={{ maxWidth: 820 }}>
            PeerFund is looking for early builders, operators, and problem-solvers who want to help
            create a fairer way for people to access and provide short-term funding.
          </p>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <div className="card story__card" style={{ maxWidth: 760, margin: '0 auto' }}>
            <div className="kicker">Apply to join PeerFund</div>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14, marginTop: 18 }}>
              <input name="name" placeholder="Full name" value={form.name} onChange={handleChange} />
              <input name="email" placeholder="Email" value={form.email} onChange={handleChange} />
              <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} />
              <input name="linkedin" placeholder="LinkedIn URL" value={form.linkedin} onChange={handleChange} />
              <input name="role" placeholder="Role interested in" value={form.role} onChange={handleChange} />

              <textarea
                name="whyPeerFund"
                placeholder="Why do you want to help build PeerFund?"
                rows={5}
                value={form.whyPeerFund}
                onChange={handleChange}
              />

              <label className="text-muted">
                Resume PDF
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setResume(e.target.files?.[0] || null)}
                  style={{ display: 'block', marginTop: 8 }}
                />
              </label>

              <button className="btn btn--primary btn--lg" type="submit" disabled={loading}>
                {loading ? 'Submitting…' : 'Submit application'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
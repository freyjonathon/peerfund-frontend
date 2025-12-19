// src/features/profile/UserProfile.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserProfile.css';
import LendingTermsEditor from './LendingTermsEditor';

export default function UserProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    location: '',
    maxLoan: '',
    summary: '',
  });

  // Load my profile
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/users/profile', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        if (!res.ok) throw new Error('Failed to fetch profile');
        const data = await res.json();
        setProfile({
          name: data.name ?? '',
          location: data.location ?? '',
          maxLoan: data.maxLoan ?? '',
          summary: data.summary ?? '',
        });
      } catch (e) {
        console.error('Profile load error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onChange = (e) =>
    setProfile((p) => ({ ...p, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const body = {
        ...profile,
        maxLoan:
          profile.maxLoan === '' || profile.maxLoan === null
            ? null
            : Number(profile.maxLoan),
      };

      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error((await res.text()) || 'Save failed');
      await res.json();
      alert('Profile updated successfully!');
      navigate('/dashboard');
    } catch (err) {
      console.error('Save failed:', err);
      alert('There was an error updating your profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="up-shell">
        <div className="up-card up-card--loading">Loading profile…</div>
      </div>
    );
  }

  return (
    <div className="up-shell">
      <header className="up-header">
        <div className="up-eyebrow">Account</div>
        <h2 className="up-title">Edit Profile</h2>
        <p className="up-subtitle">
          This is what borrowers and lenders see on your PeerFund profile. Keep it
          short, clear, and up to date.
        </p>
      </header>

      <form className="up-card" onSubmit={onSubmit}>
        <div className="up-grid">
          <div className="up-field">
            <div className="up-label-row">
              <label htmlFor="name">Name</label>
              <span className="up-label-meta">Required</span>
            </div>
            <input
              id="name"
              name="name"
              type="text"
              value={profile.name}
              onChange={onChange}
              required
              placeholder="Your full name"
            />
          </div>

          <div className="up-field">
            <div className="up-label-row">
              <label htmlFor="location">Location</label>
              <span className="up-label-meta">Optional</span>
            </div>
            <input
              id="location"
              name="location"
              type="text"
              value={profile.location}
              onChange={onChange}
              placeholder="City, State"
            />
          </div>
        </div>

        <div className="up-field up-field--full">
          <div className="up-label-row">
            <label htmlFor="summary">Personal summary</label>
            <span className="up-label-meta">Public</span>
          </div>
          <textarea
            id="summary"
            name="summary"
            rows={5}
            value={profile.summary}
            onChange={onChange}
            placeholder="Share a short intro—what you do, why you're here, and what matters to you."
          />
          <div className="up-hint">
            Clear, specific summaries build trust and attract better loan partners.
          </div>
        </div>

        <div className="up-divider" />

        <div className="up-actions">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>
          <button
            type="submit"
            className="btn btn--primary btn--lg"
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save Profile'}
          </button>
        </div>
      </form>

      {/* Lending terms section gets its own spacing below the card */}
      <section className="up-section">
        <LendingTermsEditor />
      </section>
    </div>
  );
}

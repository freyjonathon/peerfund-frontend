// src/features/dashboard/Dashboard.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopLenders from '../../components/TopLenders';
import UserProfileCard from '../../components/UserProfileCard';
import { apiFetch } from '../../utils/api';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [userName, setUserName] = useState('User');
  const [superUser, setSuperUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  const [showProfile, setShowProfile] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileErr, setProfileErr] = useState('');
  const [profileUser, setProfileUser] = useState(null);

  const [supOpen, setSupOpen] = useState(false);
  const supBtnRef = useRef(null);
  const supPopRef = useRef(null);

  const toggleSup = () => setSupOpen((v) => !v);
  const closeSup = () => setSupOpen(false);

  useEffect(() => {
    if (!supOpen) return;

    const onClick = (e) => {
      if (supPopRef.current?.contains(e.target)) return;
      if (supBtnRef.current?.contains(e.target)) return;
      closeSup();
    };

    const onEsc = (e) => {
      if (e.key === 'Escape') closeSup();
    };

    window.addEventListener('click', onClick);
    window.addEventListener('keydown', onEsc);

    return () => {
      window.removeEventListener('click', onClick);
      window.removeEventListener('keydown', onEsc);
    };
  }, [supOpen]);

  const fetchPosts = async () => {
    try {
      const data = await apiFetch('/api/posts');
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching posts:', err);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        navigate('/login', { replace: true });
        return;
      }

      try {
        const profile = await apiFetch('/api/users/profile');
        if (cancelled) return;

        setUserName(profile?.name || 'User');
        setSuperUser(!!profile?.isSuperUser);

        await fetchPosts();
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
        localStorage.removeItem('token');
        navigate('/login', { replace: true });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    init();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePost = async () => {
    if (!newPost.trim()) return;

    try {
      await apiFetch('/api/posts', {
        method: 'POST',
        body: JSON.stringify({ content: newPost }),
      });

      setNewPost('');
      fetchPosts();
    } catch (err) {
      console.error('Error posting:', err);
      alert('Failed to post.');
    }
  };

  const handleUpgrade = async () => {
    if (upgrading || superUser) return;

    try {
      setUpgrading(true);

      const token = localStorage.getItem('token');

      if (!token) {
        navigate('/login', { replace: true });
        return;
      }

      let hasPayment = false;

      try {
        const pmData = await apiFetch('/api/billing/has-loan-payment-method');
        hasPayment = !!pmData?.hasLoanPaymentMethod;
      } catch (e) {
        console.warn('Could not check saved bank account:', e);
        hasPayment = false;
      }

      if (!hasPayment) {
        const go = window.confirm(
          'To upgrade to SuperUser, please save a bank account in your Wallet first.\n\nGo to Wallet now?'
        );

        if (go) navigate('/wallet');
        return;
      }

      const result = await apiFetch('/api/users/superuser/upgrade', {
        method: 'POST',
      });

      setSuperUser(true);
      closeSup();

      if (result?.alreadySuperUser) {
        alert('You are already a SuperUser.');
      } else {
        alert(
          '🎉 You’re now a SuperUser! Your monthly $1 fee will use your saved bank account.'
        );
      }
    } catch (err) {
      console.error('Upgrade error:', err);
      alert(`Failed to upgrade:\n${err.message || err}`);
    } finally {
      setUpgrading(false);
    }
  };

  const getToday = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  };

  const openProfile = async (userId) => {
    if (!userId) return;

    setShowProfile(true);
    setProfileLoading(true);
    setProfileErr('');
    setProfileUser(null);

    try {
      const data = await apiFetch(`/api/users/${userId}/profile`);
      setProfileUser(data);
    } catch (e) {
      console.error(e);
      setProfileErr('Failed to load profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const closeProfile = () => {
    setShowProfile(false);
    setProfileUser(null);
    setProfileErr('');
  };

  const handleRequestFromCard = ({ amount, rate, lenderId }) => {
    if (!amount || !rate) {
      const amtStr = window.prompt('Amount (50, 100, 150, 200, 250):');
      const amt = parseInt(amtStr, 10);

      if (![50, 100, 150, 200, 250].includes(amt)) return;

      const rateStr = window.prompt('APR (%) offered by this lender:');
      const r = Number(rateStr);

      if (!Number.isFinite(r)) return;

      amount = amt;
      rate = r;
    }

    const monthsStr = window.prompt(`How many months for $${amount} at ${rate}% APR? (1–24)`);
    const months = Math.max(1, Math.min(24, parseInt(monthsStr || '0', 10)));

    if (!months) return;

    const ok = window.confirm(`Send request for $${amount} at ${rate}% APR over ${months} months?`);

    if (!ok) return;

    navigate(`/direct-request/${lenderId}?amount=${amount}&rate=${rate}&months=${months}`);
  };

  if (loading) {
    return (
      <div className="db-shell center">
        <div className="db-loader">Loading your dashboard…</div>
      </div>
    );
  }

  return (
    <div className="db-shell">
      <header className="db-hero card-glass">
        <div className="db-hero-text">
          <h2 className="db-title">Hey {userName}, Happy {getToday()}!</h2>

          {superUser && (
            <p className="db-subtitle">
              You’re a SuperUser – platform fees are waived on your repayments. 🎉
            </p>
          )}
        </div>

        {!superUser && (
          <div className="db-cta">
            <div>
              <button
                ref={supBtnRef}
                type="button"
                className="chip chip--clickable"
                onClick={toggleSup}
                aria-haspopup="dialog"
                aria-expanded={supOpen}
                aria-controls="sup-popover"
                title="Learn about SuperUser"
                disabled={upgrading}
              >
                Become a SuperUser
              </button>

              <div className="db-cta-text">
                <h3>
                  Skip platform fee for <strong>$1/mo</strong>
                </h3>
                <p>Support PeerFund and unlock a few nice perks.</p>
              </div>
            </div>

            <button
              className="action-btn primary"
              onClick={handleUpgrade}
              disabled={upgrading}
            >
              {upgrading ? 'Processing…' : 'Upgrade now'}
            </button>

            {supOpen && (
              <>
                <div
                  className="sup-popover"
                  id="sup-popover"
                  role="dialog"
                  aria-modal="false"
                  ref={supPopRef}
                >
                  <div className="sup-popover__head">
                    <div className="sup-popover__title">SuperUser benefits</div>
                  </div>

                  <ul className="sup-popover__list">
                    <li>
                      <strong>Skip the 3% platform fee</strong> on repayments.
                    </li>
                    <li>
                      <strong>SuperUser badge</strong> on your profile and posts.
                    </li>
                    <li>
                      <strong>Priority support</strong> &amp; early access to new features.
                    </li>
                  </ul>

                  <div className="sup-popover__actions">
                    <button className="btn" onClick={closeSup} disabled={upgrading}>
                      Maybe later
                    </button>

                    <button
                      className="btn-primary"
                      onClick={handleUpgrade}
                      disabled={upgrading}
                    >
                      {upgrading ? 'Processing…' : 'Upgrade for $1/mo'}
                    </button>
                  </div>
                </div>

                <div className="sup-popover__overlay" />
              </>
            )}
          </div>
        )}
      </header>

      <div className="db-grid">
        <section className="card-panel">
          <div className="panel-head">
            <h3>Share with the community</h3>
          </div>

          <div className="composer">
            <input
              type="text"
              placeholder="What’s on your mind?"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
            />

            <button className="btn" onClick={handlePost}>
              Post
            </button>
          </div>

          <h4 className="section-label">📢 PeerFeed</h4>

          <div className="feed">
            {posts.length === 0 ? (
              <div className="empty">No posts yet. Be the first to say hi!</div>
            ) : (
              posts.map((post) => {
                const authorId = post?.user?.id || post?.userId;
                const authorName = post?.user?.name || 'Unknown';

                return (
                  <article key={post.id || post._id} className="feed-item">
                    <div className="feed-top">
                      <button
                        className="link"
                        onClick={() => openProfile(authorId)}
                        disabled={!authorId}
                        title={authorId ? 'View profile' : undefined}
                      >
                        {authorName}
                      </button>

                      <time className="time">
                        {new Date(post.createdAt).toLocaleString()}
                      </time>
                    </div>

                    <p className="content">{post.content}</p>
                  </article>
                );
              })
            )}
          </div>
        </section>

        <aside className="card-panel side">
          <div className="panel-head">
            <h3>Top 10 Lenders</h3>
          </div>

          <div className="side-card">
            <TopLenders />
          </div>
        </aside>
      </div>

      {showProfile && (
        <div className="pfm-backdrop" onClick={closeProfile}>
          <div
            className="pfm-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <button className="pfm-close" onClick={closeProfile} aria-label="Close">
              ✕
            </button>

            {profileLoading ? (
              <div className="pfm-body pfm-center">
                <div className="pfm-spinner" />
              </div>
            ) : profileErr ? (
              <div className="pfm-body pfm-error">{profileErr}</div>
            ) : (
              <div className="pfm-body">
                <UserProfileCard
                  user={profileUser}
                  onMessage={() => navigate(`/messages?to=${profileUser?.id}`)}
                  onRequest={handleRequestFromCard}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
// src/components/Navbar.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import WalletBadge from '../features/wallet/WalletBadge';
import './Navbar.css';

// ✅ New logo assets
import peerfundWordmark from '../assets/PeerFund.png';
import peerfundGlobe from '../assets/PeerFundGlobe.png';

const Navbar = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!document.body.getAttribute('data-sidebar')) {
      document.body.setAttribute('data-sidebar', 'closed');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const toggleSidebar = () => {
    const cur = document.body.getAttribute('data-sidebar');

    document.body.setAttribute(
      'data-sidebar',
      cur === 'open' ? 'closed' : 'open'
    );
  };

  return (
    <header className="navbar">

      {/* LEFT */}
      <div
        className="nav-left"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >

        {/* Globe = Sidebar Toggle */}
        <button
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          style={{
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src={peerfundGlobe}
            alt="PeerFund Menu"
            style={{
              width: '52px',
              height: '52px',
              objectFit: 'contain',
            }}
          />
        </button>

        {/* Wordmark */}
        <div
          onClick={() => navigate('/dashboard')}
          style={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <img
            src={peerfundWordmark}
            alt="PeerFund"
            style={{
              height: '28px',
              width: 'auto',
              objectFit: 'contain',
            }}
          />
        </div>
      </div>

      {/* CENTER SPACER */}
      <div className="nav-center" />

      {/* RIGHT */}
      <div className="nav-right">

        <div className="navbar__bell">
          <NotificationBell />
        </div>

        <div className="navbar__wallet">
          <WalletBadge />
        </div>

        <button
          className="navbar__btn"
          onClick={handleLogout}
        >
          Logout
        </button>

      </div>
    </header>
  );
};

export default Navbar;
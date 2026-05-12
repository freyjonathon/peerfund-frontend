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
      <div className="nav-left">

        <button
          className="navbar__toggle"
          aria-label="Toggle sidebar"
          onClick={toggleSidebar}
        >
          <span className="navbar__toggle-bar" />
          <span className="navbar__toggle-bar" />
          <span className="navbar__toggle-bar" />
        </button>

        {/* ✅ New PeerFund Branding */}
        <div
          className="navbar__brand"
          onClick={() => navigate('/dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
          }}
        >
          {/* Globe icon */}
          <img
            src={peerfundGlobe}
            alt="PeerFund Globe"
            style={{
              width: '42px',
              height: '42px',
              objectFit: 'contain',
            }}
          />

          {/* Wordmark */}
          <img
            src={peerfundWordmark}
            alt="PeerFund"
            style={{
              height: '26px',
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
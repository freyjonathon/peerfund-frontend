// src/components/Navbar.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import WalletBadge from '../features/wallet/WalletBadge';
import './Navbar.css';

import peerfundGlobe from '../assets/PeerFundGlobe.png';

const Navbar = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

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
      <div className="nav-left">
        <button
          className="navbar__globe-btn"
          aria-label="Toggle sidebar"
          onClick={toggleSidebar}
        >
          <img src={peerfundGlobe} alt="PeerFund menu" className="navbar__globe" />
        </button>

        <div
            className="navbar__brand"
            onClick={() => navigate('/dashboard')}
          >
            <div className="navbar__text-logo">
              <span className="navbar__text-logo-blue">PEER</span>
              <span className="navbar__text-logo-green">FUND</span>
            </div>

            <div className="navbar__powered-by">
              powered by <strong>Stripe</strong>
            </div>
          </div>
      </div>

      <div className="nav-center" />

      <div className="nav-right">
        <div className="navbar__wallet">
          <WalletBadge />
        </div>

        <div className="navbar__menu-wrap">
          <button
            className="navbar__menu-btn"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label="Open account menu"
          >
            Menu ▾
          </button>

          {menuOpen && (
            <div className="navbar__dropdown">
              <div className="navbar__dropdown-item">
                <NotificationBell />
                <span>Notifications</span>
              </div>

              <button className="navbar__dropdown-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
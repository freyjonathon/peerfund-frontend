// src/components/Navbar.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import WalletBadge from '../features/wallet/WalletBadge';
import './Navbar.css';

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
    document.body.setAttribute('data-sidebar', cur === 'open' ? 'closed' : 'open');
  };

  return (
    <header className="navbar">
      {/* Left: Hamburger */}
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
      </div>

      {/* Center: Brand */}
      <div className="nav-center">
        <h3 className="navbar__brand" onClick={() => navigate('/dashboard')}>
          PeerFund
        </h3>
      </div>

      {/* Right: Notifications, Wallet, Logout */}
      <div className="nav-right">
        <div className="navbar__bell"><NotificationBell /></div>
        <div className="navbar__wallet"><WalletBadge /></div>
        <button className="navbar__btn" onClick={handleLogout}>Logout</button>
      </div>
    </header>
  );
};

export default Navbar;

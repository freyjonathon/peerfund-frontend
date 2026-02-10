// src/components/Sidebar.jsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ user }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Add Admin item only if this user is an admin
  const items = React.useMemo(() => {
    // Base nav items for everyone
    const baseItems = [
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Open Loans to Invest In', to: '/loan-marketplace' },
      { label: 'Loan Request Form', to: '/create-loan' },
      { label: 'My Money Summary', to: '/money-summary' },
      { label: 'Wallet', to: '/wallet' },
      { label: 'Payment Method', to: '/payment-method' },
      { label: 'Transaction History', to: '/history' },
      { label: 'Edit Profile', to: '/profile' },
    ];

    const list = [...baseItems];
    if (user && user.role === 'ADMIN') {
      list.push({ label: 'Admin', to: '/admin' });
    }
    return list;
  }, [user]);

  const closeDrawer = () => {
    document.body.setAttribute('data-sidebar', 'closed');
  };

  return (
    <>
      <div
        className="sidebar__backdrop"
        onClick={closeDrawer}
        aria-hidden="true"
      />

      <aside className="sidebar">
        <div className="sidebar__brand">PeerFund</div>

        <ul className="sidebar__nav" role="navigation" aria-label="Primary">
          {items.map((item) => {
            const active = pathname === item.to;
            return (
              <li key={item.to}>
                <button
                  className={`sidebar__btn ${active ? 'is-active' : ''}`}
                  onClick={() => {
                    navigate(item.to);
                    closeDrawer();
                  }}
                  aria-current={active ? 'page' : undefined}
                >
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>
    </>
  );
};

export default Sidebar;

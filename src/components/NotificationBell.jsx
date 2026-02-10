// src/components/NotificationBell.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  const dropdownRef = useRef(null);

  const getIcon = (type) => {
    switch (type) {
      case 'message':
        return '💬';
      case 'offer':
        return '💰';
      case 'contract':
        return '📄';
      default:
        return '🔔';
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleString();
  };

  const safeSetList = (list) => {
    const arr = Array.isArray(list) ? list : [];
    setNotifications(arr);
    setUnreadCount(arr.filter((n) => !n?.read).length);
  };

  useEffect(() => {
    let cancelled = false;

    const fetchNotifications = async () => {
      // If not logged in, just show empty bell (no errors)
      const token = localStorage.getItem('token');
      if (!token) {
        if (!cancelled) safeSetList([]);
        return;
      }

      try {
        const data = await apiFetch('/api/notifications');
        if (cancelled) return;
        safeSetList(data);
      } catch (err) {
        // Common in prod when endpoint isn't deployed yet (404) or token expired (401)
        const msg = String(err?.message || '');

        // If auth is bad, clear token to stop repeated errors across the app
        if (msg.includes('HTTP 401') || msg.includes('HTTP 403')) {
          try {
            localStorage.removeItem('token');
          } catch {
            // ignore
          }
        }

        // Fail silently: bell still renders, dropdown shows "No notifications"
        if (!cancelled) safeSetList([]);

        // Keep one console log for visibility (but no hard crash)
        console.warn('🔔 Notifications unavailable:', err);
      }
    };

    fetchNotifications();

    return () => {
      cancelled = true;
    };
  }, []);

  // Close dropdown on outside click + ESC
  useEffect(() => {
    if (!showDropdown) return;

    const onClickOutside = (e) => {
      if (dropdownRef.current?.contains(e.target)) return;
      setShowDropdown(false);
    };
    const onEsc = (e) => {
      if (e.key === 'Escape') setShowDropdown(false);
    };

    window.addEventListener('click', onClickOutside);
    window.addEventListener('keydown', onEsc);
    return () => {
      window.removeEventListener('click', onClickOutside);
      window.removeEventListener('keydown', onEsc);
    };
  }, [showDropdown]);

  const handleBellClick = (e) => {
    e.stopPropagation();
    setShowDropdown((v) => !v);
  };

  const markAllAsRead = async (e) => {
    e.stopPropagation();
    try {
      await apiFetch('/api/notifications/mark-all-read', {
        method: 'POST',
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      // If endpoint doesn't exist yet, don't blow up UI
      console.warn('mark-all-read unavailable:', err);
    }
  };

  const handleOpenNotification = (n) => {
    setShowDropdown(false);

    // Navigate to a known target
    if (n?.loanId) return navigate(`/loan/${n.loanId}`);
    if (n?.url) return navigate(n.url);
    return navigate('/dashboard');
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        type="button"
        onClick={handleBellClick}
        style={{ fontSize: '1.25rem', position: 'relative' }}
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-6px',
              right: '-6px',
              backgroundColor: 'red',
              color: 'white',
              borderRadius: '50%',
              padding: '2px 6px',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              lineHeight: 1,
              minWidth: 18,
              textAlign: 'center',
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '2.5rem',
            background: '#fff',
            border: '1px solid #ccc',
            borderRadius: '4px',
            width: '320px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            zIndex: 1000,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>
            <strong>Notifications</strong>
            <button
              type="button"
              onClick={markAllAsRead}
              style={{ float: 'right', fontSize: '0.75rem' }}
            >
              Mark all as read
            </button>
          </div>

          {notifications.length === 0 ? (
            <div style={{ padding: '1rem' }}>No notifications</div>
          ) : (
            notifications.map((n, i) => (
              <div
                key={n?.id || i}
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: n?.read ? '#f9f9f9' : '#e6f7ff',
                  borderBottom: '1px solid #eee',
                  cursor: 'pointer',
                }}
                onClick={() => handleOpenNotification(n)}
              >
                <div>
                  <span style={{ marginRight: '0.5rem' }}>{getIcon(n?.type)}</span>
                  {n?.message || 'Notification'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#666' }}>
                  {formatTimestamp(n?.createdAt)}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

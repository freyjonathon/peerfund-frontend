// src/components/NotificationBell.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const fetchNotifications = async () => {
      try {
        const data = await apiFetch('/api/notifications');
        const list = Array.isArray(data) ? data : [];

        if (cancelled) return;
        setNotifications(list);
        setUnreadCount(list.filter((n) => !n.read).length);
      } catch (err) {
        console.error('🔔 Error loading notifications:', err);
        if (!cancelled) {
          setNotifications([]);
          setUnreadCount(0);
        }
      }
    };

    fetchNotifications();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleBellClick = () => {
    setShowDropdown((v) => !v);
  };

  const markAllAsRead = async () => {
    try {
      await apiFetch('/api/notifications/mark-all-read', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark notifications as read', err);
    }
  };

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
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={handleBellClick} style={{ fontSize: '1.25rem', position: 'relative' }}>
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
        >
          <div style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>
            <strong>Notifications</strong>
            <button onClick={markAllAsRead} style={{ float: 'right', fontSize: '0.75rem' }}>
              Mark all as read
            </button>
          </div>

          {notifications.length === 0 ? (
            <div style={{ padding: '1rem' }}>No notifications</div>
          ) : (
            notifications.map((n, i) => (
              <div
                key={n.id || i}
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: n.read ? '#f9f9f9' : '#e6f7ff',
                  borderBottom: '1px solid #eee',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  setShowDropdown(false);
                  if (n.loanId) navigate(`/loan/${n.loanId}`);
                }}
              >
                <div>
                  <span style={{ marginRight: '0.5rem' }}>{getIcon(n.type)}</span>
                  {n.message}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#666' }}>
                  {formatTimestamp(n.createdAt)}
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

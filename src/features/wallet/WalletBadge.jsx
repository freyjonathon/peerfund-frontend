import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';

export default function WalletBadge() {
  const [cents, setCents] = useState(0);
  const [loading, setLoading] = useState(false);

  const refreshBalance = async () => {
    try {
      setLoading(true);
      const w = await apiFetch('/api/wallet');
      setCents(Number(w?.availableCents || 0));
    } catch (err) {
      console.warn('Failed to refresh wallet', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const w = await apiFetch('/api/wallet');
        if (!cancelled) setCents(Number(w?.availableCents || 0));
      } catch (err) {
        console.warn('Failed to refresh wallet', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const dollars = (cents / 100).toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
  });

  return (
    <button className="balance-pill" onClick={refreshBalance} type="button">
      <span className="pill-label">Balance</span>
      <span className="pill-amount">{loading ? ' ...' : dollars}</span>
    </button>
  );
}

import React, { useEffect, useState } from 'react';
import { fetchWallet } from './walletApi';

export default function WalletBadge() {
  const [cents, setCents] = useState(0);
  const [loading, setLoading] = useState(false);

  const refreshBalance = async () => {
    try {
      setLoading(true);
      const w = await fetchWallet();
      setCents(w.availableCents || 0);
    } catch (err) {
      console.warn('Failed to refresh wallet', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    refreshBalance();
  }, []);

  const dollars = (cents / 100).toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
  });

  return (
    <button className="balance-pill" onClick={refreshBalance}>
      <span className="pill-label">Balance</span>
      <span className="pill-amount">
        {loading ? ' ...' : dollars}
      </span>
    </button>
  );
}

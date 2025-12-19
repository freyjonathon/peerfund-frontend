// src/features/wallet/walletApi.js
function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchWallet() {
  const res = await fetch('/api/wallet/me', {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to fetch wallet');
  }
  return res.json();
}

export async function createDepositIntent({ amountDollars }) {
  const res = await fetch('/api/wallet/deposit-intent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ amountDollars }),
  });

  const text = await res.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch {}

  if (!res.ok) {
    throw new Error(data.error || text || 'Failed to create deposit');
  }

  return data; // { clientSecret, simulated } or { simulated, available... }
}

export async function createDeposit({ amountDollars }) {
  const token = localStorage.getItem('token');
  const res = await fetch('/api/wallet/deposit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ amountDollars }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    throw new Error(data.error || 'Failed to create deposit');
  }
  return data; // { ok: true, availableCents, pendingCents }
}

// src/features/wallet/walletApi.js
import axios from 'axios';

export async function withdrawFromWallet({ amountDollars }) {
  const token = localStorage.getItem('token');

  const res = await axios.post(
    '/api/wallet/withdraw',
    { amountDollars },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return res.data;
}

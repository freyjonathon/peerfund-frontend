// src/features/wallet/walletApi.js
import { apiFetch } from '../../utils/api';

/**
 * GET /api/wallet/me
 */
export async function fetchWallet() {
  return apiFetch('/api/wallet/me');
}

/**
 * POST /api/wallet/deposit
 * Body: { amountDollars }
 */
export async function createDeposit({ amountDollars }) {
  return apiFetch('/api/wallet/deposit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amountDollars }),
  });
}

/**
 * POST /api/wallet/withdraw
 * Body: { amountDollars }
 */
export async function withdrawFromWallet({ amountDollars }) {
  return apiFetch('/api/wallet/withdraw', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amountDollars }),
  });
}

/**
 * POST /api/stripe/connect-onboarding-link
 * Returns: { url, accountId }
 */
export async function createConnectOnboardingLink() {
  return apiFetch('/api/stripe/connect-onboarding-link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * GET /api/stripe/connect-account
 * Returns Connect payout setup status
 */
export async function fetchConnectAccountStatus() {
  return apiFetch('/api/stripe/connect-account');
}
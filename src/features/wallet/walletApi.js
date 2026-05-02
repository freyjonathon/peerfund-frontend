// src/features/wallet/walletApi.js
import { apiFetch } from '../../utils/api';

export async function fetchWallet() {
  return apiFetch('/api/wallet/me');
}

export async function createDeposit({ amountDollars }) {
  return apiFetch('/api/wallet/deposit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amountDollars }),
  });
}

export async function createAchDeposit({ amountDollars }) {
  return apiFetch('/api/wallet/deposit-ach', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amountDollars }),
  });
}

export async function createBankSetupIntent() {
  return apiFetch('/api/stripe/create-bank-setup-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function saveAchPaymentMethod({ paymentMethodId }) {
  return apiFetch('/api/stripe/save-ach-payment-method', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentMethodId }),
  });
}

export async function withdrawFromWallet({ amountDollars }) {
  return apiFetch('/api/wallet/withdraw', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amountDollars }),
  });
}

export async function createConnectOnboardingLink() {
  return apiFetch('/api/stripe/connect-onboarding-link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function fetchConnectAccountStatus() {
  return apiFetch('/api/stripe/connect-account');
}
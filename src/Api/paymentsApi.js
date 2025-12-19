// src/api/paymentsApi.js
import { http } from '../features/wallet/walletApi';

/* ---------------- Stripe SetupIntent flow ---------------- */

// Ask backend to create a Stripe SetupIntent for the logged-in user
// Returns: { clientSecret }
export function createSetupIntent() {
  return http('/api/payments/create-setup-intent', { method: 'POST' });
}

// (Optional) Check if the user already has a default payment method
// Returns: { hasDefault: boolean }
export function hasDefaultPaymentMethod() {
  return http('/api/payments/has-default-payment-method');
}

/* ---------------- Saved payment methods (your DB) ---------------- */

// List my saved payment methods
// Returns: { items: [{ id, stripePaymentMethodId, brand, last4, isDefault, isForLoans, createdAt }, ...] }
export function listMyPaymentMethods() {
  return http('/api/payment-method/mine');
}

// Save a new Stripe PM (pm_xxx) to my profile after client-side confirmSetup
// Body: { paymentMethodId, makeDefault?: boolean, useForLoans?: boolean }
export function savePaymentMethod({ paymentMethodId, makeDefault = true, useForLoans = false }) {
  return http('/api/payment-method/save', {
    method: 'POST',
    body: JSON.stringify({ paymentMethodId, makeDefault, useForLoans }),
  });
}

// Set which saved PM is my default for deposits/repayments
// Body: { id }
export function setDefaultPaymentMethod({ id }) {
  return http('/api/payment-method/set-default', {
    method: 'POST',
    body: JSON.stringify({ id }),
  });
}

// Set which saved PM receives loan payouts
// Body: { id }
export function setLoanReceivingBank({ id }) {
  return http('/api/payment-method/set-loan-bank', {
    method: 'POST',
    body: JSON.stringify({ id }),
  });
}

// Archive/remove a saved PM
export function archivePaymentMethod(id) {
  return http(`/api/payment-method/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

// Public profile masked bank (optional endpoint)
// Returns: { last4, brand } or 404 if none
export function getPublicReceivingBankMasked(userId) {
  return http(`/api/payment-method/public-receive/${encodeURIComponent(userId)}`);
}

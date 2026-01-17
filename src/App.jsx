// src/App.jsx
import React, { useMemo } from 'react';
import { Routes, Route } from 'react-router-dom';
import './styles/tokens.css';
import './styles/ui.css';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import Layout from './components/Layout';
import Home from './features/home/Home';
import SignUp from './features/auth/SignUp';
import Login from './features/auth/Login';
import PrivateRoute from './features/auth/PrivateRoute';

import Dashboard from './features/dashboard/Dashboard';
import Documents from './features/dashboard/Documents';
import TransactionHistory from './features/dashboard/TransactionHistory';
import MoneySummary from './features/dashboard/MoneySummary';
import UserProfile from './features/profile/UserProfile';
import CreateLoan from './features/loans/CreateLoan';
import LoanMarketplace from './features/loans/LoanMarketplace';
import LoanDetails from './features/loans/LoanDetails';
import Messaging from './features/messaging/Messaging';
import LoanThread from './features/messaging/LoanThread';
import RepaymentTracker from './features/dashboard/RepaymentTracker';
import History from './features/dashboard/TransactionHistory';
import DocumentViewer from './components/DocumentViewer';
import Inbox from './features/dashboard/Inbox';
import DirectRequestConfirm from './features/direct/DirectRequestConfirm';
import WalletPage from './features/wallet/WalletPage';
import PaymentMethod from './features/wallet/PaymentMethod';

// Admin pages
import AdminDashboard from './features/admin/AdminDashboard';
import AdminVerificationDetail from './features/admin/AdminVerificationDetail';

// Verification gate + page
import VerifiedRoute from './features/auth/VerifiedRoute';
import VerificationPage from './features/verification/VerificationPage';

// ✅ NEW: admin-only route guard (Outlet-based)
import AdminRoute from './routes/AdminRoute';

/* ---------------- Stripe publishable key (CRA + Vite) ---------------- */
const rawPk =
  (typeof import.meta !== 'undefined' &&
    import.meta.env &&
    import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) ||
  process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY ||
  '';

const pk = (rawPk || '').trim();
const looksLikeStripePk = /^pk_(test|live)_[A-Za-z0-9_]+$/.test(pk);

/* Cache stripe promise only if pk is valid */
let cachedStripePromise;
function getStripe() {
  if (!looksLikeStripePk) return null;
  if (!cachedStripePromise) cachedStripePromise = loadStripe(pk);
  return cachedStripePromise;
}

/**
 * Shared routes (with or without Stripe). The only difference between the
 * two branches is whether everything is wrapped in <Elements>.
 */
function AppRoutes() {
  return (
    <Routes>
      {/* ---------------- Public routes ---------------- */}
      <Route path="/" element={<Home />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/login" element={<Login />} />
      <Route path="/loan/:loanId/repayments" element={<RepaymentTracker />} />
      <Route path="/transaction-history" element={<TransactionHistory />} />

      {/* ---------------- Verification page (USER flow) ---------------- */}
      <Route
        path="/verify"
        element={
          <PrivateRoute>
            <VerificationPage />
          </PrivateRoute>
        }
      />

      {/* ---------------- Admin routes (NO verification gate) ----------------
          Admins are allowed here even if not verified.
      */}
      <Route
        element={
          <PrivateRoute>
            <AdminRoute />
          </PrivateRoute>
        }
      >
        <Route path="/admin" element={<AdminDashboard />} />
        <Route
          path="/admin/verification/:userId"
          element={<AdminVerificationDetail />}
        />
      </Route>

      {/* ---------------- Protected app shell + verification gate ---------------- */}
      <Route
        element={
          <PrivateRoute>
            <VerifiedRoute>
              <Layout />
            </VerifiedRoute>
          </PrivateRoute>
        }
      >
        {/* Dashboard & Profile */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<UserProfile />} />

        {/* Loan Features */}
        <Route path="/create-loan" element={<CreateLoan />} />
        <Route path="/loan-marketplace" element={<LoanMarketplace />} />
        <Route path="/loan/:loanId" element={<LoanDetails />} />

        {/* Messaging */}
        <Route path="/messages" element={<Messaging />} />
        <Route path="/inbox" element={<Inbox />} />
        <Route path="/loan/:loanId/messages" element={<LoanThread />} />

        {/* Direct request */}
        <Route
          path="/direct-request/:lenderId"
          element={<DirectRequestConfirm />}
        />

        {/* Wallet */}
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/payment-method" element={<PaymentMethod />} />

        {/* Finance/Docs */}
        <Route path="/history" element={<History />} />
        <Route path="/money-summary" element={<MoneySummary />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/documents/:documentId" element={<DocumentViewer />} />
      </Route>
    </Routes>
  );
}

const App = () => {
  const stripePromise = useMemo(getStripe, []);

  // If Stripe key is missing/invalid, show banner but still render routes
  if (!looksLikeStripePk) {
    return (
      <div
        style={{
          maxWidth: 720,
          margin: '40px auto',
          padding: 16,
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <h2 style={{ marginTop: 0 }}>Stripe not configured</h2>
        <p style={{ lineHeight: 1.6 }}>
          The publishable key is missing or invalid. Add it to <code>.env</code>{' '}
          and restart the dev server.
        </p>
        <pre
          style={{
            background: '#0f172a',
            color: '#e2e8f0',
            padding: 12,
            borderRadius: 8,
            overflowX: 'auto',
          }}
        >
{`# .env (CRA)
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...`}
        </pre>
        <p style={{ color: '#475569', marginTop: 12 }}>
          Tip: If you migrate to Vite later, rename it to{' '}
          <code>VITE_STRIPE_PUBLISHABLE_KEY</code> and update scripts.
        </p>

        {/* Routes still work, just without Stripe-powered pages working fully */}
        <AppRoutes />
      </div>
    );
  }

  // Normal app (Stripe configured)
  return (
    <Elements stripe={stripePromise}>
      <AppRoutes />
    </Elements>
  );
};

export default App;

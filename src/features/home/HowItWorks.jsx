// src/features/home/HowItWorks.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import peerfundGlobe from '../../assets/PeerFundGlobe.png';

export default function HowItWorks() {
  const navigate = useNavigate();

  return (
    <div className="home">
      <section className="hero">
        <span className="hero__glow hero__glow--a" aria-hidden />
        <span className="hero__glow hero__glow--b" aria-hidden />

        <div className="container hero__copy">
          <div className="hero__logo-showcase">
            <img src={peerfundGlobe} alt="PeerFund" className="hero__logo-large" />
          </div>

          <div className="hero__kicker">How it works</div>

          <h1 className="hero__title">
            A simple and transparent lending experience
          </h1>

          <p className="hero__meta" style={{ maxWidth: 850 }}>
            PeerFund gives users the ability to request funding, receive offers,
            manage repayments, and build trust directly through the platform.
          </p>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <div className="features__grid">
            <article className="feature">
              <div className="feature__icon">1️⃣</div>
              <h3 className="feature__title">Create an account</h3>
              <p className="feature__desc">
                Sign up, verify your identity, and securely connect your wallet
                and payment methods.
              </p>
            </article>

            <article className="feature">
              <div className="feature__icon">2️⃣</div>
              <h3 className="feature__title">Request a loan</h3>
              <p className="feature__desc">
                Share how much you need, your repayment timeline, and why you are
                requesting funds.
              </p>
            </article>

            <article className="feature">
              <div className="feature__icon">3️⃣</div>
              <h3 className="feature__title">Receive offers</h3>
              <p className="feature__desc">
                Users on the platform can review your request and offer custom
                lending terms.
              </p>
            </article>

            <article className="feature">
              <div className="feature__icon">4️⃣</div>
              <h3 className="feature__title">Accept a contract</h3>
              <p className="feature__desc">
                Once accepted, the agreement is saved automatically with repayment
                schedules and tracking.
              </p>
            </article>

            <article className="feature">
              <div className="feature__icon">5️⃣</div>
              <h3 className="feature__title">Funding & wallet</h3>
              <p className="feature__desc">
                Lenders fund directly through their PeerFund wallet and borrowers
                receive funds securely.
              </p>
            </article>

            <article className="feature">
              <div className="feature__icon">6️⃣</div>
              <h3 className="feature__title">Repay over time</h3>
              <p className="feature__desc">
                Built-in repayment tracking, messaging, notifications, and
                transaction history keep everything organized.
              </p>
            </article>
          </div>

          <div style={{ marginTop: '3rem', textAlign: 'center' }}>
            <button
              className="btn btn--primary btn--lg"
              onClick={() => navigate('/signup')}
            >
              Get started
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
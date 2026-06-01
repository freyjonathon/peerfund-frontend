import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import peerfundGlobe from '../../assets/PeerFundGlobe.png';

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="home">
      <nav className="container hero__nav" aria-label="About navigation">
        <div className="hero__brand">
          <button
            type="button"
            className="btn btn--ghost hero__brand-btn"
            onClick={() => navigate('/')}
          >
            ← Back to Home
          </button>
        </div>

        <div className="hero__links hide-sm">
          <button type="button" className="btn btn--ghost" onClick={() => navigate('/how-it-works')}>
            How it works
          </button>

          <button type="button" className="btn btn--ghost" onClick={() => navigate('/contact')}>
            Contact
          </button>

          <button type="button" className="btn btn--ghost" onClick={() => navigate('/careers')}>
            Careers
          </button>
        </div>

        <div className="hero__auth">
          <button type="button" className="btn btn--ghost" onClick={() => navigate('/login')}>
            Log in
          </button>

          <button type="button" className="btn btn--primary" onClick={() => navigate('/signup')}>
            Sign up
          </button>
        </div>
      </nav>

      <section className="hero">
        <span className="hero__glow hero__glow--a" aria-hidden />
        <span className="hero__glow hero__glow--b" aria-hidden />

        <div className="container hero__copy">
          <div className="hero__logo-showcase">
            <img src={peerfundGlobe} alt="PeerFund" className="hero__logo-large" />
          </div>

          <div className="hero__kicker">About PeerFund</div>

          <h1 className="hero__title">
            Community-first lending built around real people
          </h1>

          <p className="hero__meta" style={{ maxWidth: 820 }}>
            PeerFund was created to offer a more transparent and human alternative
            to high-interest lending. Instead of relying on predatory systems,
            PeerFund connects people directly so communities can help each other
            grow financially.
          </p>

          <div className="hero__ctas">
            <button
              className="btn btn--primary btn--lg"
              onClick={() => navigate('/signup')}
            >
              Join PeerFund
            </button>

            <button
              className="btn btn--ghost btn--lg"
              onClick={() => navigate('/how-it-works')}
            >
              How it works
            </button>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <div className="section-head">
            <div>
              <div className="kicker">Our mission</div>
              <h2 className="h1">Built differently from traditional lending</h2>
            </div>
          </div>

          <div className="features__grid">
            <article className="feature">
              <div className="feature__icon">🤝</div>
              <h3 className="feature__title">People helping people</h3>
              <p className="feature__desc">
                PeerFund allows users to support one another directly instead of
                relying on high-fee institutions.
              </p>
            </article>

            <article className="feature">
              <div className="feature__icon">🔒</div>
              <h3 className="feature__title">Transparent systems</h3>
              <p className="feature__desc">
                Every loan includes saved contracts, repayment tracking,
                transaction history, and secure payment infrastructure.
              </p>
            </article>

            <article className="feature">
              <div className="feature__icon">📈</div>
              <h3 className="feature__title">Long-term vision</h3>
              <p className="feature__desc">
                We believe financial opportunity should stay within communities —
                not be extracted from them.
              </p>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}
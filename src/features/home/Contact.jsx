// src/features/home/Contact.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

export default function Contact() {
  const navigate = useNavigate();

  return (
    <div className="home">
      <nav className="container hero__nav" aria-label="Contact navigation">
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
          <button type="button" className="btn btn--ghost" onClick={() => navigate('/about')}>
            About
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => navigate('/how-it-works')}>
            How it works
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

      <section className="hero" role="banner">
        <span className="hero__glow hero__glow--a" aria-hidden />
        <span className="hero__glow hero__glow--b" aria-hidden />

        <div className="container hero__copy">
          <div className="hero__kicker">Contact</div>
          <h1 className="hero__title">Let’s talk about PeerFund</h1>

          <p className="hero__meta" style={{ maxWidth: 760 }}>
            Have feedback, partnership ideas, investor interest, or questions about PeerFund?
            Reach out and we’ll follow up.
          </p>

          <div className="hero__ctas" role="group" aria-label="Contact actions">
            <a className="btn btn--primary btn--lg" href="mailto:support@peerfundmarket.com">
              Email PeerFund
            </a>
            <button type="button" className="btn btn--ghost btn--lg" onClick={() => navigate('/')}>
              Back to home
            </button>
          </div>
        </div>
      </section>

      <section className="features" aria-labelledby="contact-heading">
        <div className="container">
          <div className="section-head">
            <div>
              <div className="kicker">Get in touch</div>
              <h2 id="contact-heading" className="h1">
                Ways to connect
              </h2>
            </div>
          </div>

          <div className="features__grid">
            <article className="feature">
              <div className="feature__icon" aria-hidden>
                🤝
              </div>
              <h3 className="feature__title">Partnerships</h3>
              <p className="feature__desc">
                Interested in working with PeerFund or supporting the community lending model?
              </p>
            </article>

            <article className="feature">
              <div className="feature__icon" aria-hidden>
                💬
              </div>
              <h3 className="feature__title">Feedback</h3>
              <p className="feature__desc">
                Share product ideas, user experience notes, or anything that could make PeerFund better.
              </p>
            </article>

            <article className="feature">
              <div className="feature__icon" aria-hidden>
                🚀
              </div>
              <h3 className="feature__title">Careers</h3>
              <p className="feature__desc">
                Want to help build PeerFund? Visit the careers page and submit your information.
              </p>
              <button type="button" className="btn btn--soft" onClick={() => navigate('/careers')}>
                View careers
              </button>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}
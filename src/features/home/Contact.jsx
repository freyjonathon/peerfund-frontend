// src/features/home/Contact.jsx
import React from 'react';
import './Home.css';
import peerfundGlobe from '../../assets/PeerFundGlobe.png';

export default function Contact() {
  return (
    <div className="home">
      <section className="hero">
        <span className="hero__glow hero__glow--a" aria-hidden />
        <span className="hero__glow hero__glow--b" aria-hidden />

        <div className="container hero__copy">
          <div className="hero__logo-showcase">
            <img src={peerfundGlobe} alt="PeerFund" className="hero__logo-large" />
          </div>

          <div className="hero__kicker">Contact</div>

          <h1 className="hero__title">
            We’d love to hear from you
          </h1>

          <p className="hero__meta" style={{ maxWidth: 760 }}>
            Questions, partnership opportunities, feedback, or support requests —
            reach out anytime.
          </p>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <div className="features__grid">
            <article className="feature">
              <div className="feature__icon">📧</div>
              <h3 className="feature__title">Support</h3>
              <p className="feature__desc">
                support@peerfund.app
              </p>
            </article>

            <article className="feature">
              <div className="feature__icon">🤝</div>
              <h3 className="feature__title">Partnerships</h3>
              <p className="feature__desc">
                partnerships@peerfund.app
              </p>
            </article>

            <article className="feature">
              <div className="feature__icon">🚀</div>
              <h3 className="feature__title">Investors & media</h3>
              <p className="feature__desc">
                investors@peerfund.app
              </p>
            </article>
          </div>

          <div
            className="card story__card"
            style={{
              marginTop: '3rem',
              textAlign: 'center',
            }}
          >
            <div className="kicker">Response times</div>

            <p className="text-muted">
              We aim to respond to all inquiries within 1–2 business days.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
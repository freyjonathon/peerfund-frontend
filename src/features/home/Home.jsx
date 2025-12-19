import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css'; // uses tokens.css + ui.css underneath

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home">
      {/* ================= HERO ================= */}
      <header className="hero" role="banner">
        {/* Decorative glows */}
        <span className="hero__glow hero__glow--a" aria-hidden />
        <span className="hero__glow hero__glow--b" aria-hidden />

        {/* Top nav */}
        <nav className="container hero__nav" aria-label="Primary">
          <div className="hero__brand">
            <div className="logo-dot" aria-hidden />
            <button
              className="btn btn--ghost hero__brand-btn"
              onClick={() => navigate('/')}
              aria-label="PeerFund home"
            >
              PeerFund
            </button>
          </div>

          <div className="hero__links hide-sm">
            <button className="btn btn--ghost" onClick={() => navigate('/about')}>About</button>
            <button className="btn btn--ghost" onClick={() => navigate('/how-it-works')}>How it works</button>
            <button className="btn btn--ghost" onClick={() => navigate('/contact')}>Contact</button>
          </div>

          <div className="hero__auth">
            <button className="btn btn--ghost" onClick={() => navigate('/login')}>Log in</button>
            <button className="btn btn--primary" onClick={() => navigate('/signup')}>Sign up</button>
          </div>
        </nav>

        {/* Hero copy */}
        <div className="container hero__copy">
          <div className="hero__kicker">Community lending</div>
          <h1 className="hero__title">Built for people — not payday profits</h1>
          <section className="container story">
        <div className="card story__card">
          <div className="kicker">Why PeerFund</div>
          <p className="text-muted">
            We’ve lived the paycheck-to-paycheck grind. PeerFund connects people to people—
            not to predatory lenders—so help and fair returns stay in the community.
          </p>
        </div>
      </section>

          <div className="hero__ctas" role="group" aria-label="Get started">
            <button className="btn btn--primary btn--lg" onClick={() => navigate('/signup')}>
              Get started
            </button>
            <button className="btn btn--ghost btn--lg" onClick={() => navigate('/login')}>
              I already have an account
            </button>
          </div>

          <p className="hero__meta">
            No “borrower” or “lender” role lock-in — you’re simply a user.
          </p>
        </div>

        {/* Stats + explainer cards */}
        <div className="container hero__cards">
          <div className="hero__card">
            <div className="kicker">Live snapshot</div>
            <div className="grid sm-cols-2 gap-10">
              <div className="stat">
                <div className="stat__num">28</div>
                <div className="stat__label">Active requests</div>
              </div>
              <div className="stat">
                <div className="stat__num">92%</div>
                <div className="stat__label">On-time repayments</div>
              </div>
            </div>
          </div>

          <div className="hero__card">
            <div className="kicker">Why it works</div>
            <p className="text-muted hero__why">
              Transparent offers, lightweight contracts, and a clean repayment tracker.
            </p>
          </div>
        </div>

        {/* Trust chips */}
        <div className="container trust">
          <div className="trust__row" aria-label="Trust statements">
            <div className="trust__item">🔒 Bank-grade payments via Stripe</div>
            <div className="trust__item">📄 Contracts saved to your account</div>
            <div className="trust__item">💬 Built-in messaging</div>
          </div>
        </div>
      </header>

      {/* ================= FEATURES ================= */}
      <section className="features" aria-labelledby="features-heading">
        <div className="container">
          <div className="section-head">
            <div>
              <div className="kicker">How it works</div>
              <h2 id="features-heading" className="h1">Simple, transparent, flexible</h2>
            </div>
            <button className="btn btn--soft" onClick={() => navigate('/how-it-works')}>
              Learn more
            </button>
          </div>

          <div className="features__grid">
            <article className="feature">
              <div className="feature__icon" aria-hidden>📝</div>
              <h3 className="feature__title">Create a request</h3>
              <p className="feature__desc">
                Tell the community what you need, why, and for how long. No predatory fees.
              </p>
            </article>

            <article className="feature">
              <div className="feature__icon" aria-hidden>🤝</div>
              <h3 className="feature__title">Receive offers</h3>
              <p className="feature__desc">
                Users propose terms. You choose the best offer; everything is saved to a contract.
              </p>
            </article>

            <article className="feature">
              <div className="feature__icon" aria-hidden>📈</div>
              <h3 className="feature__title">Repay over time</h3>
              <p className="feature__desc">
                Clear schedules, reminders, and a running history of payments and messages.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ================= STORY STRIP ================= */}
      <section className="container story">
        <div className="card story__card">
          <div className="kicker">Why PeerFund</div>
          <p className="text-muted">
            We’ve lived the paycheck-to-paycheck grind. PeerFund connects people to people—
            not to predatory lenders—so help and fair returns stay in the community.
          </p>
        </div>
      </section>

      {/* ================= CTA BAND ================= */}
      <section className="cta" aria-labelledby="cta-heading">
        <div className="container cta__inner">
          <div className="cta__row">
            <div>
              <h2 id="cta-heading" className="cta__title">Ready to join the community?</h2>
              <p className="cta__desc">Create your account and explore open requests in minutes.</p>
            </div>
            <div className="flex gap-10">
              <button className="btn btn--primary btn--lg" onClick={() => navigate('/signup')}>Sign up</button>
              <button className="btn btn--ghost btn--lg" onClick={() => navigate('/login')}>Log in</button>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <section className="faq" aria-labelledby="faq-heading">
        <div className="container">
          <div className="section-head">
            <div>
              <div className="kicker">FAQ</div>
              <h2 id="faq-heading" className="h1">Common questions</h2>
            </div>
          </div>

          <div className="faq__list">
            <details className="faq__item">
              <summary className="faq__q">Do I need to pick a “Borrower” or “Lender” role?</summary>
              <p className="faq__a">No. There’s just one user type. You can request or offer on any loan.</p>
            </details>

            <details className="faq__item">
              <summary className="faq__q">How do payments work?</summary>
              <p className="faq__a">
                Payments and payouts run through Stripe. You can link a bank, deposit to your wallet,
                and repay on a schedule.
              </p>
            </details>

            <details className="faq__item">
              <summary className="faq__q">Are there platform fees?</summary>
              <p className="faq__a">
                Superusers avoid the PeerFund fee. Banking/Stripe processing fees still apply.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="home-footer" role="contentinfo">
        <div className="container flex items-center justify-between">
          <div className="text-muted">
            © {new Date().getFullYear()} PeerFund. All rights reserved.
          </div>
          <div className="flex items-center gap-10 text-muted">
            <button className="link-ghost" onClick={() => navigate('/terms')}>Terms</button>
            <button className="link-ghost" onClick={() => navigate('/privacy')}>Privacy</button>
          </div>
        </div>
      </footer>
    </div>
  );
}

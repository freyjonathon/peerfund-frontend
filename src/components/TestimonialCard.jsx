import React from 'react';
import './TestimonialCard.css';

export default function TestimonialCard({
  name = 'Happy User',
  role = 'PeerFund Member',
  quote = 'PeerFund made borrowing feel human. I got help fast and paid it back on my terms.',
  imageUrl = '/images/girlfriend.jpg', // <- put your local image here
}) {
  return (
    <div className="tc-card">
      <div className="tc-media">
        <img className="tc-avatar" src={imageUrl} alt={`${name} portrait`} />
        <div className="tc-badges">
          <span className="tc-badge tc-badge--ok">Low fees</span>
          <span className="tc-badge tc-badge--brand">Community-first</span>
        </div>
      </div>

      <div className="tc-body">
        <svg className="tc-quote-mark" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 11c1.66 0 3-1.34 3-3S8.66 5 7 5 4 6.34 4 8c0 .74.27 1.42.72 1.95C3.06 11.02 2 12.81 2 14.86V19h5v-4c0-1.66 1.34-3 3-3H7zm10 0c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .74.27 1.42.72 1.95-1.66 1.07-2.72 2.86-2.72 4.91V19h5v-4c0-1.66 1.34-3 3-3h-3z" />
        </svg>
        <p className="tc-quote">“{quote}”</p>
        <div className="tc-meta">
          <div className="tc-name">{name}</div>
          <div className="tc-role">{role}</div>
        </div>
      </div>
    </div>
  );
}

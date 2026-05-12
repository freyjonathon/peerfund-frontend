import React from 'react';
import wordmark from '../assets/PeerFund.png';
import globe from '../assets/PeerFundGlobe.png';

export default function PeerFundLogo({ variant = 'full', size = 42 }) {
  if (variant === 'icon') {
    return (
      <img
        src={globe}
        alt="PeerFund"
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          display: 'block',
        }}
      />
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <img
        src={globe}
        alt=""
        aria-hidden="true"
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          display: 'block',
        }}
      />
      <img
        src={wordmark}
        alt="PeerFund"
        style={{
          height: Math.round(size * 0.8),
          width: 'auto',
          objectFit: 'contain',
          display: 'block',
        }}
      />
    </div>
  );
}
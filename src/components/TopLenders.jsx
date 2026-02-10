// src/components/TopLenders.jsx
import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';

const TopLenders = () => {
  const [lenders, setLenders] = useState(null); // null initially
  const [sortBy] = useState('amount'); // keep default, no setter until UI exists

  useEffect(() => {
    let cancelled = false;

    const fetchTopLenders = async () => {
      try {
        const data = await apiFetch(`/api/leaderboard/top-lenders?sort=${encodeURIComponent(sortBy)}`);

        // backend may return { items: [...] } or [...] — support both
        const list = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];

        if (!cancelled) setLenders(list);
      } catch (err) {
        console.error('Error fetching top lenders:', err);
        if (!cancelled) setLenders([]); // Prevent crash if fetch fails
      }
    };

    fetchTopLenders();

    return () => {
      cancelled = true;
    };
  }, [sortBy]);

  return (
    <div className="top-lenders-section">
      <h3 className="subheading">🏆 Top 10 Lenders</h3>

      {!Array.isArray(lenders) ? (
        <p>Loading leaderboard...</p>
      ) : lenders.length === 0 ? (
        <p>No lenders found.</p>
      ) : (
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Lender</th>
              <th>Total Lent ($)</th>
              <th>Loans Given</th>
            </tr>
          </thead>
          <tbody>
            {lenders.map((lender, i) => (
              <tr key={lender.userId || lender.id || i}>
                <td>{i + 1}</td>
                <td>{lender.name || 'Anonymous'}</td>
                <td>${Number(lender.totalAmount || 0).toFixed(2)}</td>
                <td>{Number(lender.totalLoans || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default TopLenders;

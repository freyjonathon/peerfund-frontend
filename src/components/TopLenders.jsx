// src/components/TopLenders.jsx
import React, { useEffect, useState } from 'react';

const TopLenders = () => {
  const [lenders, setLenders] = useState(null); // null initially
  const [sortBy, setSortBy] = useState('amount'); // 'amount' or 'count'
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchTopLenders = async () => {
      try {
        const res = await fetch(`/api/leaderboard/top-lenders?sort=${sortBy}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Server error ${res.status}: ${errorText}`);
        }

        const data = await res.json();

        if (!Array.isArray(data)) {
          throw new Error('Expected an array from API, got: ' + JSON.stringify(data));
        }

        setLenders(data);
      } catch (err) {
        console.error('Error fetching top lenders:', err.message);
        setLenders([]); // Prevent crash if fetch fails
      }
    };

    fetchTopLenders();
  }, [sortBy]);

  return (
    <div className="top-lenders-section">
      <h3 className="subheading">🏆 Top 10 Lenders</h3>
      <div style={{ marginBottom: '1rem' }}>
      </div>

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
              <tr key={lender.userId || i}>
                <td>{i + 1}</td>
                <td>{lender.name || 'Anonymous'}</td>
                <td>${lender.totalAmount.toFixed(2)}</td>
                <td>{lender.totalLoans}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default TopLenders;

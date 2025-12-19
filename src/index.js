// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';

// index.js (very top or right before ReactDOM.render)
if (!document.body.getAttribute('data-sidebar')) {
  document.body.setAttribute('data-sidebar', 'closed');
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

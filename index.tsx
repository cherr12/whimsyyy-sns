import './src/index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// CRITICAL FIX: Aggressively clean up legacy localStorage data that causes Quota Exceeded errors.
// This runs before the React app even mounts.
try {
  if (localStorage.getItem('omnipost_posts')) {
    console.log('Cleaning up legacy storage...');
    localStorage.removeItem('omnipost_posts');
  }
} catch (e) {
  console.warn('Failed to clean legacy storage during bootstrap', e);
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

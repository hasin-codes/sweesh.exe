import React from 'react';
import ReactDOM from 'react-dom/client';
import ActiveApp from './ActiveApp';
import '../styles/globals.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <ActiveApp />
  </React.StrictMode>
);

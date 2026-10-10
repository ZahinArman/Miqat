import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import { registerSW } from 'virtual:pwa-register';

// Register service worker for offline support
registerSW({ immediate: true });

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

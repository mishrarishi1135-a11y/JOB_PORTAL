import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/global.css';
import * as Sentry from '@sentry/react';

// Initialize Sentry before the App mounts
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;

if (sentryDsn && sentryDsn !== 'https://xxxxxx@o123456.ingest.sentry.io/123456') {
  Sentry.init({
    dsn: sentryDsn,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    // Tracing
    tracesSampleRate: 1.0, //  Capture 100% of the transactions for performance monitoring
    // Session Replay
    replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and sample in production.
    replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
  });
} else {
  console.warn('Sentry DSN not provided or using default placeholder. Sentry error tracking is inactive.');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

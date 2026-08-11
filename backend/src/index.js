// Load environment variables
require('dotenv').config();

const Sentry = require('@sentry/node');

// 1. Initialize Sentry before importing Express or other modules
Sentry.init({
  dsn: process.env.SENTRY_DSN || '',
  tracesSampleRate: 1.0, // Capture 100% of the transactions for performance monitoring
});

const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes
const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const companyRoutes = require('./routes/companyRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Initialize app
const app = express();

// 2. Sentry Request Handler (v8 setup uses setupExpressErrorHandler after routes, but we can set up tracing middleware)
// Sentry's SDK automatically instruments Express routes when Sentry.init() is called, but we can add trace parent tracking.

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static upload folders (to access uploaded PDFs)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health Check API
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Job Portal API is running smoothly' });
});

// Test Error API (to verify Sentry integration)
app.get('/api/test-error', (req, res) => {
  throw new Error('This is a test error to verify Sentry monitoring!');
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/admin', adminRoutes);

// 3. Sentry Error Handler - MUST be registered before any other error middleware and after all controllers
Sentry.setupExpressErrorHandler(app);

// 4. Custom Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('API Error:', err.message);
  
  // Return readable message to client
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message || 'An unexpected server error occurred',
    // Only send stack trace in development
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

module.exports = app;

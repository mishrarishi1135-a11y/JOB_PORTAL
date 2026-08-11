import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ClerkProvider, SignIn, SignUp } from '@clerk/clerk-react';

// Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Jobs from './pages/Jobs';
import JobDetails from './pages/JobDetails';
import Profile from './pages/Profile';
import SeekerDashboard from './pages/SeekerDashboard';
import RecruiterDashboard from './pages/RecruiterDashboard';
import AdminDashboard from './pages/AdminDashboard';

// Read clerk key from env
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const isPlaceholderKey = !clerkPubKey || clerkPubKey.includes('xxxxxx') || !clerkPubKey.startsWith('pk_');

function App() {
  if (isPlaceholderKey) {
    return (
      <div style={warningStyles.container}>
        <div style={warningStyles.card}>
          <h2 style={warningStyles.title}>🔑 Clerk Configuration Required</h2>
          <p style={warningStyles.text}>
            The application requires a valid Clerk Publishable Key to initialize authentication. Currently, it is set to a placeholder (<code>pk_test_xxxxxx</code>) in your frontend <code>.env</code> file.
          </p>
          <div style={warningStyles.instructions}>
            <h4 style={{ margin: '0 0 8px 0', color: '#f4f4f5' }}>How to resolve:</h4>
            <ol style={warningStyles.list}>
              <li>Sign up or log in to the <a href="https://dashboard.clerk.com/" target="_blank" rel="noopener noreferrer" style={warningStyles.link}>Clerk Dashboard</a>.</li>
              <li>Create a new application or select your project.</li>
              <li>Copy the <strong>Publishable Key</strong> from the API Keys section.</li>
              <li>Open the file <code>frontend/.env</code> in your code editor.</li>
              <li>Replace the placeholder value with your actual key:
                <pre style={warningStyles.code}>VITE_CLERK_PUBLISHABLE_KEY=your_actual_publishable_key</pre>
              </li>
              <li>Save the file and refresh this page.</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <BrowserRouter>
        <div style={styles.appContainer}>
          <Navbar />
          <main style={styles.mainContent}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/jobs/:id" element={<JobDetails />} />

              {/* Authentication Routes wrapper */}
              <Route 
                path="/login" 
                element={
                  <div style={styles.authContainer}>
                    <SignIn routing="path" path="/login" signUpUrl="/signup" fallbackRedirectUrl="/" />
                  </div>
                } 
              />
              <Route 
                path="/signup" 
                element={
                  <div style={styles.authContainer}>
                    <SignUp routing="path" path="/signup" signInUrl="/login" fallbackRedirectUrl="/profile" />
                  </div>
                } 
              />

              {/* Protected Routes */}
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/seeker-dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['seeker']}>
                    <SeekerDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/recruiter-dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['recruiter']}>
                    <RecruiterDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin-dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />

              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </ClerkProvider>
  );
}

const styles = {
  appContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    zIndex: 1,
  },
  authContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px 20px',
    minHeight: '80vh',
  }
};

const warningStyles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#09090b',
    color: '#fafafa',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: '20px',
  },
  card: {
    maxWidth: '550px',
    width: '100%',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '32px',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
    backdropFilter: 'blur(8px)',
  },
  title: {
    fontSize: '1.6rem',
    fontWeight: '700',
    marginBottom: '16px',
    color: '#ff4e4e',
  },
  text: {
    fontSize: '0.95rem',
    lineHeight: '1.6',
    color: '#a1a1aa',
    marginBottom: '24px',
  },
  instructions: {
    background: 'rgba(255, 255, 255, 0.01)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    borderRadius: '8px',
    padding: '20px',
  },
  list: {
    paddingLeft: '20px',
    margin: '12px 0 0 0',
    color: '#d4d4d8',
    fontSize: '0.9rem',
    lineHeight: '1.7',
  },
  link: {
    color: '#3b82f6',
    textDecoration: 'none',
    fontWeight: '600',
  },
  code: {
    background: '#18181b',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '0.85rem',
    color: '#f4f4f5',
    display: 'block',
    marginTop: '6px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  }
};

export default App;

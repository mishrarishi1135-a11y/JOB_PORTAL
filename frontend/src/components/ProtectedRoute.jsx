import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import axios from 'axios';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const [dbUser, setDbUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      if (isLoaded && isSignedIn && user) {
        try {
          const token = await window.Clerk.session.getToken();
          const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setDbUser(response.data);
        } catch (error) {
          console.error('Error verifying protected route role:', error.message);
        } finally {
          setLoading(false);
        }
      } else if (isLoaded) {
        setLoading(false);
      }
    };

    checkUserRole();
  }, [isLoaded, isSignedIn, user]);

  if (!isLoaded || loading) {
    return (
      <div style={styles.loaderContainer}>
        <div className="spinner"></div>
        <p style={styles.loaderText}>Securing connection...</p>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && dbUser && !allowedRoles.includes(dbUser.role)) {
    // If not authorized for this specific dashboard, send home or profile
    return <Navigate to="/profile" replace />;
  }

  return children;
};

const styles = {
  loaderContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
  },
  loaderText: {
    color: 'var(--text-secondary)',
    marginTop: '16px',
    fontSize: '0.95rem',
  }
};

export default ProtectedRoute;

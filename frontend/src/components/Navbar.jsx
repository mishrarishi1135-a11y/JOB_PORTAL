import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, UserButton, useUser } from '@clerk/clerk-react';
import { Briefcase, Sun, Moon, LayoutDashboard, User, ShieldAlert, LogIn } from 'lucide-react';
import axios from 'axios';

const Navbar = () => {
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
  
  // Theme state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  const [dbUser, setDbUser] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Fetch db user to check roles
  useEffect(() => {
    const fetchDbUser = async () => {
      if (isSignedIn && user) {
        try {
          const token = await getToken();
          const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setDbUser(response.data);
        } catch (error) {
          console.error('Error syncing user profile:', error.message);
        }
      } else {
        setDbUser(null);
      }
    };

    fetchDbUser();
  }, [isSignedIn, user]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <nav style={styles.nav}>
      <div className="container" style={styles.container}>
        {/* Brand Logo */}
        <Link to="/" className="navbar-brand">
          <Briefcase size={28} color="var(--accent-primary)" />
          <span>HireSphere</span>
        </Link>

        {/* Navigation Links */}
        <div style={styles.navLinks}>
          <Link to="/jobs" style={styles.link}>Browse Jobs</Link>
          
          {isSignedIn && dbUser && (
            <>
              {dbUser.role === 'seeker' && (
                <Link to="/seeker-dashboard" style={styles.link}>Seeker Panel</Link>
              )}
              {dbUser.role === 'recruiter' && (
                <Link to="/recruiter-dashboard" style={styles.link}>Recruiter Panel</Link>
              )}
              {dbUser.role === 'admin' && (
                <Link to="/admin-dashboard" style={styles.adminLink}>
                  <ShieldAlert size={16} />
                  Admin
                </Link>
              )}
              <Link to="/profile" style={styles.link}>My Profile</Link>
            </>
          )}
        </div>

        {/* Action Controls */}
        <div style={styles.controls}>
          {/* Theme Toggle Button */}
          <button onClick={toggleTheme} style={styles.themeBtn} title="Toggle theme">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {isSignedIn ? (
            <div style={styles.authWrapper}>
              <UserButton 
                afterSignOutUrl="/" 
                appearance={{
                  elements: {
                    userButtonAvatarBox: {
                      width: '40px',
                      height: '40px',
                      border: '2px solid var(--accent-primary)',
                    }
                  }
                }}
              />
            </div>
          ) : (
            <div style={styles.authBtns}>
              <Link to="/login" className="btn btn-secondary" style={styles.loginBtn}>
                <LogIn size={16} />
                Sign In
              </Link>
              <Link to="/signup" className="btn btn-primary">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    height: 'var(--navbar-height)',
    borderBottom: '1px solid var(--glass-border)',
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
  },
  container: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  navLinks: {
    display: 'flex',
    gap: '24px',
    alignItems: 'center',
  },
  link: {
    fontSize: '0.95rem',
    fontWeight: '500',
    color: 'var(--text-secondary)',
    transition: 'color var(--transition-fast)',
    cursor: 'pointer',
  },
  adminLink: {
    fontSize: '0.95rem',
    fontWeight: '600',
    color: 'var(--error)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  themeBtn: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid var(--glass-border)',
    color: 'var(--text-primary)',
    width: '40px',
    height: '40px',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
  },
  authWrapper: {
    display: 'flex',
    alignItems: 'center',
  },
  authBtns: {
    display: 'flex',
    gap: '12px',
  },
  loginBtn: {
    padding: '10px 20px',
  }
};

export default Navbar;

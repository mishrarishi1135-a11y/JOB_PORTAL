import React, { createContext, useContext, useState } from 'react';

const MockAuthContext = createContext();

export const ClerkProvider = ({ children }) => {
  const [role, setRole] = useState(localStorage.getItem('mock_role') || 'seeker');
  const [isSignedIn, setIsSignedIn] = useState(localStorage.getItem('mock_signed_in') !== 'false');

  const user = {
    id: 'mock_user_123',
    firstName: 'Mock',
    lastName: 'User',
    fullName: 'Mock User',
    primaryEmailAddress: { emailAddress: 'mock.user@example.com' },
    emailAddresses: [{ emailAddress: 'mock.user@example.com' }],
    publicMetadata: { role: role }
  };

  const handleSetRole = (newRole) => {
    localStorage.setItem('mock_role', newRole);
    setRole(newRole);
    window.location.reload(); // Reload to refresh all state based on role
  };

  const handleSignOut = () => {
    localStorage.setItem('mock_signed_in', 'false');
    setIsSignedIn(false);
    window.location.reload();
  };

  const handleSignIn = () => {
    localStorage.setItem('mock_signed_in', 'true');
    setIsSignedIn(true);
    window.location.reload();
  };

  return (
    <MockAuthContext.Provider value={{ user, role, setRole: handleSetRole, isSignedIn, signIn: handleSignIn, signOut: handleSignOut }}>
      {children}
    </MockAuthContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(MockAuthContext);
  if (!context) return { user: null, isSignedIn: false, isLoaded: true };
  return { user: context.isSignedIn ? context.user : null, isSignedIn: context.isSignedIn, isLoaded: true };
};

export const useAuth = () => {
  const context = useContext(MockAuthContext);
  if (!context) return { isSignedIn: false, userId: null, isLoaded: true, getToken: async () => '' };
  return {
    isSignedIn: context.isSignedIn,
    userId: context.isSignedIn ? context.user.id : null,
    getToken: async () => 'mock_token_abc',
    signOut: context.signOut,
    isLoaded: true
  };
};

export const UserButton = () => {
  const context = useContext(MockAuthContext);
  const [showMenu, setShowMenu] = useState(false);

  if (!context || !context.isSignedIn) return null;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button 
        onClick={() => setShowMenu(!showMenu)}
        style={{
          padding: '8px 12px',
          background: 'var(--accent-primary)',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          color: 'white',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.85rem'
        }}
      >
        👤 Mock User ({context.role})
      </button>

      {showMenu && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: '40px',
          background: 'var(--card-bg, #1c1c1e)',
          border: '1px solid var(--glass-border, rgba(255,255,255,0.08))',
          borderRadius: '8px',
          boxShadow: '0 8px 32px 0 rgba(0,0,0,0.5)',
          padding: '12px',
          zIndex: 1000,
          width: '200px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Role Switcher (Mock Auth)</p>
          <button 
            onClick={() => context.setRole('seeker')} 
            style={{ 
              padding: '6px 8px', 
              background: context.role === 'seeker' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
              color: context.role === 'seeker' ? '#3b82f6' : 'var(--text-primary)',
              border: 'none',
              borderRadius: '4px',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            Seeker Role
          </button>
          <button 
            onClick={() => context.setRole('recruiter')} 
            style={{ 
              padding: '6px 8px', 
              background: context.role === 'recruiter' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
              color: context.role === 'recruiter' ? '#3b82f6' : 'var(--text-primary)',
              border: 'none',
              borderRadius: '4px',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            Recruiter Role
          </button>
          <button 
            onClick={() => context.setRole('admin')} 
            style={{ 
              padding: '6px 8px', 
              background: context.role === 'admin' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
              color: context.role === 'admin' ? '#3b82f6' : 'var(--text-primary)',
              border: 'none',
              borderRadius: '4px',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            Admin Role
          </button>
          <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '4px 0' }} />
          <button 
            onClick={context.signOut} 
            style={{ 
              padding: '6px 8px', 
              background: 'transparent',
              color: '#ff4e4e',
              border: 'none',
              borderRadius: '4px',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: '600'
            }}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

export const SignIn = () => {
  const context = useContext(MockAuthContext);
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', maxWidth: '400px', margin: '80px auto' }}>
      <h2 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>Mock Sign In</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>Click below to simulate signing in as a Mock User</p>
      <button 
        onClick={() => context.signIn()}
        style={{ padding: '10px 24px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: '600', cursor: 'pointer' }}
      >
        Sign In
      </button>
    </div>
  );
};

export const SignUp = () => {
  const context = useContext(MockAuthContext);
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', maxWidth: '400px', margin: '80px auto' }}>
      <h2 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>Mock Sign Up</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>Click below to simulate signing up as a Mock User</p>
      <button 
        onClick={() => context.signIn()}
        style={{ padding: '10px 24px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: '600', cursor: 'pointer' }}
      >
        Sign Up
      </button>
    </div>
  );
};

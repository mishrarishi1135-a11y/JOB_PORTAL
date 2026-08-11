import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, MapPin, ArrowRight, Briefcase, Users, Building2, TrendingUp, Sparkles } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (location) params.append('location', location);
    navigate(`/jobs?${params.toString()}`);
  };

  // Test error for Sentry auditing
  const triggerSentryError = () => {
    throw new Error('Verification: Sentry React SDK successfully captured this frontend exception!');
  };

  return (
    <div className="page-transition" style={styles.page}>
      {/* Background Mesh Glow */}
      <div className="hero-glow"></div>
      
      {/* Hero Section */}
      <section style={styles.heroSection}>
        <div className="container" style={styles.heroContainer}>
          <div style={styles.tagline}>
            <Sparkles size={16} color="var(--accent-primary)" />
            <span>Discover your dream career pathway</span>
          </div>
          
          <h1 style={styles.heroTitle}>
            Find The Perfect Job <br />
            <span style={styles.titleGradient}>That Fits Your Ambition</span>
          </h1>
          
          <p style={styles.heroSub}>
            Explore thousands of premium career opportunities in technology, design, product, and sales. 
            Connect directly with verified recruiters and build your professional sphere.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="glass-card" style={styles.searchBar}>
            <div style={styles.searchField}>
              <Search size={20} color="var(--text-muted)" />
              <input 
                type="text" 
                placeholder="Job title, keywords, or skills..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={styles.searchInput}
              />
            </div>
            <div style={styles.separator}></div>
            <div style={styles.searchField}>
              <MapPin size={20} color="var(--text-muted)" />
              <input 
                type="text" 
                placeholder="City, state, or remote..." 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                style={styles.searchInput}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={styles.searchBtn}>
              Find Jobs
              <ArrowRight size={18} />
            </button>
          </form>

          {/* Popular Keywords */}
          <div style={styles.keywords}>
            <span style={styles.keywordLabel}>Popular Searches:</span>
            {['React Developer', 'Product Designer', 'Node.js', 'Remote', 'Marketing'].map((kw) => (
              <span 
                key={kw} 
                onClick={() => {
                  setSearch(kw);
                  navigate(`/jobs?search=${encodeURIComponent(kw)}`);
                }}
                style={styles.keywordTag}
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section style={styles.statsSection}>
        <div className="container" style={styles.statsGrid}>
          <div className="glass-card" style={styles.statCard}>
            <div style={styles.statIconWrapper}>
              <Briefcase size={24} color="var(--accent-primary)" />
            </div>
            <h3 style={styles.statVal}>12,400+</h3>
            <p style={styles.statLabel}>Active Job Listings</p>
          </div>
          <div className="glass-card" style={styles.statCard}>
            <div style={styles.statIconWrapper}>
              <Building2 size={24} color="var(--accent-secondary)" />
            </div>
            <h3 style={styles.statVal}>850+</h3>
            <p style={styles.statLabel}>Verified Employers</p>
          </div>
          <div className="glass-card" style={styles.statCard}>
            <div style={styles.statIconWrapper}>
              <Users size={24} color="var(--accent-tertiary)" />
            </div>
            <h3 style={styles.statVal}>45,000+</h3>
            <p style={styles.statLabel}>Talented Seekers</p>
          </div>
          <div className="glass-card" style={styles.statCard}>
            <div style={styles.statIconWrapper}>
              <TrendingUp size={24} color="var(--success)" />
            </div>
            <h3 style={styles.statVal}>98%</h3>
            <p style={styles.statLabel}>Placement Success Rate</p>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section style={styles.features}>
        <div className="container">
          <h2 style={styles.sectionHeading}>Why Choose HireSphere?</h2>
          <p style={styles.sectionSub}>We streamline the recruiting lifecycle using state-of-the-art authentication and analytics.</p>
          
          <div style={styles.featureGrid}>
            <div style={styles.featureItem}>
              <h3>Smart Role Routing</h3>
              <p>Sign up once. Based on your role, our portal automatically routes you to either a Seeker Panel, Recruiter Panel, or Admin Moderation Deck.</p>
            </div>
            <div style={styles.featureItem}>
              <h3>Secure PDF Uploads</h3>
              <p>Upload resumes in standard PDF format. Recruiters view, download, and review credentials cleanly in their candidate management workspace.</p>
            </div>
            <div style={styles.featureItem}>
              <h3>Premium UX Theme</h3>
              <p>Enjoy our glassmorphic visual system, offering smooth transitions, micro-animations, and a highly requested toggleable Light / Dark theme.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Developer Section (Verify Sentry) */}
      <section style={styles.devSection}>
        <div className="container" style={styles.devContainer}>
          <div className="glass-card" style={styles.devCard}>
            <h4>Audit Error Monitoring (Sentry Integration)</h4>
            <p style={styles.devText}>
              Test frontend telemetry reporting. Clicking this button triggers a runtime exception to verify Sentry dashboard interception.
            </p>
            <button onClick={triggerSentryError} className="btn btn-danger" style={{ alignSelf: 'center' }}>
              Trigger UI Test Error
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

const styles = {
  page: {
    position: 'relative',
    overflow: 'hidden',
    paddingBottom: '80px',
  },
  heroSection: {
    padding: '80px 0 60px 0',
    textAlign: 'center',
    position: 'relative',
    zIndex: 2,
  },
  heroContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  tagline: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(255, 255, 255, 0.05)',
    padding: '6px 16px',
    borderRadius: 'var(--radius-full)',
    fontSize: '0.85rem',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    border: '1px solid var(--glass-border)',
    marginBottom: '24px',
  },
  heroTitle: {
    fontSize: '3.6rem',
    lineHeight: '1.1',
    marginBottom: '20px',
    fontFamily: 'var(--font-heading)',
  },
  titleGradient: {
    background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  heroSub: {
    fontSize: '1.15rem',
    color: 'var(--text-secondary)',
    maxWidth: '750px',
    lineHeight: '1.6',
    marginBottom: '40px',
  },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    maxWidth: '850px',
    padding: '10px',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-lg)',
    gap: '12px',
  },
  searchField: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    padding: '10px 16px',
    gap: '12px',
  },
  searchInput: {
    width: '100%',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: 'var(--text-primary)',
    fontSize: '0.95rem',
  },
  separator: {
    width: '1px',
    height: '40px',
    backgroundColor: 'var(--glass-border)',
  },
  searchBtn: {
    padding: '14px 28px',
    borderRadius: 'var(--radius-md)',
  },
  keywords: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    marginTop: '24px',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keywordLabel: {
    fontSize: '0.9rem',
    color: 'var(--text-muted)',
    fontWeight: '500',
  },
  keywordTag: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--glass-border)',
    padding: '6px 12px',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
  },
  statsSection: {
    padding: '40px 0',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '24px',
  },
  statCard: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '30px 20px',
  },
  statIconWrapper: {
    width: '50px',
    height: '50px',
    borderRadius: 'var(--radius-md)',
    background: 'rgba(255, 255, 255, 0.03)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
    border: '1px solid var(--glass-border)',
  },
  statVal: {
    fontSize: '2.2rem',
    fontWeight: '800',
    fontFamily: 'var(--font-heading)',
    marginBottom: '4px',
  },
  statLabel: {
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
  },
  features: {
    padding: '80px 0',
    textAlign: 'center',
  },
  sectionHeading: {
    fontSize: '2.2rem',
    marginBottom: '8px',
  },
  sectionSub: {
    color: 'var(--text-secondary)',
    marginBottom: '48px',
    fontSize: '1rem',
  },
  featureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '30px',
  },
  featureItem: {
    padding: '32px',
    borderRadius: 'var(--radius-lg)',
    background: 'rgba(255, 255, 255, 0.01)',
    border: '1px solid var(--glass-border)',
    textAlign: 'left',
    transition: 'border-color var(--transition-normal)',
    '&:hover': {
      borderColor: 'var(--accent-primary)',
    }
  },
  devSection: {
    padding: '40px 0',
  },
  devContainer: {
    display: 'flex',
    justifyContent: 'center',
  },
  devCard: {
    maxWidth: '600px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    borderColor: 'rgba(239, 68, 68, 0.25)',
    background: 'rgba(239, 68, 68, 0.02)',
    padding: '24px',
  },
  devText: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
    textAlign: 'center',
  }
};

export default Home;

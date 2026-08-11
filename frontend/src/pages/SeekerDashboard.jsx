import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { Briefcase, Bookmark, Calendar, CheckSquare, ChevronRight, FileText } from 'lucide-react';
import axios from 'axios';
import JobCard from '../components/JobCard';

const SeekerDashboard = () => {
  const { isSignedIn, getToken } = useAuth();
  const [activeTab, setActiveTab] = useState('applications');

  // Application states
  const [applications, setApplications] = useState([]);
  const [appsLoading, setAppsLoading] = useState(true);

  // Saved Jobs states
  const [savedJobs, setSavedJobs] = useState([]);
  const [savedJobsLoading, setSavedJobsLoading] = useState(true);

  const [error, setError] = useState('');

  // Fetch applications
  const fetchApplications = async () => {
    try {
      const token = await getToken();
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/applications/seeker/my-applications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApplications(res.data);
    } catch (err) {
      console.error(err);
      setError('Could not retrieve application records.');
    } finally {
      setAppsLoading(false);
    }
  };

  // Fetch profile saved jobs
  const fetchSavedJobs = async () => {
    try {
      const token = await getToken();
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSavedJobs(res.data.savedJobs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSavedJobsLoading(false);
    }
  };

  useEffect(() => {
    if (isSignedIn) {
      fetchApplications();
      fetchSavedJobs();
    }
  }, [isSignedIn]);

  // Remove bookmark handler
  const handleUnsave = async (jobId) => {
    try {
      const token = await getToken();
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/auth/saved-jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSavedJobs(prev => prev.filter(job => job._id !== jobId));
    } catch (err) {
      console.error(err);
      alert('Failed to unsave job.');
    }
  };

  return (
    <div className="container page-transition" style={styles.page}>
      <h2 style={styles.heading}>Candidate Control Deck</h2>
      <p style={styles.sub}>Track your applications status and browse saved bookmarked positions.</p>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Tabs Row */}
      <div style={styles.tabsRow}>
        <button 
          onClick={() => setActiveTab('applications')} 
          style={activeTab === 'applications' ? styles.tabActive : styles.tab}
        >
          <CheckSquare size={16} />
          My Applications ({applications.length})
        </button>
        <button 
          onClick={() => setActiveTab('saved')} 
          style={activeTab === 'saved' ? styles.tabActive : styles.tab}
        >
          <Bookmark size={16} />
          Saved Listings ({savedJobs.length})
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'applications' ? (
        <div className="glass-card" style={styles.panel}>
          <h3 style={styles.panelTitle}>Submitted Applications</h3>
          
          {appsLoading ? (
            <div style={styles.loader}>
              <div className="spinner"></div>
            </div>
          ) : applications.length === 0 ? (
            <div style={styles.empty}>
              <FileText size={40} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
              <p>You haven't submitted any job applications yet.</p>
              <Link to="/jobs" className="btn btn-primary" style={{ marginTop: '16px' }}>
                Browse Available Jobs
              </Link>
            </div>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Job Position</th>
                    <th>Company</th>
                    <th>Date Applied</th>
                    <th>Resume Doc</th>
                    <th>Status Badge</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app._id}>
                      <td>
                        <strong>{app.job?.title || 'Unknown Position'}</strong>
                      </td>
                      <td>{app.job?.company?.name || 'Verified Employer'}</td>
                      <td>
                        <div style={styles.dateCell}>
                          <Calendar size={14} color="var(--text-muted)" />
                          {new Date(app.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        <a href={app.resumeUrl && app.resumeUrl.startsWith('http') ? app.resumeUrl : `${import.meta.env.VITE_API_URL}${app.resumeUrl}`} target="_blank" rel="noopener noreferrer" style={styles.resumeLink}>
                          View PDF
                        </a>
                      </td>
                      <td>
                        <span className={`badge badge-${app.status.toLowerCase()}`}>
                          {app.status}
                        </span>
                      </td>
                      <td>
                        <Link to={`/jobs/${app.job?._id || app.job}`} style={styles.actionLink}>
                          View Job <ChevronRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div style={styles.savedPanel}>
          {savedJobsLoading ? (
            <div style={styles.loader}>
              <div className="spinner"></div>
            </div>
          ) : savedJobs.length === 0 ? (
            <div className="glass-card" style={styles.empty}>
              <Bookmark size={40} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
              <p>Your bookmarked folder is empty.</p>
              <Link to="/jobs" className="btn btn-secondary" style={{ marginTop: '16px' }}>
                Browse Jobs
              </Link>
            </div>
          ) : (
            <div style={styles.jobsGrid}>
              {savedJobs.map((job) => (
                <JobCard 
                  key={job._id}
                  job={job}
                  isSaved={true}
                  onSaveToggle={handleUnsave}
                  hideSaveBtn={false}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  page: {
    paddingTop: '40px',
    paddingBottom: '80px',
  },
  heading: {
    fontSize: '2.2rem',
    marginBottom: '4px',
  },
  sub: {
    color: 'var(--text-secondary)',
    marginBottom: '32px',
  },
  tabsRow: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
    borderBottom: '1px solid var(--glass-border)',
    paddingBottom: '8px',
  },
  tab: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    padding: '10px 20px',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    borderRadius: 'var(--radius-md)',
    transition: 'all var(--transition-fast)',
    '&:hover': {
      color: 'var(--text-primary)',
      background: 'rgba(255, 255, 255, 0.03)',
    }
  },
  tabActive: {
    background: 'var(--accent-primary-glow)',
    border: '1px solid var(--accent-primary)',
    color: 'var(--text-primary)',
    padding: '10px 20px',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    borderRadius: 'var(--radius-md)',
  },
  panel: {
    padding: '32px',
  },
  panelTitle: {
    fontSize: '1.25rem',
    marginBottom: '24px',
    fontFamily: 'var(--font-heading)',
  },
  loader: {
    padding: '40px 0',
    textAlign: 'center',
  },
  empty: {
    textAlign: 'center',
    padding: '40px 0',
    color: 'var(--text-secondary)',
    fontSize: '0.95rem',
  },
  dateCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: 'var(--text-secondary)',
  },
  resumeLink: {
    color: 'var(--accent-secondary)',
    fontWeight: '600',
    fontSize: '0.9rem',
    '&:hover': {
      textDecoration: 'underline',
    }
  },
  actionLink: {
    color: 'var(--accent-primary)',
    fontSize: '0.9rem',
    fontWeight: '600',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2px',
  },
  savedPanel: {
    width: '100%',
  },
  jobsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '20px',
  }
};

export default SeekerDashboard;

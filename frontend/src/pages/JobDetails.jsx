import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { MapPin, DollarSign, Calendar, Clock, Building2, Globe, Send, ShieldAlert, ArrowLeft } from 'lucide-react';
import axios from 'axios';

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();

  // Job Data
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Seeker Status states
  const [userProfile, setUserProfile] = useState(null);
  const [applicationStatus, setApplicationStatus] = useState(null); // 'Applied', etc. or null
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch job details
  const fetchJobDetails = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/jobs/${id}`);
      setJob(response.data);
    } catch (err) {
      console.error(err);
      setError('Job listing not found or backend connection lost.');
    } finally {
      setLoading(false);
    }
  };

  // Check seeker application status if signed in
  const checkApplicationStatus = async () => {
    if (!isSignedIn) return;
    try {
      const token = await window.Clerk.session.getToken();
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      // Fetch user profile
      const profRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/profile`, config);
      setUserProfile(profRes.data);

      if (profRes.data.role === 'seeker') {
        const appRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/applications/seeker/my-applications`, config);
        const match = appRes.data.find(app => app.job?._id === id || app.job === id);
        if (match) {
          setApplicationStatus(match.status);
        }
      }
    } catch (err) {
      console.error('Error fetching application status:', err.message);
    }
  };

  useEffect(() => {
    fetchJobDetails();
    checkApplicationStatus();
  }, [id, isSignedIn]);

  // Submit job application
  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!userProfile?.profile?.resumeUrl) {
      alert('Please upload a resume in your profile before applying.');
      navigate('/profile');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const token = await window.Clerk.session.getToken();
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/applications/${id}`,
        { coverLetter },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccessMsg('Your application was submitted successfully!');
      setApplicationStatus('Applied');
      setShowApplyModal(false);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  // Admin delete job moderation
  const handleAdminDelete = async () => {
    if (!window.confirm('Admin Action: Are you sure you want to remove this job listing?')) return;
    try {
      const token = await window.Clerk.session.getToken();
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/jobs/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Job listing deleted successfully.');
      navigate('/jobs');
    } catch (err) {
      console.error(err);
      alert('Failed to delete job listing.');
    }
  };

  // Admin toggle fake flag moderation
  const handleAdminToggleFlag = async () => {
    const action = job?.isFake ? 'VERIFY' : 'FLAG FAKE';
    if (!window.confirm(`Admin Action: Are you sure you want to ${action} this listing?`)) return;
    try {
      const token = await window.Clerk.session.getToken();
      const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/admin/jobs/${id}/flag`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJob(prev => ({ ...prev, isFake: res.data.job.isFake }));
      alert(`Job status updated: ${res.data.job.isFake ? 'Flagged as Fake' : 'Verified'}`);
    } catch (err) {
      console.error(err);
      alert('Failed to moderate job listing.');
    }
  };

  if (loading) {
    return (
      <div style={styles.centerContainer}>
        <div className="spinner"></div>
        <p>Loading job details...</p>
      </div>
    );
  }

  if (error && !job) {
    return (
      <div className="container" style={styles.centerContainer}>
        <div className="alert alert-error">{error}</div>
        <Link to="/jobs" className="btn btn-secondary" style={{ marginTop: '16px' }}>
          <ArrowLeft size={16} /> Back to Jobs
        </Link>
      </div>
    );
  }

  const { title, description, requirements, skills, location, salaryRange, jobType, company, createdAt, views, isFake } = job;
  const isOwner = userProfile && userProfile.clerkId === job.recruiterId;
  const isAdmin = userProfile && userProfile.role === 'admin';

  return (
    <div className="container page-transition" style={styles.page}>
      {/* Back button */}
      <Link to="/jobs" style={styles.backLink}>
        <ArrowLeft size={16} />
        Back to Browse
      </Link>

      {/* Admin Actions Bar */}
      {isAdmin && (
        <div className="glass-card" style={styles.adminBar}>
          <div style={styles.adminBarText}>
            <ShieldAlert size={20} color="var(--error)" />
            <span><strong>Admin Moderation Panel:</strong> Manage this job posting.</span>
          </div>
          <div style={styles.adminBarActions}>
            <button onClick={handleAdminToggleFlag} className="btn btn-secondary" style={{ borderColor: 'var(--warning)' }}>
              {isFake ? 'Verify Job' : 'Flag as Fake'}
            </button>
            <button onClick={handleAdminDelete} className="btn btn-danger">
              Remove Job Listing
            </button>
          </div>
        </div>
      )}

      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      <div style={styles.grid}>
        {/* Left Side: Job Content */}
        <div style={styles.mainCol}>
          <div className="glass-card" style={styles.headerCard}>
            <div style={styles.headerTop}>
              <h1 style={styles.title}>{title}</h1>
              <span className="badge badge-type">{jobType}</span>
            </div>
            
            <div style={styles.companyRow}>
              <Building2 size={18} color="var(--accent-primary)" />
              <span style={styles.companyName}>{company?.name || 'Verified Employer'}</span>
              {company?.location && (
                <>
                  <span style={styles.dot}>•</span>
                  <span style={styles.companyLoc}>{company.location}</span>
                </>
              )}
            </div>

            <div style={styles.statsRow}>
              <div style={styles.statItem}>
                <MapPin size={16} color="var(--text-muted)" />
                <span>{location}</span>
              </div>
              {salaryRange && (
                <div style={styles.statItem}>
                  <DollarSign size={16} color="var(--text-muted)" />
                  <span>{salaryRange}</span>
                </div>
              )}
              <div style={styles.statItem}>
                <Calendar size={16} color="var(--text-muted)" />
                <span>Posted {new Date(createdAt).toLocaleDateString()}</span>
              </div>
              <div style={styles.statItem}>
                <Clock size={16} color="var(--text-muted)" />
                <span>{views} views</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="glass-card" style={styles.bodyCard}>
            <h2 style={styles.sectionHeading}>Job Description</h2>
            <p style={styles.descriptionText}>{description}</p>

            {/* Requirements */}
            {requirements && requirements.length > 0 && (
              <>
                <h2 style={styles.sectionHeading}>Requirements & Qualifications</h2>
                <ul style={styles.requirementsList}>
                  {requirements.map((req, idx) => (
                    <li key={idx} style={styles.requirementItem}>{req}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>

        {/* Right Side: Sidebar Actions / Company Profile */}
        <div style={styles.sidebar}>
          {/* Action Card */}
          <div className="glass-card" style={styles.actionCard}>
            <h3 style={styles.sidebarTitle}>Job Operations</h3>
            
            {isSignedIn ? (
              userProfile?.role === 'seeker' ? (
                applicationStatus ? (
                  <div style={styles.appliedState}>
                    <p style={styles.appliedText}>You have applied to this job listing.</p>
                    <span className={`badge badge-${applicationStatus.toLowerCase()}`} style={{ fontSize: '1rem', padding: '8px 16px' }}>
                      Status: {applicationStatus}
                    </span>
                  </div>
                ) : (
                  <button onClick={() => setShowApplyModal(true)} className="btn btn-primary" style={{ width: '100%' }}>
                    Apply For Job
                    <Send size={18} />
                  </button>
                )
              ) : isOwner ? (
                <div style={styles.ownerState}>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>This is your job listing.</p>
                  <Link to="/recruiter-dashboard" className="btn btn-secondary" style={{ width: '100%' }}>
                    Manage Applicants
                  </Link>
                </div>
              ) : (
                <p style={styles.infoText}>Sign in as a Seeker user to apply for this job listing.</p>
              )
            ) : (
              <div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.9rem' }}>
                  Please login to upload details and apply.
                </p>
                <Link to="/login" className="btn btn-primary" style={{ width: '100%' }}>
                  Log In to Apply
                </Link>
              </div>
            )}
          </div>

          {/* Company Details Card */}
          {company && (
            <div className="glass-card" style={styles.companyCard}>
              <h3 style={styles.sidebarTitle}>About Company</h3>
              <h4 style={styles.sidebarCompanyName}>{company.name}</h4>
              {company.website && (
                <a href={company.website} target="_blank" rel="noopener noreferrer" style={styles.websiteLink}>
                  <Globe size={14} />
                  Visit Website
                </a>
              )}
              {company.description && (
                <p style={styles.companyDesc}>{company.description}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <div style={styles.modalOverlay}>
          <div className="glass-card" style={styles.modalContent}>
            <h3 style={{ marginBottom: '12px', fontFamily: 'var(--font-heading)' }}>Submit Your Application</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
              We will submit your profile information and your uploaded resume (<strong>{userProfile?.profile?.resumeOriginalName || 'Uploaded PDF'}</strong>).
            </p>

            <form onSubmit={handleApplySubmit}>
              <div className="form-group">
                <label className="form-label">Cover Letter (Optional)</label>
                <textarea 
                  className="form-textarea"
                  placeholder="Introduce yourself and explain why you're a great fit for this position..."
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  style={{ minHeight: '150px' }}
                />
              </div>

              <div style={styles.modalBtns}>
                <button 
                  type="button" 
                  onClick={() => setShowApplyModal(false)} 
                  className="btn btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
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
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
    marginBottom: '24px',
    fontWeight: '500',
  },
  adminBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    borderColor: 'rgba(239, 68, 68, 0.25)',
    background: 'rgba(239, 68, 68, 0.03)',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  adminBarText: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '0.95rem',
  },
  adminBarActions: {
    display: 'flex',
    gap: '12px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 340px',
    gap: '30px',
    alignItems: 'start',
  },
  mainCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  headerCard: {
    padding: '36px',
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px',
  },
  title: {
    fontSize: '2.2rem',
    lineHeight: '1.2',
  },
  companyRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '12px',
    color: 'var(--text-secondary)',
    fontWeight: '500',
  },
  companyName: {
    color: 'var(--text-primary)',
  },
  companyLoc: {
    fontSize: '0.9rem',
  },
  dot: {
    color: 'var(--text-muted)',
  },
  statsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '24px',
    marginTop: '24px',
    paddingTop: '20px',
    borderTop: '1px solid var(--glass-border)',
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  bodyCard: {
    padding: '36px',
  },
  sectionHeading: {
    fontSize: '1.4rem',
    marginBottom: '16px',
    color: 'var(--text-primary)',
    borderLeft: '4px solid var(--accent-primary)',
    paddingLeft: '12px',
    '&:not(:first-of-type)': {
      marginTop: '32px',
    }
  },
  descriptionText: {
    fontSize: '1.02rem',
    lineHeight: '1.7',
    color: 'var(--text-secondary)',
    whiteSpace: 'pre-line',
  },
  requirementsList: {
    paddingLeft: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  requirementItem: {
    fontSize: '1rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  actionCard: {
    padding: '24px',
  },
  sidebarTitle: {
    fontSize: '1.15rem',
    marginBottom: '16px',
    borderBottom: '1px solid var(--glass-border)',
    paddingBottom: '8px',
  },
  appliedState: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  appliedText: {
    fontSize: '0.9rem',
    color: 'var(--success)',
    fontWeight: '500',
  },
  ownerState: {
    textAlign: 'center',
  },
  infoText: {
    fontSize: '0.88rem',
    color: 'var(--text-muted)',
    lineHeight: '1.4',
  },
  companyCard: {
    padding: '24px',
  },
  sidebarCompanyName: {
    fontSize: '1.2rem',
    marginBottom: '4px',
  },
  websiteLink: {
    fontSize: '0.85rem',
    color: 'var(--accent-primary)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '16px',
    fontWeight: '500',
  },
  companyDesc: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
  },
  centerContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(8px)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  modalContent: {
    width: '100%',
    maxWidth: '550px',
    padding: '32px',
    boxShadow: 'var(--shadow-lg)',
  },
  modalBtns: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '24px',
  }
};

export default JobDetails;

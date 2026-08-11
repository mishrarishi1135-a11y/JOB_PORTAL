import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Shield, Users, Briefcase, FileText, CheckCircle2, XCircle, Trash2, ShieldAlert } from 'lucide-react';
import axios from 'axios';

const AdminDashboard = () => {
  const { isSignedIn, getToken } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('users');

  // Admin Data states
  const [analytics, setAnalytics] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [jobsList, setJobsList] = useState([]);

  // Loading states
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(true);

  // Fetch metrics & analytics
  const fetchAnalytics = async () => {
    try {
      const token = await getToken();
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  // Fetch all users
  const fetchUsers = async () => {
    try {
      const token = await getToken();
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsersList(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch all jobs
  const fetchJobs = async () => {
    try {
      const token = await getToken();
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/jobs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJobsList(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    if (isSignedIn) {
      fetchAnalytics();
      fetchUsers();
      fetchJobs();
    }
  }, [isSignedIn]);

  // Toggle user role
  const handleUpdateUserRole = async (userId, currentRole) => {
    const rolesOrder = ['seeker', 'recruiter', 'admin'];
    const currentIdx = rolesOrder.indexOf(currentRole);
    const nextRole = rolesOrder[(currentIdx + 1) % rolesOrder.length];

    if (!window.confirm(`Admin Action: Are you sure you want to change this user's role to "${nextRole.toUpperCase()}"?`)) return;

    try {
      const token = await getToken();
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/admin/users/${userId}/role`,
        { role: nextRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state list
      setUsersList(prev => prev.map(u => {
        if (u._id === userId) {
          return { ...u, role: nextRole };
        }
        return u;
      }));
      fetchAnalytics();
    } catch (err) {
      console.error(err);
      alert('Failed to change user role.');
    }
  };

  // Delete user account
  const handleDeleteUser = async (userId, name) => {
    if (!window.confirm(`Admin Action: Are you sure you want to delete user "${name}"? This removes their profile and all related applications or job postings.`)) return;

    try {
      const token = await getToken();
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsersList(prev => prev.filter(u => u._id !== userId));
      fetchAnalytics();
      fetchJobs(); // refresh jobs list in case recruiter jobs were deleted
    } catch (err) {
      console.error(err);
      alert('Failed to delete user.');
    }
  };

  // Flag/Unflag jobs
  const handleToggleJobFlag = async (jobId) => {
    try {
      const token = await getToken();
      const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/admin/jobs/${jobId}/flag`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state list
      setJobsList(prev => prev.map(j => {
        if (j._id === jobId) {
          return { ...j, isFake: res.data.job.isFake };
        }
        return j;
      }));
      fetchAnalytics();
    } catch (err) {
      console.error(err);
      alert('Failed to toggle job verification state.');
    }
  };

  // Delete job listing
  const handleDeleteJobAdmin = async (jobId) => {
    if (!window.confirm('Admin Action: Are you sure you want to delete this job listing permanently?')) return;
    try {
      const token = await getToken();
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJobsList(prev => prev.filter(j => j._id !== jobId));
      fetchAnalytics();
    } catch (err) {
      console.error(err);
      alert('Failed to remove job posting.');
    }
  };

  return (
    <div className="container page-transition" style={styles.page}>
      <div style={styles.header}>
        <div style={styles.titleRow}>
          <Shield size={28} color="var(--error)" />
          <h2 style={styles.heading}>Administrative Deck</h2>
        </div>
        <p style={styles.sub}>Portal metrics, account roles moderation, and job list filtering.</p>
      </div>

      {/* Metrics Cards Grid */}
      {loadingAnalytics ? (
        <div className="spinner"></div>
      ) : analytics ? (
        <div style={styles.statsGrid}>
          <div className="glass-card" style={styles.statCard}>
            <Users size={24} color="var(--accent-primary)" />
            <div style={styles.statInfo}>
              <span style={styles.statVal}>{analytics.metrics.totalUsers}</span>
              <span style={styles.statLabel}>Total Accounts ({analytics.metrics.totalSeekers} Seekers, {analytics.metrics.totalRecruiters} Recruiters)</span>
            </div>
          </div>

          <div className="glass-card" style={styles.statCard}>
            <Briefcase size={24} color="var(--accent-secondary)" />
            <div style={styles.statInfo}>
              <span style={styles.statVal}>{analytics.metrics.totalJobs}</span>
              <span style={styles.statLabel}>Total Postings ({analytics.metrics.activeJobs} Active, {analytics.metrics.flaggedJobs} Flagged)</span>
            </div>
          </div>

          <div className="glass-card" style={styles.statCard}>
            <FileText size={24} color="var(--accent-tertiary)" />
            <div style={styles.statInfo}>
              <span style={styles.statVal}>{analytics.metrics.totalApplications}</span>
              <span style={styles.statLabel}>Applications Processed</span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Sub Tabs */}
      <div style={styles.subTabsRow}>
        <button 
          onClick={() => setActiveSubTab('users')} 
          style={activeSubTab === 'users' ? styles.subTabActive : styles.subTab}
        >
          Manage Platform Users ({usersList.length})
        </button>
        <button 
          onClick={() => setActiveSubTab('jobs')} 
          style={activeSubTab === 'jobs' ? styles.subTabActive : styles.subTab}
        >
          Moderate Job Listings ({jobsList.length})
        </button>
      </div>

      {/* Tab Panels */}
      {activeSubTab === 'users' ? (
        <div className="glass-card" style={styles.panel}>
          <h3 style={styles.panelTitle}>Platform Users Directory</h3>
          
          {loadingUsers ? (
            <div className="spinner"></div>
          ) : usersList.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No registered users found in the system database.</p>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>User Name</th>
                    <th>Email Address</th>
                    <th>Clerk ID Reference</th>
                    <th>Assigned Role</th>
                    <th>Toggle Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((user) => (
                    <tr key={user._id}>
                      <td>
                        <strong>{user.name}</strong>
                      </td>
                      <td>{user.email}</td>
                      <td style={styles.clerkIdText}>{user.clerkId}</td>
                      <td>
                        <span className={`badge ${user.role === 'admin' ? 'badge-rejected' : user.role === 'recruiter' ? 'badge-interviewing' : 'badge-applied'}`}>
                          {user.role.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => handleUpdateUserRole(user._id, user.role)} className="btn btn-secondary" style={styles.actionBtnSmall}>
                          Cycle Role
                        </button>
                      </td>
                      <td>
                        <button onClick={() => handleDeleteUser(user._id, user.name)} className="btn btn-danger" style={styles.deleteBtnSmall}>
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-card" style={styles.panel}>
          <h3 style={styles.panelTitle}>Platform Job Listings</h3>

          {loadingJobs ? (
            <div className="spinner"></div>
          ) : jobsList.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No job listings created on the platform yet.</p>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Job Title</th>
                    <th>Company</th>
                    <th>Location</th>
                    <th>Views</th>
                    <th>Audit Status</th>
                    <th>Action Toggle</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobsList.map((job) => (
                    <tr key={job._id}>
                      <td>
                        <strong>{job.title}</strong>
                      </td>
                      <td>{job.company?.name || 'Unknown Company'}</td>
                      <td>{job.location}</td>
                      <td>{job.views || 0}</td>
                      <td>
                        {job.isFake ? (
                          <span className="badge badge-rejected" style={{ gap: '4px' }}>
                            <XCircle size={12} />
                            Flagged Fake
                          </span>
                        ) : (
                          <span className="badge badge-shortlisted" style={{ gap: '4px' }}>
                            <CheckCircle2 size={12} />
                            Verified
                          </span>
                        )}
                      </td>
                      <td>
                        <button 
                          onClick={() => handleToggleJobFlag(job._id)} 
                          className="btn btn-secondary" 
                          style={{ 
                            ...styles.actionBtnSmall, 
                            borderColor: job.isFake ? 'var(--success)' : 'var(--warning)',
                            color: job.isFake ? 'var(--success)' : 'var(--warning)'
                          }}
                        >
                          {job.isFake ? 'Verify Job' : 'Flag Fake'}
                        </button>
                      </td>
                      <td>
                        <button onClick={() => handleDeleteJobAdmin(job._id)} className="btn btn-danger" style={styles.deleteBtnSmall}>
                          <Trash2 size={14} />
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
  header: {
    marginBottom: '32px',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  heading: {
    fontSize: '2.2rem',
    margin: 0,
  },
  sub: {
    color: 'var(--text-secondary)',
    marginTop: '4px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
    marginBottom: '36px',
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    padding: '24px 30px',
  },
  statInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  statVal: {
    fontSize: '2.2rem',
    fontWeight: '800',
    fontFamily: 'var(--font-heading)',
    lineHeight: '1',
  },
  statLabel: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    marginTop: '6px',
  },
  subTabsRow: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
    borderBottom: '1px solid var(--glass-border)',
    paddingBottom: '8px',
  },
  subTab: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    padding: '10px 20px',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    borderRadius: 'var(--radius-md)',
    transition: 'all var(--transition-fast)',
    '&:hover': {
      color: 'var(--text-primary)',
      background: 'rgba(255, 255, 255, 0.03)',
    }
  },
  subTabActive: {
    background: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid var(--error)',
    color: 'var(--text-primary)',
    padding: '10px 20px',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
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
  clerkIdText: {
    fontFamily: 'monospace',
    fontSize: '0.82rem',
    color: 'var(--text-muted)',
  },
  actionBtnSmall: {
    padding: '6px 12px',
    fontSize: '0.8rem',
  },
  deleteBtnSmall: {
    padding: '6px 12px',
    fontSize: '0.8rem',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  }
};

export default AdminDashboard;

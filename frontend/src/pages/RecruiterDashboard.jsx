import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Briefcase, Building2, Users, Plus, ListCollapse, User, ExternalLink, Calendar, Check, X, ShieldAlert } from 'lucide-react';
import axios from 'axios';

const RecruiterDashboard = () => {
  const { isSignedIn } = useAuth();
  const [activeTab, setActiveTab] = useState('jobs');

  // Recruiter Data states
  const [companies, setCompanies] = useState([]);
  const [jobs, setJobs] = useState([]);
  
  // Loading states
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  // Selected Job for Applicants management
  const [selectedJob, setSelectedJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);

  // Forms states
  const [jobForm, setJobForm] = useState({
    title: '', description: '', location: '', salaryRange: '', jobType: 'Full-time',
    requirements: '', skills: '', companyId: ''
  });
  const [companyForm, setCompanyForm] = useState({
    name: '', logoUrl: '', website: '', description: '', location: ''
  });

  const [msg, setMsg] = useState({ type: '', text: '' });
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch recruiter's companies
  const fetchCompanies = async () => {
    try {
      const token = await window.Clerk.session.getToken();
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/companies/my-companies`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCompanies(res.data);
      if (res.data.length > 0 && !jobForm.companyId) {
        setJobForm(prev => ({ ...prev, companyId: res.data[0]._id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCompanies(false);
    }
  };

  // Fetch recruiter's posted jobs
  const fetchJobs = async () => {
    try {
      const token = await window.Clerk.session.getToken();
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/jobs/recruiter/my-posts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJobs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    if (isSignedIn) {
      fetchCompanies();
      fetchJobs();
    }
  }, [isSignedIn]);

  // Post Job form handler
  const handleJobSubmit = async (e) => {
    e.preventDefault();
    if (!jobForm.companyId) {
      alert('Please register and select a company profile first.');
      setActiveTab('companies');
      return;
    }

    setActionLoading(true);
    setMsg({ type: '', text: '' });
    try {
      const token = await window.Clerk.session.getToken();
      await axios.post(`${import.meta.env.VITE_API_URL}/api/jobs`, jobForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMsg({ type: 'success', text: 'Job listing posted successfully!' });
      // Reset form
      setJobForm({
        title: '', description: '', location: '', salaryRange: '', jobType: 'Full-time',
        requirements: '', skills: '', companyId: companies[0]?._id || ''
      });
      fetchJobs();
      setActiveTab('jobs');
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to post job listing.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Create Company form handler
  const handleCompanySubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setMsg({ type: '', text: '' });
    try {
      const token = await window.Clerk.session.getToken();
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/companies`, companyForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMsg({ type: 'success', text: `Company profile "${res.data.name}" created successfully!` });
      setCompanyForm({ name: '', logoUrl: '', website: '', description: '', location: '' });
      fetchCompanies();
      setActiveTab('post-job');
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to register company profile.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Load applicants for selected job
  const handleViewApplicants = async (job) => {
    setSelectedJob(job);
    setLoadingApplicants(true);
    setApplicants([]);
    try {
      const token = await window.Clerk.session.getToken();
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/applications/job/${job._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApplicants(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to load candidate applications.');
    } finally {
      setLoadingApplicants(false);
    }
  };

  // Update applicant status
  const handleUpdateStatus = async (appId, newStatus) => {
    try {
      const token = await window.Clerk.session.getToken();
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/applications/${appId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state list
      setApplicants(prev => prev.map(app => {
        if (app._id === appId) {
          return { ...app, status: newStatus };
        }
        return app;
      }));
    } catch (err) {
      console.error(err);
      alert('Failed to update candidate status.');
    }
  };

  // Delete posted job listing
  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to permanently delete this job listing?')) return;
    try {
      const token = await window.Clerk.session.getToken();
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJobs(prev => prev.filter(job => job._id !== jobId));
      if (selectedJob?._id === jobId) {
        setSelectedJob(null);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete job post.');
    }
  };

  return (
    <div className="container page-transition" style={styles.page}>
      <h2 style={styles.heading}>Recruiter Workspace</h2>
      <p style={styles.sub}>Deploy job opportunities, build employer profiles, and evaluate applicants.</p>

      {msg.text && (
        <div className={`alert alert-${msg.type}`}>
          <span>{msg.text}</span>
        </div>
      )}

      {/* Recruiter Tabs row */}
      <div style={styles.tabsRow}>
        <button onClick={() => { setActiveTab('jobs'); setSelectedJob(null); }} style={activeTab === 'jobs' ? styles.tabActive : styles.tab}>
          <ListCollapse size={16} />
          Active Postings ({jobs.length})
        </button>
        <button onClick={() => setActiveTab('post-job')} style={activeTab === 'post-job' ? styles.tabActive : styles.tab}>
          <Plus size={16} />
          Publish a Job
        </button>
        <button onClick={() => setActiveTab('companies')} style={activeTab === 'companies' ? styles.tabActive : styles.tab}>
          <Building2 size={16} />
          Company Profile ({companies.length})
        </button>
      </div>

      <div style={styles.layout}>
        {/* Main Content Pane */}
        <div style={styles.mainPane}>
          {activeTab === 'jobs' && (
            <div className="glass-card" style={styles.card}>
              <h3 style={styles.sectionTitle}>Your Posted Jobs</h3>
              
              {loadingJobs ? (
                <div className="spinner"></div>
              ) : jobs.length === 0 ? (
                <div style={styles.empty}>
                  <Briefcase size={40} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
                  <p>You haven't posted any job listings yet.</p>
                  <button onClick={() => setActiveTab('post-job')} className="btn btn-primary" style={{ marginTop: '16px' }}>
                    Post Your First Job
                  </button>
                </div>
              ) : (
                <div style={styles.jobsList}>
                  {jobs.map((job) => (
                    <div 
                      key={job._id} 
                      style={selectedJob?._id === job._id ? styles.jobRowActive : styles.jobRow}
                    >
                      <div style={styles.jobRowLeft}>
                        <strong>{job.title}</strong>
                        <span style={styles.jobRowLoc}>{job.location} • {job.jobType}</span>
                        <span style={styles.jobRowViews}>{job.views} views</span>
                      </div>
                      <div style={styles.jobRowBtns}>
                        <button onClick={() => handleViewApplicants(job)} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                          <Users size={14} />
                          Applicants
                        </button>
                        <button onClick={() => handleDeleteJob(job._id)} className="btn btn-danger" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'post-job' && (
            <div className="glass-card" style={styles.card}>
              <h3 style={styles.sectionTitle}>Publish New Listing</h3>
              
              {companies.length === 0 ? (
                <div style={styles.empty}>
                  <Building2 size={40} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
                  <p>You need to create a Company Profile before publishing jobs.</p>
                  <button onClick={() => setActiveTab('companies')} className="btn btn-primary" style={{ marginTop: '16px' }}>
                    Create Company Profile
                  </button>
                </div>
              ) : (
                <form onSubmit={handleJobSubmit} style={styles.form}>
                  <div className="form-group">
                    <label className="form-label">Company Profile</label>
                    <select 
                      className="form-select"
                      value={jobForm.companyId}
                      onChange={e => setJobForm({ ...jobForm, companyId: e.target.value })}
                      required
                    >
                      {companies.map(c => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.row}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Job Title</label>
                      <input 
                        type="text" className="form-input" placeholder="e.g. Lead React Developer"
                        value={jobForm.title} onChange={e => setJobForm({ ...jobForm, title: e.target.value })} required 
                      />
                    </div>
                    <div className="form-group" style={{ width: '220px' }}>
                      <label className="form-label">Job Type</label>
                      <select 
                        className="form-select"
                        value={jobForm.jobType} onChange={e => setJobForm({ ...jobForm, jobType: e.target.value })}
                      >
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Contract">Contract</option>
                        <option value="Internship">Internship</option>
                        <option value="Remote">Remote</option>
                      </select>
                    </div>
                  </div>

                  <div style={styles.row}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Location</label>
                      <input 
                        type="text" className="form-input" placeholder="e.g. San Francisco, CA or Remote"
                        value={jobForm.location} onChange={e => setJobForm({ ...jobForm, location: e.target.value })} required 
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Salary Range</label>
                      <input 
                        type="text" className="form-input" placeholder="e.g. $120,000 - $140,000"
                        value={jobForm.salaryRange} onChange={e => setJobForm({ ...jobForm, salaryRange: e.target.value })} 
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Job Description</label>
                    <textarea 
                      className="form-textarea" placeholder="Explain the responsibilities and scope of the job..."
                      value={jobForm.description} onChange={e => setJobForm({ ...jobForm, description: e.target.value })} required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Key Requirements (One per line / Comma separated)</label>
                    <textarea 
                      className="form-textarea" placeholder="e.g. 3+ years experience with React&#10;Strong understanding of REST APIs&#10;Experience with Tailwind CSS"
                      value={jobForm.requirements} onChange={e => setJobForm({ ...jobForm, requirements: e.target.value })} 
                      style={{ minHeight: '80px' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Skills Needed (Comma separated)</label>
                    <input 
                      type="text" className="form-input" placeholder="e.g. React, JavaScript, Node.js, CSS"
                      value={jobForm.skills} onChange={e => setJobForm({ ...jobForm, skills: e.target.value })} 
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={actionLoading}>
                    {actionLoading ? 'Publishing...' : 'Publish Job Listing'}
                  </button>
                </form>
              )}
            </div>
          )}

          {activeTab === 'companies' && (
            <div className="glass-card" style={styles.card}>
              <h3 style={styles.sectionTitle}>Register Company Profile</h3>
              
              <form onSubmit={handleCompanySubmit} style={styles.form}>
                <div className="form-group">
                  <label className="form-label">Company Name</label>
                  <input 
                    type="text" className="form-input" placeholder="e.g. Acme Tech Solutions"
                    value={companyForm.name} onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })} required 
                  />
                </div>

                <div style={styles.row}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Website URL</label>
                    <input 
                      type="url" className="form-input" placeholder="e.g. https://acme.io"
                      value={companyForm.website} onChange={e => setCompanyForm({ ...companyForm, website: e.target.value })} 
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">HQ Location</label>
                    <input 
                      type="text" className="form-input" placeholder="e.g. New York, NY"
                      value={companyForm.location} onChange={e => setCompanyForm({ ...companyForm, location: e.target.value })} 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Logo URL (Icon Image)</label>
                  <input 
                    type="text" className="form-input" placeholder="e.g. https://example.com/logo.png"
                    value={companyForm.logoUrl} onChange={e => setCompanyForm({ ...companyForm, logoUrl: e.target.value })} 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Company Description</label>
                  <textarea 
                    className="form-textarea" placeholder="Explain the company values, industry, and workspace style..."
                    value={companyForm.description} onChange={e => setCompanyForm({ ...companyForm, description: e.target.value })} 
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={actionLoading}>
                  {actionLoading ? 'Creating...' : 'Register Company Profile'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right Side Pane: Applicants list for selected job */}
        <div style={styles.sidePane}>
          {selectedJob ? (
            <div className="glass-card" style={styles.applicantsCard}>
              <h3 style={styles.sidebarTitle}>
                Candidates: {selectedJob.title}
              </h3>

              {loadingApplicants ? (
                <div className="spinner"></div>
              ) : applicants.length === 0 ? (
                <p style={styles.emptyApplicants}>No candidates have applied to this posting yet.</p>
              ) : (
                <div style={styles.applicantsList}>
                  {applicants.map((app) => (
                    <div key={app._id} className="glass-card" style={styles.candidateCard}>
                      <div style={styles.candidateHeader}>
                        <User size={18} color="var(--accent-secondary)" />
                        <strong>{app.applicant?.name || 'Applicant'}</strong>
                        <span className={`badge badge-${app.status.toLowerCase()}`} style={{ fontSize: '0.75rem', padding: '4px 8px' }}>
                          {app.status}
                        </span>
                      </div>
                      
                      <p style={styles.candidateEmail}>{app.applicant?.email}</p>
                      
                      {app.applicant?.profile?.bio && (
                        <p style={styles.candidateBio}>"{app.applicant.profile.bio}"</p>
                      )}

                      {app.coverLetter && (
                        <div style={styles.candidateCoverBox}>
                          <strong>Cover Letter:</strong>
                          <p style={styles.candidateCoverText}>{app.coverLetter}</p>
                        </div>
                      )}

                      {/* Skills */}
                      {app.applicant?.profile?.skills && app.applicant.profile.skills.length > 0 && (
                        <div style={styles.candidateSkills}>
                          {app.applicant.profile.skills.map((s, i) => (
                            <span key={i} style={styles.candidateSkillTag}>{s}</span>
                          ))}
                        </div>
                      )}

                      {/* CV Link */}
                      <a href={`${import.meta.env.VITE_API_URL}${app.resumeUrl}`} target="_blank" rel="noopener noreferrer" style={styles.candidateResumeLink}>
                        <ExternalLink size={14} />
                        Download Submitted Resume (PDF)
                      </a>

                      {/* Status Modifiers */}
                      <div style={styles.statusButtonsRow}>
                        <button 
                          onClick={() => handleUpdateStatus(app._id, 'Shortlisted')} 
                          style={{ ...styles.statusBtn, color: 'var(--success)', background: 'var(--success-glow)' }}
                          title="Shortlist candidate"
                        >
                          Shortlist
                        </button>
                        <button 
                          onClick={() => handleUpdateStatus(app._id, 'Interviewing')} 
                          style={{ ...styles.statusBtn, color: 'var(--warning)', background: 'var(--warning-glow)' }}
                          title="Schedule interview"
                        >
                          Interview
                        </button>
                        <button 
                          onClick={() => handleUpdateStatus(app._id, 'Accepted')} 
                          style={{ ...styles.statusBtn, color: 'var(--success)', background: 'rgba(16,185,129,0.2)' }}
                          title="Extend offer"
                        >
                          Accept
                        </button>
                        <button 
                          onClick={() => handleUpdateStatus(app._id, 'Rejected')} 
                          style={{ ...styles.statusBtn, color: 'var(--error)', background: 'var(--error-glow)' }}
                          title="Reject candidate"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="glass-card" style={styles.sidePaneEmptyCard}>
              <Users size={36} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
              <h4>Candidate Evaluation Desk</h4>
              <p style={styles.evaluationTip}>
                Click the <strong>Applicants</strong> button on any active job listing to review credentials, download resumes, and manage candidates.
              </p>
            </div>
          )}
        </div>
      </div>
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
  layout: {
    display: 'grid',
    gridTemplateColumns: '1fr 380px',
    gap: '30px',
    alignItems: 'start',
  },
  mainPane: {
    flex: 1,
  },
  card: {
    padding: '32px',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    marginBottom: '20px',
    fontFamily: 'var(--font-heading)',
    borderBottom: '1px solid var(--glass-border)',
    paddingBottom: '10px',
  },
  empty: {
    textAlign: 'center',
    padding: '40px 0',
    color: 'var(--text-secondary)',
  },
  jobsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  jobRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderRadius: 'var(--radius-md)',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--glass-border)',
    transition: 'all var(--transition-normal)',
  },
  jobRowActive: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderRadius: 'var(--radius-md)',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--accent-primary)',
    boxShadow: 'var(--shadow-glow)',
    transition: 'all var(--transition-normal)',
  },
  jobRowLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  jobRowLoc: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
  },
  jobRowViews: {
    fontSize: '0.78rem',
    color: 'var(--text-muted)',
    fontWeight: '500',
  },
  jobRowBtns: {
    display: 'flex',
    gap: '10px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  row: {
    display: 'flex',
    gap: '16px',
  },
  sidePane: {
    width: '100%',
  },
  applicantsCard: {
    padding: '24px',
  },
  sidebarTitle: {
    fontSize: '1.15rem',
    marginBottom: '16px',
    borderBottom: '1px solid var(--glass-border)',
    paddingBottom: '8px',
  },
  emptyApplicants: {
    fontSize: '0.9rem',
    color: 'var(--text-muted)',
    textAlign: 'center',
    padding: '20px 0',
  },
  applicantsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  candidateCard: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    borderColor: 'var(--glass-border)',
    background: 'rgba(255, 255, 255, 0.01)',
  },
  candidateHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  candidateEmail: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    marginTop: '-4px',
  },
  candidateBio: {
    fontSize: '0.88rem',
    color: 'var(--text-secondary)',
    fontStyle: 'italic',
    lineHeight: '1.4',
  },
  candidateCoverBox: {
    background: 'rgba(255, 255, 255, 0.01)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-sm)',
    padding: '10px',
    fontSize: '0.85rem',
  },
  candidateCoverText: {
    color: 'var(--text-secondary)',
    marginTop: '4px',
  },
  candidateSkills: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
  },
  candidateSkillTag: {
    fontSize: '0.72rem',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--glass-border)',
    padding: '2px 8px',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-secondary)',
  },
  candidateResumeLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.82rem',
    color: 'var(--accent-secondary)',
    fontWeight: '600',
    marginTop: '6px',
    alignSelf: 'flex-start',
    '&:hover': {
      textDecoration: 'underline',
    }
  },
  statusButtonsRow: {
    display: 'flex',
    gap: '6px',
    marginTop: '8px',
    flexWrap: 'wrap',
  },
  statusBtn: {
    flex: 1,
    padding: '6px 8px',
    fontSize: '0.75rem',
    fontWeight: '700',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'opacity var(--transition-fast)',
    '&:hover': {
      opacity: 0.85,
    }
  },
  sidePaneEmptyCard: {
    padding: '32px 24px',
    textAlign: 'center',
  },
  evaluationTip: {
    fontSize: '0.88rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
    marginTop: '8px',
  }
};

export default RecruiterDashboard;

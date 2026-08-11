import React, { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { User, FileText, Briefcase, GraduationCap, CheckCircle2, AlertCircle, UploadCloud } from 'lucide-react';
import axios from 'axios';

const Profile = () => {
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  // Profile data states
  const [name, setName] = useState('');
  const [role, setRole] = useState('seeker');
  const [bio, setBio] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [skills, setSkills] = useState('');
  
  // Experience list state
  const [experience, setExperience] = useState([]);
  const [newExp, setNewExp] = useState({ title: '', company: '', duration: '', description: '' });

  // Education list state
  const [education, setEducation] = useState([]);
  const [newEdu, setNewEdu] = useState({ school: '', degree: '', year: '' });

  // Resume state
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeName, setResumeName] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [resumeLoading, setResumeLoading] = useState(false);

  // General loading & notification states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // Load profile from DB
  const loadProfile = async () => {
    if (!isSignedIn) return;
    try {
      const token = await window.Clerk.session.getToken();
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const dbUser = response.data;
      setName(dbUser.name || '');
      setRole(dbUser.role || 'seeker');
      setBio(dbUser.profile?.bio || '');
      setContactNumber(dbUser.profile?.contactNumber || '');
      setSkills(dbUser.profile?.skills?.join(', ') || '');
      setExperience(dbUser.profile?.experience || []);
      setEducation(dbUser.profile?.education || []);
      setResumeUrl(dbUser.profile?.resumeUrl || '');
      setResumeName(dbUser.profile?.resumeOriginalName || '');
    } catch (error) {
      console.error('Error loading user profile:', error.message);
      setMsg({ type: 'error', text: 'Could not sync database user profile.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [isSignedIn]);

  // Update profile handler
  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg({ type: '', text: '' });

    try {
      const token = await window.Clerk.session.getToken();
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/auth/profile`,
        { name, role, bio, contactNumber, skills, experience, education },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMsg({ type: 'success', text: 'Your profile has been updated successfully!' });
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  // Upload Resume handler
  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Only PDF resume files are accepted.');
      return;
    }

    setResumeLoading(true);
    setMsg({ type: '', text: '' });
    
    const formData = new FormData();
    formData.append('resume', file);

    try {
      const token = await window.Clerk.session.getToken();
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/profile/resume`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setResumeUrl(response.data.resumeUrl);
      setResumeName(response.data.resumeOriginalName);
      setMsg({ type: 'success', text: 'Resume uploaded successfully!' });
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to upload resume file.' });
    } finally {
      setResumeLoading(false);
    }
  };

  // Add items list helper
  const addExperience = () => {
    if (!newExp.title || !newExp.company) {
      alert('Please fill out Job Title and Company.');
      return;
    }
    setExperience(prev => [...prev, newExp]);
    setNewExp({ title: '', company: '', duration: '', description: '' });
  };

  const removeExperience = (idx) => {
    setExperience(prev => prev.filter((_, i) => i !== idx));
  };

  const addEducation = () => {
    if (!newEdu.school || !newEdu.degree) {
      alert('Please fill out School name and Degree.');
      return;
    }
    setEducation(prev => [...prev, newEdu]);
    setNewEdu({ school: '', degree: '', year: '' });
  };

  const removeEducation = (idx) => {
    setEducation(prev => prev.filter((_, i) => i !== idx));
  };

  if (loading) {
    return (
      <div style={styles.centerContainer}>
        <div className="spinner"></div>
        <p>Loading profile info...</p>
      </div>
    );
  }

  return (
    <div className="container page-transition" style={styles.page}>
      <h2 style={styles.heading}>Your Workspace Profile</h2>
      <p style={styles.sub}>Update your developer portfolio, resumes, and system role.</p>

      {msg.text && (
        <div className={`alert alert-${msg.type}`}>
          {msg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{msg.text}</span>
        </div>
      )}

      <div style={styles.grid}>
        {/* Left Side: General Profile Info */}
        <div className="glass-card" style={styles.leftCol}>
          <form onSubmit={handleProfileSave}>
            <h3 style={styles.sectionTitle}>
              <User size={18} color="var(--accent-primary)" />
              Basic Information
            </h3>

            <div className="form-group">
              <label className="form-label">Email Address (Registered)</label>
              <input type="text" className="form-input" value={user?.primaryEmailAddress?.emailAddress || ''} disabled style={{ opacity: 0.7 }} />
            </div>

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input type="text" className="form-input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">Contact Number</label>
              <input type="text" className="form-input" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} placeholder="+1 (555) 019-928" />
            </div>

            <div className="form-group">
              <label className="form-label">Bio (Brief Summary)</label>
              <textarea className="form-textarea" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Full-stack engineer specializing in cloud services..." />
            </div>

            <div className="form-group">
              <label className="form-label">System Role Type</label>
              <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="seeker">Job Seeker (Browse & Apply)</option>
                <option value="recruiter">Recruiter (Post Jobs & Hire)</option>
              </select>
              <small style={styles.hint}>
                Switch to 'Recruiter' to activate company creation and job postings.
              </small>
            </div>

            {role === 'seeker' && (
              <div className="form-group">
                <label className="form-label">Developer Skills (Comma separated)</label>
                <input type="text" className="form-input" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, Node.js, Express, MongoDB, Sentry" />
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={saving} style={{ width: '100%', marginTop: '10px' }}>
              {saving ? 'Saving changes...' : 'Update Workspace Profile'}
            </button>
          </form>
        </div>

        {/* Right Side: Resume, Experience, and Education (For Seekers only) */}
        {role === 'seeker' ? (
          <div style={styles.rightCol}>
            {/* Resume Upload Card */}
            <div className="glass-card" style={styles.card}>
              <h3 style={styles.sectionTitle}>
                <FileText size={18} color="var(--accent-secondary)" />
                Curriculum Vitae (Resume PDF)
              </h3>
              
              <div style={styles.resumeBox}>
                {resumeUrl ? (
                  <div style={styles.resumeInfo}>
                    <div style={styles.pdfIcon}>PDF</div>
                    <div style={{ flex: 1 }}>
                      <p style={styles.resumeName}>{resumeName || 'resume.pdf'}</p>
                      <a href={resumeUrl && resumeUrl.startsWith('http') ? resumeUrl : `${import.meta.env.VITE_API_URL}${resumeUrl}`} target="_blank" rel="noopener noreferrer" style={styles.downloadLink}>
                        View Document
                      </a>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
                    No resume uploaded yet. Recruiters require a resume to review your applications.
                  </p>
                )}

                <div style={styles.uploadBtnWrapper}>
                  <label style={styles.uploadLabel}>
                    <UploadCloud size={16} />
                    {resumeLoading ? 'Uploading...' : resumeUrl ? 'Update Resume PDF' : 'Upload Resume PDF'}
                    <input 
                      type="file" 
                      accept=".pdf" 
                      onChange={handleResumeUpload} 
                      style={{ display: 'none' }}
                      disabled={resumeLoading}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Experience Card */}
            <div className="glass-card" style={styles.card}>
              <h3 style={styles.sectionTitle}>
                <Briefcase size={18} color="var(--accent-tertiary)" />
                Work History
              </h3>

              {experience.length > 0 && (
                <div style={styles.list}>
                  {experience.map((exp, idx) => (
                    <div key={idx} style={styles.listItem}>
                      <div style={styles.listItemHeader}>
                        <strong>{exp.title}</strong>
                        <button onClick={() => removeExperience(idx)} style={styles.removeBtn}>Delete</button>
                      </div>
                      <div style={styles.listItemMeta}>{exp.company} • {exp.duration}</div>
                      {exp.description && <p style={styles.listItemDesc}>{exp.description}</p>}
                    </div>
                  ))}
                </div>
              )}

              <div style={styles.addItemForm}>
                <div style={styles.row}>
                  <input type="text" className="form-input" placeholder="Title" value={newExp.title} onChange={e => setNewExp({ ...newExp, title: e.target.value })} />
                  <input type="text" className="form-input" placeholder="Company" value={newExp.company} onChange={e => setNewExp({ ...newExp, company: e.target.value })} />
                </div>
                <div style={styles.row}>
                  <input type="text" className="form-input" placeholder="Duration (e.g. 2022 - Present)" value={newExp.duration} onChange={e => setNewExp({ ...newExp, duration: e.target.value })} />
                  <input type="text" className="form-input" placeholder="Role Description" value={newExp.description} onChange={e => setNewExp({ ...newExp, description: e.target.value })} />
                </div>
                <button type="button" onClick={addExperience} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                  Add Experience
                </button>
              </div>
            </div>

            {/* Education Card */}
            <div className="glass-card" style={styles.card}>
              <h3 style={styles.sectionTitle}>
                <GraduationCap size={18} color="var(--success)" />
                Education Details
              </h3>

              {education.length > 0 && (
                <div style={styles.list}>
                  {education.map((edu, idx) => (
                    <div key={idx} style={styles.listItem}>
                      <div style={styles.listItemHeader}>
                        <strong>{edu.degree}</strong>
                        <button onClick={() => removeEducation(idx)} style={styles.removeBtn}>Delete</button>
                      </div>
                      <div style={styles.listItemMeta}>{edu.school} • {edu.year}</div>
                    </div>
                  ))}
                </div>
              )}

              <div style={styles.addItemForm}>
                <div style={styles.row}>
                  <input type="text" className="form-input" placeholder="School Name" value={newEdu.school} onChange={e => setNewEdu({ ...newEdu, school: e.target.value })} />
                  <input type="text" className="form-input" placeholder="Degree / Certificate" value={newEdu.degree} onChange={e => setNewEdu({ ...newEdu, degree: e.target.value })} />
                </div>
                <div style={styles.row}>
                  <input type="text" className="form-input" placeholder="Graduation Year (e.g. 2020)" value={newEdu.year} onChange={e => setNewEdu({ ...newEdu, year: e.target.value })} style={{ flex: 0.5 }} />
                </div>
                <button type="button" onClick={addEducation} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                  Add Education
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Recruiter Information Card */
          <div className="glass-card" style={styles.recruiterTipCard}>
            <h3 style={styles.sectionTitle}>
              <Briefcase size={18} color="var(--accent-primary)" />
              Recruiter Mode Active
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.6' }}>
              You are configured as an Employer. To post jobs and manage candidate shortlists, navigate to the 
              <strong> Recruiter Panel</strong> from the navigation bar.
            </p>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              First, make sure to set up your Company details there. Your company profile will automatically 
              be linked to any job listings you publish.
            </p>
          </div>
        )}
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
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
    gap: '30px',
    alignItems: 'start',
  },
  leftCol: {
    padding: '32px',
  },
  rightCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '30px',
  },
  card: {
    padding: '32px',
  },
  recruiterTipCard: {
    padding: '32px',
    height: 'fit-content',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    borderBottom: '1px solid var(--glass-border)',
    paddingBottom: '10px',
  },
  hint: {
    display: 'block',
    marginTop: '6px',
    color: 'var(--text-muted)',
    fontSize: '0.82rem',
  },
  resumeBox: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px dashed var(--glass-border)',
    borderRadius: 'var(--radius-md)',
    padding: '24px',
    textAlign: 'center',
  },
  resumeInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    textAlign: 'left',
    marginBottom: '20px',
    background: 'rgba(255, 255, 255, 0.02)',
    padding: '16px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--glass-border)',
  },
  pdfIcon: {
    width: '40px',
    height: '40px',
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#ef4444',
    fontWeight: '800',
    fontSize: '0.85rem',
    borderRadius: 'var(--radius-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resumeName: {
    fontWeight: '600',
    fontSize: '0.9rem',
    color: 'var(--text-primary)',
    wordBreak: 'break-all',
  },
  downloadLink: {
    fontSize: '0.8rem',
    color: 'var(--accent-primary)',
    fontWeight: '600',
  },
  uploadBtnWrapper: {
    display: 'flex',
    justifyContent: 'center',
  },
  uploadLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'var(--accent-primary-glow)',
    border: '1px solid var(--accent-primary)',
    color: 'var(--text-primary)',
    padding: '10px 20px',
    borderRadius: 'var(--radius-md)',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'all var(--transition-fast)',
    '&:hover': {
      background: 'var(--accent-primary)',
    }
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '20px',
  },
  listItem: {
    padding: '16px',
    borderRadius: 'var(--radius-md)',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--glass-border)',
  },
  listItemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  removeBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--error)',
    fontSize: '0.8rem',
    cursor: 'pointer',
  },
  listItemMeta: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    marginTop: '2px',
  },
  listItemDesc: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    marginTop: '8px',
    lineHeight: '1.4',
  },
  addItemForm: {
    marginTop: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    borderTop: '1px solid var(--glass-border)',
    paddingTop: '20px',
  },
  row: {
    display: 'flex',
    gap: '12px',
  },
  centerContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
  }
};

export default Profile;

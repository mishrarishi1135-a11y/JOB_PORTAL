import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { Search, MapPin, SlidersHorizontal, Briefcase, FilterX } from 'lucide-react';
import axios from 'axios';
import JobCard from '../components/JobCard';

const Jobs = () => {
  const { isSignedIn, getToken } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Job data state
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // User state (to trace bookmarked jobs)
  const [savedJobsList, setSavedJobsList] = useState([]);
  const [userRole, setUserRole] = useState('seeker');

  // Local filter states
  const [searchText, setSearchText] = useState(searchParams.get('search') || '');
  const [locationText, setLocationText] = useState(searchParams.get('location') || '');
  const [jobTypeFilter, setJobTypeFilter] = useState(searchParams.get('jobType') || '');
  const [skillsText, setSkillsText] = useState(searchParams.get('skills') || '');

  // Fetch jobs function
  const fetchJobs = async () => {
    setLoading(true);
    setError('');
    try {
      const queryParams = new URLSearchParams();
      if (searchText) queryParams.append('search', searchText);
      if (locationText) queryParams.append('location', locationText);
      if (jobTypeFilter) queryParams.append('jobType', jobTypeFilter);
      if (skillsText) queryParams.append('skills', skillsText);

      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/jobs?${queryParams.toString()}`);
      setJobs(response.data);
      setSearchParams(queryParams);
    } catch (err) {
      console.error('Error fetching jobs:', err.message);
      setError('Failed to retrieve job listings. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  // Sync user profile data (saved jobs & roles)
  const fetchProfile = async () => {
    if (!isSignedIn) return;
    try {
      const token = await getToken();
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserRole(response.data.role);
      setSavedJobsList(response.data.savedJobs?.map(j => j._id || j) || []);
    } catch (err) {
      console.error('Error fetching profile in jobs page:', err.message);
    }
  };

  // Trigger loading jobs on mount and search params changes
  useEffect(() => {
    fetchJobs();
    fetchProfile();
  }, [isSignedIn]);

  // Handle filter submission
  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchJobs();
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchText('');
    setLocationText('');
    setJobTypeFilter('');
    setSkillsText('');
    
    setLoading(true);
    axios.get(`${import.meta.env.VITE_API_URL}/api/jobs`)
      .then(response => {
        setJobs(response.data);
        setSearchParams(new URLSearchParams());
      })
      .catch(err => {
        console.error(err);
        setError('Failed to reload jobs.');
      })
      .finally(() => setLoading(false));
  };

  // Handle Save / Bookmark toggle
  const handleSaveToggle = async (jobId) => {
    if (!isSignedIn) {
      alert('Please sign in to save job listings.');
      return;
    }
    if (userRole !== 'seeker') {
      alert('Only job seekers can save listings.');
      return;
    }

    const isAlreadySaved = savedJobsList.includes(jobId);
    try {
      const token = await getToken();
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      if (isAlreadySaved) {
        await axios.delete(`${import.meta.env.VITE_API_URL}/api/auth/saved-jobs/${jobId}`, config);
        setSavedJobsList(prev => prev.filter(id => id !== jobId));
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/saved-jobs/${jobId}`, {}, config);
        setSavedJobsList(prev => [...prev, jobId]);
      }
    } catch (err) {
      console.error('Error toggling saved job:', err.message);
      alert('Failed to save job. Try again later.');
    }
  };

  return (
    <div className="container page-transition" style={styles.page}>
      <h2 style={styles.heading}>Explore Career Opportunities</h2>
      <p style={styles.sub}>Search and filter through the latest listings in our network.</p>

      <div style={styles.layout}>
        {/* Sidebar Filters */}
        <div className="glass-card" style={styles.filterSidebar}>
          <div style={styles.filterHeader}>
            <SlidersHorizontal size={18} color="var(--accent-primary)" />
            <h3 style={styles.filterTitle}>Filters</h3>
            <button onClick={resetFilters} style={styles.clearBtn} title="Clear all filters">
              <FilterX size={16} />
              Reset
            </button>
          </div>

          <form onSubmit={handleFilterSubmit} style={styles.filterForm}>
            <div className="form-group">
              <label className="form-label">Search Keywords</label>
              <div style={styles.inputWrapper}>
                <Search size={16} style={styles.inputIcon} />
                <input 
                  type="text" 
                  className="form-input" 
                  style={styles.formInputWithIcon}
                  placeholder="Title, bio..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Location</label>
              <div style={styles.inputWrapper}>
                <MapPin size={16} style={styles.inputIcon} />
                <input 
                  type="text" 
                  className="form-input" 
                  style={styles.formInputWithIcon}
                  placeholder="City, remote, online..."
                  value={locationText}
                  onChange={(e) => setLocationText(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Job Type</label>
              <select 
                className="form-select"
                value={jobTypeFilter}
                onChange={(e) => setJobTypeFilter(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
                <option value="Remote">Remote</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Key Skills (Comma separated)</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="React, node, css..."
                value={skillsText}
                onChange={(e) => setSkillsText(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={styles.applyFiltersBtn}>
              Apply Filters
            </button>
          </form>
        </div>

        {/* Job Listings Grid */}
        <div style={styles.listingsArea}>
          {error && <div className="alert alert-error">{error}</div>}

          {loading ? (
            <div style={styles.loadingContainer}>
              <div className="spinner"></div>
              <p style={{ color: 'var(--text-secondary)' }}>Searching live database...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="glass-card" style={styles.emptyCard}>
              <Briefcase size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
              <h3>No Jobs Match Your Filter Criteria</h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
                Try relaxing your search terms or clearing filters to discover new postings.
              </p>
              <button onClick={resetFilters} className="btn btn-secondary" style={{ marginTop: '20px' }}>
                Show All Listings
              </button>
            </div>
          ) : (
            <div style={styles.jobsGrid}>
              {jobs.map((job) => (
                <JobCard 
                  key={job._id}
                  job={job}
                  isSaved={savedJobsList.includes(job._id)}
                  onSaveToggle={handleSaveToggle}
                  hideSaveBtn={userRole !== 'seeker'}
                />
              ))}
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
  layout: {
    display: 'grid',
    gridTemplateColumns: '300px 1fr',
    gap: '30px',
    alignItems: 'start',
  },
  filterSidebar: {
    position: 'sticky',
    top: '110px',
    padding: '24px',
  },
  filterHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '20px',
    borderBottom: '1px solid var(--glass-border)',
    paddingBottom: '12px',
  },
  filterTitle: {
    fontSize: '1.2rem',
    marginLeft: '10px',
    flex: 1,
  },
  clearBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: '0.85rem',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    '&:hover': {
      color: 'var(--error)',
    }
  },
  filterForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    color: 'var(--text-muted)',
  },
  formInputWithIcon: {
    paddingLeft: '36px',
  },
  applyFiltersBtn: {
    width: '100%',
    marginTop: '10px',
  },
  listingsArea: {
    flex: 1,
  },
  loadingContainer: {
    textAlign: 'center',
    padding: '60px 0',
  },
  emptyCard: {
    textAlign: 'center',
    padding: '60px 40px',
  },
  jobsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '20px',
  },
};

export default Jobs;

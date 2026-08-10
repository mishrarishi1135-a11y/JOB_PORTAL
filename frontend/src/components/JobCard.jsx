import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, DollarSign, Clock, Building2, Bookmark } from 'lucide-react';

const JobCard = ({ job, isSaved, onSaveToggle, hideSaveBtn }) => {
  const { title, company, location, salaryRange, jobType, skills, _id } = job;
  
  return (
    <div className="glass-card" style={styles.card}>
      <div style={styles.header}>
        {/* Company Logo Description or Image */}
        <div style={styles.logoContainer}>
          {company?.logoUrl ? (
            <img src={company.logoUrl} alt={company.name} style={styles.logo} />
          ) : (
            <Building2 size={24} color="var(--text-muted)" />
          )}
        </div>

        {/* Title & Company info */}
        <div style={styles.titleArea}>
          <Link to={`/jobs/${_id}`} style={styles.titleLink}>
            <h3 style={styles.title}>{title}</h3>
          </Link>
          <span style={styles.companyName}>{company?.name || 'Verified Employer'}</span>
        </div>

        {/* Save Toggle button */}
        {!hideSaveBtn && onSaveToggle && (
          <button 
            onClick={() => onSaveToggle(_id)} 
            style={isSaved ? styles.saveBtnActive : styles.saveBtn}
            title={isSaved ? 'Unsave Job' : 'Save Job'}
          >
            <Bookmark size={18} fill={isSaved ? 'var(--accent-primary)' : 'transparent'} />
          </button>
        )}
      </div>

      {/* Meta tags (location, salary, type) */}
      <div style={styles.metaRow}>
        <div style={styles.metaItem}>
          <MapPin size={16} color="var(--text-muted)" />
          <span>{location}</span>
        </div>
        {salaryRange && (
          <div style={styles.metaItem}>
            <DollarSign size={16} color="var(--text-muted)" />
            <span>{salaryRange}</span>
          </div>
        )}
        <div style={styles.metaItem}>
          <Clock size={16} color="var(--text-muted)" />
          <span className="badge badge-type">{jobType}</span>
        </div>
      </div>

      {/* Skills */}
      {skills && skills.length > 0 && (
        <div style={styles.skillsRow}>
          {skills.map((skill, idx) => (
            <span key={idx} style={styles.skillBadge}>
              {skill}
            </span>
          ))}
        </div>
      )}

      {/* Action footer */}
      <div style={styles.footer}>
        <Link to={`/jobs/${_id}`} className="btn btn-secondary" style={styles.viewBtn}>
          View Details
        </Link>
      </div>
    </div>
  );
};

const styles = {
  card: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: '16px',
    height: '100%',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    position: 'relative',
  },
  logoContainer: {
    width: '48px',
    height: '48px',
    borderRadius: 'var(--radius-md)',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--glass-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  logo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  titleArea: {
    flex: 1,
    paddingRight: '28px', // space for bookmark button
  },
  titleLink: {
    '&:hover': {
      color: 'var(--accent-primary)',
    }
  },
  title: {
    fontSize: '1.15rem',
    fontWeight: '700',
    lineHeight: '1.3',
    color: 'var(--text-primary)',
    margin: 0,
  },
  companyName: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    fontWeight: '500',
    marginTop: '2px',
    display: 'inline-block',
  },
  saveBtn: {
    position: 'absolute',
    right: 0,
    top: 0,
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: 'var(--radius-sm)',
    transition: 'color var(--transition-fast), background var(--transition-fast)',
    '&:hover': {
      color: 'var(--accent-primary)',
      background: 'rgba(255, 255, 255, 0.05)',
    }
  },
  saveBtnActive: {
    position: 'absolute',
    right: 0,
    top: 0,
    background: 'transparent',
    border: 'none',
    color: 'var(--accent-primary)',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: 'var(--radius-sm)',
    transition: 'color var(--transition-fast)',
  },
  metaRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    fontSize: '0.88rem',
    color: 'var(--text-secondary)',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  skillsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  skillBadge: {
    fontSize: '0.75rem',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--glass-border)',
    color: 'var(--text-secondary)',
    padding: '4px 10px',
    borderRadius: 'var(--radius-sm)',
  },
  footer: {
    borderTop: '1px solid var(--glass-border)',
    paddingTop: '12px',
    marginTop: 'auto',
  },
  viewBtn: {
    width: '100%',
    padding: '10px 16px',
    fontSize: '0.88rem',
  }
};

export default JobCard;

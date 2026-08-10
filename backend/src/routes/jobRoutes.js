const express = require('express');
const router = express.Router();
const { createJob, getJobs, getJobById, updateJob, deleteJob, getRecruiterJobs } = require('../controllers/jobController');
const { requireAuth, requireRole } = require('../middleware/auth');

// Base route: /api/jobs
router.get('/', getJobs);
router.get('/recruiter/my-posts', requireAuth, requireRole('recruiter'), getRecruiterJobs);
router.get('/:id', getJobById);

router.post('/', requireAuth, requireRole('recruiter'), createJob);
router.put('/:id', requireAuth, requireRole('recruiter'), updateJob);
router.delete('/:id', requireAuth, requireRole('recruiter'), deleteJob);

module.exports = router;

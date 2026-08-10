const express = require('express');
const router = express.Router();
const { applyToJob, getSeekerApplications, getJobApplicants, updateApplicationStatus } = require('../controllers/applicationController');
const { requireAuth, requireRole } = require('../middleware/auth');

// Base route: /api/applications
router.post('/:jobId', requireAuth, requireRole('seeker'), applyToJob);
router.get('/seeker/my-applications', requireAuth, requireRole('seeker'), getSeekerApplications);
router.get('/job/:jobId', requireAuth, requireRole('recruiter'), getJobApplicants);
router.put('/:id/status', requireAuth, requireRole('recruiter'), updateApplicationStatus);

module.exports = router;

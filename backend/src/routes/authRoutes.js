const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, uploadUserResume, saveJob, unsaveJob } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Base route: /api/auth
router.get('/profile', requireAuth, getProfile);
router.put('/profile', requireAuth, updateProfile);
router.post('/profile/resume', requireAuth, upload, uploadUserResume);
router.post('/saved-jobs/:jobId', requireAuth, saveJob);
router.delete('/saved-jobs/:jobId', requireAuth, unsaveJob);

module.exports = router;

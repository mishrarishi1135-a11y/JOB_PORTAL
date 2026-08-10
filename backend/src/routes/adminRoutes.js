const express = require('express');
const router = express.Router();
const { getDashboardAnalytics, getAllUsers, updateUserRole, deleteUser, getAllJobsAdmin, toggleFakeJob } = require('../controllers/adminController');
const { requireAuth, requireRole } = require('../middleware/auth');

// Base route: /api/admin
router.use(requireAuth, requireRole('admin'));

router.get('/analytics', getDashboardAnalytics);
router.get('/users', getAllUsers);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

router.get('/jobs', getAllJobsAdmin);
router.put('/jobs/:id/flag', toggleFakeJob);

module.exports = router;

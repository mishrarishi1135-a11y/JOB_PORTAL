const express = require('express');
const router = express.Router();
const { createCompany, getRecruiterCompanies, getCompanyById, updateCompany } = require('../controllers/companyController');
const { requireAuth, requireRole } = require('../middleware/auth');

// Base route: /api/companies
router.post('/', requireAuth, requireRole('recruiter'), createCompany);
router.get('/my-companies', requireAuth, requireRole('recruiter'), getRecruiterCompanies);
router.get('/:id', getCompanyById);
router.put('/:id', requireAuth, requireRole('recruiter'), updateCompany);

module.exports = router;

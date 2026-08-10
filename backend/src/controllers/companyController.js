const Company = require('../models/Company');

// @desc    Register a new company profile
// @route   POST /api/companies
// @access  Private (Recruiter only)
const createCompany = async (req, res, next) => {
  try {
    const { name, logoUrl, website, description, location } = req.body;

    const companyExists = await Company.findOne({ name });
    if (companyExists) {
      return res.status(400).json({ message: 'Company with this name already exists' });
    }

    const company = await Company.create({
      name,
      logoUrl,
      website,
      description,
      location,
      createdBy: req.user.clerkId,
    });

    res.status(201).json(company);
  } catch (error) {
    next(error);
  }
};

// @desc    Get recruiter's companies
// @route   GET /api/companies/my-companies
// @access  Private (Recruiter only)
const getRecruiterCompanies = async (req, res, next) => {
  try {
    const companies = await Company.find({ createdBy: req.user.clerkId });
    res.json(companies);
  } catch (error) {
    next(error);
  }
};

// @desc    Get details of a single company
// @route   GET /api/companies/:id
// @access  Public
const getCompanyById = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    res.json(company);
  } catch (error) {
    next(error);
  }
};

// @desc    Update company details
// @route   PUT /api/companies/:id
// @access  Private (Recruiter only)
const updateCompany = async (req, res, next) => {
  try {
    const { name, logoUrl, website, description, location } = req.body;
    let company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Verify ownership
    if (company.createdBy !== req.user.clerkId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this company profile' });
    }

    company.name = name || company.name;
    company.logoUrl = logoUrl || company.logoUrl;
    company.website = website || company.website;
    company.description = description || company.description;
    company.location = location || company.location;

    const updatedCompany = await company.save();
    res.json(updatedCompany);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCompany,
  getRecruiterCompanies,
  getCompanyById,
  updateCompany,
};

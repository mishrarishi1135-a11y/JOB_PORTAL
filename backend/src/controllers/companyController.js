const prisma = require('../config/prisma');

const formatCompanyResponse = (company) => {
  if (!company) return null;
  return {
    ...company,
    _id: company.id,
    id: company.id
  };
};

const createCompany = async (req, res, next) => {
  try {
    const { name, logoUrl, website, description, location } = req.body;

    const companyExists = await prisma.company.findUnique({
      where: { name }
    });
    
    if (companyExists) {
      return res.status(400).json({ message: 'Company with this name already exists' });
    }

    const company = await prisma.company.create({
      data: {
        name,
        logoUrl: logoUrl || '',
        website: website || '',
        description: description || '',
        location: location || '',
        createdBy: req.user.clerkId,
      }
    });

    res.status(201).json(formatCompanyResponse(company));
  } catch (error) {
    next(error);
  }
};

const getRecruiterCompanies = async (req, res, next) => {
  try {
    const companies = await prisma.company.findMany({
      where: { createdBy: req.user.clerkId }
    });
    res.json(companies.map(formatCompanyResponse));
  } catch (error) {
    next(error);
  }
};

const getCompanyById = async (req, res, next) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.params.id }
    });
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    res.json(formatCompanyResponse(company));
  } catch (error) {
    next(error);
  }
};

const updateCompany = async (req, res, next) => {
  try {
    const { name, logoUrl, website, description, location } = req.body;
    let company = await prisma.company.findUnique({
      where: { id: req.params.id }
    });

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Verify ownership
    if (company.createdBy !== req.user.clerkId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this company profile' });
    }

    const updatedCompany = await prisma.company.update({
      where: { id: req.params.id },
      data: {
        name: name || company.name,
        logoUrl: logoUrl !== undefined ? logoUrl : company.logoUrl,
        website: website !== undefined ? website : company.website,
        description: description !== undefined ? description : company.description,
        location: location !== undefined ? location : company.location,
      }
    });

    res.json(formatCompanyResponse(updatedCompany));
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

const prisma = require('../config/prisma');

const formatJobResponse = (job) => {
  if (!job) return null;
  return {
    ...job,
    _id: job.id,
    id: job.id,
    company: job.company ? {
      ...job.company,
      _id: job.company.id,
      id: job.company.id
    } : null
  };
};

const createJob = async (req, res, next) => {
  try {
    const { title, description, requirements, skills, location, salaryRange, jobType, companyId } = req.body;

    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    if (company.createdBy !== req.user.clerkId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You are not authorized to post a job for this company' });
    }

    const job = await prisma.job.create({
      data: {
        title,
        description,
        requirements: Array.isArray(requirements) ? requirements : requirements.split(',').map(r => r.trim()).filter(Boolean),
        skills: Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim()).filter(Boolean),
        location,
        salaryRange: salaryRange || '',
        jobType: jobType || 'Full-time',
        companyId,
        recruiterId: req.user.clerkId,
      },
      include: {
        company: true
      }
    });

    res.status(201).json(formatJobResponse(job));
  } catch (error) {
    next(error);
  }
};

const getJobs = async (req, res, next) => {
  try {
    const { search, location, jobType, skills } = req.query;

    const where = { isFake: false };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    if (jobType) {
      where.jobType = jobType;
    }

    if (skills) {
      const skillsList = skills.split(',').map(s => s.trim()).filter(Boolean);
      if (skillsList.length > 0) {
        where.skills = { hasSome: skillsList };
      }
    }

    const jobs = await prisma.job.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            location: true,
            website: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(jobs.map(formatJobResponse));
  } catch (error) {
    next(error);
  }
};

const getJobById = async (req, res, next) => {
  try {
    const job = await prisma.job.findUnique({
      where: { id: req.params.id },
      include: {
        company: true
      }
    });
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Increment views counter
    const updatedJob = await prisma.job.update({
      where: { id: req.params.id },
      data: {
        views: {
          increment: 1
        }
      },
      include: {
        company: true
      }
    });

    res.json(formatJobResponse(updatedJob));
  } catch (error) {
    next(error);
  }
};

const updateJob = async (req, res, next) => {
  try {
    const { title, description, requirements, skills, location, salaryRange, jobType } = req.body;
    let job = await prisma.job.findUnique({
      where: { id: req.params.id }
    });

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Verify ownership
    if (job.recruiterId !== req.user.clerkId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to edit this job post' });
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (location) updateData.location = location;
    if (salaryRange !== undefined) updateData.salaryRange = salaryRange;
    if (jobType) updateData.jobType = jobType;
    if (requirements) {
      updateData.requirements = Array.isArray(requirements) ? requirements : requirements.split(',').map(r => r.trim()).filter(Boolean);
    }
    if (skills) {
      updateData.skills = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim()).filter(Boolean);
    }

    const updatedJob = await prisma.job.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        company: true
      }
    });

    res.json(formatJobResponse(updatedJob));
  } catch (error) {
    next(error);
  }
};

const deleteJob = async (req, res, next) => {
  try {
    const job = await prisma.job.findUnique({
      where: { id: req.params.id }
    });

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Verify ownership
    if (job.recruiterId !== req.user.clerkId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this job post' });
    }

    await prisma.job.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Job post deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const getRecruiterJobs = async (req, res, next) => {
  try {
    const jobs = await prisma.job.findMany({
      where: { recruiterId: req.user.clerkId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(jobs.map(formatJobResponse));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  getRecruiterJobs,
};

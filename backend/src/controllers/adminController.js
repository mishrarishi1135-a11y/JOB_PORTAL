const prisma = require('../config/prisma');

const formatUserResponse = (user) => {
  if (!user) return null;
  return {
    _id: user.id,
    id: user.id,
    clerkId: user.clerkId,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    profile: {
      bio: user.bio,
      contactNumber: user.contactNumber,
      skills: user.skills,
      experience: user.experience,
      education: user.education,
      resumeUrl: user.resumeUrl,
      resumeOriginalName: user.resumeOriginalName,
    }
  };
};

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

const getDashboardAnalytics = async (req, res, next) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalSeekers = await prisma.user.count({ where: { role: 'seeker' } });
    const totalRecruiters = await prisma.user.count({ where: { role: 'recruiter' } });
    const totalAdmins = await prisma.user.count({ where: { role: 'admin' } });

    const totalJobs = await prisma.job.count();
    const activeJobs = await prisma.job.count({ where: { isFake: false } });
    const flaggedJobs = await prisma.job.count({ where: { isFake: true } });

    const totalApplications = await prisma.application.count();

    const applicationsByStatus = await prisma.application.groupBy({
      by: ['status'],
      _count: {
        _all: true
      }
    });

    const jobsByType = await prisma.job.groupBy({
      by: ['jobType'],
      _count: {
        _all: true
      }
    });

    res.json({
      metrics: {
        totalUsers,
        totalSeekers,
        totalRecruiters,
        totalAdmins,
        totalJobs,
        activeJobs,
        flaggedJobs,
        totalApplications,
      },
      analytics: {
        applicationsByStatus: applicationsByStatus.reduce((acc, curr) => {
          acc[curr.status] = curr._count._all;
          return acc;
        }, {}),
        jobsByType: jobsByType.reduce((acc, curr) => {
          acc[curr.jobType] = curr._count._all;
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(users.map(formatUserResponse));
  } catch (error) {
    next(error);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['seeker', 'recruiter', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role value' });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role }
    });

    res.json({ message: `User role updated to ${role}`, user: formatUserResponse(updatedUser) });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete associated applications and jobs if recruiter/seeker
    if (user.role === 'recruiter') {
      await prisma.job.deleteMany({ where: { recruiterId: user.clerkId } });
      await prisma.company.deleteMany({ where: { createdBy: user.clerkId } });
    } else if (user.role === 'seeker') {
      await prisma.application.deleteMany({ where: { clerkApplicantId: user.clerkId } });
    }

    await prisma.user.delete({ where: { id } });
    res.json({ message: 'User and all related data deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const getAllJobsAdmin = async (req, res, next) => {
  try {
    const jobs = await prisma.job.findMany({
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(jobs.map(formatJobResponse));
  } catch (error) {
    next(error);
  }
};

const toggleFakeJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    const job = await prisma.job.findUnique({ where: { id } });

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const updatedJob = await prisma.job.update({
      where: { id },
      data: { isFake: !job.isFake },
      include: {
        company: true
      }
    });

    res.json({ message: `Job marked as ${updatedJob.isFake ? 'FAKE' : 'VERIFIED'}`, job: formatJobResponse(updatedJob) });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardAnalytics,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getAllJobsAdmin,
  toggleFakeJob,
};

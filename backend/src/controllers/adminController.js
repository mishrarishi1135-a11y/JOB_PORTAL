const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Company = require('../models/Company');

// @desc    Get dashboard metrics & analytics
// @route   GET /api/admin/analytics
// @access  Private (Admin only)
const getDashboardAnalytics = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalSeekers = await User.countDocuments({ role: 'seeker' });
    const totalRecruiters = await User.countDocuments({ role: 'recruiter' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });

    const totalJobs = await Job.countDocuments();
    const activeJobs = await Job.countDocuments({ isFake: false });
    const flaggedJobs = await Job.countDocuments({ isFake: true });

    const totalApplications = await Application.countDocuments();
    const applicationsByStatus = await Application.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const jobsByType = await Job.aggregate([
      { $group: { _id: '$jobType', count: { $sum: 1 } } },
    ]);

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
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        jobsByType: jobsByType.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users list
// @route   GET /api/admin/users
// @access  Private (Admin only)
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a user's role
// @route   PUT /api/admin/users/:id/role
// @access  Private (Admin only)
const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['seeker', 'recruiter', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role value' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    await user.save();

    res.json({ message: `User role updated to ${role}`, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete associated applications and jobs if recruiter
    if (user.role === 'recruiter') {
      await Job.deleteMany({ recruiterId: user.clerkId });
      await Company.deleteMany({ createdBy: user.clerkId });
    } else if (user.role === 'seeker') {
      await Application.deleteMany({ applicantId: user.clerkId });
    }

    await user.deleteOne();
    res.json({ message: 'User and all related data deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all jobs (including flagged ones)
// @route   GET /api/admin/jobs
// @access  Private (Admin only)
const getAllJobsAdmin = async (req, res, next) => {
  try {
    const jobs = await Job.find({})
      .populate('company', 'name logoUrl')
      .sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle fake job flag status
// @route   PUT /api/admin/jobs/:id/flag
// @access  Private (Admin only)
const toggleFakeJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    const job = await Job.findById(id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    job.isFake = !job.isFake;
    await job.save();

    res.json({ message: `Job marked as ${job.isFake ? 'FAKE' : 'VERIFIED'}`, job });
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

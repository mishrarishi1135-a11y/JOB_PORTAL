const Job = require('../models/Job');
const Company = require('../models/Company');

// @desc    Create a new job post
// @route   POST /api/jobs
// @access  Private (Recruiter only)
const createJob = async (req, res, next) => {
  try {
    const { title, description, requirements, skills, location, salaryRange, jobType, companyId } = req.body;

    // Verify company exists and belongs to the recruiter
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    if (company.createdBy !== req.user.clerkId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You are not authorized to post a job for this company' });
    }

    const job = await Job.create({
      title,
      description,
      requirements: Array.isArray(requirements) ? requirements : requirements.split(',').map(r => r.trim()).filter(Boolean),
      skills: Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim()).filter(Boolean),
      location,
      salaryRange,
      jobType,
      company: companyId,
      recruiterId: req.user.clerkId,
    });

    res.status(201).json(job);
  } catch (error) {
    next(error);
  }
};

// @desc    Get jobs with filters
// @route   GET /api/jobs
// @access  Public
const getJobs = async (req, res, next) => {
  try {
    const { search, location, jobType, skills, minSalary } = req.query;

    const query = { isFake: false }; // Don't show fake jobs

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    if (jobType) {
      query.jobType = jobType;
    }

    if (skills) {
      const skillsList = skills.split(',').map(s => s.trim());
      query.skills = { $in: skillsList.map(s => new RegExp(s, 'i')) };
    }

    // A simple regex match for salary if it is text, or numerical logic.
    // For this portal, since salary range is string (e.g. "$80,000 - $100,000"), we can do simple text matches
    // or return all and let the client handle filtering. Let's do basic filter options.

    const jobs = await Job.find(query)
      .populate('company', 'name logoUrl location website')
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (error) {
    next(error);
  }
};

// @desc    Get details of a single job
// @route   GET /api/jobs/:id
// @access  Public
const getJobById = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id).populate('company', 'name logoUrl description website location');
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Increment views counter
    job.views += 1;
    await job.save();

    res.json(job);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a job post
// @route   PUT /api/jobs/:id
// @access  Private (Recruiter only)
const updateJob = async (req, res, next) => {
  try {
    const { title, description, requirements, skills, location, salaryRange, jobType } = req.body;
    let job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Verify ownership
    if (job.recruiterId !== req.user.clerkId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to edit this job post' });
    }

    job.title = title || job.title;
    job.description = description || job.description;
    job.location = location || job.location;
    job.salaryRange = salaryRange || job.salaryRange;
    job.jobType = jobType || job.jobType;

    if (requirements) {
      job.requirements = Array.isArray(requirements) ? requirements : requirements.split(',').map(r => r.trim()).filter(Boolean);
    }
    if (skills) {
      job.skills = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim()).filter(Boolean);
    }

    const updatedJob = await job.save();
    res.json(updatedJob);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a job post
// @route   DELETE /api/jobs/:id
// @access  Private (Recruiter only)
const deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Verify ownership
    if (job.recruiterId !== req.user.clerkId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this job post' });
    }

    await job.deleteOne();
    res.json({ message: 'Job post deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get recruiter's posted jobs
// @route   GET /api/jobs/recruiter/my-posts
// @access  Private (Recruiter only)
const getRecruiterJobs = async (req, res, next) => {
  try {
    const jobs = await Job.find({ recruiterId: req.user.clerkId }).populate('company', 'name logoUrl');
    res.json(jobs);
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

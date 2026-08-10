const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');

// @desc    Apply for a job
// @route   POST /api/applications/:jobId
// @access  Private (Seeker only)
const applyToJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const { coverLetter, customResumeUrl, customResumeName } = req.body;

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Verify user profile resume exists
    const user = await User.findById(req.user.id);
    const resumeUrl = customResumeUrl || user.profile.resumeUrl;
    const resumeOriginalName = customResumeName || user.profile.resumeOriginalName;

    if (!resumeUrl) {
      return res.status(400).json({ message: 'Please upload a resume in your profile before applying' });
    }

    // Check if already applied
    const alreadyApplied = await Application.findOne({
      job: jobId,
      applicantId: req.user.clerkId,
    });

    if (alreadyApplied) {
      return res.status(400).json({ message: 'You have already applied to this job listing' });
    }

    const application = await Application.create({
      job: jobId,
      applicant: req.user.id,
      applicantId: req.user.clerkId,
      resumeUrl,
      resumeOriginalName,
      coverLetter,
    });

    res.status(201).json(application);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already applied to this job listing' });
    }
    next(error);
  }
};

// @desc    Get seeker's applications
// @route   GET /api/applications/seeker/my-applications
// @access  Private (Seeker only)
const getSeekerApplications = async (req, res, next) => {
  try {
    const applications = await Application.find({ applicantId: req.user.clerkId })
      .populate({
        path: 'job',
        populate: {
          path: 'company',
          select: 'name logoUrl location',
        },
      })
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (error) {
    next(error);
  }
};

// @desc    Get applicants for a specific job
// @route   GET /api/applications/job/:jobId
// @access  Private (Recruiter only)
const getJobApplicants = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    
    // Verify job belongs to recruiter
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.recruiterId !== req.user.clerkId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view applicants for this job' });
    }

    const applications = await Application.find({ job: jobId })
      .populate('applicant', 'name email profile')
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (error) {
    next(error);
  }
};

// @desc    Update application status
// @route   PUT /api/applications/:id/status
// @access  Private (Recruiter only)
const updateApplicationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Applied', 'Shortlisted', 'Interviewing', 'Accepted', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const application = await Application.findById(id).populate('job');
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Verify that the logged-in user owns the job for this application
    if (application.job.recruiterId !== req.user.clerkId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update application status' });
    }

    application.status = status;
    await application.save();

    res.json({ message: `Application status updated to ${status}`, application });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  applyToJob,
  getSeekerApplications,
  getJobApplicants,
  updateApplicationStatus,
};

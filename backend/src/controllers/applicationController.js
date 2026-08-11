const prisma = require('../config/prisma');

const formatApplicationResponse = (app) => {
  if (!app) return null;
  return {
    ...app,
    _id: app.id,
    id: app.id,
    job: app.job ? {
      ...app.job,
      _id: app.job.id,
      id: app.job.id,
      company: app.job.company ? {
        ...app.job.company,
        _id: app.job.company.id,
        id: app.job.company.id
      } : null
    } : null,
    applicant: app.applicant ? {
      ...app.applicant,
      _id: app.applicant.id,
      id: app.applicant.id,
      profile: {
        bio: app.applicant.bio,
        contactNumber: app.applicant.contactNumber,
        skills: app.applicant.skills,
        experience: app.applicant.experience,
        education: app.applicant.education,
        resumeUrl: app.applicant.resumeUrl,
        resumeOriginalName: app.applicant.resumeOriginalName
      }
    } : null
  };
};

const applyToJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const { coverLetter, customResumeUrl, customResumeName } = req.body;

    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });
    const resumeUrl = customResumeUrl || user.resumeUrl;
    const resumeOriginalName = customResumeName || user.resumeOriginalName;

    if (!resumeUrl) {
      return res.status(400).json({ message: 'Please upload a resume in your profile before applying' });
    }

    // Check if already applied
    const alreadyApplied = await prisma.application.findUnique({
      where: {
        jobId_clerkApplicantId: {
          jobId: jobId,
          clerkApplicantId: req.user.clerkId
        }
      }
    });

    if (alreadyApplied) {
      return res.status(400).json({ message: 'You have already applied to this job listing' });
    }

    const application = await prisma.application.create({
      data: {
        jobId: jobId,
        applicantId: req.user.id,
        clerkApplicantId: req.user.clerkId,
        resumeUrl,
        resumeOriginalName,
        coverLetter: coverLetter || '',
      }
    });

    res.status(201).json(formatApplicationResponse(application));
  } catch (error) {
    next(error);
  }
};

const getSeekerApplications = async (req, res, next) => {
  try {
    const applications = await prisma.application.findMany({
      where: { clerkApplicantId: req.user.clerkId },
      include: {
        job: {
          include: {
            company: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(applications.map(formatApplicationResponse));
  } catch (error) {
    next(error);
  }
};

const getJobApplicants = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    
    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.recruiterId !== req.user.clerkId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view applicants for this job' });
    }

    const applications = await prisma.application.findMany({
      where: { jobId: jobId },
      include: {
        applicant: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(applications.map(formatApplicationResponse));
  } catch (error) {
    next(error);
  }
};

const updateApplicationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Applied', 'Shortlisted', 'Interviewing', 'Accepted', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        job: true
      }
    });
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Verify ownership
    if (application.job.recruiterId !== req.user.clerkId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update application status' });
    }

    const updatedApplication = await prisma.application.update({
      where: { id },
      data: { status },
      include: {
        job: {
          include: {
            company: true
          }
        }
      }
    });

    res.json({ 
      message: `Application status updated to ${status}`, 
      application: formatApplicationResponse(updatedApplication) 
    });
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

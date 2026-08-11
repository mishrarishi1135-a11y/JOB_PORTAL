const prisma = require('../config/prisma');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// Helper to format User to match MongoDB shape (especially the profile field)
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
    },
    savedJobs: user.savedJobs ? user.savedJobs.map(sj => {
      const job = sj.job;
      if (job) {
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
      }
      return null;
    }).filter(Boolean) : []
  };
};

const getProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        savedJobs: {
          include: {
            job: {
              include: {
                company: true
              }
            }
          }
        }
      }
    });
    if (!user) {
      return res.status(404).json({ message: 'User profile not found' });
    }
    res.json(formatUserResponse(user));
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, bio, contactNumber, skills, experience, education, role } = req.body;
    
    // Format list attributes
    let formattedSkills = undefined;
    if (skills) {
      formattedSkills = Array.isArray(skills) 
        ? skills 
        : skills.split(',').map((skill) => skill.trim()).filter(Boolean);
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (contactNumber !== undefined) updateData.contactNumber = contactNumber;
    if (role && ['seeker', 'recruiter'].includes(role)) updateData.role = role;
    if (formattedSkills !== undefined) updateData.skills = formattedSkills;
    if (experience !== undefined) updateData.experience = experience;
    if (education !== undefined) updateData.education = education;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      include: {
        savedJobs: {
          include: {
            job: {
              include: {
                company: true
              }
            }
          }
        }
      }
    });

    res.json(formatUserResponse(updatedUser));
  } catch (error) {
    next(error);
  }
};

const uploadUserResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a PDF file' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete old resume file if exists
    if (user.resumeUrl) {
      if (user.resumeUrl.includes('/storage/v1/object/public/resumes/')) {
        try {
          const segments = user.resumeUrl.split('/');
          const fileName = segments[segments.length - 1];
          if (fileName && supabase) {
            await supabase.storage.from('resumes').remove([fileName]);
          } else if (fileName && !supabase) {
            console.warn('Supabase client not initialized, skipping file deletion from storage.');
          }
        } catch (err) {
          console.error('Error deleting old resume from Supabase:', err.message);
        }
      } else {
        const oldPath = path.join(__dirname, '../../', user.resumeUrl);
        if (fs.existsSync(oldPath)) {
          try {
            fs.unlinkSync(oldPath);
          } catch (err) {
            console.error('Error deleting old resume:', err.message);
          }
        }
      }
    }

    // Save URL of the uploaded resume
    const fileUrl = req.file.supabaseUrl;
    
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        resumeUrl: fileUrl,
        resumeOriginalName: req.file.originalname
      }
    });

    res.json({
      message: 'Resume uploaded successfully',
      resumeUrl: fileUrl,
      resumeOriginalName: req.file.originalname,
    });
  } catch (error) {
    next(error);
  }
};

const saveJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    
    // Check if relation already exists
    const exists = await prisma.userSavedJob.findUnique({
      where: {
        userId_jobId: {
          userId: req.user.id,
          jobId: jobId
        }
      }
    });

    if (exists) {
      return res.status(400).json({ message: 'Job already saved' });
    }

    await prisma.userSavedJob.create({
      data: {
        userId: req.user.id,
        jobId: jobId
      }
    });

    // Fetch updated list of saved jobs
    const savedJobsList = await prisma.userSavedJob.findMany({
      where: { userId: req.user.id },
      select: { jobId: true }
    });

    res.json({ 
      message: 'Job saved successfully', 
      savedJobs: savedJobsList.map(sj => sj.jobId) 
    });
  } catch (error) {
    next(error);
  }
};

const unsaveJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    await prisma.userSavedJob.delete({
      where: {
        userId_jobId: {
          userId: req.user.id,
          jobId: jobId
        }
      }
    });

    // Fetch updated list of saved jobs
    const savedJobsList = await prisma.userSavedJob.findMany({
      where: { userId: req.user.id },
      select: { jobId: true }
    });

    res.json({ 
      message: 'Job unsaved successfully', 
      savedJobs: savedJobsList.map(sj => sj.jobId) 
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadUserResume,
  saveJob,
  unsaveJob,
};

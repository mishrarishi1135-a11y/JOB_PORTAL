const User = require('../models/User');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// @desc    Get logged in user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('savedJobs');
    if (!user) {
      return res.status(404).json({ message: 'User profile not found' });
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile details
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, bio, contactNumber, skills, experience, education, role } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update basic fields
    if (name) user.name = name;
    if (bio !== undefined) user.profile.bio = bio;
    if (contactNumber !== undefined) user.profile.contactNumber = contactNumber;
    
    // Only allow updating roles to 'seeker' or 'recruiter' (admin requires database authorization)
    if (role && ['seeker', 'recruiter'].includes(role)) {
      user.role = role;
    }

    // Format list attributes
    if (skills) {
      user.profile.skills = Array.isArray(skills) 
        ? skills 
        : skills.split(',').map((skill) => skill.trim()).filter(Boolean);
    }
    if (experience) user.profile.experience = experience;
    if (education) user.profile.education = education;

    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
};

// @desc    Upload resume (PDF format)
// @route   POST /api/auth/profile/resume
// @access  Private
const uploadUserResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a PDF file' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete old resume file if exists
    if (user.profile.resumeUrl) {
      if (user.profile.resumeUrl.includes('/storage/v1/object/public/resumes/')) {
        try {
          const segments = user.profile.resumeUrl.split('/');
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
        const oldPath = path.join(__dirname, '../../', user.profile.resumeUrl);
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
    user.profile.resumeUrl = fileUrl;
    user.profile.resumeOriginalName = req.file.originalname;

    await user.save();
    res.json({
      message: 'Resume uploaded successfully',
      resumeUrl: fileUrl,
      resumeOriginalName: req.file.originalname,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bookmark / Save a job listing
// @route   POST /api/auth/saved-jobs/:jobId
// @access  Private
const saveJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.savedJobs.includes(jobId)) {
      return res.status(400).json({ message: 'Job already saved' });
    }

    user.savedJobs.push(jobId);
    await user.save();

    res.json({ message: 'Job saved successfully', savedJobs: user.savedJobs });
  } catch (error) {
    next(error);
  }
};

// @desc    Unsave a bookmarked job
// @route   DELETE /api/auth/saved-jobs/:jobId
// @access  Private
const unsaveJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.savedJobs = user.savedJobs.filter((id) => id.toString() !== jobId);
    await user.save();

    res.json({ message: 'Job unsaved successfully', savedJobs: user.savedJobs });
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

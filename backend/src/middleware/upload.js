const multer = require('multer');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || ''; // Can be service_role or anon key
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// Use memory storage for Multer
const storage = multer.memoryStorage();

// File filter (only allow PDF)
const fileFilter = (req, file, cb) => {
  const filetypes = /pdf/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Only PDF documents are allowed for resume upload.'));
};

const uploadMulter = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter: fileFilter,
}).single('resume');

// Wrapper middleware to upload to Supabase Storage
const uploadResume = (req, res, next) => {
  uploadMulter(req, res, async (err) => {
    if (err) {
      return next(err);
    }
    
    if (!req.file) {
      return next(); // Proceed, controller will handle missing file
    }

    try {
      // If Supabase keys are not set, fall back or throw error
      if (!supabaseUrl || !supabaseKey) {
        return next(new Error('Storage configuration missing. SUPABASE_URL and SUPABASE_KEY must be set.'));
      }

      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const fileName = `${uniqueSuffix}-${req.file.originalname}`;
      
      // Upload to Supabase Bucket (e.g. 'resumes')
      const { data, error } = await supabase.storage
        .from('resumes')
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Supabase upload error:', error.message);
        return next(new Error(`Failed to upload resume to storage: ${error.message}`));
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(fileName);

      // Attach public URL and key to req.file
      req.file.supabaseUrl = publicUrl;
      req.file.supabaseKey = fileName;
      
      next();
    } catch (uploadError) {
      next(uploadError);
    }
  });
};

module.exports = uploadResume;

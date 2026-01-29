import multer from 'multer';
import path from 'path';
import fs from 'fs';
import config from '../config/index.js';

// Ensure uploads directory exists
if (!fs.existsSync(config.uploadsDir)) {
  fs.mkdirSync(config.uploadsDir, { recursive: true });
}

/**
 * Configure multer storage
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tenantUploadDir = path.join(config.uploadsDir, req.tenantId.toString());
    
    if (!fs.existsSync(tenantUploadDir)) {
      fs.mkdirSync(tenantUploadDir, { recursive: true });
    }
    
    cb(null, tenantUploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-userid-random.ext
    const timestamp = Date.now();
    const userId = req.user._id.toString().slice(-6);
    const random = Math.random().toString(36).substring(7);
    const ext = path.extname(file.originalname);
    const filename = `${timestamp}-${userId}-${random}${ext}`;
    cb(null, filename);
  },
});

/**
 * File filter for video uploads
 */
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase().slice(1);
  
  if (!config.allowedVideoFormats.includes(ext)) {
    return cb(new Error(`Invalid file format. Allowed: ${config.allowedVideoFormats.join(', ')}`));
  }

  cb(null, true);
};

/**
 * Create multer upload middleware
 */
export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.maxFileSize,
  },
});

export default uploadMiddleware;

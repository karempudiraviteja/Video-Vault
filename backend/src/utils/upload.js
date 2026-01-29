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
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

/**
 * Configure multer storage with Cloudinary
 */
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'video-vault',
    resource_type: 'video',
    allowed_formats: config.allowedVideoFormats,
    public_id: (req, file) => {
      const timestamp = Date.now();
      const userId = req.user._id.toString().slice(-6);
      const random = Math.random().toString(36).substring(7);
      return `${timestamp}-${userId}-${random}`;
    },
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

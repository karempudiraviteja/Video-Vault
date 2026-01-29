import express from 'express';
import { body } from 'express-validator';
import * as videoController from '../controllers/videoController.js';
import * as streamingController from '../controllers/streamingController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validation.js';
import { uploadMiddleware } from '../utils/upload.js';

const router = express.Router();

// All video routes require authentication
router.use(authenticate);

/**
 * POST /api/v1/videos/upload
 * Upload a video
 */
router.post(
  '/upload',
  authorize('editor', 'admin'),
  uploadMiddleware.single('video'),
  [
    body('description').optional().trim(),
    body('tags').optional().trim(),
    body('isPublic').optional(),
  ],
  handleValidationErrors,
  videoController.uploadVideo
);

/**
 * GET /api/v1/videos
 * Get all videos for user with filters
 */
router.get('/', videoController.getUserVideos);

/**
 * GET /api/v1/videos/:videoId
 * Get video by ID
 */
router.get('/:videoId', videoController.getVideoById);

/**
 * PUT /api/v1/videos/:videoId
 * Update video metadata
 */
router.put(
  '/:videoId',
  [
    body('description').optional().trim(),
    body('tags').optional().trim(),
    body('isPublic').optional().isBoolean(),
  ],
  handleValidationErrors,
  videoController.updateVideo
);

/**
 * DELETE /api/v1/videos/:videoId
 * Delete video
 */
router.delete('/:videoId', videoController.deleteVideo);

/**
 * GET /api/v1/videos/:videoId/stream
 * Stream video with range request support
 * Supports token in Authorization header or ?token= query parameter
 */
router.get('/:videoId/stream', authenticate, streamingController.streamVideo);

/**
 * GET /api/v1/videos/:videoId/status
 * Get video processing status
 */
router.get('/:videoId/status', streamingController.getVideoStatus);

export default router;

import Video from '../models/Video.js';
import VideoService from '../services/VideoService.js';
import { getVideoMetadata } from '../utils/ffmpeg.js';
import { analyzeSensitivity } from '../utils/sensitivity.js';

/**
 * Upload video
 * POST /api/v1/videos/upload
 */
export const uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const { description, tags, isPublic } = req.body;

    // Create video record
    let video = await VideoService.createVideoRecord(
      req.file,
      req.user._id,
      req.tenantId
    );

    // Extract metadata
    video = await VideoService.extractMetadata(video._id, req.file.path);

    // Update with optional fields
    if (description) video.description = description;
    if (tags) video.tags = tags.split(',').map(t => t.trim());
    if (isPublic) video.isPublic = isPublic === 'true';

    await video.save();

    // Emit socket event for real-time update
    if (req.io) {
      req.io.to(`tenant-${req.tenantId}`).emit('upload_started', {
        videoId: video._id,
        filename: video.originalName,
      });
    }

    // Start processing in background (non-blocking)
    processVideoAsync(video._id, req.file.path, req.tenantId, req.io);

    res.status(201).json({
      message: 'Video uploaded successfully',
      video: video.toObject(),
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Upload failed' });
  }
};

/**
 * Async video processing (runs in background)
 */
async function processVideoAsync(videoId, filePath, tenantId, io) {
  try {
    // Step 1: Update status to processing
    await Video.findByIdAndUpdate(videoId, { processingStatus: 'processing' });

    if (io) {
      io.to(`tenant-${tenantId}`).emit('processing_started', { videoId });
    }

    // Step 2: Sensitivity analysis
    const analysis = await VideoService.analyzeSensitivityForVideo(videoId, filePath);

    if (io) {
      io.to(`tenant-${tenantId}`).emit('processing_progress', {
        videoId,
        progress: 75,
        message: 'Sensitivity analysis complete',
      });
    }

    // Step 3: Mark as completed
    const completedVideo = await VideoService.markProcessingComplete(videoId);

    if (io) {
      io.to(`tenant-${tenantId}`).emit('processing_completed', {
        videoId,
        video: completedVideo,
        sensitivityStatus: completedVideo.sensitivityStatus,
      });
    }

    console.log(`✅ Video ${videoId} processing completed`);
  } catch (error) {
    console.error(`❌ Video processing failed for ${videoId}:`, error);
    
    await VideoService.markProcessingFailed(videoId, error);

    if (io) {
      io.to(`tenant-${tenantId}`).emit('processing_failed', {
        videoId,
        error: error.message,
      });
    }
  }
}

/**
 * Get all videos for user
 * GET /api/v1/videos
 */
export const getUserVideos = async (req, res) => {
  try {
    const {
      sensitivityStatus,
      processingStatus,
      minSize,
      maxSize,
      startDate,
      endDate,
      sortBy,
      limit = 50,
      skip = 0,
    } = req.query;

    const filters = {
      sensitivityStatus,
      processingStatus,
      minSize: minSize ? parseInt(minSize) : null,
      maxSize: maxSize ? parseInt(maxSize) : null,
      startDate,
      endDate,
      sortBy,
      limit: parseInt(limit),
      skip: parseInt(skip),
    };

    const { videos, total } = await VideoService.getUserVideos(
      req.user._id,
      req.tenantId,
      filters
    );

    res.json({
      videos,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
};

/**
 * Get video by ID
 * GET /api/v1/videos/:videoId
 */
export const getVideoById = async (req, res) => {
  try {
    const video = await VideoService.getVideoById(
      req.params.videoId,
      req.user._id,
      req.tenantId
    );

    res.json(video);
  } catch (error) {
    console.error('Get video error:', error);
    if (error.message === 'Video not found') {
      return res.status(404).json({ error: 'Video not found' });
    }
    if (error.message === 'Unauthorized') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    res.status(500).json({ error: 'Failed to fetch video' });
  }
};

/**
 * Update video metadata
 * PUT /api/v1/videos/:videoId
 */
export const updateVideo = async (req, res) => {
  try {
    const video = await VideoService.updateVideoMetadata(
      req.params.videoId,
      req.user._id,
      req.body
    );

    res.json({
      message: 'Video updated successfully',
      video,
    });
  } catch (error) {
    console.error('Update video error:', error);
    if (error.message === 'Video not found') {
      return res.status(404).json({ error: 'Video not found' });
    }
    if (error.message === 'Unauthorized') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    res.status(500).json({ error: 'Failed to update video' });
  }
};

/**
 * Delete video
 * DELETE /api/v1/videos/:videoId
 */
export const deleteVideo = async (req, res) => {
  try {
    const video = await VideoService.deleteVideo(
      req.params.videoId,
      req.user._id,
      req.tenantId
    );

    res.json({
      message: 'Video deleted successfully',
      video,
    });
  } catch (error) {
    console.error('Delete video error:', error);
    if (error.message === 'Video not found') {
      return res.status(404).json({ error: 'Video not found' });
    }
    if (error.message === 'Unauthorized') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    res.status(500).json({ error: 'Failed to delete video' });
  }
};

export default {
  uploadVideo,
  getUserVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
};

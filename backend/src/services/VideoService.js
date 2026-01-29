import Video from '../models/Video.js';
import Tenant from '../models/Tenant.js';
import { getVideoMetadata } from '../utils/ffmpeg.js';
import { analyzeSensitivity } from '../utils/sensitivity.js';
import path from 'path';
import fs from 'fs';
import config from '../config/index.js';

/**
 * Video Processing Service
 * Handles the complete video processing pipeline
 */
class VideoService {
  /**
   * Create video record
   */
  static async createVideoRecord(file, userId, tenantId) {
    try {
      const fileExtension = path.extname(file.originalname).toLowerCase().slice(1);
      
      const video = new Video({
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        fileExtension,
        filePath: file.path,
        ownerId: userId,
        tenantId,
        processingStatus: 'pending',
      });

      await video.save();
      return video;
    } catch (error) {
      console.error('Create video record error:', error);
      throw error;
    }
  }

  /**
   * Get video metadata and update record
   */
  static async extractMetadata(videoId, filePath) {
    try {
      const metadata = await getVideoMetadata(filePath);
      
      const video = await Video.findByIdAndUpdate(
        videoId,
        {
          duration: metadata.duration,
          width: metadata.width,
          height: metadata.height,
        },
        { new: true }
      );

      return video;
    } catch (error) {
      console.error('Extract metadata error:', error);
      throw error;
    }
  }

  /**
   * Run sensitivity analysis
   */
  static async analyzeSensitivityForVideo(videoId, filePath) {
    try {
      const video = await Video.findById(videoId);
      
      const analysis = await analyzeSensitivity(filePath, {
        duration: video.duration,
        size: video.size,
      });

      const sensitivityStatus = analysis.status === 'flagged' ? 'flagged' : 'safe';

      await Video.findByIdAndUpdate(
        videoId,
        {
          sensitivityStatus,
          sensitivityDetails: {
            score: analysis.score,
            reason: analysis.reason,
            flags: analysis.flags,
          },
        },
        { new: true }
      );

      return analysis;
    } catch (error) {
      console.error('Sensitivity analysis error:', error);
      throw error;
    }
  }

  /**
   * Update processing progress
   */
  static async updateProgress(videoId, progress) {
    try {
      await Video.findByIdAndUpdate(
        videoId,
        { processingProgress: progress },
        { new: true }
      );
    } catch (error) {
      console.error('Update progress error:', error);
    }
  }

  /**
   * Mark processing as completed
   */
  static async markProcessingComplete(videoId) {
    try {
      const video = await Video.findByIdAndUpdate(
        videoId,
        {
          processingStatus: 'completed',
          processingProgress: 100,
        },
        { new: true }
      );

      // Update tenant storage usage
      await Tenant.findByIdAndUpdate(
        video.tenantId,
        { $inc: { usedStorageGB: video.size / 1024 / 1024 / 1024 } }
      );

      return video;
    } catch (error) {
      console.error('Mark complete error:', error);
      throw error;
    }
  }

  /**
   * Mark processing as failed
   */
  static async markProcessingFailed(videoId, error) {
    try {
      const video = await Video.findByIdAndUpdate(
        videoId,
        {
          processingStatus: 'failed',
          processingError: error.message,
        },
        { new: true }
      );

      return video;
    } catch (err) {
      console.error('Mark failed error:', err);
      throw err;
    }
  }

  /**
   * Get user's videos with filters
   */
  static async getUserVideos(userId, tenantId, filters = {}) {
    try {
      const query = {
        tenantId,
        $or: [
          { ownerId: userId }, // User's own videos
          { isPublic: true },   // Or public videos
        ],
      };

      // Apply filters
      if (filters.sensitivityStatus) {
        query.sensitivityStatus = filters.sensitivityStatus;
      }

      if (filters.processingStatus) {
        query.processingStatus = filters.processingStatus;
      }

      if (filters.minSize) {
        query.size = { $gte: filters.minSize };
      }

      if (filters.maxSize) {
        query.size = { ...query.size, $lte: filters.maxSize };
      }

      if (filters.startDate || filters.endDate) {
        query.createdAt = {};
        if (filters.startDate) {
          query.createdAt.$gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          query.createdAt.$lte = new Date(filters.endDate);
        }
      }

      const sort = filters.sortBy === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };

      const videos = await Video.find(query)
        .sort(sort)
        .limit(filters.limit || 50)
        .skip(filters.skip || 0)
        .lean();

      const total = await Video.countDocuments(query);

      return { videos, total };
    } catch (error) {
      console.error('Get user videos error:', error);
      throw error;
    }
  }

  /**
   * Delete video
   */
  static async deleteVideo(videoId, userId, tenantId) {
    try {
      const video = await Video.findById(videoId);

      if (!video) {
        throw new Error('Video not found');
      }

      // Check authorization (owner or admin)
      if (video.ownerId.toString() !== userId.toString()) {
        // Could check if user is admin here
        throw new Error('Unauthorized to delete this video');
      }

      // Delete file from disk
      if (fs.existsSync(video.filePath)) {
        fs.unlinkSync(video.filePath);
      }

      // Delete record
      await Video.findByIdAndDelete(videoId);

      // Update tenant storage
      await Tenant.findByIdAndUpdate(
        tenantId,
        { $inc: { usedStorageGB: -(video.size / 1024 / 1024 / 1024) } }
      );

      return video;
    } catch (error) {
      console.error('Delete video error:', error);
      throw error;
    }
  }

  /**
   * Get video by ID
   */
  static async getVideoById(videoId, userId, tenantId) {
    try {
      const video = await Video.findById(videoId);

      if (!video) {
        throw new Error('Video not found');
      }

      // Check authorization
      const isOwner = video.ownerId.toString() === userId.toString();
      const isPublic = video.isPublic;

      if (!isOwner && !isPublic) {
        throw new Error('Unauthorized');
      }

      return video;
    } catch (error) {
      console.error('Get video error:', error);
      throw error;
    }
  }

  /**
   * Update video metadata (title, description, tags, etc)
   */
  static async updateVideoMetadata(videoId, userId, updates) {
    try {
      const video = await Video.findById(videoId);

      if (!video) {
        throw new Error('Video not found');
      }

      if (video.ownerId.toString() !== userId.toString()) {
        throw new Error('Unauthorized');
      }

      const allowedUpdates = ['description', 'tags', 'isPublic'];
      const updateData = {};

      allowedUpdates.forEach(field => {
        if (field in updates) {
          updateData[field] = updates[field];
        }
      });

      const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        updateData,
        { new: true, runValidators: true }
      );

      return updatedVideo;
    } catch (error) {
      console.error('Update metadata error:', error);
      throw error;
    }
  }

  /**
   * Increment view count
   */
  static async incrementViewCount(videoId) {
    try {
      const video = await Video.findByIdAndUpdate(
        videoId,
        { $inc: { views: 1 } },
        { new: true }
      );

      return video;
    } catch (error) {
      console.error('Increment views error:', error);
    }
  }
}

export default VideoService;

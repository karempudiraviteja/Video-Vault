import fs from 'fs';
import path from 'path';
import Video from '../models/Video.js';
import VideoService from '../services/VideoService.js';

/**
 * Stream video with HTTP range request support
 * GET /api/v1/videos/:videoId/stream
 */
export const streamVideo = async (req, res) => {
  try {
    const { videoId } = req.params;
    console.log(`📹 Stream request for video: ${videoId}`);

    // Get video and check authorization
    const video = await VideoService.getVideoById(
      videoId,
      req.user._id,
      req.tenantId
    );

    console.log(`Video status: ${video.processingStatus}, filePath: ${video.filePath}`);

    // Only allow streaming of completed videos
    if (video.processingStatus !== 'completed') {
      console.log(`❌ Video not ready for streaming. Status: ${video.processingStatus}`);
      return res.status(400).json({
        error: 'Video is still processing or failed',
        status: video.processingStatus,
      });
    }

    // Resolve file path to absolute path
    const videoPath = path.isAbsolute(video.filePath) 
      ? video.filePath 
      : path.join(process.cwd(), video.filePath);

    console.log(`Checking file at: ${videoPath}`);

    // Check if file exists
    if (!fs.existsSync(videoPath)) {
      console.error(`❌ Video file not found at: ${videoPath}`);
      return res.status(404).json({ error: 'Video file not found' });
    }

    console.log(`✅ File found, sending stream...`);

    const fileSize = fs.statSync(videoPath).size;
    const range = req.headers.range;

    // Increment view count
    VideoService.incrementViewCount(videoId);

    // Handle range request (for seeking in video player)
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize) {
        return res.status(416).json({
          error: 'Range Not Satisfiable',
          message: `Requested range start (${start}) exceeds file size (${fileSize})`,
        });
      }

      const chunkSize = end - start + 1;

      res.status(206); // Partial Content
      res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Length', chunkSize);
      res.setHeader('Content-Type', video.mimeType);

      const stream = fs.createReadStream(videoPath, { start, end });
      stream.pipe(res);
    } else {
      // Full file download
      res.setHeader('Content-Type', video.mimeType);
      res.setHeader('Content-Length', fileSize);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${video.originalName}"`
      );

      const stream = fs.createReadStream(videoPath);
      stream.pipe(res);
    }

    res.on('error', (err) => {
      console.error('Stream error:', err);
    });
  } catch (error) {
    console.error('Stream video error:', error);
    if (error.message === 'Video not found') {
      return res.status(404).json({ error: 'Video not found' });
    }
    if (error.message === 'Unauthorized') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    res.status(500).json({ error: 'Failed to stream video' });
  }
};

/**
 * Get video progress/status
 * GET /api/v1/videos/:videoId/status
 */
export const getVideoStatus = async (req, res) => {
  try {
    const video = await VideoService.getVideoById(
      req.params.videoId,
      req.user._id,
      req.tenantId
    );

    res.json({
      videoId: video._id,
      processingStatus: video.processingStatus,
      processingProgress: video.processingProgress,
      sensitivityStatus: video.sensitivityStatus,
      sensitivityScore: video.sensitivityDetails?.score || null,
      processingError: video.processingError || null,
    });
  } catch (error) {
    console.error('Get status error:', error);
    if (error.message === 'Video not found') {
      return res.status(404).json({ error: 'Video not found' });
    }
    if (error.message === 'Unauthorized') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    res.status(500).json({ error: 'Failed to fetch status' });
  }
};

export default { streamVideo, getVideoStatus };

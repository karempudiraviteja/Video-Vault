import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import config from '../config/index.js';

// Set FFmpeg path if provided
if (config.ffmpegPath) {
  ffmpeg.setFfmpegPath(config.ffmpegPath);
}

/**
 * Get video metadata (duration, dimensions, etc)
 * Falls back to default values if FFmpeg is not available
 */
export const getVideoMetadata = (filePath) => {
  return new Promise((resolve, reject) => {
    try {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          console.warn('⚠️  FFmpeg not available, using default metadata.');
          console.warn('   Install FFmpeg to extract video metadata:');
          console.warn('   Windows: choco install ffmpeg OR winget install FFmpeg');
          console.warn('   Mac: brew install ffmpeg');
          console.warn('   Linux: sudo apt install ffmpeg');
          
          // Return default/mock metadata
          resolve({
            duration: 60, // Default 60 seconds
            width: 1920,
            height: 1080,
            frameRate: '30/1',
          });
          return;
        }

        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        
        resolve({
          duration: metadata.format.duration || 60,
          width: videoStream?.width || 1920,
          height: videoStream?.height || 1080,
          frameRate: videoStream?.r_frame_rate || '30/1',
        });
      });
    } catch (err) {
      console.warn('⚠️  FFmpeg not available, using default metadata.');
      // Return default metadata to allow app to work without FFmpeg
      resolve({
        duration: 60,
        width: 1920,
        height: 1080,
        frameRate: '30/1',
      });
    }
  });
};

/**
 * Process video: generate thumbnail, transcode if needed, etc
 */
export const processVideo = (inputPath, outputPath, onProgress) => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .output(outputPath)
      .on('progress', (progress) => {
        if (onProgress && progress.percent) {
          onProgress(Math.min(progress.percent, 99));
        }
      })
      .on('end', () => {
        resolve();
      })
      .on('error', (err) => {
        console.error('FFmpeg error:', err);
        reject(err);
      })
      .run();
  });
};

/**
 * Generate video thumbnail
 */
export const generateThumbnail = (videoPath, thumbnailPath, timemark = '00:00:02') => {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .screenshots({
        timestamps: [timemark],
        filename: path.basename(thumbnailPath),
        folder: path.dirname(thumbnailPath),
        size: '320x180',
      });
  });
};

/**
 * Extract frame count and other metrics for sensitivity analysis
 */
export const analyzeVideoFrames = async (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);

      const videoStream = metadata.streams.find(s => s.codec_type === 'video');
      const duration = metadata.format.duration;
      const frameRate = videoStream?.r_frame_rate;
      
      // Parse frame rate (e.g., "30000/1001" or "30")
      let fps = 30;
      if (frameRate) {
        if (frameRate.includes('/')) {
          const parts = frameRate.split('/');
          fps = parseInt(parts[0]) / parseInt(parts[1]);
        } else {
          fps = parseInt(frameRate);
        }
      }

      const totalFrames = Math.round(duration * fps);

      resolve({
        duration,
        frameRate: fps,
        totalFrames,
        resolution: {
          width: videoStream?.width,
          height: videoStream?.height,
        },
      });
    });
  });
};

export default { 
  getVideoMetadata, 
  processVideo, 
  generateThumbnail, 
  analyzeVideoFrames 
};

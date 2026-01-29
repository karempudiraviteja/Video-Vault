import { analyzeVideoFrames } from './ffmpeg.js';

/**
 * Mock sensitivity analysis
 * In production, integrate with actual AI/ML model
 * This simulates based on heuristics: duration, frame count, etc.
 */
export const analyzeSensitivity = async (videoPath, videoMetadata) => {
  try {
    let frameAnalysis;
    try {
      frameAnalysis = await analyzeVideoFrames(videoPath);
    } catch (err) {
      console.warn('⚠️  Using default analysis (FFmpeg not available)');
      // Use metadata passed in or defaults
      frameAnalysis = {
        duration: videoMetadata?.duration || 60,
        resolution: {
          width: videoMetadata?.width || 1920,
          height: videoMetadata?.height || 1080,
        },
        frameRate: videoMetadata?.frameRate || 30,
      };
    }
    
    // Initialize sensitivity score
    let sensitivityScore = 0;
    const flags = [];

    // Rule 1: Very short videos (< 5 seconds) might be suspicious content
    if (frameAnalysis.duration < 5) {
      sensitivityScore += 15;
      flags.push('very_short_duration');
    }

    // Rule 2: Very long videos (> 2 hours) might need review
    if (frameAnalysis.duration > 7200) {
      sensitivityScore += 5;
      flags.push('very_long_duration');
    }

    // Rule 3: Low resolution videos (potential illegal content)
    if (frameAnalysis.resolution?.width < 320 || frameAnalysis.resolution?.height < 240) {
      sensitivityScore += 20;
      flags.push('low_resolution');
    }

    // Rule 4: High frame rate might indicate slowed-down content
    if (frameAnalysis.frameRate > 60) {
      sensitivityScore += 10;
      flags.push('high_frame_rate');
    }

    // Rule 5: Simulate random detection for demo (20% flagged)
    const randomFlag = Math.random();
    if (randomFlag < 0.2) {
      sensitivityScore += 30;
      flags.push('automatic_detection');
    }

    // Determine if flagged
    const isFlagged = sensitivityScore >= 50;
    const status = isFlagged ? 'flagged' : 'safe';

    return {
      status,
      score: Math.min(sensitivityScore, 100),
      reason: isFlagged 
        ? 'Video flagged for sensitivity review' 
        : 'Video passed sensitivity checks',
      flags,
      analysis: {
        duration: frameAnalysis.duration,
        totalFrames: frameAnalysis.totalFrames,
        resolution: frameAnalysis.resolution,
      },
    };
  } catch (error) {
    console.error('Sensitivity analysis error:', error);
    // Default to safe if analysis fails
    return {
      status: 'safe',
      score: 0,
      reason: 'Analysis skipped due to error',
      flags: [],
      analysis: null,
    };
  }
};

export default { analyzeSensitivity };

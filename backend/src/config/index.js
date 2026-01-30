import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/video-platform',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  jwtExpire: process.env.JWT_EXPIRE || '7d',

  // File Upload
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '500000000'), // 500MB default
  allowedVideoFormats: (process.env.ALLOWED_VIDEO_FORMATS || 'mp4,mkv,mov').split(','),
  uploadsDir: './uploads',

  // FFmpeg
  ffmpegPath: process.env.FFMPEG_PATH,

  // CORS
  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').concat('https://video-vault-faye.vercel.app').map(o => o.trim().replace(/\/$/, '')),
  socketCors: (process.env.SOCKET_CORS || 'http://localhost:5173').split(',').concat('https://video-vault-faye.vercel.app').map(o => o.trim().replace(/\/$/, '')),

  // AWS S3 (optional)
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    s3Bucket: process.env.AWS_S3_BUCKET,
    s3Region: process.env.AWS_S3_REGION,
  },

  // API
  apiVersion: 'v1',
};

export default config;

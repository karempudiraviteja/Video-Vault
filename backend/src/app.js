import express from 'express';
import cors from 'cors';
import config from './config/index.js';
import authRoutes from './routes/authRoutes.js';
import videoRoutes from './routes/videoRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

/**
 * Initialize Express app
 */
export const createApp = (io) => {
  const app = express();

  // Middleware
  app.use(cors({
    origin: [
      "http://localhost:5173",
      "https://video-vault-faye.vercel.app"
    ],
    credentials: true,
  }));

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Attach io instance to requests for emitting events
  app.use((req, res, next) => {
    req.io = io;
    next();
  });

  // Health check
  app.get('/api/v1/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date() });
  });

  // Routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/videos', videoRoutes);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export default createApp;

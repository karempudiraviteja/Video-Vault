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
    origin: (origin, callback) => {
      const allowedOrigins = config.corsOrigin;
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      } else {
        console.log('❌ CORS Blocked Origin:', origin);
        console.log('✅ Allowed Origins:', allowedOrigins);
        return callback(new Error('Not allowed by CORS'));
      }
    },
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

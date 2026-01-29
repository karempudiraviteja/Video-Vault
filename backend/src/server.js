import http from 'http';
import { Server } from 'socket.io';
import config from './config/index.js';
import { initializeDatabase } from './config/database.js';
import { createApp } from './app.js';
import { setupSocketHandlers } from './sockets/handlers.js';

/**
 * Start server
 */
const startServer = async () => {
  try {
    // Initialize database
    await initializeDatabase();

    // Create Express app
    const app = createApp();

    // Create HTTP server
    const httpServer = http.createServer(app);

    // Initialize Socket.io
    const io = new Server(httpServer, {
      cors: {
        origin: (origin, callback) => {
          const allowedOrigins = config.socketCors;
          if (!origin) return callback(null, true);

          if (allowedOrigins.indexOf(origin) !== -1) {
            return callback(null, true);
          } else {
            console.log('❌ Socket CORS Blocked Origin:', origin);
            console.log('✅ Socket Allowed Origins:', allowedOrigins);
            return callback(new Error('Not allowed by CORS'), false);
          }
        },
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    // Pass io to app
    const appWithIo = createApp(io);

    // Setup Socket.io handlers
    setupSocketHandlers(io);

    // Start listening
    httpServer.listen(config.port, () => {
      console.log(`
╔═══════════════════════════════════════════════════════╗
║      🎬 VIDEOVAULT SERVER STARTED                     ║
╠═══════════════════════════════════════════════════════╣
║ Server:  http://localhost:${config.port}
║ Environment: ${config.nodeEnv}
║ MongoDB: Connected
║ Socket.io: Enabled
╚═══════════════════════════════════════════════════════╝
      `);
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server');
      httpServer.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start server
startServer();

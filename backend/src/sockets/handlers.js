import User from '../models/User.js';

/**
 * Handle Socket.io connections and events
 */
export const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.id}`);

    /**
     * User joins tenant room for real-time updates
     */
    socket.on('join_tenant', async (data) => {
      try {
        const { tenantId, userId } = data;

        // Verify user (in production, verify token)
        const user = await User.findById(userId);
        if (!user || user.tenantId.toString() !== tenantId) {
          socket.emit('error', { message: 'Unauthorized' });
          return;
        }

        // Join tenant-specific room
        socket.join(`tenant-${tenantId}`);
        socket.tenantId = tenantId;
        socket.userId = userId;

        console.log(`✅ User ${userId} joined tenant ${tenantId}`);

        socket.emit('joined_tenant', {
          message: 'Connected to tenant room',
          tenantId,
        });
      } catch (error) {
        console.error('Join tenant error:', error);
        socket.emit('error', { message: 'Connection failed' });
      }
    });

    /**
     * User uploads video (started)
     */
    socket.on('upload_started', (data) => {
      if (socket.tenantId) {
        io.to(`tenant-${socket.tenantId}`).emit('upload_notification', {
          userId: socket.userId,
          videoId: data.videoId,
          filename: data.filename,
          timestamp: new Date(),
        });
      }
    });

    /**
     * Real-time progress updates during processing
     */
    socket.on('processing_progress', (data) => {
      if (socket.tenantId) {
        io.to(`tenant-${socket.tenantId}`).emit('progress_update', {
          videoId: data.videoId,
          progress: data.progress,
          message: data.message,
          timestamp: new Date(),
        });
      }
    });

    /**
     * User leaves tenant
     */
    socket.on('leave_tenant', () => {
      if (socket.tenantId) {
        socket.leave(`tenant-${socket.tenantId}`);
        console.log(`👋 User ${socket.userId} left tenant ${socket.tenantId}`);
      }
    });

    /**
     * Disconnect
     */
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.id}`);
    });

    /**
     * Error handler
     */
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });
};

export default { setupSocketHandlers };

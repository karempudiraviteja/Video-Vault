import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';

/**
 * Real-time Context for Socket.io events
 */
const RealtimeContext = createContext(null);

export const RealtimeProvider = ({ children }) => {
  const { user, tenant } = useAuth();
  const [socket, setSocket] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({});
  const [processingProgress, setProcessingProgress] = useState({});
  const [notifications, setNotifications] = useState([]);

  // Initialize socket connection
  useEffect(() => {
    if (!user || !tenant) return;

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
    // Remove /api/v1 suffix for socket connection if present, or use root domain
    const socketUrl = apiUrl.replace('/api/v1', '');

    const socketInstance = io(socketUrl, {
      auth: {
        userId: user.id || user._id,
        tenantId: tenant.id || tenant._id,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketInstance.on('connect', () => {
      console.log('✅ Socket connected:', socketInstance.id);
      socketInstance.emit('join_tenant', {
        userId: user.id || user._id,
        tenantId: tenant.id || tenant._id,
      });
    });

    socketInstance.on('joined_tenant', (data) => {
      console.log('Joined tenant:', data);
    });

    socketInstance.on('upload_notification', (data) => {
      setNotifications((prev) => [
        ...prev,
        { id: Date.now(), type: 'upload', ...data },
      ]);
    });

    socketInstance.on('processing_started', (data) => {
      setProcessingProgress((prev) => ({
        ...prev,
        [data.videoId]: { progress: 0, message: 'Processing started' },
      }));
    });

    socketInstance.on('processing_progress', (data) => {
      setProcessingProgress((prev) => ({
        ...prev,
        [data.videoId]: {
          progress: data.progress,
          message: data.message,
        },
      }));
    });

    socketInstance.on('processing_completed', (data) => {
      setProcessingProgress((prev) => ({
        ...prev,
        [data.videoId]: {
          progress: 100,
          message: 'Processing completed',
          status: 'completed',
        },
      }));
      setNotifications((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: 'success',
          message: `Video ${data.video.originalName} is ready!`,
        },
      ]);
    });

    socketInstance.on('processing_failed', (data) => {
      setProcessingProgress((prev) => ({
        ...prev,
        [data.videoId]: {
          progress: 0,
          message: 'Processing failed',
          status: 'failed',
          error: data.error,
        },
      }));
      setNotifications((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: 'error',
          message: `Processing failed: ${data.error}`,
        },
      ]);
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    socketInstance.on('error', (error) => {
      console.error('Socket error:', error);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user, tenant]);

  const addNotification = useCallback((type, message) => {
    setNotifications((prev) => [
      ...prev,
      { id: Date.now(), type, message },
    ]);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const setProgress = useCallback((videoId, progress) => {
    setUploadProgress((prev) => ({
      ...prev,
      [videoId]: progress,
    }));
  }, []);

  return (
    <RealtimeContext.Provider
      value={{
        socket,
        uploadProgress,
        processingProgress,
        notifications,
        addNotification,
        removeNotification,
        setProgress,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
};

/**
 * Hook to use realtime context
 */
export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within RealtimeProvider');
  }
  return context;
};

export default RealtimeContext;

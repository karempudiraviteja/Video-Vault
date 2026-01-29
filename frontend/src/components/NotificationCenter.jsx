import { useAuth } from '../context/AuthContext.jsx';
import { useRealtime } from '../context/RealtimeContext.jsx';
import '../styles/Notification.css';

export const NotificationCenter = () => {
  const { notifications, removeNotification } = useRealtime();

  return (
    <div className="notification-center">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`notification notification-${notification.type}`}
          onClick={() => removeNotification(notification.id)}
        >
          <div className="notification-content">
            {notification.type === 'upload' && (
              <span>📤 {notification.filename} uploaded</span>
            )}
            {notification.type === 'success' && (
              <span>✅ {notification.message}</span>
            )}
            {notification.type === 'error' && (
              <span>❌ {notification.message}</span>
            )}
            {!notification.type && <span>{notification.message}</span>}
          </div>
          <button
            className="notification-close"
            onClick={(e) => {
              e.stopPropagation();
              removeNotification(notification.id);
            }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationCenter;

/**
 * Format file size (bytes to human readable)
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Format date
 */
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format duration (seconds to HH:MM:SS)
 */
export const formatDuration = (seconds) => {
  if (!seconds) return '00:00:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

/**
 * Validate email
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Get sensitivity badge color
 */
export const getSensitivityColor = (status) => {
  switch (status) {
    case 'safe':
      return '#10b981';
    case 'flagged':
      return '#ef4444';
    case 'pending':
      return '#f59e0b';
    default:
      return '#6b7280';
  }
};

/**
 * Get status badge color
 */
export const getStatusColor = (status) => {
  switch (status) {
    case 'completed':
      return '#10b981';
    case 'processing':
      return '#3b82f6';
    case 'pending':
      return '#f59e0b';
    case 'failed':
      return '#ef4444';
    default:
      return '#6b7280';
  }
};

export default {
  formatFileSize,
  formatDate,
  formatDuration,
  isValidEmail,
  getSensitivityColor,
  getStatusColor,
};

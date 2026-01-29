import axios from 'axios';

// API client instance
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * Auth API
 */
export const authAPI = {
  register: (email, password, firstName, lastName, tenantName, tenantId, inviteCode) =>
    api.post('/auth/register', {
      email,
      password,
      firstName,
      lastName,
      tenantName,
      tenantId,
      inviteCode
    }),

  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  getCurrentUser: () =>
    api.get('/auth/me'),

  updateProfile: (firstName, lastName) =>
    api.put('/auth/profile', { firstName, lastName }),

  getTenantInfo: (tenantId, email, inviteCode) =>
    api.get(`/auth/tenant-info/${tenantId}`, {
      params: { email, inviteCode }
    }),
};

/**
 * Video API
 */
export const videoAPI = {
  uploadVideo: (file, description, tags, isPublic) => {
    const formData = new FormData();
    formData.append('video', file);
    if (description) formData.append('description', description);
    if (tags) formData.append('tags', tags);
    if (isPublic) formData.append('isPublic', isPublic);

    return api.post('/videos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  getVideos: (filters = {}) =>
    api.get('/videos', { params: filters }),

  getVideoById: (videoId) =>
    api.get(`/videos/${videoId}`),

  updateVideo: (videoId, updates) =>
    api.put(`/videos/${videoId}`, updates),

  deleteVideo: (videoId) =>
    api.delete(`/videos/${videoId}`),

  streamVideo: (videoId) => {
    const token = localStorage.getItem('token');
    const baseUrl = `${api.defaults.baseURL}/videos/${videoId}/stream`;
    return token ? `${baseUrl}?token=${token}` : baseUrl;
  },

  getVideoStatus: (videoId) =>
    api.get(`/videos/${videoId}/status`),
};

export default api;

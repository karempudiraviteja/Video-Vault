# 🎬 VideoVault - React + Vite Frontend

## 📌 Overview

A modern, responsive React frontend for VideoVault built with Vite. Features real-time Socket.io integration, Context API for state management, and a polished user experience across desktop and mobile devices.

## 🏗️ Tech Stack

- **Framework**: React 18.2+
- **Build Tool**: Vite
- **State Management**: Context API + React Hooks
- **HTTP Client**: Axios
- **Real-time**: Socket.io Client
- **Routing**: React Router DOM
- **Styling**: CSS3 (modular, responsive)

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- npm or yarn

### Installation

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm build

# Preview production build
npm run preview
```

### Environment Setup

The frontend connects to backend at `http://localhost:5000/api/v1` by default.

Configure in `vite.config.js`:
```javascript
proxy: {
  '/api': {
    target: 'http://localhost:5000',
    changeOrigin: true,
  },
}
```

For production, update the API base URL in `src/api/client.js`.

## 📱 Pages & Routes

### Public Routes
- `/login` - User login page
- `/register` - User registration page

### Protected Routes (Require Authentication)
- `/dashboard` - Main dashboard with user info & quick stats
- `/upload` - Video upload with drag-and-drop
- `/videos` - Video library with filters
- `/videos/:videoId` - Video player & details

## 🔑 Authentication Flow

```
Register/Login → Store JWT Token
                    ↓
            Include in Every Request
                    ↓
        Unauthorized (401) → Redirect to Login
                    ↓
            Use Token for API Calls
```

### AuthContext
```javascript
const { 
  user,              // { _id, email, firstName, lastName, role }
  tenant,            // { id, name, maxStorageGB, usedStorageGB }
  isAuthenticated,   // boolean
  login,             // async (email, password) => { success, error }
  register,          // async (...) => { success, error }
  logout,            // () => void
  updateProfile      // async (firstName, lastName) => { success, error }
} = useAuth();
```

## 🎥 Video Upload Flow

1. **Select File**: Drag & drop or click to select
2. **Validate**: Check format (MP4, MKV, MOV) and size
3. **Extract Metadata**: Get duration, resolution
4. **Upload**: Send to backend with form data
5. **Real-time Progress**: Receive Socket.io events
6. **Processing**: Backend processes in background
7. **Completion**: Show status and allow viewing

### Upload Component Logic
```javascript
1. User selects file
   ↓
2. Validate format & size
   ↓
3. Extract video metadata (duration, resolution)
   ↓
4. Submit form with description, tags, isPublic
   ↓
5. Backend returns video ID
   ↓
6. Socket.io: 'processing_started' event
   ↓
7. Listen to 'processing_progress' events
   ↓
8. Socket.io: 'processing_completed' event
   ↓
9. Show success and allow viewing
```

## 🔌 Real-time Updates

### Socket.io Integration
```javascript
const { 
  socket,                    // Socket.io instance
  uploadProgress,            // { videoId: progress }
  processingProgress,        // { videoId: { progress, status } }
  notifications,             // Array of notifications
  addNotification,           // (type, message) => void
  removeNotification,        // (id) => void
  setProgress               // (videoId, progress) => void
} = useRealtime();
```

### Events Flow
```javascript
// Client joins tenant room
socket.emit('join_tenant', { userId, tenantId });

// Backend starts processing
socket.on('processing_started', (data) => {});

// Real-time progress updates
socket.on('processing_progress', (data) => {
  // { videoId, progress, message }
});

// Completed
socket.on('processing_completed', (data) => {
  // { videoId, video, sensitivityStatus }
});

// Failed
socket.on('processing_failed', (data) => {
  // { videoId, error }
});
```

## 🎨 Styling System

### CSS Architecture
- **Global styles**: `src/styles/index.css`
- **Component styles**: `src/styles/[Component].css`
- **Color system**: CSS custom properties (variables)
- **Responsive**: Mobile-first approach

### Color Scheme
```css
--primary-color: #3b82f6        /* Blue */
--secondary-color: #6366f1      /* Indigo */
--success-color: #10b981        /* Green */
--danger-color: #ef4444         /* Red */
--warning-color: #f59e0b        /* Amber */
--gray-50 to --gray-900         /* Gray scale */
```

### Responsive Breakpoints
- Mobile: < 480px
- Tablet: < 768px
- Desktop: >= 1024px

## 📚 API Client

### Usage
```javascript
import { authAPI, videoAPI } from '../api/client.js';

// Auth
const { data } = await authAPI.login(email, password);
const { data } = await authAPI.register(email, password, firstName, lastName);
const { data } = await authAPI.getCurrentUser();

// Videos
const { data } = await videoAPI.uploadVideo(file, description, tags, isPublic);
const { data } = await videoAPI.getVideos({ filters });
const { data } = await videoAPI.getVideoById(videoId);
const { data } = await videoAPI.updateVideo(videoId, updates);
const url = videoAPI.streamVideo(videoId);  // Use in <video> src
```

### Axios Interceptors
- **Request**: Attach JWT token from localStorage
- **Response**: Handle 401 errors, redirect to login

## 🛠️ Utility Functions

```javascript
import { 
  formatFileSize,        // bytes → "25.5 MB"
  formatDate,            // ISO → "Jan 28, 2024"
  formatDuration,        // seconds → "01:30:45"
  isValidEmail,          // string → boolean
  getSensitivityColor,   // status → color hex
  getStatusColor         // status → color hex
} from '../utils/helpers.js';
```

## 📦 Component Structure

### Layout Components
- **Navbar**: Navigation, user menu, logout
- **NotificationCenter**: Toast notifications
- **ProgressBar**: Video processing progress

### Page Components
- **LoginPage**: User login form
- **RegisterPage**: User registration form
- **DashboardPage**: Welcome, stats, quick actions
- **UploadPage**: File upload with drag-drop
- **VideosPage**: Video library with filters
- **VideoPlayerPage**: HTML5 video player + details

## 🔐 Security Considerations

### JWT Token Storage
```javascript
// Store in localStorage (simple)
localStorage.setItem('token', token);
localStorage.getItem('token');

// Alternative: Use httpOnly cookies (more secure)
// Requires backend to send Set-Cookie header
```

### CORS
```javascript
// Frontend CORS is handled by vite.config.js proxy
// Backend CORS is configured in server.js
```

### Sensitive Data
- Don't store passwords
- Don't log sensitive data to console in production
- Use HTTPS in production
- Set secure flag on cookies

## 📱 Responsive Design

### Mobile Optimizations
- Touch-friendly buttons (48px minimum)
- Single-column layouts
- Hidden desktop-only elements
- Optimized video player controls

### Desktop Features
- Multi-column grid layouts
- Advanced filter options
- Side-by-side video + details
- Keyboard shortcuts (future)

## 🧪 Development Tips

### Using React DevTools
```bash
# Install React DevTools browser extension
# Inspect component tree, props, hooks state
```

### Socket.io Debugging
```javascript
// In browser console
socket.on('*', (event, ...args) => {
  console.log('Socket event:', event, args);
});
```

### Network Debugging
```javascript
// Open DevTools → Network tab
// Filter by XHR to see API calls
// Copy response as cURL to test in terminal
```

## 🚀 Production Build

```bash
# Create optimized production build
npm run build

# Output in 'dist/' directory
# Ready to deploy to Vercel, Netlify, etc.

# Test production build locally
npm run preview
# Visit http://localhost:4173
```

### Deployment Platforms

#### Vercel (Recommended)
```bash
# Connect GitHub repo to Vercel
# Automatic deployments on push
# Environment variables in dashboard
```

#### Netlify
```bash
# Build command: npm run build
# Publish directory: dist
# Redirects: _redirects file for SPA routing
```

#### GitHub Pages
```bash
# Add base path to vite.config.js
export default {
  base: '/repository-name/',
}
```

## 📖 Project Structure

```
frontend/
├── src/
│   ├── api/
│   │   └── client.js          # Axios instance & API methods
│   ├── components/            # Reusable components
│   │   ├── Navbar.jsx
│   │   ├── NotificationCenter.jsx
│   │   └── ProgressBar.jsx
│   ├── context/               # Context providers
│   │   ├── AuthContext.jsx    # Auth state & methods
│   │   └── RealtimeContext.jsx # Socket.io state
│   ├── hooks/                 # Custom React hooks
│   ├── pages/                 # Page components
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── UploadPage.jsx
│   │   ├── VideosPage.jsx
│   │   └── VideoPlayerPage.jsx
│   ├── styles/                # CSS stylesheets
│   │   ├── index.css
│   │   ├── Auth.css
│   │   ├── Navbar.css
│   │   ├── Dashboard.css
│   │   ├── UploadPage.css
│   │   ├── VideosPage.css
│   │   ├── VideoPlayerPage.css
│   │   ├── ProgressBar.css
│   │   └── Notification.css
│   ├── utils/                 # Utility functions
│   │   └── helpers.js
│   ├── App.jsx                # Main app component
│   └── main.jsx               # Entry point
├── public/                    # Static assets
├── index.html                 # HTML template
├── vite.config.js            # Vite configuration
├── package.json
└── README.md
```

## 🐛 Common Issues

### 401 Unauthorized
- Token expired → Re-login
- Token corrupted → Clear localStorage
- Backend not running → Check server status

### CORS Errors
- Frontend origin not whitelisted in backend CORS
- Update `CORS_ORIGIN` in backend .env

### Socket.io Not Connecting
- Backend Socket.io server not running
- Check socket address in RealtimeContext.jsx
- Verify Socket.io CORS config

### Video Not Playing
- Video still processing → Wait for completion
- Wrong video format → Only MP4, MKV, MOV supported
- File deleted → Upload again

### Large File Upload Fails
- File too large → Max 500MB
- Network timeout → Try again or split file
- Browser storage limit → Clear cache

## 🚀 Performance Optimization

### Code Splitting
```javascript
// Dynamic imports for route-based splitting
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'));
<Suspense fallback={<Loading />}>
  <DashboardPage />
</Suspense>
```

### Image Optimization
- Use video thumbnails as placeholders
- Lazy load images below fold

### Caching
- Store tokens in localStorage
- Cache API responses with proper headers
- Service workers for offline support (future)

## 📱 Mobile-First CSS

```css
/* Mobile first */
.container { width: 100%; }

/* Then add desktop styles */
@media (min-width: 1024px) {
  .container { max-width: 1200px; }
}
```

## 🔗 Backend Integration

### API Base URL
```javascript
// src/api/client.js
export const api = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
});
```

### Authentication Headers
```javascript
// Automatically added by interceptor
Authorization: Bearer {jwt_token}
```

### CORS Configuration
- Backend CORS must allow frontend origin
- Configure in backend server.js
- Use Vite proxy for development

## 📞 Support

For issues:
1. Check browser console for errors
2. Open DevTools Network tab to see API responses
3. Verify backend is running: `curl http://localhost:5000/api/v1/health`
4. Check Socket.io connection in browser console
5. Create GitHub issue with error details

## 🎓 Learning Resources

- [React Hooks Documentation](https://react.dev)
- [Vite Guide](https://vitejs.dev/guide)
- [Socket.io Client Docs](https://socket.io/docs/v4/client-api)
- [Axios Documentation](https://axios-http.com)
- [React Router Docs](https://reactrouter.com)

## 📄 License
MIT License

## 👨‍💻 Built By
Senior full-stack engineers for production use.

# 🎬 VideoVault - Production-Grade Backend API

## 📌 Overview

A scalable, secure, multi-tenant video upload, processing, and streaming platform built with Node.js, Express, MongoDB, and Socket.io. Includes real-time sensitivity classification, HTTP range request streaming, and role-based access control.

## 🏗️ Architecture

### Technology Stack
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT
- **Real-time**: Socket.io
- **Video Processing**: FFmpeg + fluent-ffmpeg
- **File Upload**: Multer

### Design Patterns
- **Clean Architecture**: Separation of concerns (controllers, services, models, middleware)
- **Multi-tenancy**: Each tenant isolated via `tenantId`
- **RBAC**: Role-based access control (Viewer, Editor, Admin)
- **Async Processing**: Video processing in background with progress updates
- **Stream-based**: HTTP Range Requests for efficient video streaming

## 🚀 Quick Start

### Prerequisites
- Node.js v18 or higher
- MongoDB (Atlas or local)
- FFmpeg installed on system

### Installation

```bash
# Clone repository
cd backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your settings
nano .env

# Start server
npm start

# Development mode (with auto-reload)
npm run dev
```

### Environment Variables

```env
# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/video-platform

# JWT
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRE=7d

# Server
PORT=5000
NODE_ENV=development

# File Upload
MAX_FILE_SIZE=500000000  # 500MB
ALLOWED_VIDEO_FORMATS=mp4,mkv,mov

# CORS
CORS_ORIGIN=http://localhost:5173
SOCKET_CORS=http://localhost:5173
```

## 📚 API Endpoints

### Authentication Endpoints

#### Register User
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "tenantName": "My Workspace"
}

Response 201:
{
  "token": "eyJhbGc...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "admin",
    "tenantId": "507f1f77bcf86cd799439012"
  },
  "tenant": {
    "id": "507f1f77bcf86cd799439012",
    "name": "My Workspace"
  }
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}

Response 200: (Same as register)
```

#### Get Current User
```http
GET /api/v1/auth/me
Authorization: Bearer {token}

Response 200:
{
  "user": { ... },
  "tenant": {
    "id": "...",
    "name": "...",
    "maxStorageGB": 100,
    "usedStorageGB": 25.5
  }
}
```

#### Update Profile
```http
PUT /api/v1/auth/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith"
}

Response 200:
{
  "message": "Profile updated successfully",
  "user": { ... }
}
```

### Video Endpoints

#### Upload Video
```http
POST /api/v1/videos/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

Form Data:
- video: (file) the video file
- description: (optional) "My awesome video"
- tags: (optional) "tag1, tag2"
- isPublic: (optional) false

Response 201:
{
  "message": "Video uploaded successfully",
  "video": {
    "_id": "507f1f77bcf86cd799439013",
    "filename": "1234567-abc-xyz.mp4",
    "originalName": "my-video.mp4",
    "size": 50000000,
    "duration": 120,
    "processingStatus": "pending",
    "sensitivityStatus": "pending",
    "processingProgress": 0,
    "uploadDate": "2024-01-28T10:00:00Z"
  }
}
```

#### Get All Videos
```http
GET /api/v1/videos?sensitivityStatus=safe&processingStatus=completed&limit=50&skip=0
Authorization: Bearer {token}

Query Parameters:
- sensitivityStatus: safe | flagged | pending
- processingStatus: pending | processing | completed | failed
- minSize: number (bytes)
- maxSize: number (bytes)
- startDate: ISO date
- endDate: ISO date
- sortBy: newest | oldest
- limit: 50
- skip: 0

Response 200:
{
  "videos": [ ... ],
  "pagination": {
    "total": 150,
    "limit": 50,
    "skip": 0,
    "pages": 3
  }
}
```

#### Get Video by ID
```http
GET /api/v1/videos/{videoId}
Authorization: Bearer {token}

Response 200:
{
  "_id": "507f1f77bcf86cd799439013",
  "originalName": "my-video.mp4",
  "size": 50000000,
  "duration": 120,
  "processingStatus": "completed",
  "sensitivityStatus": "safe",
  "sensitivityDetails": {
    "score": 15,
    "reason": "Video passed sensitivity checks",
    "flags": []
  },
  "views": 42,
  "createdAt": "2024-01-28T10:00:00Z"
}
```

#### Update Video Metadata
```http
PUT /api/v1/videos/{videoId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "description": "Updated description",
  "tags": ["tag1", "tag2"],
  "isPublic": true
}

Response 200:
{
  "message": "Video updated successfully",
  "video": { ... }
}
```

#### Delete Video
```http
DELETE /api/v1/videos/{videoId}
Authorization: Bearer {token}

Response 200:
{
  "message": "Video deleted successfully",
  "video": { ... }
}
```

#### Stream Video (HTTP Range Request)
```http
GET /api/v1/videos/{videoId}/stream
Authorization: Bearer {token}
Range: bytes=0-1023 (optional, for seeking)

Response 200 (or 206 for partial content):
<binary video data>

Headers:
- Accept-Ranges: bytes
- Content-Type: video/mp4
- Content-Length: <length>
- Content-Range: bytes 0-1023/50000000 (if range requested)
```

#### Get Video Status
```http
GET /api/v1/videos/{videoId}/status
Authorization: Bearer {token}

Response 200:
{
  "videoId": "507f1f77bcf86cd799439013",
  "processingStatus": "processing",
  "processingProgress": 75,
  "sensitivityStatus": "pending",
  "sensitivityScore": null,
  "processingError": null
}
```

## 🔒 Security Features

### Authentication & Authorization
- **JWT-based**: Token-based authentication
- **Role-Based Access Control (RBAC)**:
  - `viewer`: View and stream videos only
  - `editor`: Upload, update, delete own videos
  - `admin`: Full system access
- **Multi-tenancy**: Users can only access their tenant's data

### File Security
- **Validation**: Only MP4, MKV, MOV formats accepted
- **Size Limits**: Max 500MB per file (configurable)
- **Secure Naming**: Uploaded files renamed to prevent conflicts
- **Authorization Checks**: Verify ownership before streaming

### Data Protection
- **Password Hashing**: bcryptjs with 10-salt rounds
- **Sensitive Data**: Passwords excluded from API responses
- **CORS**: Configured origin whitelist
- **Error Messages**: Generic messages prevent info disclosure

## 🔄 Video Processing Pipeline

### Workflow
1. **Upload**: User uploads video file → validation → save to disk
2. **Metadata Extraction**: Get duration, dimensions, codec info
3. **Sensitivity Analysis**: Mock AI analysis based on heuristics
4. **Status Updates**: Emit real-time progress via Socket.io
5. **Completion**: Mark as processed, store results in DB

### Sensitivity Analysis Rules
- **Duration < 5 seconds**: +15 points (suspicious)
- **Duration > 2 hours**: +5 points (needs review)
- **Low resolution**: +20 points (potential illegal content)
- **High frame rate**: +10 points (slowed-down content)
- **Random detection**: 20% chance for demo purposes

**Scoring**: 0-100 points
- **0-49**: Safe ✅
- **50+**: Flagged ⚠️

## 🔌 Socket.io Events

### Client → Server
```javascript
// Join tenant room for real-time updates
socket.emit('join_tenant', {
  tenantId: 'xxx',
  userId: 'xxx'
});

// Leave tenant
socket.emit('leave_tenant');

// Upload started
socket.emit('upload_started', {
  videoId: 'xxx',
  filename: 'video.mp4'
});

// Processing progress
socket.emit('processing_progress', {
  videoId: 'xxx',
  progress: 75,
  message: 'Sensitivity analysis complete'
});
```

### Server → Client
```javascript
// User joined tenant
socket.on('joined_tenant', (data) => {});

// Upload notification
socket.on('upload_notification', (data) => {
  // { userId, videoId, filename, timestamp }
});

// Processing events
socket.on('processing_started', (data) => {
  // { videoId }
});

socket.on('processing_progress', (data) => {
  // { videoId, progress, message }
});

socket.on('processing_completed', (data) => {
  // { videoId, video, sensitivityStatus }
});

socket.on('processing_failed', (data) => {
  // { videoId, error }
});
```

## 📊 Database Schema

### User
```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  firstName: String,
  lastName: String,
  role: 'viewer' | 'editor' | 'admin',
  tenantId: ObjectId (ref: Tenant),
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Tenant
```javascript
{
  _id: ObjectId,
  name: String (unique),
  description: String,
  ownerId: ObjectId (ref: User),
  isActive: Boolean,
  maxStorageGB: Number,
  usedStorageGB: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Video
```javascript
{
  _id: ObjectId,
  filename: String,
  originalName: String,
  size: Number,
  mimeType: String,
  duration: Number,
  width: Number,
  height: Number,
  fileExtension: String,
  ownerId: ObjectId (ref: User),
  tenantId: ObjectId (ref: Tenant),
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed',
  sensitivityStatus: 'pending' | 'safe' | 'flagged',
  sensitivityDetails: {
    score: Number,
    reason: String,
    flags: [String]
  },
  processingProgress: Number (0-100),
  processingError: String,
  filePath: String,
  isPublic: Boolean,
  views: Number,
  tags: [String],
  description: String,
  createdAt: Date,
  updatedAt: Date
}
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test tests/auth.test.js

# Run with coverage
npm test -- --coverage

# Watch mode
npm run test:watch
```

## 📦 File Structure

```
backend/
├── src/
│   ├── config/           # Configuration
│   │   ├── index.js      # Main config
│   │   └── database.js   # MongoDB setup
│   ├── controllers/      # Route handlers
│   │   ├── authController.js
│   │   ├── videoController.js
│   │   └── streamingController.js
│   ├── models/          # Mongoose schemas
│   │   ├── User.js
│   │   ├── Tenant.js
│   │   └── Video.js
│   ├── routes/          # API routes
│   │   ├── authRoutes.js
│   │   └── videoRoutes.js
│   ├── middleware/      # Express middleware
│   │   ├── auth.js      # JWT verification
│   │   ├── errorHandler.js
│   │   └── validation.js
│   ├── services/        # Business logic
│   │   └── VideoService.js
│   ├── sockets/         # Socket.io handlers
│   │   └── handlers.js
│   ├── utils/           # Utility functions
│   │   ├── jwt.js
│   │   ├── upload.js
│   │   ├── ffmpeg.js
│   │   └── sensitivity.js
│   ├── app.js           # Express app setup
│   └── server.js        # Server entry point
├── tests/               # Test files
├── uploads/             # Uploaded video storage
├── package.json
├── .env.example
└── README.md
```

## 🚀 Deployment

### Environment Setup
```bash
# Production .env
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<secure-random-string>
PORT=5000
```

### Platforms
- **Render**: `npm start` as start command
- **Railway**: `npm start` as start command
- **Heroku**: Add Procfile: `web: npm start`
- **AWS EC2**: Node + MongoDB Atlas

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET`
- [ ] Configure `CORS_ORIGIN` for your domain
- [ ] Set `maxStorageGB` per tenant
- [ ] Enable MongoDB IP whitelist
- [ ] Use HTTPS/TLS
- [ ] Set up monitoring & logging
- [ ] Configure backup strategy
- [ ] Test disaster recovery

## 🔧 Troubleshooting

### MongoDB Connection
```bash
# Check MongoDB URI format
mongodb+srv://user:password@cluster.mongodb.net/database

# Verify IP whitelist on Atlas
# Allow 0.0.0.0/0 for development (not production)
```

### FFmpeg Not Found
```bash
# Linux/Mac
brew install ffmpeg  # Mac
sudo apt-get install ffmpeg  # Linux/Ubuntu

# Windows
choco install ffmpeg  # Or download from ffmpeg.org
```

### Socket.io Connection Issues
```javascript
// Check CORS configuration in server.js
// Frontend should connect to same origin as server
io('http://localhost:5000', {
  reconnection: true,
  transports: ['websocket', 'polling']
})
```

### Large File Uploads
- Increase `maxFileSize` in .env
- Adjust Express body size limit
- Consider chunked uploads for files > 1GB

## 📖 Documentation Links
- [Express.js Docs](https://expressjs.com)
- [Mongoose Docs](https://mongoosejs.com)
- [Socket.io Docs](https://socket.io)
- [FFmpeg Docs](https://ffmpeg.org)
- [JWT Intro](https://jwt.io/introduction)

## 📄 License
MIT License - See LICENSE file

## 👨‍💻 Author
Built as a production-grade example by senior engineers.

## 🤝 Support
For issues and questions, create a GitHub issue or contact the team.

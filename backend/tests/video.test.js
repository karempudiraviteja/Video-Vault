/**
 * Basic Test Suite for Video Upload and Streaming
 */
import request from 'supertest';
import { createApp } from '../src/app.js';
import { initializeDatabase, closeDatabase } from '../src/config/database.js';
import User from '../src/models/User.js';
import Tenant from '../src/models/Tenant.js';
import Video from '../src/models/Video.js';
import fs from 'fs';
import path from 'path';

describe('Video Upload and Streaming', () => {
  let app;
  let authToken;
  let userId;
  let tenantId;
  let videoId;

  beforeAll(async () => {
    await initializeDatabase();
    app = createApp();
  });

  beforeEach(async () => {
    // Register and login
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        tenantName: 'Test Workspace',
      });

    authToken = registerRes.body.token;
    userId = registerRes.body.user._id;
    tenantId = registerRes.body.tenant.id;
  });

  afterEach(async () => {
    // Clean up
    await User.deleteMany({});
    await Tenant.deleteMany({});
    await Video.deleteMany({});
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('POST /api/v1/videos/upload', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/v1/videos/upload')
        .attach('video', Buffer.from('fake video data'), 'test.mp4');

      expect(response.statusCode).toBe(401);
    });

    it('should require editor role', async () => {
      // Create viewer user
      const viewer = new User({
        email: 'viewer@example.com',
        password: 'password123',
        firstName: 'View',
        lastName: 'Er',
        tenantId,
        role: 'viewer',
      });
      await viewer.save();

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'viewer@example.com',
          password: 'password123',
        });

      const response = await request(app)
        .post('/api/v1/videos/upload')
        .set('Authorization', `Bearer ${loginRes.body.token}`)
        .attach('video', Buffer.from('fake video data'), 'test.mp4');

      expect(response.statusCode).toBe(403);
    });
  });

  describe('GET /api/v1/videos/:videoId/status', () => {
    beforeEach(async () => {
      // Create a test video
      const video = new Video({
        filename: 'test-video.mp4',
        originalName: 'test.mp4',
        size: 1000000,
        mimeType: 'video/mp4',
        duration: 60,
        ownerId: userId,
        tenantId,
        processingStatus: 'pending',
        sensitivityStatus: 'pending',
      });
      await video.save();
      videoId = video._id;
    });

    it('should get video status', async () => {
      const response = await request(app)
        .get(`/api/v1/videos/${videoId}/status`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.processingStatus).toBe('pending');
    });

    it('should return 404 for non-existent video', async () => {
      const response = await request(app)
        .get('/api/v1/videos/999999999999999999999999/status')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.statusCode).toBe(404);
    });
  });

  describe('GET /api/v1/videos/:videoId/stream', () => {
    it('should prevent streaming of non-completed videos', async () => {
      const video = new Video({
        filename: 'test-video.mp4',
        originalName: 'test.mp4',
        size: 1000000,
        mimeType: 'video/mp4',
        duration: 60,
        ownerId: userId,
        tenantId,
        processingStatus: 'processing',
        sensitivityStatus: 'pending',
        filePath: './nonexistent-file.mp4',
      });
      await video.save();

      const response = await request(app)
        .get(`/api/v1/videos/${video._id}/stream`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.statusCode).toBe(400);
      expect(response.body.error).toContain('still processing');
    });
  });
});

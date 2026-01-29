/**
 * Basic Test Suite for Authentication
 */
import request from 'supertest';
import { createApp } from '../src/app.js';
import { initializeDatabase, closeDatabase } from '../src/config/database.js';
import User from '../src/models/User.js';
import Tenant from '../src/models/Tenant.js';

describe('Authentication', () => {
  let app;
  let authToken;
  let userId;
  let tenantId;

  beforeAll(async () => {
    await initializeDatabase();
    app = createApp();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  afterEach(async () => {
    // Clean up test data
    await User.deleteMany({});
    await Tenant.deleteMany({});
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
          tenantName: 'Test Workspace',
        });

      expect(response.statusCode).toBe(201);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.tenant.name).toBeDefined();

      authToken = response.body.token;
      userId = response.body.user._id;
      tenantId = response.body.tenant.id;
    });

    it('should not register with invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalidemail',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
          tenantName: 'Test Workspace',
        });

      expect(response.statusCode).toBe(400);
    });

    it('should not register with short password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'short',
          firstName: 'John',
          lastName: 'Doe',
          tenantName: 'Test Workspace',
        });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Create a user first
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
          tenantName: 'Test Workspace',
        });
    });

    it('should login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should not login with wrong password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        });

      expect(response.statusCode).toBe(401);
    });

    it('should not login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should get current user with valid token', async () => {
      // Register first
      const registerRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
          tenantName: 'Test Workspace',
        });

      const token = registerRes.body.token;

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should not get user without token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me');

      expect(response.statusCode).toBe(401);
    });
  });
});

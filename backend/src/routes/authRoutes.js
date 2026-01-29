import express from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

/**
 * POST /api/v1/auth/register
 * Register a new user
 * 
 * Two scenarios:
 * 1. Create new workspace: { email, password, firstName, lastName, tenantName }
 * 2. Join existing workspace: { email, password, firstName, lastName, tenantId, inviteCode }
 */
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('firstName').notEmpty().trim(),
    body('lastName').notEmpty().trim(),
    // tenantName required only if tenantId not provided
    body('tenantName')
  .if((value, { req }) => !req.body.tenantId)
  .notEmpty()
  .withMessage('tenantName is required when tenantId is not provided')
  .trim(),

  ],
  handleValidationErrors,
  authController.register
);

/**
 * POST /api/v1/auth/login
 * Login user
 */
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  handleValidationErrors,
  authController.login
);

/**
 * GET /api/v1/auth/me
 * Get current user
 */
router.get('/me', authenticate, authController.getCurrentUser);

/**
 * PUT /api/v1/auth/profile
 * Update user profile
 */
router.put(
  '/profile',
  authenticate,
  [
    body('firstName').optional().notEmpty().trim(),
    body('lastName').optional().notEmpty().trim(),
  ],
  handleValidationErrors,
  authController.updateProfile
);

/**
 * POST /api/v1/auth/invite
 * Invite a user to tenant (admin only)
 * Body: { email, role: 'viewer'|'editor'|'admin' (default: 'editor') }
 */
router.post(
  '/invite',
  authenticate,
  [
    body('email').isEmail().normalizeEmail(),
    body('role').optional().isIn(['viewer', 'editor', 'admin']),
  ],
  handleValidationErrors,
  authController.inviteUser
);

/**
 * GET /api/v1/auth/team
 * Get all team members (accessible to all members)
 */
router.get('/team', authenticate, authController.getTeamMembers);

/**
 * GET /api/v1/auth/tenant-info/:tenantId
 * Get tenant info for invite registration (public endpoint)
 * Query: email, inviteCode
 */
router.get('/tenant-info/:tenantId', authController.getTenantInfo);

/**
 * GET /api/v1/auth/all-users
 * Get all registered users (excluding current workspace members) (admin only)
 */
router.get(
  '/all-users',
  authenticate,
  authController.getAllUsers
);

/**
 * POST /api/v1/auth/add-user-to-workspace
 * Add existing user to workspace (admin only) - allows multi-workspace membership
 * Body: { userId, role: 'viewer'|'editor'|'admin' (default: 'editor') }
 */
router.post(
  '/add-user-to-workspace',
  authenticate,
  [
    body('userId').notEmpty(),
    body('role').optional().isIn(['viewer', 'editor', 'admin']),
  ],
  handleValidationErrors,
  authController.addUserToWorkspace
);

export default router;

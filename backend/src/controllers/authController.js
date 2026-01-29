import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import Tenant from '../models/Tenant.js';
import Invite from '../models/Invite.js';
import { generateToken } from '../utils/jwt.js';

/**
 * Register a new user
 * POST /api/v1/auth/register
 * 
 * Supports two scenarios:
 * 1. Create new account + new workspace (no tenantId in body)
 * 2. Create new account in existing workspace (tenantId + inviteCode in body)
 */
export const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { email, password, firstName, lastName, tenantName, tenantId, inviteCode } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    let tenant;
    let role = 'editor'; // Default role for invited users

    if (tenantId && inviteCode) {
      // SCENARIO 2: Joining existing workspace via invite
      tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      // Look up invite record to get the intended role
      const invite = await Invite.findOne({
        email,
        tenantId,
        inviteCode,
        status: 'pending',
      });

      if (!invite) {
        return res.status(401).json({ error: 'Invalid or expired invite code' });
      }

      // Check if invite has expired
      if (new Date() > invite.expiresAt) {
        return res.status(401).json({ error: 'Invite has expired' });
      }

      // Use the role specified in the invite (admin selected viewer/editor/admin)
      role = invite.role;
    } else if (!tenantName) {
      // SCENARIO 1: Creating new workspace - tenantName is required
      return res.status(400).json({ error: 'tenantName is required for new workspace' });
    } else {
      // SCENARIO 1: Creating new workspace
      tenant = new Tenant({
        name: tenantName,
        ownerId: null, // Will be set after user creation
      });

      // First user in new workspace is admin
      role = 'admin';
    }

    // Create user with appropriate role
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      tenantId: tenant._id,
      role, // 'admin' for new workspace, 'viewer'/'editor'/'admin' for invited users
    });

    // If creating new workspace, set this user as owner
    if (role === 'admin' && !tenant.ownerId) {
      tenant.ownerId = user._id;
    }

    // Save both
    await user.save();
    await tenant.save();

    // Mark invite as accepted if it exists
    if (tenantId && inviteCode) {
      await Invite.findOneAndUpdate(
        {
          email,
          tenantId,
          inviteCode,
        },
        { status: 'accepted' }
      );
    }

    // Generate token
    const token = generateToken(user._id, tenant._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: user.toJSON(),
      tenant: {
        id: tenant._id,
        name: tenant.name,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
};

/**
 * Login user
 * POST /api/v1/auth/login
 */
export const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'User account is inactive' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id, user.tenantId);

    // Fetch tenant info
    const tenant = await Tenant.findById(user.tenantId);

    res.json({
      message: 'Login successful',
      token,
      user: user.toJSON(),
      tenant: {
        id: tenant._id,
        name: tenant.name,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Login failed' });
  }
};

/**
 * Get current user
 * GET /api/v1/auth/me
 */
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const tenant = await Tenant.findById(req.tenantId);

    res.json({
      user: user.toJSON(),
      tenant: {
        id: tenant._id,
        name: tenant.name,
        maxStorageGB: tenant.maxStorageGB,
        usedStorageGB: tenant.usedStorageGB,
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

/**
 * Update user profile
 * PUT /api/v1/auth/profile
 */
export const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { firstName, lastName },
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Profile updated successfully',
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

/**
 * Get team members
 * GET /api/v1/auth/team
 * Returns all members of the user's tenant
 */
export const getTeamMembers = async (req, res) => {
  try {
    // Find users who are members of this workspace either via primary tenantId
    // or via the workspaces array (supporting multi-workspace membership)
    const members = await User.find({
      $or: [
        { tenantId: req.tenantId },
        { 'workspaces.tenantId': req.tenantId },
      ],
    }).select('-password').sort({ createdAt: 1 });

    const mapped = members.map((m) => {
      // Determine role for this tenant
      let roleInTenant = m.role; // fallback to primary role

      if (m.tenantId && m.tenantId.toString() === req.tenantId.toString()) {
        roleInTenant = m.role;
      } else if (m.workspaces && m.workspaces.length) {
        const w = m.workspaces.find(w => w.tenantId.toString() === req.tenantId.toString());
        if (w) roleInTenant = w.role;
      }

      return {
        _id: m._id,
        email: m.email,
        firstName: m.firstName,
        lastName: m.lastName,
        role: roleInTenant,
        isActive: m.isActive,
        createdAt: m.createdAt,
        lastLogin: m.lastLogin,
      };
    });

    res.json({ members: mapped });
  } catch (error) {
    console.error('Get team members error:', error);
    res.status(500).json({ error: 'Failed to fetch team members' });
  }
};

/**
 * Invite a user to tenant
 * POST /api/v1/auth/invite
 * Only admins can invite users
 * Returns inviteCode that user must use during registration
 */
export const inviteUser = async (req, res) => {
  try {
    // Check if current user is admin in this workspace
    const currentUser = await User.findById(req.user._id);
    const isAdminInWorkspace = currentUser.role === 'admin' || 
      (currentUser.workspaces && currentUser.workspaces.some(w => 
        w.tenantId.toString() === req.tenantId.toString() && w.role === 'admin'
      ));

    if (!isAdminInWorkspace) {
      return res.status(403).json({ error: 'Only admins can invite users' });
    }

    const { email, role = 'editor' } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!['viewer', 'editor', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already registered' });
    }

    // Generate invite code - 8 character alphanumeric
    const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    // Create invite record
    const invite = new Invite({
      email,
      tenantId: req.tenantId,
      inviteCode,
      role,
      invitedBy: req.user._id,
      status: 'pending',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    await invite.save();

    // Get tenant name for registration URL
    const tenant = await Tenant.findById(req.tenantId);

    const inviteData = {
      email,
      inviteCode,
      role,
      tenantId: req.tenantId,
      tenantName: tenant?.name,
    };

    res.json({ inviteData });
  }catch (error) {
    console.error('Invite user error:', error);
    res.status(500).json({ error: error.message || 'Failed to invite user' });
  }
};

/**
 * Get tenant info for invite registration (public endpoint)
 * GET /api/v1/auth/tenant-info/:tenantId
 * Used by invited users during registration to see workspace name and their role
 */
export const getTenantInfo = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { email, inviteCode } = req.query;

    if (!tenantId || !email || !inviteCode) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Look up the invite to verify it's valid and get role
    const invite = await Invite.findOne({
      email,
      tenantId,
      inviteCode,
      status: 'pending',
    });

    if (!invite) {
      return res.status(401).json({ error: 'Invalid or expired invite code' });
    }

    res.json({
      tenantId: tenant._id,
      tenantName: tenant.name,
      inviteEmail: email,
      inviteRole: invite.role,
    });
  } catch (error) {
    console.error('Get tenant info error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch tenant info' });
  }
};

/**
 * Get all registered users (excluding current workspace members)
 * GET /api/v1/auth/all-users
 */
export const getAllUsers = async (req, res) => {
  try {
    // Check if user is admin in current workspace
    const user = await User.findById(req.user._id);
    
    // Check if user has admin role in current workspace
    const isAdminInWorkspace = user.role === 'admin' || 
      (user.workspaces && user.workspaces.some(w => 
        w.tenantId.toString() === req.tenantId.toString() && w.role === 'admin'
      ));

    if (!isAdminInWorkspace) {
      return res.status(403).json({ error: 'Only admins can view users' });
    }

    // Get all users and check if they're already in current workspace
    const allUsers = await User.find({ isActive: true }).select('_id email firstName lastName');
    
    // Get current workspace members (either primary tenantId or workspaces array)
    const currentMembers = await User.find({
      $or: [
        { tenantId: req.tenantId },
        { 'workspaces.tenantId': req.tenantId },
      ],
    }).select('_id');

    const memberIds = currentMembers.map(m => m._id.toString());

    // Filter out current workspace members from all users
    const availableUsers = allUsers.filter(user => !memberIds.includes(user._id.toString()));

    res.json({ users: availableUsers });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch users' });
  }
};

/**
 * Add existing user to workspace (allow multi-workspace membership)
 * POST /api/v1/auth/add-user-to-workspace
 * Body: { userId, role }
 */
export const addUserToWorkspace = async (req, res) => {
  try {
    // Check if current user is admin in this workspace
    const currentUser = await User.findById(req.user._id);
    const isAdminInWorkspace = currentUser.role === 'admin' || 
      (currentUser.workspaces && currentUser.workspaces.some(w => 
        w.tenantId.toString() === req.tenantId.toString() && w.role === 'admin'
      ));

    if (!isAdminInWorkspace) {
      return res.status(403).json({ error: 'Only admins can add users to workspace' });
    }

    const { userId, role = 'editor' } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const validRoles = ['viewer', 'editor', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }

    // Get the user to add
    const userToAdd = await User.findById(userId);
    if (!userToAdd) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is already in this workspace
    const alreadyMember = userToAdd.tenantId.toString() === req.tenantId.toString() || 
      (userToAdd.workspaces && userToAdd.workspaces.some(
        w => w.tenantId.toString() === req.tenantId.toString()
      ));
    
    if (alreadyMember) {
      return res.status(400).json({ error: 'User is already a member of this workspace' });
    }

    // Get tenant info
    const tenant = await Tenant.findById(req.tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Add workspace to user's workspaces array
    if (!userToAdd.workspaces) {
      userToAdd.workspaces = [];
    }
    
    userToAdd.workspaces.push({
      tenantId: req.tenantId,
      role: role,
      joinedAt: new Date(),
    });
    
    await userToAdd.save();

    res.json({
      message: 'User added to workspace successfully',
      user: {
        _id: userToAdd._id,
        email: userToAdd.email,
        firstName: userToAdd.firstName,
        lastName: userToAdd.lastName,
        role: role,
      }
    });
  } catch (error) {
    console.error('Add user to workspace error:', error);
    res.status(500).json({ error: error.message || 'Failed to add user to workspace' });
  }
};

export default { register, login, getCurrentUser, updateProfile, inviteUser, getTeamMembers, getTenantInfo, getAllUsers, addUserToWorkspace };

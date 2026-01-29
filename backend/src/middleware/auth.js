import User from '../models/User.js';
import { extractTokenFromHeader, verifyToken } from '../utils/jwt.js';

/**
 * Authenticate user from JWT token
 * Middleware to verify JWT and attach user to request
 * Supports token from Authorization header or ?token= query parameter
 */
export const authenticate = async (req, res, next) => {
  try {
    // Try to get token from Authorization header first, then from query params
    let token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token && req.query.token) {
      token = req.query.token;
    }
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Fetch user from database
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    // Attach user and tenantId to request
    req.user = user;
    req.tenantId = decoded.tenantId;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

/**
 * Authorize user based on role
 * Usage: authorize('admin', 'editor')
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Access denied. Required roles: ${allowedRoles.join(', ')}` 
      });
    }

    next();
  };
};

export default { authenticate, authorize };

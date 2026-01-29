import jwt from 'jsonwebtoken';
import config from '../config/index.js';

/**
 * Generate JWT token
 */
export const generateToken = (userId, tenantId) => {
  return jwt.sign(
    { userId, tenantId },
    config.jwtSecret,
    { expiresIn: config.jwtExpire }
  );
};

/**
 * Verify JWT token
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (error) {
    return null;
  }
};

/**
 * Extract token from Authorization header
 */
export const extractTokenFromHeader = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
};

export default { generateToken, verifyToken, extractTokenFromHeader };

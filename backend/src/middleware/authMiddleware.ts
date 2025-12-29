import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractToken } from '../utils/jwt';
import { UserRole } from '../types';

/**
 * Authentication Middleware
 * 
 * Middleware functions that protect routes and verify user permissions.
 * 
 * How middleware works:
 * 1. Request comes in
 * 2. Middleware runs (checks authentication)
 * 3. If successful, passes control to next handler (next())
 * 4. If fails, sends error response and stops
 */

/**
 * Authenticate User
 * 
 * Verifies that the request contains a valid JWT token.
 * If valid, adds user info to req.user for use in route handlers.
 * 
 * Usage:
 * router.get('/protected', authenticate, controller);
 * 
 * The controller can then access req.user
 */
export const authenticate = (
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  try {
    // Step 1: Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = extractToken(authHeader);
    
    // Step 2: Check if token exists
    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
        error: 'NO_TOKEN'
      });
      return;
    }
    
    // Step 3: Verify token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token.',
        error: 'INVALID_TOKEN'
      });
      return;
    }
    
    // Step 4: Attach user info to request object
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };
    
    // Step 5: Pass control to next handler
    next();
    
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: 'AUTH_ERROR'
    });
  }
};

/**
 * Authorize by Role
 * 
 * Checks if authenticated user has one of the required roles.
 * Must be used AFTER authenticate middleware.
 * 
 * @param allowedRoles - Array of roles that can access the route
 * @returns Middleware function
 * 
 * Usage:
 * router.get('/admin-only', authenticate, authorize(['admin']), controller);
 * router.get('/approvers-and-admins', authenticate, authorize(['approver', 'admin']), controller);
 */
export const authorize = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Check if user is authenticated (should be set by authenticate middleware)
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
        error: 'NOT_AUTHENTICATED'
      });
      return;
    }
    
    // Check if user's role is in allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
        error: 'FORBIDDEN'
      });
      return;
    }
    
    // User has required role, continue
    next();
  };
};

/**
 * Optional Authentication
 * 
 * Checks for authentication but doesn't fail if token is missing.
 * Sets req.user if token is valid, otherwise leaves it undefined.
 * 
 * Useful for routes that work differently for authenticated vs anonymous users.
 * 
 * Usage:
 * router.get('/public-but-personalized', optionalAuth, controller);
 */
export const optionalAuth = (
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractToken(authHeader);
    
    // If no token, just continue without setting req.user
    if (!token) {
      next();
      return;
    }
    
    // If token exists, try to verify it
    const decoded = verifyToken(token);
    
    if (decoded) {
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role
      };
    }
    
    // Continue regardless of token validity
    next();
    
  } catch (error) {
    // Don't fail, just continue without authentication
    next();
  }
};

/**
 * Check if User is Owner or Admin
 * 
 * Verifies that the authenticated user is either:
 * 1. The owner of a resource (userId matches)
 * 2. An admin
 * 
 * @param resourceUserId - The user ID of the resource owner
 * @returns true if authorized, false otherwise
 */
export const isOwnerOrAdmin = (
  req: Request, 
  resourceUserId: string
): boolean => {
  if (!req.user) {
    return false;
  }
  
  // Admin can access everything
  if (req.user.role === 'admin') {
    return true;
  }
  
  // User can access their own resources
  return req.user.userId === resourceUserId;
};

/**
 * Check if User is Admin
 * 
 * Simple helper to check if current user is an admin.
 */
export const isAdmin = (req: Request): boolean => {
  return req.user?.role === 'admin';
};

/**
 * Check if User is Approver or Admin
 * 
 * Checks if user has approval permissions.
 */
export const isApproverOrAdmin = (req: Request): boolean => {
  if (!req.user) {
    return false;
  }
  
  return req.user.role === 'approver' || req.user.role === 'admin';
};
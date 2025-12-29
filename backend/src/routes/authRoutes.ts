import { Router } from 'express';
import {
  login,
  register,
  getCurrentUser,
  logout
} from '../controllers/authController';
import { authenticate, authorize } from '../middleware/authMiddleware';

/**
 * Authentication Routes
 * 
 * Defines all authentication-related endpoints.
 * 
 * Route structure:
 * - Public routes: No authentication required
 * - Protected routes: Require valid JWT token
 * - Admin routes: Require admin role
 */

const router = Router();

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and get token
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Private/Admin only
 * 
 * Flow:
 * 1. authenticate middleware checks for valid token
 * 2. authorize(['admin']) checks if user is admin
 * 3. register controller creates new user
 */
router.post('/register', authenticate, authorize(['admin']), register);

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user
 * @access  Private
 * 
 * Returns fresh user data from database.
 * Useful for checking if token is still valid.
 */
router.get('/me', authenticate, getCurrentUser);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 * 
 * Note: With JWT, actual logout happens client-side
 * by deleting the token. This endpoint is for consistency.
 */
router.post('/logout', authenticate, logout);

export default router;
import { Router } from 'express';
import {
  getUsers,
  getUserById,
  updateUserById,
  deleteUserById,
  getApprovers,
  getUserStats
} from '../controllers/userController';
import { authenticate, authorize } from '../middleware/authMiddleware';

/**
 * User Management Routes
 * 
 * Defines all user-related endpoints.
 * 
 * Authentication levels:
 * - Public: No authentication required
 * - Private: Valid JWT token required
 * - Admin: Admin role required
 */

const router = Router();

// ============================================================================
// SPECIAL ROUTES (Must be defined BEFORE :id routes)
// ============================================================================

/**
 * @route   GET /api/users/approvers
 * @desc    Get list of all approvers (users with approver or admin role)
 * @access  Private
 * 
 * Used in travel request forms to populate approver dropdown.
 * Any authenticated user can access this.
 */
router.get('/approvers', authenticate, getApprovers);

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics
 * @access  Private/Admin
 * 
 * Returns counts of users by role and status.
 * Admin only.
 */
router.get('/stats', authenticate, authorize(['admin']), getUserStats);

// ============================================================================
// STANDARD CRUD ROUTES
// ============================================================================

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Private/Admin
 * 
 * Query parameters:
 * - role: Filter by role (user, approver, admin)
 * - active: Filter by active status (true, false)
 * 
 * Examples:
 * - GET /api/users
 * - GET /api/users?role=approver
 * - GET /api/users?active=true
 * - GET /api/users?role=user&active=false
 */
router.get('/', authenticate, authorize(['admin']), getUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private/Admin or Self
 * 
 * Admins can view any user.
 * Regular users can only view their own profile.
 */
router.get('/:id', authenticate, getUserById);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user information
 * @access  Private/Admin or Self (limited)
 * 
 * Admins can update all fields:
 * - email, first_name, last_name, role, is_active
 * 
 * Regular users can only update:
 * - first_name, last_name
 * 
 * Body:
 * {
 *   "first_name": "John",
 *   "last_name": "Doe",
 *   "email": "john.new@company.com",  // Admin only
 *   "role": "approver",                // Admin only
 *   "is_active": true                  // Admin only
 * }
 */
router.put('/:id', authenticate, updateUserById);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Private/Admin
 * 
 * Query parameters:
 * - hard: If 'true', permanently delete user (fails if user has travel requests)
 * - If omitted, performs soft delete (sets is_active = false)
 * 
 * Examples:
 * - DELETE /api/users/:id           (soft delete)
 * - DELETE /api/users/:id?hard=true (hard delete)
 */
router.delete('/:id', authenticate, authorize(['admin']), deleteUserById);

export default router;
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import {
  getAllUsers,
  findUserById,
  updateUser,
  softDeleteUser,
  hardDeleteUser,
  getUsersByRole,
  emailExists,
  countUsers
} from '../models/userModel';
import { sanitizeUser } from '../utils/helpers';
import { isValidEmail } from '../utils/helpers';
import { UserUpdateData } from '../types';

/**
 * User Management Controller
 * 
 * Handles user CRUD operations:
 * - Get all users
 * - Get user by ID
 * - Update user
 * - Delete user
 * - Get approvers list
 * - Get user statistics
 */

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10');

/**
 * Get All Users
 * 
 * Returns a list of all users.
 * Can be filtered by role and active status.
 * 
 * Route: GET /api/users?role=approver&active=true
 * 
 * @route GET /api/users
 * @access Private/Admin
 */
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    // Extract query parameters
    const role = req.query.role as string | undefined;
    const activeParam = req.query.active as string | undefined;
    
    // Parse active status
    let isActive: boolean | undefined;
    if (activeParam === 'true') isActive = true;
    if (activeParam === 'false') isActive = false;
    
    // Validate role if provided
    if (role && !['user', 'approver', 'admin'].includes(role)) {
      res.status(400).json({
        success: false,
        message: 'Invalid role parameter',
        error: 'INVALID_ROLE'
      });
      return;
    }
    
    // Fetch users from database
    const users = await getAllUsers({
      role: role as any,
      is_active: isActive
    });
    
    // Remove sensitive data from all users
    const safeUsers = users.map(sanitizeUser);
    
    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: {
        users: safeUsers,
        count: safeUsers.length
      }
    });
    
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve users',
      error: 'SERVER_ERROR'
    });
  }
};

/**
 * Get User by ID
 * 
 * Returns a specific user's details.
 * 
 * Route: GET /api/users/:id
 * 
 * @route GET /api/users/:id
 * @access Private/Admin or Self
 */
export const getUserById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Validate that user is either admin or requesting their own data
    const isAdmin = req.user?.role === 'admin';
    const isSelf = req.user?.userId === id;
    
    if (!isAdmin && !isSelf) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Can only view own profile.',
        error: 'FORBIDDEN'
      });
      return;
    }
    
    // Fetch user from database
    const user = await findUserById(id);
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
      return;
    }
    
    // Remove sensitive data
    const safeUser = sanitizeUser(user);
    
    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: {
        user: safeUser
      }
    });
    
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user',
      error: 'SERVER_ERROR'
    });
  }
};

/**
 * Update User
 * 
 * Updates user information.
 * Admins can update any user.
 * Users can only update their own first_name and last_name.
 * 
 * Route: PUT /api/users/:id
 * Body: { first_name?, last_name?, email?, role?, is_active? }
 * 
 * @route PUT /api/users/:id
 * @access Private/Admin or Self (limited)
 */
export const updateUserById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData: UserUpdateData = req.body;
    
    // Check authorization
    const isAdmin = req.user?.role === 'admin';
    const isSelf = req.user?.userId === id;
    
    if (!isAdmin && !isSelf) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
        error: 'FORBIDDEN'
      });
      return;
    }
    
    // Check if user exists
    const existingUser = await findUserById(id);
    if (!existingUser) {
      res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
      return;
    }
    
    // If not admin, restrict what can be updated
    if (!isAdmin) {
      // Regular users can only update first_name and last_name
      const allowedFields: UserUpdateData = {
        first_name: updateData.first_name,
        last_name: updateData.last_name
      };
      
      // Remove any other fields
      Object.keys(updateData).forEach(key => {
        if (key !== 'first_name' && key !== 'last_name') {
          delete (updateData as any)[key];
        }
      });
    }
    
    // Validate email if provided
    if (updateData.email) {
      if (!isValidEmail(updateData.email)) {
        res.status(400).json({
          success: false,
          message: 'Invalid email format',
          error: 'INVALID_EMAIL'
        });
        return;
      }
      
      // Check if email already exists (excluding current user)
      const exists = await emailExists(updateData.email, id);
      if (exists) {
        res.status(409).json({
          success: false,
          message: 'Email already in use',
          error: 'EMAIL_EXISTS'
        });
        return;
      }
    }
    
    // Validate role if provided
    if (updateData.role && !['user', 'approver', 'admin'].includes(updateData.role)) {
      res.status(400).json({
        success: false,
        message: 'Invalid role',
        error: 'INVALID_ROLE'
      });
      return;
    }
    
    // Prevent admin from deactivating themselves
    if (isAdmin && isSelf && updateData.is_active === false) {
      res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account',
        error: 'CANNOT_DEACTIVATE_SELF'
      });
      return;
    }
    
    // Update user
    const updatedUser = await updateUser(id, updateData);
    
    if (!updatedUser) {
      res.status(500).json({
        success: false,
        message: 'Failed to update user',
        error: 'UPDATE_FAILED'
      });
      return;
    }
    
    // Remove sensitive data
    const safeUser = sanitizeUser(updatedUser);
    
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        user: safeUser
      }
    });
    
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: 'SERVER_ERROR'
    });
  }
};

/**
 * Delete User
 * 
 * Soft deletes a user (sets is_active = false).
 * Admin only.
 * 
 * Route: DELETE /api/users/:id?hard=true
 * Query: hard=true for permanent deletion
 * 
 * @route DELETE /api/users/:id
 * @access Private/Admin only
 */
export const deleteUserById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const hardDelete = req.query.hard === 'true';
    
    // Prevent admin from deleting themselves
    if (req.user?.userId === id) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete your own account',
        error: 'CANNOT_DELETE_SELF'
      });
      return;
    }
    
    // Check if user exists
    const user = await findUserById(id);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
      return;
    }
    
    let success: boolean;
    let message: string;
    
    if (hardDelete) {
      // Permanent deletion (will fail if user has travel requests)
      success = await hardDeleteUser(id);
      message = success
        ? 'User permanently deleted'
        : 'Cannot delete user with existing travel requests';
    } else {
      // Soft delete (deactivate)
      success = await softDeleteUser(id);
      message = success
        ? 'User deactivated successfully'
        : 'Failed to deactivate user';
    }
    
    if (!success) {
      res.status(400).json({
        success: false,
        message,
        error: 'DELETE_FAILED'
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      message,
      data: {
        userId: id,
        deleted: success
      }
    });
    
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: 'SERVER_ERROR'
    });
  }
};

/**
 * Get Approvers List
 * 
 * Returns all users with 'approver' or 'admin' role.
 * Used in travel request forms to select an approver.
 * 
 * Route: GET /api/users/approvers
 * 
 * @route GET /api/users/approvers
 * @access Private
 */
export const getApprovers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Get approvers and admins
    const approvers = await getUsersByRole('approver');
    const admins = await getUsersByRole('admin');
    
    // Combine and remove sensitive data
    const allApprovers = [...approvers, ...admins].map(sanitizeUser);
    
    // Sort by name
    allApprovers.sort((a, b) => {
      const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
      const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });
    
    res.status(200).json({
      success: true,
      message: 'Approvers retrieved successfully',
      data: {
        approvers: allApprovers,
        count: allApprovers.length
      }
    });
    
  } catch (error) {
    console.error('Get approvers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve approvers',
      error: 'SERVER_ERROR'
    });
  }
};

/**
 * Get User Statistics
 * 
 * Returns statistics about users in the system.
 * Admin only.
 * 
 * Route: GET /api/users/stats
 * 
 * @route GET /api/users/stats
 * @access Private/Admin
 */
export const getUserStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const totalUsers = await countUsers(false);
    const activeUsers = await countUsers(true);
    
    const regularUsers = await getUsersByRole('user');
    const approvers = await getUsersByRole('approver');
    const admins = await getUsersByRole('admin');
    
    res.status(200).json({
      success: true,
      message: 'User statistics retrieved successfully',
      data: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
        byRole: {
          users: regularUsers.length,
          approvers: approvers.length,
          admins: admins.length
        }
      }
    });
    
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve statistics',
      error: 'SERVER_ERROR'
    });
  }
};
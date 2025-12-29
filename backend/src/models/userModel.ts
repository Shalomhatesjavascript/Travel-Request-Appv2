import { query } from '../config/database';
import { User, UserRole, UserRegistrationData, UserUpdateData } from '../types';

/**
 * User Model
 * 
 * Handles all database operations related to users.
 * This is the ONLY place where we directly query the users table.
 * 
 * Benefits:
 * - Centralized database logic
 * - Reusable functions
 * - Easier to test
 * - Single source of truth
 */

/**
 * Find User by ID
 * 
 * @param userId - User's unique ID
 * @returns User object or null if not found
 */
export const findUserById = async (userId: string): Promise<User | null> => {
  const result = await query(
    'SELECT * FROM users WHERE id = $1',
    [userId]
  );
  
  return result.rows[0] || null;
};

/**
 * Find User by Email
 * 
 * Used during login to check if user exists.
 * 
 * @param email - User's email address
 * @returns User object or null if not found
 */
export const findUserByEmail = async (email: string): Promise<User | null> => {
  const result = await query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  
  return result.rows[0] || null;
};

/**
 * Create New User
 * 
 * Inserts a new user into the database.
 * 
 * @param userData - User registration data
 * @returns Created user object
 */
export const createUser = async (
  userData: UserRegistrationData
): Promise<User> => {
  const { email, password, first_name, last_name, role } = userData;
  
  const result = await query(
    `INSERT INTO users (email, password_hash, first_name, last_name, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [email, password, first_name, last_name, role]
  );
  
  return result.rows[0];
};

/**
 * Update User
 * 
 * Updates user information.
 * Only updates fields that are provided.
 * 
 * @param userId - User's ID
 * @param updateData - Fields to update
 * @returns Updated user object or null if not found
 */
export const updateUser = async (
  userId: string,
  updateData: UserUpdateData
): Promise<User | null> => {
  // Build dynamic UPDATE query based on provided fields
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;
  
  // Add each provided field to the query
  if (updateData.email !== undefined) {
    fields.push(`email = $${paramCount}`);
    values.push(updateData.email);
    paramCount++;
  }
  
  if (updateData.first_name !== undefined) {
    fields.push(`first_name = $${paramCount}`);
    values.push(updateData.first_name);
    paramCount++;
  }
  
  if (updateData.last_name !== undefined) {
    fields.push(`last_name = $${paramCount}`);
    values.push(updateData.last_name);
    paramCount++;
  }
  
  if (updateData.role !== undefined) {
    fields.push(`role = $${paramCount}`);
    values.push(updateData.role);
    paramCount++;
  }
  
  if (updateData.is_active !== undefined) {
    fields.push(`is_active = $${paramCount}`);
    values.push(updateData.is_active);
    paramCount++;
  }
  
  // If no fields to update, return current user
  if (fields.length === 0) {
    return await findUserById(userId);
  }
  
  // Add userId as the last parameter
  values.push(userId);
  
  const queryText = `
    UPDATE users 
    SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $${paramCount}
    RETURNING *
  `;
  
  const result = await query(queryText, values);
  
  return result.rows[0] || null;
};

/**
 * Delete User (Soft Delete)
 * 
 * Deactivates a user instead of deleting from database.
 * This preserves data integrity (travel requests reference users).
 * 
 * @param userId - User's ID
 * @returns true if successful, false if user not found
 */
export const softDeleteUser = async (userId: string): Promise<boolean> => {
  const result = await query(
    'UPDATE users SET is_active = false WHERE id = $1 RETURNING id',
    [userId]
  );
  
  return result.rowCount > 0;
};

/**
 * Hard Delete User
 * 
 * PERMANENTLY deletes a user from the database.
 * ⚠️ USE WITH EXTREME CAUTION!
 * This will fail if the user has any travel requests (foreign key constraint).
 * 
 * @param userId - User's ID
 * @returns true if successful, false if user not found or has dependencies
 */
export const hardDeleteUser = async (userId: string): Promise<boolean> => {
  try {
    const result = await query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [userId]
    );
    
    return result.rowCount > 0;
  } catch (error) {
    // Foreign key constraint violation
    console.error('Cannot delete user with existing travel requests');
    return false;
  }
};

/**
 * Get All Users
 * 
 * Retrieves all users, optionally filtered by role or active status.
 * 
 * @param filters - Optional filters
 * @returns Array of users
 */
export const getAllUsers = async (filters?: {
  role?: UserRole;
  is_active?: boolean;
}): Promise<User[]> => {
  let queryText = 'SELECT * FROM users WHERE 1=1';
  const values: any[] = [];
  let paramCount = 1;
  
  // Add role filter if provided
  if (filters?.role) {
    queryText += ` AND role = $${paramCount}`;
    values.push(filters.role);
    paramCount++;
  }
  
  // Add active status filter if provided
  if (filters?.is_active !== undefined) {
    queryText += ` AND is_active = $${paramCount}`;
    values.push(filters.is_active);
    paramCount++;
  }
  
  queryText += ' ORDER BY created_at DESC';
  
  const result = await query(queryText, values);
  
  return result.rows;
};

/**
 * Get Users by Role
 * 
 * Retrieves all users with a specific role.
 * Useful for getting list of approvers.
 * 
 * @param role - User role to filter by
 * @returns Array of users with that role
 */
export const getUsersByRole = async (role: UserRole): Promise<User[]> => {
  const result = await query(
    'SELECT * FROM users WHERE role = $1 AND is_active = true ORDER BY first_name, last_name',
    [role]
  );
  
  return result.rows;
};

/**
 * Update Password
 * 
 * Updates a user's password hash.
 * 
 * @param userId - User's ID
 * @param passwordHash - New password hash (already hashed!)
 * @returns true if successful, false if user not found
 */
export const updatePassword = async (
  userId: string,
  passwordHash: string
): Promise<boolean> => {
  const result = await query(
    'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [passwordHash, userId]
  );
  
  return result.rowCount > 0;
};

/**
 * Check if Email Exists
 * 
 * Checks if an email is already registered.
 * Useful during registration validation.
 * 
 * @param email - Email to check
 * @param excludeUserId - Optional user ID to exclude (for updates)
 * @returns true if email exists, false otherwise
 */
export const emailExists = async (
  email: string,
  excludeUserId?: string
): Promise<boolean> => {
  let queryText = 'SELECT id FROM users WHERE email = $1';
  const values: any[] = [email];
  
  if (excludeUserId) {
    queryText += ' AND id != $2';
    values.push(excludeUserId);
  }
  
  const result = await query(queryText, values);
  
  return result.rowCount > 0;
};

/**
 * Count Users
 * 
 * Returns the total number of users.
 * Optionally filtered by active status.
 * 
 * @param activeOnly - Only count active users
 * @returns Total user count
 */
export const countUsers = async (activeOnly: boolean = false): Promise<number> => {
  const queryText = activeOnly
    ? 'SELECT COUNT(*) as count FROM users WHERE is_active = true'
    : 'SELECT COUNT(*) as count FROM users';
  
  const result = await query(queryText);
  
  return parseInt(result.rows[0].count);
};
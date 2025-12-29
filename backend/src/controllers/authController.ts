import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { 
  findUserByEmail, 
  createUser, 
  findUserById,
  emailExists 
} from '../models/userModel';
import { generateToken } from '../utils/jwt';
import { sanitizeUser } from '../utils/helpers';
import { isValidEmail, validatePassword } from '../utils/helpers';
import { UserLoginData, UserRegistrationData } from '../types';

/**
 * Authentication Controller
 * 
 * Handles authentication-related requests:
 * - User login
 * - User registration (admin only)
 * - Get current user info
 * - Logout
 */

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10');

/**
 * Login User
 * 
 * Authenticates user and returns JWT token.
 * 
 * Route: POST /api/auth/login
 * Body: { email, password }
 * 
 * @route POST /api/auth/login
 * @access Public
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: UserLoginData = req.body;
    
    // Validation: Check if email and password are provided
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required',
        error: 'MISSING_FIELDS'
      });
      return;
    }
    
    // Validation: Check email format
    if (!isValidEmail(email)) {
      res.status(400).json({
        success: false,
        message: 'Invalid email format',
        error: 'INVALID_EMAIL'
      });
      return;
    }
    
    // Step 1: Find user by email
    const user = await findUserByEmail(email);
    
    if (!user) {
      // Don't reveal whether email exists (security best practice)
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        error: 'INVALID_CREDENTIALS'
      });
      return;
    }
    
    // Step 2: Check if user is active
    if (!user.is_active) {
      res.status(401).json({
        success: false,
        message: 'Account is deactivated. Contact administrator.',
        error: 'ACCOUNT_DEACTIVATED'
      });
      return;
    }
    
    // Step 3: Compare password with hash
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        error: 'INVALID_CREDENTIALS'
      });
      return;
    }
    
    // Step 4: Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });
    
    // Step 5: Remove sensitive data and send response
    const safeUser = sanitizeUser(user);
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: safeUser,
        token
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: 'SERVER_ERROR'
    });
  }
};

/**
 * Register User
 * 
 * Creates a new user account.
 * Only admins can register new users.
 * 
 * Route: POST /api/auth/register
 * Body: { email, password, first_name, last_name, role }
 * 
 * @route POST /api/auth/register
 * @access Private (Admin only)
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      email, 
      password, 
      first_name, 
      last_name, 
      role 
    }: UserRegistrationData = req.body;
    
    // Validation: Check required fields
    if (!email || !password || !first_name || !last_name || !role) {
      res.status(400).json({
        success: false,
        message: 'All fields are required',
        error: 'MISSING_FIELDS'
      });
      return;
    }
    
    // Validation: Check email format
    if (!isValidEmail(email)) {
      res.status(400).json({
        success: false,
        message: 'Invalid email format',
        error: 'INVALID_EMAIL'
      });
      return;
    }
    
    // Validation: Check password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      res.status(400).json({
        success: false,
        message: passwordValidation.message,
        error: 'WEAK_PASSWORD'
      });
      return;
    }
    
    // Validation: Check if email already exists
    const exists = await emailExists(email);
    if (exists) {
      res.status(409).json({
        success: false,
        message: 'Email already registered',
        error: 'EMAIL_EXISTS'
      });
      return;
    }
    
    // Validation: Check valid role
    const validRoles = ['user', 'approver', 'admin'];
    if (!validRoles.includes(role)) {
      res.status(400).json({
        success: false,
        message: 'Invalid role. Must be: user, approver, or admin',
        error: 'INVALID_ROLE'
      });
      return;
    }
    
    // Step 1: Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    
    // Step 2: Create user in database
    const newUser = await createUser({
      email,
      password: passwordHash,
      first_name,
      last_name,
      role
    });
    
    // Step 3: Remove sensitive data and send response
    const safeUser = sanitizeUser(newUser);
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: safeUser
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: 'SERVER_ERROR'
    });
  }
};

/**
 * Get Current User
 * 
 * Returns information about the authenticated user.
 * 
 * Route: GET /api/auth/me
 * 
 * @route GET /api/auth/me
 * @access Private
 */
export const getCurrentUser = async (
  req: Request, 
  res: Response
): Promise<void> => {
  try {
    // req.user is set by authenticate middleware
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated',
        error: 'NOT_AUTHENTICATED'
      });
      return;
    }
    
    // Fetch fresh user data from database
    const user = await findUserById(req.user.userId);
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
      return;
    }
    
    // Check if user is still active
    if (!user.is_active) {
      res.status(401).json({
        success: false,
        message: 'Account is deactivated',
        error: 'ACCOUNT_DEACTIVATED'
      });
      return;
    }
    
    const safeUser = sanitizeUser(user);
    
    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: {
        user: safeUser
      }
    });
    
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user',
      error: 'SERVER_ERROR'
    });
  }
};

/**
 * Logout User
 * 
 * Since we're using stateless JWT tokens, logout is handled
 * client-side by deleting the token.
 * 
 * This endpoint is here for consistency and can be used
 * for logging/analytics purposes.
 * 
 * Route: POST /api/auth/logout
 * 
 * @route POST /api/auth/logout
 * @access Private
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // With JWT, logout is client-side (delete token)
    // This endpoint exists for consistency and logging
    
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: 'SERVER_ERROR'
    });
  }
};
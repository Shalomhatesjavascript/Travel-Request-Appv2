import jwt from 'jsonwebtoken';
import { JWTPayload, DecodedJWT } from '../types';

/**
 * JWT Utility Functions
 * 
 * Handles creation and verification of JSON Web Tokens.
 * 
 * JWT Structure:
 * - Header: Algorithm and token type
 * - Payload: User data (what we encode)
 * - Signature: Verifies token hasn't been tampered with
 */

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '30m';

// Warn if using fallback secret (security risk!)
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  WARNING: Using fallback JWT_SECRET. Set JWT_SECRET in .env file!');
}

/**
 * Generate JWT Token
 * 
 * Creates a signed JWT token containing user information.
 * 
 * The token contains:
 * - userId: User's unique ID
 * - email: User's email
 * - role: User's permission level
 * 
 * The token is signed with JWT_SECRET and expires after JWT_EXPIRE time.
 * 
 * @param payload - User data to encode in token
 * @returns Signed JWT token string
 * 
 * @example
 * const token = generateToken({
 *   userId: 'user-123',
 *   email: 'john@example.com',
 *   role: 'user'
 * });
 */
export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(
    payload,           // Data to encode
    JWT_SECRET,        // Secret key
    { expiresIn: JWT_EXPIRE }  // Expiration time
  );
};

/**
 * Verify JWT Token
 * 
 * Verifies that a token:
 * 1. Was signed with our secret key
 * 2. Hasn't expired
 * 3. Hasn't been tampered with
 * 
 * @param token - JWT token string
 * @returns Decoded token payload or null if invalid
 * 
 * @example
 * const decoded = verifyToken(token);
 * if (decoded) {
 *   console.log('User ID:', decoded.userId);
 * } else {
 *   console.log('Invalid token');
 * }
 */
export const verifyToken = (token: string): DecodedJWT | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedJWT;
    return decoded;
  } catch (error) {
    // Token is invalid, expired, or tampered with
    return null;
  }
};

/**
 * Decode Token Without Verification
 * 
 * Decodes a token without verifying its signature.
 * USE WITH CAUTION! Only use when you need to inspect
 * an expired or invalid token.
 * 
 * @param token - JWT token string
 * @returns Decoded payload or null
 */
export const decodeToken = (token: string): DecodedJWT | null => {
  try {
    const decoded = jwt.decode(token) as DecodedJWT;
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Check if Token is Expired
 * 
 * Checks if a token has expired without verifying signature.
 * 
 * @param token - JWT token string
 * @returns true if expired, false otherwise
 */
export const isTokenExpired = (token: string): boolean => {
  const decoded = decodeToken(token);
  
  if (!decoded || !decoded.exp) {
    return true;
  }
  
  // exp is in seconds, Date.now() is in milliseconds
  const currentTime = Math.floor(Date.now() / 1000);
  
  return decoded.exp < currentTime;
};

/**
 * Get Token Expiration Time
 * 
 * Returns when a token will expire.
 * 
 * @param token - JWT token string
 * @returns Expiration date or null
 */
export const getTokenExpiration = (token: string): Date | null => {
  const decoded = decodeToken(token);
  
  if (!decoded || !decoded.exp) {
    return null;
  }
  
  // Convert seconds to milliseconds
  return new Date(decoded.exp * 1000);
};

/**
 * Extract Token from Authorization Header
 * 
 * Extracts JWT token from "Bearer <token>" format.
 * 
 * @param authHeader - Authorization header value
 * @returns Token string or null
 * 
 * @example
 * const token = extractToken('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
 * // Returns: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
 */
export const extractToken = (authHeader: string | undefined): string | null => {
  if (!authHeader) {
    return null;
  }
  
  // Check if header starts with "Bearer "
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  // Extract token (everything after "Bearer ")
  const token = authHeader.substring(7);
  
  return token || null;
};
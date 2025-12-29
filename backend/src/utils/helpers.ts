import { User, UserResponse } from '../types';

/**
 * Utility Helper Functions
 * 
 * Common functions used throughout the application.
 */

/**
 * Remove Sensitive User Data
 * 
 * Converts a User object (with password_hash) to a UserResponse
 * object (without password_hash).
 * 
 * NEVER send password hashes to the frontend!
 * 
 * @param user - User object from database
 * @returns User object without sensitive data
 */
export const sanitizeUser = (user: User): UserResponse => {
  // Destructure to extract password_hash and keep everything else
  const { password_hash, ...safeUser } = user;
  
  return safeUser as UserResponse;
};

/**
 * Validate Email Format
 * 
 * Checks if a string is a valid email address.
 * Uses a simple regex pattern.
 * 
 * @param email - Email string to validate
 * @returns true if valid, false otherwise
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate Password Strength
 * 
 * Checks if password meets security requirements:
 * - At least 8 characters
 * - Contains uppercase letter
 * - Contains lowercase letter
 * - Contains number
 * 
 * @param password - Password to validate
 * @returns Object with isValid flag and error message
 */
export const validatePassword = (password: string): { 
  isValid: boolean; 
  message?: string 
} => {
  if (password.length < 8) {
    return { 
      isValid: false, 
      message: 'Password must be at least 8 characters long' 
    };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { 
      isValid: false, 
      message: 'Password must contain at least one uppercase letter' 
    };
  }
  
  if (!/[a-z]/.test(password)) {
    return { 
      isValid: false, 
      message: 'Password must contain at least one lowercase letter' 
    };
  }
  
  if (!/[0-9]/.test(password)) {
    return { 
      isValid: false, 
      message: 'Password must contain at least one number' 
    };
  }
  
  return { isValid: true };
};

/**
 * Format Date to YYYY-MM-DD
 * 
 * Converts a Date object to a string in YYYY-MM-DD format.
 * 
 * @param date - Date object
 * @returns Date string in YYYY-MM-DD format
 */
export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Parse Date String
 * 
 * Safely converts a date string to a Date object.
 * Returns null if invalid.
 * 
 * @param dateString - Date string (YYYY-MM-DD)
 * @returns Date object or null
 */
export const parseDate = (dateString: string): Date | null => {
  const date = new Date(dateString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return null;
  }
  
  return date;
};

/**
 * Validate Date Range
 * 
 * Checks if return date is after or equal to departure date.
 * 
 * @param departureDate - Departure date string
 * @param returnDate - Return date string
 * @returns true if valid, false otherwise
 */
export const isValidDateRange = (
  departureDate: string, 
  returnDate: string
): boolean => {
  const departure = parseDate(departureDate);
  const returnD = parseDate(returnDate);
  
  if (!departure || !returnD) {
    return false;
  }
  
  return returnD >= departure;
};

/**
 * Calculate Days Between Dates
 * 
 * Calculates the number of days between two dates.
 * 
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Number of days
 */
export const daysBetween = (startDate: Date, endDate: Date): number => {
  const msPerDay = 24 * 60 * 60 * 1000;
  const diffMs = endDate.getTime() - startDate.getTime();
  
  return Math.ceil(diffMs / msPerDay);
};

/**
 * Format Currency
 * 
 * Formats a number as USD currency.
 * 
 * @param amount - Numeric amount
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

/**
 * Generate Random String
 * 
 * Generates a random alphanumeric string.
 * Useful for tokens, temporary passwords, etc.
 * 
 * @param length - Length of string to generate
 * @returns Random string
 */
export const generateRandomString = (length: number = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

/**
 * Sleep/Delay Function
 * 
 * Pauses execution for specified milliseconds.
 * Useful for testing, rate limiting, etc.
 * 
 * @param ms - Milliseconds to sleep
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Capitalize First Letter
 * 
 * Capitalizes the first letter of a string.
 * 
 * @param str - Input string
 * @returns String with first letter capitalized
 */
export const capitalizeFirst = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Get Full Name
 * 
 * Combines first and last name.
 * 
 * @param firstName - First name
 * @param lastName - Last name
 * @returns Full name
 */
export const getFullName = (firstName: string, lastName: string): string => {
  return `${firstName} ${lastName}`;
};
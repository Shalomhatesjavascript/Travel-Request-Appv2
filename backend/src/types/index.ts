/**
 * TypeScript Type Definitions
 * 
 * This file contains all TypeScript interfaces and types
 * used throughout the application.
 * 
 * Benefits:
 * - Type safety (catch errors during development)
 * - Better IDE autocomplete
 * - Self-documenting code
 * - Easier refactoring
 */

// ============================================================================
// USER TYPES
// ============================================================================

/**
 * User Roles
 * 
 * Defines the three permission levels in our system:
 * - user: Can submit travel requests
 * - approver: Can approve/reject requests
 * - admin: Full system access
 */
export type UserRole = 'user' | 'approver' | 'admin';

/**
 * User Interface
 * 
 * Represents a user in the database.
 * This matches our "users" table structure.
 */
export interface User {
  id: string;
  email: string;
  password_hash: string;  // Never send this to frontend!
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * User Response (Safe for Frontend)
 * 
 * This is what we send to the frontend.
 * Notice: No password_hash!
 */
export interface UserResponse {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * User Registration Data
 * 
 * Data required to create a new user account.
 */
export interface UserRegistrationData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: UserRole;
}

/**
 * User Login Data
 * 
 * Data required to authenticate a user.
 */
export interface UserLoginData {
  email: string;
  password: string;
}

/**
 * User Update Data
 * 
 * Fields that can be updated for a user.
 * All fields are optional (partial update).
 */
export interface UserUpdateData {
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: UserRole;
  is_active?: boolean;
}

// ============================================================================
// TRAVEL REQUEST TYPES
// ============================================================================

/**
 * Travel Request Status
 * 
 * Possible states of a travel request.
 */
export type TravelRequestStatus = 
  | 'draft'      // Saved but not submitted
  | 'pending'    // Awaiting approval
  | 'approved'   // Approved by manager
  | 'rejected'   // Rejected by manager
  | 'cancelled'; // Cancelled by user

/**
 * Travel Request Interface
 * 
 * Represents a travel request in the database.
 */
export interface TravelRequest {
  id: string;
  user_id: string;
  approver_id: string;
  destination: string;
  departure_date: Date;
  return_date: Date;
  purpose: string;
  estimated_budget: number;
  transportation_mode?: string;
  accommodation_details?: string;
  additional_notes?: string;
  status: TravelRequestStatus;
  approval_comments?: string;
  submitted_at?: Date;
  approved_rejected_at?: Date;
  created_at: Date;
  updated_at: Date;
}

/**
 * Travel Request with User Details
 * 
 * Used when we need to show who created the request
 * and who the approver is.
 */
export interface TravelRequestWithUsers extends TravelRequest {
  user: UserResponse;      // Person who created the request
  approver: UserResponse;  // Person who will approve it
}

/**
 * Create Travel Request Data
 * 
 * Data needed to create a new travel request.
 */
export interface CreateTravelRequestData {
  approver_id: string;
  destination: string;
  departure_date: string;  // Date as string (YYYY-MM-DD)
  return_date: string;
  purpose: string;
  estimated_budget: number;
  transportation_mode?: string;
  accommodation_details?: string;
  additional_notes?: string;
}

/**
 * Update Travel Request Data
 * 
 * Fields that can be updated in a draft request.
 */
export interface UpdateTravelRequestData {
  approver_id?: string;
  destination?: string;
  departure_date?: string;
  return_date?: string;
  purpose?: string;
  estimated_budget?: number;
  transportation_mode?: string;
  accommodation_details?: string;
  additional_notes?: string;
}

/**
 * Approval/Rejection Data
 * 
 * Data provided when approving or rejecting a request.
 */
export interface ApprovalDecisionData {
  comments?: string;
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

/**
 * Notification Type
 * 
 * Types of email notifications sent by the system.
 */
export type NotificationType = 
  | 'submission'    // Request submitted
  | 'approval'      // Request approved
  | 'rejection'     // Request rejected
  | 'cancellation'; // Request cancelled

/**
 * Notification Status
 */
export type NotificationStatus = 'sent' | 'failed';

/**
 * Notification Log Interface
 */
export interface NotificationLog {
  id: string;
  travel_request_id: string;
  recipient_email: string;
  notification_type: NotificationType;
  sent_at: Date;
  status: NotificationStatus;
  error_message?: string;
}

// ============================================================================
// JWT TYPES
// ============================================================================

/**
 * JWT Payload
 * 
 * Data encoded in the JWT token.
 * This is what we can access in protected routes.
 */
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
}

/**
 * Decoded JWT
 * 
 * JWT payload with standard JWT fields.
 */
export interface DecodedJWT extends JWTPayload {
  iat: number;  // Issued at (timestamp)
  exp: number;  // Expires at (timestamp)
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Standard API Success Response
 * 
 * All successful API responses follow this structure.
 */
export interface ApiSuccessResponse<T = any> {
  success: true;
  message: string;
  data?: T;
}

/**
 * Standard API Error Response
 * 
 * All error responses follow this structure.
 */
export interface ApiErrorResponse {
  success: false;
  message: string;
  error?: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

/**
 * Login Response
 * 
 * Response after successful login.
 */
export interface LoginResponse {
  user: UserResponse;
  token: string;
}

// ============================================================================
// EXPRESS REQUEST EXTENSIONS
// ============================================================================

/**
 * Authenticated Request
 * 
 * Extends Express Request to include authenticated user info.
 * After authentication middleware, req.user will be available.
 */
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

// ============================================================================
// FILTER & PAGINATION TYPES
// ============================================================================

/**
 * Pagination Parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Paginated Response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Travel Request Filter Options
 */
export interface TravelRequestFilters {
  status?: TravelRequestStatus;
  user_id?: string;
  approver_id?: string;
  start_date?: string;
  end_date?: string;
}
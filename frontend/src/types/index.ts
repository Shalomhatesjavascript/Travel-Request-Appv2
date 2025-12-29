/**
 * Frontend TypeScript Types
 * 
 * These types match the backend API responses.
 * They define the shape of data we receive from the server.
 */

// ============================================================================
// USER TYPES
// ============================================================================

export type UserRole = 'user' | 'approver' | 'admin';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: UserRole;
}

export interface UpdateUserData {
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: UserRole;
  is_active?: boolean;
}

// ============================================================================
// TRAVEL REQUEST TYPES
// ============================================================================

export type TravelRequestStatus = 
  | 'draft'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled';

export interface TravelRequest {
  id: string;
  user_id: string;
  approver_id: string;
  destination: string;
  departure_date: string;
  return_date: string;
  purpose: string;
  estimated_budget: number;
  transportation_mode?: string;
  accommodation_details?: string;
  additional_notes?: string;
  status: TravelRequestStatus;
  approval_comments?: string;
  submitted_at?: string;
  approved_rejected_at?: string;
  created_at: string;
  updated_at: string;
  user?: User;
  approver?: User;
}

export interface CreateTravelRequestData {
  approver_id: string;
  destination: string;
  departure_date: string;
  return_date: string;
  purpose: string;
  estimated_budget: number;
  transportation_mode?: string;
  accommodation_details?: string;
  additional_notes?: string;
}

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

export interface TravelRequestStats {
  total: number;
  draft: number;
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiSuccessResponse<T = any> {
  success: true;
  message: string;
  data?: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  error?: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================================================
// FILTER TYPES
// ============================================================================

export interface TravelRequestFilters {
  status?: TravelRequestStatus;
  start_date?: string;
  end_date?: string;
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

export interface AlertState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

export interface DialogState {
  open: boolean;
  title: string;
  message: string;
  onConfirm?: () => void;
}
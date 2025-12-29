import { format, parseISO } from 'date-fns';
import type { TravelRequestStatus, UserRole } from '../types';

/**
 * Frontend Helper Functions
 */

/**
 * Format Date String
 */
export const formatDate = (dateString: string): string => {
  try {
    return format(parseISO(dateString), 'MMM dd, yyyy');
  } catch (error) {
    return dateString;
  }
};

/**
 * Format Date and Time
 */
export const formatDateTime = (dateString: string): string => {
  try {
    return format(parseISO(dateString), 'MMM dd, yyyy HH:mm');
  } catch (error) {
    return dateString;
  }
};

/**
 * Format Currency
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

/**
 * Get Full Name
 */
export const getFullName = (firstName: string, lastName: string): string => {
  return `${firstName} ${lastName}`;
};

/**
 * Get Status Color for Chips
 */
export const getStatusColor = (
  status: TravelRequestStatus
): 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' => {
  switch (status) {
    case 'draft':
      return 'default';
    case 'pending':
      return 'warning';
    case 'approved':
      return 'success';
    case 'rejected':
      return 'error';
    case 'cancelled':
      return 'default';
    default:
      return 'default';
  }
};

/**
 * Get Status Label
 */
export const getStatusLabel = (status: TravelRequestStatus): string => {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'pending':
      return 'Pending';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
};

/**
 * Get Role Label
 */
export const getRoleLabel = (role: UserRole): string => {
  switch (role) {
    case 'user':
      return 'User';
    case 'approver':
      return 'Approver';
    case 'admin':
      return 'Admin';
    default:
      return role;
  }
};

/**
 * Get Role Color
 */
export const getRoleColor = (role: UserRole): 'default' | 'primary' | 'secondary' => {
  switch (role) {
    case 'admin':
      return 'secondary';
    case 'approver':
      return 'primary';
    default:
      return 'default';
  }
};

/**
 * Calculate Days Between Dates
 */
export const calculateDays = (startDate: string, endDate: string): number => {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // Include both start and end date
};

/**
 * Handle API Error
 */
export const getErrorMessage = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};
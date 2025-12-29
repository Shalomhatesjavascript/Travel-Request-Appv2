import axiosInstance from './axios';
import type { LoginCredentials, LoginResponse, RegisterData, User } from '../types';

/**
 * Authentication API Functions
 * 
 * All authentication-related API calls.
 */

/**
 * Login User
 */
export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  const response = await axiosInstance.post<{ data: LoginResponse }>('/auth/login', credentials);
  return response.data.data;
};

/**
 * Register User (Admin only)
 */
export const register = async (userData: RegisterData): Promise<User> => {
  const response = await axiosInstance.post<{ data: { user: User } }>('/auth/register', userData);
  return response.data.data.user;
};

/**
 * Get Current User
 */
export const getCurrentUser = async (): Promise<User> => {
  const response = await axiosInstance.get<{ data: { user: User } }>('/auth/me');
  return response.data.data.user;
};

/**
 * Logout User
 */
export const logout = async (): Promise<void> => {
  await axiosInstance.post('/auth/logout');
};
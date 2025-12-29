import axiosInstance from './axios';
import type { User, UpdateUserData } from '../types';

/**
 * User Management API Functions
 */

/**
 * Get All Users
 */
export const getAllUsers = async (params?: {
  role?: string;
  active?: boolean;
}): Promise<User[]> => {
  const response = await axiosInstance.get<{ data: { users: User[] } }>('/users', { params });
  return response.data.data.users;
};

/**
 * Get User by ID
 */
export const getUserById = async (userId: string): Promise<User> => {
  const response = await axiosInstance.get<{ data: { user: User } }>(`/users/${userId}`);
  return response.data.data.user;
};

/**
 * Update User
 */
export const updateUser = async (userId: string, data: UpdateUserData): Promise<User> => {
  const response = await axiosInstance.put<{ data: { user: User } }>(`/users/${userId}`, data);
  return response.data.data.user;
};

/**
 * Delete User
 */
export const deleteUser = async (userId: string, hard: boolean = false): Promise<void> => {
  await axiosInstance.delete(`/users/${userId}`, {
    params: { hard: hard ? 'true' : undefined }
  });
};

/**
 * Get Approvers List
 */
export const getApprovers = async (): Promise<User[]> => {
  const response = await axiosInstance.get<{ data: { approvers: User[] } }>('/users/approvers');
  return response.data.data.approvers;
};

/**
 * Get User Statistics
 */
export const getUserStats = async () => {
  const response = await axiosInstance.get('/users/stats');
  return response.data.data;
};
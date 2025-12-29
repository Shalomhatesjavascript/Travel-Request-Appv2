import axiosInstance from './axios';
import type { 
  TravelRequest, 
  CreateTravelRequestData, 
  UpdateTravelRequestData,
  TravelRequestFilters,
  TravelRequestStats
} from '../types';

/**
 * Travel Request API Functions
 */

/**
 * Create Travel Request
 */
export const createTravelRequest = async (
  data: CreateTravelRequestData,
  submit: boolean = false
): Promise<TravelRequest> => {
  const response = await axiosInstance.post<{ data: { request: TravelRequest } }>(
    '/travel-requests',
    data,
    { params: { submit: submit ? 'true' : undefined } }
  );
  return response.data.data.request;
};

/**
 * Get All Travel Requests
 */
export const getAllTravelRequests = async (filters?: TravelRequestFilters): Promise<TravelRequest[]> => {
  const response = await axiosInstance.get<{ data: { requests: TravelRequest[] } }>(
    '/travel-requests',
    { params: filters }
  );
  return response.data.data.requests;
};

/**
 * Get My Travel Requests
 */
export const getMyTravelRequests = async (status?: string): Promise<TravelRequest[]> => {
  const response = await axiosInstance.get<{ data: { requests: TravelRequest[] } }>(
    '/travel-requests/my-requests',
    { params: { status } }
  );
  return response.data.data.requests;
};

/**
 * Get Pending Approvals
 */
export const getPendingApprovals = async (): Promise<TravelRequest[]> => {
  const response = await axiosInstance.get<{ data: { requests: TravelRequest[] } }>(
    '/travel-requests/pending-approvals'
  );
  return response.data.data.requests;
};

/**
 * Get Travel Request by ID
 */
export const getTravelRequestById = async (requestId: string): Promise<TravelRequest> => {
  const response = await axiosInstance.get<{ data: { request: TravelRequest } }>(
    `/travel-requests/${requestId}`
  );
  return response.data.data.request;
};

/**
 * Update Travel Request
 */
export const updateTravelRequest = async (
  requestId: string,
  data: UpdateTravelRequestData
): Promise<TravelRequest> => {
  const response = await axiosInstance.put<{ data: { request: TravelRequest } }>(
    `/travel-requests/${requestId}`,
    data
  );
  return response.data.data.request;
};

/**
 * Submit Draft Request
 */
export const submitTravelRequest = async (requestId: string): Promise<TravelRequest> => {
  const response = await axiosInstance.post<{ data: { request: TravelRequest } }>(
    `/travel-requests/${requestId}/submit`
  );
  return response.data.data.request;
};

/**
 * Approve Travel Request
 */
export const approveTravelRequest = async (
  requestId: string,
  comments?: string
): Promise<TravelRequest> => {
  const response = await axiosInstance.post<{ data: { request: TravelRequest } }>(
    `/travel-requests/${requestId}/approve`,
    { comments }
  );
  return response.data.data.request;
};

/**
 * Reject Travel Request
 */
export const rejectTravelRequest = async (
  requestId: string,
  comments: string
): Promise<TravelRequest> => {
  const response = await axiosInstance.post<{ data: { request: TravelRequest } }>(
    `/travel-requests/${requestId}/reject`,
    { comments }
  );
  return response.data.data.request;
};

/**
 * Cancel Travel Request
 */
export const cancelTravelRequest = async (requestId: string): Promise<TravelRequest> => {
  const response = await axiosInstance.post<{ data: { request: TravelRequest } }>(
    `/travel-requests/${requestId}/cancel`
  );
  return response.data.data.request;
};

/**
 * Delete Travel Request
 */
export const deleteTravelRequest = async (requestId: string): Promise<void> => {
  await axiosInstance.delete(`/travel-requests/${requestId}`);
};

/**
 * Get Travel Request Statistics
 */
export const getTravelRequestStats = async (): Promise<TravelRequestStats> => {
  const response = await axiosInstance.get<{ data: TravelRequestStats }>('/travel-requests/stats');
  return response.data.data;
};
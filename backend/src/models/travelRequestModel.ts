import { query, getClient } from '../config/database';
import { 
  TravelRequest, 
  TravelRequestWithUsers,
  CreateTravelRequestData,
  UpdateTravelRequestData,
  TravelRequestStatus,
  TravelRequestFilters
} from '../types';

/**
 * Travel Request Model
 * 
 * Handles all database operations related to travel requests.
 * This is the ONLY place where we directly query the travel_requests table.
 */

/**
 * Create Travel Request
 * 
 * Creates a new travel request in draft or pending status.
 * 
 * @param userId - ID of user creating the request
 * @param requestData - Travel request details
 * @param isDraft - Whether to save as draft or submit immediately
 * @returns Created travel request
 */
export const createTravelRequest = async (
  userId: string,
  requestData: CreateTravelRequestData,
  isDraft: boolean = false
): Promise<TravelRequest> => {
  const {
    approver_id,
    destination,
    departure_date,
    return_date,
    purpose,
    estimated_budget,
    transportation_mode,
    accommodation_details,
    additional_notes
  } = requestData;
  
  const status: TravelRequestStatus = isDraft ? 'draft' : 'pending';
  const submitted_at = isDraft ? null : new Date();
  
  const result = await query(
    `INSERT INTO travel_requests (
      user_id, approver_id, destination, departure_date, return_date,
      purpose, estimated_budget, transportation_mode, accommodation_details,
      additional_notes, status, submitted_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *`,
    [
      userId,
      approver_id,
      destination,
      departure_date,
      return_date,
      purpose,
      estimated_budget,
      transportation_mode || null,
      accommodation_details || null,
      additional_notes || null,
      status,
      submitted_at
    ]
  );
  
  return result.rows[0];
};

/**
 * Find Travel Request by ID
 * 
 * @param requestId - Travel request ID
 * @returns Travel request or null
 */
export const findTravelRequestById = async (
  requestId: string
): Promise<TravelRequest | null> => {
  const result = await query(
    'SELECT * FROM travel_requests WHERE id = $1',
    [requestId]
  );
  
  return result.rows[0] || null;
};

/**
 * Find Travel Request with User Details
 * 
 * Returns travel request with requester and approver information.
 * Useful for displaying request details with names.
 * 
 * @param requestId - Travel request ID
 * @returns Travel request with user details or null
 */
export const findTravelRequestWithUsers = async (
  requestId: string
): Promise<TravelRequestWithUsers | null> => {
  const result = await query(
    `SELECT 
      tr.*,
      json_build_object(
        'id', u.id,
        'email', u.email,
        'first_name', u.first_name,
        'last_name', u.last_name,
        'role', u.role,
        'is_active', u.is_active,
        'created_at', u.created_at,
        'updated_at', u.updated_at
      ) as user,
      json_build_object(
        'id', a.id,
        'email', a.email,
        'first_name', a.first_name,
        'last_name', a.last_name,
        'role', a.role,
        'is_active', a.is_active,
        'created_at', a.created_at,
        'updated_at', a.updated_at
      ) as approver
    FROM travel_requests tr
    JOIN users u ON tr.user_id = u.id
    JOIN users a ON tr.approver_id = a.id
    WHERE tr.id = $1`,
    [requestId]
  );
  
  return result.rows[0] || null;
};

/**
 * Get All Travel Requests with Filters
 * 
 * Retrieves travel requests with optional filtering.
 * 
 * @param filters - Filter criteria
 * @returns Array of travel requests with user details
 */
export const getAllTravelRequests = async (
  filters?: TravelRequestFilters
): Promise<TravelRequestWithUsers[]> => {
  let queryText = `
    SELECT 
      tr.*,
      json_build_object(
        'id', u.id,
        'email', u.email,
        'first_name', u.first_name,
        'last_name', u.last_name,
        'role', u.role,
        'is_active', u.is_active,
        'created_at', u.created_at,
        'updated_at', u.updated_at
      ) as user,
      json_build_object(
        'id', a.id,
        'email', a.email,
        'first_name', a.first_name,
        'last_name', a.last_name,
        'role', a.role,
        'is_active', a.is_active,
        'created_at', a.created_at,
        'updated_at', a.updated_at
      ) as approver
    FROM travel_requests tr
    JOIN users u ON tr.user_id = u.id
    JOIN users a ON tr.approver_id = a.id
    WHERE 1=1
  `;
  
  const values: any[] = [];
  let paramCount = 1;
  
  // Apply filters
  if (filters?.status) {
    queryText += ` AND tr.status = $${paramCount}`;
    values.push(filters.status);
    paramCount++;
  }
  
  if (filters?.user_id) {
    queryText += ` AND tr.user_id = $${paramCount}`;
    values.push(filters.user_id);
    paramCount++;
  }
  
  if (filters?.approver_id) {
    queryText += ` AND tr.approver_id = $${paramCount}`;
    values.push(filters.approver_id);
    paramCount++;
  }
  
  if (filters?.start_date) {
    queryText += ` AND tr.departure_date >= $${paramCount}`;
    values.push(filters.start_date);
    paramCount++;
  }
  
  if (filters?.end_date) {
    queryText += ` AND tr.return_date <= $${paramCount}`;
    values.push(filters.end_date);
    paramCount++;
  }
  
  // Order by most recent first
  queryText += ' ORDER BY tr.created_at DESC';
  
  const result = await query(queryText, values);
  
  return result.rows;
};

/**
 * Get User's Travel Requests
 * 
 * Retrieves all travel requests created by a specific user.
 * 
 * @param userId - User ID
 * @param status - Optional status filter
 * @returns Array of user's travel requests
 */
export const getUserTravelRequests = async (
  userId: string,
  status?: TravelRequestStatus
): Promise<TravelRequestWithUsers[]> => {
  return getAllTravelRequests({
    user_id: userId,
    status
  });
};

/**
 * Get Pending Approvals for Approver
 * 
 * Retrieves all pending travel requests assigned to an approver.
 * 
 * @param approverId - Approver's user ID
 * @returns Array of pending requests
 */
export const getPendingApprovals = async (
  approverId: string
): Promise<TravelRequestWithUsers[]> => {
  return getAllTravelRequests({
    approver_id: approverId,
    status: 'pending'
  });
};

/**
 * Update Travel Request
 * 
 * Updates a travel request (only allowed for drafts).
 * 
 * @param requestId - Travel request ID
 * @param updateData - Fields to update
 * @returns Updated travel request or null
 */
export const updateTravelRequest = async (
  requestId: string,
  updateData: UpdateTravelRequestData
): Promise<TravelRequest | null> => {
  // Build dynamic UPDATE query
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;
  
  if (updateData.approver_id !== undefined) {
    fields.push(`approver_id = $${paramCount}`);
    values.push(updateData.approver_id);
    paramCount++;
  }
  
  if (updateData.destination !== undefined) {
    fields.push(`destination = $${paramCount}`);
    values.push(updateData.destination);
    paramCount++;
  }
  
  if (updateData.departure_date !== undefined) {
    fields.push(`departure_date = $${paramCount}`);
    values.push(updateData.departure_date);
    paramCount++;
  }
  
  if (updateData.return_date !== undefined) {
    fields.push(`return_date = $${paramCount}`);
    values.push(updateData.return_date);
    paramCount++;
  }
  
  if (updateData.purpose !== undefined) {
    fields.push(`purpose = $${paramCount}`);
    values.push(updateData.purpose);
    paramCount++;
  }
  
  if (updateData.estimated_budget !== undefined) {
    fields.push(`estimated_budget = $${paramCount}`);
    values.push(updateData.estimated_budget);
    paramCount++;
  }
  
  if (updateData.transportation_mode !== undefined) {
    fields.push(`transportation_mode = $${paramCount}`);
    values.push(updateData.transportation_mode);
    paramCount++;
  }
  
  if (updateData.accommodation_details !== undefined) {
    fields.push(`accommodation_details = $${paramCount}`);
    values.push(updateData.accommodation_details);
    paramCount++;
  }
  
  if (updateData.additional_notes !== undefined) {
    fields.push(`additional_notes = $${paramCount}`);
    values.push(updateData.additional_notes);
    paramCount++;
  }
  
  // If no fields to update, return current request
  if (fields.length === 0) {
    return await findTravelRequestById(requestId);
  }
  
  // Add request ID as last parameter
  values.push(requestId);
  
  const queryText = `
    UPDATE travel_requests
    SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $${paramCount} AND status = 'draft'
    RETURNING *
  `;
  
  const result = await query(queryText, values);
  
  return result.rows[0] || null;
};

/**
 * Submit Draft Request
 * 
 * Changes status from 'draft' to 'pending' and sets submitted_at timestamp.
 * 
 * @param requestId - Travel request ID
 * @returns Updated travel request or null
 */
export const submitDraftRequest = async (
  requestId: string
): Promise<TravelRequest | null> => {
  const result = await query(
    `UPDATE travel_requests
     SET status = 'pending', submitted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND status = 'draft'
     RETURNING *`,
    [requestId]
  );
  
  return result.rows[0] || null;
};

/**
 * Approve Travel Request
 * 
 * Changes status to 'approved' and records approval timestamp and comments.
 * 
 * @param requestId - Travel request ID
 * @param comments - Optional approval comments
 * @returns Updated travel request or null
 */
export const approveTravelRequest = async (
  requestId: string,
  comments?: string
): Promise<TravelRequest | null> => {
  const result = await query(
    `UPDATE travel_requests
     SET status = 'approved',
         approval_comments = $2,
         approved_rejected_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND status = 'pending'
     RETURNING *`,
    [requestId, comments || null]
  );
  
  return result.rows[0] || null;
};

/**
 * Reject Travel Request
 * 
 * Changes status to 'rejected' and records rejection timestamp and comments.
 * 
 * @param requestId - Travel request ID
 * @param comments - Rejection reason (required)
 * @returns Updated travel request or null
 */
export const rejectTravelRequest = async (
  requestId: string,
  comments: string
): Promise<TravelRequest | null> => {
  const result = await query(
    `UPDATE travel_requests
     SET status = 'rejected',
         approval_comments = $2,
         approved_rejected_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND status = 'pending'
     RETURNING *`,
    [requestId, comments]
  );
  
  return result.rows[0] || null;
};

/**
 * Cancel Travel Request
 * 
 * Changes status to 'cancelled'.
 * Only allowed for pending requests.
 * 
 * @param requestId - Travel request ID
 * @returns Updated travel request or null
 */
export const cancelTravelRequest = async (
  requestId: string
): Promise<TravelRequest | null> => {
  const result = await query(
    `UPDATE travel_requests
     SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND status = 'pending'
     RETURNING *`,
    [requestId]
  );
  
  return result.rows[0] || null;
};

/**
 * Delete Travel Request
 * 
 * Permanently deletes a travel request.
 * Only allowed for draft requests.
 * 
 * @param requestId - Travel request ID
 * @returns true if deleted, false otherwise
 */
export const deleteTravelRequest = async (
  requestId: string
): Promise<boolean> => {
  const result = await query(
    `DELETE FROM travel_requests
     WHERE id = $1 AND status = 'draft'
     RETURNING id`,
    [requestId]
  );
  
  return result.rowCount > 0;
};

/**
 * Count Travel Requests
 * 
 * Returns statistics about travel requests.
 * 
 * @param userId - Optional user ID to filter by
 * @returns Object with counts by status
 */
export const countTravelRequests = async (userId?: string): Promise<{
  total: number;
  draft: number;
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
}> => {
  let queryText = `
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'draft') as draft,
      COUNT(*) FILTER (WHERE status = 'pending') as pending,
      COUNT(*) FILTER (WHERE status = 'approved') as approved,
      COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
      COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled
    FROM travel_requests
  `;
  
  const values: any[] = [];
  
  if (userId) {
    queryText += ' WHERE user_id = $1';
    values.push(userId);
  }
  
  const result = await query(queryText, values);
  const row = result.rows[0];
  
  return {
    total: parseInt(row.total),
    draft: parseInt(row.draft),
    pending: parseInt(row.pending),
    approved: parseInt(row.approved),
    rejected: parseInt(row.rejected),
    cancelled: parseInt(row.cancelled)
  };
};

/**
 * Check if User Can Modify Request
 * 
 * Verifies that a user is the owner of a travel request.
 * 
 * @param requestId - Travel request ID
 * @param userId - User ID
 * @returns true if user owns the request, false otherwise
 */
export const isRequestOwner = async (
  requestId: string,
  userId: string
): Promise<boolean> => {
  const result = await query(
    'SELECT id FROM travel_requests WHERE id = $1 AND user_id = $2',
    [requestId, userId]
  );
  
  return result.rowCount > 0;
};

/**
 * Check if User is Assigned Approver
 * 
 * Verifies that a user is the assigned approver for a travel request.
 * 
 * @param requestId - Travel request ID
 * @param userId - User ID
 * @returns true if user is the approver, false otherwise
 */
export const isRequestApprover = async (
  requestId: string,
  userId: string
): Promise<boolean> => {
  const result = await query(
    'SELECT id FROM travel_requests WHERE id = $1 AND approver_id = $2',
    [requestId, userId]
  );
  
  return result.rowCount > 0;
};
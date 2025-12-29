import { Request, Response } from 'express';
import {
  createTravelRequest,
  findTravelRequestById,
  findTravelRequestWithUsers,
  getAllTravelRequests,
  getUserTravelRequests,
  getPendingApprovals,
  updateTravelRequest,
  submitDraftRequest,
  approveTravelRequest,
  rejectTravelRequest,
  cancelTravelRequest,
  deleteTravelRequest,
  countTravelRequests,
  isRequestOwner,
  isRequestApprover
} from '../models/travelRequestModel';
import { findUserById } from '../models/userModel';
import {
  sendSubmissionNotification,
  sendApprovalNotification,
  sendRejectionNotification,
  sendCancellationNotification
} from '../services/emailService';
import { isValidDateRange } from '../utils/helpers';
import { CreateTravelRequestData, UpdateTravelRequestData } from '../types';

/**
 * Travel Request Controller
 * 
 * Handles travel request operations:
 * - Create, read, update, delete requests
 * - Submit, approve, reject, cancel workflow
 * - Get user's requests
 * - Get pending approvals
 */

/**
 * Create Travel Request
 * 
 * Creates a new travel request (draft or pending).
 * 
 * Route: POST /api/travel-requests
 * Body: CreateTravelRequestData
 * Query: ?submit=true to submit immediately
 * 
 * @route POST /api/travel-requests
 * @access Private
 */
export const createRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const requestData: CreateTravelRequestData = req.body;
    const shouldSubmit = req.query.submit === 'true';
    
    // Validation: Check required fields
    const requiredFields = [
      'approver_id',
      'destination',
      'departure_date',
      'return_date',
      'purpose',
      'estimated_budget'
    ];
    
    for (const field of requiredFields) {
      if (!(requestData as any)[field]) {
        res.status(400).json({
          success: false,
          message: `Missing required field: ${field}`,
          error: 'MISSING_FIELD'
        });
        return;
      }
    }
    
    // Validation: Check date range
    if (!isValidDateRange(requestData.departure_date, requestData.return_date)) {
      res.status(400).json({
        success: false,
        message: 'Return date must be on or after departure date',
        error: 'INVALID_DATE_RANGE'
      });
      return;
    }
    
    // Validation: Check budget is positive
    if (requestData.estimated_budget <= 0) {
      res.status(400).json({
        success: false,
        message: 'Estimated budget must be greater than zero',
        error: 'INVALID_BUDGET'
      });
      return;
    }
    
    // Validation: User cannot approve their own request
    if (requestData.approver_id === userId) {
      res.status(400).json({
        success: false,
        message: 'You cannot approve your own travel request',
        error: 'CANNOT_SELF_APPROVE'
      });
      return;
    }
    
    // Validation: Check if approver exists and is active
    const approver = await findUserById(requestData.approver_id);
    if (!approver) {
      res.status(404).json({
        success: false,
        message: 'Selected approver not found',
        error: 'APPROVER_NOT_FOUND'
      });
      return;
    }
    
    if (!approver.is_active) {
      res.status(400).json({
        success: false,
        message: 'Selected approver is not active',
        error: 'APPROVER_INACTIVE'
      });
      return;
    }
    
    if (approver.role !== 'approver' && approver.role !== 'admin') {
      res.status(400).json({
        success: false,
        message: 'Selected user is not an approver',
        error: 'NOT_AN_APPROVER'
      });
      return;
    }
    
    // Create the request
    const newRequest = await createTravelRequest(
      userId,
      requestData,
      !shouldSubmit // isDraft = true if not submitting
    );
    
    // If submitted, send notification to approver
    if (shouldSubmit) {
      const requestWithUsers = await findTravelRequestWithUsers(newRequest.id);
      if (requestWithUsers) {
        await sendSubmissionNotification(requestWithUsers);
      }
    }
    
    res.status(201).json({
      success: true,
      message: shouldSubmit 
        ? 'Travel request submitted successfully'
        : 'Travel request saved as draft',
      data: {
        request: newRequest
      }
    });
    
  } catch (error) {
    console.error('Create travel request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create travel request',
      error: 'SERVER_ERROR'
    });
  }
};

/**
 * Get All Travel Requests
 * 
 * Returns all travel requests (admin only) or user's own requests.
 * 
 * Route: GET /api/travel-requests?status=pending&start_date=2025-01-01
 * 
 * @route GET /api/travel-requests
 * @access Private
 */
export const getRequests = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    
    // Extract query parameters
    const status = req.query.status as string | undefined;
    const startDate = req.query.start_date as string | undefined;
    const endDate = req.query.end_date as string | undefined;
    
    let requests;
    
    if (userRole === 'admin') {
      // Admin can see all requests
      requests = await getAllTravelRequests({
        status: status as any,
        start_date: startDate,
        end_date: endDate
      });
    } else {
      // Regular users see only their own requests
      requests = await getUserTravelRequests(userId, status as any);
    }
    
    res.status(200).json({
      success: true,
      message: 'Travel requests retrieved successfully',
      data: {
        requests,
        count: requests.length
      }
    });
    
  } catch (error) {
    console.error('Get travel requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve travel requests',
      error: 'SERVER_ERROR'
    });
  }
};

/**
 * Get My Requests
 * 
 * Returns current user's travel requests.
 * 
 * Route: GET /api/travel-requests/my-requests?status=approved
 * 
 * @route GET /api/travel-requests/my-requests
 * @access Private
 */
export const getMyRequests = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const status = req.query.status as string | undefined;
    
    const requests = await getUserTravelRequests(userId, status as any);
    
    res.status(200).json({
      success: true,
      message: 'Your travel requests retrieved successfully',
      data: {
        requests,
        count: requests.length
      }
    });
    
  } catch (error) {
    console.error('Get my requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve your requests',
      error: 'SERVER_ERROR'
    });
  }
};

/**
 * Get Pending Approvals
 * 
 * Returns travel requests pending approval by current user.
 * Only for approvers and admins.
 * 
 * Route: GET /api/travel-requests/pending-approvals
 * 
 * @route GET /api/travel-requests/pending-approvals
 * @access Private (Approver/Admin)
 */
export const getMyPendingApprovals = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    
    // Check if user is approver or admin
    if (userRole !== 'approver' && userRole !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Only approvers can access this endpoint.',
        error: 'FORBIDDEN'
      });
      return;
    }
    
    const requests = await getPendingApprovals(userId);
    
    res.status(200).json({
      success: true,
      message: 'Pending approvals retrieved successfully',
      data: {
        requests,
        count: requests.length
      }
    });
    
  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve pending approvals',
      error: 'SERVER_ERROR'
    });
  }
};

/**
 * Get Travel Request by ID
 * 
 * Returns a specific travel request with full details.
 * Users can view their own requests.
 * Approvers can view requests assigned to them.
 * Admins can view all requests.
 * 
 * Route: GET /api/travel-requests/:id
 * 
 * @route GET /api/travel-requests/:id
 * @access Private
 */
export const getRequestById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    
    const request = await findTravelRequestWithUsers(id);
    
    if (!request) {
      res.status(404).json({
        success: false,
        message: 'Travel request not found',
        error: 'REQUEST_NOT_FOUND'
      });
      return;
    }
    
    // Check authorization
    const isOwner = request.user_id === userId;
    const isApprover = request.approver_id === userId;
    const isAdmin = userRole === 'admin';
    
    if (!isOwner && !isApprover && !isAdmin) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
        error: 'FORBIDDEN'
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      message: 'Travel request retrieved successfully',
      data: {
        request
      }
    });
    
  } catch (error) {
    console.error('Get request by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve travel request',
      error: 'SERVER_ERROR'
    });
  }
};

/**
 * Update Travel Request
 * 
 * Updates a draft travel request.
 * Only the owner can update their draft requests.
 * 
 * Route: PUT /api/travel-requests/:id
 * 
 * @route PUT /api/travel-requests/:id
 * @access Private (Owner only)
 */
export const updateRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const updateData: UpdateTravelRequestData = req.body;
    
    // Check if request exists
    const existingRequest = await findTravelRequestById(id);
    if (!existingRequest) {
      res.status(404).json({
        success: false,
        message: 'Travel request not found',
        error: 'REQUEST_NOT_FOUND'
      });
      return;
    }
    
    // Check ownership
    if (existingRequest.user_id !== userId) {
      res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own requests.',
        error: 'FORBIDDEN'
      });
      return;
    }
    
    // Can only update drafts
    if (existingRequest.status !== 'draft') {
      res.status(400).json({
        success: false,
        message: 'Can only update draft requests',
        error: 'CANNOT_UPDATE_SUBMITTED'
      });
      return;
    }
    
    // Validate date range if provided
    if (updateData.departure_date || updateData.return_date) {
      const depDate = updateData.departure_date || existingRequest.departure_date.toString();
      const retDate = updateData.return_date || existingRequest.return_date.toString();
      
      if (!isValidDateRange(depDate, retDate)) {
        res.status(400).json({
          success: false,
          message: 'Return date must be on or after departure date',
          error: 'INVALID_DATE_RANGE'
        });
        return;
      }
    }
    
    // Validate budget if provided
    if (updateData.estimated_budget !== undefined && updateData.estimated_budget <= 0) {
      res.status(400).json({
        success: false,
        message: 'Estimated budget must be greater than zero',
        error: 'INVALID_BUDGET'
      });
      return;
    }
    
    // Update the request
    const updatedRequest = await updateTravelRequest(id, updateData);
    
    if (!updatedRequest) {
      res.status(500).json({
        success: false,
        message: 'Failed to update travel request',
        error: 'UPDATE_FAILED'
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      message: 'Travel request updated successfully',
      data: {
        request: updatedRequest
      }
    });
    
  } catch (error) {
    console.error('Update travel request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update travel request',
      error: 'SERVER_ERROR'
    });
  }
};

/**
 * Submit Draft Request
 * 
 * Submits a draft request for approval.
 * 
 * Route: POST /api/travel-requests/:id/submit
 * 
 * @route POST /api/travel-requests/:id/submit
 * @access Private (Owner only)
 */
export const submitRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    
    // Check ownership
    const isOwner = await isRequestOwner(id, userId);
    if (!isOwner) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
        error: 'FORBIDDEN'
      });
      return;
    }
    
    // Submit the draft
    const submittedRequest = await submitDraftRequest(id);
    
    if (!submittedRequest) {
      res.status(400).json({
        success: false,
        message: 'Request not found or not a draft',
        error: 'CANNOT_SUBMIT'
      });
      return;
    }
    
    // Send notification to approver
    const requestWithUsers = await findTravelRequestWithUsers(id);
    if (requestWithUsers) {
      await sendSubmissionNotification(requestWithUsers);
    }
    
    res.status(200).json({
      success: true,
      message: 'Travel request submitted successfully',
      data: {
        request: submittedRequest
      }
    });
    
  } catch (error) {
    console.error('Submit request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit travel request',
      error: 'SERVER_ERROR'
    });
  }
};

/**
 * Approve Travel Request
 * 
 * Approves a pending travel request.
 * Only assigned approver or admin can approve.
 * 
 * Route: POST /api/travel-requests/:id/approve
 * Body: { comments?: string }
 * 
 * @route POST /api/travel-requests/:id/approve
 * @access Private (Approver only)
 */
export const approveRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    const { comments } = req.body;
    
    // Check if user is assigned approver or admin
    const isApprover = await isRequestApprover(id, userId);
    const isAdmin = userRole === 'admin';
    
    if (!isApprover && !isAdmin) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Only assigned approver can approve this request.',
        error: 'FORBIDDEN'
      });
      return;
    }
    
    // Approve the request
    const approvedRequest = await approveTravelRequest(id, comments);
    
    if (!approvedRequest) {
      res.status(400).json({
        success: false,
        message: 'Request not found or not pending',
        error: 'CANNOT_APPROVE'
      });
      return;
    }
    
    // Send notification to requester
    const requestWithUsers = await findTravelRequestWithUsers(id);
    if (requestWithUsers) {
      await sendApprovalNotification(requestWithUsers);
    }
    
    res.status(200).json({
      success: true,
      message: 'Travel request approved successfully',
      data: {
        request: approvedRequest
      }
    });
    
  } catch (error) {
    console.error('Approve request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve travel request',
      error: 'SERVER_ERROR'
    });
  }
};

/**
 * Reject Travel Request
 * 
 * Rejects a pending travel request.
 * Only assigned approver or admin can reject.
 * Comments are required when rejecting.
 * 
 * Route: POST /api/travel-requests/:id/reject
 * Body: { comments: string }
 * 
 * @route POST /api/travel-requests/:id/reject
 * @access Private (Approver only)
 */
export const rejectRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    const { comments } = req.body;
    
    // Validation: Comments required for rejection
    if (!comments || comments.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'Comments are required when rejecting a request',
        error: 'COMMENTS_REQUIRED'
      });
      return;
    }
    
    // Check if user is assigned approver or admin
    const isApprover = await isRequestApprover(id, userId);
    const isAdmin = userRole === 'admin';
    
    if (!isApprover && !isAdmin) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Only assigned approver can reject this request.',
        error: 'FORBIDDEN'
      });
      return;
    }
    
    // Reject the request
    const rejectedRequest = await rejectTravelRequest(id, comments);
    
    if (!rejectedRequest) {
      res.status(400).json({
        success: false,
        message: 'Request not found or not pending',
        error: 'CANNOT_REJECT'
      });
      return;
    }
    
    // Send notification to requester
    const requestWithUsers = await findTravelRequestWithUsers(id);
    if (requestWithUsers) {
      await sendRejectionNotification(requestWithUsers);
    }
    
    res.status(200).json({
      success: true,
      message: 'Travel request rejected',
      data: {
        request: rejectedRequest
      }
    });
    
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject travel request',
      error: 'SERVER_ERROR'
    });
  }
};

/**
 * Cancel Travel Request
 * 
 * Cancels a pending travel request.
 * Only the owner can cancel their own pending requests.
 * 
 * Route: POST /api/travel-requests/:id/cancel
 * 
 * @route POST /api/travel-requests/:id/cancel
 * @access Private (Owner only)
 */
export const cancelRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    
    // Check ownership
    const isOwner = await isRequestOwner(id, userId);
    if (!isOwner) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
        error: 'FORBIDDEN'
      });
      return;
    }
    
    // Cancel the request
    const cancelledRequest = await cancelTravelRequest(id);
    
    if (!cancelledRequest) {
      res.status(400).json({
        success: false,
        message: 'Request not found or not pending',
        error: 'CANNOT_CANCEL'
      });
      return;
    }
    
    // Send notification to approver
    const requestWithUsers = await findTravelRequestWithUsers(id);
    if (requestWithUsers) {
      await sendCancellationNotification(requestWithUsers);
    }
    
    res.status(200).json({
      success: true,
      message: 'Travel request cancelled successfully',
      data: {
        request: cancelledRequest
      }
    });
    
  } catch (error) {
    console.error('Cancel request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel travel request',
      error: 'SERVER_ERROR'
    });
  }
};

/**
 * Delete Travel Request
 * 
 * Permanently deletes a draft travel request.
 * Only the owner can delete their own drafts.
 * 
 * Route: DELETE /api/travel-requests/:id
 * 
 * @route DELETE /api/travel-requests/:id
 * @access Private (Owner only)
 */
export const deleteRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    
    // Check ownership
    const isOwner = await isRequestOwner(id, userId);
    if (!isOwner) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
        error: 'FORBIDDEN'
      });
      return;
    }
    
    // Delete the request
    const deleted = await deleteTravelRequest(id);
    
    if (!deleted) {
      res.status(400).json({
        success: false,
        message: 'Request not found or not a draft',
        error: 'CANNOT_DELETE'
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      message: 'Travel request deleted successfully',
      data: {
        requestId: id,
        deleted: true
      }
    });
    
  } catch (error) {
    console.error('Delete request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete travel request',
      error: 'SERVER_ERROR'
    });
  }
};

/**
 * Get Travel Request Statistics
 * 
 * Returns statistics about travel requests.
 * Users see their own stats.
 * Admins see system-wide stats.
 * 
 * Route: GET /api/travel-requests/stats
 * 
 * @route GET /api/travel-requests/stats
 * @access Private
 */
export const getRequestStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const userRole = req.user!.role;
    
    const stats = userRole === 'admin'
      ? await countTravelRequests()
      : await countTravelRequests(userId);
    
    res.status(200).json({
      success: true,
      message: 'Statistics retrieved successfully',
      data: stats
    });
    
  } catch (error) {
    console.error('Get request stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve statistics',
      error: 'SERVER_ERROR'
    });
  }
};
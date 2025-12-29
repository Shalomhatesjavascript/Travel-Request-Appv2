import { Router } from 'express';
import {
  createRequest,
  getRequests,
  getMyRequests,
  getMyPendingApprovals,
  getRequestById,
  updateRequest,
  submitRequest,
  approveRequest,
  rejectRequest,
  cancelRequest,
  deleteRequest,
  getRequestStats
} from '../controllers/travelRequestController';
import { authenticate, authorize } from '../middleware/authMiddleware';

/**
 * Travel Request Routes
 * 
 * Defines all travel request endpoints.
 * 
 * Route organization:
 * - Special routes first (stats, my-requests, pending-approvals)
 * - Action routes (:id/submit, :id/approve, etc.)
 * - Standard CRUD routes last
 */

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================================================
// SPECIAL ROUTES (Must come BEFORE :id routes)
// ============================================================================

/**
 * @route   GET /api/travel-requests/stats
 * @desc    Get travel request statistics
 * @access  Private
 * 
 * Returns counts by status.
 * Users see their own stats, admins see system-wide stats.
 */
router.get('/stats', getRequestStats);

/**
 * @route   GET /api/travel-requests/my-requests
 * @desc    Get current user's travel requests
 * @access  Private
 * 
 * Query parameters:
 * - status: Filter by status (draft, pending, approved, rejected, cancelled)
 * 
 * Example: GET /api/travel-requests/my-requests?status=approved
 */
router.get('/my-requests', getMyRequests);

/**
 * @route   GET /api/travel-requests/pending-approvals
 * @desc    Get requests pending approval by current user
 * @access  Private (Approver/Admin)
 * 
 * Returns all pending requests assigned to the current user for approval.
 */
router.get('/pending-approvals', getMyPendingApprovals);

// ============================================================================
// ACTION ROUTES (Must come BEFORE generic :id route)
// ============================================================================

/**
 * @route   POST /api/travel-requests/:id/submit
 * @desc    Submit a draft request for approval
 * @access  Private (Owner only)
 * 
 * Changes status from 'draft' to 'pending'.
 * Sends notification to approver.
 */
router.post('/:id/submit', submitRequest);

/**
 * @route   POST /api/travel-requests/:id/approve
 * @desc    Approve a pending request
 * @access  Private (Assigned Approver or Admin)
 * 
 * Body:
 * {
 *   "comments": "Optional approval comments"
 * }
 * 
 * Sends notification to requester.
 */
router.post('/:id/approve', approveRequest);

/**
 * @route   POST /api/travel-requests/:id/reject
 * @desc    Reject a pending request
 * @access  Private (Assigned Approver or Admin)
 * 
 * Body:
 * {
 *   "comments": "Reason for rejection (required)"
 * }
 * 
 * Comments are mandatory when rejecting.
 * Sends notification to requester.
 */
router.post('/:id/reject', rejectRequest);

/**
 * @route   POST /api/travel-requests/:id/cancel
 * @desc    Cancel a pending request
 * @access  Private (Owner only)
 * 
 * User cancels their own pending request.
 * Sends notification to approver.
 */
router.post('/:id/cancel', cancelRequest);

// ============================================================================
// STANDARD CRUD ROUTES
// ============================================================================

/**
 * @route   POST /api/travel-requests
 * @desc    Create a new travel request
 * @access  Private
 * 
 * Query parameters:
 * - submit=true: Submit immediately (default: save as draft)
 * 
 * Body:
 * {
 *   "approver_id": "uuid",
 *   "destination": "New York, USA",
 *   "departure_date": "2025-02-15",
 *   "return_date": "2025-02-20",
 *   "purpose": "Client meeting",
 *   "estimated_budget": 2500.00,
 *   "transportation_mode": "Flight",
 *   "accommodation_details": "Hotel near convention center",
 *   "additional_notes": "Need approval by end of January"
 * }
 * 
 * Examples:
 * - POST /api/travel-requests              (save as draft)
 * - POST /api/travel-requests?submit=true  (submit immediately)
 */
router.post('/', createRequest);

/**
 * @route   GET /api/travel-requests
 * @desc    Get all travel requests
 * @access  Private
 * 
 * Query parameters:
 * - status: Filter by status
 * - start_date: Filter by departure date >= start_date
 * - end_date: Filter by return date <= end_date
 * 
 * Regular users see only their own requests.
 * Admins see all requests.
 * 
 * Examples:
 * - GET /api/travel-requests
 * - GET /api/travel-requests?status=pending
 * - GET /api/travel-requests?start_date=2025-01-01&end_date=2025-12-31
 */
router.get('/', getRequests);

/**
 * @route   GET /api/travel-requests/:id
 * @desc    Get travel request by ID
 * @access  Private
 * 
 * Users can view their own requests.
 * Approvers can view requests assigned to them.
 * Admins can view all requests.
 */
router.get('/:id', getRequestById);

/**
 * @route   PUT /api/travel-requests/:id
 * @desc    Update a draft travel request
 * @access  Private (Owner only)
 * 
 * Can only update draft requests.
 * Once submitted, requests cannot be edited.
 * 
 * Body: Any fields from CreateTravelRequestData
 */
router.put('/:id', updateRequest);

/**
 * @route   DELETE /api/travel-requests/:id
 * @desc    Delete a draft travel request
 * @access  Private (Owner only)
 * 
 * Can only delete draft requests.
 * Submitted requests cannot be deleted (use cancel instead).
 */
router.delete('/:id', deleteRequest);

export default router;
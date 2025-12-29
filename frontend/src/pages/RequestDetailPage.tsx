import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Button,
  Divider,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import {
  ArrowBack,
  CheckCircle,
  Cancel as CancelIcon,
  Delete,
} from '@mui/icons-material';
import {
  getTravelRequestById,
  approveTravelRequest,
  rejectTravelRequest,
  cancelTravelRequest,
} from '../api/travelRequestApi';
import type { TravelRequest } from '../types';
import { useAuth } from '../contexts/AuthContext';
import {
  formatDate,
  formatCurrency,
  getStatusColor,
  getStatusLabel,
  getFullName,
  calculateDays,
  getErrorMessage,
} from '../utils/helpers';
import LoadingSpinner from '../components/common/LoadingSpinner';

const RequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [request, setRequest] = useState<TravelRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectComments, setRejectComments] = useState('');
  const [approveComments, setApproveComments] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      loadRequest();
    }
  }, [id]);

  const loadRequest = async () => {
    try {
      const data = await getTravelRequestById(id!);
      setRequest(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      await approveTravelRequest(id!, approveComments);
      loadRequest();
      setApproveComments('');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleReject = async () => {
    if (!rejectComments.trim()) {
      setError('Rejection comments are required');
      return;
    }

    try {
      await rejectTravelRequest(id!, rejectComments);
      setRejectDialogOpen(false);
      setRejectComments('');
      loadRequest();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleCancel = async () => {
    if (window.confirm('Cancel this travel request?')) {
      try {
        await cancelTravelRequest(id!);
        loadRequest();
      } catch (err) {
        setError(getErrorMessage(err));
      }
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading request details..." />;
  }

  if (!request) {
    return (
      <Box>
        <Alert severity="error">Request not found</Alert>
        <Button onClick={() => navigate('/my-requests')} sx={{ mt: 2 }}>
          Back to Requests
        </Button>
      </Box>
    );
  }

  const isOwner = user?.id === request.user_id;
  const isApprover = user?.id === request.approver_id;
  const canApprove = isApprover && request.status === 'pending';
  const canCancel = isOwner && request.status === 'pending';

  const days = calculateDays(request.departure_date, request.return_date);

  return (
    <Box>
      <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mb: 3 }}>
        Back
      </Button>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="start" mb={3}>
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              {request.destination}
            </Typography>
            <Chip
              label={getStatusLabel(request.status)}
              color={getStatusColor(request.status)}
              size="medium"
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            ID: {request.id.slice(0, 8)}
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Requester
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {request.user ? getFullName(request.user.first_name, request.user.last_name) : 'N/A'}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Approver
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {request.approver ? getFullName(request.approver.first_name, request.approver.last_name) : 'N/A'}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Departure Date
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {formatDate(request.departure_date)}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Return Date
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {formatDate(request.return_date)} ({days} days)
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Estimated Budget
            </Typography>
            <Typography variant="h6" color="primary" fontWeight={700}>
              {formatCurrency(request.estimated_budget)}
            </Typography>
          </Grid>

          {request.transportation_mode && (
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Transportation
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {request.transportation_mode}
              </Typography>
            </Grid>
          )}

          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Purpose
            </Typography>
            <Typography variant="body1">{request.purpose}</Typography>
          </Grid>

          {request.accommodation_details && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Accommodation Details
              </Typography>
              <Typography variant="body1">{request.accommodation_details}</Typography>
            </Grid>
          )}

          {request.additional_notes && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Additional Notes
              </Typography>
              <Typography variant="body1">{request.additional_notes}</Typography>
            </Grid>
          )}

          {request.approval_comments && (
            <Grid item xs={12}>
              <Alert severity={request.status === 'approved' ? 'success' : 'error'}>
                <Typography variant="subtitle2" gutterBottom>
                  {request.status === 'approved' ? 'Approval' : 'Rejection'} Comments
                </Typography>
                <Typography variant="body2">{request.approval_comments}</Typography>
              </Alert>
            </Grid>
          )}
        </Grid>

        {canApprove && (
          <>
            <Divider sx={{ my: 3 }} />
            <Box>
              <Typography variant="h6" gutterBottom>
                Review Request
              </Typography>
              <TextField
                label="Comments (optional for approval, required for rejection)"
                multiline
                rows={3}
                fullWidth
                value={approveComments}
                onChange={(e) => setApproveComments(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Box display="flex" gap={2}>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircle />}
                  onClick={handleApprove}
                >
                  Approve
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<CancelIcon />}
                  onClick={() => setRejectDialogOpen(true)}
                >
                  Reject
                </Button>
              </Box>
            </Box>
          </>
        )}

        {canCancel && (
          <>
            <Divider sx={{ my: 3 }} />
            <Button
              variant="outlined"
              color="error"
              startIcon={<Delete />}
              onClick={handleCancel}
            >
              Cancel Request
            </Button>
          </>
        )}
      </Paper>

      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)}>
        <DialogTitle>Reject Travel Request</DialogTitle>
        <DialogContent>
          <TextField
            label="Rejection Reason (required)"
            multiline
            rows={4}
            fullWidth
            value={rejectComments}
            onChange={(e) => setRejectComments(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleReject}
            disabled={!rejectComments.trim()}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RequestDetailPage;
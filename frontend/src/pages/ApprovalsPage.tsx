import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Alert,
} from '@mui/material';
import { Visibility } from '@mui/icons-material';
import { getPendingApprovals } from '../api/travelRequestApi';
import type { TravelRequest } from '../types';
import { formatDate, formatCurrency, getFullName, calculateDays } from '../utils/helpers';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ApprovalsPage: React.FC = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<TravelRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingApprovals();
  }, []);

  const loadPendingApprovals = async () => {
    try {
      const data = await getPendingApprovals();
      setRequests(data);
    } catch (error) {
      console.error('Failed to load pending approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading pending approvals..." />;
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Pending Approvals
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={4}>
        Review and approve travel requests assigned to you
      </Typography>

      {requests.length === 0 ? (
        <Alert severity="info">
          You have no pending approvals at this time.
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Requester</strong></TableCell>
                <TableCell><strong>Destination</strong></TableCell>
                <TableCell><strong>Travel Dates</strong></TableCell>
                <TableCell><strong>Duration</strong></TableCell>
                <TableCell><strong>Budget</strong></TableCell>
                <TableCell><strong>Purpose</strong></TableCell>
                <TableCell align="center"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id} hover>
                  <TableCell>
                    {request.user
                      ? getFullName(request.user.first_name, request.user.last_name)
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {request.destination}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(request.departure_date)}
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(request.return_date)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`${calculateDays(request.departure_date, request.return_date)} days`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600} color="primary">
                      {formatCurrency(request.estimated_budget)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {request.purpose}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Review Request">
                      <IconButton
                        color="primary"
                        onClick={() => navigate(`/requests/${request.id}`)}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default ApprovalsPage;
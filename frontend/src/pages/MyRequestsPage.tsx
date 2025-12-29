import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
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
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility,
  Edit,
  Delete,
  Send,
} from '@mui/icons-material';
import { getMyTravelRequests, submitTravelRequest, deleteTravelRequest } from '../api/travelRequestApi';
import type { TravelRequest, TravelRequestStatus } from '../types';
import { formatDate, formatCurrency, getStatusColor, getStatusLabel, getFullName } from '../utils/helpers';
import LoadingSpinner from '../components/common/LoadingSpinner';

const MyRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<TravelRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<TravelRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);

  const tabs = ['All', 'Draft', 'Pending', 'Approved', 'Rejected', 'Cancelled'];

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [selectedTab, requests]);

  const loadRequests = async () => {
    try {
      const data = await getMyTravelRequests();
      setRequests(data);
    } catch (error) {
      console.error('Failed to load requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    if (selectedTab === 0) {
      setFilteredRequests(requests);
    } else {
      const status = tabs[selectedTab].toLowerCase() as TravelRequestStatus;
      setFilteredRequests(requests.filter(r => r.status === status));
    }
  };

  const handleSubmit = async (requestId: string) => {
    if (window.confirm('Submit this request for approval?')) {
      try {
        await submitTravelRequest(requestId);
        loadRequests();
      } catch (error) {
        console.error('Failed to submit request:', error);
      }
    }
  };

  const handleDelete = async (requestId: string) => {
    if (window.confirm('Delete this draft request?')) {
      try {
        await deleteTravelRequest(requestId);
        loadRequests();
      } catch (error) {
        console.error('Failed to delete request:', error);
      }
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading your requests..." />;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            My Travel Requests
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View and manage your travel requests
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/new-request')}
        >
          New Request
        </Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={selectedTab} onChange={(e, v) => setSelectedTab(v)}>
          {tabs.map((tab, index) => (
            <Tab
              key={tab}
              label={`${tab} (${index === 0 ? requests.length : requests.filter(r => r.status === tab.toLowerCase()).length})`}
            />
          ))}
        </Tabs>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Destination</strong></TableCell>
              <TableCell><strong>Dates</strong></TableCell>
              <TableCell><strong>Budget</strong></TableCell>
              <TableCell><strong>Approver</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="center"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body1" color="text.secondary" py={4}>
                    No requests found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredRequests.map((request) => (
                <TableRow key={request.id} hover>
                  <TableCell>{request.destination}</TableCell>
                  <TableCell>
                    {formatDate(request.departure_date)} - {formatDate(request.return_date)}
                  </TableCell>
                  <TableCell>{formatCurrency(request.estimated_budget)}</TableCell>
                  <TableCell>
                    {request.approver ? getFullName(request.approver.first_name, request.approver.last_name) : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(request.status)}
                      color={getStatusColor(request.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/requests/${request.id}`)}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>

                    {request.status === 'draft' && (
                      <>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/requests/${request.id}/edit`)}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Submit">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleSubmit(request.id)}
                          >
                            <Send />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(request.id)}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default MyRequestsPage;
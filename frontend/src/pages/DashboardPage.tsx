import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Description,
  HourglassEmpty,
  CheckCircle,
  Cancel,
  Pending,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { getTravelRequestStats } from '../api/travelRequestApi';
import type  { TravelRequestStats } from '../types';
import { getFullName } from '../utils/helpers';
import LoadingSpinner from '../components/common/LoadingSpinner';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<TravelRequestStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await getTravelRequestStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  const statCards = [
    {
      title: 'Total Requests',
      value: stats?.total || 0,
      icon: <Description sx={{ fontSize: 40 }} />,
      color: '#4F46E5',
      bgColor: '#EEF2FF',
    },
    {
      title: 'Draft',
      value: stats?.draft || 0,
      icon: <Description sx={{ fontSize: 40 }} />,
      color: '#6B7280',
      bgColor: '#F3F4F6',
    },
    {
      title: 'Pending',
      value: stats?.pending || 0,
      icon: <HourglassEmpty sx={{ fontSize: 40 }} />,
      color: '#F59E0B',
      bgColor: '#FEF3C7',
    },
    {
      title: 'Approved',
      value: stats?.approved || 0,
      icon: <CheckCircle sx={{ fontSize: 40 }} />,
      color: '#10B981',
      bgColor: '#D1FAE5',
    },
    {
      title: 'Rejected',
      value: stats?.rejected || 0,
      icon: <Cancel sx={{ fontSize: 40 }} />,
      color: '#EF4444',
      bgColor: '#FEE2E2',
    },
    {
      title: 'Cancelled',
      value: stats?.cancelled || 0,
      icon: <Pending sx={{ fontSize: 40 }} />,
      color: '#6B7280',
      bgColor: '#F3F4F6',
    },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Welcome back, {user?.first_name}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Here's an overview of your travel requests
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="large"
          startIcon={<AddIcon />}
          onClick={() => navigate('/new-request')}
        >
          New Request
        </Button>
      </Box>

      <Grid container spacing={3} mb={4}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
            <Card
              sx={{
                height: '100%',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    backgroundColor: card.bgColor,
                    color: card.color,
                    width: 60,
                    height: 60,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                  }}
                >
                  {card.icon}
                </Box>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                  {card.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {card.title}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Quick Actions
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Common tasks to get you started
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              fullWidth
              size="large"
              onClick={() => navigate('/new-request')}
              sx={{ py: 2 }}
            >
              Create New Request
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              fullWidth
              size="large"
              onClick={() => navigate('/my-requests')}
              sx={{ py: 2 }}
            >
              View My Requests
            </Button>
          </Grid>
          {(user?.role === 'approver' || user?.role === 'admin') && (
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                size="large"
                onClick={() => navigate('/approvals')}
                sx={{ py: 2 }}
              >
                Pending Approvals
              </Button>
            </Grid>
          )}
          {user?.role === 'admin' && (
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                size="large"
                onClick={() => navigate('/users')}
                sx={{ py: 2 }}
              >
                Manage Users
              </Button>
            </Grid>
          )}
        </Grid>
      </Paper>
    </Box>
  );
};

export default DashboardPage;
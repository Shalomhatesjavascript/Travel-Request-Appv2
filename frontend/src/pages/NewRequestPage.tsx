import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  Alert,
  Snackbar,
} from '@mui/material';
import { Save, Send } from '@mui/icons-material';
import { getApprovers } from '../api/userApi';
import { createTravelRequest } from '../api/travelRequestApi';
import type { User, CreateTravelRequestData } from '../types';
import { getErrorMessage, getFullName } from '../utils/helpers';
import LoadingSpinner from '../components/common/LoadingSpinner';

const NewRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const { control, handleSubmit, formState: { errors } } = useForm<CreateTravelRequestData>();

  const [approvers, setApprovers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadApprovers();
  }, []);

  const loadApprovers = async () => {
    try {
      const data = await getApprovers();
      setApprovers(data);
    } catch (err) {
      setError('Failed to load approvers');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: CreateTravelRequestData, submit: boolean) => {
    setSubmitting(true);
    setError('');

    try {
      await createTravelRequest(data, submit);
      setSuccess(submit ? 'Request submitted successfully!' : 'Request saved as draft!');
      
      setTimeout(() => {
        navigate('/my-requests');
      }, 1500);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading form..." />;
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        New Travel Request
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={4}>
        Fill in the details for your travel request
      </Typography>

      <Paper sx={{ p: 4 }}>
        <Box component="form">
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Controller
                name="approver_id"
                control={control}
                defaultValue=""
                rules={{ required: 'Approver is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Select Approver"
                    error={!!errors.approver_id}
                    helperText={errors.approver_id?.message}
                  >
                    {approvers.map((approver) => (
                      <MenuItem key={approver.id} value={approver.id}>
                        {getFullName(approver.first_name, approver.last_name)} ({approver.role})
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="destination"
                control={control}
                defaultValue=""
                rules={{ required: 'Destination is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Destination"
                    placeholder="e.g., New York, USA"
                    error={!!errors.destination}
                    helperText={errors.destination?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="departure_date"
                control={control}
                defaultValue=""
                rules={{ required: 'Departure date is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="date"
                    label="Departure Date"
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.departure_date}
                    helperText={errors.departure_date?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="return_date"
                control={control}
                defaultValue=""
                rules={{ required: 'Return date is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="date"
                    label="Return Date"
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.return_date}
                    helperText={errors.return_date?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="purpose"
                control={control}
                defaultValue=""
                rules={{ required: 'Purpose is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Purpose of Travel"
                    multiline
                    rows={3}
                    placeholder="Describe the purpose of your trip..."
                    error={!!errors.purpose}
                    helperText={errors.purpose?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="estimated_budget"
                control={control}
                defaultValue={0}
                rules={{ 
                  required: 'Budget is required',
                  min: { value: 1, message: 'Budget must be greater than 0' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="number"
                    label="Estimated Budget (USD)"
                    placeholder="e.g., 2500"
                    error={!!errors.estimated_budget}
                    helperText={errors.estimated_budget?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="transportation_mode"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Transportation Mode (Optional)"
                    placeholder="e.g., Flight, Train, Car"
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="accommodation_details"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Accommodation Details (Optional)"
                    multiline
                    rows={2}
                    placeholder="Hotel preferences, location, etc..."
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="additional_notes"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Additional Notes (Optional)"
                    multiline
                    rows={2}
                    placeholder="Any other relevant information..."
                  />
                )}
              />
            </Grid>
          </Grid>

          {error && (
            <Alert severity="error" sx={{ mt: 3 }}>
              {error}
            </Alert>
          )}

          <Box display="flex" gap={2} mt={4}>
            <Button
              variant="outlined"
              size="large"
              startIcon={<Save />}
              onClick={handleSubmit((data) => onSubmit(data, false))}
              disabled={submitting}
            >
              Save as Draft
            </Button>
            <Button
              variant="contained"
              size="large"
              startIcon={<Send />}
              onClick={handleSubmit((data) => onSubmit(data, true))}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit for Approval'}
            </Button>
            <Button
              variant="text"
              size="large"
              onClick={() => navigate('/my-requests')}
              disabled={submitting}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Paper>

      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={() => setSuccess('')}
        message={success}
      />
    </Box>
  );
};

export default NewRequestPage;
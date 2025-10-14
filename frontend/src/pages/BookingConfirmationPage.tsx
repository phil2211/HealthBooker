import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Divider,
} from '@mui/material';
import { apiService } from '../services/api';
import Header from '../components/Header';

interface Booking {
  id: string;
  therapistId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  cancellationToken: string;
  createdAt: string;
  updatedAt: string;
}

interface Therapist {
  id: string;
  name: string;
  specialization: string;
  bio: string;
  photoUrl?: string;
}

const BookingConfirmationPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [therapist, setTherapist] = useState<Therapist | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (token) {
      fetchBookingDetails();
    }
  }, [token]);

  const fetchBookingDetails = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await apiService.getBookingDetails(token);
      setBooking(response.booking);
      setTherapist(response.therapist);
    } catch (err: any) {
      setError('Booking not found or invalid token');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!token) return;

    try {
      setCancelling(true);
      await apiService.cancelBooking(token);
      setSuccess('Booking cancelled successfully');
      // Refresh booking details to show updated status
      await fetchBookingDetails();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to cancel booking');
    } finally {
      setCancelling(false);
    }
  };

  const handleReschedule = () => {
    navigate(`/booking/reschedule/${token}`);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <>
        <Header />
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
            <CircularProgress />
          </Box>
        </Container>
      </>
    );
  }

  if (error && !booking) {
    return (
      <>
        <Header />
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Container>
      </>
    );
  }

  if (!booking || !therapist) {
    return (
      <>
        <Header />
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
          <Alert severity="error">Booking not found</Alert>
        </Container>
      </>
    );
  }

  return (
    <>
      <Header />
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Appointment Details
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              {therapist.name}
            </Typography>
            <Typography variant="subtitle1" color="primary" gutterBottom>
              {therapist.specialization}
            </Typography>
            <Typography variant="body1" paragraph>
              {therapist.bio}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Appointment Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Date
                </Typography>
                <Typography variant="body1">
                  {formatDate(booking.date)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Time
                </Typography>
                <Typography variant="body1">
                  {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Status
                </Typography>
                <Typography variant="body1" color={booking.status === 'cancelled' ? 'error.main' : 'success.main'}>
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Booking ID
                </Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                  {booking.id}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Patient Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Name
                </Typography>
                <Typography variant="body1">
                  {booking.patientName}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1">
                  {booking.patientEmail}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Phone
                </Typography>
                <Typography variant="body1">
                  {booking.patientPhone}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {booking.status !== 'cancelled' && (
          <Box display="flex" gap={2} justifyContent="center">
            <Button
              variant="outlined"
              color="error"
              onClick={handleCancelBooking}
              disabled={cancelling}
            >
              {cancelling ? 'Cancelling...' : 'Cancel Appointment'}
            </Button>
            <Button
              variant="contained"
              onClick={handleReschedule}
            >
              Reschedule Appointment
            </Button>
          </Box>
        )}

        <Box textAlign="center" sx={{ mt: 3 }}>
          <Button
            variant="text"
            onClick={() => navigate('/')}
          >
            Return to Home
          </Button>
        </Box>
      </Container>
    </>
  );
};

export default BookingConfirmationPage;

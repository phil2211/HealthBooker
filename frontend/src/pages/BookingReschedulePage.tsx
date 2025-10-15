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
import WeeklyCalendar from '../components/WeeklyCalendar';

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

interface TimeSlot {
  date: string;
  startTime: string;
  endTime: string;
  status: 'available' | 'booked' | 'break' | 'unavailable' | 'blocked';
  bookingId?: string;
  patientName?: string;
  sessionStartTime?: string;
  sessionEndTime?: string;
  breakStartTime?: string;
  breakEndTime?: string;
}

const BookingReschedulePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [therapist, setTherapist] = useState<Therapist | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentWeekStart, setCurrentWeekStart] = useState<string>(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    return startOfWeek.toISOString().split('T')[0];
  });

  useEffect(() => {
    if (token) {
      fetchBookingDetails();
      fetchAvailability();
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

  const fetchAvailability = async (weekStart?: string) => {
    if (!booking?.therapistId) return;

    try {
      setSlotsLoading(true);
      const startDate = weekStart || currentWeekStart;
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(startDateObj);
      endDateObj.setDate(endDateObj.getDate() + 6);
      const endDate = endDateObj.toISOString().split('T')[0];
      
      const response = await apiService.getTherapistAvailability(booking.therapistId, startDate, endDate);
      setSlots(response.slots);
    } catch (err: any) {
      setError('Failed to fetch availability');
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
  };

  const handleWeekChange = (startDate: string) => {
    setCurrentWeekStart(startDate);
    fetchAvailability(startDate);
  };

  const handleReschedule = async () => {
    if (!token || !selectedSlot) return;

    try {
      setRescheduling(true);
      await apiService.updateBooking(
        token, 
        selectedSlot.date, 
        selectedSlot.sessionStartTime || selectedSlot.startTime, 
        selectedSlot.sessionEndTime || selectedSlot.endTime
      );
      setSuccess('Appointment rescheduled successfully!');
      // Navigate back to confirmation page after a short delay
      setTimeout(() => {
        navigate(`/booking/confirmation/${token}`);
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reschedule appointment');
    } finally {
      setRescheduling(false);
    }
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
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Reschedule Appointment
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

        {/* Current Appointment Info */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Current Appointment
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
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Health Worker
                </Typography>
                <Typography variant="body1">
                  {therapist.name} - {therapist.specialization}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* New Appointment Selection */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Select New Date & Time
            </Typography>
            
            {slotsLoading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : (
              <WeeklyCalendar
                slots={slots}
                onSlotSelect={handleSlotSelect}
                selectedSlot={selectedSlot}
                onWeekChange={handleWeekChange}
                currentWeekStart={currentWeekStart}
              />
            )}
          </CardContent>
        </Card>

        {/* Selected New Slot */}
        {selectedSlot && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                New Appointment Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Date
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(selectedSlot.date)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Time
                  </Typography>
                  <Typography variant="body1">
                    {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <Box display="flex" gap={2} justifyContent="center">
          <Button
            variant="outlined"
            onClick={() => navigate(`/booking/confirmation/${token}`)}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleReschedule}
            disabled={!selectedSlot || rescheduling}
          >
            {rescheduling ? 'Rescheduling...' : 'Confirm Reschedule'}
          </Button>
        </Box>
      </Container>
    </>
  );
};

export default BookingReschedulePage;

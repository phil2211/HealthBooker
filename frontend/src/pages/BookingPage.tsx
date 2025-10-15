import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Grid,
} from '@mui/material';
import { apiService } from '../services/api';
import Header from '../components/Header';
import WeeklyCalendar from '../components/WeeklyCalendar';

interface Therapist {
  id: string;
  name: string;
  specialization: string;
  bio: string;
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

const BookingPage: React.FC = () => {
  const { therapistId } = useParams<{ therapistId: string }>();
  const [therapist, setTherapist] = useState<Therapist | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    patientName: '',
    patientEmail: '',
    patientPhone: '',
  });
  const [currentWeekStart, setCurrentWeekStart] = useState<string>(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    return startOfWeek.toISOString().split('T')[0];
  });

  useEffect(() => {
    if (therapistId) {
      fetchTherapistProfile();
      fetchAvailability();
    }
  }, [therapistId]);

  const fetchTherapistProfile = async () => {
    if (!therapistId) return;

    try {
      setLoading(true);
      const response = await apiService.getTherapistProfile(therapistId);
      setTherapist(response.therapist);
    } catch (err: any) {
      setError('Therapist not found');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailability = async (weekStart?: string) => {
    if (!therapistId) return;

    try {
      setSlotsLoading(true);
      const startDate = weekStart || currentWeekStart;
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(startDateObj);
      endDateObj.setDate(endDateObj.getDate() + 6);
      const endDate = endDateObj.toISOString().split('T')[0];
      
      const response = await apiService.getTherapistAvailability(therapistId, startDate, endDate);
      setSlots(response.slots);
    } catch (err: any) {
      setError('Failed to fetch availability');
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setActiveStep(1);
  };

  const handleWeekChange = (startDate: string) => {
    setCurrentWeekStart(startDate);
    fetchAvailability(startDate);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleBookingSubmit = async () => {
    if (!therapistId || !selectedSlot) return;

    setBookingLoading(true);
    setError('');

    try {
      await apiService.createBooking({
        therapistId,
        patientName: formData.patientName,
        patientEmail: formData.patientEmail,
        patientPhone: formData.patientPhone,
        date: selectedSlot.date,
        startTime: selectedSlot.sessionStartTime || selectedSlot.startTime,
        endTime: selectedSlot.sessionEndTime || selectedSlot.endTime,
      });

      setSuccess('Booking confirmed! You will receive a confirmation email shortly.');
      setActiveStep(2);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Booking failed');
    } finally {
      setBookingLoading(false);
    }
  };

  const steps = ['Select Date & Time', 'Enter Details', 'Confirmation'];

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

  if (!therapist) {
    return (
      <>
        <Header />
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
          <Alert severity="error">Therapist not found</Alert>
        </Container>
      </>
    );
  }

  return (
    <>
      <Header />
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Book Appointment
        </Typography>

        {/* Therapist Info */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              {therapist.name}
            </Typography>
            <Typography variant="subtitle1" color="primary" gutterBottom>
              {therapist.specialization}
            </Typography>
            <Typography variant="body1">
              {therapist.bio}
            </Typography>
          </CardContent>
        </Card>

        {/* Booking Stepper */}
        <Card>
          <CardContent>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

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

            {/* Step 1: Date & Time Selection */}
            {activeStep === 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Select Date & Time
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
              </Box>
            )}

            {/* Step 2: Patient Details */}
            {activeStep === 1 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Enter Your Details
                </Typography>
                
                {selectedSlot && (
                  <Box sx={{ mb: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography variant="subtitle2">
                      Selected Appointment
                    </Typography>
                    <Typography variant="body2">
                      {new Date(selectedSlot.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Typography>
                    <Typography variant="body2">
                      {selectedSlot.startTime} - {selectedSlot.endTime}
                    </Typography>
                  </Box>
                )}

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      name="patientName"
                      value={formData.patientName}
                      onChange={handleFormChange}
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email"
                      name="patientEmail"
                      type="email"
                      value={formData.patientEmail}
                      onChange={handleFormChange}
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      name="patientPhone"
                      value={formData.patientPhone}
                      onChange={handleFormChange}
                      required
                    />
                  </Grid>
                </Grid>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                  <Button onClick={() => setActiveStep(0)}>
                    Back
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleBookingSubmit}
                    disabled={bookingLoading || !formData.patientName || !formData.patientEmail || !formData.patientPhone}
                  >
                    {bookingLoading ? 'Booking...' : 'Confirm Booking'}
                  </Button>
                </Box>
              </Box>
            )}

            {/* Step 3: Confirmation */}
            {activeStep === 2 && (
              <Box textAlign="center">
                <Typography variant="h6" gutterBottom>
                  Booking Confirmed!
                </Typography>
                <Typography variant="body1" paragraph>
                  Your appointment has been successfully booked.
                </Typography>
                {success && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    {success}
                  </Alert>
                )}
                <Box sx={{ mt: 3 }}>
                  <Button
                    variant="contained"
                    onClick={() => window.location.href = '/'}
                    sx={{ mr: 2 }}
                  >
                    Return to Home
                  </Button>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    </>
  );
};

export default BookingPage;

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { apiService } from '../services/api';
import Header from '../components/Header';

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
}

const BookingPage: React.FC = () => {
  const { therapistId } = useParams<{ therapistId: string }>();
  const [therapist, setTherapist] = useState<Therapist | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
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

  useEffect(() => {
    if (therapistId) {
      fetchTherapistProfile();
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

  const fetchAvailableSlots = async (date: Date) => {
    if (!therapistId) return;

    try {
      setSlotsLoading(true);
      const startDate = date.toISOString().split('T')[0];
      const endDate = new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const response = await apiService.getTherapistAvailability(therapistId, startDate, endDate);
      setAvailableSlots(response.availableSlots);
    } catch (err: any) {
      setError('Failed to fetch available slots');
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    if (date) {
      fetchAvailableSlots(date);
    }
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setActiveStep(1);
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
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
      });

      setSuccess('Booking confirmed! You will receive a confirmation email shortly.');
      setActiveStep(2);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Booking failed');
    } finally {
      setBookingLoading(false);
    }
  };

  const getSlotsForSelectedDate = () => {
    if (!selectedDate) return [];
    const dateStr = selectedDate.toISOString().split('T')[0];
    return availableSlots.filter(slot => slot.date === dateStr);
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
                
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Select Date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    minDate={new Date()}
                    sx={{ mb: 3 }}
                  />
                </LocalizationProvider>

                {selectedDate && (
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      Available Times for {selectedDate.toLocaleDateString()}
                    </Typography>
                    
                    {slotsLoading ? (
                      <Box display="flex" justifyContent="center" p={2}>
                        <CircularProgress />
                      </Box>
                    ) : (
                      <Grid container spacing={2}>
                        {getSlotsForSelectedDate().map((slot, index) => (
                          <Grid item xs={6} sm={4} md={3} key={index}>
                            <Button
                              variant={selectedSlot?.startTime === slot.startTime ? 'contained' : 'outlined'}
                              fullWidth
                              onClick={() => handleSlotSelect(slot)}
                            >
                              {slot.startTime}
                            </Button>
                          </Grid>
                        ))}
                      </Grid>
                    )}

                    {getSlotsForSelectedDate().length === 0 && !slotsLoading && (
                      <Typography variant="body2" color="text.secondary">
                        No available slots for this date. Please select another date.
                      </Typography>
                    )}
                  </Box>
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
                  You will receive a confirmation email with your appointment details and cancellation link.
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => window.location.href = '/'}
                >
                  Return to Home
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    </>
  );
};

export default BookingPage;

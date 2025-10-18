import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import Header from '../components/Header';
import AvailabilityManager from '../components/AvailabilityManager';
import CurrentAvailability from '../components/CurrentAvailability';

interface Booking {
  id: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
}

const TherapistDashboard: React.FC = () => {
  const { therapist } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAvailabilityManager, setShowAvailabilityManager] = useState(false);

  useEffect(() => {
    if (therapist) {
      fetchBookings();
    }
  }, [therapist]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await apiService.getBookings();
      setBookings(response.bookings);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getBookingUrl = () => {
    if (therapist) {
      return `${window.location.origin}/book/${therapist.id}`;
    }
    return '';
  };

  if (!therapist) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Header />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome, {therapist.name}!
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Profile Card */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Your Profile
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Specialization:</strong> {therapist.specialization}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Bio:</strong> {therapist.bio}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Your Booking URL:
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    backgroundColor: '#f5f5f5', 
                    padding: 1, 
                    borderRadius: 1,
                    fontFamily: 'monospace',
                    wordBreak: 'break-all'
                  }}>
                    {getBookingUrl()}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    onClick={() => setShowAvailabilityManager(!showAvailabilityManager)}
                  >
                    {showAvailabilityManager ? 'Hide' : 'Manage'} Availability
                  </Button>
                  <Button variant="outlined" onClick={fetchBookings}>
                    Refresh Bookings
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Current Availability */}
          <Grid item xs={12}>
            <CurrentAvailability />
          </Grid>

          {/* Availability Manager */}
          {showAvailabilityManager && (
            <Grid item xs={12}>
              <AvailabilityManager />
            </Grid>
          )}

          {/* Bookings Table */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Bookings
                </Typography>
                
                {loading ? (
                  <Box display="flex" justifyContent="center" p={3}>
                    <CircularProgress />
                  </Box>
                ) : bookings.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No bookings yet. Share your booking URL to get started!
                  </Typography>
                ) : (
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Patient</TableCell>
                          <TableCell>Date</TableCell>
                          <TableCell>Time</TableCell>
                          <TableCell>Contact</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Booked</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {bookings.map((booking) => (
                          <TableRow key={booking.id}>
                            <TableCell>{booking.patientName}</TableCell>
                            <TableCell>{formatDate(booking.date)}</TableCell>
                            <TableCell>
                              {booking.startTime} - {booking.endTime}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {booking.patientEmail}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {booking.patientPhone}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={booking.status}
                                color={getStatusColor(booking.status) as any}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              {new Date(booking.createdAt).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </>
  );
};

export default TherapistDashboard;

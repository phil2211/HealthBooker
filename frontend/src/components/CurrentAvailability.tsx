import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Chip,
  Grid,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

interface TimeSlot {
  day: number;
  startTime: string;
  endTime: string;
}

interface BlockedSlot {
  date: string;
  startTime: string;
  endTime: string;
}

const CurrentAvailability: React.FC = () => {
  const { therapist } = useAuth();
  const [weeklyAvailability, setWeeklyAvailability] = useState<TimeSlot[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const days = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  useEffect(() => {
    if (therapist) {
      loadCurrentAvailability();
    }
  }, [therapist]);

  const loadCurrentAvailability = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiService.getCurrentAvailability();
      setWeeklyAvailability(response.weeklyAvailability || []);
      setBlockedSlots(response.blockedSlots || []);
    } catch (err: any) {
      console.error('Failed to load availability:', err);
      setError('Failed to load availability settings');
    } finally {
      setLoading(false);
    }
  };

  if (!therapist) {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="100px">
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Current Availability Settings
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Weekly Availability */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Weekly Availability
          </Typography>
          
          {weeklyAvailability.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No weekly availability set. Click "Manage Availability" to add your schedule.
            </Typography>
          ) : (
            <Grid container spacing={1}>
              {weeklyAvailability.map((slot, index) => (
                <Grid item key={index}>
                  <Chip
                    label={`${days[slot.day]}: ${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}`}
                    variant="outlined"
                    color="primary"
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        {/* Blocked Slots */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Blocked Dates/Times
          </Typography>
          
          {blockedSlots.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No blocked dates set.
            </Typography>
          ) : (
            <Grid container spacing={1}>
              {blockedSlots.map((slot, index) => (
                <Grid item key={index}>
                  <Chip
                    label={`${formatDate(slot.date)}: ${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}`}
                    variant="outlined"
                    color="error"
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default CurrentAvailability;

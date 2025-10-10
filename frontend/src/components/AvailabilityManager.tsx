import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Alert,
  CircularProgress,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
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

const AvailabilityManager: React.FC = () => {
  const { therapist } = useAuth();
  const [weeklyAvailability, setWeeklyAvailability] = useState<TimeSlot[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const days = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
  ];

  useEffect(() => {
    if (therapist) {
      // Initialize with empty availability if none exists
      setWeeklyAvailability([]);
      setBlockedSlots([]);
    }
  }, [therapist]);

  const addWeeklySlot = () => {
    setWeeklyAvailability([...weeklyAvailability, { day: 1, startTime: '09:00', endTime: '17:00' }]);
  };

  const updateWeeklySlot = (index: number, field: keyof TimeSlot, value: string | number) => {
    const updated = [...weeklyAvailability];
    updated[index] = { ...updated[index], [field]: value };
    setWeeklyAvailability(updated);
  };

  const removeWeeklySlot = (index: number) => {
    setWeeklyAvailability(weeklyAvailability.filter((_, i) => i !== index));
  };

  const addBlockedSlot = () => {
    const today = new Date().toISOString().split('T')[0];
    setBlockedSlots([...blockedSlots, { date: today, startTime: '09:00', endTime: '17:00' }]);
  };

  const updateBlockedSlot = (index: number, field: keyof BlockedSlot, value: string) => {
    const updated = [...blockedSlots];
    updated[index] = { ...updated[index], [field]: value };
    setBlockedSlots(updated);
  };

  const removeBlockedSlot = (index: number) => {
    setBlockedSlots(blockedSlots.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!therapist) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await apiService.updateAvailability(weeklyAvailability, blockedSlots);
      setSuccess('Availability updated successfully!');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update availability');
    } finally {
      setLoading(false);
    }
  };

  if (!therapist) {
    return null;
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Manage Your Availability
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

        {/* Weekly Availability */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" gutterBottom>
            Weekly Availability
          </Typography>
          
          {weeklyAvailability.map((slot, index) => (
            <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth>
                  <InputLabel>Day</InputLabel>
                  <Select
                    value={slot.day}
                    onChange={(e) => updateWeeklySlot(index, 'day', e.target.value as number)}
                  >
                    {days.map((day, dayIndex) => (
                      <MenuItem key={dayIndex} value={dayIndex}>
                        {day}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth>
                  <InputLabel>Start Time</InputLabel>
                  <Select
                    value={slot.startTime}
                    onChange={(e) => updateWeeklySlot(index, 'startTime', e.target.value)}
                  >
                    {timeSlots.map((time) => (
                      <MenuItem key={time} value={time}>
                        {time}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth>
                  <InputLabel>End Time</InputLabel>
                  <Select
                    value={slot.endTime}
                    onChange={(e) => updateWeeklySlot(index, 'endTime', e.target.value)}
                  >
                    {timeSlots.map((time) => (
                      <MenuItem key={time} value={time}>
                        {time}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => removeWeeklySlot(index)}
                  sx={{ height: '56px' }}
                >
                  Remove
                </Button>
              </Grid>
            </Grid>
          ))}

          <Button variant="outlined" onClick={addWeeklySlot}>
            Add Weekly Slot
          </Button>
        </Box>

        {/* Blocked Slots */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" gutterBottom>
            Block Specific Dates/Times
          </Typography>
          
          {blockedSlots.map((slot, index) => (
            <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Date"
                  type="date"
                  value={slot.date}
                  onChange={(e) => updateBlockedSlot(index, 'date', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth>
                  <InputLabel>Start Time</InputLabel>
                  <Select
                    value={slot.startTime}
                    onChange={(e) => updateBlockedSlot(index, 'startTime', e.target.value)}
                  >
                    {timeSlots.map((time) => (
                      <MenuItem key={time} value={time}>
                        {time}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth>
                  <InputLabel>End Time</InputLabel>
                  <Select
                    value={slot.endTime}
                    onChange={(e) => updateBlockedSlot(index, 'endTime', e.target.value)}
                  >
                    {timeSlots.map((time) => (
                      <MenuItem key={time} value={time}>
                        {time}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => removeBlockedSlot(index)}
                  sx={{ height: '56px' }}
                >
                  Remove
                </Button>
              </Grid>
            </Grid>
          ))}

          <Button variant="outlined" onClick={addBlockedSlot}>
            Add Blocked Slot
          </Button>
        </Box>

        {/* Save Button */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Saving...' : 'Save Availability'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default AvailabilityManager;

import React from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Paper,
} from '@mui/material';

interface TimeSlot {
  date: string;
  startTime: string;
  endTime: string;
  status: 'available' | 'booked' | 'break' | 'unavailable' | 'blocked';
  bookingId?: string;
  patientName?: string;
}

interface WeeklyCalendarProps {
  slots: TimeSlot[];
  onSlotSelect: (slot: TimeSlot) => void;
  selectedSlot?: TimeSlot | null;
}

const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({
  slots,
  onSlotSelect,
  selectedSlot,
}) => {
  // Group slots by date
  const slotsByDate = slots.reduce((acc, slot) => {
    if (!acc[slot.date]) {
      acc[slot.date] = [];
    }
    acc[slot.date].push(slot);
    return acc;
  }, {} as Record<string, TimeSlot[]>);

  // Sort slots by time within each date
  Object.keys(slotsByDate).forEach(date => {
    slotsByDate[date].sort((a, b) => a.startTime.localeCompare(b.startTime));
  });

  // Get unique dates and sort them
  const dates = Object.keys(slotsByDate).sort();
  
  // Get all unique time slots across all dates
  const allTimeSlots = Array.from(
    new Set(slots.map(slot => `${slot.startTime}-${slot.endTime}`))
  ).sort();

  const getSlotColor = (status: string) => {
    switch (status) {
      case 'available':
        return '#4caf50'; // Green
      case 'booked':
        return '#ff9800'; // Orange
      case 'break':
        return '#9e9e9e'; // Gray
      case 'unavailable':
      case 'blocked':
        return '#757575'; // Darker gray
      default:
        return '#e0e0e0'; // Light gray
    }
  };

  const getSlotTextColor = (status: string) => {
    return status === 'available' ? '#ffffff' : '#000000';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
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

  const isSlotSelected = (slot: TimeSlot) => {
    return selectedSlot && 
           selectedSlot.date === slot.date && 
           selectedSlot.startTime === slot.startTime;
  };

  return (
    <Box>
      {/* Legend */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Calendar Legend
          </Typography>
          <Box display="flex" gap={2} flexWrap="wrap">
            <Chip
              label="Available"
              sx={{ backgroundColor: '#4caf50', color: 'white' }}
              size="small"
            />
            <Chip
              label="Booked"
              sx={{ backgroundColor: '#ff9800', color: 'white' }}
              size="small"
            />
            <Chip
              label="Break"
              sx={{ backgroundColor: '#9e9e9e', color: 'white' }}
              size="small"
            />
            <Chip
              label="Unavailable"
              sx={{ backgroundColor: '#757575', color: 'white' }}
              size="small"
            />
          </Box>
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      <Paper sx={{ overflow: 'auto' }}>
        <Box sx={{ minWidth: 800 }}>
          {/* Header Row */}
          <Grid container>
            <Grid item xs={2}>
              <Box sx={{ p: 2, borderRight: 1, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  Time
                </Typography>
              </Box>
            </Grid>
            {dates.map((date) => (
              <Grid item xs key={date}>
                <Box sx={{ p: 2, borderRight: 1, borderBottom: 1, borderColor: 'divider', textAlign: 'center' }}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    {formatDate(date)}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* Time Slots */}
          {allTimeSlots.map((timeSlot) => {
            const [startTime, endTime] = timeSlot.split('-');
            return (
              <Grid container key={timeSlot}>
                {/* Time Column */}
                <Grid item xs={2}>
                  <Box sx={{ p: 2, borderRight: 1, borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="body2">
                      {formatTime(startTime)}
                    </Typography>
                  </Box>
                </Grid>

                {/* Date Columns */}
                {dates.map((date) => {
                  const slot = slotsByDate[date]?.find(
                    s => s.startTime === startTime && s.endTime === endTime
                  );

                  if (!slot) {
                    return (
                      <Grid item xs key={`${date}-${timeSlot}`}>
                        <Box sx={{ p: 2, borderRight: 1, borderBottom: 1, borderColor: 'divider', minHeight: 60 }} />
                      </Grid>
                    );
                  }

                  return (
                    <Grid item xs key={`${date}-${timeSlot}`}>
                      <Box sx={{ p: 1, borderRight: 1, borderBottom: 1, borderColor: 'divider', minHeight: 60 }}>
                        <Button
                          fullWidth
                          variant={isSlotSelected(slot) ? 'contained' : 'outlined'}
                          disabled={slot.status !== 'available'}
                          onClick={() => slot.status === 'available' && onSlotSelect(slot)}
                          sx={{
                            backgroundColor: slot.status === 'available' ? getSlotColor(slot.status) : 'transparent',
                            color: slot.status === 'available' ? getSlotTextColor(slot.status) : 'text.primary',
                            borderColor: getSlotColor(slot.status),
                            minHeight: 50,
                            fontSize: '0.75rem',
                            textTransform: 'none',
                            '&:hover': {
                              backgroundColor: slot.status === 'available' ? getSlotColor(slot.status) : 'transparent',
                            },
                            '&:disabled': {
                              backgroundColor: 'transparent',
                              color: 'text.secondary',
                              borderColor: getSlotColor(slot.status),
                            },
                          }}
                        >
                          <Box textAlign="center">
                            <Typography variant="caption" display="block">
                              {slot.status === 'booked' ? 'Booked' : 
                               slot.status === 'break' ? 'Break' :
                               slot.status === 'unavailable' || slot.status === 'blocked' ? 'Unavailable' :
                               'Available'}
                            </Typography>
                            {slot.patientName && (
                              <Typography variant="caption" display="block" sx={{ fontSize: '0.65rem' }}>
                                {slot.patientName}
                              </Typography>
                            )}
                          </Box>
                        </Button>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            );
          })}
        </Box>
      </Paper>
    </Box>
  );
};

export default WeeklyCalendar;

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Paper,
  IconButton,
  useMediaQuery,
  useTheme,
  Stack,
  Divider,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  CalendarToday,
} from '@mui/icons-material';

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

interface WeeklyCalendarProps {
  slots: TimeSlot[];
  onSlotSelect: (slot: TimeSlot) => void;
  selectedSlot?: TimeSlot | null;
  onWeekChange?: (startDate: string) => void;
  currentWeekStart?: string;
}

const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({
  slots,
  onSlotSelect,
  selectedSlot,
  onWeekChange,
  currentWeekStart,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  
  const [weekStart, setWeekStart] = useState<string>(() => {
    if (currentWeekStart) return currentWeekStart;
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    return startOfWeek.toISOString().split('T')[0];
  });

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

  // Week navigation functions
  const goToPreviousWeek = () => {
    const newWeekStart = new Date(weekStart);
    newWeekStart.setDate(newWeekStart.getDate() - 7);
    const newWeekStartStr = newWeekStart.toISOString().split('T')[0];
    setWeekStart(newWeekStartStr);
    
    if (onWeekChange) {
      onWeekChange(newWeekStartStr);
    }
  };

  const goToNextWeek = () => {
    const newWeekStart = new Date(weekStart);
    newWeekStart.setDate(newWeekStart.getDate() + 7);
    const newWeekStartStr = newWeekStart.toISOString().split('T')[0];
    setWeekStart(newWeekStartStr);
    
    if (onWeekChange) {
      onWeekChange(newWeekStartStr);
    }
  };

  const goToCurrentWeek = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const weekStartStr = startOfWeek.toISOString().split('T')[0];
    setWeekStart(weekStartStr);
    
    if (onWeekChange) {
      onWeekChange(weekStartStr);
    }
  };

  // Update week start when currentWeekStart prop changes
  useEffect(() => {
    if (currentWeekStart && currentWeekStart !== weekStart) {
      setWeekStart(currentWeekStart);
    }
  }, [currentWeekStart]);

  const getSlotColor = (status: string, isPast: boolean = false) => {
    if (isPast) {
      return '#bdbdbd'; // Light gray for past slots
    }
    
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

  const formatWeekRange = (weekStartStr: string) => {
    const startDate = new Date(weekStartStr);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    
    const startFormatted = startDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    const endFormatted = endDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    
    return `${startFormatted} - ${endFormatted}`;
  };

  const isSlotSelected = (slot: TimeSlot) => {
    return selectedSlot && 
           selectedSlot.date === slot.date && 
           selectedSlot.startTime === slot.startTime;
  };

  const isSlotInPast = (slot: TimeSlot) => {
    const slotDate = new Date(slot.date);
    const slotDateTime = new Date(slotDate);
    
    // Parse the start time
    const [hours, minutes] = slot.startTime.split(':');
    slotDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    const now = new Date();
    
    return slotDateTime < now;
  };

  // Mobile layout - stacked cards for each date
  const renderMobileLayout = () => (
    <Box>
      {/* Week Navigation */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 2 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <IconButton onClick={goToPreviousWeek} size="small">
              <ChevronLeft />
            </IconButton>
            
            <Box textAlign="center" flex={1}>
              <Typography variant="h6" gutterBottom>
                {formatWeekRange(weekStart)}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<CalendarToday />}
                onClick={goToCurrentWeek}
              >
                Today
              </Button>
            </Box>
            
            <IconButton onClick={goToNextWeek} size="small">
              <ChevronRight />
            </IconButton>
          </Box>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ py: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Legend
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
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
            <Chip
              label="Past"
              sx={{ backgroundColor: '#bdbdbd', color: 'black' }}
              size="small"
            />
          </Box>
        </CardContent>
      </Card>

      {/* Mobile Date Cards */}
      <Stack spacing={2}>
        {dates.map((date) => (
          <Card key={date} variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {formatDate(date)}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={1}>
                {slotsByDate[date]?.map((slot) => (
                  <Grid item xs={6} sm={4} key={`${slot.startTime}-${slot.endTime}`}>
                    <Button
                      fullWidth
                      variant={isSlotSelected(slot) ? 'contained' : 'outlined'}
                      disabled={slot.status !== 'available' || isSlotInPast(slot)}
                      onClick={() => slot.status === 'available' && !isSlotInPast(slot) && onSlotSelect(slot)}
                      sx={{
                        backgroundColor: slot.status === 'available' && !isSlotInPast(slot) ? getSlotColor(slot.status) : 'transparent',
                        color: slot.status === 'available' && !isSlotInPast(slot) ? getSlotTextColor(slot.status) : 'text.primary',
                        borderColor: getSlotColor(slot.status, isSlotInPast(slot)),
                        minHeight: 60,
                        fontSize: '0.75rem',
                        textTransform: 'none',
                        '&:hover': {
                          backgroundColor: slot.status === 'available' && !isSlotInPast(slot) ? getSlotColor(slot.status) : 'transparent',
                        },
                        '&:disabled': {
                          backgroundColor: 'transparent',
                          color: 'text.secondary',
                          borderColor: getSlotColor(slot.status, isSlotInPast(slot)),
                        },
                      }}
                    >
                      <Box textAlign="center">
                        <Typography variant="caption" display="block" fontWeight="bold">
                          {slot.sessionStartTime ? formatTime(slot.sessionStartTime) : formatTime(slot.startTime)}
                        </Typography>
                        <Typography variant="caption" display="block">
                          {isSlotInPast(slot) ? 'Past' :
                           slot.status === 'booked' ? 'Booked' : 
                           slot.status === 'break' ? 'Break' :
                           slot.status === 'unavailable' || slot.status === 'blocked' ? 'Unavailable' :
                           'Available'}
                        </Typography>
                        {slot.patientName && (
                          <Typography variant="caption" display="block" sx={{ fontSize: '0.65rem' }}>
                            {slot.patientName}
                          </Typography>
                        )}
                        {slot.status === 'available' && slot.sessionEndTime && (
                          <Typography variant="caption" display="block" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                            Session: {formatTime(slot.sessionStartTime!)}-{formatTime(slot.sessionEndTime)}
                          </Typography>
                        )}
                      </Box>
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  );

  // Desktop layout - traditional grid
  const renderDesktopLayout = () => (
    <Box>
      {/* Week Navigation */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 2 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <IconButton onClick={goToPreviousWeek}>
              <ChevronLeft />
            </IconButton>
            
            <Box textAlign="center" flex={1}>
              <Typography variant="h6" gutterBottom>
                {formatWeekRange(weekStart)}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<CalendarToday />}
                onClick={goToCurrentWeek}
              >
                Go to Current Week
              </Button>
            </Box>
            
            <IconButton onClick={goToNextWeek}>
              <ChevronRight />
            </IconButton>
          </Box>
        </CardContent>
      </Card>

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
            <Chip
              label="Past"
              sx={{ backgroundColor: '#bdbdbd', color: 'black' }}
              size="small"
            />
          </Box>
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      <Paper sx={{ overflow: 'auto' }}>
        <Box sx={{ minWidth: isTablet ? 600 : 800 }}>
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
                          disabled={slot.status !== 'available' || isSlotInPast(slot)}
                          onClick={() => slot.status === 'available' && !isSlotInPast(slot) && onSlotSelect(slot)}
                          sx={{
                            backgroundColor: slot.status === 'available' && !isSlotInPast(slot) ? getSlotColor(slot.status) : 'transparent',
                            color: slot.status === 'available' && !isSlotInPast(slot) ? getSlotTextColor(slot.status) : 'text.primary',
                            borderColor: getSlotColor(slot.status, isSlotInPast(slot)),
                            minHeight: 50,
                            fontSize: '0.75rem',
                            textTransform: 'none',
                            '&:hover': {
                              backgroundColor: slot.status === 'available' && !isSlotInPast(slot) ? getSlotColor(slot.status) : 'transparent',
                            },
                            '&:disabled': {
                              backgroundColor: 'transparent',
                              color: 'text.secondary',
                              borderColor: getSlotColor(slot.status, isSlotInPast(slot)),
                            },
                          }}
                        >
                          <Box textAlign="center">
                            <Typography variant="caption" display="block">
                              {isSlotInPast(slot) ? 'Past' :
                               slot.status === 'booked' ? 'Booked' : 
                               slot.status === 'break' ? 'Break' :
                               slot.status === 'unavailable' || slot.status === 'blocked' ? 'Unavailable' :
                               'Available'}
                            </Typography>
                            {slot.patientName && (
                              <Typography variant="caption" display="block" sx={{ fontSize: '0.65rem' }}>
                                {slot.patientName}
                              </Typography>
                            )}
                            {slot.status === 'available' && slot.sessionEndTime && (
                              <Typography variant="caption" display="block" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                                {formatTime(slot.sessionStartTime!)}-{formatTime(slot.sessionEndTime)}
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

  return isMobile ? renderMobileLayout() : renderDesktopLayout();
};

export default WeeklyCalendar;

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { connectToDatabase, Therapist, Booking } from './layers';
import { createResponse, createErrorResponse, getPathParameter, getQueryParameter, handleCors } from './layers/utils/apiHelpers';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  // Handle CORS
  const corsResponse = handleCors(event);
  if (corsResponse) return corsResponse;

  try {
    await connectToDatabase();
    
    const therapistId = getPathParameter(event, 'id');
    if (!therapistId) {
      return createErrorResponse(400, 'Therapist ID is required');
    }

    const startDate = getQueryParameter(event, 'startDate');
    const endDate = getQueryParameter(event, 'endDate');

    if (!startDate || !endDate) {
      return createErrorResponse(400, 'startDate and endDate are required');
    }

    const therapist = await Therapist.findById(therapistId);
    if (!therapist) {
      return createErrorResponse(404, 'Therapist not found');
    }

    // Get existing bookings for the date range
    const bookings = await Booking.find({
      therapistId,
      date: { $gte: startDate, $lte: endDate },
      status: { $ne: 'cancelled' }
    });

    // Generate available time slots
    const availableSlots = generateAvailableSlots(
      therapist.weeklyAvailability,
      therapist.blockedSlots,
      bookings,
      startDate,
      endDate
    );

    return createResponse(200, {
      slots: availableSlots
    });

  } catch (error) {
    console.error('Get availability error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};

function generateAvailableSlots(
  weeklyAvailability: any[],
  blockedSlots: any[],
  bookings: any[],
  startDate: string,
  endDate: string
): any[] {
  const slots: any[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dayOfWeek = date.getDay();
    const dateStr = date.toISOString().split('T')[0];

    // Find weekly availability for this day
    const dayAvailability = weeklyAvailability.find(avail => avail.day === dayOfWeek);
    if (!dayAvailability) {
      // No availability for this day - add unavailable slots
      slots.push({
        date: dateStr,
        startTime: '00:00',
        endTime: '23:59',
        status: 'unavailable'
      });
      continue;
    }

    // Check if this date is blocked
    const isBlocked = blockedSlots.some(blocked => blocked.date === dateStr);
    if (isBlocked) {
      // Entire day is blocked
      slots.push({
        date: dateStr,
        startTime: '00:00',
        endTime: '23:59',
        status: 'blocked'
      });
      continue;
    }

    // Generate 90-minute slots (60 min session + 30 min break)
    const startTime = parseTime(dayAvailability.startTime);
    const endTime = parseTime(dayAvailability.endTime);
    const slotDuration = 90; // 90 minutes per slot (60 min session + 30 min break)

    // Create a list of all blocked time periods from bookings
    const blockedPeriods = [];
    bookings.forEach(booking => {
      if (booking.date === dateStr) {
        const bookingStartTime = parseTime(booking.startTime);
        const bookingEndTime = bookingStartTime + 60; // 60 minutes for actual session
        
        // Add booking period (60 minutes)
        blockedPeriods.push({
          start: bookingStartTime,
          end: bookingEndTime,
          type: 'booked',
          booking: booking
        });
      }
    });

    // Sort blocked periods by start time
    blockedPeriods.sort((a, b) => a.start - b.start);

    // Generate 90-minute slots intelligently
    let currentTime = startTime;
    let availableSlotCount = 0;
    const maxSlotsPerDay = 2; // Limit to 2 slots per day
    
    while (currentTime + slotDuration <= endTime && availableSlotCount < maxSlotsPerDay) {
      const slotEndTime = currentTime + slotDuration;
      
      // Check if this 90-minute slot conflicts with any booking
      // A slot conflicts if the SESSION part (first 60 minutes) overlaps with a booking
      const sessionEndTime = currentTime + 60; // First 60 minutes are the session
      const conflictsWithBooking = blockedPeriods.some(blocked => {
        // Session overlaps with booking if:
        // - Session starts before booking ends AND session ends after booking starts
        return currentTime < blocked.end && sessionEndTime > blocked.start;
      });

      if (!conflictsWithBooking) {
        // Add available 90-minute slot
        slots.push({
          date: dateStr,
          startTime: formatTime(currentTime),
          endTime: formatTime(slotEndTime),
          status: 'available',
          sessionStartTime: formatTime(currentTime),
          sessionEndTime: formatTime(currentTime + 60), // First 60 minutes are the session
          breakStartTime: formatTime(currentTime + 60),
          breakEndTime: formatTime(slotEndTime) // Last 30 minutes are the break
        });
        availableSlotCount++;
        currentTime += slotDuration; // Move to next 90-minute slot
      } else {
        // Find the next available time after the conflicting booking
        const conflictingBooking = blockedPeriods.find(blocked => 
          currentTime < blocked.end && sessionEndTime > blocked.start
        );
        
        if (conflictingBooking) {
          // Move to 30 minutes after the booking ends (to allow for break)
          const nextAvailableTime = conflictingBooking.end + 30;
          currentTime = nextAvailableTime;
        } else {
          currentTime += slotDuration; // Fallback: move to next 90-minute slot
        }
      }
    }

    // Add booked slots (60 minutes each)
    blockedPeriods.forEach(blocked => {
      if (blocked.type === 'booked') {
        slots.push({
          date: dateStr,
          startTime: formatTime(blocked.start),
          endTime: formatTime(blocked.end),
          status: 'booked',
          bookingId: blocked.booking._id,
          patientName: blocked.booking.patientName,
          sessionStartTime: formatTime(blocked.start),
          sessionEndTime: formatTime(blocked.end)
        });
      }
    });

    // Sort slots by start time
    slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  return slots;
}

function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

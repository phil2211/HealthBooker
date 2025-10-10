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
      availableSlots
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
    if (!dayAvailability) continue;

    // Check if this date is blocked
    const isBlocked = blockedSlots.some(blocked => blocked.date === dateStr);
    if (isBlocked) continue;

    // Generate time slots for this day
    const startTime = parseTime(dayAvailability.startTime);
    const endTime = parseTime(dayAvailability.endTime);
    const slotDuration = 60; // 60 minutes per slot

    for (let time = startTime; time < endTime; time += slotDuration) {
      const slotStartTime = formatTime(time);
      const slotEndTime = formatTime(time + slotDuration);

      // Check if this slot is booked
      const isBooked = bookings.some(booking => 
        booking.date === dateStr && 
        booking.startTime === slotStartTime
      );

      if (!isBooked) {
        slots.push({
          date: dateStr,
          startTime: slotStartTime,
          endTime: slotEndTime
        });
      }
    }
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

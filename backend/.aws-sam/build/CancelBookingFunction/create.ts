import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { connectToDatabase, Therapist, Booking } from '../../layers';
import { createResponse, createErrorResponse, parseBody, handleCors } from '../../layers/utils/apiHelpers';
import { sendBookingConfirmationEmail } from '../notifications/sendEmail';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  // Handle CORS
  const corsResponse = handleCors(event);
  if (corsResponse) return corsResponse;

  try {
    await connectToDatabase();
    
    const body = parseBody(event);
    const { 
      therapistId, 
      patientName, 
      patientEmail, 
      patientPhone, 
      date, 
      startTime, 
      endTime 
    } = body;

    // Validate required fields
    if (!therapistId || !patientName || !patientEmail || !patientPhone || !date || !startTime || !endTime) {
      return createErrorResponse(400, 'All fields are required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(patientEmail)) {
      return createErrorResponse(400, 'Invalid email format');
    }

    // Check if therapist exists
    const therapist = await Therapist.findById(therapistId);
    if (!therapist) {
      return createErrorResponse(404, 'Therapist not found');
    }

    // Check if slot is available
    const existingBooking = await Booking.findOne({
      therapistId,
      date,
      startTime,
      status: { $ne: 'cancelled' }
    });

    if (existingBooking) {
      return createErrorResponse(409, 'This time slot is already booked');
    }

    // Validate date is not in the past
    const bookingDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (bookingDate < today) {
      return createErrorResponse(400, 'Cannot book appointments in the past');
    }

    // Generate cancellation token
    const cancellationToken = uuidv4();

    // Create booking
    const booking = new Booking({
      therapistId,
      patientName,
      patientEmail,
      patientPhone,
      date,
      startTime,
      endTime,
      status: 'confirmed',
      cancellationToken
    });

    await booking.save();

    // Send confirmation emails
    try {
      await sendBookingConfirmationEmail(booking, therapist);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail the booking if email fails
    }

    return createResponse(201, {
      message: 'Booking created successfully',
      booking: {
        id: booking._id,
        cancellationToken: booking.cancellationToken,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status
      }
    });

  } catch (error) {
    console.error('Create booking error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};

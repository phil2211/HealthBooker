import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { connectToDatabase, Booking, Therapist } from './layers';
import { createResponse, createErrorResponse, getPathParameter, handleCors } from './layers/utils/apiHelpers';
import { sendCancellationEmail } from './notifications/sendEmail';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  // Handle CORS
  const corsResponse = handleCors(event);
  if (corsResponse) return corsResponse;

  try {
    await connectToDatabase();
    
    const cancellationToken = getPathParameter(event, 'token');
    if (!cancellationToken) {
      return createErrorResponse(400, 'Cancellation token is required');
    }

    // Find booking by cancellation token
    const booking = await Booking.findOne({ cancellationToken });
    if (!booking) {
      return createErrorResponse(404, 'Booking not found');
    }

    // Check if booking is already cancelled
    if (booking.status === 'cancelled') {
      return createErrorResponse(400, 'Booking is already cancelled');
    }

    // Check if cancellation is allowed (24 hours before appointment)
    const appointmentDate = new Date(`${booking.date}T${booking.startTime}`);
    const now = new Date();
    const hoursUntilAppointment = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilAppointment < 24) {
      return createErrorResponse(400, 'Cancellation must be made at least 24 hours before the appointment');
    }

    // Update booking status
    booking.status = 'cancelled';
    await booking.save();

    // Get therapist info for email
    const therapist = await Therapist.findById(booking.therapistId);
    if (therapist) {
      try {
        await sendCancellationEmail(booking, therapist);
      } catch (emailError) {
        console.error('Cancellation email sending failed:', emailError);
        // Don't fail the cancellation if email fails
      }
    }

    return createResponse(200, {
      message: 'Booking cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel booking error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};

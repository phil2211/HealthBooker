import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { connectToDatabase, Therapist, Booking } from '../../layers';
import { createResponse, createErrorResponse, getQueryParameter, handleCors } from '../../layers/utils/apiHelpers';
import { extractTokenFromHeader, verifyToken } from '../../layers/utils/auth';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  // Handle CORS
  const corsResponse = handleCors(event);
  if (corsResponse) return corsResponse;

  try {
    await connectToDatabase();
    
    const token = extractTokenFromHeader(event.headers.Authorization);
    if (!token) {
      return createErrorResponse(401, 'No token provided');
    }

    const payload = verifyToken(token);
    const therapist = await Therapist.findById(payload.therapistId);
    
    if (!therapist) {
      return createErrorResponse(404, 'Therapist not found');
    }

    const status = getQueryParameter(event, 'status') || 'all';
    const limit = parseInt(getQueryParameter(event, 'limit') || '50');
    const offset = parseInt(getQueryParameter(event, 'offset') || '0');

    // Build query
    const query: any = { therapistId: therapist._id };
    if (status !== 'all') {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .sort({ date: 1, startTime: 1 })
      .limit(limit)
      .skip(offset);

    const totalCount = await Booking.countDocuments(query);

    return createResponse(200, {
      bookings: bookings.map(booking => ({
        id: booking._id,
        patientName: booking.patientName,
        patientEmail: booking.patientEmail,
        patientPhone: booking.patientPhone,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
        createdAt: booking.createdAt
      })),
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    });

  } catch (error) {
    console.error('Get bookings error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};

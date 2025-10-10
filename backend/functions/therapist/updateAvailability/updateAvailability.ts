import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { connectToDatabase, Therapist } from './layers';
import { createResponse, createErrorResponse, parseBody, handleCors } from './layers/utils/apiHelpers';
import { extractTokenFromHeader, verifyToken } from './layers/utils/auth';

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

    const body = parseBody(event);
    const { weeklyAvailability, blockedSlots } = body;

    // Update availability
    if (weeklyAvailability) {
      therapist.weeklyAvailability = weeklyAvailability;
    }

    if (blockedSlots) {
      therapist.blockedSlots = blockedSlots;
    }

    await therapist.save();

    return createResponse(200, {
      message: 'Availability updated successfully',
      weeklyAvailability: therapist.weeklyAvailability,
      blockedSlots: therapist.blockedSlots
    });

  } catch (error) {
    console.error('Update availability error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};

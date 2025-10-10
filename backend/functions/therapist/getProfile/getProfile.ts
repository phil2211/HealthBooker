import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { connectToDatabase, Therapist } from './layers';
import { createResponse, createErrorResponse, getPathParameter, handleCors } from './layers/utils/apiHelpers';

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

    const therapist = await Therapist.findById(therapistId);
    if (!therapist) {
      return createErrorResponse(404, 'Therapist not found');
    }

    return createResponse(200, {
      therapist: {
        id: therapist._id,
        name: therapist.name,
        specialization: therapist.specialization,
        bio: therapist.bio,
        photoUrl: therapist.photoUrl
      }
    });

  } catch (error) {
    console.error('Get therapist profile error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};

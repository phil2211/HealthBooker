import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import bcrypt from 'bcryptjs';
import { connectToDatabase, Therapist } from '../../layers';
import { createResponse, createErrorResponse, parseBody, handleCors } from '../../layers/utils/apiHelpers';
import { generateToken } from '../../layers/utils/auth';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  // Handle CORS
  const corsResponse = handleCors(event);
  if (corsResponse) return corsResponse;

  try {
    await connectToDatabase();
    
    const body = parseBody(event);
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return createErrorResponse(400, 'Email and password are required');
    }

    // Find therapist by email
    const therapist = await Therapist.findOne({ email });
    if (!therapist) {
      return createErrorResponse(401, 'Invalid credentials');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, therapist.passwordHash);
    if (!isValidPassword) {
      return createErrorResponse(401, 'Invalid credentials');
    }

    // Generate JWT token
    const token = generateToken({
      therapistId: therapist._id,
      email: therapist.email
    });

    return createResponse(200, {
      message: 'Login successful',
      token,
      therapist: {
        id: therapist._id,
        email: therapist.email,
        name: therapist.name,
        specialization: therapist.specialization,
        bio: therapist.bio
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};

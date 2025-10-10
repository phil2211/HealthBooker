const bcrypt = require('bcryptjs');
const { connectToDatabase, Therapist } = require('./layers');
const { createResponse, createErrorResponse, parseBody, handleCors } = require('./layers/utils/apiHelpers');
const { generateToken } = require('./layers/utils/auth');

exports.handler = async (event) => {
  // Handle CORS
  const corsResponse = handleCors(event);
  if (corsResponse) return corsResponse;

  try {
    await connectToDatabase();
    
    const body = parseBody(event);
    const { email, password, name, specialization, bio } = body;

    // Validate required fields
    if (!email || !password || !name || !specialization || !bio) {
      return createErrorResponse(400, 'Missing required fields');
    }

    // Check if therapist already exists
    const existingTherapist = await Therapist.findOne({ email });
    if (existingTherapist) {
      return createErrorResponse(409, 'Therapist with this email already exists');
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create new therapist
    const therapist = new Therapist({
      email,
      passwordHash,
      name,
      specialization,
      bio,
      weeklyAvailability: [],
      blockedSlots: []
    });

    await therapist.save();

    // Generate JWT token
    const token = generateToken({
      therapistId: therapist._id,
      email: therapist.email
    });

    return createResponse(201, {
      message: 'Therapist registered successfully',
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
    console.error('Registration error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Simple MongoDB connection
let cachedConnection = null;
const connectToDatabase = async () => {
  if (cachedConnection && cachedConnection.readyState === 1) {
    return cachedConnection;
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  try {
    const connection = await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    cachedConnection = connection.connection;
    console.log('Connected to MongoDB');
    return cachedConnection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

// Simple Therapist schema
const therapistSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  specialization: {
    type: String,
    required: true,
    trim: true
  },
  bio: {
    type: String,
    required: true,
    trim: true
  },
  weeklyAvailability: [{
    day: Number,
    startTime: String,
    endTime: String
  }],
  blockedSlots: [{
    date: String,
    startTime: String,
    endTime: String
  }]
}, {
  timestamps: true
});

const Therapist = mongoose.model('Therapist', therapistSchema);

// Helper functions
const createResponse = (statusCode, body, headers = {}) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    ...headers
  },
  body: JSON.stringify(body)
});

const createErrorResponse = (statusCode, message) => 
  createResponse(statusCode, { error: message });

const parseBody = (event) => {
  try {
    return event.body ? JSON.parse(event.body) : {};
  } catch (error) {
    throw new Error('Invalid JSON in request body');
  }
};

const handleCors = (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return createResponse(200, {});
  }
  return null;
};

const verifyToken = (token) => {
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

const extractTokenFromHeader = (authHeader) => {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
};

exports.handler = async (event) => {
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

    // Handle GET request - return current availability settings
    if (event.httpMethod === 'GET') {
      return createResponse(200, {
        weeklyAvailability: therapist.weeklyAvailability || [],
        blockedSlots: therapist.blockedSlots || []
      });
    }

    // Handle PUT request - update availability
    if (event.httpMethod === 'PUT') {
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
    }

    return createErrorResponse(405, 'Method not allowed');

  } catch (error) {
    console.error('Availability error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};

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
  photoUrl: {
    type: String,
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

// Simple Booking schema
const bookingSchema = new mongoose.Schema({
  therapistId: {
    type: String,
    required: true,
    ref: 'Therapist'
  },
  patientName: {
    type: String,
    required: true,
    trim: true
  },
  patientEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  patientPhone: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: String,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending'
  },
  cancellationToken: {
    type: String,
    required: true,
    unique: true
  }
}, {
  timestamps: true
});

const Therapist = mongoose.model('Therapist', therapistSchema);
const Booking = mongoose.model('Booking', bookingSchema);

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

const getPathParameter = (event, param) => {
  return event.pathParameters ? event.pathParameters[param] : undefined;
};

const handleCors = (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return createResponse(200, {});
  }
  return null;
};

exports.handler = async (event) => {
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

    // Get therapist info
    const therapist = await Therapist.findById(booking.therapistId);
    if (!therapist) {
      return createErrorResponse(404, 'Therapist not found');
    }

    return createResponse(200, {
      booking: {
        id: booking._id,
        therapistId: booking.therapistId,
        patientName: booking.patientName,
        patientEmail: booking.patientEmail,
        patientPhone: booking.patientPhone,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
        cancellationToken: booking.cancellationToken,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt
      },
      therapist: {
        id: therapist._id,
        name: therapist.name,
        specialization: therapist.specialization,
        bio: therapist.bio,
        photoUrl: therapist.photoUrl
      }
    });

  } catch (error) {
    console.error('Get booking details error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};
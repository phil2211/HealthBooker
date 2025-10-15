const { v4: uuidv4 } = require('uuid');
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

exports.handler = async (event) => {
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
    let therapist;
    try {
      therapist = await Therapist.findById(therapistId);
    } catch (error) {
      return createErrorResponse(404, 'Therapist not found');
    }
    
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

    // Note: Email sending would be implemented here in production
    // For now, we'll just log the booking
    console.log('Booking created:', {
      bookingId: booking._id,
      therapistEmail: therapist.email,
      patientEmail: patientEmail,
      cancellationToken: cancellationToken
    });

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

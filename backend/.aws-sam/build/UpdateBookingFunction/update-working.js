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

const parseBody = (event) => {
  try {
    return JSON.parse(event.body || '{}');
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
    
    const cancellationToken = getPathParameter(event, 'token');
    if (!cancellationToken) {
      return createErrorResponse(400, 'Cancellation token is required');
    }

    const body = parseBody(event);
    const { date, startTime, endTime } = body;

    // Validate required fields
    if (!date || !startTime || !endTime) {
      return createErrorResponse(400, 'date, startTime, and endTime are required');
    }

    // Find booking by cancellation token
    const booking = await Booking.findOne({ cancellationToken });
    if (!booking) {
      return createErrorResponse(404, 'Booking not found');
    }

    // Check if booking is already cancelled
    if (booking.status === 'cancelled') {
      return createErrorResponse(400, 'Cannot update a cancelled booking');
    }

    // Validate new date is not in the past
    const newBookingDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (newBookingDate < today) {
      return createErrorResponse(400, 'Cannot reschedule to a date in the past');
    }

    // Check if new slot is available
    const existingBooking = await Booking.findOne({
      therapistId: booking.therapistId,
      date,
      startTime,
      status: { $ne: 'cancelled' },
      _id: { $ne: booking._id } // Exclude current booking
    });

    if (existingBooking) {
      return createErrorResponse(409, 'This time slot is already booked');
    }

    // Update booking
    booking.date = date;
    booking.startTime = startTime;
    booking.endTime = endTime;
    await booking.save();

    return createResponse(200, {
      message: 'Booking updated successfully',
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
    console.error('Update booking error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};
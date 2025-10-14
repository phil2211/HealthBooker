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

const getPathParameter = (event, param) => {
  return event.pathParameters ? event.pathParameters[param] : undefined;
};

const getQueryParameter = (event, param) => {
  return event.queryStringParameters ? event.queryStringParameters[param] : undefined;
};

const handleCors = (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return createResponse(200, {});
  }
  return null;
};

function generateAllSlots(weeklyAvailability, blockedSlots, bookings, startDate, endDate) {
  const slots = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dayOfWeek = date.getDay();
    const dateStr = date.toISOString().split('T')[0];

    // Find weekly availability for this day
    const dayAvailability = weeklyAvailability.find(avail => avail.day === dayOfWeek);
    if (!dayAvailability) {
      // No availability for this day - add unavailable slots
      slots.push({
        date: dateStr,
        startTime: '00:00',
        endTime: '23:59',
        status: 'unavailable'
      });
      continue;
    }

    // Check if this date is blocked
    const isBlocked = blockedSlots.some(blocked => blocked.date === dateStr);
    if (isBlocked) {
      // Entire day is blocked
      slots.push({
        date: dateStr,
        startTime: '00:00',
        endTime: '23:59',
        status: 'blocked'
      });
      continue;
    }

    // Generate time slots for this day
    const startTime = parseTime(dayAvailability.startTime);
    const endTime = parseTime(dayAvailability.endTime);
    const slotDuration = 60; // 60 minutes per slot
    const breakDuration = 30; // 30 minutes break after each booking

    for (let time = startTime; time < endTime; time += slotDuration) {
      const slotStartTime = formatTime(time);
      const slotEndTime = formatTime(time + slotDuration);

      // Check if this slot is booked
      const booking = bookings.find(b => 
        b.date === dateStr && 
        b.startTime === slotStartTime
      );

      if (booking) {
        // Add booked slot
        slots.push({
          date: dateStr,
          startTime: slotStartTime,
          endTime: slotEndTime,
          status: 'booked',
          bookingId: booking._id,
          patientName: booking.patientName
        });

        // Add break slot after booking (if there's time)
        const breakStartTime = time + slotDuration;
        const breakEndTime = breakStartTime + breakDuration;
        
        if (breakEndTime <= endTime) {
          slots.push({
            date: dateStr,
            startTime: formatTime(breakStartTime),
            endTime: formatTime(breakEndTime),
            status: 'break'
          });
        }
      } else {
        // Add available slot
        slots.push({
          date: dateStr,
          startTime: slotStartTime,
          endTime: slotEndTime,
          status: 'available'
        });
      }
    }
  }

  return slots;
}

function parseTime(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function formatTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

exports.handler = async (event) => {
  // Handle CORS
  const corsResponse = handleCors(event);
  if (corsResponse) return corsResponse;

  try {
    await connectToDatabase();
    
    const therapistId = getPathParameter(event, 'id');
    if (!therapistId) {
      return createErrorResponse(400, 'Therapist ID is required');
    }

    const startDate = getQueryParameter(event, 'startDate');
    const endDate = getQueryParameter(event, 'endDate');

    if (!startDate || !endDate) {
      return createErrorResponse(400, 'startDate and endDate are required');
    }

    let therapist;
    try {
      therapist = await Therapist.findById(therapistId);
    } catch (error) {
      return createErrorResponse(404, 'Therapist not found');
    }
    
    if (!therapist) {
      return createErrorResponse(404, 'Therapist not found');
    }

    // Get existing bookings for the date range
    const bookings = await Booking.find({
      therapistId,
      date: { $gte: startDate, $lte: endDate },
      status: { $ne: 'cancelled' }
    });

    // Generate all time slots (available, booked, break, unavailable)
    const allSlots = generateAllSlots(
      therapist.weeklyAvailability,
      therapist.blockedSlots,
      bookings,
      startDate,
      endDate
    );

    return createResponse(200, {
      slots: allSlots
    });

  } catch (error) {
    console.error('Get availability error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};

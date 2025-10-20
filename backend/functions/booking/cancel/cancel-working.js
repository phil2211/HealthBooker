const mongoose = require('mongoose');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

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

// SES Configuration
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@healthbooker.com';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Create SES client
const sesClient = new SESClient({ 
  region: process.env.AWS_DEFAULT_REGION || 'eu-central-1' 
});

// Email sending functions
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const sendCancellationEmail = async (booking, therapist) => {
  const patientEmailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Appointment Cancelled</h2>
      <p>Dear ${booking.patientName},</p>
      <p>Your appointment with ${therapist.name} has been cancelled.</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3>Cancelled Appointment Details:</h3>
        <p><strong>Date:</strong> ${formatDate(booking.date)}</p>
        <p><strong>Time:</strong> ${booking.startTime} - ${booking.endTime}</p>
        <p><strong>Therapist:</strong> ${therapist.name}</p>
      </div>
      
      <p>If you would like to book a new appointment, please visit our booking page.</p>
      <p>Thank you!</p>
    </div>
  `;

  const therapistEmailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Appointment Cancelled</h2>
      <p>An appointment has been cancelled.</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3>Cancelled Appointment Details:</h3>
        <p><strong>Date:</strong> ${formatDate(booking.date)}</p>
        <p><strong>Time:</strong> ${booking.startTime} - ${booking.endTime}</p>
        <p><strong>Patient:</strong> ${booking.patientName}</p>
        <p><strong>Email:</strong> ${booking.patientEmail}</p>
      </div>
    </div>
  `;

  // Send email to patient
  const patientCommand = new SendEmailCommand({
    Source: FROM_EMAIL,
    Destination: { ToAddresses: [booking.patientEmail] },
    Message: {
      Subject: { Data: `Appointment Cancelled - ${therapist.name}` },
      Body: { Html: { Data: patientEmailHtml } }
    }
  });
  await sesClient.send(patientCommand);

  // Send email to therapist
  const therapistCommand = new SendEmailCommand({
    Source: FROM_EMAIL,
    Destination: { ToAddresses: [therapist.email] },
    Message: {
      Subject: { Data: `Appointment Cancelled - ${booking.patientName}` },
      Body: { Html: { Data: therapistEmailHtml } }
    }
  });
  await sesClient.send(therapistCommand);
};

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

    // Check if booking is already cancelled
    if (booking.status === 'cancelled') {
      return createErrorResponse(400, 'Booking is already cancelled');
    }

    // Check if cancellation is allowed (24 hours before appointment)
    const appointmentDate = new Date(`${booking.date}T${booking.startTime}`);
    const now = new Date();
    const hoursUntilAppointment = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilAppointment < 24) {
      return createErrorResponse(400, 'Cancellation must be made at least 24 hours before the appointment');
    }

    // Update booking status
    booking.status = 'cancelled';
    await booking.save();

    // Get therapist info for email
    const therapist = await Therapist.findById(booking.therapistId);
    if (therapist) {
      try {
        await sendCancellationEmail(booking, therapist);
        console.log('Cancellation emails sent successfully');
      } catch (emailError) {
        console.error('Cancellation email sending failed:', emailError);
        // Don't fail the cancellation if email fails
      }
    }

    return createResponse(200, {
      message: 'Booking cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel booking error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};

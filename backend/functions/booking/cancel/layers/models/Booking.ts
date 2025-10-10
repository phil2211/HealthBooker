import mongoose, { Document, Schema } from 'mongoose';

export interface IBooking extends Document {
  _id: string;
  therapistId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  status: 'pending' | 'confirmed' | 'cancelled';
  cancellationToken: string;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>({
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
    required: true,
    match: /^\d{4}-\d{2}-\d{2}$/
  },
  startTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  endTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
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

// Index for efficient queries
bookingSchema.index({ therapistId: 1, date: 1 });
bookingSchema.index({ cancellationToken: 1 });

export const Booking = mongoose.model<IBooking>('Booking', bookingSchema);

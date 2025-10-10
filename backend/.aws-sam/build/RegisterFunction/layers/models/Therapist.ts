import mongoose, { Document, Schema } from 'mongoose';

export interface ITherapist extends Document {
  _id: string;
  email: string;
  passwordHash: string;
  name: string;
  specialization: string;
  bio: string;
  photoUrl?: string;
  weeklyAvailability: {
    day: number; // 0 = Sunday, 1 = Monday, etc.
    startTime: string; // HH:mm format
    endTime: string; // HH:mm format
  }[];
  blockedSlots: {
    date: string; // YYYY-MM-DD format
    startTime: string; // HH:mm format
    endTime: string; // HH:mm format
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const therapistSchema = new Schema<ITherapist>({
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
    day: {
      type: Number,
      required: true,
      min: 0,
      max: 6
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
    }
  }],
  blockedSlots: [{
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
    }
  }]
}, {
  timestamps: true
});

export const Therapist = mongoose.model<ITherapist>('Therapist', therapistSchema);

import mongoose from 'mongoose';

let cachedConnection: mongoose.Connection | null = null;

export const connectToDatabase = async (): Promise<mongoose.Connection> => {
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

export const disconnectFromDatabase = async (): Promise<void> => {
  if (cachedConnection) {
    await mongoose.disconnect();
    cachedConnection = null;
    console.log('Disconnected from MongoDB');
  }
};

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectFromDatabase = exports.connectToDatabase = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
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
        const connection = await mongoose_1.default.connect(mongoUri, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        cachedConnection = connection.connection;
        console.log('Connected to MongoDB');
        return cachedConnection;
    }
    catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
};
exports.connectToDatabase = connectToDatabase;
const disconnectFromDatabase = async () => {
    if (cachedConnection) {
        await mongoose_1.default.disconnect();
        cachedConnection = null;
        console.log('Disconnected from MongoDB');
    }
};
exports.disconnectFromDatabase = disconnectFromDatabase;

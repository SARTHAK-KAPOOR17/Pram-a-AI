import mongoose from 'mongoose';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

let isConnected = false;

export const connectDatabase = async () => {
  if (isConnected) {
    logger.info('Database already connected.');
    return;
  }

  try {
    mongoose.connection.on('connected', () => {
      isConnected = true;
      logger.info('MongoDB connected successfully', { uri: config.MONGODB_URI.replace(/\/\/.*@/, '//***:***@') });
    });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      logger.warn('MongoDB disconnected');
    });

    await mongoose.connect(config.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
  } catch (error) {
    logger.warn(`MongoDB initial connection failed: ${error.message}. Running in offline/graceful mode.`);
  }
};

export const disconnectDatabase = async () => {
  if (!isConnected) return;
  try {
    await mongoose.connection.close();
    isConnected = false;
    logger.info('MongoDB connection closed gracefully');
  } catch (error) {
    logger.error('Error closing MongoDB connection:', error.message);
  }
};

export const getDbStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return states[mongoose.connection.readyState] || 'unknown';
};

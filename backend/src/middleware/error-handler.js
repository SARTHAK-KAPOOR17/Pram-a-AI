import { ZodError } from 'zod';
import { AppError } from '../utils/api-error.js';
import { ApiResponse } from '../utils/api-response.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || null;
  let isOperational = err.isOperational || false;

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation failed';
    isOperational = true;
    errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
  }
  // Handle Mongoose duplicate key error (11000)
  else if (err.name === 'MongoServerError' && err.code === 11000) {
    statusCode = 409;
    isOperational = true;
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    message = `A record with this ${field} already exists`;
  }
  // Handle Mongoose CastError (invalid ObjectId, etc.)
  else if (err.name === 'CastError') {
    statusCode = 400;
    isOperational = true;
    message = `Invalid format for parameter: ${err.path}`;
  }

  // Log only true unhandled unexpected errors
  if (!isOperational && !(err instanceof AppError)) {
    logger.error(`[Unhandled Error] ${req.method} ${req.url}:`, {
      message: err.message,
      stack: err.stack,
    });
  }

  return ApiResponse.error(
    res,
    message,
    statusCode,
    config.NODE_ENV === 'development' ? (errors || { stack: err.stack }) : errors
  );
};

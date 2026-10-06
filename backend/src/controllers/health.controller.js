import { getDbStatus } from '../config/database.js';

export const getHealth = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Pramāṇa AI API is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    database: getDbStatus(),
  });
};

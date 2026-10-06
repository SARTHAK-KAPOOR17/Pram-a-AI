import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { AppError } from '../utils/api-error.js';
import { User } from '../models/user.model.js';
import { getDbStatus } from '../config/database.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw AppError.unauthorized('Authentication token missing or invalid');
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, config.JWT_SECRET);
    } catch (err) {
      throw AppError.unauthorized('Token is expired or invalid');
    }

    // If database is connected, query the user
    if (getDbStatus() === 'connected') {
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        throw AppError.unauthorized('User associated with token no longer exists');
      }
      req.user = user;
    } else {
      // Offline/development mode user representation
      req.user = {
        _id: decoded.id || '65f000000000000000000001',
        name: 'QA Engineer',
        email: 'qa.engineer@pramana.ai',
        role: decoded.role || 'admin',
      };
    }

    next();
  } catch (error) {
    next(error);
  }
};

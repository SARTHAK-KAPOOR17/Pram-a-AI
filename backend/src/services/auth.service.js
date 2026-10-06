import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { AppError } from '../utils/api-error.js';
import { config } from '../config/env.js';

const signToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN,
  });
};

export const registerUser = async ({ name, email, password }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw AppError.conflict('An account with this email already exists');
  }

  const user = await User.create({ name, email, password });
  const token = signToken(user._id, user.role);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    },
    token,
  };
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw AppError.unauthorized('Invalid email or password');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw AppError.unauthorized('Invalid email or password');
  }

  const token = signToken(user._id, user.role);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    },
    token,
  };
};

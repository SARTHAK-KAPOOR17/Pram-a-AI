import * as authService from '../services/auth.service.js';
import { ApiResponse } from '../utils/api-response.js';

export const register = async (req, res, next) => {
  try {
    const result = await authService.registerUser(req.body);
    return ApiResponse.created(res, result, 'User registered successfully');
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const result = await authService.loginUser(req.body);
    return ApiResponse.success(res, result, 'Login successful');
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    return ApiResponse.success(res, { user: req.user }, 'Current user profile');
  } catch (error) {
    next(error);
  }
};

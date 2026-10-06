import { AppError } from '../utils/api-error.js';

export const notFoundHandler = (req, res, next) => {
  next(AppError.notFound(`Cannot ${req.method} ${req.originalUrl}`));
};

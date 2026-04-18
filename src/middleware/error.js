import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

export function notFound(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || (err.name === 'ValidationError' ? 400 : 500);
  const payload = {
    success: false,
    message: err.message || 'Server error'
  };

  if (err.details) payload.details = err.details;
  if (env.nodeEnv !== 'production') payload.stack = err.stack;

  res.status(statusCode).json(payload);
}

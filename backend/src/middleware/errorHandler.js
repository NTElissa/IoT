import { failure } from '../utils/apiResponse.js';

export const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Route not found: ${req.originalUrl}`));
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  const status = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return failure(res, { message: 'Validation failed', error: messages.join(', '), status: 400 });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    return failure(res, {
      message: `Duplicate value for field: ${field}`,
      error: err.message,
      status: 409,
    });
  }

  if (err.name === 'CastError') {
    return failure(res, { message: 'Invalid identifier format', error: err.message, status: 400 });
  }

  return failure(res, {
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    status,
  });
};

export default { notFound, errorHandler };

const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

const errorHandler = (err, req, res, next) => {
  const requestId = uuidv4();

  logger.error('Error occurred:', {
    requestId,
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  // Default error response
  let status = 500;
  let errorResponse = {
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      request_id: requestId
    }
  };

  // Handle specific error types
  if (err.name === 'ValidationError') {
    status = 400;
    errorResponse.error.code = 'VALIDATION_ERROR';
    errorResponse.error.message = err.message;
  } else if (err.name === 'UnauthorizedError') {
    status = 401;
    errorResponse.error.code = 'UNAUTHORIZED';
    errorResponse.error.message = 'Unauthorized access';
  } else if (err.name === 'ForbiddenError') {
    status = 403;
    errorResponse.error.code = 'FORBIDDEN';
    errorResponse.error.message = 'Access denied';
  } else if (err.name === 'NotFoundError') {
    status = 404;
    errorResponse.error.code = 'NOT_FOUND';
    errorResponse.error.message = err.message || 'Resource not found';
  }

  // Don't expose internal error details in production
  if (process.env.NODE_ENV === 'production') {
    delete errorResponse.error.stack;
  }

  res.status(status).json(errorResponse);
};

module.exports = errorHandler;
const logger = require('../utils/logger');

function errorHandler(err, req, res, _next) {
  logger.error({
    request_id: req.requestId,
    error_type: err.name,
    error_message: err.message,
    route: req.originalUrl,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });

  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Invalid input',
      details: err.errors,
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Authentication required',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token has expired. Please log in again.',
    });
  }

  const statusCode = err.statusCode || err.status;

  if (statusCode && statusCode >= 400 && statusCode < 500) {
    return res.status(statusCode).json({
      error: err.message || 'Request error',
    });
  }

  return res.status(500).json({
    error: 'Internal server error',
  });
}

module.exports = errorHandler;


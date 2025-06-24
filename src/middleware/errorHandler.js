const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  logger.error('Error:', err);

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.message
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      details: 'Invalid or missing authentication'
    });
  }

  // Handle WhatsApp API errors
  if (err.response?.data?.error) {
    return res.status(err.response.status || 500).json({
      error: 'WhatsApp API Error',
      details: err.response.data.error
    });
  }

  // Handle Airtable API errors
  if (err.error?.type === 'TABLE_NOT_FOUND') {
    return res.status(404).json({
      error: 'Airtable Error',
      details: 'Table not found'
    });
  }

  // Handle Redis errors
  if (err.code === 'ECONNREFUSED' && err.syscall === 'connect') {
    return res.status(503).json({
      error: 'Service Unavailable',
      details: 'Redis connection failed'
    });
  }

  // Default error response
  res.status(500).json({
    error: 'Internal Server Error',
    details: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
  });
}

module.exports = {
  errorHandler
}; 
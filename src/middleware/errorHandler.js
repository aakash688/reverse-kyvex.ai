/**
 * Global error handler middleware
 */
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: {
        message: 'Validation error',
        type: 'invalid_request_error',
        details: err.message,
      },
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    return res.status(400).json({
      error: {
        message: 'Duplicate entry',
        type: 'invalid_request_error',
        details: 'A record with this value already exists',
      },
    });
  }

  // Default error
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      type: err.type || 'internal_error',
    },
  });
};

/**
 * 404 handler
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: {
      message: `Route ${req.method} ${req.path} not found`,
      type: 'invalid_request_error',
    },
  });
};


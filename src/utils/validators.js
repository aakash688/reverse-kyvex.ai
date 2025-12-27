import { body, validationResult } from 'express-validator';

/**
 * Validation result handler
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: {
        message: 'Validation failed',
        type: 'invalid_request_error',
        details: errors.array(),
      },
    });
  }
  next();
};

/**
 * Chat completions validation
 */
export const validateChatCompletions = [
  body('model').optional().isString(),
  body('messages').isArray().withMessage('Messages must be an array'),
  body('messages.*.role').isIn(['system', 'user', 'assistant']).withMessage('Invalid role'),
  body('messages.*.content').isString().withMessage('Content must be a string'),
  body('stream').optional().isBoolean(),
  body('thread_id').optional().isString(),
  handleValidationErrors,
];

/**
 * Admin login validation
 */
export const validateAdminLogin = [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors,
];

/**
 * API key creation validation
 */
export const validateApiKeyCreation = [
  body('name').optional().isString(),
  body('rateLimit').optional().isInt({ min: 1 }),
  handleValidationErrors,
];


import ApiKey from '../models/ApiKey.js';

/**
 * Middleware to authenticate API requests using API key
 * Expects API key in Authorization header as: Bearer <api-key>
 */
export const authenticateApiKey = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: {
          message: 'Invalid authorization header. Use: Authorization: Bearer <api-key>',
          type: 'invalid_request_error',
        },
      });
    }

    const apiKey = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Find API key in database
    const keyDoc = await ApiKey.findOne({ apiKey, isActive: true });

    if (!keyDoc) {
      return res.status(401).json({
        error: {
          message: 'Invalid API key',
          type: 'invalid_request_error',
        },
      });
    }

    // Attach API key info to request
    req.apiKey = keyDoc.apiKey;
    req.apiKeyDoc = keyDoc;

    // Update last used timestamp
    keyDoc.lastUsedAt = new Date();
    await keyDoc.save();

    next();
  } catch (error) {
    console.error('API key authentication error:', error);
    return res.status(500).json({
      error: {
        message: 'Internal server error during authentication',
        type: 'internal_error',
      },
    });
  }
};


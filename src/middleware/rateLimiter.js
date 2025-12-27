import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: {
      message: 'Too many requests from this IP, please try again later.',
      type: 'rate_limit_error',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Create a rate limiter for specific API key
 * This should be used after API key authentication
 */
export const createApiKeyRateLimiter = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const keyLimits = new Map();

  return (req, res, next) => {
    const apiKey = req.apiKey;
    
    if (!apiKey) {
      return next();
    }

    // Check if API key has custom rate limit
    const customLimit = req.apiKeyDoc?.rateLimit;
    const limit = customLimit || maxRequests;
    const window = windowMs;

    const now = Date.now();
    const key = apiKey;

    if (!keyLimits.has(key)) {
      keyLimits.set(key, { count: 1, resetTime: now + window });
      return next();
    }

    const limitData = keyLimits.get(key);

    if (now > limitData.resetTime) {
      // Reset window
      limitData.count = 1;
      limitData.resetTime = now + window;
      return next();
    }

    if (limitData.count >= limit) {
      return res.status(429).json({
        error: {
          message: 'Rate limit exceeded for this API key',
          type: 'rate_limit_error',
        },
      });
    }

    limitData.count++;
    next();
  };
};

/**
 * Admin login rate limiter
 */
export const adminLoginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true,
});


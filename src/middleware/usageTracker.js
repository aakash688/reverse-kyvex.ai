import ApiUsageLog from '../models/ApiUsageLog.js';
import { logger } from '../utils/logger.js';

/**
 * Middleware to track API usage
 * Should be used after authentication middleware
 */
export const trackUsage = async (req, res, next) => {
  const startTime = Date.now();
  const originalSend = res.send;
  const originalJson = res.json;

  // Track response size
  let responseSize = 0;
  let requestSize = 0;

  // Calculate request size
  if (req.body) {
    requestSize = JSON.stringify(req.body).length;
  }

  // Override res.send to track response size
  res.send = function (body) {
    if (typeof body === 'string') {
      responseSize = Buffer.byteLength(body, 'utf8');
    } else if (Buffer.isBuffer(body)) {
      responseSize = body.length;
    } else {
      responseSize = JSON.stringify(body).length;
    }
    return originalSend.call(this, body);
  };

  // Override res.json to track response size
  res.json = function (body) {
    responseSize = JSON.stringify(body).length;
    return originalJson.call(this, body);
  };

  // Log usage after response is sent
  res.on('finish', async () => {
    try {
      const responseTime = Date.now() - startTime;
      const apiKey = req.apiKey || null;
      const endpoint = req.path;
      const method = req.method;
      const statusCode = res.statusCode;
      const model = req.body?.model || null;
      const error = statusCode >= 400 ? res.statusMessage || 'Error' : null;

      // Log to database (async, don't block response)
      ApiUsageLog.create({
        apiKey,
        endpoint,
        model,
        method,
        statusCode,
        responseTime,
        requestSize,
        responseSize,
        error,
        timestamp: new Date(),
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent') || null,
      }).catch((err) => {
        logger.error('Failed to log API usage:', err);
      });
    } catch (error) {
      logger.error('Usage tracking error:', error);
    }
  });

  next();
};


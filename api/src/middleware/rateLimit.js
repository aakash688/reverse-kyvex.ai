/**
 * Rate limiting middleware
 */

import { findOne, insertOne, updateOne } from '../utils/db.js';

/**
 * Check and increment rate limit
 */
export async function checkRateLimit(apiKeyId, rateLimit) {
  const now = new Date();
  const hourWindow = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}`;
  const dayWindow = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Check hourly limit
  const hourlyKey = `${apiKeyId}-hour-${hourWindow}`;
  const hourlyLimit = await findOne('rate_limits', { id: hourlyKey });

  if (hourlyLimit && hourlyLimit.count >= rateLimit.requestsPerHour) {
    const resetTime = new Date(now);
    resetTime.setHours(resetTime.getHours() + 1);
    resetTime.setMinutes(0);
    resetTime.setSeconds(0);
    resetTime.setMilliseconds(0);
    
    return {
      allowed: false,
      limit: rateLimit.requestsPerHour,
      remaining: 0,
      reset: Math.floor(resetTime.getTime() / 1000),
      window: 'hour',
    };
  }

  // Check daily limit
  const dailyKey = `${apiKeyId}-day-${dayWindow}`;
  const dailyLimit = await findOne('rate_limits', { id: dailyKey });

  if (dailyLimit && dailyLimit.count >= rateLimit.requestsPerDay) {
    const resetTime = new Date(now);
    resetTime.setDate(resetTime.getDate() + 1);
    resetTime.setHours(0);
    resetTime.setMinutes(0);
    resetTime.setSeconds(0);
    resetTime.setMilliseconds(0);
    
    return {
      allowed: false,
      limit: rateLimit.requestsPerDay,
      remaining: 0,
      reset: Math.floor(resetTime.getTime() / 1000),
      window: 'day',
    };
  }

  // Increment counters
  const hourExpires = new Date(now);
  hourExpires.setHours(hourExpires.getHours() + 1);
  
  const dayExpires = new Date(now);
  dayExpires.setDate(dayExpires.getDate() + 1);
  dayExpires.setHours(0);
  dayExpires.setMinutes(0);
  dayExpires.setSeconds(0);
  dayExpires.setMilliseconds(0);

  // Update or create hourly counter
  if (hourlyLimit) {
    await updateOne(
      'rate_limits',
      { id: hourlyKey },
      { count: (hourlyLimit.count || 0) + 1 }
    );
  } else {
    await insertOne('rate_limits', {
      id: hourlyKey,
      api_key_id: apiKeyId,
      rate_window: hourWindow,
      count: 1,
      expires_at: hourExpires.toISOString(),
    });
  }

  // Update or create daily counter
  if (dailyLimit) {
    await updateOne(
      'rate_limits',
      { id: dailyKey },
      { count: (dailyLimit.count || 0) + 1 }
    );
  } else {
    await insertOne('rate_limits', {
      id: dailyKey,
      api_key_id: apiKeyId,
      rate_window: dayWindow,
      count: 1,
      expires_at: dayExpires.toISOString(),
    });
  }

  const hourlyCount = (hourlyLimit?.count || 0) + 1;
  const dailyCount = (dailyLimit?.count || 0) + 1;

  return {
    allowed: true,
    hourly: {
      limit: rateLimit.requestsPerHour,
      remaining: Math.max(0, rateLimit.requestsPerHour - hourlyCount),
      reset: Math.floor(hourExpires.getTime() / 1000),
    },
    daily: {
      limit: rateLimit.requestsPerDay,
      remaining: Math.max(0, rateLimit.requestsPerDay - dailyCount),
      reset: Math.floor(dayExpires.getTime() / 1000),
    },
  };
}

/**
 * Create rate limit error response
 */
export function rateLimitResponse(rateLimitInfo) {
  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      message: `Too many requests. Limit: ${rateLimitInfo.limit} requests per ${rateLimitInfo.window}`,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': rateLimitInfo.limit.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': rateLimitInfo.reset.toString(),
      },
    }
  );
}

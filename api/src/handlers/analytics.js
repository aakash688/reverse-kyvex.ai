/**
 * Analytics handlers
 */

import { verifyAdmin, jsonResponse, errorResponse } from '../middleware/auth.js';
import { countDocuments, find } from '../utils/db.js';
import { getApiKeyStats, findApiKeyById, getAllApiKeys } from '../services/apiKey.js';

/**
 * Get overview analytics
 */
export async function handleAnalyticsOverview(request) {
  const authResult = await verifyAdmin(request);
  if (authResult.error) {
    return errorResponse(authResult.error, authResult.status);
  }

  try {
    const stats = await getApiKeyStats();
    
    // Get total requests (sum from all API keys)
    const allKeys = await getAllApiKeys({});
    let totalRequests = 0;
    let totalTokens = 0;
    const modelUsage = {}; // { modelName: { requests: number, tokens: number } }
    
    allKeys.forEach(key => {
      const analytics = key.analytics && typeof key.analytics === 'object' ? key.analytics : {};
      totalRequests += analytics.totalRequests || 0;
      totalTokens += analytics.totalTokens || 0;
      
      // Aggregate model usage
      if (analytics.modelsUsed && typeof analytics.modelsUsed === 'object') {
        Object.entries(analytics.modelsUsed).forEach(([model, count]) => {
          if (!modelUsage[model]) {
            modelUsage[model] = { requests: 0, tokens: 0 };
          }
          modelUsage[model].requests += count || 0;
          // Estimate tokens per request (average ~500 tokens per request)
          modelUsage[model].tokens += (count || 0) * 500;
        });
      }
    });

    // Get total threads
    const totalThreads = await countDocuments('threads');

    // Get today's requests (estimate from rate limits)
    const today = new Date();
    const dayWindow = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const todayRequests = await countDocuments('rate_limits', {
      rate_window: dayWindow,
    });

    // Convert modelUsage to sorted array (top models first)
    const modelStats = Object.entries(modelUsage)
      .map(([model, data]) => ({
        model,
        requests: data.requests,
        tokens: data.tokens,
        percentage: totalRequests > 0 ? ((data.requests / totalRequests) * 100).toFixed(1) : 0,
      }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 10); // Top 10 models

    return jsonResponse({
      apiKeys: stats,
      totalRequests,
      totalTokens,
      totalThreads,
      todayRequests,
      modelStats,
      topModel: modelStats.length > 0 ? modelStats[0].model : null,
    });
  } catch (error) {
    console.error('Analytics overview error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

/**
 * Get API key analytics
 */
export async function handleApiKeyAnalytics(request, url) {
  const authResult = await verifyAdmin(request);
  if (authResult.error) {
    return errorResponse(authResult.error, authResult.status);
  }

  try {
    const urlParts = url.pathname.split('/');
    const keyId = urlParts[urlParts.length - 1];

    if (!keyId) {
      return errorResponse('API key ID required', 400);
    }

    const apiKey = await findApiKeyById(keyId);
    if (!apiKey) {
      return errorResponse('API key not found', 404);
    }

    // Get thread count for this key
    const threadCount = await countDocuments('threads', {
      api_key_id: keyId,
    });

    return jsonResponse({
      id: apiKey.id,
      name: apiKey.name,
      analytics: {
        ...apiKey.analytics,
        threadCount,
      },
      rateLimit: apiKey.rate_limit,
      status: apiKey.status,
      createdAt: apiKey.created_at,
      lastUsed: apiKey.last_used,
    });
  } catch (error) {
    console.error('API key analytics error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

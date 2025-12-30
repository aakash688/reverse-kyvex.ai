/**
 * API Key service
 */

import { findOne, find, insertOne, updateOne, deleteOne, countDocuments } from '../utils/db.js';
import { generateApiKey, generateKyvexCookie } from '../utils/crypto.js';

/**
 * Find API key by key string
 */
export async function findApiKeyByKey(key) {
  return await findOne('api_keys', { key });
}

/**
 * Find API key by ID
 */
export async function findApiKeyById(id) {
  return await findOne('api_keys', { id });
}

/**
 * Get all API keys with optional filters
 */
export async function getAllApiKeys(filter = {}, options = {}) {
  return await find('api_keys', filter, options);
}

/**
 * Create new API key
 */
export async function createApiKey(data) {
  const apiKey = generateApiKey();
  const kyvexCookie = generateKyvexCookie();

  const keyDoc = {
    key: apiKey,
    name: data.name,
    kyvex_cookie: kyvexCookie,
    status: 'active',
    // Rate limiting removed - unlimited conversations via cookie rotation
    analytics: {
      totalRequests: 0,
      totalTokens: 0,
      threadCount: 0,
      lastUsed: null,
      modelsUsed: {},
    },
    created_by: data.createdBy,
    last_used: null,
  };

  const result = await insertOne('api_keys', keyDoc);
  return { ...keyDoc, id: result.insertedId || result.id, key: apiKey };
}

/**
 * Update API key
 */
export async function updateApiKey(id, updates) {
  const updateDoc = {};
  
  if (updates.name !== undefined) updateDoc.name = updates.name;
  if (updates.status !== undefined) updateDoc.status = updates.status;
  if (updates.rateLimit !== undefined) updateDoc.rate_limit = updates.rateLimit;
  if (updates.kyvexCookie !== undefined) updateDoc.kyvex_cookie = updates.kyvexCookie;
  
  if (Object.keys(updateDoc).length === 0) {
    return null;
  }

  await updateOne('api_keys', { id }, updateDoc);
  return await findApiKeyById(id);
}

/**
 * Delete API key
 */
export async function deleteApiKey(id) {
  // Threads will be deleted automatically due to CASCADE
  return await deleteOne('api_keys', { id });
}

/**
 * Update API key analytics
 */
export async function updateApiKeyAnalytics(id, updates) {
  // Get current analytics
  const key = await findApiKeyById(id);
  if (!key) return;

  const analytics = key.analytics || {};
  const newAnalytics = { ...analytics };

  newAnalytics.lastUsed = new Date().toISOString();

  if (updates.incrementRequests) {
    newAnalytics.totalRequests = (analytics.totalRequests || 0) + 1;
  }

  if (updates.addTokens) {
    newAnalytics.totalTokens = (analytics.totalTokens || 0) + (updates.addTokens || 0);
  }

  if (updates.model) {
    newAnalytics.modelsUsed = analytics.modelsUsed || {};
    newAnalytics.modelsUsed[updates.model] = (newAnalytics.modelsUsed[updates.model] || 0) + 1;
  }

  await updateOne('api_keys', { id }, {
    analytics: newAnalytics,
    last_used: new Date().toISOString(),
  });
}

/**
 * Get API key statistics
 */
export async function getApiKeyStats() {
  const total = await countDocuments('api_keys');
  const active = await countDocuments('api_keys', { status: 'active' });
  const paused = await countDocuments('api_keys', { status: 'paused' });
  const revoked = await countDocuments('api_keys', { status: 'revoked' });

  return { total, active, paused, revoked };
}

/**
 * Reset analytics for API keys
 */
export async function resetAnalytics(apiKeyId = null) {
  if (apiKeyId) {
    // Reset analytics for specific API key
    await updateOne('api_keys', { id: apiKeyId }, {
      analytics: {
        totalRequests: 0,
        totalTokens: 0,
        threadCount: 0,
        lastUsed: null,
        modelsUsed: {},
      },
      last_used: null,
    });
  } else {
    // Reset analytics for all API keys
    const allKeys = await getAllApiKeys({});
    for (const key of allKeys) {
      await updateOne('api_keys', { id: key.id }, {
        analytics: {
          totalRequests: 0,
          totalTokens: 0,
          threadCount: 0,
          lastUsed: null,
          modelsUsed: {},
        },
        last_used: null,
      });
    }
  }
}


/**
 * Admin handlers
 */

import { verifyAdmin, jsonResponse, errorResponse } from '../middleware/auth.js';
import { findOne, updateOne } from '../utils/db.js';
import { generateToken } from '../utils/jwt.js';
import { hashApiKey } from '../utils/crypto.js';
import { sendPasswordResetEmail, sendApiKeyCreatedEmail } from '../services/email.js';
import {
  getAllApiKeys,
  createApiKey,
  updateApiKey,
  deleteApiKey,
  findApiKeyById,
} from '../services/apiKey.js';
import {
  getAllModels,
  createModel,
  updateModel,
  deleteModel,
  getModelById,
  getProviderModels,
} from '../services/modelService.js';
import {
  getPoolStats,
  getAllCookies,
  generateBatch,
  deleteCookie,
  cleanupExhausted,
  resetAllCounters,
  checkAndReplenishPool,
} from '../services/cookieService.js';
import { deleteAllThreads } from '../services/threadService.js';
import { resetAnalytics } from '../services/apiKey.js';

export async function handleAdminLogin(request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return errorResponse('Email and password required', 400);
    }
    const admin = await findOne('admins', { email });
    if (!admin) {
      return errorResponse('Invalid credentials', 401);
    }
    const passwordHash = await hashApiKey(password);
    if (admin.password_hash !== passwordHash) {
      return errorResponse('Invalid credentials', 401);
    }
    if (!admin.is_active) {
      return errorResponse('Account is inactive', 403);
    }
    await updateOne(
      'admins',
      { id: admin.id },
      { last_login: new Date().toISOString() }
    );
    const token = await generateToken({ adminId: admin.id, email: admin.email });
    return jsonResponse({
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

export async function handleGetAdmin(request) {
  const authResult = await verifyAdmin(request);
  if (authResult.error) {
    return errorResponse(authResult.error, authResult.status);
  }
  return jsonResponse({
    id: authResult.admin.id,
    email: authResult.admin.email,
    name: authResult.admin.name,
  });
}

export async function handleForgotPassword(request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return errorResponse('Email required', 400);
    }
    const admin = await findOne('admins', { email });
    if (!admin) {
      return jsonResponse({ message: 'If email exists, reset link has been sent' });
    }
    const resetToken = crypto.randomUUID();
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1);
    await updateOne(
      'admins',
      { id: admin.id },
      {
        reset_token: resetToken,
        reset_token_expiry: resetTokenExpiry.toISOString(),
      }
    );
    await sendPasswordResetEmail(email, resetToken);
    return jsonResponse({ message: 'If email exists, reset link has been sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

export async function handleResetPassword(request) {
  try {
    const { token, password } = await request.json();
    if (!token || !password) {
      return errorResponse('Token and password required', 400);
    }
    const admin = await findOne('admins', { reset_token: token });
    if (!admin) {
      return errorResponse('Invalid or expired token', 400);
    }
    const expiry = new Date(admin.reset_token_expiry);
    if (expiry < new Date()) {
      return errorResponse('Token has expired', 400);
    }
    const passwordHash = await hashApiKey(password);
    await updateOne(
      'admins',
      { id: admin.id },
      {
        password_hash: passwordHash,
        reset_token: null,
        reset_token_expiry: null,
      }
    );
    return jsonResponse({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

export async function handleListApiKeys(request) {
  const authResult = await verifyAdmin(request);
  if (authResult.error) {
    return errorResponse(authResult.error, authResult.status);
  }
  try {
    const keys = await getAllApiKeys({}, { sort: { created_at: -1 } });
    const formattedKeys = keys.map(key => ({
      id: key.id,
      name: key.name,
      status: key.status,
      rateLimit: key.rate_limit,
      kyvexCookie: key.kyvex_cookie ? '***SET***' : null, // Don't expose full cookie
      analytics: key.analytics,
      createdAt: key.created_at,
      lastUsed: key.last_used,
    }));
    return jsonResponse({ keys: formattedKeys });
  } catch (error) {
    console.error('List API keys error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

export async function handleCreateApiKey(request) {
  const authResult = await verifyAdmin(request);
  if (authResult.error) {
    return errorResponse(authResult.error, authResult.status);
  }
  try {
    const { name } = await request.json();
    if (!name) {
      return errorResponse('Name is required', 400);
    }
    const adminId = authResult.admin.id;
    const keyDoc = await createApiKey({
      name,
      createdBy: adminId,
    });
    try {
      await sendApiKeyCreatedEmail(authResult.admin.email, name, keyDoc.key);
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
    }
    return jsonResponse({
      id: keyDoc.id,
      key: keyDoc.key,
      name: keyDoc.name,
      status: keyDoc.status,
      rateLimit: keyDoc.rate_limit,
      createdAt: keyDoc.created_at,
    });
  } catch (error) {
    console.error('Create API key error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

export async function handleUpdateApiKey(request, url) {
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
    const updates = await request.json();
    const updated = await updateApiKey(keyId, updates);
    if (!updated) {
      return errorResponse('API key not found', 404);
    }
    return jsonResponse({
      id: updated.id,
      name: updated.name,
      status: updated.status,
      rateLimit: updated.rate_limit,
      kyvexCookie: updated.kyvex_cookie ? '***SET***' : null, // Don't expose full cookie
    });
  } catch (error) {
    console.error('Update API key error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

export async function handleDeleteApiKey(request, url) {
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
    await deleteApiKey(keyId);
    return jsonResponse({ message: 'API key deleted successfully' });
  } catch (error) {
    console.error('Delete API key error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

// =========================
// Model Management Handlers
// =========================

export async function handleListModels(request) {
  const authResult = await verifyAdmin(request);
  if (authResult.error) {
    return errorResponse(authResult.error, authResult.status);
  }
  try {
    const models = await getAllModels(true); // true = include inactive
    const formattedModels = models.map(model => ({
      id: model.id,
      customName: model.custom_name,
      providerName: model.provider_name,
      brandName: model.brand_name,
      permissions: model.permissions || '',
      isActive: model.is_active,
      createdAt: model.created_at,
      updatedAt: model.updated_at,
    }));
    return jsonResponse({ models: formattedModels });
  } catch (error) {
    console.error('List models error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

export async function handleGetProviderModels(request) {
  const authResult = await verifyAdmin(request);
  if (authResult.error) {
    return errorResponse(authResult.error, authResult.status);
  }
  try {
    // Use the first active API key's cookie to fetch provider models
    const apiKeys = await getAllApiKeys({ status: 'active' }, { limit: 1 });
    if (!apiKeys || apiKeys.length === 0) {
      return errorResponse('No active API keys found. Create an API key first.', 404);
    }
    
    const kyvexCookie = apiKeys[0].kyvex_cookie || apiKeys[0].kyvexCookie;
    const providerModels = await getProviderModels(kyvexCookie);
    
    return jsonResponse({ models: providerModels });
  } catch (error) {
    console.error('Get provider models error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

export async function handleCreateModel(request) {
  const authResult = await verifyAdmin(request);
  if (authResult.error) {
    return errorResponse(authResult.error, authResult.status);
  }
  try {
    const { customName, providerName, brandName, permissions, isActive } = await request.json();
    if (!customName || !providerName) {
      return errorResponse('Custom name and provider name are required', 400);
    }
    
    const modelDoc = await createModel({
      customName,
      providerName,
      brandName: brandName || 'Sahyog',
      permissions: permissions || '',
      isActive: isActive !== undefined ? isActive : true,
    });
    
    return jsonResponse({
      id: modelDoc.id,
      customName: modelDoc.custom_name,
      providerName: modelDoc.provider_name,
      brandName: modelDoc.brand_name,
      permissions: modelDoc.permissions || '',
      isActive: modelDoc.is_active,
      createdAt: modelDoc.created_at,
    });
  } catch (error) {
    console.error('Create model error:', error);
    // Check for unique constraint violation
    if (error.message && error.message.includes('unique')) {
      return errorResponse('A model with this custom name already exists', 409);
    }
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

export async function handleUpdateModel(request, url) {
  const authResult = await verifyAdmin(request);
  if (authResult.error) {
    return errorResponse(authResult.error, authResult.status);
  }
  try {
    const urlParts = url.pathname.split('/');
    const modelId = urlParts[urlParts.length - 1];
    if (!modelId) {
      return errorResponse('Model ID required', 400);
    }
    
    const updates = await request.json();
    const updated = await updateModel(modelId, updates);
    if (!updated) {
      return errorResponse('Model not found', 404);
    }
    
    return jsonResponse({
      id: updated.id,
      customName: updated.custom_name,
      providerName: updated.provider_name,
      brandName: updated.brand_name,
      permissions: updated.permissions || '',
      isActive: updated.is_active,
    });
  } catch (error) {
    console.error('Update model error:', error);
    if (error.message && error.message.includes('unique')) {
      return errorResponse('A model with this custom name already exists', 409);
    }
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

export async function handleDeleteModel(request, url) {
  const authResult = await verifyAdmin(request);
  if (authResult.error) {
    return errorResponse(authResult.error, authResult.status);
  }
  try {
    const urlParts = url.pathname.split('/');
    const modelId = urlParts[urlParts.length - 1];
    if (!modelId) {
      return errorResponse('Model ID required', 400);
    }
    await deleteModel(modelId);
    return jsonResponse({ message: 'Model deleted successfully' });
  } catch (error) {
    console.error('Delete model error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

// =========================
// Proxy Management Handlers
// =========================

export async function handleGetProxyStats(request) {
  const authResult = await verifyAdmin(request);
  if (authResult.error) {
    return errorResponse(authResult.error, authResult.status);
  }
  try {
    const stats = await getProxyStats();
    return jsonResponse(stats);
  } catch (error) {
    console.error('Get proxy stats error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

export async function handleGetCookiePoolStats(request) {
  const authResult = await verifyAdmin(request);
  if (authResult.error) {
    return errorResponse(authResult.error, authResult.status);
  }
  try {
    const stats = await getPoolStats();
    return jsonResponse(stats);
  } catch (error) {
    console.error('Get cookie pool stats error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

export async function handleGetProxyList(request) {
  const authResult = await verifyAdmin(request);
  if (authResult.error) {
    return errorResponse(authResult.error, authResult.status);
  }
  try {
    const cookies = await getAllCookies();
    const formattedCookies = cookies.map(cookie => ({
      id: cookie.id,
      browser_id: cookie.browser_id,
      usage_count: cookie.usage_count || 0,
      is_active: cookie.is_active,
      created_at: cookie.created_at,
    }));
    return jsonResponse({ cookies: formattedCookies });
  } catch (error) {
    console.error('Get cookie list error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

export async function handleRefreshProxies(request) {
  const authResult = await verifyAdmin(request);
  if (authResult.error) {
    return errorResponse(authResult.error, authResult.status);
  }
  try {
    const result = await updateProxyList();
    return jsonResponse({
      message: 'Proxy list refreshed successfully. Note: HTTP proxies are tracked but not used in Cloudflare Workers. Add cookie-based proxies for actual rotation.',
      result,
    });
  } catch (error) {
    console.error('Refresh proxies error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

export async function handleCreateCookieProxy(request) {
  const authResult = await verifyAdmin(request);
  if (authResult.error) {
    return errorResponse(authResult.error, authResult.status);
  }
  try {
    const { cookie, name } = await request.json();
    if (!cookie || !cookie.trim()) {
      return errorResponse('Cookie is required', 400);
    }
    
    const proxy = await createCookieProxy(cookie.trim(), name);
    return jsonResponse({
      message: 'Cookie proxy created successfully',
      proxy: {
        id: proxy.id,
        type: proxy.type,
        requestsToday: proxy.requests_today,
        successRate: proxy.success_rate,
      },
    });
  } catch (error) {
    console.error('Create cookie proxy error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

export async function handleToggleProxy(request, url) {
  const authResult = await verifyAdmin(request);
  if (authResult.error) {
    return errorResponse(authResult.error, authResult.status);
  }
  try {
    const urlParts = url.pathname.split('/');
    const proxyId = urlParts[urlParts.length - 1];
    if (!proxyId) {
      return errorResponse('Proxy ID required', 400);
    }
    
    const { isActive } = await request.json();
    if (typeof isActive !== 'boolean') {
      return errorResponse('isActive must be a boolean', 400);
    }
    
    await toggleProxy(proxyId, isActive);
    return jsonResponse({ message: `Proxy ${isActive ? 'enabled' : 'disabled'} successfully` });
  } catch (error) {
    console.error('Toggle proxy error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

// =========================
// Thread Management Handlers
// =========================

export async function handleClearThreads(request) {
  const authResult = await verifyAdmin(request);
  if (authResult.error) {
    return errorResponse(authResult.error, authResult.status);
  }
  try {
    const { apiKeyId } = await request.json().catch(() => ({}));
    const deletedCount = await deleteAllThreads(apiKeyId || null);
    return jsonResponse({
      message: 'Threads cleared successfully',
      deletedCount,
    });
  } catch (error) {
    console.error('Clear threads error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

// =========================
// Analytics Reset Handlers
// =========================

export async function handleResetAnalytics(request) {
  const authResult = await verifyAdmin(request);
  if (authResult.error) {
    return errorResponse(authResult.error, authResult.status);
  }
  try {
    const { apiKeyId } = await request.json().catch(() => ({}));
    await resetAnalytics(apiKeyId || null);
    return jsonResponse({
      message: 'Analytics reset successfully',
    });
  } catch (error) {
    console.error('Reset analytics error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

// =========================
// Cookie Generation Handlers
// =========================

export async function handleGenerateCookies(request) {
  const authResult = await verifyAdmin(request);
  if (authResult.error) {
    return errorResponse(authResult.error, authResult.status);
  }
  try {
    const { count = 10 } = await request.json();
    console.log(`[Admin] Generating ${count} browser cookies...`);
    const result = await generateBatch(count);
    console.log(`[Admin] Cookie generation complete: ${result.created}/${count} created`);
    return jsonResponse({
      message: `Generated ${result.created} cookies`,
      created: result.created,
      errors: result.errors,
    });
  } catch (error) {
    console.error('[Admin] Generate cookies error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

export async function handleAutoGenerateCookies(request) {
  const authResult = await verifyAdmin(request);
  if (authResult.error) {
    return errorResponse(authResult.error, authResult.status);
  }
  try {
    console.log('[Admin] Auto-generate cookies requested');
    const result = await checkAndReplenishPool();
    console.log('[Admin] Auto-generate result:', result);
    
    return jsonResponse({
      message: result.replenished ? 
        `Generated ${result.count} cookies` : 
        `Pool is sufficient (${result.availableCount || 0} available, threshold: ${result.minPoolSize || 10}), no generation needed`,
      replenished: result.replenished,
      count: result.count || 0,
      availableCount: result.availableCount,
      minPoolSize: result.minPoolSize,
      errors: result.errors || 0,
    });
  } catch (error) {
    console.error('[Admin] Auto-generate cookies error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

// =========================
// Cookie Management Handlers
// =========================

export async function handleGetCookieDetails(request, url) {
  const authResult = await verifyAdmin(request);
  if (authResult.error) {
    return errorResponse(authResult.error, authResult.status);
  }
  try {
    // Extract cookie ID from URL path
    // Path format: /api/admin/proxies/{cookieId}
    const pathParts = url.pathname.split('/').filter(p => p);
    const cookieIdIndex = pathParts.indexOf('proxies');
    
    if (cookieIdIndex === -1 || cookieIdIndex >= pathParts.length - 1) {
      return errorResponse('Cookie ID required', 400);
    }
    
    const cookieId = pathParts[cookieIdIndex + 1];
    
    if (!cookieId || cookieId === 'toggle' || cookieId === 'test' || cookieId === 'history') {
      return errorResponse('Cookie ID required', 400);
    }
    
    // Validate UUID format (more lenient - allow any reasonable format)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(cookieId)) {
      console.error('Invalid cookie ID format:', cookieId, 'from path:', url.pathname);
      return errorResponse(`Invalid cookie ID format: ${cookieId}`, 400);
    }
    
    const { findOne } = await import('../utils/db.js');
    // First find by ID, then verify it's a cookie type
    const cookie = await findOne('proxies', { id: cookieId });
    
    if (!cookie || cookie.type !== 'cookie') {
      return errorResponse('Cookie not found', 404);
    }
    
    return jsonResponse({
      id: cookie.id,
      browserId: cookie.kyvex_cookie ? cookie.kyvex_cookie.split('=')[1]?.substring(0, 20) + '...' : null,
      type: cookie.type,
      requestsToday: cookie.requests_today || 0,
      totalRequests: cookie.total_requests || 0,
      successRate: cookie.success_rate || 0,
      isActive: cookie.is_active,
      exhaustedUntil: cookie.exhausted_until,
      lastUsed: cookie.last_used,
      createdAt: cookie.created_at,
    });
  } catch (error) {
    console.error('Get cookie details error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

export async function handleUpdateCookie(request, url) {
  const authResult = await verifyAdmin(request);
  if (authResult.error) {
    return errorResponse(authResult.error, authResult.status);
  }
  try {
    const pathParts = url.pathname.split('/').filter(p => p);
    const cookieIdIndex = pathParts.indexOf('proxies');
    
    if (cookieIdIndex === -1 || cookieIdIndex >= pathParts.length - 1) {
      return errorResponse('Cookie ID required', 400);
    }
    
    const cookieId = pathParts[cookieIdIndex + 1];
    
    if (!cookieId || cookieId === 'toggle' || cookieId === 'test' || cookieId === 'history') {
      return errorResponse('Cookie ID required', 400);
    }
    
    const { isActive, resetCounter } = await request.json();
    const updates = {};
    
    if (typeof isActive === 'boolean') {
      updates.is_active = isActive;
    }
    
    if (resetCounter === true) {
      updates.requests_today = 0;
      updates.exhausted_until = null;
    }
    
    const { updateOne } = await import('../utils/db.js');
    await updateOne('proxies', { id: cookieId }, updates);
    
    return jsonResponse({ message: 'Cookie updated successfully' });
  } catch (error) {
    console.error('Update cookie error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

export async function handleDeleteCookie(request, url) {
  const authResult = await verifyAdmin(request);
  if (authResult.error) {
    return errorResponse(authResult.error, authResult.status);
  }
  try {
    const pathParts = url.pathname.split('/').filter(p => p);
    const cookieIdIndex = pathParts.indexOf('cookies');
    
    if (cookieIdIndex === -1 || cookieIdIndex >= pathParts.length - 1) {
      return errorResponse('Cookie ID required', 400);
    }
    
    const cookieId = pathParts[cookieIdIndex + 1];
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(cookieId)) {
      return errorResponse(`Invalid cookie ID format: ${cookieId}`, 400);
    }
    
    await deleteCookie(cookieId);
    
    return jsonResponse({ message: 'Cookie deleted successfully' });
  } catch (error) {
    console.error('Delete cookie error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

export async function handleBulkCookieAction(request) {
  const authResult = await verifyAdmin(request);
  if (authResult.error) {
    return errorResponse(authResult.error, authResult.status);
  }
  try {
    const { action, cookieIds } = await request.json();
    
    if (!action || !Array.isArray(cookieIds) || cookieIds.length === 0) {
      return errorResponse('Action and cookieIds array required', 400);
    }
    
    const { updateOne, deleteOne } = await import('../utils/db.js');
    let updated = 0;
    
    if (action === 'enable') {
      for (const cookieId of cookieIds) {
        await updateOne('browser_cookies', { id: cookieId }, { is_active: true });
        updated++;
      }
    } else if (action === 'disable') {
      for (const cookieId of cookieIds) {
        await updateOne('browser_cookies', { id: cookieId }, { is_active: false });
        updated++;
      }
    } else if (action === 'delete') {
      for (const cookieId of cookieIds) {
        await deleteOne('browser_cookies', { id: cookieId });
        updated++;
      }
    } else if (action === 'reset') {
      for (const cookieId of cookieIds) {
        await updateOne('browser_cookies', { id: cookieId }, { 
          usage_count: 0,
          is_active: true,
        });
        updated++;
      }
    } else {
      return errorResponse('Invalid action. Use: enable, disable, delete, or reset', 400);
    }
    
    return jsonResponse({ 
      message: `Bulk action '${action}' completed`,
      updated,
    });
  } catch (error) {
    console.error('Bulk cookie action error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

export async function handleTestCookie(request, url) {
  const authResult = await verifyAdmin(request);
  if (authResult.error) {
    return errorResponse(authResult.error, authResult.status);
  }
  try {
    const pathParts = url.pathname.split('/').filter(p => p);
    const cookieIdIndex = pathParts.indexOf('proxies');
    
    if (cookieIdIndex === -1 || cookieIdIndex >= pathParts.length - 1) {
      return errorResponse('Cookie ID required', 400);
    }
    
    const cookieId = pathParts[cookieIdIndex + 1];
    
    // Skip reserved paths
    const reservedPaths = ['toggle', 'test', 'history', 'stats', 'refresh', 'generate-cookies', 
                          'auto-generate', 'bulk', 'reset-counters', 'cookie'];
    if (!cookieId || reservedPaths.includes(cookieId)) {
      return errorResponse('Cookie ID required', 400);
    }
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(cookieId)) {
      return errorResponse(`Invalid cookie ID format: ${cookieId}`, 400);
    }
    
    const { findOne } = await import('../utils/db.js');
    // Check cookie_proxies first, then proxies for backward compat
    let cookie = await findOne('cookie_proxies', { id: cookieId });
    if (!cookie) {
      cookie = await findOne('proxies', { id: cookieId });
    }
    
    if (!cookie || !cookie.kyvex_cookie) {
      return errorResponse('Cookie not found or has no cookie value', 404);
    }
    
    const { validateCookie } = await import('../services/cookieGenerator.js');
    const isValid = await validateCookie(cookie.kyvex_cookie);
    
    return jsonResponse({
      valid: isValid,
      message: isValid ? 'Cookie is valid' : 'Cookie validation failed',
    });
  } catch (error) {
    console.error('Test cookie error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

export async function handleGetCookieHistory(request, url) {
  const authResult = await verifyAdmin(request);
  if (authResult.error) {
    return errorResponse(authResult.error, authResult.status);
  }
  try {
    const pathParts = url.pathname.split('/').filter(p => p);
    const cookieIdIndex = pathParts.indexOf('proxies');
    
    if (cookieIdIndex === -1 || cookieIdIndex >= pathParts.length - 1) {
      return errorResponse('Cookie ID required', 400);
    }
    
    const cookieId = pathParts[cookieIdIndex + 1];
    
    // Skip reserved paths
    const reservedPaths = ['toggle', 'test', 'history', 'stats', 'refresh', 'generate-cookies', 
                          'auto-generate', 'bulk', 'reset-counters', 'cookie'];
    if (!cookieId || reservedPaths.includes(cookieId)) {
      return errorResponse('Cookie ID required', 400);
    }
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(cookieId)) {
      return errorResponse(`Invalid cookie ID format: ${cookieId}`, 400);
    }
    
    const urlObj = new URL(url.href);
    const days = parseInt(urlObj.searchParams.get('days') || '7', 10);
    
    // For now, return basic usage info
    // In future, can implement proper history table
    const { findOne } = await import('../utils/db.js');
    // Check cookie_proxies first, then proxies for backward compat
    let cookie = await findOne('cookie_proxies', { id: cookieId });
    if (!cookie) {
      cookie = await findOne('proxies', { id: cookieId });
    }
    
    if (!cookie) {
      return errorResponse('Cookie not found', 404);
    }
    
    return jsonResponse({
      cookieId,
      requestsToday: cookie.requests_today || 0,
      totalRequests: cookie.total_requests || 0,
      lastUsed: cookie.last_used,
      createdAt: cookie.created_at,
      note: 'Detailed history requires cookie_usage_history table',
    });
  } catch (error) {
    console.error('Get cookie history error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

export async function handleGetSystemHealth(request) {
  const authResult = await verifyAdmin(request);
  if (authResult.error) {
    return errorResponse(authResult.error, authResult.status);
  }
  try {
    const { find, countDocuments } = await import('../utils/db.js');
    
    // Check database connectivity
    let dbHealthy = false;
    try {
      await countDocuments('proxies');
      dbHealthy = true;
    } catch (error) {
      console.error('Database health check failed:', error);
    }
    
    // Get cookie pool stats
    const cookieProxies = await find('proxies', { type: 'cookie', is_active: true });
    const now = new Date();
    const availableCookies = cookieProxies.filter(proxy => {
      if (!proxy.exhausted_until) return (proxy.requests_today || 0) < 50;
      const exhaustedDate = new Date(proxy.exhausted_until);
      return exhaustedDate < now && (proxy.requests_today || 0) < 50;
    });
    
    const poolHealth = availableCookies.length < 2 ? 'critical' :
                       availableCookies.length < 5 ? 'warning' : 'healthy';
    
    return jsonResponse({
      status: dbHealthy && poolHealth !== 'critical' ? 'healthy' : poolHealth,
      database: {
        connected: dbHealthy,
      },
      cookiePool: {
        total: cookieProxies.length,
        available: availableCookies.length,
        health: poolHealth,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get system health error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

export async function handleGetSettings(request) {
  const authResult = await verifyAdmin(request);
  if (authResult.error) {
    return errorResponse(authResult.error, authResult.status);
  }
  try {
    const { getAllSettings } = await import('../services/settings.js');
    const settings = await getAllSettings();
    return jsonResponse(settings);
  } catch (error) {
    console.error('[Admin] Get settings error:', error);
    return errorResponse(error.message, 500);
  }
}

export async function handleUpdateSetting(request) {
  const authResult = await verifyAdmin(request);
  if (authResult.error) {
    return errorResponse(authResult.error, authResult.status);
  }
  try {
    const { key, value } = await request.json();
    const { setSetting } = await import('../services/settings.js');
    await setSetting(key, value);
    return jsonResponse({ message: 'Setting updated', key, value });
  } catch (error) {
    console.error('[Admin] Update setting error:', error);
    return errorResponse(error.message, 500);
  }
}

export async function handleResetCookieCounters(request) {
  const authResult = await verifyAdmin(request);
  if (authResult.error) {
    return errorResponse(authResult.error, authResult.status);
  }
  try {
    const result = await resetAllCounters();
    return jsonResponse({ 
      message: `Reset ${result.reset} cookie counters`,
      reset: result.reset,
    });
  } catch (error) {
    console.error('Reset cookie counters error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

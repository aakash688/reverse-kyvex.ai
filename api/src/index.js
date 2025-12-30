/**
 * Main Cloudflare Worker entry point
 */

import { handleChatCompletions } from './handlers/chat.js';
import { handleListModels } from './handlers/models.js';
import {
  handleAdminLogin,
  handleGetAdmin,
  handleForgotPassword,
  handleResetPassword,
  handleListApiKeys,
  handleCreateApiKey,
  handleUpdateApiKey,
  handleDeleteApiKey,
  handleListModels as handleListAdminModels,
  handleGetProviderModels,
  handleCreateModel,
  handleUpdateModel,
  handleDeleteModel,
  handleGetCookiePoolStats,
  handleGetProxyList,
  handleGenerateCookies,
  handleAutoGenerateCookies,
  handleClearThreads,
  handleResetAnalytics,
  handleDeleteCookie,
  handleBulkCookieAction,
  handleResetCookieCounters,
} from './handlers/admin.js';
import { handleAnalyticsOverview, handleApiKeyAnalytics } from './handlers/analytics.js';
import { errorResponse, jsonResponse, verifyAdmin } from './middleware/auth.js';
import { setEnv as setDbEnv } from './utils/db.js';
import { setEnv as setJwtEnv } from './utils/jwt.js';
import { setEnv as setEmailEnv } from './services/email.js';
import { checkAndReplenishPool, getPoolStats } from './services/cookieService.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function handleCORS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

function addCorsHeaders(response) {
  const newHeaders = new Headers(response.headers);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

export default {
  async fetch(request, env, ctx) {
    // Set global ENV from Cloudflare env for all modules
    const workerEnv = {
      SUPABASE_URL: env.SUPABASE_URL || '',
      SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY || '',
      JWT_SECRET: env.JWT_SECRET || '',
      RESEND_API_KEY: env.RESEND_API_KEY || '',
      ADMIN_PANEL_URL: env.ADMIN_PANEL_URL || '',
    };
    
    // Initialize all modules with env
    setDbEnv(workerEnv);
    setJwtEnv(workerEnv);
    setEmailEnv(workerEnv);

    if (request.method === 'OPTIONS') {
      return handleCORS();
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === '/v1/chat/completions' && request.method === 'POST') {
        const response = await handleChatCompletions(request);
        return addCorsHeaders(response);
      }

      if (path === '/v1/models' && request.method === 'GET') {
        const response = await handleListModels(request);
        return addCorsHeaders(response);
      }

      if (path === '/api/admin/login' && request.method === 'POST') {
        const response = await handleAdminLogin(request);
        return addCorsHeaders(response);
      }

      if (path === '/api/admin/me' && request.method === 'GET') {
        const response = await handleGetAdmin(request);
        return addCorsHeaders(response);
      }

      if (path === '/api/admin/forgot-password' && request.method === 'POST') {
        const response = await handleForgotPassword(request);
        return addCorsHeaders(response);
      }

      if (path === '/api/admin/reset-password' && request.method === 'POST') {
        const response = await handleResetPassword(request);
        return addCorsHeaders(response);
      }

      if (path === '/api/admin/api-keys' && request.method === 'GET') {
        const response = await handleListApiKeys(request);
        return addCorsHeaders(response);
      }

      if (path === '/api/admin/api-keys' && request.method === 'POST') {
        const response = await handleCreateApiKey(request);
        return addCorsHeaders(response);
      }

      if (path.startsWith('/api/admin/api-keys/') && request.method === 'PUT') {
        const response = await handleUpdateApiKey(request, url);
        return addCorsHeaders(response);
      }

      if (path.startsWith('/api/admin/api-keys/') && request.method === 'DELETE') {
        const response = await handleDeleteApiKey(request, url);
        return addCorsHeaders(response);
      }

      if (path === '/api/admin/analytics/overview' && request.method === 'GET') {
        const response = await handleAnalyticsOverview(request);
        return addCorsHeaders(response);
      }

      if (path.startsWith('/api/admin/analytics/key/') && request.method === 'GET') {
        const response = await handleApiKeyAnalytics(request, url);
        return addCorsHeaders(response);
      }

      if (path === '/api/admin/models' && request.method === 'GET') {
        const response = await handleListAdminModels(request);
        return addCorsHeaders(response);
      }

      if (path === '/api/admin/models/provider' && request.method === 'GET') {
        const response = await handleGetProviderModels(request);
        return addCorsHeaders(response);
      }

      if (path === '/api/admin/models' && request.method === 'POST') {
        const response = await handleCreateModel(request);
        return addCorsHeaders(response);
      }

      if (path.startsWith('/api/admin/models/') && request.method === 'PUT') {
        const response = await handleUpdateModel(request, url);
        return addCorsHeaders(response);
      }

      if (path.startsWith('/api/admin/models/') && request.method === 'DELETE') {
        const response = await handleDeleteModel(request, url);
        return addCorsHeaders(response);
      }

      // Cookie pool stats
      if (path === '/api/admin/cookies/stats' && request.method === 'GET') {
        const response = await handleGetCookiePoolStats(request);
        return addCorsHeaders(response);
      }

      // Legacy route for compatibility
      if (path === '/api/admin/proxies/stats/cookie' && request.method === 'GET') {
        const response = await handleGetCookiePoolStats(request);
        return addCorsHeaders(response);
      }

      // Get all cookies
      if ((path === '/api/admin/cookies' || path === '/api/admin/proxies') && request.method === 'GET') {
        const response = await handleGetProxyList(request);
        return addCorsHeaders(response);
      }

      // Generate cookies
      if ((path === '/api/admin/cookies/generate' || path === '/api/admin/proxies/generate-cookies') && request.method === 'POST') {
        const response = await handleGenerateCookies(request);
        return addCorsHeaders(response);
      }

      // Auto-generate cookies
      if ((path === '/api/admin/cookies/auto-generate' || path === '/api/admin/proxies/auto-generate') && request.method === 'POST') {
        const response = await handleAutoGenerateCookies(request);
        return addCorsHeaders(response);
      }

      // Clear threads
      if (path === '/api/admin/threads/clear' && request.method === 'POST') {
        const response = await handleClearThreads(request);
        return addCorsHeaders(response);
      }

      // Reset analytics
      if (path === '/api/admin/analytics/reset' && request.method === 'POST') {
        const response = await handleResetAnalytics(request);
        return addCorsHeaders(response);
      }

      // Delete specific cookie
      if (path.startsWith('/api/admin/cookies/') && request.method === 'DELETE') {
        const response = await handleDeleteCookie(request, url);
        return addCorsHeaders(response);
      }

      // Bulk cookie actions
      if ((path === '/api/admin/cookies/bulk' || path === '/api/admin/proxies/bulk') && request.method === 'POST') {
        const response = await handleBulkCookieAction(request);
        return addCorsHeaders(response);
      }

      // Reset cookie counters
      if ((path === '/api/admin/cookies/reset-counters' || path === '/api/admin/proxies/reset-counters') && request.method === 'POST') {
        const response = await handleResetCookieCounters(request);
        return addCorsHeaders(response);
      }

      if (path === '/api/admin/health' && request.method === 'GET') {
        const response = await handleGetSystemHealth(request);
        return addCorsHeaders(response);
      }

      if (path === '/api/admin/settings' && request.method === 'GET') {
        const response = await handleGetSettings(request);
        return addCorsHeaders(response);
      }

      if (path === '/api/admin/settings' && request.method === 'POST') {
        const response = await handleUpdateSetting(request);
        return addCorsHeaders(response);
      }

      // Debug endpoints for cookie generation
      if (path === '/api/admin/debug/cookies' && request.method === 'GET') {
        const authResult = await verifyAdmin(request);
        if (authResult.error) {
          return addCorsHeaders(errorResponse(authResult.error, authResult.status));
        }
        try {
          const { find } = await import('./utils/db.js');
          const { autoGenerateCookiesIfNeeded } = await import('./services/cookieGenerator.js');
          
          const allCookies = await find('proxies', { type: 'cookie' });
          const activeCookies = await find('proxies', { type: 'cookie', is_active: true });
          const autoGenStatus = await autoGenerateCookiesIfNeeded(5);
          
          return addCorsHeaders(jsonResponse({
            totalCookies: allCookies.length,
            activeCookies: activeCookies.length,
            cookieDetails: allCookies.slice(0, 10).map(c => ({
              id: c.id,
              source: c.source,
              is_active: c.is_active,
              requests_today: c.requests_today || 0,
              exhausted_until: c.exhausted_until,
              created_at: c.created_at,
            })),
            autoGenStatus,
            timestamp: new Date().toISOString(),
          }));
        } catch (error) {
          return addCorsHeaders(errorResponse(error.message || 'Internal server error', 500));
        }
      }

      if (path === '/api/admin/debug/cookies/test-generation' && request.method === 'POST') {
        const authResult = await verifyAdmin(request);
        if (authResult.error) {
          return addCorsHeaders(errorResponse(authResult.error, authResult.status));
        }
        try {
          const { count = 1 } = await request.json();
          const { generateAndStoreCookies } = await import('./services/cookieGenerator.js');
          const result = await generateAndStoreCookies(count, false, 'debug');
          return addCorsHeaders(jsonResponse({
            message: `Test generation: ${result.success}/${count} cookies created`,
            result,
          }));
        } catch (error) {
          return addCorsHeaders(errorResponse(error.message || 'Internal server error', 500));
        }
      }

      // Debug endpoint to test Supabase connection
      if (path === '/api/debug/supabase' && request.method === 'GET') {
        const { findOne, find } = await import('./utils/db.js');
        try {
          const test = await findOne('admins', { email: 'test@test.com' });
          const cookies = await find('browser_cookies', {});
          // Show partial URL for debugging (hide full URL for security)
          const url = workerEnv.SUPABASE_URL || '';
          const urlStart = url.substring(0, 30);
          const urlEnd = url.substring(url.length - 20);
          return jsonResponse({
            success: true,
            supabaseUrl: workerEnv.SUPABASE_URL ? 'SET' : 'MISSING',
            supabaseKey: workerEnv.SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
            urlLength: workerEnv.SUPABASE_URL?.length || 0,
            urlPreview: `${urlStart}...${urlEnd}`,
            keyLength: workerEnv.SUPABASE_ANON_KEY?.length || 0,
            testResult: test ? 'Found' : 'Not found (expected)',
            cookiesInDb: cookies.length,
            cookieSample: cookies.slice(0, 3).map(c => ({ id: c.id, browser_id: c.browser_id })),
          });
        } catch (error) {
          return jsonResponse({
            success: false,
            error: error.message,
            supabaseUrl: workerEnv.SUPABASE_URL ? 'SET' : 'MISSING',
            supabaseKey: workerEnv.SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
          }, 500);
        }
      }

      return addCorsHeaders(errorResponse('Not found', 404));
    } catch (error) {
      console.error('Request error:', error);
      return addCorsHeaders(errorResponse(error.message || 'Internal server error', 500));
    }
  },

  async scheduled(event, env, ctx) {
    // Set global ENV from Cloudflare env for all modules
    const workerEnv = {
      SUPABASE_URL: env.SUPABASE_URL || '',
      SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY || '',
      JWT_SECRET: env.JWT_SECRET || '',
      RESEND_API_KEY: env.RESEND_API_KEY || '',
      ADMIN_PANEL_URL: env.ADMIN_PANEL_URL || '',
    };
    
    // Initialize all modules with env
    setDbEnv(workerEnv);
    setJwtEnv(workerEnv);
    setEmailEnv(workerEnv);

    try {
      console.log('[Cron] Starting scheduled tasks...');

      // Clean up exhausted cookies first
      const { cleanupExhausted } = await import('./services/cookieService.js');
      const cleanupResult = await cleanupExhausted();
      if (cleanupResult.deleted > 0) {
        console.log(`[Cron] Cleaned up ${cleanupResult.deleted} exhausted cookies`);
      }

      // Auto-replenish cookie pool if needed
      const result = await checkAndReplenishPool();
      if (result.replenished) {
        console.log(`[Cron] Generated ${result.count} new cookies`);
      } else {
        console.log('[Cron] Cookie pool is sufficient');
      }

      // Log pool stats
      const stats = await getPoolStats();
      console.log('[Cron] Pool stats:', stats);

      return new Response(JSON.stringify({ 
        success: true, 
        stats,
        cleanup: cleanupResult,
        replenish: result,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('[Cron] Error:', error);
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};

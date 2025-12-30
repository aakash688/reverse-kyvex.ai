/**
 * Proxy service for managing and rotating proxies
 */

import { findOne, find, insertOne, updateOne, deleteOne, countDocuments } from '../utils/db.js';

const GITHUB_HTTP_URL = 'https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/http.txt';
const GITHUB_SOCKS5_URL = 'https://raw.githubusercontent.com/TheSpeedX/SOCKS-List/master/socks5.txt';
const GITHUB_SOCKS4_URL = 'https://raw.githubusercontent.com/TheSpeedX/SOCKS-List/master/socks4.txt';

/**
 * Parse proxy line (format: host:port)
 */
function parseProxyLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;
  
  const parts = trimmed.split(':');
  if (parts.length !== 2) return null;
  
  const host = parts[0].trim();
  const port = parseInt(parts[1].trim(), 10);
  
  if (!host || isNaN(port) || port < 1 || port > 65535) return null;
  
  return { host, port };
}

/**
 * Fetch proxies from GitHub
 */
export async function fetchProxiesFromGitHub() {
  const proxies = [];
  
  try {
    // Fetch HTTP proxies
    const httpResponse = await fetch(GITHUB_HTTP_URL);
    if (httpResponse.ok) {
      const httpText = await httpResponse.text();
      const httpLines = httpText.split('\n');
      for (const line of httpLines) {
        const proxy = parseProxyLine(line);
        if (proxy) {
          proxies.push({ ...proxy, type: 'http', source: 'github' });
        }
      }
    }
  } catch (error) {
    console.error('Error fetching HTTP proxies from GitHub:', error);
  }
  
  try {
    // Fetch SOCKS5 proxies
    const socks5Response = await fetch(GITHUB_SOCKS5_URL);
    if (socks5Response.ok) {
      const socks5Text = await socks5Response.text();
      const socks5Lines = socks5Text.split('\n');
      for (const line of socks5Lines) {
        const proxy = parseProxyLine(line);
        if (proxy) {
          proxies.push({ ...proxy, type: 'socks5', source: 'github' });
        }
      }
    }
  } catch (error) {
    console.error('Error fetching SOCKS5 proxies from GitHub:', error);
  }
  
  try {
    // Fetch SOCKS4 proxies
    const socks4Response = await fetch(GITHUB_SOCKS4_URL);
    if (socks4Response.ok) {
      const socks4Text = await socks4Response.text();
      const socks4Lines = socks4Text.split('\n');
      for (const line of socks4Lines) {
        const proxy = parseProxyLine(line);
        if (proxy) {
          proxies.push({ ...proxy, type: 'socks4', source: 'github' });
        }
      }
    }
  } catch (error) {
    console.error('Error fetching SOCKS4 proxies from GitHub:', error);
  }
  
  return proxies;
}

/**
 * Fetch proxies from ProxyDB
 * Note: ProxyDB doesn't have a public API, so we'll parse HTML or use a simple approach
 * For now, we'll return empty array and can enhance later
 */
export async function fetchProxiesFromProxyDB() {
  // ProxyDB doesn't have a simple API endpoint
  // Would need to scrape HTML or use their API if available
  // For now, return empty array - can be enhanced later
  console.log('ProxyDB fetching not implemented yet - would need API access or HTML parsing');
  return [];
}

/**
 * Test if a proxy is working
 * Note: Cloudflare Workers have limitations with SOCKS proxies
 * For HTTP proxies, we can test with a simple request
 */
export async function testProxy(proxy) {
  // For HTTP proxies, test with a simple request
  if (proxy.type === 'http' || proxy.type === 'https') {
    try {
      // Test with a simple HTTP request through proxy
      // Note: Cloudflare Workers fetch API doesn't support proxy directly
      // We'll mark HTTP proxies as potentially working and test them in real usage
      // For now, return true for HTTP proxies (will be tested in actual usage)
      return true;
    } catch (error) {
      return false;
    }
  }
  
  // SOCKS proxies can't be tested directly in Cloudflare Workers
  // Mark as potentially working, will be tested in actual usage
  return true;
}

/**
 * Create cookie-based proxy entry
 * Since Cloudflare Workers don't support HTTP proxies, we create cookie entries
 * Each cookie proxy represents a different kyvex.ai session for rotation
 */
export async function createCookieProxy(cookie, name = null, source = 'manual') {
  if (!cookie || !cookie.trim()) {
    throw new Error('Cookie is required');
  }
  
  if (!cookie.includes('browserId=')) {
    throw new Error('Invalid cookie format: must contain browserId=');
  }
  
  // WORKAROUND: Use proxies table but insert WITHOUT kyvex_cookie first
  // Then UPDATE it separately (UPDATE works even if column not in PostgREST cache)
  const { findOne, insertOne, updateOne } = await import('../utils/db.js');
  
  // Check for duplicate (skip kyvex_cookie check due to cache issue)
  // We'll rely on unique host/port/type constraint instead
  
  // Validate source value
  const validSources = ['github', 'proxydb', 'manual', 'auto_gen', 'debug'];
  if (!validSources.includes(source)) {
    console.warn(`[ProxyService] Invalid source "${source}", defaulting to "manual"`);
    source = 'manual';
  }
  
  // Generate unique host/port for cookie proxies
  const uniqueId = `cookie_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Insert WITHOUT kyvex_cookie (PostgREST cache workaround)
  const proxyDoc = {
    host: uniqueId,
    port: 0,
    type: 'cookie',
    source: source,
    is_active: true,
    success_rate: 1.0,
    total_requests: 0,
    successful_requests: 0,
    failed_requests: 0,
    requests_today: 0,
    last_tested: new Date().toISOString(),
  };
  
  console.log(`[ProxyService] Creating cookie proxy (source: "${source}", type: "${proxyDoc.type}")...`);
  
  try {
    // Use RPC function to bypass PostgREST schema cache issue
    const { rpc } = await import('../utils/db.js');
    const proxyId = await rpc('insert_cookie_proxy', {
      p_host: proxyDoc.host,
      p_port: proxyDoc.port,
      p_type: proxyDoc.type,
      p_source: proxyDoc.source,
      p_kyvex_cookie: cookie.trim(),
      p_is_active: proxyDoc.is_active,
      p_success_rate: proxyDoc.success_rate,
      p_total_requests: proxyDoc.total_requests,
      p_successful_requests: proxyDoc.successful_requests,
      p_failed_requests: proxyDoc.failed_requests,
      p_requests_today: proxyDoc.requests_today,
      p_last_tested: proxyDoc.last_tested,
    });
    
    const createdProxy = { ...proxyDoc, id: proxyId, kyvex_cookie: cookie.trim() };
    console.log(`[ProxyService] ✅ Created cookie proxy via RPC (ID: ${createdProxy.id})`);
    return createdProxy;
  } catch (error) {
    console.error(`[ProxyService] ✗ Failed to insert cookie proxy:`, error.message);
    throw error;
  }
}

/**
 * Ensure cookie proxies exist for given cookies
 * Creates cookie proxies if they don't already exist (checks by cookie value)
 * This allows automatic proxy creation from API key cookies
 */
export async function ensureCookieProxiesExist(cookies, apiKeyId = null) {
  if (!cookies || cookies.length === 0) return;
  
  // Check existing cookie proxies
  const existingProxies = await find('proxies', {
    type: 'cookie',
    is_active: true,
  });
  
  const existingCookies = new Set(
    existingProxies
      .map(p => p.kyvex_cookie?.trim())
      .filter(c => c)
  );
  
  // Create proxies for cookies that don't exist
  const cookiesToCreate = cookies.filter(
    cookie => cookie && cookie.trim() && !existingCookies.has(cookie.trim())
  );
  
  for (const cookie of cookiesToCreate) {
    try {
      await createCookieProxy(cookie.trim(), apiKeyId ? `auto_${apiKeyId}` : 'auto');
      console.log(`Created cookie proxy for cookie rotation`);
    } catch (error) {
      console.error(`Failed to create cookie proxy:`, error);
      // Continue with other cookies even if one fails
    }
  }
  
  return cookiesToCreate.length;
}

/**
 * Update proxy list from sources
 */
export async function updateProxyList() {
  console.log('Starting proxy list update...');
  
  const githubProxies = await fetchProxiesFromGitHub();
  const proxydbProxies = await fetchProxiesFromProxyDB();
  
  const allProxies = [...githubProxies, ...proxydbProxies];
  console.log(`Fetched ${allProxies.length} proxies from sources`);
  
  let added = 0;
  let updated = 0;
  
  for (const proxy of allProxies) {
    try {
      // Check if proxy already exists
      const existing = await findOne('proxies', {
        host: proxy.host,
        port: proxy.port,
        type: proxy.type,
      });
      
      if (existing) {
        // Update last_tested
        await updateOne(
          'proxies',
          { id: existing.id },
          {
            last_tested: new Date().toISOString(),
            source: proxy.source,
            updated_at: new Date().toISOString(),
          }
        );
        updated++;
      } else {
        // Insert new proxy
        const proxyDoc = {
          host: proxy.host,
          port: proxy.port,
          type: proxy.type,
          source: proxy.source,
          is_active: true,
          success_rate: 0.0,
          total_requests: 0,
          successful_requests: 0,
          failed_requests: 0,
          requests_today: 0,
          last_tested: new Date().toISOString(),
        };
        
        await insertOne('proxies', proxyDoc);
        added++;
      }
    } catch (error) {
      console.error(`Error processing proxy ${proxy.host}:${proxy.port}:`, error);
    }
  }
  
  console.log(`Proxy update complete: ${added} added, ${updated} updated`);
  return { added, updated, total: allProxies.length };
}

/**
 * Reset daily counters for proxies (should be called daily)
 */
export async function resetDailyCounters() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Reset requests_today for all proxies
  // Also reset exhausted_until if it's from a previous day
  const proxies = await find('proxies', {});
  
  for (const proxy of proxies) {
    const updates = {
      requests_today: 0,
      updated_at: new Date().toISOString(),
    };
    
    // Reset exhausted_until if it's from a previous day
    if (proxy.exhausted_until) {
      const exhaustedDate = new Date(proxy.exhausted_until);
      if (exhaustedDate < today) {
        updates.exhausted_until = null;
      }
    }
    
    await updateOne('proxies', { id: proxy.id }, updates);
  }
  
  console.log('Daily counters reset');
}

/**
 * Select best available proxy (cookie-based rotation)
 * Since Cloudflare Workers don't support HTTP proxies, we use cookies instead
 * Each "proxy" entry with type='cookie' represents a different cookie/session
 */
export async function selectBestProxy() {
  const now = new Date();
  
  // Get active proxies that have cookies (cookie-based proxies)
  // Also get regular proxies for tracking, but prioritize cookie-based ones
  const allProxies = await find('proxies', {
    is_active: true,
  }, {
    sort: { success_rate: -1, requests_today: 1 },
  });
  
  // Filter proxies that are available (not exhausted or exhausted time has passed)
  const availableProxies = allProxies.filter(proxy => {
    if (!proxy.exhausted_until) return true;
    const exhaustedDate = new Date(proxy.exhausted_until);
    return exhaustedDate < now;
  });
  
  // Filter proxies that haven't hit daily limit (50 requests)
  const eligibleProxies = availableProxies.filter(proxy => {
    return (proxy.requests_today || 0) < 50;
  });
  
  // Prioritize cookie-based proxies (type='cookie' or has kyvex_cookie)
  const cookieProxies = eligibleProxies.filter(p => 
    p.type === 'cookie' || (p.kyvex_cookie && p.kyvex_cookie.trim())
  );
  
  if (cookieProxies.length > 0) {
    // Trigger auto-generation in background if pool is getting low (< 5 available)
    if (cookieProxies.length < 5) {
      console.log(`[ProxyService] ⚠️ Low cookie pool (${cookieProxies.length} available), triggering auto-generation...`);
      const { autoGenerateCookiesIfNeeded } = await import('./cookieGenerator.js');
      autoGenerateCookiesIfNeeded(5).catch(err => {
        console.error('[ProxyService] Background cookie generation failed:', err);
      });
    }
    // Return cookie proxy with highest success rate and lowest requests today
    console.log(`[ProxyService] Selected cookie proxy (ID: ${cookieProxies[0].id}, requests_today: ${cookieProxies[0].requests_today || 0})`);
    return cookieProxies[0];
  }
  
  if (eligibleProxies.length === 0) {
    // Trigger auto-generation when no eligible proxies
    console.log('[ProxyService] ⚠️ No eligible proxies available, triggering auto-generation...');
    const { autoGenerateCookiesIfNeeded } = await import('./cookieGenerator.js');
    autoGenerateCookiesIfNeeded(10).catch(err => {
      console.error('[ProxyService] Background cookie generation failed:', err);
    });
    // No eligible proxies, try resetting exhausted proxies from previous day
    await resetDailyCounters();
    
    // Try again after reset
    const retryProxies = await find('proxies', {
      is_active: true,
    }, {
      sort: { success_rate: -1, requests_today: 1 },
    });
    
    const retryEligible = retryProxies.filter(proxy => {
      if (!proxy.exhausted_until) return true;
      const exhaustedDate = new Date(proxy.exhausted_until);
      return exhaustedDate < now && (proxy.requests_today || 0) < 50;
    });
    
    // Prioritize cookie proxies
    const retryCookieProxies = retryEligible.filter(p => 
      p.type === 'cookie' || (p.kyvex_cookie && p.kyvex_cookie.trim())
    );
    
    if (retryCookieProxies.length > 0) {
      return retryCookieProxies[0];
    }
    
    if (retryEligible.length > 0) {
      return retryEligible[0];
    }
    
    return null;
  }
  
  // Return proxy with highest success rate and lowest requests today
  return eligibleProxies[0];
}

/**
 * Select best available cookie (cookie-only mode, no proxy consideration)
 */
export async function selectBestCookie() {
  const now = new Date();
  // Use proxies table with type='cookie' filter
  const allCookies = await find('proxies', {
    type: 'cookie',
    is_active: true,
  }, {
    sort: { success_rate: -1, requests_today: 1 },
  });
  
  const eligibleCookies = allCookies.filter(proxy => {
    if (proxy.exhausted_until) {
      const exhaustedDate = new Date(proxy.exhausted_until);
      if (exhaustedDate > now) return false;
    }
    return (proxy.requests_today || 0) < 45;
  });
  
  return eligibleCookies.length > 0 ? eligibleCookies[0] : null;
}

/**
 * Mark proxy as exhausted for today
 */
export async function markProxyExhausted(proxyId) {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  await updateOne(
    'proxies',
    { id: proxyId },
    {
      exhausted_until: tomorrow.toISOString(),
      updated_at: new Date().toISOString(),
    }
  );
}

/**
 * Increment proxy usage and update statistics
 * Auto-deletes cookies at 45 requests (safety margin before 50 limit)
 */
export async function incrementProxyUsage(proxyId, apiKeyId, success) {
  const proxy = await findOne('proxies', { id: proxyId });
  if (!proxy) return;
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateString = today.toISOString().split('T')[0];
  
  // Update proxy statistics
  const newTotalRequests = (proxy.total_requests || 0) + 1;
  const newSuccessfulRequests = success 
    ? (proxy.successful_requests || 0) + 1 
    : (proxy.successful_requests || 0);
  const newFailedRequests = success 
    ? (proxy.failed_requests || 0) 
    : (proxy.failed_requests || 0) + 1;
  const newSuccessRate = newTotalRequests > 0 
    ? (newSuccessfulRequests / newTotalRequests) * 100 
    : 0;
  const newRequestsToday = (proxy.requests_today || 0) + 1;
  
  // Auto-delete if reached 45 requests (safety margin before 50 limit)
  // Only for cookie-type proxies
  if (proxy.type === 'cookie' && newRequestsToday >= 45) {
    console.log(`[ProxyService] Cookie ${proxyId} reached 45 requests, deleting...`);
    const { deleteOne } = await import('../utils/db.js');
    await deleteOne('proxies', { id: proxyId });
    
    // Trigger auto-generation if pool is low
    const { getSetting } = await import('./settings.js');
    const minThreshold = parseInt(await getSetting('cookie_min_threshold', '10'));
    const batchSize = parseInt(await getSetting('cookie_gen_batch_size', '50'));
    const { autoGenerateCookiesIfNeeded } = await import('./cookieGenerator.js');
    autoGenerateCookiesIfNeeded(minThreshold, batchSize).catch(err => {
      console.error('[ProxyService] Auto-generation failed:', err);
    });
    
    return;
  }
  
  await updateOne(
    'proxies',
    { id: proxyId },
    {
      total_requests: newTotalRequests,
      successful_requests: newSuccessfulRequests,
      failed_requests: newFailedRequests,
      success_rate: newSuccessRate,
      requests_today: newRequestsToday,
      last_used: now.toISOString(),
      updated_at: now.toISOString(),
    }
  );
  
  // Update proxy_usage table for daily tracking per API key
  const usage = await findOne('proxy_usage', {
    proxy_id: proxyId,
    api_key_id: apiKeyId,
    request_date: dateString,
  });
  
  if (usage) {
    await updateOne(
      'proxy_usage',
      { id: usage.id },
      {
        request_count: (usage.request_count || 0) + 1,
        updated_at: now.toISOString(),
      }
    );
  } else {
    await insertOne('proxy_usage', {
      proxy_id: proxyId,
      api_key_id: apiKeyId,
      request_date: dateString,
      request_count: 1,
    });
  }
}

/**
 * Get proxy statistics (all proxies)
 */
export async function getProxyStats() {
  const total = await countDocuments('proxies');
  const active = await countDocuments('proxies', { is_active: true });
  
  const now = new Date();
  const exhausted = await find('proxies', {
    is_active: true,
  });
  
  const exhaustedCount = exhausted.filter(proxy => {
    if (!proxy.exhausted_until) return false;
    return new Date(proxy.exhausted_until) > now;
  }).length;
  
  const activeCount = active - exhaustedCount;
  
  // Get average success rate
  const allProxies = await find('proxies', {});
  const avgSuccessRate = allProxies.length > 0
    ? allProxies.reduce((sum, p) => sum + (p.success_rate || 0), 0) / allProxies.length
    : 0;
  
  // Get total requests today
  const totalRequestsToday = allProxies.reduce((sum, p) => sum + (p.requests_today || 0), 0);
  
  return {
    total,
    active: activeCount,
    exhausted: exhaustedCount,
    inactive: total - active,
    averageSuccessRate: avgSuccessRate,
    totalRequestsToday,
  };
}

/**
 * Get cookie pool statistics (cookie proxies only)
 */
export async function getCookiePoolStats() {
  const now = new Date();
  
  try {
    // Get all cookie proxies from proxies table
    console.log('[CookiePoolStats] Querying cookie proxies...');
    const cookieProxies = await find('proxies', { type: 'cookie' });
    console.log(`[CookiePoolStats] Found ${cookieProxies.length} cookie proxies`);
    
    const total = cookieProxies.length;
  
  // Filter available cookies (not exhausted and under 50 requests today)
  const availableCookies = cookieProxies.filter(proxy => {
    if (!proxy.is_active) return false;
    if (!proxy.exhausted_until) return (proxy.requests_today || 0) < 50;
    const exhaustedDate = new Date(proxy.exhausted_until);
    return exhaustedDate < now && (proxy.requests_today || 0) < 50;
  });
  
  // Filter exhausted cookies
  const exhaustedCookies = cookieProxies.filter(proxy => {
    if (!proxy.is_active) return false;
    if (!proxy.exhausted_until) return (proxy.requests_today || 0) >= 50;
    const exhaustedDate = new Date(proxy.exhausted_until);
    return exhaustedDate > now || (proxy.requests_today || 0) >= 50;
  });
  
  // Calculate capacity (available cookies * 50 requests per day)
  const capacity = availableCookies.length * 50;
  
  // Get total requests today from cookie proxies
  const totalRequestsToday = cookieProxies.reduce((sum, p) => sum + (p.requests_today || 0), 0);
  
  // Get average success rate for cookie proxies
  const avgSuccessRate = cookieProxies.length > 0
    ? cookieProxies.reduce((sum, p) => sum + (p.success_rate || 0), 0) / cookieProxies.length
    : 0;
  
    const stats = {
      total,
      available: availableCookies.length,
      exhausted: exhaustedCookies.length,
      inactive: total - availableCookies.length - exhaustedCookies.length,
      capacity,
      totalRequestsToday,
      averageSuccessRate: avgSuccessRate,
    };
    
    console.log('[CookiePoolStats] Final stats:', stats);
    return stats;
  } catch (error) {
    console.error('[CookiePoolStats] Error getting cookie pool stats:', error);
    // Return empty stats on error
    return {
      total: 0,
      available: 0,
      exhausted: 0,
      inactive: 0,
      capacity: 0,
      totalRequestsToday: 0,
      averageSuccessRate: 0,
      error: error.message,
    };
  }
}

/**
 * Get all proxies with stats
 */
export async function getAllProxies() {
  return await find('proxies', {}, { sort: { success_rate: -1, created_at: -1 } });
}

/**
 * Toggle proxy active status
 */
export async function toggleProxy(proxyId, isActive) {
  await updateOne(
    'proxies',
    { id: proxyId },
    {
      is_active: isActive,
      updated_at: new Date().toISOString(),
    }
  );
}


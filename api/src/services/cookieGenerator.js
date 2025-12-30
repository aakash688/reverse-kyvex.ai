/**
 * Automated Cookie Generation Service
 * 
 * This service automatically generates valid cookies by:
 * 1. Programmatically generating browserId cookies in format: browserId=BRWS-<random_string>
 * 2. Optionally validating sample cookies to ensure format works
 * 3. Storing them as cookie proxies for rotation
 * 4. Auto-generating when pool is low
 */

import { createCookieProxy } from './proxyService.js';

const KYVEX_BASE_URL = 'https://kyvex.ai';

/**
 * Generate random User-Agent to simulate different browsers
 */
function getRandomUserAgent() {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

/**
 * Generate a random browserId cookie in kyvex.ai format
 * Format: browserId=BRWS-<random_alphanumeric_string>
 * Random string length: 30-35 characters (base36: 0-9, a-z)
 * @returns {string} Cookie string in format browserId=BRWS-<random>
 */
function generateBrowserIdCookie() {
  const length = 30 + Math.floor(Math.random() * 6); // 30-35 chars
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz';
  let randomString = '';
  
  for (let i = 0; i < length; i++) {
    randomString += chars[Math.floor(Math.random() * chars.length)];
  }
  
  return `browserId=BRWS-${randomString}`;
}

/**
 * Validate a sample cookie by making a lightweight test request
 * @param {string} cookie - Cookie to validate
 * @returns {Promise<boolean>} True if cookie format is valid
 */
async function validateCookieSample(cookie) {
  try {
    const response = await fetch(`${KYVEX_BASE_URL}/api/v1/ai/list-models`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': getRandomUserAgent(),
        'Cookie': cookie,
      },
    });
    
    return response.status === 200 || response.status === 429;
  } catch (error) {
    console.error('[CookieGen] Sample validation error:', error);
    return false;
  }
}

/**
 * Validate a cookie by making a test request to kyvex.ai
 * @param {string} cookie - Cookie string to validate
 * @returns {Promise<boolean>} True if cookie is valid
 */
export async function validateCookie(cookie) {
  if (!cookie || !cookie.trim()) {
    console.warn('[CookieGen] Validation failed: empty cookie');
    return false;
  }

  // Basic validation: must contain browserId=
  if (!cookie.includes('browserId=')) {
    console.warn('[CookieGen] Validation failed: cookie does not contain browserId');
    return false;
  }

  try {
    // Make a lightweight test request
    const testPayload = {
      model: 'gpt-4',
      prompt: 'test',
      threadId: null,
      webSearch: false,
      generateImage: false,
      reasoning: false,
      files: [],
      inputAudio: '',
      autoRoute: false,
    };

    console.log('[CookieGen] Validating cookie...');
    const response = await fetch(`${KYVEX_BASE_URL}/api/v1/ai/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'User-Agent': getRandomUserAgent(),
        'Origin': KYVEX_BASE_URL,
        'Referer': `${KYVEX_BASE_URL}/`,
        'Cookie': cookie.trim(),
      },
      body: JSON.stringify(testPayload),
    });

    // If we get a response (even if error), cookie is valid
    // Rate limit errors (429) still mean cookie is valid
    const isValid = response.status === 200 || response.status === 429 || response.status === 400;
    console.log(`[CookieGen] Cookie validation result: ${isValid ? 'VALID' : 'INVALID'} (status: ${response.status})`);
    return isValid;
  } catch (error) {
    console.error('[CookieGen] Error validating cookie:', error);
    return false;
  }
}

/**
 * Generate and store multiple cookies programmatically
 * @param {number} count - Number of cookies to generate
 * @param {boolean} validate - Whether to test 1-2 samples
 * @param {string} source - Source of generation
 * @returns {Promise<Object>} Result object with success count, errors, and created cookies
 */
export async function generateAndStoreCookies(count = 50, validate = false, source = 'auto_gen') {
  console.log(`[CookieGen] Generating ${count} cookies programmatically...`);
  
  const cookies = [];
  const errors = [];
  
  // Generate all cookies programmatically
  for (let i = 0; i < count; i++) {
    cookies.push(generateBrowserIdCookie());
  }
  
  // Optional: Validate 1-2 sample cookies to ensure format works
  if (validate && cookies.length > 0) {
    const sampleCookie = cookies[0];
    const isValid = await validateCookieSample(sampleCookie);
    if (!isValid) {
      console.error('[CookieGen] Sample validation failed - cookie format may be incorrect');
      return {
        success: 0,
        total: count,
        cookies: [],
        errors: ['Sample cookie validation failed'],
      };
    }
  }
  
  // Check for duplicates in DB (use proxies table with type='cookie')
  const { find } = await import('../utils/db.js');
  const existingProxies = await find('proxies', { type: 'cookie' });
  const existingCookies = new Set(
    existingProxies.map(p => p.kyvex_cookie?.trim()).filter(c => c)
  );
  
  // Filter out duplicates
  const newCookies = cookies.filter(c => !existingCookies.has(c.trim()));
  
  console.log(`[CookieGen] Storing ${newCookies.length} new cookies...`);
  
  // Store in batches
  const createdCookies = [];
  const BATCH_SIZE = 10;
  
  for (let i = 0; i < newCookies.length; i += BATCH_SIZE) {
    const batch = newCookies.slice(i, i + BATCH_SIZE);
    const batchPromises = batch.map(async (cookie, idx) => {
      try {
        console.log(`[CookieGen] Creating cookie ${i + idx + 1}/${newCookies.length}...`);
        const proxy = await createCookieProxy(cookie.trim(), `${source}_${Date.now()}_${i + idx}`, source);
        console.log(`[CookieGen] ✓ Cookie ${i + idx + 1} created (ID: ${proxy.id})`);
        return proxy;
      } catch (error) {
        const errorMsg = `Cookie ${i + idx + 1}: ${error.message}`;
        console.error(`[CookieGen] ✗ ${errorMsg}`);
        console.error(`[CookieGen] Error stack:`, error.stack);
        errors.push(errorMsg);
        return null;
      }
    });
    
    const results = await Promise.all(batchPromises);
    createdCookies.push(...results.filter(p => p !== null));
  }
  
  console.log(`[CookieGen] Successfully created ${createdCookies.length}/${count} cookies`);
  
  return {
    success: createdCookies.length,
    total: count,
    cookies: createdCookies,
    errors,
  };
}

/**
 * Auto-generate cookies when running low
 * This can be called periodically or when proxies are exhausted
 * @param {number} minCookies - Minimum number of cookies to maintain
 * @param {number} generateCount - Number of cookies to generate when pool is low
 * @returns {Promise<Object>} Result object with generation details
 */
export async function autoGenerateCookiesIfNeeded(minCookies = 10, generateCount = 50) {
  console.log(`[CookieGen] Checking pool (min: ${minCookies})...`);
  
  const { find } = await import('../utils/db.js');
  const availableProxies = await find('proxies', {
    type: 'cookie',
    is_active: true,
  });
  
  const now = new Date();
  const eligibleProxies = availableProxies.filter(proxy => {
    if (!proxy.exhausted_until) return (proxy.requests_today || 0) < 45;
    const exhaustedDate = new Date(proxy.exhausted_until);
    return exhaustedDate < now && (proxy.requests_today || 0) < 45;
  });
  
  console.log(`[CookieGen] Eligible cookies: ${eligibleProxies.length}/${availableProxies.length}`);
  
  if (eligibleProxies.length < minCookies) {
    console.log(`[CookieGen] Low pool detected, generating ${generateCount} cookies...`);
    return await generateAndStoreCookies(generateCount, false, 'auto_gen');
  }
  
  return {
    success: 0,
    total: 0,
    cookies: [],
    errors: [],
    message: `Sufficient cookies (${eligibleProxies.length})`,
  };
}


/**
 * Cookie Service - Manages browser ID cookies for request rotation
 * 
 * This service handles:
 * - Generating BRWS-xxx browser IDs
 * - Managing cookie pool (get, increment, delete)
 * - Auto-replenishing when pool is low
 */

import { setEnv } from '../utils/db.js';

// Configuration
const CONFIG = {
  DELETE_THRESHOLD: 45,      // Delete cookie after this many uses
  MIN_POOL_SIZE: 10,         // Trigger replenish when below this
  REPLENISH_COUNT: 50,       // Number of cookies to generate when replenishing
  BROWSER_ID_PREFIX: 'BRWS-',
  BROWSER_ID_LENGTH: 32,     // Length of random part
};

/**
 * Generate a random browser ID string
 * Format: BRWS-<32 random alphanumeric chars>
 * @returns {string} Browser ID like "BRWS-7xztynvfo9691j0o3becos2637x9545htr"
 */
export function generateBrowserId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let randomPart = '';
  for (let i = 0; i < CONFIG.BROWSER_ID_LENGTH; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${CONFIG.BROWSER_ID_PREFIX}${randomPart}`;
}

/**
 * Get an available cookie from the pool
 * Selects a cookie with usage_count < DELETE_THRESHOLD and is_active = true
 * @returns {Promise<{id: string, browser_id: string, usage_count: number} | null>}
 */
export async function getAvailableCookie() {
  const { find } = await import('../utils/db.js');
  const { getSetting } = await import('./settings.js');
  
  // Get all active cookies
  const allCookies = await find('browser_cookies', {
    is_active: true,
  }, {
    sort: { usage_count: 1 }, // Get least used first
  });
  
  // Get threshold from settings
  let deleteThreshold = CONFIG.DELETE_THRESHOLD;
  let minPoolSize = CONFIG.MIN_POOL_SIZE;
  try {
    deleteThreshold = parseInt(await getSetting('cookie_delete_threshold', CONFIG.DELETE_THRESHOLD.toString())) || CONFIG.DELETE_THRESHOLD;
    minPoolSize = parseInt(await getSetting('cookie_min_threshold', CONFIG.MIN_POOL_SIZE.toString())) || CONFIG.MIN_POOL_SIZE;
  } catch (err) {
    // Use defaults if settings fail
  }
  
  // Filter cookies under threshold
  const available = allCookies.filter(c => (c.usage_count || 0) < deleteThreshold);
  
  // Proactively trigger auto-generation if pool is getting low (but not empty)
  if (available.length > 0 && available.length < minPoolSize) {
    console.log(`[CookieService] ⚠️ Pool getting low (${available.length} < ${minPoolSize}), triggering proactive auto-generation...`);
    // Trigger asynchronously so it doesn't block the request
    checkAndReplenishPool().catch(err => {
      console.error('[CookieService] Proactive replenish error:', err.message);
    });
  }
  
  if (available.length === 0) {
    console.log('[CookieService] No available cookies in pool, triggering emergency auto-generation...');
    // Emergency generation - trigger immediately
    checkAndReplenishPool().catch(err => {
      console.error('[CookieService] Emergency replenish error:', err.message);
    });
    return null;
  }
  
  // Return random one from available (to distribute load)
  const randomIndex = Math.floor(Math.random() * Math.min(available.length, 5));
  return available[randomIndex];
}

/**
 * Increment usage count for a cookie
 * If count reaches DELETE_THRESHOLD, delete the cookie
 * @param {string} cookieId - UUID of the cookie
 * @returns {Promise<{deleted: boolean, newCount: number}>}
 */
export async function incrementUsage(cookieId) {
  const { findOne, updateOne, deleteOne, find } = await import('../utils/db.js');
  const { getSetting } = await import('./settings.js');
  
  const cookie = await findOne('browser_cookies', { id: cookieId });
  if (!cookie) {
    return { deleted: false, newCount: 0 };
  }
  
  const newCount = (cookie.usage_count || 0) + 1;
  
  // Get threshold from settings
  let deleteThreshold = CONFIG.DELETE_THRESHOLD;
  let minPoolSize = CONFIG.MIN_POOL_SIZE;
  try {
    deleteThreshold = parseInt(await getSetting('cookie_delete_threshold', CONFIG.DELETE_THRESHOLD.toString())) || CONFIG.DELETE_THRESHOLD;
    minPoolSize = parseInt(await getSetting('cookie_min_threshold', CONFIG.MIN_POOL_SIZE.toString())) || CONFIG.MIN_POOL_SIZE;
  } catch (err) {
    // Use defaults if settings fail
  }
  
  // Check if should delete
  if (newCount >= deleteThreshold) {
    await deleteOne('browser_cookies', { id: cookieId });
    console.log(`[CookieService] Cookie ${cookieId} reached ${newCount} uses, deleted`);
    
    // Check if pool needs replenishing (async, don't wait)
    checkAndReplenishPool().catch(err => {
      console.error('[CookieService] Replenish error:', err.message);
    });
    
    return { deleted: true, newCount };
  }
  
  // Update count
  await updateOne('browser_cookies', { id: cookieId }, {
    usage_count: newCount,
  });
  
  // Check pool size after usage (if pool is getting low, trigger auto-generation)
  // Do this asynchronously so it doesn't slow down the request
  (async () => {
    try {
      const allCookies = await find('browser_cookies', { is_active: true });
      const availableCount = allCookies.filter(c => (c.usage_count || 0) < deleteThreshold).length;
      
      // If pool is below threshold, trigger auto-generation
      if (availableCount < minPoolSize) {
        console.log(`[CookieService] ⚠️ Pool low after usage (${availableCount} < ${minPoolSize}), triggering auto-generation...`);
        checkAndReplenishPool().catch(err => {
          console.error('[CookieService] Auto-replenish error:', err.message);
        });
      }
    } catch (err) {
      console.error('[CookieService] Pool check error:', err.message);
    }
  })();
  
  return { deleted: false, newCount };
}

/**
 * Check pool size and replenish if below minimum
 * @returns {Promise<{replenished: boolean, count: number}>}
 */
export async function checkAndReplenishPool() {
  try {
    const { find } = await import('../utils/db.js');
    
    // Get settings or use defaults (with error handling)
    let minPoolSize = CONFIG.MIN_POOL_SIZE;
    let replenishCount = CONFIG.REPLENISH_COUNT;
    let deleteThreshold = CONFIG.DELETE_THRESHOLD;
    
    try {
      const { getSetting } = await import('./settings.js');
      const minThreshold = await getSetting('cookie_min_threshold', CONFIG.MIN_POOL_SIZE.toString());
      const batchSize = await getSetting('cookie_gen_batch_size', CONFIG.REPLENISH_COUNT.toString());
      const deleteThresh = await getSetting('cookie_delete_threshold', CONFIG.DELETE_THRESHOLD.toString());
      
      minPoolSize = parseInt(minThreshold) || CONFIG.MIN_POOL_SIZE;
      replenishCount = parseInt(batchSize) || CONFIG.REPLENISH_COUNT;
      deleteThreshold = parseInt(deleteThresh) || CONFIG.DELETE_THRESHOLD;
    } catch (settingsError) {
      console.warn('[CookieService] Failed to load settings, using defaults:', settingsError.message);
    }
    
    // Get all cookies (both active and inactive to see total)
    const allCookies = await find('browser_cookies', {});
    const activeCookies = allCookies.filter(c => c.is_active === true);
    const availableCount = activeCookies.filter(c => (c.usage_count || 0) < deleteThreshold).length;
    
    console.log(`[CookieService] Pool check: ${availableCount} available / ${activeCookies.length} active / ${allCookies.length} total (threshold: ${minPoolSize})`);
    
    if (availableCount < minPoolSize) {
      console.log(`[CookieService] ⚠️ Pool low (${availableCount} < ${minPoolSize}), generating ${replenishCount} cookies...`);
      try {
        const result = await generateBatch(replenishCount);
        console.log(`[CookieService] ✅ Generated ${result.created} cookies (${result.errors} errors)`);
        return { replenished: true, count: result.created, errors: result.errors };
      } catch (genError) {
        console.error('[CookieService] ❌ Generation failed:', genError);
        throw genError;
      }
    }
    
    console.log(`[CookieService] ✅ Pool sufficient (${availableCount} >= ${minPoolSize}), no generation needed`);
    return { replenished: false, count: 0, availableCount, minPoolSize };
  } catch (error) {
    console.error('[CookieService] checkAndReplenishPool error:', error);
    throw error;
  }
}

/**
 * Generate a batch of new cookies
 * @param {number} count - Number of cookies to generate
 * @returns {Promise<{created: number, errors: number}>}
 */
export async function generateBatch(count = CONFIG.REPLENISH_COUNT) {
  try {
    const { insertOne, rpc } = await import('../utils/db.js');
    
    let created = 0;
    let errors = 0;
    const errorMessages = [];
    
    console.log(`[CookieService] Starting batch generation of ${count} cookies...`);
    
    // Generate in parallel batches of 10
    const BATCH_SIZE = 10;
    
    for (let i = 0; i < count; i += BATCH_SIZE) {
      const batchPromises = [];
      const batchSize = Math.min(BATCH_SIZE, count - i);
      
      console.log(`[CookieService] Batch ${Math.floor(i/BATCH_SIZE) + 1}: generating ${batchSize} cookies...`);
      
      for (let j = 0; j < batchSize; j++) {
        const browserId = generateBrowserId();
        
        batchPromises.push(
          (async () => {
            try {
              // Try using stored procedure first (more reliable)
              try {
                const result = await rpc('insert_browser_cookie', {
                  p_browser_id: browserId,
                  p_usage_count: 0,
                  p_is_active: true,
                });
                console.log(`[CookieService] ✓ Created: ${browserId} (via RPC)`);
                created++;
                return true;
              } catch (rpcError) {
                // Fallback to direct insert
                console.warn(`[CookieService] RPC failed for ${browserId}, trying direct insert:`, rpcError.message);
                const result = await insertOne('browser_cookies', {
                  browser_id: browserId,
                  usage_count: 0,
                  is_active: true,
                });
                console.log(`[CookieService] ✓ Created: ${browserId} (via direct insert, id: ${result?.id || 'unknown'})`);
                created++;
                return true;
              }
            } catch (err) {
              const errorMsg = `${browserId}: ${err.message}`;
              console.error(`[CookieService] ✗ Failed: ${errorMsg}`);
              errorMessages.push(errorMsg);
              errors++;
              return false;
            }
          })()
        );
      }
      
      await Promise.all(batchPromises);
    }
    
    console.log(`[CookieService] DONE: Generated ${created}/${count} cookies (${errors} errors)`);
    if (errors > 0 && errorMessages.length > 0) {
      console.error(`[CookieService] Error details:`, errorMessages.slice(0, 5));
    }
    
    return { created, errors, errorMessages: errorMessages.slice(0, 10) };
  } catch (error) {
    console.error('[CookieService] generateBatch fatal error:', error);
    throw error;
  }
}

/**
 * Get pool statistics
 * @returns {Promise<{total: number, available: number, nearLimit: number, exhausted: number}>}
 */
export async function getPoolStats() {
  const { find } = await import('../utils/db.js');
  
  const allCookies = await find('browser_cookies', {});
  
  const total = allCookies.length;
  const available = allCookies.filter(c => c.is_active && c.usage_count < CONFIG.DELETE_THRESHOLD).length;
  const nearLimit = allCookies.filter(c => c.usage_count >= 40 && c.usage_count < CONFIG.DELETE_THRESHOLD).length;
  const inactive = allCookies.filter(c => !c.is_active).length;
  
  return {
    total,
    available,
    nearLimit,
    inactive,
    config: {
      deleteThreshold: CONFIG.DELETE_THRESHOLD,
      minPoolSize: CONFIG.MIN_POOL_SIZE,
      replenishCount: CONFIG.REPLENISH_COUNT,
    },
  };
}

/**
 * Get all cookies for admin display
 * @returns {Promise<Array>}
 */
export async function getAllCookies() {
  const { find } = await import('../utils/db.js');
  return await find('browser_cookies', {}, {
    sort: { created_at: -1 },
  });
}

/**
 * Delete a specific cookie
 * @param {string} cookieId - UUID of cookie to delete
 */
export async function deleteCookie(cookieId) {
  const { deleteOne } = await import('../utils/db.js');
  await deleteOne('browser_cookies', { id: cookieId });
}

/**
 * Delete all exhausted/inactive cookies
 * Automatically called by cron job to keep pool clean
 * @returns {Promise<{deleted: number}>}
 */
export async function cleanupExhausted() {
  const { find, deleteOne } = await import('../utils/db.js');
  const { getSetting } = await import('./settings.js');
  
  // Get threshold from settings
  let deleteThreshold = CONFIG.DELETE_THRESHOLD;
  try {
    deleteThreshold = parseInt(await getSetting('cookie_delete_threshold', CONFIG.DELETE_THRESHOLD.toString())) || CONFIG.DELETE_THRESHOLD;
  } catch (err) {
    // Use default if settings fail
  }
  
  const allCookies = await find('browser_cookies', {});
  const toDelete = allCookies.filter(c => 
    !c.is_active || (c.usage_count || 0) >= deleteThreshold
  );
  
  console.log(`[CookieService] Cleanup: Found ${toDelete.length} exhausted/inactive cookies to delete`);
  
  let deleted = 0;
  let errors = 0;
  
  // Delete in batches to avoid overwhelming the database
  const BATCH_SIZE = 20;
  for (let i = 0; i < toDelete.length; i += BATCH_SIZE) {
    const batch = toDelete.slice(i, i + BATCH_SIZE);
    const deletePromises = batch.map(cookie =>
      deleteOne('browser_cookies', { id: cookie.id })
        .then(() => {
          deleted++;
          return true;
        })
        .catch(err => {
          console.error(`[CookieService] Failed to delete ${cookie.id}: ${err.message}`);
          errors++;
          return false;
        })
    );
    
    await Promise.all(deletePromises);
  }
  
  console.log(`[CookieService] Cleanup complete: Deleted ${deleted} cookies (${errors} errors)`);
  return { deleted, errors };
}

/**
 * Reset all usage counters (for testing/admin)
 * Uses bulk SQL update to avoid subrequest limits
 * @returns {Promise<{reset: number}>}
 */
export async function resetAllCounters() {
  const { rpc, find } = await import('../utils/db.js');
  
  try {
    // Use RPC to call a stored procedure for bulk update
    await rpc('reset_browser_cookies', {});
    
    // Get count after reset
    const allCookies = await find('browser_cookies', {});
    return { reset: allCookies.length };
  } catch (err) {
    console.error(`[CookieService] Bulk reset failed, trying fallback: ${err.message}`);
    
    // Fallback: Try direct SQL via RPC
    try {
      await rpc('execute_sql', {
        query: "UPDATE browser_cookies SET usage_count = 0, is_active = true"
      });
      const allCookies = await find('browser_cookies', {});
      return { reset: allCookies.length };
    } catch (err2) {
      console.error(`[CookieService] Fallback reset also failed: ${err2.message}`);
      return { reset: 0, error: err2.message };
    }
  }
}


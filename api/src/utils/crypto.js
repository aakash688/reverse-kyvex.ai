/**
 * Cryptographic utilities for key generation
 */

/**
 * Generate random string
 */
export function generateRandomString(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}

/**
 * Generate API key
 */
export function generateApiKey() {
  return `kyvex_${generateRandomString(32)}`;
}

/**
 * Generate browserId for kyvex cookie
 */
export function generateBrowserId() {
  return `BRWS-${generateRandomString(32)}`;
}

/**
 * Generate kyvex cookie string
 */
export function generateKyvexCookie() {
  return `browserId=${generateBrowserId()}`;
}

/**
 * Hash API key for storage (optional - we can store plain for now)
 */
export async function hashApiKey(key) {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}


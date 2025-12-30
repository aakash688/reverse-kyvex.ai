/**
 * Kyvex.ai proxy service
 */

const KYVEX_BASE_URL = 'https://kyvex.ai';

/**
 * Proxy request to kyvex.ai
 * Note: Cloudflare Workers don't natively support HTTP proxies in fetch
 * For now, we track proxy usage but make direct requests
 * Future: Can integrate with proxy gateway service for actual proxy support
 */
export async function proxyToKyvex(payload, kyvexCookie, proxy = null) {
  const url = `${KYVEX_BASE_URL}/api/v1/ai/stream`;

  // Note: Cloudflare Workers fetch API doesn't support proxy parameter
  // We track which proxy was selected but make direct request
  // For actual proxy support, would need:
  // 1. Proxy gateway service (e.g., ProxyMesh, Bright Data)
  // 2. Or use a different runtime that supports proxies
  // 3. Or implement HTTP tunnel for SOCKS proxies
  
  // For HTTP proxies, we could construct a proxy URL like:
  // http://proxy-host:proxy-port but fetch doesn't support this directly
  
  // For now, make direct request and track proxy selection
  // The proxy tracking will help when we add actual proxy support
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
      'User-Agent': 'Mozilla/5.0',
      'Origin': KYVEX_BASE_URL,
      'Referer': `${KYVEX_BASE_URL}/`,
      'Cookie': kyvexCookie,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Kyvex API error: ${response.status} - ${error}`);
  }

  return response;
}

/**
 * Get available models from kyvex.ai
 */
export async function getKyvexModels(kyvexCookie) {
  const url = `${KYVEX_BASE_URL}/api/v1/ai/list-models`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0',
      'Origin': KYVEX_BASE_URL,
      'Referer': `${KYVEX_BASE_URL}/`,
      'Cookie': kyvexCookie,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch models: ${response.status}`);
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Upload file to kyvex.ai
 */
export async function uploadFileToKyvex(file, checksum, kyvexCookie) {
  const url = `${KYVEX_BASE_URL}/api/v1/utils/file-upload`;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('checkSum', checksum);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Origin': KYVEX_BASE_URL,
      'Referer': `${KYVEX_BASE_URL}/`,
      'Cookie': kyvexCookie,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`File upload error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.data; // Returns file URL
}

/**
 * Extract thread ID from kyvex stream
 */
export function extractThreadId(text) {
  const match = text.match(/\[THREAD_ID:(.*?)\]/);
  return match ? match[1].trim() : null;
}

/**
 * Convert kyvex stream to OpenAI format
 * Note: This function is not currently used - streaming is handled in chat.js
 * Keeping for reference but commented out to avoid build errors
 */
// export async function* convertToOpenAIFormat(kyvexStream, model, conversationId) {
//   // Implementation removed - streaming handled directly in chat.js
// }


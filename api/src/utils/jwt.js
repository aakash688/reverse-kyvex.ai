
/**
 * JWT utilities for admin authentication
 */

// Import ENV from index.js (will be set per request)
let ENV = {};

export function setEnv(env) {
  ENV = env;
}

function getJwtSecret() {
  return ENV.JWT_SECRET || '';
}
  
  function base64UrlEncode(str) {
    return btoa(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
  
  function base64UrlDecode(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) {
      str += '=';
    }
    return atob(str);
  }
  
  async function hmacSha256(message, secret) {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
    return Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
  
  export async function generateToken(payload, expiresIn = '7d') {
    const header = {
      alg: 'HS256',
      typ: 'JWT',
    };
    const now = Math.floor(Date.now() / 1000);
    const exp = now + (expiresIn === '7d' ? 7 * 24 * 60 * 60 : 60 * 60);
    const jwtPayload = {
      ...payload,
      iat: now,
      exp,
    };
    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(jwtPayload));
    const message = `${encodedHeader}.${encodedPayload}`;
    const JWT_SECRET = getJwtSecret();
    const signature = await hmacSha256(message, JWT_SECRET);
    return `${message}.${signature}`;
  }
  
  export async function verifyToken(token) {
    try {
      const JWT_SECRET = getJwtSecret();
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }
      const [encodedHeader, encodedPayload, signature] = parts;
      const message = `${encodedHeader}.${encodedPayload}`;
      const expectedSignature = await hmacSha256(message, JWT_SECRET);
      if (signature !== expectedSignature) {
        throw new Error('Invalid signature');
      }
      const payload = JSON.parse(base64UrlDecode(encodedPayload));
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        throw new Error('Token expired');
      }
      return payload;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
  
  export function extractToken(authHeader) {
    if (!authHeader) return null;
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
    return parts[1];
  }
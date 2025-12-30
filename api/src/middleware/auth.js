
import { verifyToken, extractToken } from '../utils/jwt.js';
import { findOne } from '../utils/db.js';
import { findApiKeyByKey } from '../services/apiKey.js';

export async function verifyApiKey(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return { error: 'Missing Authorization header', status: 401 };
  }
  const apiKey = authHeader.replace('Bearer ', '').trim();
  if (!apiKey.startsWith('kyvex_')) {
    return { error: 'Invalid API key format', status: 401 };
  }
  const keyDoc = await findApiKeyByKey(apiKey);
  if (!keyDoc) {
    return { error: 'Invalid API key', status: 401 };
  }
  if (keyDoc.status !== 'active') {
    return { error: `API key is ${keyDoc.status}`, status: 403 };
  }
  return { apiKey: keyDoc };
}

export async function verifyAdmin(request) {
  const authHeader = request.headers.get('Authorization');
  const token = extractToken(authHeader);
  if (!token) {
    return { error: 'Missing authentication token', status: 401 };
  }
  try {
    const payload = await verifyToken(token);
    const admin = await findOne('admins', { id: payload.adminId });
    if (!admin || !admin.is_active) {
      return { error: 'Invalid or inactive admin account', status: 403 };
    }
    return { admin };
  } catch (error) {
    return { error: 'Invalid or expired token', status: 401 };
  }
}

export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function errorResponse(message, status = 400) {
  return jsonResponse({ error: message }, status);
}
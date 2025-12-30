/**
 * API client for admin panel
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://kyvex-api.proaiapirev1.workers.dev';

// Debug: Log API URL in development
if (import.meta.env.DEV) {
  console.log('API URL:', API_URL);
}

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const login = (email, password) => api.post('/api/admin/login', { email, password });
export const getCurrentAdmin = () => api.get('/api/admin/me');
export const forgotPassword = (email) => api.post('/api/admin/forgot-password', { email });
export const resetPassword = (token, password) => api.post('/api/admin/reset-password', { token, password });
export const getApiKeys = () => api.get('/api/admin/api-keys');
export const createApiKey = (data) => api.post('/api/admin/api-keys', data);
export const updateApiKey = (id, data) => api.put(`/api/admin/api-keys/${id}`, data);
export const deleteApiKey = (id) => api.delete(`/api/admin/api-keys/${id}`);
export const getAnalyticsOverview = () => api.get('/api/admin/analytics/overview');
export const getApiKeyAnalytics = (keyId) => api.get(`/api/admin/analytics/key/${keyId}`);
export const getModels = () => api.get('/api/admin/models');
export const getProviderModels = () => api.get('/api/admin/models/provider');
export const createModel = (data) => api.post('/api/admin/models', data);
export const updateModel = (id, data) => api.put(`/api/admin/models/${id}`, data);
export const deleteModel = (id) => api.delete(`/api/admin/models/${id}`);
export const clearThreads = (apiKeyId) => api.post('/api/admin/threads/clear', { apiKeyId: apiKeyId || null });
export const resetAnalytics = (apiKeyId) => api.post('/api/admin/analytics/reset', { apiKeyId: apiKeyId || null });

// Cookie Pool Management (Simple System)
export const getCookiePoolStats = () => api.get('/api/admin/cookies/stats');
export const getCookieList = () => api.get('/api/admin/cookies');
export const generateCookies = (count = 50) => api.post('/api/admin/cookies/generate', { count });
export const autoGenerateCookies = () => api.post('/api/admin/cookies/auto-generate', {});
export const resetCookieCounters = () => api.post('/api/admin/cookies/reset-counters', {});
export const deleteCookie = (cookieId) => api.delete(`/api/admin/cookies/${cookieId}`);
export const bulkCookieAction = (action, cookieIds) => api.post('/api/admin/cookies/bulk', { action, cookieIds });

// Legacy routes for compatibility
export const getProxyList = () => api.get('/api/admin/proxies');

export default api;


import React, { useState, useEffect } from 'react';
import { getCookiePoolStats } from '../services/api';

function SystemHealth() {
  const [cookieStats, setCookieStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadHealth();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(loadHealth, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const loadHealth = async () => {
    try {
      const cookieRes = await getCookiePoolStats();
      setCookieStats(cookieRes.data);
      setError('');
    } catch (err) {
      console.error('System health load error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load system health');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !cookieStats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const healthStatus = (cookieStats?.available || 0) < 5 ? 'critical' :
                       (cookieStats?.available || 0) < 10 ? 'warning' : 'healthy';

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">🏥 System Health</h1>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Auto-refresh (10s)</span>
        </label>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Overall Status */}
      <div className={`bg-white rounded-lg shadow p-6 mb-6 border-l-4 ${
        healthStatus === 'healthy' ? 'border-green-500' :
        healthStatus === 'warning' ? 'border-yellow-500' : 'border-red-500'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">System Status</h2>
            <p className={`text-lg capitalize font-semibold ${
              healthStatus === 'healthy' ? 'text-green-600' :
              healthStatus === 'warning' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {healthStatus}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Last updated: {new Date().toLocaleString()}
            </p>
          </div>
          <div className="text-6xl">
            {healthStatus === 'healthy' ? '✅' : healthStatus === 'warning' ? '⚠️' : '🚨'}
          </div>
        </div>
      </div>

      {/* Cookie Pool Health */}
      {cookieStats && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">🍪 Cookie Pool Health</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Total Cookies</h3>
              <p className="text-3xl font-bold">{cookieStats.total || 0}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Available</h3>
              <p className="text-3xl font-bold text-green-600">{cookieStats.available || 0}</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Near Limit</h3>
              <p className="text-3xl font-bold text-orange-500">{cookieStats.nearLimit || 0}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Daily Capacity</h3>
              <p className="text-3xl font-bold text-blue-600">
                ~{(cookieStats.available || 0) * 45}
              </p>
              <p className="text-xs text-gray-500">requests/day</p>
            </div>
          </div>

          {/* Configuration Info */}
          {cookieStats.config && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-lg font-medium mb-3">Configuration</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Delete Threshold:</span>
                  <p className="font-semibold">{cookieStats.config.deleteThreshold} requests</p>
                </div>
                <div>
                  <span className="text-gray-600">Min Pool Size:</span>
                  <p className="font-semibold">{cookieStats.config.minPoolSize} cookies</p>
                </div>
                <div>
                  <span className="text-gray-600">Replenish Count:</span>
                  <p className="font-semibold">{cookieStats.config.replenishCount} cookies</p>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <p className={`font-semibold ${
                    (cookieStats.available || 0) >= cookieStats.config.minPoolSize 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {(cookieStats.available || 0) >= cookieStats.config.minPoolSize 
                      ? '✅ Pool OK' 
                      : '⚠️ Pool Low'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SystemHealth;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAnalyticsOverview, clearThreads, resetAnalytics, getCookiePoolStats } from '../services/api';

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [cookieStats, setCookieStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const loadStats = async () => {
    try {
      const [statsRes, cookieRes] = await Promise.all([
        getAnalyticsOverview().catch(() => ({ data: {} })),
        getCookiePoolStats().catch(() => ({ data: { total: 0, available: 0 } })),
      ]);
      setStats(statsRes.data);
      setCookieStats(cookieRes.data);
      setError('');
    } catch (err) {
      console.error('Dashboard load error:', err);
      setError(err.message || 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  const handleClearThreads = async () => {
    if (!confirm('Clear all threads? This cannot be undone.')) return;
    try {
      setActionLoading('clearing');
      await clearThreads();
      alert('Threads cleared successfully');
      loadStats();
    } catch (err) {
      alert('Failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading('');
    }
  };

  const handleResetAnalytics = async () => {
    if (!confirm('Reset all analytics? This cannot be undone.')) return;
    try {
      setActionLoading('resetting');
      await resetAnalytics();
      alert('Analytics reset successfully');
      loadStats();
    } catch (err) {
      alert('Failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading('');
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const cookieHealth = (cookieStats?.available || 0) < 5 ? 'critical' :
                       (cookieStats?.available || 0) < 10 ? 'warning' : 'healthy';

  const modelStats = stats?.modelStats || [];
  const maxRequests = modelStats.length > 0 ? Math.max(...modelStats.map(m => m.requests)) : 1;

  return (
    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">📊 Dashboard</h1>
          <p className="text-gray-600">Real-time analytics and insights</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm bg-white px-3 py-2 rounded-lg shadow-sm">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span>Auto-refresh</span>
          </label>
          <button
            onClick={handleClearThreads}
            disabled={actionLoading === 'clearing'}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-medium shadow-sm disabled:opacity-50"
          >
            {actionLoading === 'clearing' ? '⏳' : '🗑️'} Clear Threads
          </button>
          <button
            onClick={handleResetAnalytics}
            disabled={actionLoading === 'resetting'}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-medium shadow-sm disabled:opacity-50"
          >
            {actionLoading === 'resetting' ? '⏳' : '🔄'} Reset Analytics
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white transform hover:scale-105 transition-transform">
          <h3 className="text-sm font-medium opacity-90 mb-2">Total API Keys</h3>
          <p className="text-4xl font-bold">{stats?.apiKeys?.total || 0}</p>
          <p className="text-xs opacity-75 mt-1">{stats?.apiKeys?.active || 0} active</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white transform hover:scale-105 transition-transform">
          <h3 className="text-sm font-medium opacity-90 mb-2">Total Requests</h3>
          <p className="text-4xl font-bold">{stats?.totalRequests?.toLocaleString() || 0}</p>
          <p className="text-xs opacity-75 mt-1">{stats?.todayRequests || 0} today</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white transform hover:scale-105 transition-transform">
          <h3 className="text-sm font-medium opacity-90 mb-2">Total Threads</h3>
          <p className="text-4xl font-bold">{stats?.totalThreads?.toLocaleString() || 0}</p>
          <p className="text-xs opacity-75 mt-1">Conversations</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-xl shadow-lg text-white transform hover:scale-105 transition-transform">
          <h3 className="text-sm font-medium opacity-90 mb-2">Total Tokens</h3>
          <p className="text-4xl font-bold">{stats?.totalTokens ? (stats.totalTokens / 1000).toFixed(1) + 'K' : '0'}</p>
          <p className="text-xs opacity-75 mt-1">Estimated</p>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-xl shadow-lg text-white transform hover:scale-105 transition-transform">
          <h3 className="text-sm font-medium opacity-90 mb-2">Top Model</h3>
          <p className="text-2xl font-bold truncate">{stats?.topModel || 'N/A'}</p>
          <p className="text-xs opacity-75 mt-1">
            {modelStats.length > 0 ? `${modelStats[0]?.requests || 0} requests` : 'No data'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Model Usage Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">🤖 Model Usage</h2>
            <span className="text-sm text-gray-500">{modelStats.length} models</span>
          </div>
          {modelStats.length > 0 ? (
            <div className="space-y-4">
              {modelStats.slice(0, 8).map((model, index) => (
                <div key={model.model} className="relative">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700 truncate flex-1">{model.model}</span>
                    <div className="flex items-center gap-3 ml-2">
                      <span className="text-xs text-gray-500">{model.percentage}%</span>
                      <span className="text-sm font-bold text-gray-900">{model.requests.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-3 rounded-full transition-all duration-500"
                      style={{
                        width: `${(model.requests / maxRequests) * 100}%`,
                        background: `linear-gradient(90deg, ${
                          index === 0 ? '#3b82f6' :
                          index === 1 ? '#10b981' :
                          index === 2 ? '#f59e0b' :
                          '#8b5cf6'
                        }, ${
                          index === 0 ? '#2563eb' :
                          index === 1 ? '#059669' :
                          index === 2 ? '#d97706' :
                          '#7c3aed'
                        })`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>~{(model.tokens / 1000).toFixed(1)}K tokens</span>
                    <span>{model.requests} calls</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-2">📊</p>
              <p>No model usage data yet</p>
              <p className="text-sm mt-1">Start making requests to see analytics</p>
            </div>
          )}
        </div>

        {/* Cookie Pool Widget */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">🍪 Cookie Pool</h2>
            <button
              onClick={() => navigate('/cookie-pool')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow-sm"
            >
              Manage →
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Total Cookies</h3>
              <p className="text-3xl font-bold text-gray-900">{cookieStats?.total || 0}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Available</h3>
              <p className="text-3xl font-bold text-green-600">{cookieStats?.available || 0}</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Near Limit</h3>
              <p className="text-3xl font-bold text-orange-500">{cookieStats?.nearLimit || 0}</p>
            </div>
            <div className={`p-4 rounded-lg ${
              cookieHealth === 'healthy' ? 'bg-gradient-to-br from-green-50 to-green-100' :
              cookieHealth === 'warning' ? 'bg-gradient-to-br from-yellow-50 to-yellow-100' :
              'bg-gradient-to-br from-red-50 to-red-100'
            }`}>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Health</h3>
              <p className={`text-2xl font-bold capitalize ${
                cookieHealth === 'healthy' ? 'text-green-600' : 
                cookieHealth === 'warning' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {cookieHealth === 'healthy' ? '✅' : cookieHealth === 'warning' ? '⚠️' : '🚨'} {cookieHealth}
              </p>
            </div>
          </div>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Capacity:</span> ~{(cookieStats?.available || 0) * 45} requests/day
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Each cookie handles up to 45 requests before auto-rotation
            </p>
          </div>
        </div>
      </div>

      {/* Top Performing Models Table */}
      {modelStats.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">🏆 Top Performing Models</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requests</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage %</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tokens (Est.)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {modelStats.map((model, index) => (
                  <tr key={model.model} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        index === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{model.model}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900 font-semibold">{model.requests.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${model.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{model.percentage}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">~{(model.tokens / 1000).toFixed(1)}K</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;

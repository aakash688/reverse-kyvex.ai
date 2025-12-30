import React, { useState, useEffect } from 'react';
import {
  getCookiePoolStats,
  getCookieList,
  generateCookies,
  resetCookieCounters,
  deleteCookie,
  bulkCookieAction,
  autoGenerateCookies,
} from '../services/api';

function CookiePoolDashboard() {
  const [stats, setStats] = useState(null);
  const [cookies, setCookies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateCount, setGenerateCount] = useState(50);
  const [actionLoading, setActionLoading] = useState('');
  const [sortBy, setSortBy] = useState('usage_count'); // 'usage_count', 'created_at', 'browser_id'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  const [selectedCookies, setSelectedCookies] = useState(new Set());
  const [showTestModal, setShowTestModal] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const loadData = async () => {
    try {
      setError('');
      const [statsRes, cookiesRes] = await Promise.all([
        getCookiePoolStats(),
        getCookieList(),
      ]);
      
      setStats(statsRes.data);
      setCookies(cookiesRes.data?.cookies || []);
    } catch (err) {
      console.error('[CookiePool] Load error:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to load data';
      setError(errorMsg);
      setStats({ total: 0, available: 0, nearLimit: 0, inactive: 0 });
      setCookies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(loadData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  const handleGenerateCookies = async () => {
    if (!generateCount || generateCount < 1) {
      alert('Please enter a valid number');
      return;
    }
    
    try {
      setActionLoading('generating');
      setError('');
      const response = await generateCookies(generateCount);
      
      const created = response.data?.created || 0;
      const errors = response.data?.errors || 0;
      
      alert(`Successfully generated ${created} cookies${errors > 0 ? ` (${errors} errors)` : ''}`);
      await loadData();
      setShowGenerateModal(false);
      setGenerateCount(50);
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      alert('Failed to generate cookies: ' + errorMsg);
    } finally {
      setActionLoading('');
    }
  };

  const handleResetCounters = async () => {
    if (!confirm('Reset all cookie usage counters to 0?')) return;
    try {
      setActionLoading('resetting');
      await resetCookieCounters();
      await loadData();
      alert('Cookie counters reset successfully');
    } catch (err) {
      alert('Failed to reset counters: ' + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading('');
    }
  };

  const handleDeleteCookie = async (cookieId) => {
    if (!confirm('Delete this cookie?')) return;
    try {
      await deleteCookie(cookieId);
      await loadData();
    } catch (err) {
      alert('Failed to delete cookie: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleBulkAction = async (action, cookieIds) => {
    if (cookieIds.length === 0) {
      alert('No cookies to process');
      return;
    }
    
    if (!confirm(`${action} ${cookieIds.length} cookie(s)?`)) return;
    
    try {
      setActionLoading('bulk');
      await bulkCookieAction(action, cookieIds);
      setSelectedCookies(new Set());
      await loadData();
    } catch (err) {
      alert('Bulk action failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading('');
    }
  };

  const toggleCookieSelection = (cookieId) => {
    const newSelected = new Set(selectedCookies);
    if (newSelected.has(cookieId)) {
      newSelected.delete(cookieId);
    } else {
      newSelected.add(cookieId);
    }
    setSelectedCookies(newSelected);
  };

  const selectAllCookies = () => {
    setSelectedCookies(new Set(sortedCookies.map(c => c.id)));
  };

  const deselectAllCookies = () => {
    setSelectedCookies(new Set());
  };

  const handleDeleteSelected = async () => {
    if (selectedCookies.size === 0) {
      alert('No cookies selected');
      return;
    }
    
    if (!confirm(`Delete ${selectedCookies.size} selected cookie(s)?`)) return;
    
    try {
      setActionLoading('deleting');
      const cookieIds = Array.from(selectedCookies);
      for (const cookieId of cookieIds) {
        await deleteCookie(cookieId);
      }
      setSelectedCookies(new Set());
      await loadData();
      alert(`Successfully deleted ${cookieIds.length} cookie(s)`);
    } catch (err) {
      alert('Failed to delete cookies: ' + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading('');
    }
  };

  const handleDeleteAll = async () => {
    if (sortedCookies.length === 0) {
      alert('No cookies to delete');
      return;
    }
    
    if (!confirm(`Delete ALL ${sortedCookies.length} cookies? This cannot be undone!`)) return;
    if (!confirm('Are you absolutely sure? This will delete every cookie in the pool!')) return;
    
    try {
      setActionLoading('deleting-all');
      const cookieIds = sortedCookies.map(c => c.id);
      for (const cookieId of cookieIds) {
        await deleteCookie(cookieId);
      }
      setSelectedCookies(new Set());
      await loadData();
      alert(`Successfully deleted all ${cookieIds.length} cookies`);
    } catch (err) {
      alert('Failed to delete all cookies: ' + (err.response?.data?.error || err.message));
    } finally {
      setActionLoading('');
    }
  };

  const handleTestAutoGeneration = async () => {
    setShowTestModal(true);
    setTestResult(null);
    
    try {
      // Get initial count
      const initialStats = await getCookiePoolStats();
      const initialCount = initialStats.data?.total || 0;
      const availableCount = initialStats.data?.available || 0;
      const threshold = initialStats.data?.config?.minPoolSize || 10;
      
      // If pool is already below threshold, trigger auto-generation directly
      let triggeredManually = false;
      if (availableCount >= threshold) {
        // Delete cookies until below threshold
        const cookiesRes = await getCookieList();
        const allCookies = cookiesRes.data?.cookies || [];
        const toDelete = allCookies.slice(0, Math.min(5, allCookies.length - threshold + 1));
        
        for (const cookie of toDelete) {
          await deleteCookie(cookie.id);
        }
        
        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Now trigger auto-generation explicitly
      setTestResult({
        success: true,
        initialCount,
        finalCount: initialCount,
        threshold,
        autoGenerated: false,
        message: 'Triggering auto-generation...',
      });
      
      try {
        const autoGenResponse = await autoGenerateCookies();
        const autoGenResult = autoGenResponse.data;
        
        // Wait a moment for generation to complete
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check final count
        const finalStats = await getCookiePoolStats();
        const finalCount = finalStats.data?.total || 0;
        const finalAvailable = finalStats.data?.available || 0;
        
        const wasReplenished = autoGenResult?.replenished || false;
        const generatedCount = autoGenResult?.count || 0;
        const genErrors = autoGenResult?.errors || 0;
        const responseMessage = autoGenResult?.message || '';
        
        setTestResult({
          success: true,
          initialCount,
          finalCount,
          threshold,
          availableCount: autoGenResult?.availableCount || availableCount,
          finalAvailable,
          generatedCount,
          genErrors,
          autoGenerated: wasReplenished && generatedCount > 0,
          message: wasReplenished && generatedCount > 0
            ? `✅ Auto-generation working! Generated ${generatedCount} cookies${genErrors > 0 ? ` (${genErrors} errors)` : ''}. Pool: ${initialCount} → ${finalCount} (${availableCount} → ${finalAvailable} available)`
            : wasReplenished && generatedCount === 0
            ? `⚠️ Auto-generation triggered but no cookies generated${genErrors > 0 ? ` (${genErrors} errors)` : ''}. ${responseMessage}`
            : `ℹ️ ${responseMessage || `Pool has ${autoGenResult?.availableCount || availableCount} available cookies (threshold: ${threshold}). No generation needed.`}`,
        });
      } catch (autoGenErr) {
        setTestResult({
          success: false,
          initialCount,
          finalCount: initialCount,
          threshold,
          message: 'Auto-generation endpoint failed: ' + (autoGenErr.response?.data?.error || autoGenErr.message),
        });
      }
      
      await loadData();
    } catch (err) {
      setTestResult({
        success: false,
        message: 'Test failed: ' + (err.response?.data?.error || err.message),
      });
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const DELETE_THRESHOLD = stats?.config?.deleteThreshold || 45;
  const available = cookies.filter(c => c.is_active && c.usage_count < DELETE_THRESHOLD);
  const nearLimit = cookies.filter(c => c.usage_count >= 40 && c.usage_count < DELETE_THRESHOLD);
  const inactive = cookies.filter(c => !c.is_active);

  const healthStatus = available.length < 5 ? 'critical' :
                       available.length < 10 ? 'warning' : 'healthy';

  // Sort cookies
  const sortedCookies = [...cookies].sort((a, b) => {
    let aVal, bVal;
    
    switch (sortBy) {
      case 'usage_count':
        aVal = a.usage_count || 0;
        bVal = b.usage_count || 0;
        break;
      case 'created_at':
        aVal = new Date(a.created_at || 0).getTime();
        bVal = new Date(b.created_at || 0).getTime();
        break;
      case 'browser_id':
        aVal = (a.browser_id || '').toLowerCase();
        bVal = (b.browser_id || '').toLowerCase();
        break;
      default:
        return 0;
    }
    
    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    } else {
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
    }
  });

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-900">🍪 Cookie Pool</h1>
        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={() => setShowGenerateModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            disabled={actionLoading === 'generating'}
          >
            {actionLoading === 'generating' ? '⏳ Generating...' : '➕ Generate Cookies'}
          </button>
          <button
            onClick={handleResetCounters}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium"
            disabled={actionLoading === 'resetting'}
          >
            {actionLoading === 'resetting' ? '⏳ Resetting...' : '🔄 Reset All Counters'}
          </button>
          <button
            onClick={handleTestAutoGeneration}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-medium"
            disabled={actionLoading === 'testing'}
          >
            {actionLoading === 'testing' ? '⏳ Testing...' : '🧪 Test Auto-Generation'}
          </button>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh
            {autoRefresh && (
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="px-2 py-1 border rounded text-sm"
              >
                <option value={5000}>5s</option>
                <option value={10000}>10s</option>
                <option value={30000}>30s</option>
              </select>
            )}
          </label>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-600 text-sm font-medium">Total Cookies</h3>
          <p className="text-3xl font-bold text-gray-900">{cookies.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-600 text-sm font-medium">Available</h3>
          <p className="text-3xl font-bold text-green-600">{available.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-600 text-sm font-medium">Near Limit (40+)</h3>
          <p className="text-3xl font-bold text-orange-500">{nearLimit.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-600 text-sm font-medium">Health</h3>
          <p className={`text-2xl font-bold capitalize ${
            healthStatus === 'healthy' ? 'text-green-600' :
            healthStatus === 'warning' ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {healthStatus === 'healthy' ? '✅' : healthStatus === 'warning' ? '⚠️' : '🚨'} {healthStatus}
          </p>
        </div>
      </div>

      {/* Cookie Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-4 border-b bg-gradient-to-r from-gray-50 to-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">All Cookies</h2>
            <p className="text-sm text-gray-500 mt-1">
              Showing {sortedCookies.length} cookie{sortedCookies.length !== 1 ? 's' : ''} • 
              {selectedCookies.size > 0 && (
                <span className="text-blue-600 font-medium ml-1">
                  {selectedCookies.size} selected
                </span>
              )}
              {' • '}Sorted by {sortBy.replace('_', ' ')} ({sortOrder === 'asc' ? 'Ascending' : 'Descending'})
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={`${sortBy}_${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('_');
                setSortBy(field);
                setSortOrder(order);
              }}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="usage_count_desc">Usage: High to Low</option>
              <option value="usage_count_asc">Usage: Low to High</option>
              <option value="created_at_desc">Created: Newest</option>
              <option value="created_at_asc">Created: Oldest</option>
              <option value="browser_id_asc">Browser ID: A-Z</option>
              <option value="browser_id_desc">Browser ID: Z-A</option>
            </select>
            {selectedCookies.size > 0 && (
              <>
                <button
                  onClick={handleDeleteSelected}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                  disabled={actionLoading === 'deleting'}
                >
                  🗑️ Delete Selected ({selectedCookies.size})
                </button>
                <button
                  onClick={deselectAllCookies}
                  className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                >
                  ✖️ Deselect All
                </button>
              </>
            )}
            <button
              onClick={handleDeleteAll}
              className="px-3 py-1 text-sm bg-red-700 text-white rounded-lg hover:bg-red-800 font-medium"
              disabled={actionLoading === 'deleting-all' || sortedCookies.length === 0}
            >
              {actionLoading === 'deleting-all' ? '⏳' : '🗑️'} Delete All
            </button>
            <button
              onClick={() => handleBulkAction('delete', cookies.filter(c => c.usage_count >= DELETE_THRESHOLD).map(c => c.id))}
              className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 font-medium"
              disabled={actionLoading === 'bulk'}
            >
              🗑️ Delete Exhausted
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12">
                  <input
                    type="checkbox"
                    checked={sortedCookies.length > 0 && selectedCookies.size === sortedCookies.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        selectAllCookies();
                      } else {
                        deselectAllCookies();
                      }
                    }}
                    className="rounded cursor-pointer"
                  />
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-200 transition-colors"
                  onClick={() => handleSort('browser_id')}
                >
                  <div className="flex items-center gap-2">
                    Browser ID
                    {sortBy === 'browser_id' && (
                      <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-200 transition-colors"
                  onClick={() => handleSort('usage_count')}
                >
                  <div className="flex items-center gap-2">
                    Usage
                    {sortBy === 'usage_count' && (
                      <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-200 transition-colors"
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center gap-2">
                    Created
                    {sortBy === 'created_at' && (
                      <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedCookies.map((cookie) => {
                const usagePercent = (cookie.usage_count / DELETE_THRESHOLD) * 100;
                const isNearLimit = cookie.usage_count >= 40;
                const isExhausted = cookie.usage_count >= DELETE_THRESHOLD || !cookie.is_active;
                
                return (
                  <tr key={cookie.id} className={`${isExhausted ? 'bg-red-50' : isNearLimit ? 'bg-yellow-50' : ''} ${selectedCookies.has(cookie.id) ? 'bg-blue-50' : ''}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedCookies.has(cookie.id)}
                        onChange={() => toggleCookieSelection(cookie.id)}
                        className="rounded cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                        {cookie.browser_id || `cookie_${cookie.id.substring(0, 8)}`}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 w-24">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              usagePercent < 60 ? 'bg-green-500' :
                              usagePercent < 80 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(usagePercent, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 font-medium w-12">
                          {cookie.usage_count}/{DELETE_THRESHOLD}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {isExhausted ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                          ❌ Exhausted
                        </span>
                      ) : isNearLimit ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
                          ⚠️ Near Limit
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                          ✅ Available
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {cookie.created_at ? new Date(cookie.created_at).toLocaleString() : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDeleteCookie(cookie.id)}
                        className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {sortedCookies.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-4xl mb-4">🍪</p>
            <p className="text-lg">No cookies in the pool</p>
            <p className="text-sm mt-2">Click "Generate Cookies" to add some</p>
          </div>
        )}
      </div>

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">🍪 Generate New Cookies</h3>
            <p className="text-gray-600 text-sm mb-4">
              Cookies are auto-generated browser IDs that get rotated automatically.
              Each cookie can handle up to {DELETE_THRESHOLD} requests before being deleted.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of cookies
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={generateCount}
                onChange={(e) => setGenerateCount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateCookies}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                disabled={actionLoading === 'generating'}
              >
                {actionLoading === 'generating' ? '⏳ Generating...' : 'Generate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test Auto-Generation Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">🧪 Test Auto-Generation</h3>
            {!testResult ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Testing auto-generation...</p>
                <p className="text-sm text-gray-500 mt-2">This may take a few seconds</p>
              </div>
            ) : (
              <div>
                <div className={`p-4 rounded-lg mb-4 ${
                  testResult.success && testResult.autoGenerated 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-yellow-50 border border-yellow-200'
                }`}>
                  <p className={`font-medium ${
                    testResult.success && testResult.autoGenerated 
                      ? 'text-green-800' 
                      : 'text-yellow-800'
                  }`}>
                    {testResult.message}
                  </p>
                  {testResult.success && (
                    <div className="mt-3 text-sm text-gray-700 space-y-1">
                      <p><strong>Initial Count:</strong> {testResult.initialCount} cookies ({testResult.availableCount || 0} available)</p>
                      <p><strong>Final Count:</strong> {testResult.finalCount} cookies ({testResult.finalAvailable || 0} available)</p>
                      <p><strong>Threshold:</strong> {testResult.threshold} cookies</p>
                      {testResult.generatedCount !== undefined && (
                        <p><strong>Generated:</strong> {testResult.generatedCount} cookies</p>
                      )}
                      <p><strong>Auto-Generated:</strong> {testResult.autoGenerated ? '✅ Yes' : '❌ No'}</p>
                    </div>
                  )}
                </div>
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>How it works:</strong> Auto-generation triggers when the cookie pool drops below the minimum threshold ({testResult.threshold || 10} cookies). 
                    The system will automatically generate a new batch to replenish the pool.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowTestModal(false);
                    setTestResult(null);
                  }}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CookiePoolDashboard;

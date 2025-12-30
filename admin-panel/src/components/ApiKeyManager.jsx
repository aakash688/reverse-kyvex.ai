import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiKeys, createApiKey, updateApiKey, deleteApiKey, getCookiePoolStats } from '../services/api';

function ApiKeyManager() {
  const navigate = useNavigate();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKey, setNewKey] = useState(null);
  const [editingCookie, setEditingCookie] = useState(null);
  const [cookieValue, setCookieValue] = useState('');
  const [cookieStats, setCookieStats] = useState(null);

  useEffect(() => {
    loadKeys();
    loadCookieStats();
  }, []);

  const loadKeys = async () => {
    try {
      const response = await getApiKeys();
      setKeys(response.data.keys || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const loadCookieStats = async () => {
    try {
      const response = await getCookiePoolStats();
      setCookieStats(response.data);
    } catch (err) {
      // Ignore errors for cookie stats
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const response = await createApiKey({ name: newKeyName });
      setNewKey(response.data.key);
      setNewKeyName('');
      setShowCreate(false);
      loadKeys();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create API key');
    }
  };

  const handleUpdate = async (id, updates) => {
    try {
      await updateApiKey(id, updates);
      loadKeys();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update API key');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this API key?')) return;
    try {
      await deleteApiKey(id);
      loadKeys();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete API key');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const badges = {
      active: <span className="badge badge-success">Active</span>,
      paused: <span className="badge badge-warning">Paused</span>,
      revoked: <span className="badge badge-danger">Revoked</span>,
    };
    return badges[status] || <span className="badge badge-info">{status}</span>;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">API Keys</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="btn btn-primary"
        >
          Create API Key
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-blue-800">Unlimited Conversations</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>API-level rate limiting has been removed. Unlimited conversations are supported through automatic cookie rotation.</p>
              {cookieStats && (
                <p className="mt-1">
                  Cookie Pool: <strong>{cookieStats.available || 0} available</strong> cookies providing{' '}
                  <strong>{(cookieStats.available || 0) * 50} requests/day</strong> capacity.
                </p>
              )}
              <button
                onClick={() => navigate('/cookie-pool')}
                className="mt-2 text-blue-800 underline hover:text-blue-900"
              >
                Manage Cookie Pool →
              </button>
            </div>
          </div>
        </div>
      </div>

      {newKey && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-800 mb-2">New API Key Created!</h3>
              <code className="block bg-white p-3 rounded border border-green-200 text-sm font-mono break-all mb-2">
                {newKey}
              </code>
              <p className="text-sm text-green-700">Save this key securely. You won't be able to see it again.</p>
            </div>
            <button
              onClick={() => setNewKey(null)}
              className="btn btn-success ml-4"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {showCreate && (
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">Create New API Key</h2>
          <form onSubmit={handleCreate}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key Name
              </label>
              <input
                type="text"
                placeholder="e.g., Production Key, Development Key"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary">
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreate(false);
                  setNewKeyName('');
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {keys.map((key) => (
          <div key={key.id} className="card">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold">{key.name}</h3>
                  {getStatusBadge(key.status)}
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Created: {new Date(key.createdAt).toLocaleDateString()}</p>
                  {key.lastUsed && (
                    <p>Last Used: {new Date(key.lastUsed).toLocaleString()}</p>
                  )}
                  <p>
                    Kyvex Cookie:{' '}
                    {key.kyvexCookie ? (
                      <span className="text-green-600 font-medium">✓ Set</span>
                    ) : (
                      <span className="text-yellow-600 font-medium">⚠ Not set</span>
                    )}
                  </p>
                </div>

                {editingCookie === key.id ? (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kyvex Cookie:
                    </label>
                    <textarea
                      value={cookieValue}
                      onChange={(e) => setCookieValue(e.target.value)}
                      placeholder="browserId=BRWS-... or full cookie string"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm min-h-[80px]"
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      Paste the cookie from kyvex.ai (get it from browser DevTools → Application → Cookies)
                    </p>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={async () => {
                          try {
                            await handleUpdate(key.id, { kyvexCookie: cookieValue });
                            setEditingCookie(null);
                            setCookieValue('');
                          } catch (err) {
                            alert('Failed to update cookie: ' + (err.response?.data?.error || err.message));
                          }
                        }}
                        className="btn btn-success"
                      >
                        Save Cookie
                      </button>
                      <button
                        onClick={() => {
                          setEditingCookie(null);
                          setCookieValue('');
                        }}
                        className="btn btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingCookie(key.id);
                      setCookieValue(key.kyvexCookie || '');
                    }}
                    className="mt-3 btn btn-secondary text-sm"
                  >
                    {key.kyvexCookie ? 'Update' : 'Set'} Kyvex Cookie
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-2 ml-4">
                <button
                  onClick={() => handleUpdate(key.id, { status: key.status === 'active' ? 'paused' : 'active' })}
                  className={`btn text-sm ${
                    key.status === 'active' ? 'btn-warning' : 'btn-success'
                  }`}
                >
                  {key.status === 'active' ? 'Pause' : 'Activate'}
                </button>
                <button
                  onClick={() => handleUpdate(key.id, { status: 'revoked' })}
                  className="btn btn-danger text-sm"
                >
                  Revoke
                </button>
                <button
                  onClick={() => handleDelete(key.id)}
                  className="btn btn-danger text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {keys.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-2">No API keys yet.</p>
            <p>Create one to get started with unlimited conversations.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ApiKeyManager;

import React, { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'https://kyvex-api.proaiapirev1.workers.dev';

function ApiDocs() {
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState({});
  const [apiKey, setApiKey] = useState('');

  const runTest = async (endpoint, method, body = null) => {
    const key = `${method}-${endpoint}`;
    setLoading(prev => ({ ...prev, [key]: true }));
    
    try {
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
      
      const data = await response.json();
      setTestResults(prev => ({
        ...prev,
        [key]: {
          status: response.status,
          statusText: response.statusText,
          data,
        }
      }));
    } catch (err) {
      setTestResults(prev => ({
        ...prev,
        [key]: {
          status: 'Error',
          error: err.message,
        }
      }));
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const endpoints = [
    {
      category: '🔐 Authentication',
      items: [
        {
          method: 'POST',
          endpoint: '/api/admin/login',
          description: 'Admin login to get JWT token',
          body: { email: 'admin@example.com', password: 'yourpassword' },
          requiresAuth: false,
        },
      ],
    },
    {
      category: '🤖 Chat Completions (OpenAI Compatible)',
      items: [
        {
          method: 'POST',
          endpoint: '/v1/chat/completions',
          description: 'Send chat completion request (OpenAI compatible)',
          body: {
            model: 'Sahyog',
            messages: [{ role: 'user', content: 'Hello!' }],
            stream: true,
          },
          requiresAuth: true,
          notes: 'Requires API key in Authorization header',
        },
        {
          method: 'GET',
          endpoint: '/v1/models',
          description: 'List available models',
          requiresAuth: true,
        },
      ],
    },
    {
      category: '🍪 Cookie Pool Management',
      items: [
        {
          method: 'GET',
          endpoint: '/api/admin/cookies/stats',
          description: 'Get cookie pool statistics',
          requiresAuth: true,
        },
        {
          method: 'GET',
          endpoint: '/api/admin/cookies',
          description: 'List all cookies in pool',
          requiresAuth: true,
        },
        {
          method: 'POST',
          endpoint: '/api/admin/cookies/generate',
          description: 'Generate new browser cookies',
          body: { count: 10 },
          requiresAuth: true,
        },
        {
          method: 'POST',
          endpoint: '/api/admin/cookies/reset-counters',
          description: 'Reset all cookie usage counters',
          requiresAuth: true,
        },
        {
          method: 'DELETE',
          endpoint: '/api/admin/cookies/{id}',
          description: 'Delete a specific cookie',
          requiresAuth: true,
        },
      ],
    },
    {
      category: '🔑 API Keys',
      items: [
        {
          method: 'GET',
          endpoint: '/api/admin/api-keys',
          description: 'List all API keys',
          requiresAuth: true,
        },
        {
          method: 'POST',
          endpoint: '/api/admin/api-keys',
          description: 'Create new API key',
          body: { name: 'My API Key', email: 'user@example.com' },
          requiresAuth: true,
        },
        {
          method: 'DELETE',
          endpoint: '/api/admin/api-keys/{id}',
          description: 'Delete an API key',
          requiresAuth: true,
        },
      ],
    },
    {
      category: '📊 Models',
      items: [
        {
          method: 'GET',
          endpoint: '/api/admin/models',
          description: 'List all configured models',
          requiresAuth: true,
        },
        {
          method: 'GET',
          endpoint: '/api/admin/models/provider',
          description: 'Get available provider models',
          requiresAuth: true,
        },
        {
          method: 'POST',
          endpoint: '/api/admin/models',
          description: 'Create new model mapping',
          body: {
            custom_name: 'MyModel',
            provider_name: 'gpt-4',
            brand_name: 'Sahyog',
            permissions: ['Text generation'],
          },
          requiresAuth: true,
        },
      ],
    },
    {
      category: '📈 Analytics',
      items: [
        {
          method: 'GET',
          endpoint: '/api/admin/analytics/overview',
          description: 'Get analytics overview',
          requiresAuth: true,
        },
        {
          method: 'POST',
          endpoint: '/api/admin/analytics/reset',
          description: 'Reset all analytics',
          requiresAuth: true,
        },
        {
          method: 'POST',
          endpoint: '/api/admin/threads/clear',
          description: 'Clear all conversation threads',
          requiresAuth: true,
        },
      ],
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">📚 API Documentation</h1>
        <p className="text-gray-600 mb-6">
          Base URL: <code className="bg-gray-200 px-2 py-1 rounded">{API_URL}</code>
        </p>

        {/* API Key Input */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🔑 API Key / Admin Token (for testing)
          </label>
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your API key or admin JWT token"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            For admin endpoints, use the JWT token from login. For chat endpoints, use your API key.
          </p>
        </div>

        {/* Endpoints */}
        {endpoints.map((category) => (
          <div key={category.category} className="mb-8">
            <h2 className="text-xl font-semibold mb-4">{category.category}</h2>
            <div className="space-y-4">
              {category.items.map((item) => {
                const key = `${item.method}-${item.endpoint}`;
                const result = testResults[key];
                const isLoading = loading[key];

                return (
                  <div key={key} className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 text-xs font-bold rounded ${
                              item.method === 'GET' ? 'bg-green-100 text-green-700' :
                              item.method === 'POST' ? 'bg-blue-100 text-blue-700' :
                              item.method === 'PUT' ? 'bg-orange-100 text-orange-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {item.method}
                            </span>
                            <code className="text-sm font-mono">{item.endpoint}</code>
                            {item.requiresAuth && (
                              <span className="text-xs text-gray-500">🔒 Auth required</span>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm">{item.description}</p>
                          {item.notes && (
                            <p className="text-xs text-orange-600 mt-1">⚠️ {item.notes}</p>
                          )}
                        </div>
                        {!item.endpoint.includes('{') && (
                          <button
                            onClick={() => runTest(item.endpoint, item.method, item.body)}
                            disabled={isLoading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                          >
                            {isLoading ? '⏳ Testing...' : '▶️ Test'}
                          </button>
                        )}
                      </div>

                      {/* Request Body */}
                      {item.body && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-gray-500 mb-1">Request Body:</p>
                          <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto">
                            {JSON.stringify(item.body, null, 2)}
                          </pre>
                        </div>
                      )}

                      {/* Response */}
                      {result && (
                        <div className="mt-3">
                          <p className={`text-xs font-medium mb-1 ${
                            result.status >= 200 && result.status < 300 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            Response: {result.status} {result.statusText || ''}
                          </p>
                          <pre className="bg-gray-900 text-gray-300 p-3 rounded text-xs overflow-x-auto max-h-60">
                            {JSON.stringify(result.data || result.error, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Usage Examples */}
        <div className="bg-white rounded-lg shadow p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4">💻 Code Examples</h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-2">cURL - Chat Completion</h3>
              <pre className="bg-gray-900 text-green-400 p-4 rounded text-sm overflow-x-auto">
{`curl -X POST "${API_URL}/v1/chat/completions" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "model": "Sahyog",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": true
  }'`}
              </pre>
            </div>

            <div>
              <h3 className="font-medium mb-2">Python - Chat Completion</h3>
              <pre className="bg-gray-900 text-green-400 p-4 rounded text-sm overflow-x-auto">
{`import requests

response = requests.post(
    "${API_URL}/v1/chat/completions",
    headers={
        "Content-Type": "application/json",
        "Authorization": "Bearer YOUR_API_KEY"
    },
    json={
        "model": "Sahyog",
        "messages": [{"role": "user", "content": "Hello!"}],
        "stream": False
    }
)

print(response.json())`}
              </pre>
            </div>

            <div>
              <h3 className="font-medium mb-2">JavaScript - Chat Completion</h3>
              <pre className="bg-gray-900 text-green-400 p-4 rounded text-sm overflow-x-auto">
{`const response = await fetch("${API_URL}/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_API_KEY"
  },
  body: JSON.stringify({
    model: "Sahyog",
    messages: [{ role: "user", content: "Hello!" }],
    stream: true
  })
});

// For streaming:
const reader = response.body.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  console.log(new TextDecoder().decode(value));
}`}
              </pre>
            </div>

            <div>
              <h3 className="font-medium mb-2">OpenAI Python SDK (Compatible)</h3>
              <pre className="bg-gray-900 text-green-400 p-4 rounded text-sm overflow-x-auto">
{`from openai import OpenAI

client = OpenAI(
    api_key="YOUR_API_KEY",
    base_url="${API_URL}/v1"
)

response = client.chat.completions.create(
    model="Sahyog",
    messages=[{"role": "user", "content": "Hello!"}],
    stream=True
)

for chunk in response:
    print(chunk.choices[0].delta.content or "", end="")`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ApiDocs;


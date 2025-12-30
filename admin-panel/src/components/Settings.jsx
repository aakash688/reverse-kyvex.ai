import React from 'react';

function Settings() {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">⚙️ System Settings</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">🍪 Cookie Pool Configuration</h2>
        <p className="text-gray-600 mb-4">
          The cookie pool system automatically manages browser IDs for unlimited API calls.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Delete Threshold</h3>
            <p className="text-3xl font-bold text-blue-600">45</p>
            <p className="text-sm text-gray-600 mt-1">
              Cookies are deleted after 45 uses (safety margin before 50 limit)
            </p>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">Min Pool Size</h3>
            <p className="text-3xl font-bold text-green-600">10</p>
            <p className="text-sm text-gray-600 mt-1">
              Auto-generate when pool drops below 10 cookies
            </p>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg">
            <h3 className="font-semibold text-purple-800 mb-2">Replenish Count</h3>
            <p className="text-3xl font-bold text-purple-600">50</p>
            <p className="text-sm text-gray-600 mt-1">
              Generate 50 new cookies per batch
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">ℹ️ How It Works</h2>
        <div className="space-y-4 text-gray-600">
          <p>
            <strong>1. Browser ID Generation:</strong> The system generates unique BRWS-xxx browser IDs
            programmatically. Each ID can make up to 50 requests per day.
          </p>
          <p>
            <strong>2. Auto-Rotation:</strong> When a cookie reaches 45 requests, it's automatically
            deleted to prevent hitting the limit.
          </p>
          <p>
            <strong>3. Auto-Replenishment:</strong> When the pool drops below 10 available cookies,
            50 new cookies are automatically generated.
          </p>
          <p>
            <strong>4. Cron Job:</strong> A scheduled task runs every 6 hours to check and replenish
            the cookie pool.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Settings;

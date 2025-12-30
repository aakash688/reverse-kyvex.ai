import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Layout({ children, onLogout }) {
  const location = useLocation();
  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    onLogout();
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Kyvex API Admin</h2>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/api-keys"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/api-keys')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                API Keys
              </Link>
              <Link
                to="/cookie-pool"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname.startsWith('/cookie-pool')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Cookie Pool
              </Link>
              <Link
                to="/models"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/models')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Models
              </Link>
              <Link
                to="/health"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/health')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Health
              </Link>
              <Link
                to="/api-docs"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/api-docs')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                API Docs
              </Link>
              <Link
                to="/settings"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/settings')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="btn btn-danger text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

export default Layout;

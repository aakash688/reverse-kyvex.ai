-- Supabase Database Schema for Kyvex API
-- Run this SQL in Supabase SQL Editor
-- If you get errors about existing objects, you can safely ignore them or drop existing tables first

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================
-- Drop existing tables if needed (uncomment if you want to start fresh)
-- =========================
-- DROP TABLE IF EXISTS rate_limits CASCADE;
-- DROP TABLE IF EXISTS threads CASCADE;
-- DROP TABLE IF EXISTS api_keys CASCADE;
-- DROP TABLE IF EXISTS admins CASCADE;

-- =========================
-- Admins table
-- =========================
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  reset_token TEXT,
  reset_token_expiry TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- =========================
-- API Keys table
-- =========================
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  kyvex_cookie TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'revoked')),
  rate_limit JSONB DEFAULT '{"requestsPerHour": 100, "requestsPerDay": 1000}'::jsonb,
  analytics JSONB DEFAULT '{"totalRequests": 0, "totalTokens": 0, "threadCount": 0, "lastUsed": null, "modelsUsed": {}}'::jsonb,
  created_by UUID REFERENCES admins(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used TIMESTAMPTZ
);

-- =========================
-- Threads table
-- =========================
CREATE TABLE IF NOT EXISTS threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  conversation_id TEXT NOT NULL,
  kyvex_thread_id TEXT,
  last_used TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (api_key_id, conversation_id)
);

-- =========================
-- Rate Limits table
-- =========================
CREATE TABLE IF NOT EXISTS rate_limits (
  id TEXT PRIMARY KEY,
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  rate_window TEXT NOT NULL,
  count INTEGER DEFAULT 1,
  expires_at TIMESTAMPTZ NOT NULL
);

-- =========================
-- Models table
-- =========================
CREATE TABLE IF NOT EXISTS models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  custom_name TEXT UNIQUE NOT NULL,
  provider_name TEXT NOT NULL,
  brand_name TEXT DEFAULT 'Sahyog',
  permissions TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- Proxies table
-- =========================
CREATE TABLE IF NOT EXISTS proxies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host TEXT NOT NULL,
  port INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('http', 'socks4', 'socks5', 'cookie')),
  source TEXT NOT NULL CHECK (source IN ('github', 'proxydb', 'manual', 'auto_gen', 'debug')),
  kyvex_cookie TEXT,
  is_active BOOLEAN DEFAULT true,
  success_rate FLOAT DEFAULT 0.0,
  total_requests INTEGER DEFAULT 0,
  successful_requests INTEGER DEFAULT 0,
  failed_requests INTEGER DEFAULT 0,
  requests_today INTEGER DEFAULT 0,
  last_used TIMESTAMPTZ,
  last_tested TIMESTAMPTZ,
  exhausted_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (host, port, type)
);

-- =========================
-- Proxy Usage table (for daily tracking per API key)
-- =========================
CREATE TABLE IF NOT EXISTS proxy_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proxy_id UUID NOT NULL REFERENCES proxies(id) ON DELETE CASCADE,
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  request_date DATE NOT NULL,
  request_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (proxy_id, api_key_id, request_date)
);

-- =========================
-- System Settings table
-- =========================
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO system_settings (key, value, description) 
VALUES 
  ('use_proxies', 'false', 'Enable/disable proxy usage (true/false)'),
  ('cookie_min_threshold', '10', 'Minimum cookies before auto-generation'),
  ('cookie_gen_batch_size', '50', 'Number of cookies to generate per batch'),
  ('cookie_delete_threshold', '45', 'Delete cookies after this many requests')
ON CONFLICT (key) DO NOTHING;

-- =========================
-- Indexes (drop first if they exist)
-- =========================
DROP INDEX IF EXISTS idx_api_keys_key;
CREATE INDEX idx_api_keys_key ON api_keys(key);

DROP INDEX IF EXISTS idx_api_keys_status;
CREATE INDEX idx_api_keys_status ON api_keys(status);

DROP INDEX IF EXISTS idx_threads_api_key_id;
CREATE INDEX idx_threads_api_key_id ON threads(api_key_id);

DROP INDEX IF EXISTS idx_threads_conversation_id;
CREATE INDEX idx_threads_conversation_id ON threads(conversation_id);

DROP INDEX IF EXISTS idx_rate_limits_api_key_id;
CREATE INDEX idx_rate_limits_api_key_id ON rate_limits(api_key_id);

DROP INDEX IF EXISTS idx_rate_limits_expires_at;
CREATE INDEX idx_rate_limits_expires_at ON rate_limits(expires_at);

DROP INDEX IF EXISTS idx_models_custom_name;
CREATE INDEX idx_models_custom_name ON models(custom_name);

DROP INDEX IF EXISTS idx_models_is_active;
CREATE INDEX idx_models_is_active ON models(is_active);

DROP INDEX IF EXISTS idx_system_settings_key;
CREATE INDEX idx_system_settings_key ON system_settings(key);

DROP INDEX IF EXISTS idx_proxies_is_active;
CREATE INDEX idx_proxies_is_active ON proxies(is_active);

DROP INDEX IF EXISTS idx_proxies_exhausted_until;
CREATE INDEX idx_proxies_exhausted_until ON proxies(exhausted_until);

DROP INDEX IF EXISTS idx_proxies_success_rate;
CREATE INDEX idx_proxies_success_rate ON proxies(success_rate);

DROP INDEX IF EXISTS idx_proxies_type;
CREATE INDEX idx_proxies_type ON proxies(type);

DROP INDEX IF EXISTS idx_proxy_usage_proxy_id;
CREATE INDEX idx_proxy_usage_proxy_id ON proxy_usage(proxy_id);

DROP INDEX IF EXISTS idx_proxy_usage_request_date;
CREATE INDEX idx_proxy_usage_request_date ON proxy_usage(request_date);

DROP INDEX IF EXISTS idx_proxy_usage_api_key_id;
CREATE INDEX idx_proxy_usage_api_key_id ON proxy_usage(api_key_id);

-- =========================
-- Enable Row Level Security
-- =========================
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE proxies ENABLE ROW LEVEL SECURITY;
ALTER TABLE proxy_usage ENABLE ROW LEVEL SECURITY;

-- =========================
-- Drop existing policies if they exist
-- =========================
DROP POLICY IF EXISTS "Allow all operations on admins" ON admins;
DROP POLICY IF EXISTS "Allow all operations on api_keys" ON api_keys;
DROP POLICY IF EXISTS "Allow all operations on threads" ON threads;
DROP POLICY IF EXISTS "Allow all operations on rate_limits" ON rate_limits;
DROP POLICY IF EXISTS "Allow all operations on models" ON models;
DROP POLICY IF EXISTS "Allow all operations on proxies" ON proxies;
DROP POLICY IF EXISTS "Allow all operations on proxy_usage" ON proxy_usage;

-- =========================
-- Create Policies (Open for now)
-- ⚠️ Lock these down in production
-- =========================
CREATE POLICY "Allow all operations on admins"
  ON admins
  FOR ALL
  USING (true);

CREATE POLICY "Allow all operations on api_keys"
  ON api_keys
  FOR ALL
  USING (true);

CREATE POLICY "Allow all operations on threads"
  ON threads
  FOR ALL
  USING (true);

CREATE POLICY "Allow all operations on rate_limits"
  ON rate_limits
  FOR ALL
  USING (true);

CREATE POLICY "Allow all operations on models"
  ON models
  FOR ALL
  USING (true);

CREATE POLICY "Allow all operations on proxies"
  ON proxies
  FOR ALL
  USING (true);

CREATE POLICY "Allow all operations on proxy_usage"
  ON proxy_usage
  FOR ALL
  USING (true);

CREATE POLICY "Allow all operations on system_settings"
  ON system_settings
  FOR ALL
  USING (true);

-- Simple SQL script to add multiple cookie proxies for unlimited requests
-- 
-- Usage:
-- 1. Get multiple cookies from kyvex.ai (use incognito windows)
-- 2. Replace the cookie values below with your actual cookies
-- 3. Run this SQL in Supabase SQL Editor
--
-- Each cookie = 50 requests/day limit
-- 10 cookies = 500 requests/day capacity
-- 20 cookies = 1000 requests/day capacity

-- Example: Add 10 cookie proxies
-- Replace 'browserId=BRWS-...' with your actual cookies

INSERT INTO proxies (host, port, type, source, kyvex_cookie, is_active, success_rate, total_requests, successful_requests, failed_requests, requests_today, last_tested)
VALUES 
  -- Cookie 1
  ('cookie_auto_1', 0, 'cookie', 'manual', 'browserId=BRWS-REPLACE_WITH_COOKIE_1', true, 0.0, 0, 0, 0, 0, NOW()),
  -- Cookie 2
  ('cookie_auto_2', 0, 'cookie', 'manual', 'browserId=BRWS-REPLACE_WITH_COOKIE_2', true, 0.0, 0, 0, 0, 0, NOW()),
  -- Cookie 3
  ('cookie_auto_3', 0, 'cookie', 'manual', 'browserId=BRWS-REPLACE_WITH_COOKIE_3', true, 0.0, 0, 0, 0, 0, NOW()),
  -- Cookie 4
  ('cookie_auto_4', 0, 'cookie', 'manual', 'browserId=BRWS-REPLACE_WITH_COOKIE_4', true, 0.0, 0, 0, 0, 0, NOW()),
  -- Cookie 5
  ('cookie_auto_5', 0, 'cookie', 'manual', 'browserId=BRWS-REPLACE_WITH_COOKIE_5', true, 0.0, 0, 0, 0, 0, NOW()),
  -- Cookie 6
  ('cookie_auto_6', 0, 'cookie', 'manual', 'browserId=BRWS-REPLACE_WITH_COOKIE_6', true, 0.0, 0, 0, 0, 0, NOW()),
  -- Cookie 7
  ('cookie_auto_7', 0, 'cookie', 'manual', 'browserId=BRWS-REPLACE_WITH_COOKIE_7', true, 0.0, 0, 0, 0, 0, NOW()),
  -- Cookie 8
  ('cookie_auto_8', 0, 'cookie', 'manual', 'browserId=BRWS-REPLACE_WITH_COOKIE_8', true, 0.0, 0, 0, 0, 0, NOW()),
  -- Cookie 9
  ('cookie_auto_9', 0, 'cookie', 'manual', 'browserId=BRWS-REPLACE_WITH_COOKIE_9', true, 0.0, 0, 0, 0, 0, NOW()),
  -- Cookie 10
  ('cookie_auto_10', 0, 'cookie', 'manual', 'browserId=BRWS-REPLACE_WITH_COOKIE_10', true, 0.0, 0, 0, 0, 0, NOW())
ON CONFLICT (host, port, type) DO NOTHING;

-- Verify proxies were created
SELECT 
  id, 
  host, 
  type, 
  LEFT(kyvex_cookie, 30) || '...' as cookie_preview,
  is_active,
  requests_today
FROM proxies 
WHERE type = 'cookie' 
ORDER BY created_at DESC 
LIMIT 10;


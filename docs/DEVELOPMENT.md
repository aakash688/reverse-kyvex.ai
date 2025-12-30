# 💻 Development Guide

Guide for developers working on the Kyvex API project.

## Development Setup

### Prerequisites

```bash
# Install Node.js 18+
node --version

# Install Wrangler globally
npm install -g wrangler

# Install dependencies
cd api && npm install
cd ../admin-panel && npm install
```

### Local Development

#### API Worker

```bash
cd api
wrangler dev
# Runs on http://localhost:8787
```

**Features:**
- Hot reload on file changes
- Local environment variables
- Real-time logs
- Debugging support

#### Admin Panel

```bash
cd admin-panel
npm run dev
# Runs on http://localhost:5173
```

**Features:**
- Vite HMR (Hot Module Replacement)
- Fast refresh
- Source maps for debugging

### Environment Setup

#### Local API Worker

Create `api/.dev.vars`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
JWT_SECRET=your-jwt-secret
ADMIN_PANEL_URL=http://localhost:5173
```

#### Local Admin Panel

Create `admin-panel/.env.local`:
```env
VITE_API_URL=http://localhost:8787
```

## Project Structure

```
api/
├── src/
│   ├── handlers/          # Request handlers
│   │   ├── chat.js        # Chat completions
│   │   ├── models.js      # Model listing
│   │   ├── admin.js       # Admin operations
│   │   └── analytics.js   # Analytics
│   ├── services/          # Business logic
│   │   ├── cookieService.js
│   │   ├── modelService.js
│   │   ├── apiKey.js
│   │   └── kyvex.js
│   ├── middleware/        # Auth, rate limiting
│   │   ├── auth.js
│   │   └── rateLimit.js
│   ├── utils/             # Utilities
│   │   ├── db.js          # Database utilities
│   │   ├── jwt.js         # JWT handling
│   │   └── crypto.js      # Cryptography
│   └── index.js           # Entry point
├── supabase-schema.sql     # Database schema
└── wrangler.toml           # Worker config

admin-panel/
├── src/
│   ├── components/         # React components
│   │   ├── Dashboard.jsx
│   │   ├── CookiePoolDashboard.jsx
│   │   └── ...
│   ├── services/
│   │   └── api.js         # API client
│   ├── App.jsx            # Main app
│   └── main.jsx           # Entry point
└── vite.config.js
```

## Code Style

### JavaScript/ES Modules

```javascript
// Use ES6+ features
import { functionName } from './module.js';

// Use async/await
async function myFunction() {
  const result = await someAsyncOperation();
  return result;
}

// Use const/let, avoid var
const constant = 'value';
let variable = 'value';
```

### Error Handling

```javascript
try {
  const result = await operation();
  return jsonResponse(result);
} catch (error) {
  console.error('[Service] Error:', error);
  return errorResponse(error.message, 500);
}
```

### Logging

```javascript
// Use consistent logging format
console.log('[Service] Action: description');
console.error('[Service] Error: message');
console.warn('[Service] Warning: message');
```

## Adding New Features

### 1. Add New Endpoint

**In `api/src/index.js`:**
```javascript
if (path === '/api/new-endpoint' && request.method === 'POST') {
  const response = await handleNewEndpoint(request);
  return addCorsHeaders(response);
}
```

**Create handler in `api/src/handlers/`:**
```javascript
export async function handleNewEndpoint(request) {
  const authResult = await verifyAdmin(request);
  if (authResult.error) {
    return errorResponse(authResult.error, authResult.status);
  }
  
  try {
    // Your logic here
    return jsonResponse({ success: true });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
```

### 2. Add New Service

**Create `api/src/services/newService.js`:**
```javascript
import { find, insertOne } from '../utils/db.js';

export async function getData() {
  return await find('table_name', {});
}

export async function createData(data) {
  return await insertOne('table_name', data);
}
```

### 3. Add New Database Table

**In `api/supabase-schema.sql`:**
```sql
CREATE TABLE IF NOT EXISTS new_table (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Allow all operations"
  ON new_table
  FOR ALL
  USING (true);
```

**Run in Supabase SQL Editor**

### 4. Add New Admin Panel Page

**Create component:**
```javascript
// admin-panel/src/components/NewPage.jsx
import React from 'react';

function NewPage() {
  return (
    <div className="p-6">
      <h1>New Page</h1>
    </div>
  );
}

export default NewPage;
```

**Add route in `admin-panel/src/App.jsx`:**
```javascript
<Route
  path="/new-page"
  element={
    <Layout>
      <NewPage />
    </Layout>
  }
/>
```

## Testing

### Manual Testing

#### Test Chat Completion

```bash
curl -X POST "http://localhost:8787/v1/chat/completions" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "Sahyog",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

#### Test Admin Endpoint

```bash
curl -X POST "http://localhost:8787/api/admin/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password"
  }'
```

### Testing Cookie Generation

```bash
# Generate cookies
curl -X POST "http://localhost:8787/api/admin/cookies/generate" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"count": 10}'
```

### Testing Auto-Generation

1. Delete cookies until pool < 10
2. Make a chat request
3. Check logs for auto-generation trigger
4. Verify new cookies created

## Debugging

### Worker Logs

```bash
# Real-time logs
wrangler tail

# Formatted logs
wrangler tail --format pretty
```

### Browser Console

- Open browser DevTools
- Check Console for errors
- Check Network tab for API calls

### Database Debugging

```sql
-- Check cookie pool
SELECT COUNT(*), 
       SUM(CASE WHEN usage_count < 45 THEN 1 ELSE 0 END) as available
FROM browser_cookies;

-- Check API keys
SELECT id, name, status, 
       analytics->>'totalRequests' as requests
FROM api_keys;
```

## Common Development Tasks

### Add New Model

1. Go to Admin Panel → Models
2. Click "Create New Model"
3. Fill in details
4. Save

### Generate Cookies

1. Go to Admin Panel → Cookie Pool
2. Click "Generate Cookies"
3. Enter count (e.g., 50)
4. Click Generate

### Reset Analytics

1. Go to Admin Panel → Dashboard
2. Click "Reset Analytics"
3. Confirm

### Update Settings

1. Go to Admin Panel → Settings
2. Update values
3. Save

## Git Workflow

### Branch Naming

- `feature/feature-name` - New features
- `fix/bug-name` - Bug fixes
- `docs/documentation` - Documentation updates

### Commit Messages

```
feat: Add image support to chat completions
fix: Fix cookie auto-generation not triggering
docs: Update API documentation
refactor: Simplify cookie service logic
```

### Before Committing

```bash
# Check for errors
cd api && npm run lint
cd ../admin-panel && npm run build

# Test locally
wrangler dev
npm run dev  # In admin-panel
```

## Performance Tips

### 1. Minimize Database Calls

```javascript
// ❌ Bad - Multiple calls
const key1 = await findOne('table', { id: 1 });
const key2 = await findOne('table', { id: 2 });

// ✅ Good - Single call
const keys = await find('table', { id: { $in: [1, 2] } });
```

### 2. Use Parallel Operations

```javascript
// ✅ Good - Parallel
const [data1, data2] = await Promise.all([
  fetchData1(),
  fetchData2()
]);
```

### 3. Cache Settings

```javascript
// Cache in memory
let settingsCache = null;

async function getSettings() {
  if (settingsCache) return settingsCache;
  settingsCache = await loadSettings();
  return settingsCache;
}
```

## Troubleshooting

### Issue: "Module not found"

**Solution:**
- Check import paths
- Ensure file exists
- Verify ES module syntax

### Issue: "Cannot read property of undefined"

**Solution:**
- Add null checks
- Use optional chaining: `obj?.property`
- Add default values

### Issue: "Worker exceeded CPU time"

**Solution:**
- Optimize database queries
- Use `ctx.waitUntil()` for background tasks
- Batch operations

## Code Review Checklist

- [ ] Code follows style guide
- [ ] Error handling in place
- [ ] Logging added
- [ ] Tests pass
- [ ] Documentation updated
- [ ] No console.logs in production
- [ ] Secrets not committed
- [ ] CORS headers correct


# 📦 Installation Guide

Complete step-by-step guide to set up and deploy the Kyvex API system.

## Prerequisites

### Required Accounts
- **Cloudflare Account** - [Sign up](https://dash.cloudflare.com/sign-up)
- **Supabase Account** - [Sign up](https://supabase.com)

### Required Software
- **Node.js 18+** - [Download](https://nodejs.org/)
- **npm** - Comes with Node.js
- **Git** - [Download](https://git-scm.com/)
- **Wrangler CLI** - Install globally: `npm install -g wrangler`

### Verify Installation
```bash
node --version    # Should be 18.0.0 or higher
npm --version     # Should be 9.0.0 or higher
wrangler --version # Should be 4.0.0 or higher
git --version
```

## Step 1: Clone Repository

```bash
git clone <your-repository-url>
cd kyvex.ai
```

## Step 2: Set Up Supabase

### 2.1 Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Fill in:
   - **Name**: `kyvex-api` (or your choice)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to your users
4. Click "Create new project"
5. Wait for project to be ready (~2 minutes)

### 2.2 Get Supabase Credentials

1. Go to **Settings** → **API**
2. Copy:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 2.3 Run Database Schema

1. Go to **SQL Editor** in Supabase
2. Open `api/supabase-schema.sql`
3. Copy entire contents
4. Paste into SQL Editor
5. Click "Run" (or press Ctrl+Enter)
6. Verify tables created:
   - `admins`
   - `api_keys`
   - `models`
   - `browser_cookies`
   - `system_settings`
   - `threads`

### 2.4 Create Admin User

Run this SQL in Supabase SQL Editor (replace with your email/password):

```sql
-- Generate password hash (use online SHA-256 tool or Node.js)
-- Password: your_password_here
-- Hash: sha256 hash of password

INSERT INTO admins (id, email, password_hash, name, is_active, created_at)
VALUES (
  uuid_generate_v4(),
  'your-email@example.com',
  'sha256_hash_of_your_password',
  'Your Name',
  true,
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  is_active = true;
```

**To generate password hash:**
```bash
node -e "const crypto = require('crypto'); console.log(crypto.createHash('sha256').update('your_password').digest('hex'));"
```

## Step 3: Set Up API Worker

### 3.1 Install Dependencies

```bash
cd api
npm install
```

### 3.2 Configure Wrangler

1. Login to Cloudflare:
   ```bash
   wrangler login
   ```

2. Create worker (if not exists):
   ```bash
   wrangler init
   ```

### 3.3 Set Secrets

Set all required secrets:

```bash
# Supabase URL
wrangler secret put SUPABASE_URL
# Paste: https://xxxxx.supabase.co

# Supabase Anon Key
wrangler secret put SUPABASE_ANON_KEY
# Paste: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# JWT Secret (generate a random string)
wrangler secret put JWT_SECRET
# Paste: your-random-secret-string-here

# Admin Panel URL (set after deploying admin panel)
wrangler secret put ADMIN_PANEL_URL
# Paste: https://your-admin-panel.pages.dev
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3.4 Deploy API Worker

```bash
wrangler deploy
```

**Note the deployed URL**: `https://your-worker-name.your-subdomain.workers.dev`

## Step 4: Set Up Admin Panel

### 4.1 Install Dependencies

```bash
cd ../admin-panel
npm install
```

### 4.2 Configure API URL

Create/update `admin-panel/.env`:
```env
VITE_API_URL=https://your-worker-name.your-subdomain.workers.dev
```

Or update `admin-panel/src/services/api.js`:
```javascript
const API_URL = 'https://your-worker-name.your-subdomain.workers.dev';
```

### 4.3 Build Admin Panel

```bash
npm run build
```

### 4.4 Deploy to Cloudflare Pages

```bash
wrangler pages deploy dist --project-name=kyvex-admin-panel
```

**Note the deployed URL**: `https://kyvex-admin-panel.pages.dev`

### 4.5 Update ADMIN_PANEL_URL Secret

```bash
cd ../api
wrangler secret put ADMIN_PANEL_URL
# Paste: https://kyvex-admin-panel.pages.dev
wrangler deploy  # Redeploy to apply
```

## Step 5: Initial Configuration

### 5.1 Login to Admin Panel

1. Go to your admin panel URL
2. Login with email/password you created
3. You should see the dashboard

### 5.2 Create API Key

1. Go to **API Keys** section
2. Click **Create API Key**
3. Fill in:
   - **Name**: `My First API Key`
   - **Email**: `user@example.com`
4. Copy the generated API key

### 5.3 Generate Initial Cookies

1. Go to **Cookie Pool** section
2. Click **Generate Cookies**
3. Enter: `50` cookies
4. Click **Generate**
5. Wait for generation to complete

### 5.4 Configure Models

1. Go to **Models** section
2. Click **Create New Model**
3. Fill in:
   - **Custom Name**: `Sahyog`
   - **Provider Model**: Select from dropdown
   - **Brand Name**: `Sahyog`
   - **Permissions**: `Text generation supported`
4. Click **Create**

## Step 6: Test the System

### 6.1 Test Chat Completion

```bash
curl -X POST "https://your-worker.workers.dev/v1/chat/completions" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "Sahyog",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ],
    "stream": false
  }'
```

### 6.2 Test Models Endpoint

```bash
curl -X GET "https://your-worker.workers.dev/v1/models" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### 6.3 Test Admin Login

```bash
curl -X POST "https://your-worker.workers.dev/api/admin/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'
```

## Step 7: Verify Deployment

### 7.1 Check Worker Logs

```bash
cd api
wrangler tail
```

### 7.2 Check Database

1. Go to Supabase Dashboard
2. Check **Table Editor**
3. Verify data in:
   - `api_keys` - Should have your API key
   - `browser_cookies` - Should have generated cookies
   - `models` - Should have your model

### 7.3 Check Admin Panel

1. Visit admin panel URL
2. Verify all pages load:
   - Dashboard
   - Cookie Pool
   - Models
   - API Keys
   - API Docs

## Troubleshooting

### Issue: "Supabase operation failed: 530"
**Solution**: Check if Supabase project is paused. Resume it in dashboard.

### Issue: "Invalid or expired token"
**Solution**: 
- Regenerate JWT secret
- Update `JWT_SECRET` in Cloudflare
- Redeploy worker

### Issue: "No cookies available"
**Solution**:
- Go to Cookie Pool
- Click "Generate Cookies"
- Generate at least 10 cookies

### Issue: "Model not found"
**Solution**:
- Go to Models section
- Create a model mapping
- Ensure model is active

### Issue: Admin panel shows "Not found"
**Solution**:
- Check `VITE_API_URL` in admin panel
- Verify API worker is deployed
- Check browser console for errors

## Post-Installation

### Recommended Settings

1. **Cookie Pool Settings** (Admin Panel → Settings):
   - `cookie_min_threshold`: `10`
   - `cookie_gen_batch_size`: `50`
   - `cookie_delete_threshold`: `45`

2. **Generate Initial Cookies**:
   - Generate 50-100 cookies to start
   - System will auto-maintain from there

3. **Create Models**:
   - Map your custom model names
   - Configure permissions

## Next Steps

- Read [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for API usage
- Read [DEVELOPMENT.md](./DEVELOPMENT.md) for development guide
- Read [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment procedures

## Support

If you encounter issues:
1. Check Cloudflare Worker logs: `wrangler tail`
2. Check Supabase logs: Dashboard → Logs
3. Check browser console (admin panel)
4. Review error messages in responses


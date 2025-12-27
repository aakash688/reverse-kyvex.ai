# 🚀 Deploy to Fly.io (No Credit Card Required)

Complete step-by-step guide to deploy on Fly.io free tier.

---

## ✅ Why Fly.io?

- ✅ **No credit card required**
- ✅ Generous free tier (3 VMs, 3GB storage)
- ✅ Always on (no sleep)
- ✅ Global edge network
- ✅ Works with your current codebase

---

## 📋 Prerequisites

- GitHub account (already have ✅)
- MongoDB Atlas (already configured ✅)
- Fly.io account (we'll create it)

---

## Step 1: Install Fly CLI

### Windows (PowerShell):

```powershell
# Run as Administrator
iwr https://fly.io/install.ps1 -useb | iex
```

### Or Download Manually:

1. Go to https://fly.io/docs/hands-on/install-flyctl/
2. Download Windows installer
3. Run installer

### Verify Installation:

```bash
fly version
```

Should show Fly CLI version.

---

## Step 2: Sign Up for Fly.io

1. Open terminal/PowerShell
2. Run:
   ```bash
   fly auth signup
   ```
3. It will open browser
4. Sign up with GitHub (easiest)
5. Authorize Fly.io
6. **No credit card required!** ✅

---

## Step 3: Initialize Fly.io App

1. Navigate to your project directory:
   ```bash
   cd "D:\Projects\Ai\AI Hacks\kyvex.ai"
   ```

2. Launch your app:
   ```bash
   fly launch
   ```

3. Follow prompts:
   - **App name**: `kyvex-api-proxy` (or choose your own)
   - **Region**: Choose closest (e.g., `iad` for US East)
   - **Postgres?**: `n` (we use MongoDB)
   - **Redis?**: `n` (optional, not needed)
   - **Deploy now?**: `n` (we'll set secrets first)

---

## Step 4: Set Environment Variables (Secrets)

Set all your secrets one by one:

```bash
# MongoDB
fly secrets set MONGODB_URI="mongodb+srv://aakash_db_user:0zbr3r5EA1wl2Ieg@aakash.sq09shj.mongodb.net/kyvex-api?retryWrites=true&w=majority"

# Session
fly secrets set SESSION_SECRET="V9ZdQSUGxrXvuof1Gm1GCD3Pi0eHMXmOtlWLGlHOqcY="
fly secrets set SESSION_NAME="admin_session"
fly secrets set SESSION_MAX_AGE="86400000"

# Admin
fly secrets set ADMIN_INITIAL_USERNAME="admin"
fly secrets set ADMIN_INITIAL_PASSWORD="YourSecurePassword123!"
fly secrets set ADMIN_INITIAL_EMAIL="aakash@lnovic.com"

# Kyvex
fly secrets set KYVEX_API_URL="https://kyvex.ai/api/v1"

# Email
fly secrets set EMAIL_PROVIDER="resend"
fly secrets set RESEND_API_KEY="re_45aVXFjE_7JRDVxj5Hizkqs9VFivDZjRf"
fly secrets set EMAIL_FROM="onboarding@resend.dev"

# Keep-Alive
fly secrets set KEEP_ALIVE_ENABLED="true"
fly secrets set KEEP_ALIVE_INTERVAL="300000"

# Security
fly secrets set BCRYPT_ROUNDS="10"
fly secrets set PASSWORD_RESET_EXPIRY="3600000"

# Server
fly secrets set NODE_ENV="production"
```

**Note:** For values with spaces or special characters, use quotes.

---

## Step 5: Review fly.toml

Check that `fly.toml` exists and has correct configuration:

```toml
app = "kyvex-api-proxy"
primary_region = "iad"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 0
  processes = ["app"]

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 512
```

This file should already exist in your project.

---

## Step 6: Deploy

```bash
fly deploy
```

This will:
1. Build your Docker image
2. Push to Fly.io
3. Deploy your app
4. Show you the URL

⏳ **Wait 2-5 minutes** for deployment.

---

## Step 7: Get Your App URL

After deployment, you'll see:

```
==> App is running at: https://kyvex-api-proxy.fly.dev
```

**Your app is live!** 🎉

---

## Step 8: Test Your Deployment

### Test Health Endpoint:

```bash
curl https://kyvex-api-proxy.fly.dev/health
```

Or open in browser: `https://kyvex-api-proxy.fly.dev/health`

### Test Admin Panel:

1. Go to: `https://kyvex-api-proxy.fly.dev/admin`
2. Login with:
   - Username: `admin`
   - Password: (the one you set in `ADMIN_INITIAL_PASSWORD`)

---

## Step 9: View Logs

```bash
fly logs
```

Or view in dashboard:
```bash
fly dashboard
```

---

## Step 10: Set Up Keep-Alive (Optional)

Fly.io doesn't sleep, but you can still set up monitoring:

1. Go to [UptimeRobot.com](https://uptimerobot.com)
2. Add monitor: `https://kyvex-api-proxy.fly.dev/health`
3. Interval: 5 minutes

---

## 🔧 Troubleshooting

### Deployment Fails?

1. Check logs: `fly logs`
2. Verify secrets: `fly secrets list`
3. Check MongoDB IP whitelist (must have `0.0.0.0/0`)

### Can't Connect to MongoDB?

1. Go to MongoDB Atlas → Network Access
2. Verify `0.0.0.0/0` is whitelisted
3. Check connection string in secrets

### App Not Starting?

1. View logs: `fly logs`
2. Check all secrets are set: `fly secrets list`
3. Verify `fly.toml` configuration

---

## 📊 Useful Commands

```bash
# View app status
fly status

# View logs
fly logs

# Open dashboard
fly dashboard

# List secrets
fly secrets list

# Update secret
fly secrets set KEY="value"

# Restart app
fly apps restart kyvex-api-proxy

# Scale app
fly scale count 1
```

---

## 💰 Free Tier Limits

Fly.io Free Tier includes:
- ✅ 3 shared-cpu-1x VMs
- ✅ 3GB persistent volume
- ✅ 160GB outbound data transfer/month
- ✅ Always on (no sleep)
- ✅ Global edge network
- ✅ **No credit card required!**

---

## 🎯 Summary

1. ✅ Install Fly CLI
2. ✅ Sign up: `fly auth signup`
3. ✅ Launch: `fly launch`
4. ✅ Set secrets (all environment variables)
5. ✅ Deploy: `fly deploy`
6. ✅ Test: Visit your app URL

**Your app is live at: `https://kyvex-api-proxy.fly.dev`**

---

## 🔄 Updating Your App

Every time you push to GitHub:

```bash
fly deploy
```

Or set up auto-deploy (requires Fly.io paid plan or manual deployment).

---

**Need help?** Check Fly.io docs: https://fly.io/docs

---

Made with ❤️ by [Aakash Singh](https://github.com/aakash688)


# Deployment Guide

This guide covers deploying the Kyvex API Proxy to free hosting platforms.

## Prerequisites

1. MongoDB Atlas account (free tier)
2. Email service account (Resend recommended - free tier)
3. Git repository (GitHub/GitLab)

## MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster (M0)
3. Create a database user
4. Whitelist your IP (or use 0.0.0.0/0 for all IPs - less secure)
5. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/kyvex-api?retryWrites=true&w=majority`

## Email Service Setup (Resend)

1. Go to [Resend](https://resend.com)
2. Sign up for free account (3,000 emails/month)
3. Create API key
4. Verify your domain (or use default)

## Deployment Options (Free Tier)

### Option 1: Google Cloud Run (BEST - 2 Million Requests/Month)

**Best for**: High-traffic APIs (up to 2M requests/month free)

**Free Tier:**
- ✅ **2 million requests/month**
- ✅ 180,000 vCPU-seconds/month
- ✅ 360,000 GiB-seconds memory/month
- ✅ Always free (not trial)
- ✅ Auto-scaling to zero when idle
- ✅ HTTPS included

**Deployment Steps:**

1. Install Google Cloud CLI: https://cloud.google.com/sdk/docs/install
2. Create a project:
   ```bash
   gcloud projects create kyvex-api-proxy
   gcloud config set project kyvex-api-proxy
   ```
3. Enable Cloud Run API:
   ```bash
   gcloud services enable run.googleapis.com
   ```
4. Build and deploy:
   ```bash
   gcloud run deploy kyvex-api-proxy \
     --source . \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars MONGODB_URI=your-uri,SESSION_SECRET=your-secret
   ```
5. Add all environment variables via Cloud Console or CLI

**Note**: First request may be slow (cold start), subsequent requests are fast.

### Option 2: Oracle Cloud (Unlimited Requests - Full VM)

**Best for**: Maximum control, no request limits

**Free Tier:**
- ✅ **Unlimited requests** (no limits!)
- ✅ 2 AMD VMs (1GB RAM each) OR 4 ARM cores (24GB RAM)
- ✅ 200GB storage
- ✅ Always free (not trial)
- ✅ Full root access

**Deployment Steps:**

1. Sign up at [Oracle Cloud](https://www.oracle.com/cloud/free/)
2. Create an Always Free VM instance
3. SSH into the VM
4. Install Node.js:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```
5. Clone your repo and deploy:
   ```bash
   git clone your-repo
   cd kyvex-api-proxy
   npm install
   npm start
   ```
6. Use PM2 for process management:
   ```bash
   npm install -g pm2
   pm2 start src/server.js --name kyvex-api
   pm2 save
   pm2 startup
   ```

**Note**: Requires more setup but gives you a full server with no limits.

### Option 3: Cloudflare Workers (3 Million Requests/Month - Requires Refactoring)

**Best for**: If you're willing to refactor code

**Free Tier:**
- ✅ **100,000 requests/day** (3 million/month)
- ✅ Unlimited bandwidth
- ✅ Global edge network
- ✅ Always free

**Note**: Current codebase needs major refactoring. See "Cloudflare Workers" section below.

### Option 4: Render (Free Tier - With Keep-Alive Solution)

**Best for**: Production apps with keep-alive mechanism

**Free Tier:**
- ✅ **No explicit request limit**
- ✅ 512 MB RAM
- ✅ 0.1 CPU
- ✅ Auto-deploy from Git
- ✅ Custom domains
- ⚠️ Sleeps after 15 min inactivity (but we prevent this!)

**Keep-Alive Solution:**
The app includes a built-in keep-alive service that pings itself every 5 minutes to prevent sleeping. Additionally, you can use external services for redundancy.

**Deployment Steps:**

1. Go to [Render](https://render.com)
2. Sign up with GitHub
3. Click "New Web Service"
4. Connect your repository
5. Configure:
   - **Name**: `kyvex-api-proxy`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free
6. Add environment variables:
   - `MONGODB_URI` - Your MongoDB connection string
   - `SESSION_SECRET` - Random secret (generate with: `openssl rand -base64 32`)
   - `KYVEX_API_URL` - `https://kyvex.ai/api/v1`
   - `EMAIL_PROVIDER` - `resend`
   - `RESEND_API_KEY` - Your Resend API key
   - `EMAIL_FROM` - Your verified email
   - `ADMIN_INITIAL_USERNAME` - `admin` (or your choice)
   - `ADMIN_INITIAL_PASSWORD` - Strong password
   - `ADMIN_INITIAL_EMAIL` - Your email
   - `KEEP_ALIVE_ENABLED` - `true` (enables keep-alive)
   - `KEEP_ALIVE_INTERVAL` - `300000` (5 minutes in milliseconds)
   - `NODE_ENV` - `production`
7. Click "Create Web Service"
8. After deployment, Render will provide a URL like `https://your-app.onrender.com`
9. **Important**: Set `APP_URL` environment variable to your Render URL (or it will auto-detect from `RENDER_EXTERNAL_URL`)

**Additional Keep-Alive Options (Redundancy):**

For extra reliability, use external services to ping your app:

**Option A: UptimeRobot (Free)**
1. Go to [UptimeRobot](https://uptimerobot.com)
2. Sign up (free, 50 monitors)
3. Add a new monitor:
   - **Monitor Type**: HTTP(s)
   - **URL**: `https://your-app.onrender.com/health`
   - **Interval**: 5 minutes
4. This will ping your app every 5 minutes, keeping it awake

**Option B: Cron-Job.org (Free)**
1. Go to [Cron-Job.org](https://cron-job.org)
2. Sign up (free)
3. Create a cron job:
   - **URL**: `https://your-app.onrender.com/keepalive`
   - **Schedule**: Every 5 minutes (`*/5 * * * *`)
4. This will ping your app every 5 minutes

**Option C: Use Both (Recommended)**
- Internal keep-alive service (pings itself)
- External service (UptimeRobot or Cron-Job) as backup
- This ensures your app stays awake even if one method fails

**How It Works:**
- The app has a built-in keep-alive service that pings `/health` every 5 minutes
- External services ping your app every 5 minutes as backup
- This prevents the 15-minute inactivity timeout
- Your app stays awake 24/7 on the free tier!

**Note**: The first request after any restart may take a few seconds, but with keep-alive, restarts are rare.

### Option 5: Cyclic.sh (Limited - 1,000 Requests/Month)

**Note**: Only 1,000 API requests/month on free tier - **NOT recommended for production**

**Free Tier:**
- ⚠️ **1,000 API requests/month** (very limited)
- ✅ Always on (no sleep)
- ✅ 512 MB RAM
- ✅ 1 vCPU

**Recommendation**: Skip this option due to low request limit.

### Option 2: Render (Free Tier - Sleeps After 15 Min Inactivity)

**Best for**: Development/testing or low-traffic apps

1. Go to [Render](https://render.com)
2. Sign up with GitHub
3. Click "New Web Service"
4. Connect your repository
5. Configure:
   - **Name**: `kyvex-api-proxy`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free
6. Add environment variables (same as Cyclic)
7. Click "Create Web Service"
8. Render will auto-deploy

**Free Tier Features:**
- ⚠️ Sleeps after 15 minutes of inactivity (first request wakes it up)
- ✅ 512 MB RAM
- ✅ 0.1 CPU
- ✅ Auto-deploy from Git
- ✅ Custom domains

### Option 3: Fly.io (Free Tier Available)

**Best for**: Global deployment with edge locations

1. Go to [Fly.io](https://fly.io)
2. Sign up and install Fly CLI
3. Run: `fly launch` in your project directory
4. Follow prompts to configure
5. Set secrets: `fly secrets set MONGODB_URI=...` (repeat for all env vars)
6. Deploy: `fly deploy`

**Free Tier Features:**
- ✅ 3 shared-cpu-1x VMs
- ✅ 3GB persistent volume
- ✅ 160GB outbound data transfer
- ✅ Global edge network

### Option 4: Vercel (Serverless - Needs Adjustments)

**Note**: Vercel is serverless and requires code modifications for sessions and long-running connections.

**Limitations:**
- ⚠️ Serverless functions (10s timeout on free tier)
- ⚠️ No persistent connections
- ⚠️ Sessions need external storage (Redis/KV)
- ⚠️ Streaming may not work as expected

**If using Vercel:**
1. Go to [Vercel](https://vercel.com)
2. Import your repository
3. Configure:
   - **Framework Preset**: Other
   - **Build Command**: `npm install`
   - **Output Directory**: (leave empty)
4. Add environment variables
5. Deploy

**Recommendation**: Not ideal for this app due to session and streaming requirements.

## Cloudflare Workers Deployment (Advanced)

**Free Tier:**
- ✅ **100,000 requests/day** (3 million/month)
- ✅ Unlimited bandwidth
- ✅ Global edge network

**Current codebase is NOT compatible** - would require:
- Complete rewrite to Workers runtime (not Node.js)
- MongoDB Atlas Data API (HTTP-based) instead of Mongoose
- Cloudflare KV for sessions
- Separate admin panel deployment (Cloudflare Pages)
- Different streaming implementation

**If you want Cloudflare Workers**, I can create a separate Workers-compatible version. This would be a significant refactor but gives you 3M requests/month free.

## Environment Variables

Required environment variables:

```env
PORT=3000
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
KYVEX_API_URL=https://kyvex.ai/api/v1
SESSION_SECRET=<generate-random-secret>
SESSION_NAME=admin_session
SESSION_MAX_AGE=86400000
ADMIN_INITIAL_USERNAME=admin
ADMIN_INITIAL_PASSWORD=<strong-password>
ADMIN_INITIAL_EMAIL=admin@example.com
EMAIL_PROVIDER=resend
RESEND_API_KEY=<your-resend-key>
EMAIL_FROM=noreply@yourdomain.com
BCRYPT_ROUNDS=10
PASSWORD_RESET_EXPIRY=3600000
```

## Post-Deployment

1. Access admin panel: `https://your-app-url.com/admin`
2. Login with initial credentials
3. **IMPORTANT**: Change admin password immediately
4. Create API keys for your applications
5. Test API endpoints

## Monitoring

- Check platform logs (Cyclic/Render/Fly.io) for errors
- Monitor MongoDB Atlas for connection issues
- Check email service for delivery issues
- Set up uptime monitoring (UptimeRobot, Better Uptime - both free)

## Troubleshooting

### Database Connection Issues
- Verify MongoDB URI is correct
- Check IP whitelist in MongoDB Atlas
- Ensure database user has proper permissions

### Session Issues
- Verify `SESSION_SECRET` is set
- Check that cookies are enabled
- For all platforms, ensure `trust proxy` is enabled (already in code)
- On Cyclic/Render, check that sessions are persisting (MongoDB session store)

### Email Issues
- Verify Resend API key is correct
- Check email domain verification
- Review Resend dashboard for delivery status

## Scaling Considerations

For millions of users:
- Upgrade MongoDB Atlas to paid tier (better performance)
- Use Redis for session storage (faster)
- Implement caching layer
- Use CDN for static assets
- Consider load balancing


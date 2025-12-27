# 🚀 Step-by-Step: Deploy to Render

Complete guide to deploy Kyvex.ai API Proxy on Render (Free Tier)

---

## 📋 Prerequisites Checklist

Before starting, make sure you have:

- [x] GitHub repository: `aakash688/reverse-kyvex.ai` (already done ✅
- [x] MongoDB Atlas account and connection string
- [x] Resend API key
- [x] All credentials ready

---

## Step 1: Prepare MongoDB Atlas

### 1.1 Whitelist IP Address

**This is REQUIRED** - Render needs to connect to MongoDB!

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Login with: `aakash@lnovic.com` / `Ram@214387`
3. Click **"Network Access"** in the left sidebar
4. Click **"Add IP Address"** button
5. Click **"Allow Access from Anywhere"** (or manually enter `0.0.0.0/0`)
6. Click **"Confirm"**

✅ **Done!** MongoDB is now accessible from Render.

---

## Step 2: Create Render Account

1. Go to [Render.com](https://render.com)
2. Click **"Get Started for Free"** (top right)
3. Click **"Sign up with GitHub"**
4. Authorize Render to access your GitHub account
5. Complete signup if prompted

✅ **Done!** You're logged into Render.

---

## Step 3: Create New Web Service

1. In Render dashboard, click **"New +"** button (top right)
2. Select **"Web Service"** from the dropdown

---

## Step 4: Connect GitHub Repository

1. You'll see "Connect a repository" screen
2. If your repo doesn't appear, click **"Configure account"** and authorize
3. Find and click on: **`aakash688/reverse-kyvex.ai`**
4. Click **"Connect"**

✅ **Repository connected!**

---

## Step 5: Configure Service Settings

Fill in these settings:

### Basic Settings:

- **Name**: `kyvex-api-proxy` (or any name you prefer)
- **Region**: Choose closest to you (e.g., `Oregon (US West)`)
- **Branch**: `main` (should be auto-selected)
- **Root Directory**: Leave empty (default: root)
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: Select **"Free"** (Free tier)

### Advanced Settings (Click to expand):

- **Auto-Deploy**: `Yes` (deploy on every push to main)
- **Health Check Path**: `/health` (optional but recommended)

✅ **Configuration done!**

---

## Step 6: Add Environment Variables

**This is the most important step!**

Click **"Advanced"** → **"Add Environment Variable"** and add each one:

### Copy and paste these one by one:

```
PORT=3000
```

```
NODE_ENV=production
```

```
MONGODB_URI=mongodb+srv://aakash_db_user:0zbr3r5EA1wl2Ieg@aakash.sq09shj.mongodb.net/kyvex-api?retryWrites=true&w=majority
```

```
KYVEX_API_URL=https://kyvex.ai/api/v1
```

```
SESSION_SECRET=V9ZdQSUGxrXvuof1Gm1GCD3Pi0eHMXmOtlWLGlHOqcY=
```

```
SESSION_NAME=admin_session
```

```
SESSION_MAX_AGE=86400000
```

```
ADMIN_INITIAL_USERNAME=admin
```

```
ADMIN_INITIAL_PASSWORD=YourSecurePassword123!
```
⚠️ **Change this to your secure password!**

```
ADMIN_INITIAL_EMAIL=aakash@lnovic.com
```

```
EMAIL_PROVIDER=resend
```

```
RESEND_API_KEY=re_45aVXFjE_7JRDVxj5Hizkqs9VFivDZjRf
```

```
EMAIL_FROM=aakash@lnovic.com
```

```
KEEP_ALIVE_ENABLED=true
```

```
KEEP_ALIVE_INTERVAL=300000
```

```
BCRYPT_ROUNDS=10
```

```
PASSWORD_RESET_EXPIRY=3600000
```

✅ **All environment variables added!**

---

## Step 7: Deploy

1. Scroll to the bottom
2. Click **"Create Web Service"** button
3. Render will start building your app
4. You'll see build logs in real-time

⏳ **Wait for deployment** (usually 2-5 minutes)

---

## Step 8: Monitor Deployment

Watch the build logs:

1. **Build Phase**: Installing dependencies (`npm install`)
2. **Deploy Phase**: Starting your app
3. **Success**: You'll see "Your service is live at..."

✅ **Deployment complete!**

---

## Step 9: Get Your App URL

Once deployed, you'll see:

- **Service URL**: `https://kyvex-api-proxy.onrender.com` (or similar)
- Copy this URL - this is your API endpoint!

---

## Step 10: Test Your Deployment

### 10.1 Test Health Endpoint

Open in browser:
```
https://your-app-name.onrender.com/health
```

Should return:
```json
{
  "status": "healthy",
  "timestamp": "...",
  "database": "connected"
}
```

### 10.2 Test Admin Panel

1. Go to: `https://your-app-name.onrender.com/admin`
2. Login with:
   - **Username**: `admin`
   - **Password**: (the password you set in `ADMIN_INITIAL_PASSWORD`)

✅ **If you can login, everything works!**

---

## Step 11: Set Up Keep-Alive (Prevent Sleep)

Your app has built-in keep-alive, but add external backup:

### Option A: UptimeRobot (Recommended)

1. Go to [UptimeRobot.com](https://uptimerobot.com)
2. Sign up (free, 50 monitors)
3. Click **"Add New Monitor"**
4. Configure:
   - **Monitor Type**: `HTTP(s)`
   - **Friendly Name**: `Kyvex API Keep-Alive`
   - **URL**: `https://your-app-name.onrender.com/health`
   - **Monitoring Interval**: `5 minutes`
5. Click **"Create Monitor"**

✅ **App will stay awake 24/7!**

### Option B: Cron-Job.org

1. Go to [Cron-Job.org](https://cron-job.org)
2. Sign up (free)
3. Click **"Create cronjob"**
4. Configure:
   - **Title**: `Kyvex API Keep-Alive`
   - **Address**: `https://your-app-name.onrender.com/keepalive`
   - **Schedule**: `*/5 * * * *` (every 5 minutes)
5. Click **"Create"**

✅ **Backup keep-alive active!**

---

## Step 12: Create Your First API Key

1. Login to admin panel: `https://your-app-name.onrender.com/admin`
2. Go to **"API Keys"** in sidebar
3. Click **"Create New API Key"**
4. Fill in:
   - **Name**: `My First API Key` (optional)
   - **Rate Limit**: Leave empty (unlimited) or set a limit
5. Click **"Create API Key"**
6. **Copy the API key immediately** - you won't see it again!

✅ **API key created!**

---

## Step 13: Test API Endpoint

### Test with curl:

```bash
curl https://your-app-name.onrender.com/v1/models \
  -H "Authorization: Bearer sk-your-api-key-here"
```

### Test Chat Completions:

```bash
curl https://your-app-name.onrender.com/v1/chat/completions \
  -H "Authorization: Bearer sk-your-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-sonnet-4.5",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": true
  }'
```

✅ **API is working!**

---

## 🎉 Deployment Complete!

### Your App URLs:

- **API Base**: `https://your-app-name.onrender.com`
- **Health Check**: `https://your-app-name.onrender.com/health`
- **Admin Panel**: `https://your-app-name.onrender.com/admin`
- **Models Endpoint**: `https://your-app-name.onrender.com/v1/models`
- **Chat Endpoint**: `https://your-app-name.onrender.com/v1/chat/completions`

### What's Working:

- ✅ API endpoints (OpenAI-compatible)
- ✅ Admin panel with authentication
- ✅ API key management
- ✅ Analytics dashboard
- ✅ Keep-alive (stays awake 24/7)
- ✅ Thread management
- ✅ Usage tracking

---

## 🔧 Troubleshooting

### App Not Starting?

1. Check **Logs** tab in Render dashboard
2. Look for error messages
3. Common issues:
   - MongoDB connection failed → Check IP whitelist
   - Missing environment variable → Add it
   - Port error → Should be `PORT=3000` (Render sets this automatically)

### Can't Connect to MongoDB?

1. Go to MongoDB Atlas → Network Access
2. Verify `0.0.0.0/0` is added
3. Check connection string in environment variables
4. Test connection string locally first

### Admin Login Not Working?

1. Check `ADMIN_INITIAL_USERNAME` and `ADMIN_INITIAL_PASSWORD` in environment variables
2. Make sure password doesn't have special characters that need escaping
3. Try resetting password via "Forgot Password"

### App Sleeping?

1. Check `KEEP_ALIVE_ENABLED=true` is set
2. Set up UptimeRobot or Cron-Job (external keep-alive)
3. Check Render logs for keep-alive ping messages

---

## 📊 Monitoring

### View Logs:

1. Go to Render dashboard
2. Click on your service
3. Click **"Logs"** tab
4. See real-time logs

### View Metrics:

1. Click **"Metrics"** tab
2. See:
   - CPU usage
   - Memory usage
   - Request count
   - Response times

---

## 🔄 Updating Your App

### Automatic Updates:

- Every push to `main` branch automatically deploys
- Render will rebuild and redeploy automatically

### Manual Deploy:

1. Go to Render dashboard
2. Click on your service
3. Click **"Manual Deploy"**
4. Select branch and click **"Deploy"**

---

## 💰 Free Tier Limits

Render Free Tier includes:

- ✅ 512 MB RAM
- ✅ 0.1 CPU
- ✅ Unlimited requests (no limits!)
- ⚠️ Sleeps after 15 min inactivity (prevented by keep-alive)
- ✅ Auto-deploy from Git
- ✅ Custom domains
- ✅ HTTPS included

**With keep-alive enabled, your app stays awake 24/7!**

---

## 🎯 Next Steps

1. ✅ Deploy to Render
2. ✅ Set up keep-alive
3. ✅ Create API keys
4. ✅ Test endpoints
5. ✅ Integrate with your mobile app/application
6. ✅ Monitor usage in admin panel

---

## 📞 Need Help?

- Check Render logs for errors
- Review MongoDB Atlas connection
- Verify all environment variables are set
- Test health endpoint first

**You're all set! 🚀**

---

Made with ❤️ by [Aakash Singh](https://github.com/aakash688)


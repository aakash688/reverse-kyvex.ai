# 🚀 Deploy to Koyeb (No Credit Card Required)

Complete step-by-step guide to deploy on Koyeb free tier.

---

## ✅ Why Koyeb?

- ⚠️ **Credit card required** (temporary $1 hold, refunded immediately)
- ✅ Easy GitHub integration
- ✅ Auto-deploy from Git
- ✅ Free PostgreSQL (if needed)
- ✅ Custom domains
- ✅ Works with your current codebase
- ✅ **Don't charge for free tier** (card is for verification)

**Limitation:** May sleep after inactivity (but wakes on first request)

---

## Step 1: Sign Up for Koyeb

1. Go to [Koyeb.com](https://www.koyeb.com)
2. Click **"Get Started"** or **"Sign Up"**
3. Click **"Sign up with GitHub"**
4. Authorize Koyeb to access your GitHub
5. Complete signup
6. **Add credit card** (required for verification)
   - Temporary $1 hold will be placed
   - **Refunded immediately**
   - **No charges for free tier**
   - Card is for verification/abuse prevention only

---

## Step 2: Create New App

1. In Koyeb dashboard, click **"Create App"** button
2. You'll see "Create a Koyeb App" screen

---

## Step 3: Connect GitHub Repository

1. Under "Source", click **"GitHub"**
2. If not connected, click **"Connect GitHub"** and authorize
3. Find and select: **`aakash688/reverse-kyvex.ai`**
4. Select branch: **`main`**

---

## Step 4: Configure App Settings

### Basic Configuration:

- **Name**: `kyvex-api-proxy` (or your choice)
- **Region**: Choose closest to you
- **Instance Type**: **Starter** (Free tier - 512MB RAM, 0.1 vCPU)

### Build & Run Settings:

- **Build Command**: `npm install`
- **Run Command**: `npm start`
- **Port**: `3000` (or leave default)

---

## Step 5: Add Environment Variables

Click **"Advanced"** or **"Environment Variables"** section and add:

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
EMAIL_FROM=onboarding@resend.dev
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

---

## Step 6: Deploy

1. Review all settings
2. Click **"Deploy"** or **"Create App"** button
3. Koyeb will start building your app
4. Watch the build logs

⏳ **Wait 2-5 minutes** for deployment.

---

## Step 7: Get Your App URL

After deployment, you'll see:

- **App URL**: `https://kyvex-api-proxy-xxxxx.koyeb.app`
- Or custom domain if you set one up

**Your app is live!** 🎉

---

## Step 8: Test Your Deployment

### Test Health Endpoint:

Open in browser:
```
https://your-app-name.koyeb.app/health
```

Should return:
```json
{
  "status": "healthy",
  "timestamp": "...",
  "database": "connected"
}
```

### Test Admin Panel:

1. Go to: `https://your-app-name.koyeb.app/admin`
2. Login with:
   - Username: `admin`
   - Password: (the one you set in `ADMIN_INITIAL_PASSWORD`)

---

## Step 9: Set Up Keep-Alive (Prevent Sleep)

Koyeb may sleep after inactivity. Set up keep-alive:

### Option A: UptimeRobot

1. Go to [UptimeRobot.com](https://uptimerobot.com)
2. Sign up (free, 50 monitors)
3. Add monitor:
   - Type: `HTTP(s)`
   - URL: `https://your-app-name.koyeb.app/health`
   - Interval: `5 minutes`
4. Create monitor

### Option B: Cron-Job.org

1. Go to [Cron-Job.org](https://cron-job.org)
2. Sign up (free)
3. Create cronjob:
   - URL: `https://your-app-name.koyeb.app/keepalive`
   - Schedule: `*/5 * * * *` (every 5 minutes)

✅ **App will stay awake!**

---

## Step 10: View Logs

1. Go to Koyeb dashboard
2. Click on your app
3. Click **"Logs"** tab
4. See real-time logs

---

## 🔧 Troubleshooting

### App Not Starting?

1. Check **Logs** tab for errors
2. Verify all environment variables are set
3. Check MongoDB IP whitelist (`0.0.0.0/0`)

### Can't Connect to MongoDB?

1. Go to MongoDB Atlas → Network Access
2. Verify `0.0.0.0/0` is whitelisted
3. Check connection string in environment variables

### App Sleeping?

1. Set up UptimeRobot or Cron-Job (see Step 9)
2. Check `KEEP_ALIVE_ENABLED=true` is set
3. First request after sleep may take 10-30 seconds

---

## 📊 Koyeb Free Tier

**Includes:**
- ✅ 512 MB RAM
- ✅ 0.1 vCPU
- ✅ Unlimited requests (no limits!)
- ✅ Auto-deploy from Git
- ✅ Custom domains
- ✅ HTTPS included
- ⚠️ May sleep after inactivity (prevented by keep-alive)

**With keep-alive enabled, your app stays awake!**

---

## 🔄 Updating Your App

**Automatic:**
- Every push to `main` branch automatically deploys
- Koyeb will rebuild and redeploy

**Manual:**
1. Go to Koyeb dashboard
2. Click on your app
3. Click **"Redeploy"**

---

## 📋 Summary

1. ✅ Sign up at Koyeb (no credit card)
2. ✅ Connect GitHub repo
3. ✅ Configure app settings
4. ✅ Add all environment variables
5. ✅ Deploy
6. ✅ Set up keep-alive
7. ✅ Test your app

**Your app is live at: `https://your-app-name.koyeb.app`**

---

## 🎯 Next Steps

1. ✅ Deploy to Koyeb
2. ✅ Set up keep-alive (UptimeRobot)
3. ✅ Create API keys in admin panel
4. ✅ Test API endpoints
5. ✅ Integrate with your application

---

**Need help?** Check Koyeb docs: https://www.koyeb.com/docs

---

Made with ❤️ by [Aakash Singh](https://github.com/aakash688)


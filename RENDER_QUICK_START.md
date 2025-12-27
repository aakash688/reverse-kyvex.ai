# ⚡ Render Quick Start (5 Minutes)

## 🚀 Fast Deployment Steps

### 1. MongoDB IP Whitelist (30 seconds)
- Go to MongoDB Atlas → Network Access
- Add IP: `0.0.0.0/0`
- Click Confirm

### 2. Render Setup (2 minutes)
1. Go to [Render.com](https://render.com) → Sign up with GitHub
2. Click **"New +"** → **"Web Service"**
3. Connect repo: `aakash688/reverse-kyvex.ai`
4. Settings:
   - **Name**: `kyvex-api-proxy`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

### 3. Environment Variables (2 minutes)
Click **"Advanced"** → Add these variables (copy from `ENV_CONFIGURATION.md`):

**Essential ones:**
- `MONGODB_URI` (your connection string)
- `SESSION_SECRET` (already generated)
- `ADMIN_INITIAL_PASSWORD` (set your password!)
- `RESEND_API_KEY` (your key)
- `KEEP_ALIVE_ENABLED=true`

### 4. Deploy (1 minute)
- Click **"Create Web Service"**
- Wait 2-5 minutes
- Get your URL: `https://your-app.onrender.com`

### 5. Keep-Alive Setup (30 seconds)
- Go to [UptimeRobot.com](https://uptimerobot.com)
- Add monitor: `https://your-app.onrender.com/health`
- Interval: 5 minutes

## ✅ Done!

Your app is live at: `https://your-app.onrender.com`

- Admin: `/admin`
- Health: `/health`
- API: `/v1/chat/completions`

---

**Full guide**: See `RENDER_DEPLOYMENT_GUIDE.md` for detailed steps.


# Render Keep-Alive Setup Guide

## Why Keep-Alive?

Render's free tier puts apps to sleep after 15 minutes of inactivity. This guide shows you how to keep your app awake 24/7 for free.

## Method 1: Built-in Keep-Alive (Automatic)

The app includes a built-in keep-alive service that automatically pings itself.

### Setup:

1. After deploying to Render, note your app URL (e.g., `https://your-app.onrender.com`)

2. In Render dashboard, go to Environment variables and add:
   ```
   KEEP_ALIVE_ENABLED=true
   KEEP_ALIVE_INTERVAL=300000
   ```
   (Render automatically sets `RENDER_EXTERNAL_URL`, so `APP_URL` is optional)

3. The service will automatically start pinging `/health` every 5 minutes

## Method 2: External Service (Recommended as Backup)

Use an external service to ping your app as a backup.

### Option A: UptimeRobot (Easiest)

1. Go to https://uptimerobot.com
2. Sign up (free, 50 monitors)
3. Click "Add New Monitor"
4. Configure:
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: Kyvex API Keep-Alive
   - **URL**: `https://your-app.onrender.com/health`
   - **Monitoring Interval**: 5 minutes
5. Click "Create Monitor"

### Option B: Cron-Job.org

1. Go to https://cron-job.org
2. Sign up (free)
3. Click "Create cronjob"
4. Configure:
   - **Title**: Kyvex API Keep-Alive
   - **Address**: `https://your-app.onrender.com/keepalive`
   - **Schedule**: Every 5 minutes (`*/5 * * * *`)
5. Click "Create"

### Option C: GitHub Actions (If repo is on GitHub)

Create `.github/workflows/keepalive.yml`:

```yaml
name: Keep-Alive Ping

on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes
  workflow_dispatch:

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping App
        run: |
          curl -f https://your-app.onrender.com/health || exit 1
```

## Method 3: Use All Methods (Most Reliable)

For maximum reliability:
1. ✅ Enable built-in keep-alive (automatic)
2. ✅ Set up UptimeRobot (external backup)
3. ✅ Set up Cron-Job.org (second backup)

This triple-layer approach ensures your app stays awake even if one method fails.

## Testing

1. Deploy your app to Render
2. Wait 20 minutes
3. Try accessing your app - it should respond immediately (not sleep)
4. Check Render logs to see keep-alive pings

## Troubleshooting

**App still sleeping?**
- Check that `KEEP_ALIVE_ENABLED=true` is set
- Verify external service is actually pinging (check logs)
- Ensure ping interval is less than 15 minutes (we use 5 minutes)
- Check Render logs for keep-alive ping messages

**Keep-alive not working?**
- Verify `RENDER_EXTERNAL_URL` is set (Render sets this automatically)
- Or manually set `APP_URL` to your Render URL
- Check that `/health` endpoint is accessible
- Review server logs for keep-alive service messages

## Cost

All methods are **100% free**:
- Built-in keep-alive: Free (uses your app's resources)
- UptimeRobot: Free (50 monitors)
- Cron-Job.org: Free
- GitHub Actions: Free (2000 minutes/month)

## Result

With keep-alive enabled, your Render app will:
- ✅ Stay awake 24/7
- ✅ Respond instantly to requests
- ✅ No cold starts
- ✅ Free forever (as long as Render free tier exists)


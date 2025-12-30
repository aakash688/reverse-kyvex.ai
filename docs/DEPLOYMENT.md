# 🚀 Deployment Guide

Complete deployment procedures for production.

## Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Secrets set in Cloudflare
- [ ] Database schema applied
- [ ] Admin user created
- [ ] Initial cookies generated
- [ ] Models configured

## Deployment Steps

### 1. Deploy API Worker

```bash
cd api

# Set all secrets (if not already set)
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_ANON_KEY
wrangler secret put JWT_SECRET
wrangler secret put ADMIN_PANEL_URL

# Deploy
wrangler deploy
```

**Verify:**
```bash
curl https://your-worker.workers.dev/
# Should return API info or 404
```

### 2. Deploy Admin Panel

```bash
cd admin-panel

# Build
npm run build

# Deploy
wrangler pages deploy dist --project-name=kyvex-admin-panel
```

**Verify:**
- Visit admin panel URL
- Should load login page

### 3. Update ADMIN_PANEL_URL Secret

```bash
cd api
wrangler secret put ADMIN_PANEL_URL
# Enter: https://kyvex-admin-panel.pages.dev
wrangler deploy  # Redeploy to apply
```

## Post-Deployment

### 1. Verify Deployment

**Check API Worker:**
```bash
curl https://your-worker.workers.dev/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Check Admin Panel:**
- Visit admin panel URL
- Login with admin credentials
- Verify all pages load

### 2. Initial Setup

1. **Login to Admin Panel**
2. **Generate Cookies** - Generate 50-100 initial cookies
3. **Create Models** - Configure your custom models
4. **Create API Keys** - Generate API keys for users

### 3. Monitor

**Check Logs:**
```bash
wrangler tail
```

**Check Metrics:**
- Cloudflare Dashboard → Workers
- View request metrics, errors, CPU time

## Environment-Specific Configuration

### Development

```bash
# Use .dev.vars for local development
wrangler dev
```

### Staging

```bash
# Use separate worker name
wrangler deploy --name kyvex-api-staging
```

### Production

```bash
# Use production worker
wrangler deploy --name kyvex-api
```

## Rollback Procedure

### Rollback Worker

```bash
# List versions
wrangler versions list

# Rollback to previous version
wrangler rollback VERSION_ID
```

### Rollback Admin Panel

```bash
# Cloudflare Pages automatically keeps versions
# Rollback via Cloudflare Dashboard
```

## Monitoring

### Cloudflare Dashboard

1. **Workers & Pages** → Your Worker
2. **Metrics**:
   - Requests per second
   - Error rate
   - CPU time
   - Subrequests

### Logs

```bash
# Real-time logs
wrangler tail

# Filtered logs
wrangler tail --format pretty | grep ERROR
```

### Database Monitoring

- Supabase Dashboard → Database
- Check connection pool
- Monitor query performance

## Scaling

### Automatic Scaling

Cloudflare Workers auto-scale:
- No configuration needed
- Handles traffic spikes
- Global edge distribution

### Database Scaling

- Supabase auto-scales
- Upgrade plan if needed
- Monitor connection limits

## Security

### Secrets Management

```bash
# Rotate secrets regularly
wrangler secret put JWT_SECRET
# Generate new secret
# Update all services
# Redeploy
```

### CORS Configuration

```javascript
// In api/src/index.js
const corsHeaders = {
  'Access-Control-Allow-Origin': env.ADMIN_PANEL_URL,
  // ...
};
```

### API Key Security

- Store API keys securely
- Rotate keys periodically
- Monitor for unauthorized access

## Backup & Recovery

### Database Backup

Supabase provides automatic backups:
- Daily backups (free tier)
- Point-in-time recovery (paid tier)

### Manual Backup

```sql
-- Export data
pg_dump -h db.xxx.supabase.co -U postgres -d postgres > backup.sql
```

### Recovery

```sql
-- Restore from backup
psql -h db.xxx.supabase.co -U postgres -d postgres < backup.sql
```

## Maintenance

### Regular Tasks

1. **Monitor Cookie Pool** - Ensure healthy pool size
2. **Check Logs** - Review errors regularly
3. **Update Dependencies** - Keep packages updated
4. **Rotate Secrets** - Change secrets periodically

### Scheduled Maintenance

- **Weekly**: Review analytics
- **Monthly**: Update dependencies
- **Quarterly**: Security audit

## Troubleshooting Deployment

### Issue: Worker not deploying

**Check:**
- Wrangler login status
- Worker name conflicts
- Build errors

**Solution:**
```bash
wrangler login
wrangler whoami
wrangler deploy --name unique-name
```

### Issue: Admin panel not loading

**Check:**
- Build succeeded
- Correct deployment
- CORS configuration

**Solution:**
```bash
cd admin-panel
npm run build
wrangler pages deploy dist
```

### Issue: Database connection errors

**Check:**
- Supabase project active
- Correct URL and key
- Network connectivity

**Solution:**
- Verify Supabase project status
- Check secrets: `wrangler secret list`
- Test connection manually

## Performance Optimization

### Worker Optimization

1. **Minimize Subrequests** - Batch operations
2. **Use Caching** - Cache settings/data
3. **Optimize Queries** - Use indexes
4. **Stream Responses** - For large data

### Database Optimization

1. **Add Indexes** - On frequently queried columns
2. **Connection Pooling** - Supabase handles this
3. **Query Optimization** - Use efficient queries

## Disaster Recovery

### Backup Strategy

1. **Database**: Supabase automatic backups
2. **Code**: Git repository
3. **Secrets**: Document in secure location

### Recovery Plan

1. **Code Recovery**: Clone from Git
2. **Database Recovery**: Restore from Supabase backup
3. **Secrets Recovery**: Restore from secure storage
4. **Redeploy**: Follow deployment steps

## Updates & Upgrades

### Update Worker

```bash
cd api
git pull
npm install  # If dependencies changed
wrangler deploy
```

### Update Admin Panel

```bash
cd admin-panel
git pull
npm install
npm run build
wrangler pages deploy dist
```

### Database Migrations

1. Create migration SQL
2. Test in staging
3. Apply to production
4. Verify changes

## Support & Resources

- **Cloudflare Docs**: https://developers.cloudflare.com/workers/
- **Supabase Docs**: https://supabase.com/docs
- **Wrangler CLI**: https://developers.cloudflare.com/workers/wrangler/


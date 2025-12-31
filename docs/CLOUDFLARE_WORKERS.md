# ☁️ Cloudflare Workers Guide

Complete guide to Cloudflare Workers deployment and configuration.

## What are Cloudflare Workers?

Cloudflare Workers is a serverless platform that runs JavaScript at the edge, close to your users. It provides:

- **Global Edge Network** - Runs in 300+ locations worldwide
- **Zero Cold Starts** - Instant execution
- **Automatic Scaling** - Handles traffic spikes automatically
- **Built-in Security** - DDoS protection, WAF, SSL

## Worker Architecture

### Entry Point

The worker entry point is `api/src/index.js`:

```javascript
export default {
  async fetch(request, env, ctx) {
    // Handle HTTP requests
  },
  async scheduled(event, env, ctx) {
    // Handle cron triggers
  }
}
```

### Request Handling

1. **CORS Preflight** - Handle OPTIONS requests
2. **Environment Setup** - Initialize ENV for modules
3. **Routing** - Route to appropriate handlers
4. **Response** - Return formatted response

### Cron Triggers

Scheduled tasks run automatically:

```javascript
async scheduled(event, env, ctx) {
  // Runs every 6 hours
  // - Cleanup exhausted cookies
  // - Auto-replenish cookie pool
}
```

## Configuration

### wrangler.toml

```toml
name = "kyvex-api"
main = "src/index.js"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[vars]
KYVEX_BASE_URL = "https://kyvex.ai"

[triggers]
crons = ["0 */6 * * *"]  # Every 6 hours
```

### Environment Variables

**Public Variables** (in wrangler.toml):
- `KYVEX_BASE_URL` - Upstream API URL

**Secrets** (set via CLI):
- `SUPABASE_URL` - Database URL
- `SUPABASE_ANON_KEY` - Database key
- `JWT_SECRET` - Token signing secret
- `ADMIN_PANEL_URL` - CORS origin
- `RESEND_API_KEY` - (Optional) Email service

## Deployment

### Initial Deployment

```bash
cd api
wrangler login
wrangler deploy
```

### Update Secrets

```bash
wrangler secret put SECRET_NAME
# Enter value when prompted
```

### View Logs

```bash
wrangler tail
# Real-time log streaming
```

### Local Development

```bash
wrangler dev
# Runs on http://localhost:8787
```

## Worker Limits

### Free Tier

- **CPU Time**: 50ms per request
- **Memory**: 128MB
- **Subrequests**: 50 per request
- **Cron Triggers**: Unlimited
- **Requests**: 100,000/day

### Paid Tier

- **CPU Time**: 30 seconds per request
- **Memory**: 128MB
- **Subrequests**: 50 per request
- **Cron Triggers**: Unlimited
- **Requests**: Unlimited

## Best Practices

### 1. Environment Variables

**Never hardcode secrets:**
```javascript
// ❌ Bad
const secret = "my-secret-key";

// ✅ Good
const secret = env.JWT_SECRET;
```

### 2. Error Handling

```javascript
try {
  // Operation
} catch (error) {
  console.error('Error:', error);
  return errorResponse(error.message, 500);
}
```

### 3. Async Operations

**Don't block the request:**
```javascript
// ✅ Good - Fire and forget
ctx.waitUntil(asyncOperation());

// ❌ Bad - Blocks request
await asyncOperation();
```

### 4. Response Streaming

```javascript
const stream = new ReadableStream({
  async start(controller) {
    // Stream data
    controller.enqueue(data);
    controller.close();
  }
});

return new Response(stream, {
  headers: { 'Content-Type': 'text/event-stream' }
});
```

## Common Issues

### Issue: "Worker exceeded CPU time limit"

**Causes:**
- Long-running operations
- Too many subrequests
- Infinite loops

**Solutions:**
- Use `ctx.waitUntil()` for background tasks
- Batch operations
- Optimize database queries

### Issue: "Too many subrequests"

**Causes:**
- Multiple database calls
- Sequential API calls

**Solutions:**
- Batch database operations
- Use `Promise.all()` for parallel requests
- Reduce number of calls

### Issue: "Module not found"

**Causes:**
- Missing imports
- Incorrect file paths

**Solutions:**
- Use ES module syntax: `import/export`
- Check file paths are correct
- Ensure all dependencies are available

## Monitoring

### Cloudflare Dashboard

1. Go to Workers & Pages
2. Select your worker
3. View:
   - **Metrics** - Requests, errors, CPU time
   - **Logs** - Real-time logs
   - **Analytics** - Usage statistics

### Wrangler Tail

```bash
wrangler tail
# Shows real-time logs
# Filter: wrangler tail --format pretty
```

### Custom Logging

```javascript
console.log('[Service] Message');  // Info
console.error('[Service] Error');  // Error
console.warn('[Service] Warning'); // Warning
```

## Cron Jobs

### Configuration

```toml
[triggers]
crons = ["0 */6 * * *"]  # Every 6 hours
```

### Cron Syntax

```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6)
│ │ │ │ │
* * * * *
```

**Examples:**
- `0 */6 * * *` - Every 6 hours
- `0 0 * * *` - Daily at midnight
- `*/30 * * * *` - Every 30 minutes

### Cron Handler

```javascript
async scheduled(event, env, ctx) {
  // event.cron contains the cron expression
  // event.scheduledTime contains the execution time
  
  // Your scheduled task
  await performTask();
}
```

## Performance Optimization

### 1. Minimize Subrequests

```javascript
// ❌ Bad - 50 subrequests
for (let i = 0; i < 50; i++) {
  await fetch(url);
}

// ✅ Good - Batch operations
const results = await Promise.all(
  Array(50).fill().map(() => fetch(url))
);
```

### 2. Cache Responses

```javascript
// Cache settings in memory
let cachedSettings = null;

async function getSettings() {
  if (cachedSettings) return cachedSettings;
  cachedSettings = await fetchSettings();
  return cachedSettings;
}
```

### 3. Use Streams

```javascript
// Stream large responses
const stream = new ReadableStream({
  async start(controller) {
    // Stream chunks
  }
});
```

## Security

### CORS Configuration

```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': env.ADMIN_PANEL_URL,
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};
```

### Input Validation

```javascript
if (!model || !messages) {
  return errorResponse('Missing required fields', 400);
}
```

### Secret Management

- Never commit secrets to git
- Use `wrangler secret put` for sensitive data
- Rotate secrets regularly

## Debugging

### Local Testing

```bash
wrangler dev
# Test locally before deploying
```

### Log Analysis

```bash
wrangler tail --format pretty
# View formatted logs
```

### Error Tracking

```javascript
try {
  // Operation
} catch (error) {
  console.error('[Handler] Error:', {
    message: error.message,
    stack: error.stack,
    context: additionalContext
  });
  throw error;
}
```

## Deployment Checklist

- [ ] All secrets configured
- [ ] Environment variables set
- [ ] Cron triggers configured
- [ ] CORS headers correct
- [ ] Error handling in place
- [ ] Logging added
- [ ] Tested locally
- [ ] Deployed to production
- [ ] Verified logs
- [ ] Tested endpoints

## Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [Workers Examples](https://github.com/cloudflare/workers-examples)



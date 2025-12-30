# Kyvex Proxy POC - Automatic Cookie Rotation

## 🎯 Overview

This POC demonstrates **automatic browserId rotation** to bypass kyvex.ai rate limits. Each browserId has a 50 request/day limit, so rotating through multiple browserIds allows unlimited requests.

## ✅ Your Analysis is CORRECT!

**Yes, changing browserId allows unlimited requests!**

- Each `browserId=BRWS-...` is a separate session
- Each session has its own 50 request/day limit
- Rotating through multiple browserIds = unlimited capacity
- Format: `BRWS-` + 32 alphanumeric characters

## 🚀 Features

### Automatic Cookie Management

1. **Auto-Generation**: Generates browserIds automatically
2. **Smart Rotation**: Uses cookies with lowest usage first
3. **Usage Tracking**: Tracks requests per cookie
4. **Auto-Replenish**: Generates new cookies when running low
5. **Rate Limit Detection**: Detects and handles rate limits

### Cookie Pool System

- **Initial Pool**: Starts with 10 cookies (500 requests/day capacity)
- **Auto-Generate**: Maintains minimum 5 available cookies
- **Smart Selection**: Chooses cookie with lowest usage
- **Usage Tracking**: Tracks requests per cookie per day

## 📋 Usage

### Start the Server

```bash
cd kyvex-proxy-poc
npm install
node index.js
```

### Make Requests

```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "kyvex",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

The system automatically:
1. Selects best available cookie
2. Makes request with that cookie
3. Tracks usage
4. Rotates to next cookie when needed
5. Auto-generates new cookies when low

### Check Statistics

```bash
curl http://localhost:3000/admin/stats
```

Response:
```json
{
  "success": true,
  "total": 10,
  "available": 8,
  "exhausted": 2,
  "totalRequests": 150,
  "cookies": [
    {
      "browserId": "BRWS-abc123...",
      "requestsToday": 5,
      "lastUsed": "2024-01-15T10:30:00Z"
    },
    ...
  ]
}
```

### Generate More Cookies

```bash
curl -X POST http://localhost:3000/admin/generate-cookies \
  -H "Content-Type: application/json" \
  -d '{"count": 5}'
```

### Reset Counters (Testing)

```bash
curl -X POST http://localhost:3000/admin/reset-counters
```

## 🔍 How It Works

### Cookie Generation

```javascript
// Format: BRWS- + 32 random alphanumeric characters
function generateBrowserId() {
  return `BRWS-${generateRandomString(32)}`;
}
```

### Cookie Selection Algorithm

1. Filter cookies with `requestsToday < 50`
2. Sort by:
   - Lowest `requestsToday` first
   - Oldest `lastUsed` first (if tied)
3. Use selected cookie
4. Increment `requestsToday`
5. Auto-generate if available < 5

### Rate Limit Handling

- Detects rate limit errors in response
- Marks cookie as exhausted
- Auto-generates new cookies
- Continues with next available cookie

## 📊 Capacity Calculation

| Cookies | Daily Capacity |
|---------|---------------|
| 10      | 500 requests  |
| 20      | 1,000 requests|
| 50      | 2,500 requests|
| 100     | 5,000 requests|

**Formula**: `Capacity = Cookies × 50 requests/day`

## 🎯 Best Practices

### 1. Start with Enough Cookies

```javascript
// Initialize with 20 cookies = 1,000 requests/day
cookiePool.initialize(20);
```

### 2. Monitor Usage

```bash
# Check stats regularly
curl http://localhost:3000/admin/stats
```

### 3. Auto-Generate Threshold

```javascript
// Maintain at least 10 available cookies
cookiePool.minCookies = 10;
```

### 4. Handle Rate Limits

The system automatically:
- Detects rate limit errors
- Switches to next cookie
- Generates new cookies
- Continues seamlessly

## 🔧 Configuration

### Environment Variables

```bash
PORT=3000  # Server port (default: 3000)
```

### Code Configuration

```javascript
// In index.js
const cookiePool = new CookiePool();
cookiePool.maxRequestsPerCookie = 50;  // kyvex.ai limit
cookiePool.minCookies = 5;              // Auto-generate threshold
cookiePool.initialize(10);             // Initial cookie count
```

## 🧪 Testing

### Test Single Request

```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "kyvex",
    "messages": [{"role": "user", "content": "Test"}]
  }'
```

### Test Multiple Requests

```bash
# Make 100 requests
for i in {1..100}; do
  curl -X POST http://localhost:3000/v1/chat/completions \
    -H "Content-Type: application/json" \
    -d "{\"model\": \"kyvex\", \"messages\": [{\"role\": \"user\", \"content\": \"Request $i\"}]}" &
done
wait
```

### Check Cookie Rotation

```bash
# Check stats before
curl http://localhost:3000/admin/stats

# Make requests
# ... make requests ...

# Check stats after (should show rotation)
curl http://localhost:3000/admin/stats
```

## 📈 Monitoring

### Real-time Stats

```bash
# Watch stats in real-time
watch -n 1 'curl -s http://localhost:3000/admin/stats | jq'
```

### Logs

The server logs:
- Cookie selection: `📊 Using cookie: BRWS-abc... (5/50 requests)`
- Cookie addition: `✅ Added cookie: BRWS-xyz...`
- Rate limits: `❌ Rate limit detected for cookie: BRWS-...`
- Auto-generation: `⚠️  Low on cookies (3 available), generating 2 more...`

## 🎉 Advantages

### vs Manual Cookie Management

| Manual | Automatic |
|--------|-----------|
| ❌ Hardcode cookies | ✅ Auto-generate |
| ❌ Manual rotation | ✅ Smart rotation |
| ❌ Track usage manually | ✅ Automatic tracking |
| ❌ Handle limits manually | ✅ Auto-handle limits |
| ❌ Scale manually | ✅ Auto-scale |

### vs Single Cookie

| Single Cookie | Cookie Pool |
|---------------|-------------|
| 50 requests/day | Unlimited (with enough cookies) |
| Manual rotation | Automatic rotation |
| Hit limit = stop | Hit limit = continue |

## 🔐 Security Notes

- Cookies are generated randomly
- No authentication required (POC only)
- Add authentication for production
- Monitor usage to prevent abuse

## 🚀 Production Recommendations

1. **Add Authentication**: Protect admin endpoints
2. **Persist Cookies**: Store in database (not memory)
3. **Daily Reset**: Reset counters at midnight UTC
4. **Monitoring**: Add metrics and alerts
5. **Rate Limiting**: Add rate limiting to prevent abuse
6. **Error Handling**: Better error recovery
7. **Logging**: Structured logging

## 📝 API Reference

### POST /v1/chat/completions

Chat endpoint with automatic cookie rotation.

**Request:**
```json
{
  "model": "kyvex",
  "messages": [{"role": "user", "content": "Hello"}],
  "conversation_id": "optional-uuid"
}
```

**Response:** SSE stream (OpenAI format)

### GET /admin/stats

Get cookie pool statistics.

**Response:**
```json
{
  "success": true,
  "total": 10,
  "available": 8,
  "exhausted": 2,
  "totalRequests": 150,
  "cookies": [...]
}
```

### POST /admin/generate-cookies

Generate new cookies.

**Request:**
```json
{
  "count": 5
}
```

**Response:**
```json
{
  "success": true,
  "message": "Generated 5 cookies",
  "generated": 5,
  "stats": {...}
}
```

### POST /admin/reset-counters

Reset usage counters (for testing).

**Response:**
```json
{
  "success": true,
  "message": "Counters reset",
  "stats": {...}
}
```

## 🎯 Summary

**Your analysis is 100% correct!** 

- ✅ Changing browserId = new session = new 50 request limit
- ✅ Rotating browserIds = unlimited capacity
- ✅ This POC implements automatic rotation
- ✅ No manual work needed
- ✅ Scales automatically

The POC now:
1. Generates browserIds automatically
2. Rotates through them intelligently
3. Tracks usage per cookie
4. Auto-generates when needed
5. Handles rate limits gracefully

**You can now make unlimited requests!** 🚀


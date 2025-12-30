# 🏗️ System Architecture

## Overview

Kyvex API is a serverless, OpenAI-compatible proxy service that routes requests to kyvex.ai while providing unlimited conversations through intelligent cookie rotation.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  (Postman, Python SDK, JavaScript, cURL, etc.)             │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ HTTPS
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   Cloudflare Workers                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  API Worker (kyvex-api)                               │  │
│  │  - Request Routing                                    │  │
│  │  - Authentication (JWT)                               │  │
│  │  - Cookie Selection & Rotation                        │  │
│  │  - Response Streaming                                 │  │
│  │  - Model Mapping                                      │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
        ▼                               ▼
┌───────────────┐              ┌───────────────┐
│   Supabase    │              │   kyvex.ai    │
│  (PostgreSQL) │              │   (Upstream)  │
│               │              │               │
│ - API Keys    │              │ - AI Models   │
│ - Models      │              │ - Chat API    │
│ - Cookies     │              │ - Streaming   │
│ - Analytics   │              │               │
│ - Threads     │              │               │
└───────────────┘              └───────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│              Cloudflare Pages                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Admin Panel (React)                                  │  │
│  │  - Dashboard & Analytics                              │  │
│  │  - Cookie Pool Management                             │  │
│  │  - Model Configuration                                │  │
│  │  - API Key Management                                 │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Request Flow

### 1. Chat Completion Request

```
Client Request
    │
    ├─▶ POST /v1/chat/completions
    │   Headers: Authorization: Bearer <api_key>
    │   Body: { model, messages, stream, ... }
    │
    ▼
┌─────────────────────────────────────┐
│  Cloudflare Worker (index.js)       │
│  - Parse request                     │
│  - Verify API key                    │
│  - Route to chat handler            │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Chat Handler (chat.js)              │
│  - Map custom model → provider model│
│  - Get/create conversation thread   │
│  - Select cookie from pool           │
│  - Build kyvex.ai payload            │
└──────────────┬──────────────────────┘
               │
               ├─▶ Cookie Service
               │   - Get available cookie
               │   - Increment usage
               │   - Auto-replenish if needed
               │
               ▼
┌─────────────────────────────────────┐
│  Kyvex Service (kyvex.js)           │
│  - Proxy request to kyvex.ai         │
│  - Include browserId cookie          │
│  - Stream response back              │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Response Processing                │
│  - Replace kyvex.ai URLs             │
│  - Replace "Kyvex" → "sahyogAI"     │
│  - Map provider model → custom model │
│  - Stream to client                  │
└──────────────┬──────────────────────┘
               │
               ▼
         Client Response
```

### 2. Cookie Selection Flow

```
Request Arrives
    │
    ▼
┌─────────────────────────────────────┐
│  getAvailableCookie()               │
│  - Query active cookies              │
│  - Filter: usage_count < 45         │
│  - Check pool size                   │
└──────────────┬──────────────────────┘
               │
               ├─ Pool < 10?
               │  └─▶ Trigger auto-generation
               │
               ▼
         Select Cookie
               │
               ▼
         Use in Request
               │
               ▼
┌─────────────────────────────────────┐
│  incrementUsage()                    │
│  - Increment usage_count              │
│  - Check if >= 45                    │
│  └─▶ Delete if exhausted             │
│  - Check pool size again             │
│  └─▶ Trigger auto-gen if low         │
└──────────────────────────────────────┘
```

### 3. Auto-Generation Flow

```
Pool Check Triggered
    │
    ├─▶ getAvailableCookie() detects low pool
    ├─▶ incrementUsage() detects low pool
    ├─▶ Cron job (every 6 hours)
    └─▶ Manual trigger (admin panel)
    │
    ▼
┌─────────────────────────────────────┐
│  checkAndReplenishPool()            │
│  - Count available cookies           │
│  - Compare to threshold (10)        │
└──────────────┬──────────────────────┘
               │
               ├─ Available < 10?
               │
               ▼
┌─────────────────────────────────────┐
│  generateBatch(count)                │
│  - Generate BRWS-xxx IDs              │
│  - Insert via stored procedure       │
│  - Return success/error count        │
└──────────────────────────────────────┘
```

## Data Flow

### Database Schema

```
┌──────────────┐
│   api_keys   │
│  - id        │
│  - key       │
│  - analytics │
└──────┬───────┘
       │
       ├─▶ ┌──────────────┐
       │   │   threads    │
       │   │  - api_key_id│
       │   └──────────────┘
       │
       └─▶ ┌──────────────┐
           │ usage_logs   │
           │  - api_key_id│
           └──────────────┘

┌──────────────┐
│   models     │
│  - custom_name│
│  - provider_name│
│  - brand_name│
│  - permissions│
└──────────────┘

┌──────────────┐
│browser_cookies│
│  - browser_id│
│  - usage_count│
│  - is_active │
└──────────────┘

┌──────────────┐
│system_settings│
│  - key       │
│  - value     │
└──────────────┘
```

## Component Responsibilities

### API Worker (`api/src/index.js`)
- **Entry Point**: Handles all incoming requests
- **Routing**: Routes to appropriate handlers
- **CORS**: Handles CORS preflight requests
- **Cron**: Scheduled tasks (cookie cleanup, replenishment)

### Chat Handler (`api/src/handlers/chat.js`)
- **Request Processing**: Parses OpenAI-format requests
- **Model Mapping**: Maps custom names to provider models
- **Cookie Management**: Selects and uses cookies
- **Streaming**: Handles SSE response streaming
- **Response Transformation**: Replaces URLs and brand names

### Cookie Service (`api/src/services/cookieService.js`)
- **Generation**: Creates BRWS-xxx browser IDs
- **Pool Management**: Maintains cookie pool
- **Auto-Replenishment**: Triggers generation when needed
- **Usage Tracking**: Increments and deletes exhausted cookies

### Model Service (`api/src/services/modelService.js`)
- **Model CRUD**: Create, read, update, delete models
- **Provider Mapping**: Maps custom → provider names
- **Brand Management**: Handles brand name in responses

### Admin Handler (`api/src/handlers/admin.js`)
- **Authentication**: Admin login/logout
- **API Key Management**: CRUD operations
- **Cookie Management**: Generation, deletion, reset
- **Analytics**: Usage statistics

### Admin Panel (`admin-panel/src/`)
- **Dashboard**: Analytics visualization
- **Cookie Pool**: Cookie management UI
- **Model Manager**: Model configuration
- **API Docs**: Interactive documentation

## Security Architecture

### Authentication Flow

```
Admin Login
    │
    ├─▶ POST /api/admin/login
    │   Body: { email, password }
    │
    ▼
┌─────────────────────────────────────┐
│  Verify Credentials                 │
│  - Hash password                    │
│  - Compare with database            │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Generate JWT Token                  │
│  - Sign with JWT_SECRET             │
│  - Include admin ID                │
└──────────────┬──────────────────────┘
               │
               ▼
         Return Token
               │
               ▼
    Subsequent Requests
    Header: Authorization: Bearer <token>
```

### API Key Authentication

```
API Request
    │
    ├─▶ Header: Authorization: Bearer <api_key>
    │
    ▼
┌─────────────────────────────────────┐
│  Verify API Key                      │
│  - Lookup in database               │
│  - Check if active                  │
└──────────────┬──────────────────────┘
               │
               ├─ Valid?
               │  └─▶ Process request
               │
               └─ Invalid?
                  └─▶ 401 Unauthorized
```

## Cookie Rotation Strategy

### Pool Management

1. **Initial State**: Pool has 10+ cookies
2. **Usage**: Cookies are selected randomly from available pool
3. **Tracking**: Each use increments `usage_count`
4. **Deletion**: Cookie deleted when `usage_count >= 45`
5. **Replenishment**: Auto-generates when pool < 10

### Proactive Generation

- **On Cookie Selection**: Checks pool size, triggers if low
- **After Usage**: Checks pool size, triggers if low
- **On Deletion**: Triggers replenishment
- **Cron Job**: Backup check every 6 hours

## Error Handling

### Request Errors
- **400**: Bad Request (missing fields, invalid format)
- **401**: Unauthorized (invalid API key/token)
- **404**: Not Found (invalid endpoint)
- **429**: Rate Limit (from kyvex.ai, triggers cookie rotation)
- **500**: Internal Server Error

### Recovery Mechanisms
- **Cookie Failure**: Falls back to temporary browser ID
- **Pool Empty**: Generates emergency batch
- **Database Error**: Retries with fallback logic
- **Streaming Error**: Closes stream gracefully

## Performance Optimizations

1. **Edge Computing**: Cloudflare Workers run at edge locations
2. **Parallel Processing**: Cookie generation in batches
3. **Async Operations**: Non-blocking cookie management
4. **Connection Pooling**: Supabase connection reuse
5. **Caching**: Settings cached in memory

## Scalability

- **Horizontal**: Cloudflare Workers auto-scale
- **Database**: Supabase handles connection pooling
- **Cookie Pool**: Auto-scales based on demand
- **No State**: Stateless workers enable infinite scaling

## Monitoring

- **Cloudflare Dashboard**: Request metrics, errors
- **Supabase Dashboard**: Database performance
- **Admin Panel**: Real-time analytics
- **Worker Logs**: Detailed console logs


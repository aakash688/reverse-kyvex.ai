# 📚 API Documentation

Complete API reference for Kyvex API.

## Base URL

```
Production: https://your-worker-name.your-subdomain.workers.dev
```

## Authentication

### API Key Authentication
Most endpoints require an API key in the Authorization header:

```
Authorization: Bearer YOUR_API_KEY
```

### Admin Authentication
Admin endpoints require a JWT token obtained from login:

```
Authorization: Bearer JWT_TOKEN
```

## Chat Completions (OpenAI Compatible)

### POST /v1/chat/completions

Create a chat completion.

**Request:**
```json
{
  "model": "Sahyog",
  "messages": [
    {
      "role": "user",
      "content": "Hello!"
    }
  ],
  "stream": true,
  "temperature": 0.7,
  "max_tokens": 1000
}
```

**Parameters:**
- `model` (string, required) - Custom model name
- `messages` (array, required) - Conversation messages
  - `role` (string) - "user", "assistant", or "system"
  - `content` (string or array) - Message content
- `stream` (boolean, default: true) - Enable streaming
- `temperature` (number, optional) - Sampling temperature
- `max_tokens` (number, optional) - Maximum tokens
- `conversation_id` (string, optional) - Conversation ID for threading

**Response (Non-streaming):**
```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "Sahyog",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "Hello! How can I help you?"
    },
    "finish_reason": "stop"
  }]
}
```

**Response (Streaming):**
```
data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"Sahyog","choices":[{"index":0,"delta":{"content":"Hello"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"Sahyog","choices":[{"index":0,"delta":{"content":"!"},"finish_reason":null}]}

data: [DONE]
```

**Example with Image:**
```json
{
  "model": "Sahyog",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "What's in this image?"
        },
        {
          "type": "image_url",
          "image_url": {
            "url": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
          }
        }
      ]
    }
  ]
}
```

**cURL Example:**
```bash
curl -X POST "https://your-worker.workers.dev/v1/chat/completions" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "Sahyog",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

## Models

### GET /v1/models

List available models.

**Request:**
```bash
GET /v1/models
Authorization: Bearer YOUR_API_KEY
```

**Response:**
```json
{
  "object": "list",
  "data": [
    {
      "id": "Sahyog",
      "object": "model",
      "created": 1677652288,
      "owned_by": "Sahyog",
      "permission": ["Text generation", "Image upload"]
    }
  ]
}
```

## Admin Endpoints

### Authentication

#### POST /api/admin/login

Admin login.

**Request:**
```json
{
  "email": "admin@example.com",
  "password": "password"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": "uuid",
    "email": "admin@example.com",
    "name": "Admin Name"
  }
}
```

### Analytics

#### GET /api/admin/analytics/overview

Get analytics overview.

**Headers:**
```
Authorization: Bearer JWT_TOKEN
```

**Response:**
```json
{
  "apiKeys": {
    "total": 10,
    "active": 8
  },
  "totalRequests": 1500,
  "totalTokens": 500000,
  "totalThreads": 200,
  "todayRequests": 50,
  "modelStats": [
    {
      "model": "Sahyog",
      "requests": 800,
      "tokens": 250000,
      "percentage": "53.3"
    }
  ],
  "topModel": "Sahyog"
}
```

### Cookie Pool Management

#### GET /api/admin/cookies/stats

Get cookie pool statistics.

**Response:**
```json
{
  "total": 50,
  "available": 45,
  "nearLimit": 3,
  "inactive": 2,
  "config": {
    "deleteThreshold": 45,
    "minPoolSize": 10,
    "replenishCount": 50
  }
}
```

#### GET /api/admin/cookies

List all cookies.

**Response:**
```json
{
  "cookies": [
    {
      "id": "uuid",
      "browser_id": "BRWS-xxx",
      "usage_count": 5,
      "is_active": true,
      "created_at": "2025-12-30T10:00:00Z"
    }
  ]
}
```

#### POST /api/admin/cookies/generate

Generate new cookies.

**Request:**
```json
{
  "count": 50
}
```

**Response:**
```json
{
  "message": "Generated 50 cookies",
  "created": 50,
  "errors": 0
}
```

#### POST /api/admin/cookies/auto-generate

Trigger auto-generation.

**Response:**
```json
{
  "message": "Generated 50 cookies",
  "replenished": true,
  "count": 50,
  "availableCount": 5,
  "minPoolSize": 10
}
```

#### POST /api/admin/cookies/reset-counters

Reset all cookie usage counters.

**Response:**
```json
{
  "message": "Counters reset successfully"
}
```

#### DELETE /api/admin/cookies/{id}

Delete a specific cookie.

**Response:**
```json
{
  "message": "Cookie deleted successfully"
}
```

### Model Management

#### GET /api/admin/models

List all models.

**Response:**
```json
{
  "models": [
    {
      "id": "uuid",
      "customName": "Sahyog",
      "providerName": "gpt-4",
      "brandName": "Sahyog",
      "permissions": "Text generation",
      "isActive": true
    }
  ]
}
```

#### POST /api/admin/models

Create a new model.

**Request:**
```json
{
  "customName": "Sahyog",
  "providerName": "gpt-4",
  "brandName": "Sahyog",
  "permissions": "Text generation\nImage upload",
  "isActive": true
}
```

**Response:**
```json
{
  "id": "uuid",
  "customName": "Sahyog",
  "providerName": "gpt-4",
  "brandName": "Sahyog",
  "permissions": "Text generation\nImage upload",
  "isActive": true,
  "createdAt": "2025-12-30T10:00:00Z"
}
```

#### PUT /api/admin/models/{id}

Update a model.

**Request:**
```json
{
  "customName": "Sahyog v2",
  "isActive": false
}
```

#### DELETE /api/admin/models/{id}

Delete a model.

### API Key Management

#### GET /api/admin/api-keys

List all API keys.

**Response:**
```json
{
  "apiKeys": [
    {
      "id": "uuid",
      "name": "My API Key",
      "key": "kyvex_xxx",
      "status": "active",
      "analytics": {
        "totalRequests": 100,
        "totalTokens": 50000
      }
    }
  ]
}
```

#### POST /api/admin/api-keys

Create a new API key.

**Request:**
```json
{
  "name": "My API Key",
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "My API Key",
  "key": "kyvex_xxx...",
  "status": "active"
}
```

#### DELETE /api/admin/api-keys/{id}

Delete an API key.

### System Operations

#### POST /api/admin/threads/clear

Clear all conversation threads.

**Response:**
```json
{
  "message": "Threads cleared successfully"
}
```

#### POST /api/admin/analytics/reset

Reset all analytics.

**Request (optional):**
```json
{
  "apiKeyId": "uuid"  // Optional: reset specific key
}
```

**Response:**
```json
{
  "message": "Analytics reset successfully"
}
```

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message here"
}
```

### Status Codes

- `200` - Success
- `400` - Bad Request (missing/invalid parameters)
- `401` - Unauthorized (invalid API key/token)
- `404` - Not Found (invalid endpoint)
- `429` - Rate Limit (from kyvex.ai)
- `500` - Internal Server Error

## Rate Limiting

- **No API-level limits** - Unlimited conversations
- **Cookie-level limits** - 45 requests per cookie (auto-rotated)
- **Auto-replenishment** - Pool maintained automatically

## Streaming

### Enable Streaming

Set `"stream": true` in request body.

### Handle Streaming Response

**JavaScript:**
```javascript
const response = await fetch(url, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'Sahyog',
    messages: [{ role: 'user', 'content': 'Hello!' }],
    stream: true
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6);
      if (data === '[DONE]') break;
      const json = JSON.parse(data);
      console.log(json.choices[0].delta.content);
    }
  }
}
```

**Python:**
```python
import requests
import json

response = requests.post(
    url,
    headers={
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
    },
    json={
        'model': 'Sahyog',
        'messages': [{'role': 'user', 'content': 'Hello!'}],
        'stream': True
    },
    stream=True
)

for line in response.iter_lines():
    if line:
        line = line.decode('utf-8')
        if line.startswith('data: '):
            data = line[6:]
            if data == '[DONE]':
                break
            json_data = json.loads(data)
            print(json_data['choices'][0]['delta'].get('content', ''), end='')
```

## Image Support

### Base64 Encoding

```json
{
  "model": "Sahyog",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "What's in this image?"
        },
        {
          "type": "image_url",
          "image_url": {
            "url": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
          }
        }
      ]
    }
  ]
}
```

### Image URL

```json
{
  "type": "image_url",
  "image_url": {
    "url": "https://example.com/image.jpg"
  }
}
```

### Supported Formats

- JPEG/JPG
- PNG
- GIF
- WebP

## Best Practices

1. **Use Streaming** - Enable streaming for better UX
2. **Handle Errors** - Always check response status
3. **Store API Keys Securely** - Never expose in client-side code
4. **Use Conversation IDs** - For multi-turn conversations
5. **Monitor Usage** - Check analytics regularly

## SDK Compatibility

### OpenAI Python SDK

```python
from openai import OpenAI

client = OpenAI(
    api_key="YOUR_API_KEY",
    base_url="https://your-worker.workers.dev/v1"
)

response = client.chat.completions.create(
    model="Sahyog",
    messages=[{"role": "user", "content": "Hello!"}]
)
```

### OpenAI JavaScript SDK

```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: 'YOUR_API_KEY',
  baseURL: 'https://your-worker.workers.dev/v1'
});

const completion = await openai.chat.completions.create({
  model: 'Sahyog',
  messages: [{ role: 'user', content: 'Hello!' }]
});
```

## Testing

See [DEVELOPMENT.md](./DEVELOPMENT.md) for testing procedures and examples.


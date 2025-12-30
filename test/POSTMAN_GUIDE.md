# Postman Testing Guide - Kyvex API

## API Base URL
```
https://kyvex-api.proaiapirev1.workers.dev
```

## API Key
```
kyvex_8f57308ca01e5ee842e724fda144b510fc90a3afd7fc18bdb3e867181c7b1217
```

---

## 1. List Models

### Request
- **Method:** `GET`
- **URL:** `https://kyvex-api.proaiapirev1.workers.dev/v1/models`
- **Headers:**
  ```
  Authorization: Bearer kyvex_8f57308ca01e5ee842e724fda144b510fc90a3afd7fc18bdb3e867181c7b1217
  Content-Type: application/json
  ```

### Expected Response
```json
{
  "object": "list",
  "data": [
    {
      "id": "claude-sonnet-4.5",
      "object": "model",
      "created": 1234567890,
      "owned_by": "openrouter",
      ...
    }
  ]
}
```

---

## 2. Chat Completions (Non-Streaming)

### Request
- **Method:** `POST`
- **URL:** `https://kyvex-api.proaiapirev1.workers.dev/v1/chat/completions`
- **Headers:**
  ```
  Authorization: Bearer kyvex_8f57308ca01e5ee842e724fda144b510fc90a3afd7fc18bdb3e867181c7b1217
  Content-Type: application/json
  ```
- **Body (JSON):**
  ```json
  {
    "model": "claude-sonnet-4.5",
    "messages": [
      {
        "role": "user",
        "content": "Hello! How are you?"
      }
    ],
    "stream": false
  }
  ```

### Expected Response
```json
{
  "id": "chatcmpl-...",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "claude-sonnet-4.5",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! I'm doing well, thank you..."
      },
      "finish_reason": "stop"
    }
  ]
}
```

---

## 3. Chat Completions (Streaming) - New Chat

### Request
- **Method:** `POST`
- **URL:** `https://kyvex-api.proaiapirev1.workers.dev/v1/chat/completions`
- **Headers:**
  ```
  Authorization: Bearer kyvex_8f57308ca01e5ee842e724fda144b510fc90a3afd7fc18bdb3e867181c7b1217
  Content-Type: application/json
  ```
- **Body (JSON):**
  ```json
  {
    "model": "claude-sonnet-4.5",
    "messages": [
      {
        "role": "user",
        "content": "Hi, what's the weather like?"
      }
    ],
    "stream": true
  }
  ```

### Expected Response (Server-Sent Events)
```
data: {"id":"chatcmpl-...","object":"chat.completion.chunk","created":1234567890,"model":"claude-sonnet-4.5","choices":[{"index":0,"delta":{"content":"Hello"},"finish_reason":null}]}

data: {"id":"chatcmpl-...","object":"chat.completion.chunk","created":1234567890,"model":"claude-sonnet-4.5","choices":[{"index":0,"delta":{"content":"!"},"finish_reason":null}]}

data: [DONE]
```

**Note:** In Postman, streaming responses will show as raw text. You'll see the SSE format with `data:` prefixes.

---

## 4. Chat Completions (Streaming) - Continue Conversation

### Request
- **Method:** `POST`
- **URL:** `https://kyvex-api.proaiapirev1.workers.dev/v1/chat/completions`
- **Headers:**
  ```
  Authorization: Bearer kyvex_8f57308ca01e5ee842e724fda144b510fc90a3afd7fc18bdb3e867181c7b1217
  Content-Type: application/json
  ```
- **Body (JSON):**
  ```json
  {
    "model": "claude-sonnet-4.5",
    "messages": [
      {
        "role": "user",
        "content": "Hi, what's the weather like?"
      },
      {
        "role": "assistant",
        "content": "I don't have access to real-time weather data..."
      },
      {
        "role": "user",
        "content": "Can you tell me about AI?"
      }
    ],
    "stream": true,
    "thread_id": "your-thread-id-here"
  }
  ```

**Note:** The `thread_id` is optional. If you don't provide it, a new thread will be created. The thread ID is returned in the first response and should be used for subsequent messages in the same conversation.

---

## 5. Health Check

### Request
- **Method:** `GET`
- **URL:** `https://kyvex-api.proaiapirev1.workers.dev/health`
- **Headers:** None required

### Expected Response
```json
{
  "status": "ok"
}
```

---

## Postman Setup Steps

### Step 1: Create a Collection
1. Open Postman
2. Click "New" → "Collection"
3. Name it "Kyvex API"

### Step 2: Set Collection Variables
1. Click on your collection
2. Go to "Variables" tab
3. Add variables:
   - `base_url`: `https://kyvex-api.proaiapirev1.workers.dev`
   - `api_key`: `kyvex_8f57308ca01e5ee842e724fda144b510fc90a3afd7fc18bdb3e867181c7b1217`

### Step 3: Create Requests

#### Request 1: List Models
- Method: `GET`
- URL: `{{base_url}}/v1/models`
- Headers:
  - `Authorization`: `Bearer {{api_key}}`
  - `Content-Type`: `application/json`

#### Request 2: Chat (Non-Streaming)
- Method: `POST`
- URL: `{{base_url}}/v1/chat/completions`
- Headers:
  - `Authorization`: `Bearer {{api_key}}`
  - `Content-Type`: `application/json`
- Body (raw JSON):
  ```json
  {
    "model": "claude-sonnet-4.5",
    "messages": [
      {
        "role": "user",
        "content": "Hello!"
      }
    ],
    "stream": false
  }
  ```

#### Request 3: Chat (Streaming)
- Method: `POST`
- URL: `{{base_url}}/v1/chat/completions`
- Headers:
  - `Authorization`: `Bearer {{api_key}}`
  - `Content-Type`: `application/json`
- Body (raw JSON):
  ```json
  {
    "model": "claude-sonnet-4.5",
    "messages": [
      {
        "role": "user",
        "content": "Tell me a joke"
      }
    ],
    "stream": true
  }
  ```

---

## Testing Streaming in Postman

### Option 1: View Raw Response
1. Send the streaming request
2. In the response tab, you'll see the raw SSE format
3. Look for lines starting with `data:`

### Option 2: Use Postman Console
1. Open Postman Console (View → Show Postman Console)
2. Send the request
3. You'll see the streaming chunks in real-time

### Option 3: Parse Response (Postman Script)
Add this to the "Tests" tab to parse streaming response:

```javascript
pm.test("Response is streaming", function () {
    pm.response.to.have.status(200);
    const text = pm.response.text();
    pm.expect(text).to.include("data:");
});
```

---

## Example: Full Conversation Flow

### Message 1 (New Chat)
```json
POST /v1/chat/completions
{
  "model": "claude-sonnet-4.5",
  "messages": [
    {"role": "user", "content": "Hi"}
  ],
  "stream": true
}
```

**Response:** Streaming chunks + thread ID (if returned)

### Message 2 (Continue Chat)
```json
POST /v1/chat/completions
{
  "model": "claude-sonnet-4.5",
  "messages": [
    {"role": "user", "content": "Hi"},
    {"role": "assistant", "content": "Hello! How can I help?"},
    {"role": "user", "content": "What's 2+2?"}
  ],
  "stream": true,
  "thread_id": "thread-id-from-previous-response"
}
```

**Note:** The thread_id helps maintain context. If you don't include it, the API will create a new thread, but you'll lose the conversation context.

---

## Common Issues

### 401 Unauthorized
- Check API key is correct
- Ensure `Bearer` prefix is included
- Verify key is active in admin panel

### 500 Internal Server Error
- Check API logs
- Verify MongoDB connection
- Check kyvex.ai API is accessible

### CORS Errors
- Should not occur in Postman (Postman doesn't enforce CORS)
- If testing from browser, ensure CORS headers are present

### Streaming Not Working
- Ensure `stream: true` in request body
- Check response is text/event-stream
- View raw response in Postman

---

## Quick Test Checklist

- [ ] Health check returns `{"status": "ok"}`
- [ ] List models returns array of models
- [ ] Non-streaming chat returns complete response
- [ ] Streaming chat shows `data:` chunks
- [ ] Thread ID is maintained across messages
- [ ] Different models work correctly

---

## Postman Collection JSON

You can import this directly into Postman:

```json
{
  "info": {
    "name": "Kyvex API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "base_url",
      "value": "https://kyvex-api.proaiapirev1.workers.dev"
    },
    {
      "key": "api_key",
      "value": "kyvex_8f57308ca01e5ee842e724fda144b510fc90a3afd7fc18bdb3e867181c7b1217"
    }
  ],
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{base_url}}/health",
          "host": ["{{base_url}}"],
          "path": ["health"]
        }
      }
    },
    {
      "name": "List Models",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{api_key}}"
          }
        ],
        "url": {
          "raw": "{{base_url}}/v1/models",
          "host": ["{{base_url}}"],
          "path": ["v1", "models"]
        }
      }
    },
    {
      "name": "Chat - Non-Streaming",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{api_key}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"model\": \"claude-sonnet-4.5\",\n  \"messages\": [\n    {\n      \"role\": \"user\",\n      \"content\": \"Hello!\"\n    }\n  ],\n  \"stream\": false\n}"
        },
        "url": {
          "raw": "{{base_url}}/v1/chat/completions",
          "host": ["{{base_url}}"],
          "path": ["v1", "chat", "completions"]
        }
      }
    },
    {
      "name": "Chat - Streaming",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{api_key}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"model\": \"claude-sonnet-4.5\",\n  \"messages\": [\n    {\n      \"role\": \"user\",\n      \"content\": \"Tell me a short story\"\n    }\n  ],\n  \"stream\": true\n}"
        },
        "url": {
          "raw": "{{base_url}}/v1/chat/completions",
          "host": ["{{base_url}}"],
          "path": ["v1", "chat", "completions"]
        }
      }
    }
  ]
}
```

Save this as `Kyvex_API.postman_collection.json` and import it into Postman!


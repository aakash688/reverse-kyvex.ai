# 🚀 Kyvex API - OpenAI-Compatible Proxy Service

A production-ready, OpenAI-compatible API proxy service built on Cloudflare Workers that provides unlimited AI conversations through intelligent cookie rotation and rate limit bypass.

## ✨ Features

- **OpenAI-Compatible API** - Drop-in replacement for OpenAI API
- **Unlimited Conversations** - Automatic cookie rotation bypasses rate limits
- **Model Management** - Custom model names with provider mapping
- **Admin Dashboard** - Beautiful, insightful analytics and management panel
- **Auto Cookie Generation** - Intelligent pool management with auto-replenishment
- **Image Support** - Vision model support with base64/image URLs
- **Streaming Responses** - Real-time streaming chat completions
- **Analytics** - Comprehensive usage tracking and model statistics

## 🏗️ Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Client    │────────▶│ Cloudflare   │────────▶│  kyvex.ai   │
│  (Postman,  │         │   Workers    │         │   (Proxy)    │
│   Python)   │         │   (API)      │         │              │
└─────────────┘         └──────────────┘         └─────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │   Supabase   │
                        │ (PostgreSQL) │
                        └──────────────┘
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
            ┌──────────────┐      ┌──────────────┐
            │ Cookie Pool  │      │ Admin Panel  │
            │  (Auto-gen)  │      │ (Cloudflare  │
            │              │      │   Pages)     │
            └──────────────┘      └──────────────┘
```

## 🛠️ Tech Stack

### Backend (API Worker)
- **Runtime**: Cloudflare Workers (Edge Computing)
- **Language**: JavaScript (ES Modules)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT tokens
- **Deployment**: Wrangler CLI

### Frontend (Admin Panel)
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **HTTP Client**: Axios
- **Deployment**: Cloudflare Pages

### Database
- **Provider**: Supabase
- **Database**: PostgreSQL
- **API**: PostgREST (RESTful API)
- **Auth**: Row Level Security (RLS)

## 📦 Project Structure

```
kyvex.ai/
├── api/                          # Cloudflare Worker (API)
│   ├── src/
│   │   ├── handlers/             # Request handlers
│   │   │   ├── chat.js           # Chat completions
│   │   │   ├── models.js         # Model listing
│   │   │   ├── admin.js          # Admin operations
│   │   │   └── analytics.js      # Analytics
│   │   ├── services/             # Business logic
│   │   │   ├── cookieService.js  # Cookie pool management
│   │   │   ├── modelService.js   # Model management
│   │   │   ├── apiKey.js         # API key management
│   │   │   └── kyvex.js          # kyvex.ai proxy
│   │   ├── middleware/          # Auth & rate limiting
│   │   └── utils/                # Utilities
│   ├── supabase-schema.sql       # Database schema
│   └── wrangler.toml             # Cloudflare config
│
├── admin-panel/                  # React Admin Dashboard
│   ├── src/
│   │   ├── components/           # React components
│   │   │   ├── Dashboard.jsx     # Main dashboard
│   │   │   ├── CookiePoolDashboard.jsx
│   │   │   ├── ModelManager.jsx
│   │   │   └── ApiDocs.jsx
│   │   └── services/
│   │       └── api.js            # API client
│   └── vite.config.js
│
└── docs/                          # Documentation
    ├── ARCHITECTURE.md
    ├── INSTALLATION.md
    ├── API_DOCUMENTATION.md
    └── ...
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Cloudflare account
- Supabase account
- Wrangler CLI (`npm install -g wrangler`)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd kyvex.ai
   ```

2. **Set up Supabase**
   - Create a Supabase project
   - Run `api/supabase-schema.sql` in Supabase SQL Editor
   - Note your project URL and anon key

3. **Configure API Worker**
   ```bash
   cd api
   npm install
   
   # Set secrets
   wrangler secret put SUPABASE_URL
   wrangler secret put SUPABASE_ANON_KEY
   wrangler secret put JWT_SECRET
   wrangler secret put ADMIN_PANEL_URL
   ```

4. **Deploy API Worker**
   ```bash
   wrangler deploy
   ```

5. **Set up Admin Panel**
   ```bash
   cd ../admin-panel
   npm install
   npm run build
   wrangler pages deploy dist --project-name=kyvex-admin-panel
   ```

See [INSTALLATION.md](./docs/INSTALLATION.md) for detailed setup instructions.

## 📚 Documentation

- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - System architecture and flow
- **[INSTALLATION.md](./docs/INSTALLATION.md)** - Complete setup guide
- **[API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md)** - API endpoints reference
- **[CLOUDFLARE_WORKERS.md](./docs/CLOUDFLARE_WORKERS.md)** - Cloudflare-specific details
- **[DEVELOPMENT.md](./docs/DEVELOPMENT.md)** - Development guide
- **[DEPLOYMENT.md](./docs/DEPLOYMENT.md)** - Deployment procedures
- **[TECH_STACK.md](./docs/TECH_STACK.md)** - Technologies and dependencies

## 🔑 Key Concepts

### Cookie Rotation System
- Auto-generates browser IDs (`BRWS-xxx`) programmatically
- Maintains a pool of cookies (default: 10 minimum)
- Rotates cookies automatically when usage reaches 45 requests
- Auto-replenishes when pool drops below threshold

### Model Management
- Custom model names (e.g., "Sahyog") mapped to provider models
- Multiple custom names can map to the same provider model
- Brand name customization in responses
- Permission-based model features

### Rate Limit Bypass
- Each cookie handles 50 requests/day (kyvex.ai limit)
- Automatic rotation when limit reached
- Unlimited conversations through pool management
- Proactive auto-generation maintains healthy pool

## 🌐 API Endpoints

### Chat Completions (OpenAI Compatible)
```
POST /v1/chat/completions
```

### Models
```
GET /v1/models
```

### Admin Endpoints
```
POST /api/admin/login
GET /api/admin/analytics/overview
GET /api/admin/cookies/stats
POST /api/admin/cookies/generate
...
```

See [API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md) for complete API reference.

## 🔧 Configuration

### Environment Variables (Cloudflare Secrets)

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `JWT_SECRET` - Secret for JWT token signing
- `ADMIN_PANEL_URL` - Admin panel URL (for CORS)
- `RESEND_API_KEY` - (Optional) For email functionality

### System Settings (Database)

Configure via admin panel or database:
- `cookie_min_threshold` - Minimum cookies before auto-gen (default: 10)
- `cookie_gen_batch_size` - Cookies per batch (default: 50)
- `cookie_delete_threshold` - Delete after N requests (default: 45)

## 📊 Admin Dashboard

Access the admin panel at your Cloudflare Pages URL:
- **Dashboard** - Analytics and overview
- **Cookie Pool** - Manage cookie generation and rotation
- **Model Manager** - Configure custom models
- **API Keys** - Manage API keys
- **API Docs** - Interactive API documentation

## 🔄 Cron Jobs

The system runs scheduled tasks every 6 hours:
- Cleanup exhausted cookies
- Auto-replenish cookie pool if needed
- Log pool statistics

## 🧪 Testing

### Test Chat Completion
```bash
curl -X POST "https://your-worker.workers.dev/v1/chat/completions" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "Sahyog",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### Test with Image
See [API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md) for image upload examples.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

[Your License Here]

## 🙏 Acknowledgments

- Built on Cloudflare Workers
- Powered by Supabase
- Compatible with OpenAI API format

## 📞 Support

For issues, questions, or contributions, please open an issue on GitHub.

---

**Made with ❤️ using Cloudflare Workers and Supabase**


# 🛠️ Technology Stack

## Backend (API Worker)

### Runtime & Platform
- **Cloudflare Workers** - Serverless edge computing platform
  - Global edge network
  - Zero cold starts
  - Automatic scaling
  - Built-in DDoS protection

### Language & Runtime
- **JavaScript (ES Modules)** - Modern ES6+ syntax
- **Node.js Compat** - Cloudflare Workers Node.js compatibility layer
- **V8 Isolate** - Isolated JavaScript runtime

### Database
- **Supabase** - Backend-as-a-Service
  - **PostgreSQL** - Relational database
  - **PostgREST** - Auto-generated REST API
  - **Row Level Security (RLS)** - Database-level security
  - **Real-time** - WebSocket subscriptions (not used currently)

### Authentication & Security
- **JWT (JSON Web Tokens)** - Token-based authentication
- **SHA-256** - Password hashing
- **CORS** - Cross-origin resource sharing

### HTTP & Networking
- **Fetch API** - Native HTTP client
- **ReadableStream** - Streaming responses
- **EventSource** - Server-Sent Events (SSE)

### Development Tools
- **Wrangler CLI** - Cloudflare Workers development and deployment
- **npm** - Package management

### Dependencies
```json
{
  "@cloudflare/workers-types": "^4.20241106.0",
  "wrangler": "^4.54.0"
}
```

## Frontend (Admin Panel)

### Framework
- **React 18** - UI library
  - Hooks-based components
  - Functional components
  - Context API (not used currently)

### Build Tools
- **Vite** - Next-generation build tool
  - Fast HMR (Hot Module Replacement)
  - Optimized production builds
  - ES modules support

### Routing
- **React Router v6** - Client-side routing
  - BrowserRouter
  - Route-based code splitting

### Styling
- **Tailwind CSS** - Utility-first CSS framework
  - Responsive design
  - Custom configuration
- **PostCSS** - CSS processing
- **Autoprefixer** - Vendor prefixing

### HTTP Client
- **Axios** - Promise-based HTTP client
  - Request/response interceptors
  - Automatic JSON parsing

### Dependencies
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.20.0",
  "axios": "^1.6.2"
}
```

### Dev Dependencies
```json
{
  "@vitejs/plugin-react": "^4.2.1",
  "tailwindcss": "^3.4.0",
  "postcss": "^8.4.32",
  "autoprefixer": "^10.4.16",
  "vite": "^5.0.8"
}
```

## Database (Supabase)

### Database Engine
- **PostgreSQL 15+** - Advanced open-source relational database
  - ACID compliance
  - JSON support
  - Full-text search
  - Extensions (uuid-ossp)

### API Layer
- **PostgREST** - RESTful API generator
  - Auto-generated from schema
  - Query filtering
  - Pagination
  - Schema caching

### Security
- **Row Level Security (RLS)** - Row-level access control
- **Service Role Key** - Admin operations
- **Anon Key** - Public operations

### Tables
- `admins` - Admin users
- `api_keys` - API key management
- `models` - Custom model mappings
- `threads` - Conversation threads
- `browser_cookies` - Cookie pool
- `system_settings` - Configuration
- `usage_logs` - Analytics (optional)

## Deployment Platforms

### Cloudflare Workers
- **Runtime**: V8 Isolates
- **Locations**: 300+ edge locations globally
- **Limits**:
  - CPU time: 50ms (free), 30s (paid)
  - Memory: 128MB
  - Subrequests: 50 per request
  - Cron triggers: Unlimited

### Cloudflare Pages
- **Build**: Vite production build
- **Hosting**: Static file hosting
- **CDN**: Global CDN distribution
- **Custom Domains**: Supported

## Development Tools

### Package Managers
- **npm** - Node Package Manager
- **package-lock.json** - Dependency locking

### Version Control
- **Git** - Source control
- **GitHub** - Repository hosting

### CLI Tools
- **Wrangler** - Cloudflare Workers CLI
  - `wrangler dev` - Local development
  - `wrangler deploy` - Deploy worker
  - `wrangler secret put` - Set secrets
  - `wrangler tail` - View logs
  - `wrangler pages deploy` - Deploy Pages

## APIs & Services

### External Services
- **kyvex.ai** - Upstream AI provider
  - Chat completions API
  - Model listing
  - Streaming support

### Internal APIs
- **Supabase REST API** - Database operations
- **Supabase RPC** - Stored procedures
- **Custom API** - Worker endpoints

## Data Formats

### Request/Response
- **JSON** - Primary data format
- **Server-Sent Events (SSE)** - Streaming responses
- **Form Data** - File uploads (future)

### Image Handling
- **Base64** - Image encoding
- **Data URLs** - `data:image/jpeg;base64,...`
- **Image URLs** - HTTP/HTTPS URLs

## Security Technologies

### Encryption
- **HTTPS/TLS** - Transport layer security
- **JWT** - Token signing and verification
- **SHA-256** - Password hashing

### Access Control
- **API Keys** - Client authentication
- **JWT Tokens** - Admin authentication
- **RLS Policies** - Database-level security

## Monitoring & Logging

### Logging
- **Console.log** - Worker logs
- **Wrangler Tail** - Real-time log streaming
- **Cloudflare Dashboard** - Request analytics

### Analytics
- **Custom Analytics** - Stored in database
- **Usage Tracking** - Per API key, per model
- **Cookie Statistics** - Pool health metrics

## Build & Deployment

### Build Process
1. **API Worker**: No build needed (ES modules)
2. **Admin Panel**: `vite build` → `dist/` directory

### Deployment
1. **API**: `wrangler deploy`
2. **Admin Panel**: `wrangler pages deploy dist`

### Environment Management
- **Cloudflare Secrets** - Sensitive data
- **Environment Variables** - Public config
- **Database Settings** - Runtime configuration

## Compatibility

### Browser Support
- **Modern Browsers** - Chrome, Firefox, Safari, Edge (latest)
- **ES6+ Features** - Required

### API Compatibility
- **OpenAI API v1** - Compatible format
- **Streaming** - SSE format
- **Models Endpoint** - Compatible response

## Performance Characteristics

### Worker Limits
- **CPU Time**: 50ms (free tier)
- **Memory**: 128MB
- **Subrequests**: 50 per request
- **Response Size**: 100MB

### Optimization Strategies
- **Edge Caching**: Cloudflare CDN
- **Parallel Processing**: Batch operations
- **Async Operations**: Non-blocking I/O
- **Connection Reuse**: Supabase pooling

## Future Considerations

### Potential Additions
- **WebSockets** - Real-time updates
- **GraphQL** - Alternative API layer
- **Redis** - Caching layer
- **Message Queue** - Background jobs
- **File Storage** - Cloudflare R2



# Kyvex API - Cloudflare Workers

OpenAI-compatible API proxy for kyvex.ai deployed on Cloudflare Workers.

## Quick Start

```bash
# Install dependencies
npm install

# Set secrets (see main README.md)
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_ANON_KEY
wrangler secret put JWT_SECRET
wrangler secret put ADMIN_PANEL_URL

# Deploy
wrangler deploy
```

## Documentation

For complete documentation, see the main [README.md](../README.md) and [docs/](../docs/) directory:

- **[Installation Guide](../docs/INSTALLATION.md)** - Complete setup instructions
- **[API Documentation](../docs/API_DOCUMENTATION.md)** - API endpoints reference
- **[Development Guide](../docs/DEVELOPMENT.md)** - Development procedures
- **[Deployment Guide](../docs/DEPLOYMENT.md)** - Deployment procedures
- **[Architecture](../docs/ARCHITECTURE.md)** - System architecture
- **[Cloudflare Workers](../docs/CLOUDFLARE_WORKERS.md)** - Cloudflare-specific details

## Project Structure

```
api/
├── src/
│   ├── handlers/      # Request handlers
│   ├── services/      # Business logic
│   ├── middleware/    # Auth & rate limiting
│   └── utils/         # Utilities
├── supabase-schema.sql  # Database schema
└── wrangler.toml      # Cloudflare config
```

## Development

```bash
# Local development
wrangler dev

# View logs
wrangler tail
```


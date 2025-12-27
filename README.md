# 🚀 Kyvex.ai API Proxy

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-ISC-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)

**OpenAI-Compatible API Proxy for Kyvex.ai with Admin Panel & Analytics**

[Features](#-features) • [Quick Start](#-quick-start) • [Deployment](#-deployment) • [API Documentation](#-api-documentation) • [Admin Panel](#-admin-panel)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Configuration](#-configuration)
- [API Documentation](#-api-documentation)
- [Admin Panel](#-admin-panel)
- [Deployment](#-deployment)
- [Free Hosting Options](#-free-hosting-options)
- [Contributing](#-contributing)
- [License](#-license)

## 🎯 Overview

Kyvex.ai API Proxy is a production-ready middleware that provides **OpenAI-compatible endpoints** for the Kyvex.ai backend. It handles API key management, thread context preservation, usage analytics, and includes a comprehensive admin panel for monitoring and management.

### Why This Project?

- ✅ **OpenAI-Compatible**: Drop-in replacement for OpenAI API
- ✅ **Thread Management**: Automatic conversation context handling
- ✅ **Scalable**: Designed to handle millions of users
- ✅ **Free Hosting**: Works on Render, Google Cloud Run, and more
- ✅ **Admin Panel**: Full-featured dashboard with analytics
- ✅ **Production Ready**: Error handling, rate limiting, logging

## ✨ Features

### 🔐 Authentication & Security
- 🔑 API key authentication (Bearer token)
- 🛡️ Rate limiting per API key
- 🔒 Password hashing with bcrypt
- 🍪 Secure session management
- 🚫 Input validation & sanitization

### 💬 Chat & Threading
- 💭 OpenAI-compatible chat completions
- 🧵 Automatic thread context management
- 📝 Conversation history preservation
- 🌊 Streaming response support
- 🤖 Multiple model support

### 📊 Analytics & Monitoring
- 📈 Real-time usage statistics
- 📉 Error rate tracking
- 🎯 Model usage analytics
- 📍 Endpoint performance metrics
- 📊 Interactive charts & graphs

### 👨‍💼 Admin Panel
- 🎛️ Dashboard with overview stats
- 🔑 API key management (create, edit, delete)
- 📊 Detailed analytics & insights
- 🔐 Secure admin authentication
- 📧 Password reset functionality

### 🚀 Deployment
- 🐳 Docker support
- ☁️ Cloud-ready configuration
- 🔄 Auto-deploy from Git
- 💤 Keep-alive for free tiers
- 📝 Comprehensive deployment guides

## 🛠️ Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Templates**: EJS
- **Authentication**: Express Sessions
- **Email**: Resend / Nodemailer
- **Security**: Helmet, CORS, Rate Limiting

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ installed
- MongoDB Atlas account (free tier)
- Git installed

### Installation

```bash
# Clone the repository
git clone git@github.com:aakash688/reverse-kyvex.ai.git
cd reverse-kyvex.ai

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### Configuration

Edit `.env` file with your settings:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kyvex-api

# Server
PORT=3000
NODE_ENV=development

# Session
SESSION_SECRET=your-random-secret-here

# Admin
ADMIN_INITIAL_USERNAME=admin
ADMIN_INITIAL_PASSWORD=your-secure-password
ADMIN_INITIAL_EMAIL=admin@example.com

# Email (for password reset)
EMAIL_PROVIDER=resend
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=noreply@yourdomain.com

# Kyvex.ai
KYVEX_API_URL=https://kyvex.ai/api/v1
```

### Run Locally

```bash
# Development mode
npm run dev

# Production mode
npm start
```

Visit:
- 🌐 API: `http://localhost:3000`
- 👨‍💼 Admin Panel: `http://localhost:3000/admin`

## 📖 API Documentation

### Authentication

All API requests require an API key in the Authorization header:

```bash
Authorization: Bearer sk-your-api-key-here
```

### Endpoints

#### 1. Chat Completions

**POST** `/v1/chat/completions`

OpenAI-compatible chat endpoint with streaming support.

**Request:**
```json
{
  "model": "claude-sonnet-4.5",
  "messages": [
    {"role": "user", "content": "Hello!"}
  ],
  "stream": true,
  "thread_id": "optional-thread-id"
}
```

**Response:** (Streaming)
```
data: {"id":"chatcmpl-001","object":"chat.completion.chunk",...}
data: {"id":"chatcmpl-001","object":"chat.completion.chunk",...}
data: [DONE]
```

#### 2. List Models

**GET** `/v1/models`

Returns available AI models.

**Response:**
```json
{
  "object": "list",
  "data": [
    {
      "id": "claude-sonnet-4.5",
      "object": "model",
      "owned_by": "openrouter"
    }
  ]
}
```

#### 3. Health Check

**GET** `/health`

Check API health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected"
}
```

### Thread Management

Threads are automatically managed. Include `thread_id` in requests to continue conversations:

```json
{
  "thread_id": "your-thread-id",
  "messages": [...]
}
```

If no `thread_id` is provided, a new thread is created automatically.

## 👨‍💼 Admin Panel

### Access

Navigate to `/admin` and login with your admin credentials.

### Features

- 📊 **Dashboard**: Overview statistics, request counts, error rates
- 🔑 **API Keys**: Create, manage, and monitor API keys
- 📈 **Analytics**: Detailed usage analytics with charts
- ⚙️ **Settings**: Account management

### Default Login

After first deployment, login with:
- **Username**: `admin` (or as set in `ADMIN_INITIAL_USERNAME`)
- **Password**: As set in `ADMIN_INITIAL_PASSWORD`

⚠️ **Important**: Change the default password immediately after first login!

## 🚀 Deployment

### Free Hosting Options

#### 🎯 Render (Recommended)

**Features:**
- ✅ No request limits
- ✅ Always-on with keep-alive
- ✅ Auto-deploy from Git
- ✅ Free forever

**Quick Deploy:**

1. Push code to GitHub
2. Connect repository to [Render](https://render.com)
3. Set environment variables
4. Enable keep-alive: `KEEP_ALIVE_ENABLED=true`
5. Deploy!

📖 See [RENDER_KEEPALIVE.md](RENDER_KEEPALIVE.md) for keep-alive setup.

#### ☁️ Google Cloud Run

**Features:**
- ✅ 2 million requests/month free
- ✅ Auto-scaling
- ✅ Global CDN

#### 🐳 Docker

```bash
# Build image
docker build -t kyvex-api-proxy .

# Run container
docker run -p 3000:3000 --env-file .env kyvex-api-proxy
```

📖 See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment guides.

## 📁 Project Structure

```
kyvex-api-proxy/
├── src/
│   ├── config/          # Configuration files
│   ├── middleware/      # Express middleware
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   ├── views/           # EJS templates
│   └── server.js        # Main server file
├── public/              # Static assets
├── .env.example         # Environment template
├── package.json         # Dependencies
└── README.md           # This file
```

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | ✅ |
| `SESSION_SECRET` | Secret for session encryption | ✅ |
| `KYVEX_API_URL` | Kyvex.ai API base URL | ✅ |
| `PORT` | Server port | ❌ (default: 3000) |
| `ADMIN_INITIAL_USERNAME` | Initial admin username | ❌ (default: admin) |
| `ADMIN_INITIAL_PASSWORD` | Initial admin password | ✅ |
| `EMAIL_PROVIDER` | Email service (resend/smtp) | ❌ |
| `RESEND_API_KEY` | Resend API key | ❌ |
| `KEEP_ALIVE_ENABLED` | Enable keep-alive service | ❌ (default: true) |

See `.env.example` for all available options.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 👤 Author

**Aakash Singh**

- GitHub: [@aakash688](https://github.com/aakash688)
- Repository: [reverse-kyvex.ai](https://github.com/aakash688/reverse-kyvex.ai)

## 🙏 Acknowledgments

- [Kyvex.ai](https://kyvex.ai) for the AI backend
- [OpenAI](https://openai.com) for API compatibility reference
- All open-source contributors

## 📞 Support

For issues, questions, or contributions, please open an issue on GitHub.

---

<div align="center">

Made with ❤️ by [Aakash Singh](https://github.com/aakash688)

⭐ Star this repo if you find it helpful!

</div>

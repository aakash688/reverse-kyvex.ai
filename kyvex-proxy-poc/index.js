const express = require("express");
const axios = require("axios");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(cors());
app.use(express.json());

// ==============================
// Cookie Pool Management
// ==============================

/**
 * Generate random string for browserId
 */
function generateRandomString(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a new browserId cookie
 */
function generateBrowserId() {
  return `BRWS-${generateRandomString(32)}`;
}

/**
 * Cookie pool with usage tracking
 */
class CookiePool {
  constructor() {
    this.cookies = new Map(); // browserId -> { cookie, requestsToday, lastUsed }
    this.maxRequestsPerCookie = 50; // kyvex.ai limit per cookie
    this.minCookies = 5; // Minimum cookies to maintain
  }

  /**
   * Add a new cookie to the pool
   */
  addCookie(browserId = null) {
    const id = browserId || generateBrowserId();
    const cookie = `browserId=${id}`;
    
    this.cookies.set(id, {
      cookie,
      browserId: id,
      requestsToday: 0,
      lastUsed: null,
      createdAt: new Date(),
    });
    
    console.log(`✅ Added cookie: ${id.substring(0, 20)}...`);
    return cookie;
  }

  /**
   * Get the best available cookie (lowest usage)
   */
  getBestCookie() {
    // Filter cookies that haven't hit limit
    const available = Array.from(this.cookies.values())
      .filter(c => c.requestsToday < this.maxRequestsPerCookie)
      .sort((a, b) => {
        // Sort by: 1) requestsToday (asc), 2) lastUsed (asc)
        if (a.requestsToday !== b.requestsToday) {
          return a.requestsToday - b.requestsToday;
        }
        const aTime = a.lastUsed ? new Date(a.lastUsed).getTime() : 0;
        const bTime = b.lastUsed ? new Date(b.lastUsed).getTime() : 0;
        return aTime - bTime;
      });

    if (available.length === 0) {
      // All cookies exhausted, generate new one
      console.log('⚠️  All cookies exhausted, generating new cookie...');
      return this.addCookie();
    }

    return available[0];
  }

  /**
   * Mark a cookie as used
   */
  markUsed(browserId) {
    const cookieData = this.cookies.get(browserId);
    if (cookieData) {
      cookieData.requestsToday += 1;
      cookieData.lastUsed = new Date();
    }
  }

  /**
   * Get pool statistics
   */
  getStats() {
    const total = this.cookies.size;
    const available = Array.from(this.cookies.values())
      .filter(c => c.requestsToday < this.maxRequestsPerCookie).length;
    const exhausted = total - available;
    const totalRequests = Array.from(this.cookies.values())
      .reduce((sum, c) => sum + c.requestsToday, 0);

    return {
      total,
      available,
      exhausted,
      totalRequests,
      cookies: Array.from(this.cookies.values()).map(c => ({
        browserId: c.browserId.substring(0, 20) + '...',
        requestsToday: c.requestsToday,
        lastUsed: c.lastUsed,
      })),
    };
  }

  /**
   * Initialize with multiple cookies
   */
  initialize(count = 10) {
    console.log(`🚀 Initializing cookie pool with ${count} cookies...`);
    for (let i = 0; i < count; i++) {
      this.addCookie();
    }
    console.log(`✅ Cookie pool initialized with ${this.cookies.size} cookies`);
  }

  /**
   * Auto-generate cookies if running low
   */
  autoGenerateIfNeeded() {
    const available = Array.from(this.cookies.values())
      .filter(c => c.requestsToday < this.maxRequestsPerCookie).length;

    if (available < this.minCookies) {
      const needed = this.minCookies - available;
      console.log(`⚠️  Low on cookies (${available} available), generating ${needed} more...`);
      for (let i = 0; i < needed; i++) {
        this.addCookie();
      }
    }
  }
}

// Initialize cookie pool
const cookiePool = new CookiePool();
cookiePool.initialize(10); // Start with 10 cookies

// ==============================
// In-memory conversation store
// conversation_id -> kyvexThreadId
// ==============================
const conversations = new Map();

// ==============================
// API Endpoints
// ==============================

app.post("/v1/chat/completions", async (req, res) => {
  try {
    const { model, messages, conversation_id } = req.body;

    if (!model || !messages || messages.length === 0) {
      return res.status(400).json({ error: "Invalid request" });
    }

    // Get best available cookie from pool
    const cookieData = cookiePool.getBestCookie();
    const cookie = cookieData.cookie;
    const browserId = cookieData.browserId;

    console.log(`📊 Using cookie: ${browserId.substring(0, 20)}... (${cookieData.requestsToday}/${cookiePool.maxRequestsPerCookie} requests)`);

    const userMessage = messages[messages.length - 1].content;
    let kyvexThreadId = conversations.get(conversation_id);

    // Kyvex payload
    const payload = {
      model: model === "kyvex" ? "kyvex" : model, // Support both formats
      prompt: userMessage,
      threadId: kyvexThreadId || null,
      webSearch: false,
      generateImage: false,
      reasoning: false,
      files: [],
      inputAudio: "",
      autoRoute: false,
      stream: true
    };

    // SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const kyvexRes = await axios.post(
      "https://kyvex.ai/api/v1/ai/stream",
      payload,
      {
        responseType: "stream",
        headers: {
          "Content-Type": "application/json",
          "Accept": "text/event-stream",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Origin": "https://kyvex.ai",
          "Referer": "https://kyvex.ai/",
          "Cookie": cookie
        }
      }
    );

    let responseStarted = false;
    let hasError = false;

    kyvexRes.data.on("data", chunk => {
      const text = chunk.toString();

      // Capture THREAD_ID from stream
      const match = text.match(/\[THREAD_ID:(.*?)\]/);
      if (match && !kyvexThreadId) {
        kyvexThreadId = match[1].trim();
        const convId = conversation_id || uuidv4();
        conversations.set(convId, kyvexThreadId);

        // Send conversation_id to client
        res.write(`data: ${JSON.stringify({ conversation_id: convId })}\n\n`);
      }

      // Check for rate limit errors - detect the exact message
      const textLower = text.toLowerCase();
      if (textLower.includes('text prompts limit reached') || 
          textLower.includes('limit reached') ||
          (textLower.includes('sign up') && textLower.includes('limit')) ||
          textLower.includes('rate limit')) {
        console.error(`❌ Rate limit detected for cookie: ${browserId.substring(0, 20)}...`);
        console.error(`   Response: ${text.substring(0, 100)}...`);
        cookiePool.markUsed(browserId); // Mark as exhausted
        cookiePool.autoGenerateIfNeeded(); // Generate new cookies if needed
        hasError = true;
        // Send error to client
        if (!res.headersSent) {
          res.write(`data: ${JSON.stringify({
            error: {
              message: "Rate limit reached for this cookie. System will rotate to next cookie.",
              type: "rate_limit"
            }
          })}\n\n`);
        }
        return;
      }

      // Forward tokens OpenAI-style
      if (!hasError) {
        responseStarted = true;
        res.write(
          `data: ${JSON.stringify({
            choices: [
              {
                delta: { content: text }
              }
            ]
          })}\n\n`
        );
      }
    });

    kyvexRes.data.on("end", () => {
      if (!hasError && responseStarted) {
        // Mark cookie as used only on successful completion
        cookiePool.markUsed(browserId);
        cookiePool.autoGenerateIfNeeded(); // Auto-generate if needed
      }
      
      res.write("data: [DONE]\n\n");
      res.end();
    });

    kyvexRes.data.on("error", (err) => {
      console.error(`❌ Stream error for cookie ${browserId.substring(0, 20)}...:`, err.message);
      cookiePool.markUsed(browserId);
      cookiePool.autoGenerateIfNeeded();
      
      if (!res.headersSent) {
        res.status(500).json({ error: "Stream error" });
      } else {
        res.end();
      }
    });

  } catch (err) {
    console.error("❌ ERROR:", err.message);

    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Data:", err.response.data?.toString()?.substring(0, 200));
      
      // If rate limit error, mark cookie as used
      if (err.response.status === 429 || err.response.data?.toString().includes('limit')) {
        const cookieData = cookiePool.getBestCookie();
        cookiePool.markUsed(cookieData.browserId);
        cookiePool.autoGenerateIfNeeded();
      }
    }

    if (!res.headersSent) {
      res.status(err.response?.status || 500).json({ 
        error: err.response?.data?.toString() || "Proxy error" 
      });
    } else {
      res.end();
    }
  }
});

// ==============================
// Admin Endpoints
// ==============================

/**
 * Get cookie pool statistics
 */
app.get("/admin/stats", (req, res) => {
  res.json({
    success: true,
    ...cookiePool.getStats(),
  });
});

/**
 * Generate new cookies
 */
app.post("/admin/generate-cookies", (req, res) => {
  const { count = 5 } = req.body;
  const generated = [];
  
  for (let i = 0; i < count; i++) {
    const cookie = cookiePool.addCookie();
    generated.push(cookie);
  }
  
  res.json({
    success: true,
    message: `Generated ${count} cookies`,
    generated: generated.length,
    stats: cookiePool.getStats(),
  });
});

/**
 * Reset daily counters (for testing)
 */
app.post("/admin/reset-counters", (req, res) => {
  cookiePool.cookies.forEach(cookie => {
    cookie.requestsToday = 0;
  });
  
  res.json({
    success: true,
    message: "Counters reset",
    stats: cookiePool.getStats(),
  });
});

// ==============================
// Serve Dashboard
// ==============================

const path = require("path");
const fs = require("fs");

app.get("/dashboard", (req, res) => {
  const dashboardPath = path.join(__dirname, "dashboard.html");
  if (fs.existsSync(dashboardPath)) {
    res.sendFile(dashboardPath);
  } else {
    res.status(404).json({ error: "Dashboard not found" });
  }
});

// ==============================
// Server Start
// ==============================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Kyvex Proxy POC running at http://localhost:" + PORT);
  console.log(`📊 Cookie Pool: ${cookiePool.cookies.size} cookies initialized`);
  console.log(`💡 Each cookie = ${cookiePool.maxRequestsPerCookie} requests/day`);
  console.log(`💡 Total capacity: ${cookiePool.cookies.size * cookiePool.maxRequestsPerCookie} requests/day`);
  console.log("\n📋 Endpoints:");
  console.log("  POST /v1/chat/completions - Chat endpoint");
  console.log("  GET  /admin/stats - Cookie pool statistics");
  console.log("  POST /admin/generate-cookies - Generate more cookies");
  console.log("  POST /admin/reset-counters - Reset usage counters (testing)");
  console.log("  GET  /dashboard - Web dashboard (http://localhost:" + PORT + "/dashboard)");
});

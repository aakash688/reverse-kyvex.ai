import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import { connectDB } from './config/database.js';
import { sessionConfig } from './config/session.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { trackUsage } from './middleware/usageTracker.js';

// Routes
import healthRoutes from './routes/health.js';
import keepAliveRoutes from './routes/keepalive.js';
import chatRoutes from './routes/v1/chat.js';
import modelsRoutes from './routes/v1/models.js';
import adminAuthRoutes from './routes/admin/auth.js';
import adminDashboardRoutes from './routes/admin/dashboard.js';
import adminApiKeysRoutes from './routes/admin/apiKeys.js';
import adminAnalyticsRoutes from './routes/admin/analytics.js';
import adminSettingsRoutes from './routes/admin/settings.js';

// Initialize admin user on startup
import AdminUser from './models/AdminUser.js';
import keepAliveService from './services/keepAlive.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy (for Railway/Render)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors());
app.use(mongoSanitize());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session middleware
app.use(sessionConfig);

// View engine setup
app.set('view engine', 'ejs');
app.set('views', './src/views');

// Static files
app.use(express.static('public'));

// Rate limiting for API routes
app.use('/v1', apiRateLimiter);

// Health check (no auth required)
app.use('/health', healthRoutes);

// Keep-alive endpoint (no auth required)
app.use('/', keepAliveRoutes);

// API routes (require API key auth + usage tracking)
app.use('/v1/chat', trackUsage, chatRoutes);
app.use('/v1', trackUsage, modelsRoutes);

// Admin routes
app.use('/admin', adminAuthRoutes);
app.use('/admin', adminDashboardRoutes);
app.use('/admin', adminApiKeysRoutes);
app.use('/admin', adminAnalyticsRoutes);
app.use('/admin', adminSettingsRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize admin user on startup
const initializeAdmin = async () => {
  try {
    const adminCount = await AdminUser.countDocuments();
    
    if (adminCount === 0) {
      // Create initial admin user
      const adminUser = new AdminUser({
        username: process.env.ADMIN_INITIAL_USERNAME || 'admin',
        email: process.env.ADMIN_INITIAL_EMAIL || 'admin@example.com',
      });
      
      const password = process.env.ADMIN_INITIAL_PASSWORD || 'admin123';
      await adminUser.setPassword(password);
      await adminUser.save();
      
      console.log('Initial admin user created:');
      console.log(`Username: ${adminUser.username}`);
      console.log(`Email: ${adminUser.email}`);
      console.log(`Password: ${password}`);
      console.log('Please change the password after first login!');
    }
  } catch (error) {
    console.error('Failed to initialize admin user:', error);
  }
};

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Initialize admin user
    await initializeAdmin();
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Admin panel: http://localhost:${PORT}/admin`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  keepAliveService.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  keepAliveService.stop();
  process.exit(0);
});

export default app;


import express from 'express';
import { connectDB } from '../config/database.js';

const router = express.Router();

/**
 * GET /health
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
  try {
    // Check database connection
    await connectDB();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message,
    });
  }
});

export default router;


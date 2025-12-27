import express from 'express';
import { requireAdminAuth } from '../../middleware/adminAuth.js';
import AdminUser from '../../models/AdminUser.js';
import analyticsService from '../../services/analyticsService.js';

const router = express.Router();

/**
 * GET /admin/analytics
 * Analytics dashboard page
 */
router.get('/analytics', requireAdminAuth, async (req, res) => {
  try {
    const adminUser = await AdminUser.findById(req.session.adminId);

    res.render('admin/analytics', {
      title: 'Analytics',
      username: adminUser.username,
      showHeader: true,
      showSidebar: true,
      currentPage: 'analytics',
    });
  } catch (error) {
    console.error('Analytics page error:', error);
    res.status(500).render('admin/analytics', {
      title: 'Analytics',
      username: req.session.username,
      showHeader: true,
      showSidebar: true,
      currentPage: 'analytics',
      error: 'Failed to load analytics',
    });
  }
});

/**
 * GET /admin/api/stats/overview
 * Get overview statistics (JSON)
 */
router.get('/api/stats/overview', requireAdminAuth, async (req, res) => {
  try {
    const stats = await analyticsService.getOverviewStats();
    res.json(stats);
  } catch (error) {
    console.error('Overview stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /admin/api/stats/usage
 * Get usage statistics
 */
router.get('/api/stats/usage', requireAdminAuth, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const usage = await analyticsService.getUsageByTime(days);
    res.json(usage);
  } catch (error) {
    console.error('Usage stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /admin/api/stats/models
 * Get model usage statistics
 */
router.get('/api/stats/models', requireAdminAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const models = await analyticsService.getModelUsage(limit);
    res.json(models);
  } catch (error) {
    console.error('Model stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /admin/api/stats/endpoints
 * Get endpoint usage statistics
 */
router.get('/api/stats/endpoints', requireAdminAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const endpoints = await analyticsService.getEndpointUsage(limit);
    res.json(endpoints);
  } catch (error) {
    console.error('Endpoint stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /admin/api/stats/top-keys
 * Get top API keys by usage
 */
router.get('/api/stats/top-keys', requireAdminAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const topKeys = await analyticsService.getTopApiKeys(limit);
    res.json(topKeys);
  } catch (error) {
    console.error('Top keys stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /admin/api/stats/errors
 * Get error statistics
 */
router.get('/api/stats/errors', requireAdminAuth, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const errors = await analyticsService.getErrorStats(days);
    res.json(errors);
  } catch (error) {
    console.error('Error stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;


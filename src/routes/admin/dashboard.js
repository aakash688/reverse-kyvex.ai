import express from 'express';
import { requireAdminAuth } from '../../middleware/adminAuth.js';
import AdminUser from '../../models/AdminUser.js';
import analyticsService from '../../services/analyticsService.js';

const router = express.Router();

/**
 * GET /admin
 * Redirect to dashboard
 */
router.get('/', requireAdminAuth, (req, res) => {
  res.redirect('/admin/dashboard');
});

/**
 * GET /admin/dashboard
 * Main dashboard page
 */
router.get('/dashboard', requireAdminAuth, async (req, res) => {
  try {
    const adminUser = await AdminUser.findById(req.session.adminId);
    
    const stats = await analyticsService.getOverviewStats();
    
    res.render('admin/dashboard', {
      title: 'Dashboard',
      username: adminUser.username,
      showHeader: true,
      showSidebar: true,
      currentPage: 'dashboard',
      stats,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).render('admin/dashboard', {
      title: 'Dashboard',
      username: req.session.username,
      showHeader: true,
      showSidebar: true,
      currentPage: 'dashboard',
      stats: {},
      error: 'Failed to load dashboard statistics',
    });
  }
});

export default router;


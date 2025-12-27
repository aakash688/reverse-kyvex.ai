import express from 'express';
import { requireAdminAuth } from '../../middleware/adminAuth.js';
import AdminUser from '../../models/AdminUser.js';

const router = express.Router();

/**
 * GET /admin/settings
 * Settings page
 */
router.get('/settings', requireAdminAuth, async (req, res) => {
  try {
    const adminUser = await AdminUser.findById(req.session.adminId);

    res.render('admin/settings', {
      title: 'Settings',
      username: adminUser.username,
      showHeader: true,
      showSidebar: true,
      currentPage: 'settings',
      adminUser,
    });
  } catch (error) {
    console.error('Settings page error:', error);
    res.status(500).render('admin/settings', {
      title: 'Settings',
      username: req.session.username,
      showHeader: true,
      showSidebar: true,
      currentPage: 'settings',
      error: 'Failed to load settings',
    });
  }
});

export default router;


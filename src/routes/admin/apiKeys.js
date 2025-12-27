import express from 'express';
import { requireAdminAuth } from '../../middleware/adminAuth.js';
import AdminUser from '../../models/AdminUser.js';
import ApiKey from '../../models/ApiKey.js';
import { validateApiKeyCreation } from '../../utils/validators.js';
import crypto from 'crypto';
import { logger } from '../../utils/logger.js';

const router = express.Router();

/**
 * Generate a new API key
 * @returns {string} - API key
 */
const generateApiKey = () => {
  return `sk-${crypto.randomBytes(32).toString('hex')}`;
};

/**
 * GET /admin/api-keys
 * List all API keys
 */
router.get('/api-keys', requireAdminAuth, async (req, res) => {
  try {
    const adminUser = await AdminUser.findById(req.session.adminId);
    const apiKeys = await ApiKey.find().sort({ createdAt: -1 });

    res.render('admin/api-keys', {
      title: 'API Keys',
      username: adminUser.username,
      showHeader: true,
      showSidebar: true,
      currentPage: 'api-keys',
      apiKeys,
      message: req.query.message || null,
      error: req.query.error || null,
    });
  } catch (error) {
    logger.error('API keys list error:', error);
    res.status(500).render('admin/api-keys', {
      title: 'API Keys',
      username: req.session.username,
      showHeader: true,
      showSidebar: true,
      currentPage: 'api-keys',
      apiKeys: [],
      error: 'Failed to load API keys',
    });
  }
});

/**
 * POST /admin/api-keys
 * Create new API key
 */
router.post('/api-keys', requireAdminAuth, validateApiKeyCreation, async (req, res) => {
  try {
    const { name, rateLimit } = req.body;

    const apiKey = generateApiKey();

    const newApiKey = new ApiKey({
      apiKey,
      name: name || null,
      rateLimit: rateLimit ? parseInt(rateLimit) : null,
      isActive: true,
    });

    await newApiKey.save();

    logger.info(`API key created: ${apiKey.substring(0, 10)}...`);

    res.redirect(`/admin/api-keys?message=API key created successfully. Key: ${apiKey}`);
  } catch (error) {
    logger.error('Create API key error:', error);
    res.redirect(`/admin/api-keys?error=Failed to create API key: ${error.message}`);
  }
});

/**
 * PUT /admin/api-keys/:id
 * Update API key
 */
router.put('/api-keys/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, rateLimit, isActive } = req.body;

    const apiKey = await ApiKey.findById(id);

    if (!apiKey) {
      return res.status(404).json({ error: 'API key not found' });
    }

    if (name !== undefined) apiKey.name = name || null;
    if (rateLimit !== undefined) apiKey.rateLimit = rateLimit ? parseInt(rateLimit) : null;
    if (isActive !== undefined) apiKey.isActive = isActive === 'true' || isActive === true;

    await apiKey.save();

    logger.info(`API key updated: ${id}`);

    res.json({ success: true, apiKey });
  } catch (error) {
    logger.error('Update API key error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /admin/api-keys/:id
 * Delete/revoke API key
 */
router.delete('/api-keys/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const apiKey = await ApiKey.findById(id);

    if (!apiKey) {
      return res.status(404).json({ error: 'API key not found' });
    }

    // Instead of deleting, mark as inactive
    apiKey.isActive = false;
    await apiKey.save();

    logger.info(`API key revoked: ${id}`);

    res.json({ success: true });
  } catch (error) {
    logger.error('Delete API key error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /admin/api-keys/:id
 * View API key details
 */
router.get('/api-keys/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const adminUser = await AdminUser.findById(req.session.adminId);

    const apiKey = await ApiKey.findById(id);

    if (!apiKey) {
      return res.redirect('/admin/api-keys?error=API key not found');
    }

    res.render('admin/api-key-detail', {
      title: 'API Key Details',
      username: adminUser.username,
      showHeader: true,
      showSidebar: true,
      currentPage: 'api-keys',
      apiKey,
    });
  } catch (error) {
    logger.error('API key detail error:', error);
    res.redirect('/admin/api-keys?error=Failed to load API key details');
  }
});

export default router;


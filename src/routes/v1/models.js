import express from 'express';
import { authenticateApiKey } from '../../middleware/auth.js';
import kyvexService from '../../services/kyvexService.js';
import openaiAdapter from '../../services/openaiAdapter.js';
import { logger } from '../../utils/logger.js';

const router = express.Router();

/**
 * GET /v1/models
 * OpenAI-compatible models list endpoint
 */
router.get('/models', authenticateApiKey, async (req, res) => {
  try {
    // Get models from Kyvex
    const kyvexResponse = await kyvexService.listModels();

    // Convert to OpenAI format
    const openaiResponse = openaiAdapter.convertModelsToOpenAI(kyvexResponse);

    res.json(openaiResponse);
  } catch (error) {
    logger.error('Models endpoint error:', error);
    res.status(500).json({
      error: {
        message: error.message || 'Internal server error',
        type: 'internal_error',
      },
    });
  }
});

export default router;


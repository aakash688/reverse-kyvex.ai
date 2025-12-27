import express from 'express';
import { authenticateApiKey } from '../../middleware/auth.js';
import { validateChatCompletions } from '../../utils/validators.js';
import threadService from '../../services/threadService.js';
import kyvexService from '../../services/kyvexService.js';
import openaiAdapter from '../../services/openaiAdapter.js';
import ApiKey from '../../models/ApiKey.js';
import { logger } from '../../utils/logger.js';

const router = express.Router();

/**
 * POST /v1/chat/completions
 * OpenAI-compatible chat completions endpoint
 */
router.post(
  '/completions',
  authenticateApiKey,
  validateChatCompletions,
  async (req, res) => {
    try {
      const {
        model = 'claude-sonnet-4.5',
        messages = [],
        stream = true,
        thread_id: userThreadId,
        files = [],
        inputAudio = '',
        webSearch = false,
        generateImage = false,
        reasoning = false,
        autoRoute = false,
      } = req.body;

      // Get or create thread
      const thread = await threadService.getOrCreateThread(req.apiKey, userThreadId);

      // Convert OpenAI request to Kyvex format
      const kyvexRequest = openaiAdapter.convertRequestToKyvex(
        {
          model,
          messages,
          stream,
          files,
          inputAudio,
          webSearch,
          generateImage,
          reasoning,
          autoRoute,
        },
        thread.kyvexThreadId || null
      );

      // Handle streaming response
      if (stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Get stream from Kyvex
        const kyvexStream = await kyvexService.streamChat(kyvexRequest);

        // Track thread ID extraction
        let extractedThreadId = null;
        const handleThreadId = (threadId) => {
          extractedThreadId = threadId;
          // Update thread with Kyvex thread ID
          threadService.updateThreadWithKyvexId(
            thread.threadId,
            req.apiKey,
            threadId,
            model
          );
        };

        // Convert stream to OpenAI format
        const openaiStream = openaiAdapter.convertStreamToOpenAI(kyvexStream, handleThreadId);

        // Pipe stream to response
        const reader = openaiStream.getReader();
        const encoder = new TextEncoder();

        const pump = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              res.write(value);
            }
            res.end();
          } catch (error) {
            logger.error('Stream pump error:', error);
            res.end();
          }
        };

        pump();

        // Update API key usage count
        await ApiKey.findOneAndUpdate(
          { apiKey: req.apiKey },
          { $inc: { usageCount: 1 }, lastUsedAt: new Date() }
        );
      } else {
        // Non-streaming response (not fully supported by Kyvex, but handle gracefully)
        res.json({
          error: {
            message: 'Non-streaming responses are not supported. Please use stream: true',
            type: 'invalid_request_error',
          },
        });
      }
    } catch (error) {
      logger.error('Chat completions error:', error);
      res.status(500).json({
        error: {
          message: error.message || 'Internal server error',
          type: 'internal_error',
        },
      });
    }
  }
);

export default router;


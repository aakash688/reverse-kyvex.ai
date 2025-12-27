import { v4 as uuidv4 } from 'uuid';
import Thread from '../models/Thread.js';
import { logger } from '../utils/logger.js';

/**
 * Service to manage thread mappings between user threads and Kyvex threads
 */
class ThreadService {
  /**
   * Get or create thread mapping
   * @param {string} apiKey - API key
   * @param {string} userThreadId - User's thread ID (optional, will generate if not provided)
   * @returns {Promise<Object>} - Thread document
   */
  async getOrCreateThread(apiKey, userThreadId = null) {
    try {
      // Generate thread ID if not provided
      const threadId = userThreadId || uuidv4();

      // Check if thread exists
      let thread = await Thread.findOne({ threadId, apiKey });

      if (!thread) {
        // Create new thread (kyvexThreadId will be set when we get response from Kyvex)
        thread = new Thread({
          threadId,
          apiKey,
          kyvexThreadId: null, // Will be updated after first response
        });
        await thread.save();
        logger.debug(`Created new thread: ${threadId} for API key: ${apiKey}`);
      } else {
        // Update last used timestamp
        thread.lastUsedAt = new Date();
        await thread.save();
      }

      return thread;
    } catch (error) {
      logger.error('Thread service error:', error);
      throw error;
    }
  }

  /**
   * Update thread with Kyvex thread ID
   * @param {string} userThreadId - User's thread ID
   * @param {string} apiKey - API key
   * @param {string} kyvexThreadId - Kyvex thread ID
   * @param {string} model - Model used
   * @returns {Promise<Object>} - Updated thread document
   */
  async updateThreadWithKyvexId(userThreadId, apiKey, kyvexThreadId, model = null) {
    try {
      const thread = await Thread.findOne({ threadId: userThreadId, apiKey });

      if (thread) {
        thread.kyvexThreadId = kyvexThreadId;
        if (model) {
          thread.model = model;
        }
        thread.lastUsedAt = new Date();
        await thread.save();
        logger.debug(`Updated thread ${userThreadId} with Kyvex ID: ${kyvexThreadId}`);
      }

      return thread;
    } catch (error) {
      logger.error('Thread update error:', error);
      throw error;
    }
  }

  /**
   * Get thread by user thread ID
   * @param {string} userThreadId - User's thread ID
   * @param {string} apiKey - API key
   * @returns {Promise<Object|null>} - Thread document or null
   */
  async getThread(userThreadId, apiKey) {
    try {
      return await Thread.findOne({ threadId: userThreadId, apiKey });
    } catch (error) {
      logger.error('Get thread error:', error);
      throw error;
    }
  }

  /**
   * Get all threads for an API key
   * @param {string} apiKey - API key
   * @param {number} limit - Limit results
   * @param {number} skip - Skip results
   * @returns {Promise<Array>} - Array of thread documents
   */
  async getThreadsByApiKey(apiKey, limit = 50, skip = 0) {
    try {
      return await Thread.find({ apiKey })
        .sort({ lastUsedAt: -1 })
        .limit(limit)
        .skip(skip);
    } catch (error) {
      logger.error('Get threads by API key error:', error);
      throw error;
    }
  }
}

export default new ThreadService();


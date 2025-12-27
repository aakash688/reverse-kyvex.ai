import axios from 'axios';
import { logger } from '../utils/logger.js';

/**
 * Keep-alive service to prevent Render from sleeping
 * Pings the health endpoint every 5 minutes
 */
class KeepAliveService {
  constructor() {
    this.interval = null;
    this.appUrl = process.env.APP_URL || process.env.RENDER_EXTERNAL_URL || null;
    this.isEnabled = process.env.KEEP_ALIVE_ENABLED !== 'false';
  }

  /**
   * Start keep-alive pings
   */
  start() {
    if (!this.isEnabled) {
      logger.info('Keep-alive service disabled');
      return;
    }

    // If no URL is set, try to detect from environment
    if (!this.appUrl) {
      // On Render, RENDER_EXTERNAL_URL is automatically set
      // For other platforms, you can set APP_URL
      logger.warn('Keep-alive: No APP_URL or RENDER_EXTERNAL_URL set. Keep-alive disabled.');
      return;
    }

    const pingInterval = parseInt(process.env.KEEP_ALIVE_INTERVAL || '300000'); // 5 minutes default
    const healthEndpoint = `${this.appUrl}/health`;

    logger.info(`Keep-alive service started. Pinging ${healthEndpoint} every ${pingInterval / 1000} seconds`);

    // Ping immediately on start
    this.ping();

    // Then ping at intervals
    this.interval = setInterval(() => {
      this.ping();
    }, pingInterval);
  }

  /**
   * Ping the health endpoint
   */
  async ping() {
    try {
      const url = `${this.appUrl}/health`;
      const response = await axios.get(url, {
        timeout: 5000,
        headers: {
          'User-Agent': 'KeepAlive-Service/1.0',
        },
      });

      if (response.status === 200) {
        logger.debug('Keep-alive ping successful');
      }
    } catch (error) {
      logger.warn('Keep-alive ping failed:', error.message);
    }
  }

  /**
   * Stop keep-alive pings
   */
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      logger.info('Keep-alive service stopped');
    }
  }
}

export default new KeepAliveService();


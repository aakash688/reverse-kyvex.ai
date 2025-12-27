import ApiUsageLog from '../models/ApiUsageLog.js';
import ApiKey from '../models/ApiKey.js';
import Thread from '../models/Thread.js';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { logger } from '../utils/logger.js';

/**
 * Analytics service to aggregate and calculate statistics
 */
class AnalyticsService {
  /**
   * Get overview statistics
   * @returns {Promise<Object>} - Overview stats
   */
  async getOverviewStats() {
    try {
      const now = new Date();
      const todayStart = startOfDay(now);
      const weekStart = startOfDay(subDays(now, 7));
      const monthStart = startOfDay(subDays(now, 30));

      // Total requests
      const totalRequests = await ApiUsageLog.countDocuments();
      const todayRequests = await ApiUsageLog.countDocuments({
        timestamp: { $gte: todayStart },
      });
      const weekRequests = await ApiUsageLog.countDocuments({
        timestamp: { $gte: weekStart },
      });
      const monthRequests = await ApiUsageLog.countDocuments({
        timestamp: { $gte: monthStart },
      });

      // Active API keys
      const activeKeys = await ApiKey.countDocuments({ isActive: true });
      const totalKeys = await ApiKey.countDocuments();

      // Total threads
      const totalThreads = await Thread.countDocuments();

      // Error rate
      const totalErrors = await ApiUsageLog.countDocuments({
        statusCode: { $gte: 400 },
      });
      const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;

      // Average response time
      const avgResponseTimeResult = await ApiUsageLog.aggregate([
        {
          $group: {
            _id: null,
            avgResponseTime: { $avg: '$responseTime' },
          },
        },
      ]);
      const avgResponseTime = avgResponseTimeResult[0]?.avgResponseTime || 0;

      return {
        totalRequests,
        todayRequests,
        weekRequests,
        monthRequests,
        activeKeys,
        totalKeys,
        totalThreads,
        errorRate: parseFloat(errorRate.toFixed(2)),
        avgResponseTime: parseFloat(avgResponseTime.toFixed(2)),
      };
    } catch (error) {
      logger.error('Get overview stats error:', error);
      throw error;
    }
  }

  /**
   * Get usage statistics by time period
   * @param {number} days - Number of days
   * @returns {Promise<Array>} - Usage data
   */
  async getUsageByTime(days = 7) {
    try {
      const startDate = startOfDay(subDays(new Date(), days));
      
      const usageData = await ApiUsageLog.aggregate([
        {
          $match: {
            timestamp: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$timestamp',
              },
            },
            count: { $sum: 1 },
            avgResponseTime: { $avg: '$responseTime' },
            errors: {
              $sum: {
                $cond: [{ $gte: ['$statusCode', 400] }, 1, 0],
              },
            },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]);

      return usageData;
    } catch (error) {
      logger.error('Get usage by time error:', error);
      throw error;
    }
  }

  /**
   * Get model usage statistics
   * @param {number} limit - Limit results
   * @returns {Promise<Array>} - Model usage data
   */
  async getModelUsage(limit = 10) {
    try {
      const modelUsage = await ApiUsageLog.aggregate([
        {
          $match: {
            model: { $ne: null },
          },
        },
        {
          $group: {
            _id: '$model',
            count: { $sum: 1 },
            avgResponseTime: { $avg: '$responseTime' },
            errors: {
              $sum: {
                $cond: [{ $gte: ['$statusCode', 400] }, 1, 0],
              },
            },
          },
        },
        {
          $sort: { count: -1 },
        },
        {
          $limit: limit,
        },
      ]);

      return modelUsage;
    } catch (error) {
      logger.error('Get model usage error:', error);
      throw error;
    }
  }

  /**
   * Get endpoint usage statistics
   * @param {number} limit - Limit results
   * @returns {Promise<Array>} - Endpoint usage data
   */
  async getEndpointUsage(limit = 10) {
    try {
      const endpointUsage = await ApiUsageLog.aggregate([
        {
          $group: {
            _id: '$endpoint',
            count: { $sum: 1 },
            avgResponseTime: { $avg: '$responseTime' },
            errors: {
              $sum: {
                $cond: [{ $gte: ['$statusCode', 400] }, 1, 0],
              },
            },
          },
        },
        {
          $sort: { count: -1 },
        },
        {
          $limit: limit,
        },
      ]);

      return endpointUsage;
    } catch (error) {
      logger.error('Get endpoint usage error:', error);
      throw error;
    }
  }

  /**
   * Get top API keys by usage
   * @param {number} limit - Limit results
   * @returns {Promise<Array>} - Top API keys
   */
  async getTopApiKeys(limit = 10) {
    try {
      const topKeys = await ApiUsageLog.aggregate([
        {
          $match: {
            apiKey: { $ne: null },
          },
        },
        {
          $group: {
            _id: '$apiKey',
            count: { $sum: 1 },
            avgResponseTime: { $avg: '$responseTime' },
            errors: {
              $sum: {
                $cond: [{ $gte: ['$statusCode', 400] }, 1, 0],
              },
            },
          },
        },
        {
          $sort: { count: -1 },
        },
        {
          $limit: limit,
        },
      ]);

      // Enrich with API key details
      const enrichedKeys = await Promise.all(
        topKeys.map(async (key) => {
          const keyDoc = await ApiKey.findOne({ apiKey: key._id });
          return {
            ...key,
            name: keyDoc?.name || 'Unnamed',
            isActive: keyDoc?.isActive || false,
          };
        })
      );

      return enrichedKeys;
    } catch (error) {
      logger.error('Get top API keys error:', error);
      throw error;
    }
  }

  /**
   * Get error statistics
   * @param {number} days - Number of days
   * @returns {Promise<Object>} - Error stats
   */
  async getErrorStats(days = 7) {
    try {
      const startDate = startOfDay(subDays(new Date(), days));

      const errorStats = await ApiUsageLog.aggregate([
        {
          $match: {
            timestamp: { $gte: startDate },
            statusCode: { $gte: 400 },
          },
        },
        {
          $group: {
            _id: '$statusCode',
            count: { $sum: 1 },
          },
        },
        {
          $sort: { count: -1 },
        },
      ]);

      const totalErrors = errorStats.reduce((sum, stat) => sum + stat.count, 0);

      return {
        totalErrors,
        byStatusCode: errorStats,
      };
    } catch (error) {
      logger.error('Get error stats error:', error);
      throw error;
    }
  }
}

export default new AnalyticsService();


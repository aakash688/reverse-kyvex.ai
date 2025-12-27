import axios from 'axios';
import { KYVEX_CONFIG } from '../config/kyvex.js';
import { logger } from '../utils/logger.js';

/**
 * Service to communicate with Kyvex.ai API
 */
class KyvexService {
  constructor() {
    this.baseURL = KYVEX_CONFIG.API_URL;
  }

  /**
   * Stream chat completion from Kyvex.ai
   * @param {Object} payload - Request payload
   * @returns {Promise<ReadableStream>} - Stream of responses
   */
  async streamChat(payload) {
    try {
      const url = `${this.baseURL}${KYVEX_CONFIG.STREAM_ENDPOINT}`;
      
      const response = await axios({
        method: 'POST',
        url,
        data: payload,
        responseType: 'stream',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      logger.error('Kyvex stream error:', error.message);
      throw error;
    }
  }

  /**
   * Get list of available models
   * @returns {Promise<Object>} - Models list
   */
  async listModels() {
    try {
      const url = `${this.baseURL}${KYVEX_CONFIG.MODELS_ENDPOINT}`;
      
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      logger.error('Kyvex list models error:', error.message);
      throw error;
    }
  }

  /**
   * Extract thread ID from Kyvex response stream
   * Kyvex responses include thread ID in format: [THREAD_ID:THRD-...]
   * @param {string} data - Stream data chunk
   * @returns {string|null} - Extracted thread ID or null
   */
  extractThreadId(data) {
    const threadIdMatch = data.match(/\[THREAD_ID:(THRD-[^\]]+)\]/);
    return threadIdMatch ? threadIdMatch[1] : null;
  }

  /**
   * Parse SSE stream data
   * @param {string} chunk - Raw chunk from stream
   * @returns {Array<string>} - Array of data lines
   */
  parseSSEChunk(chunk) {
    const lines = chunk.toString().split('\n');
    const dataLines = [];

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.substring(6); // Remove 'data: ' prefix
        if (data.trim() && data.trim() !== '[DONE]') {
          dataLines.push(data);
        }
      }
    }

    return dataLines;
  }

  /**
   * Upload file to Kyvex
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} filename - File name
   * @param {string} checksum - File checksum (optional)
   * @returns {Promise<string>} - File URL
   */
  async uploadFile(fileBuffer, filename, checksum = null) {
    try {
      const url = `${this.baseURL}${KYVEX_CONFIG.FILE_UPLOAD_ENDPOINT}`;
      
      const FormData = (await import('form-data')).default;
      const formData = new FormData();
      formData.append('file', fileBuffer, filename);
      
      if (checksum) {
        formData.append('checkSum', checksum);
      }

      const response = await axios.post(url, formData, {
        headers: formData.getHeaders(),
      });

      return response.data.data; // Returns file URL
    } catch (error) {
      logger.error('Kyvex file upload error:', error.message);
      throw error;
    }
  }
}

export default new KyvexService();


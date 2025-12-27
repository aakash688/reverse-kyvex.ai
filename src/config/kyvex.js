import dotenv from 'dotenv';

dotenv.config();

export const KYVEX_CONFIG = {
  API_URL: process.env.KYVEX_API_URL || 'https://kyvex.ai/api/v1',
  STREAM_ENDPOINT: '/ai/stream',
  MODELS_ENDPOINT: '/ai/list-models',
  THREADS_ENDPOINT: '/ai/list-threads',
  FILE_UPLOAD_ENDPOINT: '/utils/file-upload',
};


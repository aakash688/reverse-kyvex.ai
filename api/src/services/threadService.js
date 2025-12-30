
/**
 * Thread service for managing conversation threads
 */

import { findOne, insertOne, updateOne, deleteMany } from '../utils/db.js';

export async function getOrCreateThread(apiKeyId, conversationId) {
  const existing = await findOne('threads', {
    api_key_id: apiKeyId,
    conversation_id: conversationId,
  });
  if (existing) {
    await updateOne(
      'threads',
      { id: existing.id },
      { last_used: new Date().toISOString() }
    );
    return existing.kyvex_thread_id;
  }
  const threadDoc = {
    api_key_id: apiKeyId,
    conversation_id: conversationId,
    kyvex_thread_id: null,
    last_used: new Date().toISOString(),
  };
  await insertOne('threads', threadDoc);
  return null;
}

export async function updateThreadWithKyvexId(apiKeyId, conversationId, kyvexThreadId) {
  await updateOne(
    'threads',
    {
      api_key_id: apiKeyId,
      conversation_id: conversationId,
    },
    {
      kyvex_thread_id: kyvexThreadId,
      last_used: new Date().toISOString(),
    }
  );
}

export async function getThread(apiKeyId, conversationId) {
  return await findOne('threads', {
    api_key_id: apiKeyId,
    conversation_id: conversationId,
  });
}

/**
 * Delete all threads, optionally filtered by API key
 */
export async function deleteAllThreads(apiKeyId = null) {
  const filter = apiKeyId ? { api_key_id: apiKeyId } : {};
  const result = await deleteMany('threads', filter);
  return result.deletedCount || 0;
}

/**
 * Get thread statistics
 */
export async function getThreadStats() {
  const { countDocuments } = await import('../utils/db.js');
  const total = await countDocuments('threads');
  return { total };
}
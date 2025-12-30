/**
 * Settings Service
 * Manages system-wide settings stored in database
 */

import { findOne, updateOne, insertOne, find } from '../utils/db.js';

/**
 * Get a setting value by key
 * @param {string} key - Setting key
 * @param {string} defaultValue - Default value if setting not found
 * @returns {Promise<string>} Setting value
 */
export async function getSetting(key, defaultValue = null) {
  const setting = await findOne('system_settings', { key });
  return setting ? setting.value : defaultValue;
}

/**
 * Set a setting value
 * @param {string} key - Setting key
 * @param {string} value - Setting value
 * @returns {Promise<void>}
 */
export async function setSetting(key, value) {
  const setting = await findOne('system_settings', { key });
  if (setting) {
    await updateOne('system_settings', { key }, {
      value: String(value),
      updated_at: new Date().toISOString(),
    });
  } else {
    await insertOne('system_settings', {
      key,
      value: String(value),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }
}

/**
 * Get all settings
 * @returns {Promise<Array>} Array of all settings
 */
export async function getAllSettings() {
  return await find('system_settings', {});
}


/**
 * Model service for managing custom model mappings
 */

import { findOne, find, insertOne, updateOne, deleteOne, rpc } from '../utils/db.js';
import { getKyvexModels } from './kyvex.js';

/**
 * Get all active custom models
 */
export async function getAllModels(includeInactive = false) {
  const filter = includeInactive ? {} : { is_active: true };
  return await find('models', filter, { sort: { created_at: -1 } });
}

/**
 * Get model by custom name
 */
export async function getModelByCustomName(customName) {
  return await findOne('models', { custom_name: customName });
}

/**
 * Get model by ID
 */
export async function getModelById(id) {
  return await findOne('models', { id });
}

/**
 * Create new model mapping
 * Uses stored procedure to bypass PostgREST schema cache issues
 */
export async function createModel(data) {
  try {
    // Try RPC first (bypasses PostgREST cache)
    try {
      const result = await rpc('insert_model', {
        p_custom_name: data.customName,
        p_provider_name: data.providerName,
        p_brand_name: data.brandName || 'Sahyog',
        p_permissions: data.permissions || '',
        p_is_active: data.isActive !== undefined ? data.isActive : true,
      });
      
      // RPC returns array, get first result
      if (Array.isArray(result) && result.length > 0) {
        return result[0];
      }
    } catch (rpcError) {
      console.warn('[ModelService] RPC failed, using two-step insert:', rpcError.message);
      
      // Fallback: two-step insert (workaround for PostgREST schema cache)
      // Step 1: Insert without permissions column
      const modelDoc = {
        custom_name: data.customName,
        provider_name: data.providerName,
        brand_name: data.brandName || 'Sahyog',
        is_active: data.isActive !== undefined ? data.isActive : true,
      };
      
      const insertResult = await insertOne('models', modelDoc);
      const modelId = insertResult.insertedId || insertResult.id;
      
      // Step 2: Update permissions if provided
      if (data.permissions) {
        try {
          await updateOne('models', { id: modelId }, {
            permissions: data.permissions,
          });
        } catch (updateError) {
          console.warn('[ModelService] Failed to update permissions, but model was created:', updateError.message);
        }
      }
      
      // Fetch the complete model
      const completeModel = await getModelById(modelId);
      return completeModel || { ...modelDoc, id: modelId, permissions: data.permissions || '' };
    }
  } catch (error) {
    console.error('[ModelService] Create model error:', error);
    throw error;
  }
}

/**
 * Update model mapping
 */
export async function updateModel(id, updates) {
  const updateDoc = {};
  
  if (updates.customName !== undefined) updateDoc.custom_name = updates.customName;
  if (updates.providerName !== undefined) updateDoc.provider_name = updates.providerName;
  if (updates.brandName !== undefined) updateDoc.brand_name = updates.brandName;
  if (updates.permissions !== undefined) updateDoc.permissions = updates.permissions;
  if (updates.isActive !== undefined) updateDoc.is_active = updates.isActive;
  updateDoc.updated_at = new Date().toISOString();
  
  if (Object.keys(updateDoc).length === 0) {
    return null;
  }

  await updateOne('models', { id }, updateDoc);
  return await getModelById(id);
}

/**
 * Delete model mapping
 */
export async function deleteModel(id) {
  return await deleteOne('models', { id });
}

/**
 * Get provider models from kyvex.ai
 * This fetches the actual available models from kyvex.ai
 */
export async function getProviderModels(kyvexCookie) {
  try {
    const models = await getKyvexModels(kyvexCookie);
    // Return unique provider models
    const uniqueModels = [];
    const seen = new Set();
    
    for (const model of models) {
      const modelId = model.id || model.name;
      if (modelId && !seen.has(modelId)) {
        seen.add(modelId);
        uniqueModels.push({
          id: modelId,
          name: model.name || modelId,
          provider: model.provider || 'unknown',
        });
      }
    }
    
    return uniqueModels;
  } catch (error) {
    console.error('Error fetching provider models:', error);
    throw error;
  }
}



/**
 * Models handler
 */

import { verifyApiKey, errorResponse } from '../middleware/auth.js';
import { getAllModels } from '../services/modelService.js';

/**
 * Handle list models request
 * Returns only active custom models from database
 */
export async function handleListModels(request) {
  try {
    // Verify API key
    const authResult = await verifyApiKey(request);
    if (authResult.error) {
      return errorResponse(authResult.error, authResult.status);
    }

    // Get only active custom models from database
    const models = await getAllModels(false); // false = only active

    // Format as OpenAI-style response
    const formattedModels = models.map(model => {
      // Parse permissions from text to array
      let permissions = [];
      if (model.permissions) {
        // Split by newline or comma, trim, and filter empty strings
        permissions = model.permissions
          .split(/[\n,]/)
          .map(p => p.trim())
          .filter(p => p.length > 0);
      }
      
      return {
        id: model.custom_name,
        object: 'model',
        created: new Date(model.created_at).getTime() || Date.now(),
        owned_by: model.brand_name || 'Sahyog',
        permission: permissions,
        root: model.custom_name,
        parent: null,
      };
    });

    return new Response(
      JSON.stringify({
        object: 'list',
        data: formattedModels,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('List models error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

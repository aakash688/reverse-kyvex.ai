
/**
 * Supabase database utilities for Cloudflare Workers
 */

// Import ENV from index.js (will be set per request)
let ENV = {};

export function setEnv(env) {
  ENV = env;
}

function getSupabaseUrl() {
  return ENV.SUPABASE_URL || '';
}

function getSupabaseAnonKey() {
  return ENV.SUPABASE_ANON_KEY || '';
}

async function supabaseRequest(table, method = 'GET', options = {}) {
  const SUPABASE_URL = getSupabaseUrl();
  const SUPABASE_ANON_KEY = getSupabaseAnonKey();
  
  // Ensure URL doesn't have trailing slash
  const baseUrl = SUPABASE_URL.replace(/\/$/, '');
  const url = `${baseUrl}/rest/v1/${table}${options.path || ''}`;
  
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
    ...options.headers,
  };
  
  let finalUrl = url;
  if (method === 'GET' && options.query) {
    const params = new URLSearchParams();
    Object.entries(options.query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // Handle special parameters that don't need eq. prefix
        if (key === 'order') {
          // Order format: column.asc or column.desc
          params.append(key, value);
        } else {
          // Supabase PostgREST format: column=operator.value
          // URLSearchParams will automatically encode the value
          // Ensure value is converted to string for proper encoding
          const stringValue = String(value);
          params.append(key, `eq.${stringValue}`);
        }
      }
    });
    if (params.toString()) {
      finalUrl += `?${params.toString()}`;
    }
    
    // Debug logging for cookie queries
    if (table === 'proxies' && options.query.type === 'cookie') {
      console.log(`[DB] Final query URL: ${finalUrl}`);
    }
  }
  
  try {
    const response = await fetch(finalUrl, {
      method,
      headers,
      ...(options.body && { body: JSON.stringify(options.body) }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Supabase error [${response.status}]:`, {
        url: finalUrl,
        method,
        table,
        error: errorText,
        hasUrl: !!SUPABASE_URL,
        hasKey: !!SUPABASE_ANON_KEY,
      });
      throw new Error(`Supabase operation failed: ${response.status} - ${errorText}`);
    }
    
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Supabase operation error:', {
      error: error.message,
      url: finalUrl,
      table,
      method,
      supabaseUrl: SUPABASE_URL ? 'SET' : 'MISSING',
      supabaseKey: SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
    });
    throw error;
  }
}

export async function findOne(table, filter) {
  const query = {};
  Object.entries(filter).forEach(([key, value]) => {
    query[key] = value;
  });
  const result = await supabaseRequest(table, 'GET', {
    query: query,
    headers: { 'Range': '0-0' },
  });
  return Array.isArray(result) && result.length > 0 ? result[0] : null;
}

export async function find(table, filter = {}, options = {}) {
  const query = {};
  Object.entries(filter).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query[key] = value;
    }
  });
  const headers = {};
  if (options.limit) {
    headers['Range'] = `0-${options.limit - 1}`;
  }
  if (options.sort) {
    const sortKey = Object.keys(options.sort)[0];
    const sortOrder = options.sort[sortKey] === -1 ? 'desc' : 'asc';
    query['order'] = `${sortKey}.${sortOrder}`;
  }
  
  // Debug logging for cookie queries
  if (table === 'proxies' && filter.type === 'cookie') {
    console.log(`[DB] Querying ${table} with filter:`, filter);
    console.log(`[DB] Query params:`, query);
  }
  
  const result = await supabaseRequest(table, 'GET', {
    query: query,
    headers,
  });
  
  // Debug logging for cookie queries
  if (table === 'proxies' && filter.type === 'cookie') {
    console.log(`[DB] Query result count:`, Array.isArray(result) ? result.length : 'not an array');
  }
  
  return Array.isArray(result) ? result : [];
}

export async function insertOne(table, document) {
  const result = await supabaseRequest(table, 'POST', {
    body: document,
  });
  return Array.isArray(result) && result.length > 0 
    ? { insertedId: result[0].id, id: result[0].id, ...result[0] }
    : { insertedId: null, id: null };
}

export async function updateOne(table, filter, update) {
  const SUPABASE_URL = getSupabaseUrl();
  const SUPABASE_ANON_KEY = getSupabaseAnonKey();
  const queryParams = new URLSearchParams();
  Object.entries(filter).forEach(([key, value]) => {
    queryParams.append(key, `eq.${value}`);
  });
  const url = `${SUPABASE_URL}/rest/v1/${table}?${queryParams.toString()}`;
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };
  const response = await fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(update.$set || update),
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Update failed: ${response.status} - ${error}`);
  }
  const result = await response.json();
  return Array.isArray(result) && result.length > 0 ? result[0] : null;
}

export async function deleteOne(table, filter) {
  const SUPABASE_URL = getSupabaseUrl();
  const SUPABASE_ANON_KEY = getSupabaseAnonKey();
  const queryParams = new URLSearchParams();
  Object.entries(filter).forEach(([key, value]) => {
    queryParams.append(key, `eq.${value}`);
  });
  const url = `${SUPABASE_URL}/rest/v1/${table}?${queryParams.toString()}`;
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Prefer': 'return=representation',
  };
  const response = await fetch(url, {
    method: 'DELETE',
    headers,
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Delete failed: ${response.status} - ${error}`);
  }
  return { deletedCount: 1 };
}

export async function deleteMany(table, filter = {}) {
  const SUPABASE_URL = getSupabaseUrl();
  const SUPABASE_ANON_KEY = getSupabaseAnonKey();
  const queryParams = new URLSearchParams();
  
  // If filter is empty, use id.not.is.null to match all records
  // Supabase requires a WHERE clause for DELETE
  if (Object.keys(filter).length === 0) {
    queryParams.append('id', 'not.is.null');
  } else {
    Object.entries(filter).forEach(([key, value]) => {
      queryParams.append(key, `eq.${value}`);
    });
  }
  
  const url = `${SUPABASE_URL}/rest/v1/${table}?${queryParams.toString()}`;
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Prefer': 'return=representation',
  };
  const response = await fetch(url, {
    method: 'DELETE',
    headers,
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Delete many failed: ${response.status} - ${error}`);
  }
  // Get count from response
  const deleted = await response.json();
  return { deletedCount: Array.isArray(deleted) ? deleted.length : 0 };
}

export async function aggregate(table, pipeline) {
  const result = await supabaseRequest(table, 'GET', {});
  return Array.isArray(result) ? result : [];
}

export async function countDocuments(table, filter = {}) {
  const SUPABASE_URL = getSupabaseUrl();
  const SUPABASE_ANON_KEY = getSupabaseAnonKey();
  const queryParams = new URLSearchParams();
  Object.entries(filter).forEach(([key, value]) => {
    queryParams.append(key, `eq.${value}`);
  });
  const url = `${SUPABASE_URL}/rest/v1/${table}?${queryParams.toString()}&select=count`;
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Prefer': 'count=exact',
  };
  const response = await fetch(url, {
    method: 'HEAD',
    headers,
  });
  const count = response.headers.get('content-range');
  if (count) {
    const match = count.match(/\/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }
  const result = await find(table, filter);
  return Array.isArray(result) ? result.length : 0;
}

/**
 * Call a stored procedure (RPC) in Supabase
 * @param {string} functionName - Name of the stored procedure
 * @param {object} params - Parameters to pass to the function
 * @returns {Promise<any>} Result from the function
 */
export async function rpc(functionName, params = {}) {
  const SUPABASE_URL = getSupabaseUrl();
  const SUPABASE_ANON_KEY = getSupabaseAnonKey();
  const baseUrl = SUPABASE_URL.replace(/\/$/, '');
  const url = `${baseUrl}/rest/v1/rpc/${functionName}`;
  
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };
  
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`RPC error [${response.status}]:`, {
      url,
      functionName,
      params,
      error: errorText,
    });
    throw new Error(`RPC call failed: ${response.status} - ${errorText}`);
  }
  
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return null;
  }
  
  const data = await response.json();
  return data;
}

/**
 * Script to add multiple cookies to an API key for unlimited requests
 * 
 * Usage:
 *   node scripts/add-multiple-cookies.js <api-key-id> <cookie1> <cookie2> <cookie3> ...
 * 
 * Example:
 *   node scripts/add-multiple-cookies.js abc-123-def "cookie1" "cookie2" "cookie3"
 * 
 * Or with comma-separated cookies:
 *   node scripts/add-multiple-cookies.js abc-123-def "cookie1,cookie2,cookie3"
 */

import { updateApiKey } from '../api/src/services/apiKey.js';
import { setDbEnv } from '../api/src/utils/db.js';

// Get API key ID and cookies from command line
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('Usage: node scripts/add-multiple-cookies.js <api-key-id> <cookie1> [cookie2] [cookie3] ...');
  console.error('Or: node scripts/add-multiple-cookies.js <api-key-id> "cookie1,cookie2,cookie3"');
  process.exit(1);
}

const apiKeyId = args[0];
const cookiesInput = args.slice(1).join(',');

// Parse cookies (support both comma-separated and individual args)
let cookies = [];
if (cookiesInput.includes(',')) {
  cookies = cookiesInput.split(',').map(c => c.trim()).filter(c => c);
} else {
  cookies = args.slice(1).map(c => c.trim()).filter(c => c);
}

if (cookies.length === 0) {
  console.error('Error: No valid cookies provided');
  process.exit(1);
}

// Set up database environment (you'll need to set these)
const dbEnv = {
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
};

if (!dbEnv.SUPABASE_URL || !dbEnv.SUPABASE_ANON_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set');
  console.error('Set them as environment variables or modify this script');
  process.exit(1);
}

setDbEnv(dbEnv);

async function main() {
  try {
    console.log(`Adding ${cookies.length} cookies to API key: ${apiKeyId}`);
    
    // Format as JSON array (more reliable than comma-separated)
    const cookiesJson = JSON.stringify(cookies);
    
    // Update API key
    const updated = await updateApiKey(apiKeyId, {
      kyvexCookie: cookiesJson
    });
    
    if (updated) {
      console.log('✅ Successfully updated API key with multiple cookies!');
      console.log(`\nCookies added: ${cookies.length}`);
      console.log(`Format: JSON array`);
      console.log(`\nThe system will automatically:`);
      console.log(`1. Create cookie proxies from these cookies`);
      console.log(`2. Rotate through them when one hits the limit`);
      console.log(`3. Allow up to ${cookies.length * 50} requests per day`);
    } else {
      console.error('❌ Failed to update API key');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();


/**
 * Setup script to create initial admin user
 * Run: node scripts/create-admin.js
 */

import readline from 'readline';
import { hashApiKey } from '../src/utils/crypto.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function createAdmin() {
  console.log('=== Create Admin User ===\n');

  const email = await question('Email: ');
  if (!email || !email.includes('@')) {
    console.error('Invalid email');
    process.exit(1);
  }

  const password = await question('Password: ');
  if (!password || password.length < 6) {
    console.error('Password must be at least 6 characters');
    process.exit(1);
  }

  const name = await question('Name: ') || 'Admin';

  // Hash password
  const passwordHash = await hashApiKey(password);

  console.log('\n=== Admin Data (insert into Supabase) ===');
  console.log('Go to Supabase Dashboard → Table Editor → admins table');
  console.log('Insert a new row with these values:\n');
  console.log(`Email: ${email}`);
  console.log(`Password Hash: ${passwordHash}`);
  console.log(`Name: ${name}`);
  console.log(`Is Active: true`);
  console.log('\n=== Or use SQL ===');
  console.log(`INSERT INTO admins (email, password_hash, name, is_active) VALUES ('${email}', '${passwordHash}', '${name}', true);`);

  rl.close();
}

createAdmin().catch(console.error);

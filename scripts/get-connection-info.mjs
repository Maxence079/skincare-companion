#!/usr/bin/env node

/**
 * Helper script to get Supabase connection info
 * This will help us find the correct database host
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = join(__dirname, '../.env.local');
const envFile = readFileSync(envPath, 'utf8');

envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=:#]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, '');
    process.env[key] = value;
  }
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

console.log('📋 Supabase Connection Information\n');
console.log(`Project Ref: ${projectRef}`);
console.log(`Project URL: ${supabaseUrl}`);
console.log('\n🔗 To get your database connection string:');
console.log(`   https://supabase.com/dashboard/project/${projectRef}/settings/database`);
console.log('\n📝 Look for "Connection string" → "Connection pooling" tab');
console.log('   Copy the HOST value and add to .env.local as:');
console.log('   SUPABASE_DB_HOST=<host-from-dashboard>\n');

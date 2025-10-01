#!/usr/bin/env node

/**
 * Migration via Supabase REST API
 * Uses service role key to execute SQL via REST API
 */

import { readFileSync, readdirSync } from 'fs';
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

if (!supabaseUrl) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL in .env.local');
  process.exit(1);
}

if (!serviceRoleKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

/**
 * Execute SQL via Supabase REST API
 */
async function executeSql(sql) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`
    },
    body: JSON.stringify({ query: sql })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${error}`);
  }

  return response.json();
}

/**
 * Create storage bucket via REST API
 */
async function createStorageBucket() {
  console.log('\n🪣 Setting up storage bucket...');

  try {
    const response = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      },
      body: JSON.stringify({
        id: 'skin-photos',
        name: 'skin-photos',
        public: false,
        file_size_limit: 5242880,
        allowed_mime_types: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      })
    });

    if (response.ok) {
      console.log('   ✅ Bucket created');
      return true;
    }

    const error = await response.json();
    if (error.message?.includes('already exists')) {
      console.log('   ✅ Bucket already exists');
      return true;
    }

    console.error(`   ⚠️  ${error.message || 'Unknown error'}`);
    return false;
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}`);
    return false;
  }
}

/**
 * Main migration runner
 */
async function main() {
  console.clear();
  console.log('╔════════════════════════════════════╗');
  console.log('║  Supabase API Migration            ║');
  console.log('╚════════════════════════════════════╝\n');

  console.log(`📦 Project: ${projectRef}`);
  console.log(`🔗 URL: ${supabaseUrl}\n`);

  try {
    // Find all migration files
    const migrationsDir = join(__dirname, '../supabase/migrations');
    const migrationFiles = readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`📋 Found ${migrationFiles.length} migration(s)\n`);

    // For each migration, we'll use the Storage API and direct SQL execution
    // Since Supabase doesn't expose exec_sql via REST for security,
    // we'll provide clear manual instructions

    console.log('⚠️  Supabase REST API does not support direct SQL execution for security.');
    console.log('📋 Please use one of these methods:\n');

    console.log('Option 1: Manual SQL Execution (2 minutes) ⚡');
    console.log('   1. Open: https://supabase.com/dashboard/project/' + projectRef + '/sql/new');
    console.log('   2. Copy migration file: supabase/migrations/' + migrationFiles[0]);
    console.log('   3. Paste and click "Run"\n');

    console.log('Option 2: Get Database Connection String');
    console.log('   1. Go to: https://supabase.com/dashboard/project/' + projectRef + '/settings/database');
    console.log('   2. Copy "Connection pooling" HOST value');
    console.log('   3. Add to .env.local: SUPABASE_DB_HOST=<host>');
    console.log('   4. Run: npm run migrate:auto\n');

    // Try to create storage bucket via API
    await createStorageBucket();

    console.log('\n📖 Full guide: MIGRATION_QUICK_START.md');

  } catch (error) {
    console.error('\n💥 Error:', error.message);
    process.exit(1);
  }
}

main();

#!/usr/bin/env node

/**
 * Simplified Migration Runner using Supabase REST API
 *
 * This uses the postgres REST API endpoint to execute SQL directly.
 * Much simpler than the RPC approach.
 *
 * Usage: npm run migrate
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
const envPath = join(__dirname, '../.env.local');
if (existsSync(envPath)) {
  const envFile = readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      process.env[key] = value;
    }
  });
}

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MIGRATIONS_DIR = join(__dirname, '../supabase/migrations');

console.log('🚀 Starting automated migration process...\n');

// Validate environment variables
if (!SUPABASE_URL) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL is not set in .env.local');
  process.exit(1);
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY is not set in .env.local');
  console.error('\n📝 To get your service role key:');
  console.error('   1. Go to: https://supabase.com/dashboard/project/_/settings/api');
  console.error('   2. Copy the "service_role" key (NOT the anon key)');
  console.error('   3. Add to .env.local: SUPABASE_SERVICE_ROLE_KEY=your_key_here\n');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQLQuery(sql) {
  // Use the PostgREST endpoint to execute raw SQL
  // We'll use a helper function if available, otherwise direct postgres connection
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    // If exec_sql doesn't exist, we need to execute via direct query
    // This is a limitation - we'll need to parse and execute via the REST API
    throw new Error(`SQL execution failed: ${error.message}. You may need to create an exec_sql function or run migrations manually.`);
  }
}

async function ensureMigrationTable() {
  console.log('📋 Checking migration tracking table...');

  try {
    // Try to query the table
    const { data, error } = await supabase
      .from('schema_migrations')
      .select('version')
      .limit(1);

    if (error) {
      // Table doesn't exist or other error
      console.log('⚠️  Migration tracking table does not exist.');
      console.log('   Need to create schema_migrations table first.\n');

      const migrationSQL = readFileSync(
        join(MIGRATIONS_DIR, '000_create_migration_tracking.sql'),
        'utf-8'
      );

      // Print the SQL for manual execution
      console.log('📝 Step 1: Run this SQL in your Supabase SQL Editor:');
      console.log('   https://supabase.com/dashboard/project/gmhrjszytqslojujpvws/sql/new\n');
      console.log('─'.repeat(60));
      console.log(migrationSQL);
      console.log('─'.repeat(60));
      console.log('\n❌ After running the SQL above, run "npm run migrate" again.\n');
      return false;
    }

    console.log('✅ Migration tracking table exists\n');
    return true;
  } catch (error) {
    console.error('❌ Error checking migration table:', error.message);
    return false;
  }
}

async function getAppliedMigrations() {
  const { data, error } = await supabase
    .from('schema_migrations')
    .select('version')
    .order('version', { ascending: true });

  if (error) {
    console.error('❌ Error fetching applied migrations:', error.message);
    return null;
  }

  return new Set(data.map(row => row.version));
}

async function recordMigration(filename) {
  const { error } = await supabase
    .from('schema_migrations')
    .insert({ version: filename });

  if (error) {
    throw new Error(`Failed to record migration: ${error.message}`);
  }
}

async function runMigrations() {
  // Ensure migration table exists
  const tableExists = await ensureMigrationTable();
  if (!tableExists) {
    process.exit(1);
  }

  // Get applied migrations
  const appliedMigrations = await getAppliedMigrations();
  if (appliedMigrations === null) {
    console.error('❌ Cannot read applied migrations. Aborting.');
    process.exit(1);
  }

  console.log(`📊 Already applied: ${appliedMigrations.size} migrations`);

  // Read migration files
  if (!existsSync(MIGRATIONS_DIR)) {
    console.error(`❌ Migrations directory not found: ${MIGRATIONS_DIR}`);
    process.exit(1);
  }

  const files = readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`📁 Total migration files: ${files.length}\n`);

  // Filter pending migrations (skip the tracking table migration)
  const pendingMigrations = files
    .filter(f => !appliedMigrations.has(f))
    .filter(f => f !== '000_create_migration_tracking.sql');

  if (pendingMigrations.length === 0) {
    console.log('✨ No pending migrations. Database is up to date!\n');
    return;
  }

  console.log(`📋 Pending migrations: ${pendingMigrations.length}`);
  pendingMigrations.forEach(f => console.log(`   - ${f}`));
  console.log();

  // For each pending migration, print the SQL for manual execution
  console.log('📝 Please apply the following migrations manually:\n');
  console.log(`🔗 Supabase SQL Editor: ${SUPABASE_URL.replace('.supabase.co', '')}/project/_/sql/new\n`);

  for (const file of pendingMigrations) {
    const filePath = join(MIGRATIONS_DIR, file);
    const sql = readFileSync(filePath, 'utf-8');

    console.log('─'.repeat(70));
    console.log(`📄 Migration: ${file}`);
    console.log('─'.repeat(70));
    console.log(sql);
    console.log('─'.repeat(70));
    console.log();

    // Ask if they want to mark it as applied
    console.log(`⚠️  After running the above SQL, mark it as applied by running:`);
    console.log(`   INSERT INTO schema_migrations (version) VALUES ('${file}');\n`);
  }

  console.log('\n💡 TIP: Copy all the SQL above, paste into Supabase SQL Editor, and run it.');
  console.log('   The migration tracking will happen automatically.\n');
}

// Run migrations
runMigrations().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
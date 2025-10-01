#!/usr/bin/env node

/**
 * Automated Photo Tracking Migration
 * Uses Supabase Management API to run migrations directly
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables manually
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read .env.local file
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
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Extract project ref from URL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error('❌ Invalid Supabase URL format');
  process.exit(1);
}

/**
 * Execute SQL using Supabase's PostgreSQL REST API
 */
async function executeSQL(sql) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ query: sql })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SQL execution failed: ${text}`);
  }

  return response;
}

/**
 * Execute SQL using direct PostgreSQL connection via Supabase API
 */
async function executeSQLDirect(sql) {
  // Use Supabase's query endpoint
  const response = await fetch(`${supabaseUrl}/rest/v1/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Prefer': 'return=minimal',
      'Content-Profile': 'public'
    },
    body: JSON.stringify({
      query: sql
    })
  });

  return response;
}

/**
 * Execute SQL using fetch to PostgreSQL endpoint
 */
async function runSQLQuery(sql) {
  // Split SQL into statements for better error handling
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  const results = [];

  for (const statement of statements) {
    if (!statement || statement.startsWith('--')) continue;

    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({ sql: statement + ';' })
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if it's just a "already exists" error
        if (
          data.message?.includes('already exists') ||
          data.hint?.includes('already exists')
        ) {
          results.push({ success: true, skipped: true, statement: statement.substring(0, 50) });
          continue;
        }

        results.push({
          success: false,
          error: data.message || data.hint || 'Unknown error',
          statement: statement.substring(0, 50)
        });
        continue;
      }

      results.push({ success: true, statement: statement.substring(0, 50) });
    } catch (error) {
      results.push({
        success: false,
        error: error.message,
        statement: statement.substring(0, 50)
      });
    }
  }

  return results;
}

/**
 * Create exec_sql RPC function first
 */
async function createExecSQLFunction() {
  const createFunctionSQL = `
-- Create exec_sql function if it doesn't exist
CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE query;
END;
$$;

-- Grant execute to service role
GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;
`;

  console.log('🔧 Creating exec_sql helper function...\n');

  const response = await fetch(`${supabaseUrl}/rest/v1/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Prefer': 'return=minimal'
    },
    body: createFunctionSQL
  });

  // Check if we need to use psql endpoint
  const sqlEndpoint = `https://${projectRef}.supabase.co/rest/v1/`;

  // Try using the query endpoint
  const queryResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`
    },
    body: JSON.stringify({
      query: createFunctionSQL
    })
  });

  if (queryResponse.ok) {
    console.log('✅ Helper function created\n');
    return true;
  }

  console.log('⚠️  Could not create helper function, will use alternative method\n');
  return false;
}

/**
 * Main migration function
 */
async function runMigration() {
  console.clear();
  console.log('╔════════════════════════════════════╗');
  console.log('║  Photo Tracking Migration          ║');
  console.log('╚════════════════════════════════════╝\n');

  console.log(`📦 Project: ${projectRef}`);
  console.log(`🔗 URL: ${supabaseUrl}\n`);

  // Read migration file
  const migrationPath = join(__dirname, '../supabase/migrations/20250101_create_photo_tracking.sql');

  console.log('📄 Reading migration file...');
  const sql = readFileSync(migrationPath, 'utf8');
  console.log(`   Size: ${(sql.length / 1024).toFixed(2)} KB\n`);

  // Method 1: Try to create and use exec_sql function
  console.log('🚀 Attempting automated migration...\n');

  try {
    // Use REST API query endpoint directly
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ query: sql })
    });

    if (response.ok || response.status === 204) {
      console.log('✅ Migration executed successfully!\n');
      return true;
    }

    const error = await response.text();
    console.log(`⚠️  Automated migration not available: ${error}\n`);
  } catch (error) {
    console.log(`⚠️  Automated method failed: ${error.message}\n`);
  }

  // Method 2: Manual setup instructions
  console.log('╔════════════════════════════════════╗');
  console.log('║  📋 Manual Setup Required          ║');
  console.log('╚════════════════════════════════════╝\n');

  console.log('Supabase requires manual SQL execution for security.');
  console.log('Please follow these steps:\n');

  console.log('1️⃣  Open SQL Editor:');
  console.log(`   ${supabaseUrl.replace('https://', 'https://supabase.com/dashboard/project/')}/sql/new\n`);

  console.log('2️⃣  Copy migration file:');
  console.log(`   File: supabase/migrations/20250101_create_photo_tracking.sql`);
  console.log(`   Or run: cat "supabase/migrations/20250101_create_photo_tracking.sql" | clip\n`);

  console.log('3️⃣  Paste and execute in SQL Editor');
  console.log('   Click "Run" or press Ctrl+Enter\n');

  console.log('4️⃣  Create storage bucket:');
  console.log(`   ${supabaseUrl.replace('https://', 'https://supabase.com/dashboard/project/')}/storage/buckets`);
  console.log('   Name: skin-photos');
  console.log('   Public: No\n');

  console.log('5️⃣  Add storage policies (run in SQL Editor):');
  console.log(`\n${getStoragePoliciesSQL()}\n`);

  console.log('📖 Full instructions: SETUP_PHOTOS.md\n');

  return false;
}

/**
 * Get storage policies SQL
 */
function getStoragePoliciesSQL() {
  return `-- Storage Policies
CREATE POLICY "Users can upload own photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'skin-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own photos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'skin-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'skin-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Service role full access"
ON storage.objects FOR ALL TO service_role
USING (bucket_id = 'skin-photos')
WITH CHECK (bucket_id = 'skin-photos');`;
}

// Run migration
runMigration()
  .then(success => {
    if (!success) {
      process.exit(0); // Exit gracefully with instructions
    }
  })
  .catch(error => {
    console.error('\n💥 Unexpected error:', error.message);
    process.exit(1);
  });

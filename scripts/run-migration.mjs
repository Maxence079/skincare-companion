/**
 * Simple Migration Runner
 * Uses Supabase REST API to run migrations
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables manually
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read .env.local file
const envPath = join(__dirname, '../.env.local');
const envFile = readFileSync(envPath, 'utf8');
const envVars = {};

envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=:#]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, '');
    envVars[key] = value;
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

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Execute SQL via Supabase SQL endpoint
 */
async function executeSQLDirect(sql) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`
    },
    body: JSON.stringify({ sql_query: sql })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SQL execution failed: ${error}`);
  }

  return response;
}

/**
 * Run migration with better error handling
 */
async function runMigration() {
  console.log('🚀 Running Photo Tracking Migration\n');

  const migrationPath = join(__dirname, '../supabase/migrations/20250101_create_photo_tracking.sql');

  try {
    // Read migration file
    const sql = readFileSync(migrationPath, 'utf8');
    console.log('📄 Migration file loaded');
    console.log(`   Size: ${(sql.length / 1024).toFixed(2)} KB\n`);

    // Split into individual statements for better error reporting
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .filter(s => !s.startsWith('--') || s.includes('CREATE'))
      .map(s => s + ';');

    console.log(`📋 Found ${statements.length} SQL statements\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    // Execute statements one by one
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const preview = statement.substring(0, 60).replace(/\n/g, ' ') + '...';

      try {
        // Use Supabase client to run SQL
        const { error } = await supabase.rpc('exec', {
          sql: statement
        });

        if (error) {
          // Check for "already exists" errors (safe to skip)
          if (
            error.message.includes('already exists') ||
            error.message.includes('duplicate')
          ) {
            console.log(`⚠️  [${i + 1}/${statements.length}] Already exists, skipping: ${preview}`);
            skipCount++;
            continue;
          }

          throw error;
        }

        console.log(`✅ [${i + 1}/${statements.length}] ${preview}`);
        successCount++;
      } catch (err) {
        console.error(`❌ [${i + 1}/${statements.length}] Failed: ${preview}`);
        console.error(`   Error: ${err.message}\n`);
        errorCount++;

        // Continue on some errors
        if (
          err.message.includes('already exists') ||
          err.message.includes('duplicate')
        ) {
          skipCount++;
          continue;
        }

        // Stop on critical errors
        if (
          err.message.includes('syntax error') ||
          err.message.includes('permission denied')
        ) {
          throw err;
        }
      }
    }

    console.log('\n─────────────────────────────────────');
    console.log(`✅ Success: ${successCount} statements`);
    console.log(`⚠️  Skipped: ${skipCount} statements`);
    console.log(`❌ Failed: ${errorCount} statements`);
    console.log('─────────────────────────────────────\n');

    return errorCount === 0;
  } catch (error) {
    console.error('\n💥 Migration failed:', error.message);
    return false;
  }
}

/**
 * Setup storage bucket
 */
async function setupStorage() {
  console.log('🪣 Setting up Storage Bucket\n');

  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      throw listError;
    }

    const bucketExists = buckets?.some(b => b.id === 'skin-photos');

    if (bucketExists) {
      console.log('✅ Bucket "skin-photos" already exists\n');
      return true;
    }

    // Create bucket
    const { data, error } = await supabase.storage.createBucket('skin-photos', {
      public: false,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    });

    if (error) {
      throw error;
    }

    console.log('✅ Created storage bucket "skin-photos"\n');
    return true;
  } catch (error) {
    console.error('❌ Storage setup failed:', error.message);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  console.clear();
  console.log('╔════════════════════════════════════╗');
  console.log('║  Supabase Migration Setup          ║');
  console.log('╚════════════════════════════════════╝\n');

  console.log(`📦 Project: ${supabaseUrl}\n`);

  // Step 1: Run migration
  const migrationSuccess = await runMigration();

  if (!migrationSuccess) {
    console.error('❌ Migration failed. Check errors above.\n');
    process.exit(1);
  }

  // Step 2: Setup storage
  const storageSuccess = await setupStorage();

  if (!storageSuccess) {
    console.error('❌ Storage setup failed.\n');
    process.exit(1);
  }

  // Success!
  console.log('╔════════════════════════════════════╗');
  console.log('║  ✅ Setup Complete!                ║');
  console.log('╚════════════════════════════════════╝\n');

  console.log('📋 Next Steps:');
  console.log('   1. Verify in Supabase Dashboard:');
  console.log('      → Database → Tables (skin_photos, photo_outcomes)');
  console.log('      → Storage → Buckets (skin-photos)');
  console.log('   2. Test photo upload in your app');
  console.log('   3. Check storage policies are working\n');

  console.log('🔗 Quick Links:');
  console.log(`   Dashboard: ${supabaseUrl.replace('https://', 'https://supabase.com/dashboard/project/')}`);
  console.log(`   Tables: ${supabaseUrl.replace('https://', 'https://supabase.com/dashboard/project/')}/editor`);
  console.log(`   Storage: ${supabaseUrl.replace('https://', 'https://supabase.com/dashboard/project/')}/storage/buckets\n`);
}

main().catch(error => {
  console.error('\n💥 Unexpected error:', error);
  process.exit(1);
});

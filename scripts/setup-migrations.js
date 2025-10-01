/**
 * Automated Migration Setup Script
 * Runs Supabase migrations programmatically
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Run SQL migration from file
 */
async function runMigration(migrationPath) {
  console.log(`\n📄 Running migration: ${path.basename(migrationPath)}`);

  try {
    // Read migration file
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Execute SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      throw error;
    }

    console.log('✅ Migration completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    return false;
  }
}

/**
 * Create custom RPC function to execute raw SQL (if not exists)
 */
async function setupExecSQLFunction() {
  console.log('\n🔧 Setting up SQL execution function...');

  const setupSQL = `
    -- Create a function to execute raw SQL (admin only)
    CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql_query;
    END;
    $$;
  `;

  try {
    // Try to create the function
    const { error } = await supabase.rpc('exec_sql', { sql_query: setupSQL });

    if (error && !error.message.includes('already exists')) {
      // If function doesn't exist, we need to create it another way
      console.log('⚠️  Need to create exec_sql function manually');
      return false;
    }

    console.log('✅ SQL execution function ready');
    return true;
  } catch (error) {
    console.log('⚠️  Will use direct SQL execution instead');
    return false;
  }
}

/**
 * Run migration using direct SQL query
 */
async function runMigrationDirect(migrationPath) {
  console.log(`\n📄 Running migration: ${path.basename(migrationPath)}`);

  try {
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`   Executing ${statements.length} SQL statements...`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';

      // Skip comments
      if (statement.startsWith('--')) continue;

      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });

        if (error) {
          // Check if it's a "already exists" error (safe to ignore)
          if (
            error.message.includes('already exists') ||
            error.message.includes('duplicate key')
          ) {
            console.log(`   ⚠️  Statement ${i + 1}: Already exists, skipping`);
            continue;
          }

          throw error;
        }

        console.log(`   ✓ Statement ${i + 1}/${statements.length}`);
      } catch (err) {
        console.error(`   ✗ Statement ${i + 1} failed:`, err.message);
        throw err;
      }
    }

    console.log('✅ Migration completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    return false;
  }
}

/**
 * Create storage bucket and policies
 */
async function setupStorage() {
  console.log('\n🪣 Setting up storage bucket...');

  try {
    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.id === 'skin-photos');

    if (bucketExists) {
      console.log('✅ Bucket "skin-photos" already exists');
    } else {
      // Create bucket
      const { error } = await supabase.storage.createBucket('skin-photos', {
        public: false,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      });

      if (error) {
        throw error;
      }

      console.log('✅ Created storage bucket "skin-photos"');
    }

    // Create storage policies
    console.log('\n🔐 Setting up storage policies...');

    const storagePoliciesSQL = `
      -- Users can upload their own photos
      CREATE POLICY IF NOT EXISTS "Users can upload own photos"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'skin-photos'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );

      -- Users can view their own photos
      CREATE POLICY IF NOT EXISTS "Users can view own photos"
      ON storage.objects
      FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'skin-photos'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );

      -- Users can delete their own photos
      CREATE POLICY IF NOT EXISTS "Users can delete own photos"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'skin-photos'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );

      -- Service role has full access
      CREATE POLICY IF NOT EXISTS "Service role full access"
      ON storage.objects
      FOR ALL
      TO service_role
      USING (bucket_id = 'skin-photos')
      WITH CHECK (bucket_id = 'skin-photos');
    `;

    const { error: policyError } = await supabase.rpc('exec_sql', {
      sql_query: storagePoliciesSQL
    });

    if (policyError && !policyError.message.includes('already exists')) {
      throw policyError;
    }

    console.log('✅ Storage policies configured');
    return true;
  } catch (error) {
    console.error('❌ Storage setup failed:', error.message);
    return false;
  }
}

/**
 * Main setup function
 */
async function main() {
  console.log('🚀 Starting Supabase Migration Setup\n');
  console.log('📦 Project:', supabaseUrl);
  console.log('─────────────────────────────────────');

  // Step 1: Setup exec_sql function
  await setupExecSQLFunction();

  // Step 2: Run photo tracking migration
  const migrationPath = path.join(
    __dirname,
    '../supabase/migrations/20250101_create_photo_tracking.sql'
  );

  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  const migrationSuccess = await runMigrationDirect(migrationPath);

  if (!migrationSuccess) {
    console.error('\n❌ Migration failed. Please check errors above.');
    process.exit(1);
  }

  // Step 3: Setup storage bucket and policies
  const storageSuccess = await setupStorage();

  if (!storageSuccess) {
    console.error('\n❌ Storage setup failed. Please check errors above.');
    process.exit(1);
  }

  // Success!
  console.log('\n─────────────────────────────────────');
  console.log('✅ All setup completed successfully!');
  console.log('\n📋 Next steps:');
  console.log('   1. Test photo upload in your app');
  console.log('   2. Check Supabase Dashboard → Database → Tables');
  console.log('   3. Check Supabase Dashboard → Storage → Buckets\n');
}

main().catch(error => {
  console.error('\n💥 Unexpected error:', error);
  process.exit(1);
});

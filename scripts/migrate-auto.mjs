#!/usr/bin/env node

/**
 * Fully Automated Migration Script
 * Uses direct PostgreSQL connection for reliable automated migrations
 *
 * Setup:
 * 1. Get DB password from: https://supabase.com/dashboard/project/gmhrjszytqslojujpvws/settings/database
 * 2. Add to .env.local: SUPABASE_DB_PASSWORD=your_password
 * 3. Run: npm run migrate:auto
 */

import pg from 'pg';
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
const dbPassword = process.env.SUPABASE_DB_PASSWORD;

if (!supabaseUrl) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL in .env.local');
  process.exit(1);
}

if (!dbPassword) {
  console.error('❌ Missing SUPABASE_DB_PASSWORD in .env.local');
  console.error('\n📖 Setup Instructions:');
  console.error('   1. Go to: https://supabase.com/dashboard/project/gmhrjszytqslojujpvws/settings/database');
  console.error('   2. Find "Database Password" → Reset if needed');
  console.error('   3. Add to .env.local: SUPABASE_DB_PASSWORD=your_password\n');
  process.exit(1);
}

// Extract project ref
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error('❌ Invalid Supabase URL');
  process.exit(1);
}

/**
 * Connect to Supabase PostgreSQL database
 */
async function connectToDatabase() {
  // Supabase uses AWS-managed databases with pooler
  // Connection format: aws-0-us-west-1.pooler.supabase.com
  const client = new pg.Client({
    host: `aws-0-us-west-1.pooler.supabase.com`,
    database: 'postgres',
    user: `postgres.${projectRef}`,
    password: dbPassword,
    port: 6543, // Pooler port (not direct 5432)
    ssl: {
      rejectUnauthorized: false
    }
  });

  await client.connect();
  return client;
}

/**
 * Run a single migration
 */
async function runMigration(client, migrationPath, migrationName) {
  console.log(`\n📄 Running: ${migrationName}`);

  try {
    const sql = readFileSync(migrationPath, 'utf8');

    // Execute the migration
    await client.query('BEGIN');

    try {
      await client.query(sql);
      await client.query('COMMIT');

      console.log(`   ✅ Success`);
      return { success: true, name: migrationName };
    } catch (error) {
      await client.query('ROLLBACK');

      // Check if it's an "already exists" error (safe to ignore)
      if (
        error.message.includes('already exists') ||
        error.message.includes('duplicate')
      ) {
        console.log(`   ⚠️  Already applied, skipping`);
        return { success: true, skipped: true, name: migrationName };
      }

      throw error;
    }
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}`);
    return { success: false, error: error.message, name: migrationName };
  }
}

/**
 * Create storage bucket
 */
async function createStorageBucket(client) {
  console.log('\n🪣 Setting up storage bucket...');

  try {
    // Check if bucket exists
    const bucketCheck = await client.query(`
      SELECT id FROM storage.buckets WHERE id = 'skin-photos'
    `);

    if (bucketCheck.rows.length > 0) {
      console.log('   ✅ Bucket already exists');
      return true;
    }

    // Create bucket
    await client.query(`
      INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      VALUES (
        'skin-photos',
        'skin-photos',
        false,
        5242880,
        ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']::text[]
      )
    `);

    console.log('   ✅ Bucket created');
    return true;
  } catch (error) {
    if (error.message.includes('duplicate') || error.message.includes('already exists')) {
      console.log('   ✅ Bucket already exists');
      return true;
    }

    console.error(`   ❌ Failed: ${error.message}`);
    return false;
  }
}

/**
 * Create storage policies
 */
async function createStoragePolicies(client) {
  console.log('\n🔐 Setting up storage policies...');

  const policies = [
    {
      name: 'Users can upload own photos',
      sql: `
        CREATE POLICY "Users can upload own photos"
        ON storage.objects FOR INSERT TO authenticated
        WITH CHECK (
          bucket_id = 'skin-photos'
          AND auth.uid()::text = (storage.foldername(name))[1]
        );
      `
    },
    {
      name: 'Users can view own photos',
      sql: `
        CREATE POLICY "Users can view own photos"
        ON storage.objects FOR SELECT TO authenticated
        USING (
          bucket_id = 'skin-photos'
          AND auth.uid()::text = (storage.foldername(name))[1]
        );
      `
    },
    {
      name: 'Users can delete own photos',
      sql: `
        CREATE POLICY "Users can delete own photos"
        ON storage.objects FOR DELETE TO authenticated
        USING (
          bucket_id = 'skin-photos'
          AND auth.uid()::text = (storage.foldername(name))[1]
        );
      `
    },
    {
      name: 'Service role full access',
      sql: `
        CREATE POLICY "Service role full access"
        ON storage.objects FOR ALL TO service_role
        USING (bucket_id = 'skin-photos')
        WITH CHECK (bucket_id = 'skin-photos');
      `
    }
  ];

  let successCount = 0;

  for (const policy of policies) {
    try {
      await client.query(policy.sql);
      console.log(`   ✅ ${policy.name}`);
      successCount++;
    } catch (error) {
      if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        console.log(`   ⚠️  ${policy.name} (already exists)`);
        successCount++;
      } else {
        console.error(`   ❌ ${policy.name}: ${error.message}`);
      }
    }
  }

  return successCount === policies.length;
}

/**
 * Main migration runner
 */
async function main() {
  console.clear();
  console.log('╔════════════════════════════════════╗');
  console.log('║  Automated Database Migration      ║');
  console.log('╚════════════════════════════════════╝\n');

  console.log(`📦 Project: ${projectRef}`);
  console.log(`🗄️  Database: db.${projectRef}.supabase.co\n`);

  let client;

  try {
    // Connect to database
    console.log('🔌 Connecting to database...');
    client = await connectToDatabase();
    console.log('   ✅ Connected\n');

    // Find all migration files
    const migrationsDir = join(__dirname, '../supabase/migrations');
    const migrationFiles = readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`📋 Found ${migrationFiles.length} migration(s)`);

    const results = [];

    // Run each migration
    for (const file of migrationFiles) {
      const migrationPath = join(migrationsDir, file);
      const result = await runMigration(client, migrationPath, file);
      results.push(result);

      if (!result.success) {
        console.log('\n❌ Migration failed, stopping...');
        break;
      }
    }

    // Setup storage if all migrations succeeded
    const allSucceeded = results.every(r => r.success);

    if (allSucceeded) {
      await createStorageBucket(client);
      await createStoragePolicies(client);
    }

    // Summary
    console.log('\n╔════════════════════════════════════╗');
    console.log('║  Migration Summary                 ║');
    console.log('╚════════════════════════════════════╝\n');

    const successful = results.filter(r => r.success && !r.skipped).length;
    const skipped = results.filter(r => r.skipped).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`✅ Successful: ${successful}`);
    console.log(`⚠️  Skipped: ${skipped}`);
    console.log(`❌ Failed: ${failed}\n`);

    if (failed === 0) {
      console.log('🎉 All migrations completed successfully!\n');
      console.log('📋 Next steps:');
      console.log('   1. Verify tables: https://supabase.com/dashboard/project/gmhrjszytqslojujpvws/editor');
      console.log('   2. Check storage: https://supabase.com/dashboard/project/gmhrjszytqslojujpvws/storage/buckets');
      console.log('   3. Test photo upload in your app\n');
    }

  } catch (error) {
    console.error('\n💥 Fatal error:', error.message);

    if (error.message.includes('password authentication failed')) {
      console.error('\n📖 Fix:');
      console.error('   1. Check SUPABASE_DB_PASSWORD in .env.local');
      console.error('   2. Reset password at: https://supabase.com/dashboard/project/gmhrjszytqslojujpvws/settings/database\n');
    }

    process.exit(1);
  } finally {
    if (client) {
      await client.end();
      console.log('🔌 Database connection closed\n');
    }
  }
}

main();

#!/usr/bin/env node

/**
 * Smart Migration Script
 * Tries multiple Supabase connection methods automatically
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
const dbHost = process.env.SUPABASE_DB_HOST;
const dbPort = process.env.SUPABASE_DB_PORT || '6543';
const dbUser = process.env.SUPABASE_DB_USER;

if (!supabaseUrl || !dbPassword) {
  console.error('❌ Missing credentials in .env.local');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_DB_PASSWORD');
  process.exit(1);
}

const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

/**
 * Try multiple connection formats
 */
async function connectToDatabase() {
  // If user provided explicit connection info, use that first
  if (dbHost && dbUser) {
    try {
      console.log(`   Trying: User-provided connection (${dbHost}:${dbPort})...`);

      const client = new pg.Client({
        host: dbHost,
        database: 'postgres',
        user: dbUser,
        password: dbPassword,
        port: parseInt(dbPort),
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
      });

      await client.connect();
      console.log(`   ✅ Connected!\n`);
      return client;
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message.split('\n')[0]}`);
      console.log(`   ⚠️  Check your SUPABASE_DB_HOST and SUPABASE_DB_USER in .env.local\n`);
    }
  }

  // Otherwise try auto-detection
  console.log('   Attempting auto-detection...');

  const connectionConfigs = [
    {
      name: 'US East pooler',
      host: `aws-0-us-east-1.pooler.supabase.com`,
      port: 6543,
      user: `postgres.${projectRef}`,
    },
    {
      name: 'EU West pooler',
      host: `aws-0-eu-west-1.pooler.supabase.com`,
      port: 6543,
      user: `postgres.${projectRef}`,
    },
    {
      name: 'Asia Southeast pooler',
      host: `aws-0-ap-southeast-1.pooler.supabase.com`,
      port: 6543,
      user: `postgres.${projectRef}`,
    },
  ];

  for (const config of connectionConfigs) {
    try {
      console.log(`   Trying: ${config.name}...`);

      const client = new pg.Client({
        host: config.host,
        database: 'postgres',
        user: config.user,
        password: dbPassword,
        port: config.port,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
      });

      await client.connect();
      console.log(`   ✅ Connected via: ${config.name}\n`);

      // Save this for future use
      console.log(`   💡 Add to .env.local for faster connections:`);
      console.log(`      SUPABASE_DB_HOST=${config.host}`);
      console.log(`      SUPABASE_DB_PORT=${config.port}`);
      console.log(`      SUPABASE_DB_USER=${config.user}\n`);

      return client;
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message.split('\n')[0]}`);
    }
  }

  // Show helpful error message
  console.error('\n❌ Could not connect using any method\n');
  console.error('📖 Solution: Get your exact connection string');
  console.error('   1. Go to: https://supabase.com/dashboard/project/' + projectRef + '/settings/database');
  console.error('   2. Click "Connection pooling" tab');
  console.error('   3. Copy the HOST value');
  console.error('   4. Add to .env.local:');
  console.error('      SUPABASE_DB_HOST=<your-host-from-dashboard>');
  console.error('      SUPABASE_DB_PORT=6543');
  console.error('      SUPABASE_DB_USER=postgres.' + projectRef);
  console.error('\n📚 Full guide: SETUP_AUTOMATED_MIGRATIONS.md\n');

  throw new Error('Could not connect');
}

/**
 * Run migration
 */
async function runMigration(client, migrationPath, migrationName) {
  console.log(`📄 Running: ${migrationName}`);

  try {
    const sql = readFileSync(migrationPath, 'utf8');

    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('COMMIT');
      console.log(`   ✅ Success\n`);
      return { success: true };
    } catch (error) {
      await client.query('ROLLBACK');

      if (error.message.includes('already exists')) {
        console.log(`   ⚠️  Already applied\n`);
        return { success: true, skipped: true };
      }

      throw error;
    }
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}\n`);
    return { success: false, error: error.message };
  }
}

/**
 * Create storage bucket
 */
async function createStorageBucket(client) {
  console.log('🪣 Setting up storage bucket...');

  try {
    const bucketCheck = await client.query(`
      SELECT id FROM storage.buckets WHERE id = 'skin-photos'
    `);

    if (bucketCheck.rows.length > 0) {
      console.log('   ✅ Bucket already exists\n');
      return true;
    }

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

    console.log('   ✅ Bucket created\n');
    return true;
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('   ✅ Bucket already exists\n');
      return true;
    }
    console.error(`   ❌ Failed: ${error.message}\n`);
    return false;
  }
}

/**
 * Create storage policies
 */
async function createStoragePolicies(client) {
  console.log('🔐 Setting up storage policies...');

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
      if (error.message.includes('already exists')) {
        console.log(`   ⚠️  ${policy.name} (already exists)`);
        successCount++;
      } else {
        console.error(`   ❌ ${policy.name}: ${error.message.split('\n')[0]}`);
      }
    }
  }

  console.log();
  return successCount === policies.length;
}

/**
 * Main
 */
async function main() {
  console.clear();
  console.log('╔════════════════════════════════════╗');
  console.log('║  Smart Database Migration          ║');
  console.log('╚════════════════════════════════════╝\n');

  console.log(`📦 Project: ${projectRef}\n`);

  let client;

  try {
    console.log('🔌 Connecting to database...');
    client = await connectToDatabase();

    // Find migrations
    const migrationsDir = join(__dirname, '../supabase/migrations');
    const migrationFiles = readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`📋 Found ${migrationFiles.length} migration(s)\n`);

    // Run migrations
    const results = [];
    for (const file of migrationFiles) {
      const migrationPath = join(migrationsDir, file);
      const result = await runMigration(client, migrationPath, file);
      results.push(result);

      if (!result.success) {
        console.log('❌ Migration failed, stopping...\n');
        break;
      }
    }

    const allSucceeded = results.every(r => r.success);

    if (allSucceeded) {
      await createStorageBucket(client);
      await createStoragePolicies(client);
    }

    // Summary
    console.log('╔════════════════════════════════════╗');
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
      console.log(`   1. Verify: https://supabase.com/dashboard/project/${projectRef}/editor`);
      console.log(`   2. Test photo upload in your app\n`);
    }

  } catch (error) {
    console.error('\n💥 Fatal error:', error.message);
    console.error('\n📖 Manual setup: MIGRATION_QUICK_START.md\n');
    process.exit(1);
  } finally {
    if (client) {
      await client.end();
      console.log('🔌 Database connection closed\n');
    }
  }
}

main();

/**
 * Automatic Database Migration on Vercel Deployment
 * Runs migrations before the build completes
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🚀 Vercel Migration Script Starting...');

// Check if we're on Vercel
const isVercel = process.env.VERCEL === '1';
console.log(`📍 Environment: ${isVercel ? 'Vercel' : 'Local'}`);

// Get database credentials
const dbHost = process.env.SUPABASE_DB_HOST;
const dbPassword = process.env.SUPABASE_DB_PASSWORD;
const dbUser = process.env.SUPABASE_DB_USER || 'postgres';
const dbPort = process.env.SUPABASE_DB_PORT || '6543';
const dbName = 'postgres';

// Validate required environment variables
if (!dbHost || !dbPassword) {
  console.error('❌ Missing required environment variables:');
  console.error(`   SUPABASE_DB_HOST: ${dbHost ? '✓' : '✗'}`);
  console.error(`   SUPABASE_DB_PASSWORD: ${dbPassword ? '✓' : '✗'}`);

  if (isVercel) {
    console.error('⚠️  Skipping migrations on Vercel (env vars not set)');
    console.error('   Configure them in: https://vercel.com/dashboard/settings/environment-variables');
    process.exit(0); // Don't fail the build
  } else {
    process.exit(1);
  }
}

// Construct connection string
const connectionString = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;

// Initialize database client
const client = new pg.Client({ connectionString });

async function runMigrations() {
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully');

    // Get migrations directory
    const migrationsDir = path.join(__dirname, '../supabase/migrations');

    if (!fs.existsSync(migrationsDir)) {
      console.log('⚠️  No migrations directory found');
      return;
    }

    // Read all migration files
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort(); // Alphabetical order

    console.log(`📋 Found ${files.length} migration file(s)`);

    // Ensure migration tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS migration_history (
        id SERIAL PRIMARY KEY,
        migration_name TEXT UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        success BOOLEAN NOT NULL DEFAULT true
      )
    `);

    let successCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    // Run each migration
    for (const file of files) {
      const migrationName = file.replace('.sql', '');

      // Check if already applied
      const { rows } = await client.query(
        'SELECT 1 FROM migration_history WHERE migration_name = $1',
        [migrationName]
      );

      if (rows.length > 0) {
        console.log(`⏭️  Skipped: ${migrationName} (already applied)`);
        skippedCount++;
        continue;
      }

      // Read migration SQL
      const sqlPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(sqlPath, 'utf8');

      try {
        console.log(`📄 Running: ${migrationName}...`);

        // Execute migration
        await client.query(sql);

        // Record success
        await client.query(
          'INSERT INTO migration_history (migration_name, success) VALUES ($1, true)',
          [migrationName]
        );

        console.log(`✅ Success: ${migrationName}`);
        successCount++;

      } catch (error) {
        console.error(`❌ Failed: ${migrationName}`);
        console.error(`   Error: ${error.message}`);

        // Record failure
        await client.query(
          'INSERT INTO migration_history (migration_name, success) VALUES ($1, false)',
          [migrationName]
        );

        failedCount++;

        // Stop on first failure
        throw new Error(`Migration failed: ${migrationName}`);
      }
    }

    // Summary
    console.log('\n╔════════════════════════════════════╗');
    console.log('║  Migration Summary                 ║');
    console.log('╚════════════════════════════════════╝');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`⏭️  Skipped: ${skippedCount}`);
    if (failedCount > 0) {
      console.log(`❌ Failed: ${failedCount}`);
    }
    console.log('');

  } catch (error) {
    console.error('❌ Migration Error:', error.message);

    if (isVercel) {
      console.error('⚠️  Continuing deployment despite migration failure');
      console.error('   Fix migrations and redeploy');
    } else {
      throw error;
    }
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run migrations
runMigrations()
  .then(() => {
    console.log('✅ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration script failed:', error.message);

    if (isVercel) {
      // Don't fail the build on Vercel
      console.error('⚠️  Build will continue (migrations can be run manually)');
      process.exit(0);
    } else {
      process.exit(1);
    }
  });

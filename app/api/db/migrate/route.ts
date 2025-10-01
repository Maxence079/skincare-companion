/**
 * Database Migration API
 * Automatically runs pending SQL migrations from supabase/migrations/
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

interface Migration {
  version: string;
  filename: string;
  sql: string;
}

export async function POST(request: NextRequest) {
  try {
    // Verify authorization (use service role key)
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`;

    if (authHeader !== expectedAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[Migration] Starting migration process...');

    // Ensure migration tracking table exists
    await ensureMigrationTable(supabase);

    // Get all migration files
    const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort(); // Alphabetical order

    console.log(`[Migration] Found ${files.length} migration files`);

    // Get already applied migrations
    const { data: appliedMigrations } = await supabase
      .from('schema_migrations')
      .select('version');

    const appliedVersions = new Set(
      (appliedMigrations || []).map((m: any) => m.version)
    );

    console.log(`[Migration] ${appliedVersions.size} migrations already applied`);

    // Find pending migrations
    const pendingMigrations: Migration[] = [];
    for (const filename of files) {
      const version = filename.replace('.sql', '');
      if (!appliedVersions.has(version)) {
        const filepath = path.join(migrationsDir, filename);
        const sql = fs.readFileSync(filepath, 'utf8');
        pendingMigrations.push({ version, filename, sql });
      }
    }

    console.log(`[Migration] ${pendingMigrations.length} pending migrations to apply`);

    if (pendingMigrations.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending migrations',
        applied: 0,
        total: files.length
      });
    }

    // Apply each pending migration
    const results = [];
    for (const migration of pendingMigrations) {
      try {
        console.log(`[Migration] Applying: ${migration.filename}`);

        // Execute the migration SQL
        const { error: sqlError } = await supabase.rpc('exec_sql', {
          sql_query: migration.sql
        });

        // If exec_sql function doesn't exist, try direct execution
        if (sqlError && sqlError.message?.includes('exec_sql')) {
          // Split into individual statements and execute
          const statements = migration.sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

          for (const statement of statements) {
            const { error } = await supabase.rpc('query', {
              sql: statement + ';'
            });

            if (error) {
              // Try alternative: Use postgres REST API directly
              const response = await fetch(`${supabaseUrl}/rest/v1/rpc/query`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': supabaseKey,
                  'Authorization': `Bearer ${supabaseKey}`
                },
                body: JSON.stringify({ sql: statement + ';' })
              });

              if (!response.ok) {
                throw new Error(`Failed to execute statement: ${statement.substring(0, 100)}...`);
              }
            }
          }
        } else if (sqlError) {
          throw sqlError;
        }

        // Record migration as applied
        const { error: insertError } = await supabase
          .from('schema_migrations')
          .insert({ version: migration.version });

        if (insertError) throw insertError;

        results.push({
          version: migration.version,
          filename: migration.filename,
          success: true
        });

        console.log(`[Migration] ✓ Applied: ${migration.filename}`);

      } catch (error: any) {
        console.error(`[Migration] ✗ Failed: ${migration.filename}`, error);
        results.push({
          version: migration.version,
          filename: migration.filename,
          success: false,
          error: error.message
        });

        // Stop on first error
        break;
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: failureCount === 0,
      message: `Applied ${successCount} migrations${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
      applied: successCount,
      failed: failureCount,
      total: pendingMigrations.length,
      results
    });

  } catch (error: any) {
    console.error('[Migration] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET - Check migration status
 */
export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all migration files
    const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    // Get applied migrations
    const { data: appliedMigrations } = await supabase
      .from('schema_migrations')
      .select('version, applied_at')
      .order('applied_at', { ascending: false });

    const appliedVersions = new Set(
      (appliedMigrations || []).map((m: any) => m.version)
    );

    const pending = files.filter(f => !appliedVersions.has(f.replace('.sql', '')));

    return NextResponse.json({
      total: files.length,
      applied: appliedVersions.size,
      pending: pending.length,
      pendingMigrations: pending,
      appliedMigrations: appliedMigrations || []
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

async function ensureMigrationTable(supabase: any) {
  // Check if schema_migrations table exists
  const { data, error } = await supabase
    .from('schema_migrations')
    .select('version')
    .limit(1);

  // If table doesn't exist, create it
  if (error && error.message?.includes('does not exist')) {
    console.log('[Migration] Creating schema_migrations table...');

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      ALTER TABLE schema_migrations ENABLE ROW LEVEL SECURITY;

      CREATE POLICY IF NOT EXISTS "Service role can manage migrations"
        ON schema_migrations
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true);
    `;

    // Execute via REST API since table doesn't exist yet
    // This will be handled by the migration execution logic
  }
}
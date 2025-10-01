import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const password = process.env.SUPABASE_DB_PASSWORD;

if (!password) {
  console.error('❌ SUPABASE_DB_PASSWORD not set');
  process.exit(1);
}

const connectionString = `postgresql://postgres.gmhrjszytqslojujpvws:${password}@aws-1-ap-south-1.pooler.supabase.com:6543/postgres`;

const client = new pg.Client({ connectionString });

async function applyRLS() {
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!');

    const sqlPath = path.join(__dirname, '../supabase/migrations/20250103_create_photo_indexes_rls.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📝 Applying indexes and RLS policies...');

    await client.query(sql);

    console.log('✅ Indexes and RLS policies applied successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyRLS();

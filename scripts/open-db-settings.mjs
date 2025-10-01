#!/usr/bin/env node

/**
 * Opens Supabase database settings in browser
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { exec } from 'child_process';

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
const projectRef = supabaseUrl?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error('❌ Could not find project ref in .env.local');
  process.exit(1);
}

const url = `https://supabase.com/dashboard/project/${projectRef}/settings/database`;

console.log('🔗 Opening Supabase database settings...');
console.log(`   ${url}\n`);
console.log('📋 What to do:');
console.log('   1. Click the "Connection pooling" tab');
console.log('   2. Copy the HOST value (e.g., aws-0-us-east-1.pooler.supabase.com)');
console.log('   3. Add to .env.local:');
console.log('      SUPABASE_DB_HOST=<your-host>');
console.log('      SUPABASE_DB_PORT=6543');
console.log(`      SUPABASE_DB_USER=postgres.${projectRef}\n`);

// Open in default browser
const command = process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open';
exec(`${command} ${url}`);

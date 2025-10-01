# Automatic Migrations on Vercel

This project is configured to **automatically run database migrations** every time you deploy to Vercel.

## How It Works

1. **Before Build**: The `npm run build` command now runs `migrate:vercel` first
2. **Migration Script**: `scripts/vercel-migrate.mjs` connects to your Supabase database
3. **Smart Detection**: Only runs migrations that haven't been applied yet
4. **Migration Tracking**: Uses `migration_history` table to track applied migrations
5. **Safe Failures**: If migrations fail, the build continues (but logs warnings)

## Setup Required

### 1. Add Environment Variables to Vercel

Go to your Vercel project settings:
https://vercel.com/skin-care-companion/skincare-companion/settings/environment-variables

Add these variables:

```bash
# Required for migrations
SUPABASE_DB_HOST=aws-1-ap-south-1.pooler.supabase.com
SUPABASE_DB_PASSWORD=your_password_here
SUPABASE_DB_USER=postgres
SUPABASE_DB_PORT=6543

# Required for app functionality
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
OPENWEATHER_API_KEY=your_openweather_key_here
```

### 2. Enable Migrations on All Environments

In Vercel settings, make sure to select:
- ✅ Production
- ✅ Preview
- ✅ Development

This ensures migrations run on every deployment type.

## Migration Flow

```
┌─────────────────────────────────────┐
│  1. Push code to Git                │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  2. Vercel triggers build           │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  3. npm install                     │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  4. npm run migrate:vercel          │
│     - Connects to Supabase          │
│     - Checks migration_history      │
│     - Runs new migrations           │
│     - Updates migration_history     │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  5. next build                      │
│     - TypeScript compilation        │
│     - Build optimizations           │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  6. Deploy to Vercel                │
└─────────────────────────────────────┘
```

## Migration Files

All migrations are in: `supabase/migrations/`

Files are executed in **alphabetical order**:
- `20250101_create_photo_tracking.sql`
- `20250101_create_user_profiles.sql`
- `20250102_fix_onboarding_sessions.sql`
- `20250103_001_recreate_skin_photos.sql`
- `20250103_002_add_session_id_to_photos.sql`
- `20250103_003_create_photo_indexes_rls.sql`

## Adding New Migrations

1. Create a new `.sql` file in `supabase/migrations/`
2. Name it with timestamp: `YYYYMMDD_description.sql`
3. Write your SQL (CREATE TABLE, ALTER TABLE, etc.)
4. Commit and push to Git
5. Vercel will automatically run it on next deployment

Example:
```sql
-- supabase/migrations/20250104_add_user_preferences.sql

CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'light',
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
```

## Checking Migration Status

### On Vercel

Check the build logs:
1. Go to: https://vercel.com/skin-care-companion/skincare-companion
2. Click on latest deployment
3. View "Build Logs"
4. Look for migration output:

```
🚀 Vercel Migration Script Starting...
📍 Environment: Vercel
🔌 Connecting to database...
✅ Connected successfully
📋 Found 8 migration file(s)
⏭️  Skipped: 20250101_create_photo_tracking (already applied)
⏭️  Skipped: 20250101_create_user_profiles (already applied)
✅ Success: 20250104_add_user_preferences

╔════════════════════════════════════╗
║  Migration Summary                 ║
╚════════════════════════════════════╝
✅ Successful: 1
⏭️  Skipped: 7
```

### Locally

You can run migrations locally:

```bash
# Run all pending migrations
npm run migrate:auto

# Or use the Vercel migration script
npm run migrate:vercel
```

## Troubleshooting

### Migrations Not Running

**Problem**: Migrations are skipped on Vercel

**Solution**: Check environment variables are set
```bash
vercel env ls
```

If missing, add them:
```bash
vercel env add SUPABASE_DB_HOST
vercel env add SUPABASE_DB_PASSWORD
# etc...
```

### Migration Failed

**Problem**: Migration fails during build

**Solution**:
1. Check build logs for error message
2. Fix the SQL in the migration file
3. Delete failed migration from `migration_history`:
   ```sql
   DELETE FROM migration_history WHERE migration_name = 'failed_migration_name';
   ```
4. Redeploy

### Build Succeeds But Migration Didn't Run

**Problem**: Build passes but new migration not applied

**Solution**:
1. Check if migration file is in Git
2. Verify filename format: `YYYYMMDD_*.sql`
3. Check migration_history table:
   ```sql
   SELECT * FROM migration_history ORDER BY applied_at DESC LIMIT 10;
   ```

## Safety Features

1. **Idempotent**: Migrations only run once (tracked in `migration_history`)
2. **Ordered**: Migrations run in alphabetical order
3. **Non-Blocking**: If migrations fail, build continues (with warnings)
4. **Rollback Safe**: Failed migrations are recorded but don't block future deploys

## Manual Override

If you need to skip automatic migrations:

```bash
# In vercel.json, change:
"buildCommand": "next build"

# Or set environment variable:
SKIP_MIGRATIONS=true
```

## Best Practices

1. **Test Locally First**: Always run migrations locally before deploying
   ```bash
   npm run migrate:auto
   ```

2. **One Change Per Migration**: Don't combine multiple schema changes
   ```
   ✅ Good:
   - 20250104_add_user_preferences.sql
   - 20250104_add_notification_settings.sql

   ❌ Bad:
   - 20250104_add_many_things.sql (everything in one file)
   ```

3. **Use Transactions**: Wrap migrations in transactions when possible
   ```sql
   BEGIN;

   CREATE TABLE ...;
   CREATE INDEX ...;

   COMMIT;
   ```

4. **Handle Failures Gracefully**: Use `IF NOT EXISTS` and `IF EXISTS`
   ```sql
   CREATE TABLE IF NOT EXISTS users (...);
   DROP TABLE IF EXISTS old_table;
   ALTER TABLE items ADD COLUMN IF NOT EXISTS status TEXT;
   ```

5. **Document Breaking Changes**: Add comments to complex migrations
   ```sql
   -- This migration renames the 'user_profiles' table to 'profiles'
   -- BREAKING CHANGE: Update all references in code before deploying
   ALTER TABLE user_profiles RENAME TO profiles;
   ```

## Migration History Table

The system automatically creates and maintains this table:

```sql
CREATE TABLE migration_history (
  id SERIAL PRIMARY KEY,
  migration_name TEXT UNIQUE NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  success BOOLEAN NOT NULL DEFAULT true
);
```

Query it to see migration status:
```sql
-- View all migrations
SELECT * FROM migration_history ORDER BY applied_at DESC;

-- Check if specific migration ran
SELECT * FROM migration_history WHERE migration_name = '20250104_add_preferences';

-- Count successful migrations
SELECT COUNT(*) FROM migration_history WHERE success = true;
```

## Reverting Migrations

If you need to revert a migration:

1. **Create a new "down" migration**:
   ```sql
   -- supabase/migrations/20250105_revert_preferences.sql
   DROP TABLE IF EXISTS user_preferences;
   ```

2. **Or manually rollback**:
   ```sql
   -- Run in Supabase SQL Editor
   DROP TABLE user_preferences;
   DELETE FROM migration_history WHERE migration_name = '20250104_add_user_preferences';
   ```

3. **Redeploy** to apply the rollback

## Security Notes

- ✅ Database credentials are encrypted in Vercel environment variables
- ✅ Migrations run in isolated build environment
- ✅ Migration script doesn't expose sensitive data in logs
- ✅ Connection uses SSL (Supabase pooler)
- ⚠️ Never commit `.env.local` to Git (contains credentials)

## Support

If migrations are failing:
1. Check Vercel build logs
2. Verify environment variables are set
3. Test migrations locally: `npm run migrate:auto`
4. Check Supabase logs: https://supabase.com/dashboard/project/your-project/logs
5. Review `migration_history` table for errors

---

**Automated migrations are now active!** 🚀
Every deployment will automatically update your database schema.

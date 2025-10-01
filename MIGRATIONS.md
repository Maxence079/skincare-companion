# Database Migrations Guide

This project uses an automated migration system to manage database schema changes for Supabase.

## Quick Start

1. **Get your Supabase service role key:**
   - Go to: https://supabase.com/dashboard/project/_/settings/api
   - Copy the **service_role** key (NOT the anon key - this is the secret key at the bottom)
   - Add to `.env.local`:
     ```
     SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
     ```

2. **Run migrations:**
   ```bash
   npm run migrate
   ```

That's it! The script will:
- ✅ Check which migrations have been applied
- 📋 Show you pending migrations
- 📝 Print the SQL you need to run
- 🔍 Track which migrations are complete

## How It Works

### Migration Files

All migration files are in `supabase/migrations/` and named with a prefix:
- `000_create_migration_tracking.sql` - Creates the tracking system
- `001_create_onboarding_sessions.sql` - Session persistence schema
- `002_create_analytics_views.sql` - Analytics views and functions

### Migration Tracking

The system uses a `schema_migrations` table to track which migrations have been applied:

```sql
CREATE TABLE schema_migrations (
  version TEXT PRIMARY KEY,           -- Migration filename
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Running Migrations

When you run `npm run migrate`, the script:

1. Loads your `.env.local` file
2. Connects to Supabase using your service role key
3. Checks the `schema_migrations` table
4. Finds pending migrations
5. Prints the SQL for you to copy/paste into Supabase SQL Editor
6. (Future: Will auto-execute if possible)

## Current Limitations

Due to Supabase's security model, the script currently **prints the SQL** for you to manually run in the Supabase SQL Editor. This is intentional for safety.

To run the SQL:
1. Run `npm run migrate`
2. Copy the SQL output
3. Open Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql/new
4. Paste and execute
5. The script automatically includes the `INSERT INTO schema_migrations` statement

## Creating New Migrations

1. Create a new `.sql` file in `supabase/migrations/`
2. Name it with a sequential prefix: `003_your_migration_name.sql`
3. Write your SQL
4. Run `npm run migrate`

Example:
```sql
-- 003_add_user_preferences.sql
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'light',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only see their own preferences
CREATE POLICY "Users can view own preferences"
  ON user_preferences
  FOR SELECT
  USING (auth.uid() = user_id);
```

## Current Migrations

### 000_create_migration_tracking.sql
Creates the `schema_migrations` table for tracking.

### 001_create_onboarding_sessions.sql
Creates:
- `onboarding_sessions` table - Stores session state
- `onboarding_answers` table - Stores user answers with history
- RLS policies for security
- Indexes for performance
- Cleanup function for expired sessions

### 002_create_analytics_views.sql
Creates:
- `onboarding_session_stats` view - Overall session statistics
- `archetype_distribution` view - Archetype popularity
- `daily_session_trends` view - Time-series trends
- `question_performance` view - Question usage stats
- `get_analytics_summary()` function - Comprehensive analytics

## Troubleshooting

### "SUPABASE_SERVICE_ROLE_KEY is not set"
- Make sure you added the key to `.env.local`
- Make sure it's the **service_role** key, not the anon key
- Restart your terminal after adding it

### "Migration tracking table does not exist"
- Run the SQL printed by the script manually first
- This creates the `schema_migrations` table
- Then run `npm run migrate` again

### "Table already exists"
- The migration was already applied
- Check the `schema_migrations` table to see what's been applied
- You can manually remove entries if you need to re-run a migration

## Security Notes

⚠️ **NEVER commit `.env.local` to git**

The service role key has admin access to your database. Keep it secure:
- ✅ Store in `.env.local` (already in `.gitignore`)
- ✅ Only use on your local machine or CI/CD
- ❌ Never expose in client-side code
- ❌ Never commit to version control
- ❌ Never share publicly

## Future Enhancements

Potential improvements:
- Auto-execute migrations via Supabase Management API
- Rollback support
- Migration dry-run mode
- Migration dependencies and ordering
- Seeding data support
# 🚀 Automated Migration Setup

Your project now has **fully automated database migrations**! This works for ALL migrations, not just the photo tracking feature.

## ✅ What's Already Done

- ✅ Installed `pg` package for PostgreSQL connection
- ✅ Created automated migration script (`scripts/migrate-auto.mjs`)
- ✅ Added `npm run migrate:auto` command
- ✅ Updated `.env.local` with placeholder for database password

## 🔑 One-Time Setup (2 minutes)

### Step 1: Get Your Database Password

1. Go to: https://supabase.com/dashboard/project/gmhrjszytqslojujpvws/settings/database
2. Scroll to "Database password"
3. If you don't have it saved, click **"Reset database password"**
4. Copy the new password

### Step 2: Add Password to `.env.local`

Open `.env.local` and replace:
```bash
SUPABASE_DB_PASSWORD=your-database-password-here
```

With:
```bash
SUPABASE_DB_PASSWORD=your_actual_password
```

### Step 3: Run Automated Migration

```bash
npm run migrate:auto
```

That's it! 🎉

## 📋 What the Script Does

The automated migration script:

1. ✅ Connects directly to your Supabase PostgreSQL database
2. ✅ Finds ALL migration files in `supabase/migrations/`
3. ✅ Runs each migration in a transaction (safe rollback on errors)
4. ✅ Skips migrations that were already applied
5. ✅ Creates storage bucket for photos
6. ✅ Sets up storage policies (RLS)
7. ✅ Shows detailed summary of what was applied

## 🎯 Expected Output

```
╔════════════════════════════════════╗
║  Automated Database Migration      ║
╚════════════════════════════════════╝

📦 Project: gmhrjszytqslojujpvws
🗄️  Database: db.gmhrjszytqslojujpvws.supabase.co

🔌 Connecting to database...
   ✅ Connected

📋 Found 1 migration(s)

📄 Running: 20250101_create_photo_tracking.sql
   ✅ Success

🪣 Setting up storage bucket...
   ✅ Bucket created

🔐 Setting up storage policies...
   ✅ Users can upload own photos
   ✅ Users can view own photos
   ✅ Users can delete own photos
   ✅ Service role full access

╔════════════════════════════════════╗
║  Migration Summary                 ║
╚════════════════════════════════════╝

✅ Successful: 1
⚠️  Skipped: 0
❌ Failed: 0

🎉 All migrations completed successfully!

📋 Next steps:
   1. Verify tables: https://supabase.com/dashboard/project/gmhrjszytqslojujpvws/editor
   2. Check storage: https://supabase.com/dashboard/project/gmhrjszytqslojujpvws/storage/buckets
   3. Test photo upload in your app

🔌 Database connection closed
```

## 🔄 Future Migrations

From now on, whenever you create a new migration file in `supabase/migrations/`, just run:

```bash
npm run migrate:auto
```

The script will:
- Automatically detect new migrations
- Skip already-applied migrations
- Apply only what's needed

## 🛠️ Troubleshooting

### "Missing SUPABASE_DB_PASSWORD"
- Make sure you added the password to `.env.local`
- Check there are no extra spaces or quotes

### "Password authentication failed"
- Your database password may have been reset
- Go to Supabase Dashboard → Settings → Database → Reset password

### "Migration failed"
- Check the error message
- The script uses transactions, so failed migrations won't corrupt your database
- Fix the SQL error and run again

## 🚀 Advanced: CI/CD Integration

To use this in GitHub Actions or other CI/CD:

1. Add `SUPABASE_DB_PASSWORD` as a secret in your CI/CD platform
2. Add this to your deployment workflow:

```yaml
- name: Run database migrations
  env:
    SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
  run: npm run migrate:auto
```

## 📚 Alternative Methods

If you prefer different approaches, see `scripts/setup-supabase-migrations.md` for:
- Supabase CLI (for local development)
- Management API (for programmatic control)
- Manual SQL execution (fallback)

---

**Current Status**: Setup is 95% complete. Just need to add your database password and run the script! 🎉

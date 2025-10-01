# 🚀 Setup Automated Migrations (One-Time, 5 minutes)

This will enable **fully automated database migrations** for your entire project. You'll never need to manually run SQL again.

## Step 1: Get Your Database Connection String

1. Go to: https://supabase.com/dashboard/project/gmhrjszytqslojujpvws/settings/database

2. Scroll to **"Connection string"** section

3. Click the **"Connection pooling"** tab (NOT "URI")

4. You'll see something like:
   ```
   Host: aws-0-us-east-1.pooler.supabase.com
   Database: postgres
   Port: 6543
   User: postgres.gmhrjszytqslojujpvws
   ```

5. Copy the **Host** value (e.g., `aws-0-us-east-1.pooler.supabase.com`)

## Step 2: Add to .env.local

Open `.env.local` and add this line (replace with YOUR actual host):

```bash
# Database connection for automated migrations
SUPABASE_DB_HOST=aws-0-us-east-1.pooler.supabase.com  # Replace with YOUR host from dashboard
SUPABASE_DB_PORT=6543
SUPABASE_DB_USER=postgres.gmhrjszytqslojujpvws
```

You already have `SUPABASE_DB_PASSWORD=JDoe07071690` set.

## Step 3: Test Automated Migration

Run:
```bash
npm run migrate:auto
```

You should see:
```
✅ Connected
✅ Migration successful
✅ Storage bucket created
✅ Storage policies applied
```

## Step 4: Future Migrations (Fully Automated!)

From now on, whenever you need to update your database:

1. Create a new SQL file in `supabase/migrations/`:
   ```bash
   # Example: Add a new column
   # File: supabase/migrations/20250102_add_user_preferences.sql
   ALTER TABLE profiles ADD COLUMN preferences JSONB;
   ```

2. Run:
   ```bash
   npm run migrate:auto
   ```

3. Done! ✅

The script will:
- Automatically detect new migrations
- Skip already-applied migrations
- Run in transactions (safe rollback on errors)
- Work in development and CI/CD

## 🔧 For CI/CD (GitHub Actions, etc.)

Add these secrets to your CI/CD platform:
- `SUPABASE_DB_HOST`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_DB_PORT`
- `SUPABASE_DB_USER`

Then in your deployment workflow:
```yaml
- name: Run database migrations
  env:
    SUPABASE_DB_HOST: ${{ secrets.SUPABASE_DB_HOST }}
    SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
    SUPABASE_DB_PORT: 6543
    SUPABASE_DB_USER: postgres.gmhrjszytqslojujpvws
  run: npm run migrate:auto
```

## 📝 What You Need to Do NOW

1. Go to the Supabase dashboard (link above)
2. Copy the **Host** value from "Connection pooling"
3. Add it to `.env.local` as `SUPABASE_DB_HOST`
4. Run `npm run migrate:auto`

Then you're done forever! 🎉

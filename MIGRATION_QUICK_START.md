# 🚀 Quick Migration Setup

The automated script needs the correct database connection host. Since Supabase uses different connection formats by region, here are **3 simple options**:

## Option 1: Manual (2 minutes) ⚡ **FASTEST**

The migration SQL is already in your clipboard! Just:

1. Open SQL Editor: https://supabase.com/dashboard/project/gmhrjszytqslojujpvws/sql/new
2. Paste (Ctrl+V) and click **Run**
3. Create storage bucket:
   - Go to: https://supabase.com/dashboard/project/gmhrjszytqslojujpvws/storage/buckets
   - Click "New bucket"
   - Name: `skin-photos`
   - Public: **No**
   - Click "Create"

4. Add storage policies (paste in SQL Editor and run):

```sql
-- Storage Policies
CREATE POLICY "Users can upload own photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'skin-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own photos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'skin-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'skin-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Service role full access"
ON storage.objects FOR ALL TO service_role
USING (bucket_id = 'skin-photos')
WITH CHECK (bucket_id = 'skin-photos');
```

✅ **Done!** Photo tracking system is now ready.

---

## Option 2: Supabase CLI (5 minutes) 🔧

If you want proper automated migrations for future:

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Link your project:
```bash
npx supabase link --project-ref gmhrjszytqslojujpvws
# Enter your database password when prompted
```

3. Push migrations:
```bash
npx supabase db push
```

4. Future migrations are automatic! Just add SQL files to `supabase/migrations/` and run `npx supabase db push`

---

## Option 3: Get Connection String (for the migrate-auto script)

To make the `npm run migrate:auto` script work:

1. Go to: https://supabase.com/dashboard/project/gmhrjszytqslojujpvws/settings/database
2. Scroll to **"Connection string"**
3. Select **"Connection pooling"** tab
4. Copy the **Host** value (e.g., `aws-0-us-east-1.pooler.supabase.com`)
5. Add to `.env.local`:

```bash
SUPABASE_DB_HOST=aws-0-[your-region].pooler.supabase.com
```

6. Then `npm run migrate:auto` will work

---

## 💡 Recommendation

For now: **Use Option 1** (manual - it's fastest!)

For future: **Set up Option 2** (Supabase CLI - it's the official way)

---

## 🧪 Test It Works

After migration, test the system:

1. Start your dev server: `npm run dev`
2. Go through the onboarding flow
3. When you reach the photo upload screen, try uploading a photo
4. Check it appears in: https://supabase.com/dashboard/project/gmhrjszytqslojujpvws/storage/buckets/skin-photos

---

**Current Status**: Migration SQL is in your clipboard, ready to paste! ✨

# 📸 Photo Tracking System - Quick Setup

## One-Time Setup (5 minutes)

### Step 1: Run SQL Migration

1. **Open Supabase SQL Editor**:
   - Go to: https://supabase.com/dashboard/project/gmhrjszytqslojujpvws/sql/new

2. **Copy the SQL**:
   - Open file: `supabase/migrations/20250101_create_photo_tracking.sql`
   - Copy ALL contents (Ctrl+A, Ctrl+C)

3. **Paste and Run**:
   - Paste into SQL Editor
   - Click **"Run"** or press **Ctrl+Enter**

4. **Verify Success**:
   ```
   ✅ Success. No rows returned
   ```

---

### Step 2: Create Storage Bucket

1. **Go to Storage**:
   - Dashboard → Storage → Buckets → **"New Bucket"**

2. **Configure Bucket**:
   ```
   Name: skin-photos
   Public: ❌ NO (keep private)
   File Size Limit: 5 MB
   Allowed MIME types: image/*
   ```

3. **Click "Create Bucket"**

---

### Step 3: Add Storage Policies

1. **Go to Storage Policies**:
   - Dashboard → Storage → Policies → Click bucket `skin-photos`

2. **Run this SQL** (in SQL Editor):

```sql
-- Users can upload their own photos
CREATE POLICY "Users can upload own photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'skin-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can view their own photos
CREATE POLICY "Users can view own photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'skin-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own photos
CREATE POLICY "Users can delete own photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'skin-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Service role has full access (for ML export)
CREATE POLICY "Service role full access"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'skin-photos')
WITH CHECK (bucket_id = 'skin-photos');
```

---

### Step 4: Verify Setup

Run this SQL to check everything:

```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('skin_photos', 'photo_outcomes');

-- Check bucket exists
SELECT * FROM storage.buckets WHERE id = 'skin-photos';

-- Check policies
SELECT policyname FROM pg_policies WHERE tablename = 'skin_photos';
```

Expected output:
- ✅ 2 tables (skin_photos, photo_outcomes)
- ✅ 1 bucket (skin-photos)
- ✅ 4+ policies

---

## ✅ Setup Complete!

### What You Just Built:
- 📊 Database tables for photo metadata
- 🪣 Secure storage bucket
- 🔐 Row-level security policies
- 🤖 ML consent tracking
- 📈 Progress tracking system

### Next Steps:
1. Test photo upload in your app
2. Integrate PhotoUpload component
3. Start collecting data!

### Integration Example:

```typescript
import { PhotoUpload } from '@/components/onboarding/PhotoUpload';

<PhotoUpload
  onPhotoUploaded={(photoId, photoUrl) => {
    console.log('Photo uploaded!', photoId);
  }}
  onSkip={() => console.log('Skipped')}
  photoType="baseline"
  showMLConsent={true}
/>
```

---

## Troubleshooting

### "Table already exists" error
✅ Safe to ignore - table was created successfully

### "Bucket not found"
- Check bucket name is exactly `skin-photos` (case-sensitive)
- Verify in Dashboard → Storage

### Photos won't upload
- Check user is authenticated
- Verify storage policies are created
- Check browser console for errors

---

## Quick Links

- **Dashboard**: https://supabase.com/dashboard/project/gmhrjszytqslojujpvws
- **SQL Editor**: https://supabase.com/dashboard/project/gmhrjszytqslojujpvws/sql/new
- **Tables**: https://supabase.com/dashboard/project/gmhrjszytqslojujpvws/editor
- **Storage**: https://supabase.com/dashboard/project/gmhrjszytqslojujpvws/storage/buckets

---

Need help? Check [docs/PHOTO_TRACKING_SETUP.md](docs/PHOTO_TRACKING_SETUP.md) for detailed documentation.

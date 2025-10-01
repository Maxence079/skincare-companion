# Photo Tracking System Setup Guide

## Overview

The Photo Tracking System enables **silent data collection** for future ML training while providing immediate value to users through progress tracking.

### What It Does:
- ✅ Users upload skin photos (optional)
- ✅ Photos stored securely in Supabase
- ✅ Basic validation with Claude Vision (contradiction detection only)
- ✅ Progress timeline UI for user engagement
- ✅ ML consent tracking for future training
- ✅ Anonymized dataset preparation for ML

---

## Setup Steps

### 1. Run Database Migration

The migration creates two main tables:
- `skin_photos` - Stores photo metadata
- `photo_outcomes` - Tracks before/after results

```bash
# Run the migration
npx supabase migration up
```

Or manually run the SQL in Supabase Dashboard:
- Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
- Copy contents of `supabase/migrations/20250101_create_photo_tracking.sql`
- Execute

---

### 2. Create Storage Bucket

#### Via Supabase Dashboard:
1. Go to **Storage** → **Buckets**
2. Click **New Bucket**
3. Settings:
   - **Name**: `skin-photos`
   - **Public**: ❌ **No** (private bucket)
   - **File size limit**: 5MB
   - **Allowed MIME types**: `image/*`
4. Click **Create Bucket**

#### Via SQL (Alternative):
```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'skin-photos',
  'skin-photos',
  false,
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
);
```

---

### 3. Setup Storage Policies

Go to **Storage** → **Policies** → Click on `skin-photos` bucket

#### Policy 1: Users can upload their own photos
```sql
CREATE POLICY "Users can upload own photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'skin-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Policy 2: Users can view their own photos
```sql
CREATE POLICY "Users can view own photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'skin-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Policy 3: Users can delete their own photos
```sql
CREATE POLICY "Users can delete own photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'skin-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Policy 4: Service role has full access (for ML export)
```sql
CREATE POLICY "Service role full access"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'skin-photos')
WITH CHECK (bucket_id = 'skin-photos');
```

---

### 4. Verify Setup

Run this SQL to check if everything is configured:

```sql
-- Check if bucket exists
SELECT * FROM storage.buckets WHERE id = 'skin-photos';

-- Check if tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('skin_photos', 'photo_outcomes');

-- Check policies
SELECT * FROM storage.policies WHERE bucket_id = 'skin-photos';
```

---

## Integration with Onboarding

### Add to Fully AI Onboarding Flow

Edit `components/onboarding/FullyAIDrivenOnboarding.tsx`:

```typescript
import { PhotoUpload } from '@/components/onboarding/PhotoUpload';
import { useState } from 'react';

// Add state
const [showPhotoUpload, setShowPhotoUpload] = useState(false);
const [photoUploaded, setPhotoUploaded] = useState(false);

// After user completes conversation, show photo upload
{isDone && !photoUploaded && (
  <PhotoUpload
    onPhotoUploaded={(photoId, photoUrl) => {
      setPhotoUploaded(true);
      console.log('Photo uploaded:', photoId);
      // Continue to next step
    }}
    onSkip={() => {
      setPhotoUploaded(true);
      // Continue without photo
    }}
    photoType="baseline"
    userProfile={finalProfile}
    showMLConsent={true}
  />
)}
```

---

## Usage Examples

### 1. Upload Photo During Onboarding
```typescript
<PhotoUpload
  onPhotoUploaded={(photoId, photoUrl) => {
    console.log('Uploaded:', photoId);
  }}
  onSkip={() => console.log('Skipped')}
  photoType="baseline"
  userProfile={skinProfile}
  showMLConsent={true}
/>
```

### 2. Show User's Photo Timeline
```typescript
import { PhotoTimeline } from '@/components/photos/PhotoTimeline';

<PhotoTimeline
  userId={user.id}
  onTakeNewPhoto={() => {
    // Open photo upload modal
  }}
/>
```

### 3. Programmatically Upload Photo
```typescript
import { uploadSkinPhoto } from '@/lib/services/photo-tracking';

const photoMetadata = await uploadSkinPhoto({
  userId: user.id,
  photoFile: file,
  photoType: 'progress',
  skinProfile: currentProfile,
  mlConsent: true,
  daysSinceBaseline: 30
});
```

---

## ML Dataset Export (Future)

### Export Anonymized Training Data

When you're ready to train ML models (6-12 months):

```sql
-- Export consented photos with outcomes
SELECT * FROM ml_training_dataset
WHERE anonymized_id IS NOT NULL
LIMIT 1000;
```

This returns:
- ✅ Anonymized IDs (no user info)
- ✅ Photo URLs
- ✅ Skin type, concerns, environment data
- ✅ Before/after outcomes
- ✅ Product routines used

### Export Format
```json
{
  "anonymized_id": "uuid",
  "before_photo_url": "...",
  "after_photo_url": "...",
  "days_between": 30,
  "skin_type": "combination",
  "concerns": ["acne", "texture"],
  "environment": { "climate": "humid", "uv_index": 7 },
  "routine_followed": [...],
  "improvement": 75
}
```

---

## Privacy & Compliance

### ✅ GDPR Compliant
- Users must explicitly opt-in for ML usage
- Photos are private by default
- Anonymized IDs used for ML dataset
- Users can delete photos anytime

### ✅ Data Flow
1. User uploads photo → Stored with user_id
2. User opts in to ML → Generates anonymized_id
3. ML export → Only anonymized_id included
4. Original user_id never in training dataset

### ✅ Storage Costs
- Supabase Free Tier: 1GB storage
- Compressed photos: ~200KB each
- Capacity: ~5,000 photos on free tier
- Upgrade: $25/month for 100GB (500,000 photos)

---

## Monitoring & Analytics

### Track ML Consent Rate
```sql
SELECT
  COUNT(*) as total_photos,
  SUM(CASE WHEN ml_consent THEN 1 ELSE 0 END) as consented,
  ROUND(100.0 * SUM(CASE WHEN ml_consent THEN 1 ELSE 0 END) / COUNT(*), 2) as consent_rate
FROM skin_photos;
```

### Photo Quality Distribution
```sql
SELECT
  validation_status,
  COUNT(*) as count,
  AVG(photo_quality_score) as avg_quality
FROM skin_photos
GROUP BY validation_status;
```

### Timeline Completion Rate
```sql
SELECT
  user_id,
  COUNT(*) as photo_count,
  MAX(days_since_baseline) as longest_streak
FROM skin_photos
GROUP BY user_id
HAVING COUNT(*) >= 3 -- Users with 3+ photos
ORDER BY photo_count DESC;
```

---

## Troubleshooting

### Error: "Bucket not found"
- ✅ Check bucket exists in Supabase Dashboard → Storage
- ✅ Verify bucket name is exactly `skin-photos` (case-sensitive)

### Error: "Permission denied"
- ✅ Check storage policies are created
- ✅ Verify user is authenticated
- ✅ Check RLS is enabled on tables

### Photos not uploading
- ✅ Check file size < 5MB
- ✅ Verify MIME type is `image/*`
- ✅ Check browser console for errors

### Validation always fails
- ✅ Check `ANTHROPIC_API_KEY` is set
- ✅ Verify Claude API has Vision enabled
- ✅ Check API usage limits

---

## Next Steps

### Phase 1: Data Collection (Months 1-6) ← **YOU ARE HERE**
- ✅ System is live
- ✅ Users uploading photos
- 🎯 Goal: 500-1,000 consented photos

### Phase 2: Dataset Preparation (Month 6)
- Tag photos with dermatologist reviews
- Calculate improvement metrics
- Build training/validation/test splits

### Phase 3: ML Model Training (Month 12+)
- Train custom vision model
- Accurate skin type detection
- Progress prediction
- Product effectiveness forecasting

---

## Contact & Support

For issues or questions:
1. Check Supabase logs: Dashboard → Logs
2. Check API logs: Browser console
3. Check server logs: `npm run dev` output
4. Review this documentation

Happy data collecting! 🎉

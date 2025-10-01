-- Storage Policies for Photo Tracking
-- Run this AFTER creating the 'skin-photos' bucket

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

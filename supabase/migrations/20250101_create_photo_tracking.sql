-- Photo Tracking System for ML Data Collection
-- Stores user skin photos with metadata for future ML training

-- Enable storage
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create skin_photos table
CREATE TABLE IF NOT EXISTS public.skin_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Photo metadata
  photo_url TEXT NOT NULL,
  photo_type VARCHAR(20) NOT NULL CHECK (photo_type IN ('baseline', 'progress', 'after')),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Onboarding context (snapshot at time of photo)
  skin_profile JSONB, -- Full profile at time of photo
  concerns TEXT[], -- Array of concerns ["acne", "dryness"]
  skin_type VARCHAR(50), -- "oily", "dry", "combination", etc.

  -- Environmental context (for ML correlations)
  environment_data JSONB, -- Climate, UV, pollution from geolocation

  -- Routine context (what products they're using)
  current_routine JSONB, -- Products being used at this time

  -- Photo quality & validation
  photo_quality_score INTEGER CHECK (photo_quality_score >= 0 AND photo_quality_score <= 100),
  validation_status VARCHAR(20) DEFAULT 'pending' CHECK (validation_status IN ('pending', 'validated', 'rejected', 'flagged')),
  validation_notes TEXT,

  -- ML consent & usage
  ml_consent BOOLEAN DEFAULT false, -- User allowed anonymous ML usage
  ml_dataset_included BOOLEAN DEFAULT false, -- Included in training dataset
  anonymized_id UUID, -- For ML dataset (disconnected from user_id)

  -- Photo analysis (from Claude Vision - basic only)
  visual_analysis JSONB, -- Store basic contradiction checks

  -- Progress tracking
  days_since_baseline INTEGER, -- 0, 7, 14, 30, 60, 90
  improvement_self_reported INTEGER CHECK (improvement_self_reported >= 0 AND improvement_self_reported <= 100),

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create photo_outcomes table (for ML training labels)
CREATE TABLE IF NOT EXISTS public.photo_outcomes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  before_photo_id UUID NOT NULL REFERENCES public.skin_photos(id) ON DELETE CASCADE,
  after_photo_id UUID NOT NULL REFERENCES public.skin_photos(id) ON DELETE CASCADE,

  -- Outcome metrics
  days_between INTEGER NOT NULL,
  routine_followed JSONB NOT NULL, -- Products used during this period

  -- User-reported outcomes
  overall_improvement INTEGER CHECK (overall_improvement >= -100 AND overall_improvement <= 100), -- -100 (worse) to +100 (better)
  concern_improvements JSONB, -- {"acne": 70, "texture": 30, "redness": -10}
  side_effects TEXT[],

  -- AI-detected outcomes (future: from photo comparison)
  ai_detected_changes JSONB,

  -- Environmental factors during period
  avg_environment JSONB,

  -- ML labels (future: dermatologist review)
  expert_validated BOOLEAN DEFAULT false,
  expert_notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX idx_skin_photos_user_id ON public.skin_photos(user_id);
CREATE INDEX idx_skin_photos_uploaded_at ON public.skin_photos(uploaded_at);
CREATE INDEX idx_skin_photos_photo_type ON public.skin_photos(photo_type);
CREATE INDEX idx_skin_photos_ml_consent ON public.skin_photos(ml_consent);
CREATE INDEX idx_skin_photos_days_since_baseline ON public.skin_photos(days_since_baseline);
CREATE INDEX idx_photo_outcomes_before_after ON public.photo_outcomes(before_photo_id, after_photo_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_skin_photos_updated_at BEFORE UPDATE ON public.skin_photos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE public.skin_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_outcomes ENABLE ROW LEVEL SECURITY;

-- Users can only see their own photos
CREATE POLICY "Users can view own photos"
  ON public.skin_photos
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own photos
CREATE POLICY "Users can insert own photos"
  ON public.skin_photos
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own photos
CREATE POLICY "Users can update own photos"
  ON public.skin_photos
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can view their own outcomes
CREATE POLICY "Users can view own outcomes"
  ON public.photo_outcomes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.skin_photos
      WHERE id = before_photo_id AND user_id = auth.uid()
    )
  );

-- Service role can access all (for ML training)
CREATE POLICY "Service role can access all photos"
  ON public.skin_photos
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can access all outcomes"
  ON public.photo_outcomes
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Create storage bucket for photos (run this manually in Supabase dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('skin-photos', 'skin-photos', false);

-- Storage policies (run after bucket creation)
-- CREATE POLICY "Users can upload own photos"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'skin-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can view own photos"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'skin-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Helper view for ML dataset (anonymized)
CREATE OR REPLACE VIEW ml_training_dataset AS
SELECT
  p.anonymized_id,
  p.photo_type,
  p.photo_url,
  p.concerns,
  p.skin_type,
  p.environment_data,
  p.current_routine,
  p.visual_analysis,
  p.days_since_baseline,
  p.improvement_self_reported,
  o.overall_improvement,
  o.concern_improvements,
  o.routine_followed,
  o.days_between
FROM public.skin_photos p
LEFT JOIN public.photo_outcomes o ON p.id = o.after_photo_id
WHERE p.ml_consent = true
  AND p.ml_dataset_included = true
  AND p.validation_status = 'validated';

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.skin_photos TO authenticated;
GRANT SELECT, INSERT ON public.photo_outcomes TO authenticated;
GRANT SELECT ON ml_training_dataset TO service_role;

COMMENT ON TABLE public.skin_photos IS 'Stores user skin photos for progress tracking and future ML training';
COMMENT ON TABLE public.photo_outcomes IS 'Tracks before/after outcomes for ML training labels';
COMMENT ON VIEW ml_training_dataset IS 'Anonymized dataset for ML model training (consented users only)';

-- Recreate skin_photos table with full schema

-- Drop existing table
DROP TABLE IF EXISTS photo_audit_log CASCADE;
DROP TABLE IF EXISTS photo_consent CASCADE;
DROP TABLE IF EXISTS skin_photos CASCADE;

-- Recreate with complete schema
CREATE TABLE skin_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,

  -- Photo storage
  photo_url TEXT NOT NULL,
  photo_path TEXT NOT NULL,

  -- Photo type
  photo_type TEXT NOT NULL DEFAULT 'baseline' CHECK (photo_type IN ('baseline', 'progress', 'after')),

  -- Technical metadata
  file_format TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,

  -- Validation metrics
  quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
  brightness TEXT CHECK (brightness IN ('too_dark', 'too_bright', 'good')),
  sharpness TEXT CHECK (sharpness IN ('blurry', 'acceptable', 'sharp')),
  aspect_ratio TEXT CHECK (aspect_ratio IN ('portrait', 'landscape', 'square')),

  -- Face detection metrics
  face_detected BOOLEAN DEFAULT false,
  face_count INTEGER DEFAULT 0,
  face_coverage DECIMAL(5,2),
  face_confidence DECIMAL(3,2),
  is_centered BOOLEAN DEFAULT false,
  horizontal_position DECIMAL(3,2),
  vertical_position DECIMAL(3,2),

  -- Validation results
  validation_passed BOOLEAN DEFAULT false,
  validation_issues JSONB DEFAULT '[]'::jsonb,
  validation_recommendations JSONB DEFAULT '[]'::jsonb,

  -- Anonymization
  is_anonymized BOOLEAN DEFAULT false,
  anonymization_date TIMESTAMPTZ,
  original_user_id UUID,

  -- Data lifecycle
  expires_at TIMESTAMPTZ NOT NULL,
  deletion_scheduled_at TIMESTAMPTZ,
  actual_deletion_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE photo_consent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_id UUID REFERENCES skin_photos(id) ON DELETE CASCADE,

  -- Core consent
  storage_consent BOOLEAN NOT NULL DEFAULT false,
  ml_training_consent BOOLEAN NOT NULL DEFAULT false,
  research_consent BOOLEAN NOT NULL DEFAULT false,

  -- Legal metadata
  consent_version TEXT NOT NULL,
  consent_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  consent_ip_address INET,
  user_agent TEXT,

  -- Privacy controls
  data_retention_period INTEGER NOT NULL,
  allow_third_party_sharing BOOLEAN DEFAULT false,
  allow_anonymized_research BOOLEAN DEFAULT false,

  -- User rights
  right_to_delete BOOLEAN DEFAULT true,
  right_to_export BOOLEAN DEFAULT true,
  right_to_withdraw_consent BOOLEAN DEFAULT true,

  -- Consent withdrawal
  consent_withdrawn BOOLEAN DEFAULT false,
  consent_withdrawn_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE photo_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID REFERENCES skin_photos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Action details
  action TEXT NOT NULL,
  action_details JSONB,

  -- Request metadata
  ip_address INET,
  user_agent TEXT,

  -- Result
  success BOOLEAN DEFAULT true,
  error_message TEXT,

  -- Timestamp
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Success
DO $$
BEGIN
  RAISE NOTICE 'Photo system tables recreated successfully';
END $$;

-- Photo Database System - Part 2: Indexes, RLS, and Functions

-- =====================================================
-- 1. INDEXES FOR PERFORMANCE
-- =====================================================

-- skin_photos indexes
CREATE INDEX IF NOT EXISTS idx_skin_photos_user_id ON skin_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_skin_photos_session_id ON skin_photos(session_id);
CREATE INDEX IF NOT EXISTS idx_skin_photos_photo_type ON skin_photos(photo_type);
CREATE INDEX IF NOT EXISTS idx_skin_photos_created_at ON skin_photos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_skin_photos_expires_at ON skin_photos(expires_at);
CREATE INDEX IF NOT EXISTS idx_skin_photos_is_anonymized ON skin_photos(is_anonymized);
CREATE INDEX IF NOT EXISTS idx_skin_photos_validation_passed ON skin_photos(validation_passed);

-- photo_consent indexes
CREATE INDEX IF NOT EXISTS idx_photo_consent_user_id ON photo_consent(user_id);
CREATE INDEX IF NOT EXISTS idx_photo_consent_photo_id ON photo_consent(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_consent_storage ON photo_consent(storage_consent);
CREATE INDEX IF NOT EXISTS idx_photo_consent_ml_training ON photo_consent(ml_training_consent);
CREATE INDEX IF NOT EXISTS idx_photo_consent_withdrawn ON photo_consent(consent_withdrawn);

-- photo_audit_log indexes
CREATE INDEX IF NOT EXISTS idx_photo_audit_log_photo_id ON photo_audit_log(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_audit_log_user_id ON photo_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_photo_audit_log_action ON photo_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_photo_audit_log_timestamp ON photo_audit_log(timestamp DESC);

-- =====================================================
-- 2. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE skin_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_consent ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_audit_log ENABLE ROW LEVEL SECURITY;

-- Policies for skin_photos
CREATE POLICY "Users can view their own photos"
  ON skin_photos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own photos"
  ON skin_photos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own photos"
  ON skin_photos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own photos"
  ON skin_photos FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for photo_consent
CREATE POLICY "Users can view their own consent"
  ON photo_consent FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own consent"
  ON photo_consent FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own consent"
  ON photo_consent FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies for photo_audit_log
CREATE POLICY "Users can view their own audit logs"
  ON photo_audit_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert audit logs"
  ON photo_audit_log FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- 3. FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_photo_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_skin_photos_updated_at
  BEFORE UPDATE ON skin_photos
  FOR EACH ROW
  EXECUTE FUNCTION update_photo_timestamp();

CREATE TRIGGER update_photo_consent_updated_at
  BEFORE UPDATE ON photo_consent
  FOR EACH ROW
  EXECUTE FUNCTION update_photo_timestamp();

-- Function to schedule photo deletion based on retention policy
CREATE OR REPLACE FUNCTION schedule_photo_deletion()
RETURNS void AS $$
BEGIN
  UPDATE skin_photos
  SET deletion_scheduled_at = NOW()
  WHERE expires_at < NOW()
    AND deletion_scheduled_at IS NULL
    AND actual_deletion_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to log photo actions (for audit trail)
CREATE OR REPLACE FUNCTION log_photo_action(
  p_photo_id UUID,
  p_user_id UUID,
  p_action TEXT,
  p_details JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO photo_audit_log (
    photo_id,
    user_id,
    action,
    action_details,
    ip_address,
    user_agent
  ) VALUES (
    p_photo_id,
    p_user_id,
    p_action,
    p_details,
    p_ip_address,
    p_user_agent
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE skin_photos IS 'Stores user facial photos with technical quality metrics and validation results';
COMMENT ON TABLE photo_consent IS 'Tracks user consent for photo storage, ML training, and research (GDPR/HIPAA compliant)';
COMMENT ON TABLE photo_audit_log IS 'Audit trail for all photo-related actions (GDPR Article 30 compliance)';

COMMENT ON COLUMN skin_photos.quality_score IS 'Overall photo quality score (0-100) based on brightness, sharpness, and composition';
COMMENT ON COLUMN skin_photos.face_coverage IS 'Percentage of image filled by face (15-60% is optimal)';
COMMENT ON COLUMN skin_photos.is_anonymized IS 'Whether photo has been anonymized for ML training (user_id removed)';
COMMENT ON COLUMN skin_photos.expires_at IS 'Automatic deletion date based on user-selected retention period';

COMMENT ON COLUMN photo_consent.consent_version IS 'Version of consent form user agreed to (for legal audit trail)';
COMMENT ON COLUMN photo_consent.data_retention_period IS 'Number of days to retain photo before automatic deletion';
COMMENT ON COLUMN photo_consent.consent_withdrawn IS 'Whether user has withdrawn consent (triggers deletion)';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Photo system indexes, RLS, and functions created successfully';
END $$;

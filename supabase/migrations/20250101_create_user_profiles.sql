-- User Profiles Table
-- Stores generated skin profiles from AI onboarding conversations

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES onboarding_sessions(id) ON DELETE SET NULL,

  -- Profile metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,

  -- Skin analysis (AI-generated from conversation)
  skin_type TEXT, -- 'oily', 'dry', 'combination', 'normal', 'sensitive'
  skin_concerns TEXT[], -- ['acne', 'aging', 'hyperpigmentation', 'redness', etc.]
  sensitivity_level TEXT, -- 'low', 'medium', 'high'

  -- Detailed skin characteristics
  oil_production TEXT, -- 'low', 'moderate', 'high', 'very_high'
  hydration_level TEXT, -- 'dehydrated', 'normal', 'well_hydrated'
  pore_size TEXT, -- 'small', 'medium', 'large'
  texture_issues TEXT[], -- ['roughness', 'uneven', 'bumpy', 'smooth']

  -- Environmental & lifestyle factors
  climate_zone TEXT, -- 'humid', 'dry', 'temperate', 'cold'
  sun_exposure TEXT, -- 'low', 'moderate', 'high'
  lifestyle_factors JSONB, -- {stress_level, sleep_quality, diet, exercise}

  -- Current routine analysis
  current_routine JSONB, -- {morning: [...], evening: [...], frequency: ...}
  product_preferences JSONB, -- {textures: [], ingredients_loved: [], ingredients_avoid: []}

  -- AI-generated profile
  archetype_id TEXT, -- Reference to predefined archetype if applicable
  archetype_confidence NUMERIC, -- 0.0 to 1.0
  profile_summary TEXT, -- Human-readable summary
  key_recommendations TEXT[], -- Top 3-5 actionable recommendations

  -- Conversation data (for reference)
  conversation_messages JSONB, -- Array of {role, content, timestamp}
  conversation_metadata JSONB, -- {message_count, duration_minutes, quality_score}

  -- Machine-readable profile (for matching algorithms)
  profile_vector JSONB, -- Structured data for product matching
  confidence_scores JSONB -- Per-attribute confidence levels
);

-- Indexes for common queries
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_active ON user_profiles(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_user_profiles_skin_type ON user_profiles(skin_type);
CREATE INDEX idx_user_profiles_archetype ON user_profiles(archetype_id);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profile_timestamp
BEFORE UPDATE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION update_profile_timestamp();

-- Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can only access their own profiles
CREATE POLICY "Users can view own profiles"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profiles"
  ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profiles"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own profiles"
  ON user_profiles
  FOR DELETE
  USING (auth.uid() = user_id);

-- Comments for documentation
COMMENT ON TABLE user_profiles IS 'Stores AI-generated skin profiles from onboarding conversations';
COMMENT ON COLUMN user_profiles.profile_vector IS 'Structured data for algorithmic product matching';
COMMENT ON COLUMN user_profiles.conversation_messages IS 'Full conversation history for profile regeneration';
COMMENT ON COLUMN user_profiles.archetype_id IS 'Optional link to predefined skin archetype';

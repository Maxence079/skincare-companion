-- Fix onboarding_sessions table
-- Drop and recreate with correct schema

-- Drop existing table if it exists
DROP TABLE IF EXISTS onboarding_sessions CASCADE;

-- Recreate with correct schema
CREATE TABLE onboarding_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Session metadata
  session_token TEXT UNIQUE NOT NULL, -- For anonymous users
  session_status TEXT DEFAULT 'active', -- 'active', 'completed', 'abandoned'

  -- Conversation state
  messages JSONB DEFAULT '[]'::jsonb, -- Array of {role, content, timestamp}
  current_phase INTEGER DEFAULT 0, -- 0-3 (Discovery, Concerns, Routine, Lifestyle)

  -- Environmental context (captured once)
  geolocation JSONB, -- {latitude, longitude, city, country, timezone}
  enriched_context JSONB, -- Weather, UV, air quality data

  -- AI state
  suggested_examples JSONB, -- Last AI-generated suggestions
  conversation_signals JSONB, -- Extracted signals (oily_skin, sensitive, etc.)

  -- Progress tracking
  message_count INTEGER DEFAULT 0,
  estimated_completion NUMERIC, -- 0.0 to 1.0
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '48 hours') -- Session timeout
);

-- Indexes for performance
CREATE INDEX idx_onboarding_sessions_token ON onboarding_sessions(session_token);
CREATE INDEX idx_onboarding_sessions_user ON onboarding_sessions(user_id);
CREATE INDEX idx_onboarding_sessions_status ON onboarding_sessions(session_status);
CREATE INDEX idx_onboarding_sessions_expires ON onboarding_sessions(expires_at) WHERE session_status = 'active';
CREATE INDEX idx_onboarding_sessions_activity ON onboarding_sessions(last_activity_at);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_activity_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_session_timestamp
BEFORE UPDATE ON onboarding_sessions
FOR EACH ROW
EXECUTE FUNCTION update_session_timestamp();

-- Auto-mark expired sessions as abandoned
CREATE OR REPLACE FUNCTION mark_expired_sessions()
RETURNS void AS $$
BEGIN
  UPDATE onboarding_sessions
  SET session_status = 'abandoned'
  WHERE session_status = 'active'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS)
ALTER TABLE onboarding_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only access their own sessions (or sessions with their token)
CREATE POLICY "Users can view own sessions"
  ON onboarding_sessions
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    session_token IN (
      SELECT session_token FROM onboarding_sessions WHERE id = id
    )
  );

CREATE POLICY "Users can insert own sessions"
  ON onboarding_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own sessions"
  ON onboarding_sessions
  FOR UPDATE
  USING (
    auth.uid() = user_id OR
    session_token IN (
      SELECT session_token FROM onboarding_sessions WHERE id = id
    )
  );

-- Comments for documentation
COMMENT ON TABLE onboarding_sessions IS 'Stores conversation state for onboarding with resume capability';
COMMENT ON COLUMN onboarding_sessions.session_token IS 'Unique token for anonymous session identification';
COMMENT ON COLUMN onboarding_sessions.messages IS 'Full conversation history as JSONB array';
COMMENT ON COLUMN onboarding_sessions.conversation_signals IS 'Extracted data points from conversation';
COMMENT ON COLUMN onboarding_sessions.expires_at IS 'Session expiry time (48 hours from last activity)';

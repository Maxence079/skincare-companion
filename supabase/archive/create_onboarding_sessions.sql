-- Onboarding Sessions Table
CREATE TABLE IF NOT EXISTS onboarding_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Session state
  current_question_id TEXT,
  questions_answered INTEGER DEFAULT 0,
  is_complete BOOLEAN DEFAULT FALSE,

  -- Tracking
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Progress data
  confidence NUMERIC DEFAULT 0,
  estimated_remaining INTEGER,
  top_archetypes TEXT[],

  -- Final result (when complete)
  final_archetype JSONB,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

-- Session Answers Table (stores answer history)
CREATE TABLE IF NOT EXISTS onboarding_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES onboarding_sessions(id) ON DELETE CASCADE,

  -- Answer data
  question_id TEXT NOT NULL,
  answer_value JSONB NOT NULL, -- Flexible: single value, multiple values, slider, etc.

  -- Confidence at time of answer
  confidence_after NUMERIC,

  -- Tracking
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  answer_order INTEGER, -- Track sequence (for edit/rewind)

  -- Constraints
  UNIQUE(session_id, question_id) -- Can't answer same question twice in one session
);

-- Indexes for performance
CREATE INDEX idx_sessions_user_id ON onboarding_sessions(user_id);
CREATE INDEX idx_sessions_incomplete ON onboarding_sessions(is_complete, last_updated) WHERE is_complete = FALSE;
CREATE INDEX idx_answers_session ON onboarding_answers(session_id, answer_order);

-- Auto-update last_updated timestamp
CREATE OR REPLACE FUNCTION update_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_session_timestamp
BEFORE UPDATE ON onboarding_sessions
FOR EACH ROW
EXECUTE FUNCTION update_session_timestamp();

-- Row Level Security (RLS)
ALTER TABLE onboarding_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_answers ENABLE ROW LEVEL SECURITY;

-- Users can only see their own sessions
CREATE POLICY "Users can view own sessions"
  ON onboarding_sessions
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL); -- Allow anonymous sessions

CREATE POLICY "Users can insert own sessions"
  ON onboarding_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own sessions"
  ON onboarding_sessions
  FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Users can manage their session answers
CREATE POLICY "Users can view own answers"
  ON onboarding_answers
  FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM onboarding_sessions
      WHERE user_id = auth.uid() OR user_id IS NULL
    )
  );

CREATE POLICY "Users can insert own answers"
  ON onboarding_answers
  FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM onboarding_sessions
      WHERE user_id = auth.uid() OR user_id IS NULL
    )
  );

CREATE POLICY "Users can update own answers"
  ON onboarding_answers
  FOR UPDATE
  USING (
    session_id IN (
      SELECT id FROM onboarding_sessions
      WHERE user_id = auth.uid() OR user_id IS NULL
    )
  );

-- Cleanup function: Delete expired sessions (run daily via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM onboarding_sessions
  WHERE expires_at < NOW()
    AND is_complete = FALSE;
END;
$$ LANGUAGE plpgsql;

-- Comment for documentation
COMMENT ON TABLE onboarding_sessions IS 'Stores user onboarding session state for resume capability';
COMMENT ON TABLE onboarding_answers IS 'Stores individual answers within each session, allowing edit/rewind functionality';
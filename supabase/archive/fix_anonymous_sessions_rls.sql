-- Fix RLS policies to properly support anonymous sessions
-- The issue: auth.uid() causes "permission denied" errors when called with anon key

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own sessions" ON onboarding_sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON onboarding_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON onboarding_sessions;
DROP POLICY IF EXISTS "Users can view own answers" ON onboarding_answers;
DROP POLICY IF EXISTS "Users can insert own answers" ON onboarding_answers;
DROP POLICY IF EXISTS "Users can update own answers" ON onboarding_answers;

-- Recreate policies with proper NULL handling
-- For anonymous sessions (user_id IS NULL), allow all operations

CREATE POLICY "Users can view own sessions"
  ON onboarding_sessions
  FOR SELECT
  USING (
    user_id IS NULL OR
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  );

CREATE POLICY "Users can insert own sessions"
  ON onboarding_sessions
  FOR INSERT
  WITH CHECK (
    user_id IS NULL OR
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  );

CREATE POLICY "Users can update own sessions"
  ON onboarding_sessions
  FOR UPDATE
  USING (
    user_id IS NULL OR
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  );

CREATE POLICY "Users can view own answers"
  ON onboarding_answers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM onboarding_sessions
      WHERE onboarding_sessions.id = session_id
      AND (
        onboarding_sessions.user_id IS NULL OR
        (auth.uid() IS NOT NULL AND auth.uid() = onboarding_sessions.user_id)
      )
    )
  );

CREATE POLICY "Users can insert own answers"
  ON onboarding_answers
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM onboarding_sessions
      WHERE onboarding_sessions.id = session_id
      AND (
        onboarding_sessions.user_id IS NULL OR
        (auth.uid() IS NOT NULL AND auth.uid() = onboarding_sessions.user_id)
      )
    )
  );

CREATE POLICY "Users can update own answers"
  ON onboarding_answers
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM onboarding_sessions
      WHERE onboarding_sessions.id = session_id
      AND (
        onboarding_sessions.user_id IS NULL OR
        (auth.uid() IS NOT NULL AND auth.uid() = onboarding_sessions.user_id)
      )
    )
  );
-- Analytics Dashboard Database Views
-- Provides aggregated data for dashboard insights

-- ============================================
-- View: Session Statistics
-- ============================================
CREATE OR REPLACE VIEW onboarding_session_stats AS
SELECT
  COUNT(*) as total_sessions,
  COUNT(*) FILTER (WHERE is_complete = true) as completed_sessions,
  COUNT(*) FILTER (WHERE is_complete = false) as incomplete_sessions,
  ROUND(AVG(questions_answered)) as avg_questions_per_session,
  ROUND(AVG(confidence), 2) as avg_confidence,
  ROUND(COUNT(*) FILTER (WHERE is_complete = true)::numeric / NULLIF(COUNT(*), 0) * 100, 2) as completion_rate
FROM onboarding_sessions
WHERE created_at >= NOW() - INTERVAL '30 days';

-- ============================================
-- View: Archetype Distribution
-- ============================================
CREATE OR REPLACE VIEW archetype_distribution AS
SELECT
  final_archetype->>'archetype' as archetype_name,
  final_archetype->>'name' as archetype_display_name,
  final_archetype->>'emoji' as archetype_emoji,
  COUNT(*) as count,
  ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM onboarding_sessions WHERE is_complete = true) * 100, 2) as percentage
FROM onboarding_sessions
WHERE is_complete = true
  AND final_archetype IS NOT NULL
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY final_archetype->>'archetype', final_archetype->>'name', final_archetype->>'emoji'
ORDER BY count DESC;

-- ============================================
-- View: Question Performance
-- ============================================
CREATE OR REPLACE VIEW question_performance AS
SELECT
  oa.question_id,
  COUNT(DISTINCT oa.session_id) as times_asked,
  ROUND(AVG(oa.answer_order), 2) as avg_position,
  COUNT(DISTINCT oa.session_id)::numeric / (SELECT COUNT(*) FROM onboarding_sessions WHERE is_complete = true) as ask_rate
FROM onboarding_answers oa
JOIN onboarding_sessions os ON oa.session_id = os.id
WHERE os.is_complete = true
  AND os.created_at >= NOW() - INTERVAL '30 days'
GROUP BY oa.question_id
ORDER BY times_asked DESC;

-- ============================================
-- View: Daily Session Trends
-- ============================================
CREATE OR REPLACE VIEW daily_session_trends AS
SELECT
  DATE(created_at) as session_date,
  COUNT(*) as total_sessions,
  COUNT(*) FILTER (WHERE is_complete = true) as completed_sessions,
  ROUND(AVG(questions_answered), 1) as avg_questions,
  ROUND(AVG(confidence), 1) as avg_confidence
FROM onboarding_sessions
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY session_date DESC;

-- ============================================
-- View: Completion Time Analysis
-- ============================================
CREATE OR REPLACE VIEW completion_time_analysis AS
SELECT
  EXTRACT(EPOCH FROM (completed_at - started_at)) / 60 as minutes_to_complete,
  questions_answered,
  confidence,
  final_archetype->>'archetype' as archetype
FROM onboarding_sessions
WHERE is_complete = true
  AND completed_at IS NOT NULL
  AND created_at >= NOW() - INTERVAL '30 days'
ORDER BY completed_at DESC;

-- ============================================
-- View: Answer Pattern Analysis
-- ============================================
CREATE OR REPLACE VIEW answer_patterns AS
SELECT
  oa.question_id,
  oa.answer_value->>'id' as answer_id,
  COUNT(*) as selection_count,
  ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM onboarding_answers WHERE question_id = oa.question_id) * 100, 2) as selection_percentage
FROM onboarding_answers oa
JOIN onboarding_sessions os ON oa.session_id = os.id
WHERE os.is_complete = true
  AND os.created_at >= NOW() - INTERVAL '30 days'
GROUP BY oa.question_id, oa.answer_value->>'id'
ORDER BY oa.question_id, selection_count DESC;

-- ============================================
-- View: User Retention (Resumed Sessions)
-- ============================================
CREATE OR REPLACE VIEW session_retention AS
SELECT
  DATE(started_at) as start_date,
  COUNT(*) FILTER (WHERE last_updated > started_at + INTERVAL '1 hour' AND is_complete = false) as resumed_count,
  COUNT(*) FILTER (WHERE is_complete = false AND last_updated = started_at) as abandoned_immediately,
  COUNT(*) as total_incomplete
FROM onboarding_sessions
WHERE is_complete = false
  AND started_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(started_at)
ORDER BY start_date DESC;

-- ============================================
-- Function: Get Analytics Summary
-- ============================================
CREATE OR REPLACE FUNCTION get_analytics_summary(days_back INTEGER DEFAULT 30)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'totalSessions', (SELECT COUNT(*) FROM onboarding_sessions WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL),
    'completedSessions', (SELECT COUNT(*) FROM onboarding_sessions WHERE is_complete = true AND created_at >= NOW() - (days_back || ' days')::INTERVAL),
    'completionRate', (SELECT ROUND(COUNT(*) FILTER (WHERE is_complete = true)::numeric / NULLIF(COUNT(*), 0) * 100, 2) FROM onboarding_sessions WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL),
    'avgQuestionsAsked', (SELECT ROUND(AVG(questions_answered), 1) FROM onboarding_sessions WHERE is_complete = true AND created_at >= NOW() - (days_back || ' days')::INTERVAL),
    'avgConfidence', (SELECT ROUND(AVG(confidence), 1) FROM onboarding_sessions WHERE is_complete = true AND created_at >= NOW() - (days_back || ' days')::INTERVAL),
    'avgCompletionTime', (SELECT ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) / 60), 1) FROM onboarding_sessions WHERE is_complete = true AND completed_at IS NOT NULL AND created_at >= NOW() - (days_back || ' days')::INTERVAL),
    'topArchetype', (SELECT final_archetype->>'name' FROM onboarding_sessions WHERE is_complete = true AND final_archetype IS NOT NULL AND created_at >= NOW() - (days_back || ' days')::INTERVAL GROUP BY final_archetype->>'name' ORDER BY COUNT(*) DESC LIMIT 1),
    'mostAskedQuestion', (SELECT question_id FROM onboarding_answers oa JOIN onboarding_sessions os ON oa.session_id = os.id WHERE os.created_at >= NOW() - (days_back || ' days')::INTERVAL GROUP BY question_id ORDER BY COUNT(*) DESC LIMIT 1)
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RLS Policies for Analytics Views
-- ============================================

-- Only allow admin access to analytics
-- (You can modify this based on your admin role setup)
CREATE POLICY "Admin can view analytics" ON onboarding_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
      -- Add your admin check here, e.g., checking user metadata
      -- AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Create indexes for better analytics query performance
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON onboarding_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_archetype ON onboarding_sessions((final_archetype->>'archetype'));
CREATE INDEX IF NOT EXISTS idx_sessions_complete_created ON onboarding_sessions(is_complete, created_at);
CREATE INDEX IF NOT EXISTS idx_answers_created_at ON onboarding_answers(answered_at);
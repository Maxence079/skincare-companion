-- PENDING MIGRATIONS ONLY
-- Run this if you've already partially applied migrations
-- This file contains ONLY the 5 pending migrations detected by npm run migrate

-- ═══════════════════════════════════════════════════════════
-- Migration: 20250130000002_add_behavioral_signals.sql
-- ═══════════════════════════════════════════════════════════

-- Add behavioral signals tracking to onboarding_answers table
ALTER TABLE onboarding_answers
ADD COLUMN IF NOT EXISTS time_to_answer INTEGER,
ADD COLUMN IF NOT EXISTS time_on_question INTEGER,
ADD COLUMN IF NOT EXISTS hovered_tooltip BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS tooltip_hover_duration INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS answer_changes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS mouse_movements INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS pause_before_answer BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS immediate_edit BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS options_selected INTEGER,
ADD COLUMN IF NOT EXISTS selection_order JSONB;

ALTER TABLE onboarding_answers
ADD COLUMN IF NOT EXISTS behavior_confidence TEXT,
ADD COLUMN IF NOT EXISTS user_state TEXT,
ADD COLUMN IF NOT EXISTS needs_follow_up BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS needs_simplification BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS needs_education BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS engagement_level TEXT,
ADD COLUMN IF NOT EXISTS inferred_complexity TEXT;

CREATE INDEX IF NOT EXISTS idx_onboarding_answers_behavior_confidence ON onboarding_answers(behavior_confidence);
CREATE INDEX IF NOT EXISTS idx_onboarding_answers_user_state ON onboarding_answers(user_state);
CREATE INDEX IF NOT EXISTS idx_onboarding_answers_needs_follow_up ON onboarding_answers(needs_follow_up) WHERE needs_follow_up = TRUE;

INSERT INTO schema_migrations (version) VALUES ('20250130000002_add_behavioral_signals.sql')
ON CONFLICT (version) DO NOTHING;


-- ═══════════════════════════════════════════════════════════
-- Migration: 20250130000003_add_outcome_learning.sql
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS product_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES onboarding_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  archetype_id TEXT NOT NULL,
  products JSONB NOT NULL,
  user_context JSONB,
  user_profile JSONB,
  recommended_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_session FOREIGN KEY (session_id) REFERENCES onboarding_sessions(id)
);

CREATE TABLE IF NOT EXISTS outcome_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id UUID NOT NULL REFERENCES product_recommendations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
  would_recommend BOOLEAN,
  product_ratings JSONB,
  improvements TEXT[],
  concerns_addressed TEXT[],
  new_concerns TEXT[],
  what_worked TEXT,
  what_didnt_work TEXT,
  additional_notes TEXT,
  weeks_used INTEGER,
  still_using BOOLEAN DEFAULT TRUE,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  feedback_prompt_sent_at TIMESTAMPTZ,
  CONSTRAINT fk_recommendation FOREIGN KEY (recommendation_id) REFERENCES product_recommendations(id)
);

CREATE TABLE IF NOT EXISTS learning_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_type TEXT NOT NULL,
  pattern_name TEXT NOT NULL,
  archetype_ids TEXT[],
  context_conditions JSONB,
  profile_signals JSONB,
  recommended_change TEXT NOT NULL,
  confidence_delta FLOAT,
  supporting_data_count INTEGER DEFAULT 0,
  avg_rating FLOAT,
  success_rate FLOAT,
  is_active BOOLEAN DEFAULT TRUE,
  applied_to_model BOOLEAN DEFAULT FALSE,
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS model_retraining_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_version TEXT NOT NULL,
  training_samples_count INTEGER,
  new_feedback_count INTEGER,
  patterns_applied INTEGER,
  accuracy_before FLOAT,
  accuracy_after FLOAT,
  improvement_delta FLOAT,
  changes_summary JSONB,
  trained_at TIMESTAMPTZ DEFAULT NOW(),
  training_duration_seconds INTEGER
);

CREATE INDEX IF NOT EXISTS idx_recommendations_session ON product_recommendations(session_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_user ON product_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_archetype ON product_recommendations(archetype_id);
CREATE INDEX IF NOT EXISTS idx_feedback_recommendation ON outcome_feedback(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON outcome_feedback(overall_rating);
CREATE INDEX IF NOT EXISTS idx_feedback_submitted ON outcome_feedback(submitted_at);
CREATE INDEX IF NOT EXISTS idx_patterns_active ON learning_patterns(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_patterns_type ON learning_patterns(pattern_type);

ALTER TABLE product_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE outcome_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_retraining_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own recommendations" ON product_recommendations;
CREATE POLICY "Users can view own recommendations" ON product_recommendations FOR SELECT USING (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own feedback" ON outcome_feedback;
CREATE POLICY "Users can insert own feedback" ON outcome_feedback FOR INSERT WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own feedback" ON outcome_feedback;
CREATE POLICY "Users can view own feedback" ON outcome_feedback FOR SELECT USING (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "Public can view learning patterns" ON learning_patterns;
CREATE POLICY "Public can view learning patterns" ON learning_patterns FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Public can view retraining log" ON model_retraining_log;
CREATE POLICY "Public can view retraining log" ON model_retraining_log FOR SELECT USING (TRUE);

INSERT INTO schema_migrations (version) VALUES ('20250130000003_add_outcome_learning.sql')
ON CONFLICT (version) DO NOTHING;


-- ═══════════════════════════════════════════════════════════
-- Migration: 20250130000004_add_notifications.sql
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES onboarding_sessions(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  action_label TEXT,
  recommendation_id UUID REFERENCES product_recommendations(id) ON DELETE CASCADE,
  metadata JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  is_dismissed BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  priority TEXT DEFAULT 'normal',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES onboarding_sessions(id) ON DELETE CASCADE,
  recommendation_id UUID REFERENCES product_recommendations(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  notification_id UUID REFERENCES notifications(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_session ON notifications(session_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notification_schedules_pending ON notification_schedules(scheduled_for, status) WHERE status = 'pending';

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "Service can insert notifications" ON notifications;
CREATE POLICY "Service can insert notifications" ON notifications FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Service can manage schedules" ON notification_schedules;
CREATE POLICY "Service can manage schedules" ON notification_schedules USING (TRUE);

CREATE OR REPLACE FUNCTION create_feedback_schedule() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_schedules (user_id, session_id, recommendation_id, notification_type, scheduled_for, status)
  VALUES (NEW.user_id, NEW.session_id, NEW.id, 'feedback_prompt', NOW() + INTERVAL '14 days', 'pending');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_feedback_schedule ON product_recommendations;
CREATE TRIGGER trigger_create_feedback_schedule AFTER INSERT ON product_recommendations FOR EACH ROW EXECUTE FUNCTION create_feedback_schedule();

INSERT INTO schema_migrations (version) VALUES ('20250130000004_add_notifications.sql')
ON CONFLICT (version) DO NOTHING;


-- ═══════════════════════════════════════════════════════════
-- Migration: 20250130000005_add_ai_personalization.sql
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_ai_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES onboarding_sessions(id) ON DELETE CASCADE,
  primary_archetype TEXT NOT NULL,
  archetype_confidence FLOAT,
  secondary_archetype TEXT,
  secondary_confidence FLOAT,
  adjustments JSONB DEFAULT '{}',
  learned_patterns TEXT[] DEFAULT '{}',
  adjustment_confidence TEXT DEFAULT 'low',
  based_on_feedback_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_feedback_at TIMESTAMPTZ,
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS ai_product_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_name TEXT,
  product_category TEXT,
  reason TEXT NOT NULL,
  pattern_match TEXT,
  confidence FLOAT,
  times_recommended INTEGER DEFAULT 0,
  times_accepted INTEGER DEFAULT 0,
  times_rejected INTEGER DEFAULT 0,
  avg_rating FLOAT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_recommended_at TIMESTAMPTZ
);

ALTER TABLE product_recommendations ADD COLUMN IF NOT EXISTS personalization JSONB DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_user_adjustments_user ON user_ai_adjustments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_adjustments_archetype ON user_ai_adjustments(primary_archetype);
CREATE INDEX IF NOT EXISTS idx_ai_exceptions_user ON ai_product_exceptions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_exceptions_product ON ai_product_exceptions(product_id);
CREATE INDEX IF NOT EXISTS idx_ai_exceptions_active ON ai_product_exceptions(is_active) WHERE is_active = TRUE;

ALTER TABLE user_ai_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_product_exceptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own adjustments" ON user_ai_adjustments;
CREATE POLICY "Users can view own adjustments" ON user_ai_adjustments FOR SELECT USING (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "System can manage adjustments" ON user_ai_adjustments;
CREATE POLICY "System can manage adjustments" ON user_ai_adjustments FOR ALL USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Users can view own exceptions" ON ai_product_exceptions;
CREATE POLICY "Users can view own exceptions" ON ai_product_exceptions FOR SELECT USING (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "System can manage exceptions" ON ai_product_exceptions;
CREATE POLICY "System can manage exceptions" ON ai_product_exceptions FOR ALL USING (TRUE) WITH CHECK (TRUE);

CREATE OR REPLACE FUNCTION update_user_ai_adjustments() RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_ai_adjustments
  SET updated_at = NOW(), last_feedback_at = NEW.submitted_at, based_on_feedback_count = based_on_feedback_count + 1
  WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_adjustments ON outcome_feedback;
CREATE TRIGGER trigger_update_user_adjustments AFTER INSERT ON outcome_feedback FOR EACH ROW EXECUTE FUNCTION update_user_ai_adjustments();

INSERT INTO schema_migrations (version) VALUES ('20250130000005_add_ai_personalization.sql')
ON CONFLICT (version) DO NOTHING;


-- ═══════════════════════════════════════════════════════════
-- Migration: fix_anonymous_sessions_rls.sql
-- ═══════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can view own sessions" ON onboarding_sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON onboarding_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON onboarding_sessions;
DROP POLICY IF EXISTS "Users can view own answers" ON onboarding_answers;
DROP POLICY IF EXISTS "Users can insert own answers" ON onboarding_answers;
DROP POLICY IF EXISTS "Users can update own answers" ON onboarding_answers;

CREATE POLICY "Users can view own sessions" ON onboarding_sessions FOR SELECT USING (user_id IS NULL OR (auth.uid() IS NOT NULL AND auth.uid() = user_id));
CREATE POLICY "Users can insert own sessions" ON onboarding_sessions FOR INSERT WITH CHECK (user_id IS NULL OR (auth.uid() IS NOT NULL AND auth.uid() = user_id));
CREATE POLICY "Users can update own sessions" ON onboarding_sessions FOR UPDATE USING (user_id IS NULL OR (auth.uid() IS NOT NULL AND auth.uid() = user_id));
CREATE POLICY "Users can view own answers" ON onboarding_answers FOR SELECT USING (EXISTS (SELECT 1 FROM onboarding_sessions WHERE onboarding_sessions.id = session_id AND (onboarding_sessions.user_id IS NULL OR (auth.uid() IS NOT NULL AND auth.uid() = onboarding_sessions.user_id))));
CREATE POLICY "Users can insert own answers" ON onboarding_answers FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM onboarding_sessions WHERE onboarding_sessions.id = session_id AND (onboarding_sessions.user_id IS NULL OR (auth.uid() IS NOT NULL AND auth.uid() = onboarding_sessions.user_id))));
CREATE POLICY "Users can update own answers" ON onboarding_answers FOR UPDATE USING (EXISTS (SELECT 1 FROM onboarding_sessions WHERE onboarding_sessions.id = session_id AND (onboarding_sessions.user_id IS NULL OR (auth.uid() IS NOT NULL AND auth.uid() = onboarding_sessions.user_id))));

INSERT INTO schema_migrations (version) VALUES ('fix_anonymous_sessions_rls.sql')
ON CONFLICT (version) DO NOTHING;


-- ═══════════════════════════════════════════════════════════
-- MIGRATION COMPLETE
-- ═══════════════════════════════════════════════════════════

-- All 5 pending migrations have been applied!
-- The AI Personalization layer is now ready to use.
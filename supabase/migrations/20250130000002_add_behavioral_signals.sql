-- Add behavioral signals tracking to onboarding_answers table
-- This allows us to track HOW users answer questions, not just WHAT they answer

-- Add columns for behavioral tracking
ALTER TABLE onboarding_answers
ADD COLUMN IF NOT EXISTS time_to_answer INTEGER, -- milliseconds
ADD COLUMN IF NOT EXISTS time_on_question INTEGER, -- milliseconds
ADD COLUMN IF NOT EXISTS hovered_tooltip BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS tooltip_hover_duration INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS answer_changes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS mouse_movements INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS pause_before_answer BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS immediate_edit BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS options_selected INTEGER,
ADD COLUMN IF NOT EXISTS selection_order JSONB;

-- Add columns for behavior analysis results
ALTER TABLE onboarding_answers
ADD COLUMN IF NOT EXISTS behavior_confidence TEXT, -- 'high', 'medium', 'low'
ADD COLUMN IF NOT EXISTS user_state TEXT, -- 'confident', 'thoughtful', 'confused', 'uncertain'
ADD COLUMN IF NOT EXISTS needs_follow_up BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS needs_simplification BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS needs_education BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS engagement_level TEXT, -- 'high', 'medium', 'low'
ADD COLUMN IF NOT EXISTS inferred_complexity TEXT; -- 'simple', 'moderate', 'complex'

-- Create index on behavioral flags for analytics queries
CREATE INDEX IF NOT EXISTS idx_onboarding_answers_behavior_confidence
ON onboarding_answers(behavior_confidence);

CREATE INDEX IF NOT EXISTS idx_onboarding_answers_user_state
ON onboarding_answers(user_state);

CREATE INDEX IF NOT EXISTS idx_onboarding_answers_needs_follow_up
ON onboarding_answers(needs_follow_up) WHERE needs_follow_up = TRUE;

-- Add comment
COMMENT ON COLUMN onboarding_answers.time_to_answer IS 'Time in milliseconds from question shown to answer submitted';
COMMENT ON COLUMN onboarding_answers.behavior_confidence IS 'AI-analyzed confidence level based on user behavior';
COMMENT ON COLUMN onboarding_answers.user_state IS 'AI-inferred mental state: confident, thoughtful, confused, uncertain';
COMMENT ON COLUMN onboarding_answers.needs_follow_up IS 'AI flag: user showed signs of uncertainty, should ask follow-up question';
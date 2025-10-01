-- In-App Notification System
-- For feedback prompts and other important notifications

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES onboarding_sessions(id) ON DELETE CASCADE,

  -- Notification details
  type TEXT NOT NULL, -- 'feedback_prompt', 'update', 'achievement', 'insight'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT, -- Where to navigate when clicked
  action_label TEXT, -- Button text (e.g., "Give Feedback")

  -- Related data
  recommendation_id UUID REFERENCES product_recommendations(id) ON DELETE CASCADE,
  metadata JSONB, -- Additional context

  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  is_dismissed BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,

  -- Priority
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high'
  expires_at TIMESTAMPTZ, -- Auto-dismiss after this date

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification schedule (for timing feedback prompts)
CREATE TABLE IF NOT EXISTS notification_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES onboarding_sessions(id) ON DELETE CASCADE,
  recommendation_id UUID REFERENCES product_recommendations(id) ON DELETE CASCADE,

  -- Schedule details
  notification_type TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  notification_id UUID REFERENCES notifications(id) ON DELETE SET NULL,

  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'cancelled'

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_session ON notifications(session_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notification_schedules_pending ON notification_schedules(scheduled_for, status) WHERE status = 'pending';

-- RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_schedules ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id IS NULL OR user_id = auth.uid());

-- Users can update their own notifications (mark as read/dismissed)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (user_id IS NULL OR user_id = auth.uid());

-- Service can insert notifications
CREATE POLICY "Service can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (TRUE);

-- Only service can view/manage schedules
CREATE POLICY "Service can manage schedules"
  ON notification_schedules
  USING (TRUE);

-- Function to auto-create feedback notification schedule
CREATE OR REPLACE FUNCTION create_feedback_schedule()
RETURNS TRIGGER AS $$
BEGIN
  -- Schedule feedback prompt for 2 weeks after recommendation
  INSERT INTO notification_schedules (
    user_id,
    session_id,
    recommendation_id,
    notification_type,
    scheduled_for,
    status
  ) VALUES (
    NEW.user_id,
    NEW.session_id,
    NEW.id,
    'feedback_prompt',
    NOW() + INTERVAL '14 days',
    'pending'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-schedule feedback
CREATE TRIGGER trigger_create_feedback_schedule
  AFTER INSERT ON product_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION create_feedback_schedule();

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE notifications
  SET is_read = TRUE,
      read_at = NOW(),
      updated_at = NOW()
  WHERE id = notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to dismiss notification
CREATE OR REPLACE FUNCTION dismiss_notification(notification_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE notifications
  SET is_dismissed = TRUE,
      dismissed_at = NOW(),
      updated_at = NOW()
  WHERE id = notification_id;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE notifications IS 'In-app notifications for users';
COMMENT ON TABLE notification_schedules IS 'Scheduled notifications (e.g., feedback prompts)';
COMMENT ON COLUMN notifications.type IS 'feedback_prompt, update, achievement, insight';
COMMENT ON COLUMN notifications.priority IS 'low, normal, high - affects display order';
COMMENT ON COLUMN notifications.expires_at IS 'Auto-dismiss notification after this date';
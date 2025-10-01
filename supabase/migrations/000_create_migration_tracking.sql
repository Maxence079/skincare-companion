-- Migration tracking table
-- This table keeps track of which migrations have been applied
CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE schema_migrations ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage migrations
CREATE POLICY "Service role can manage migrations"
  ON schema_migrations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
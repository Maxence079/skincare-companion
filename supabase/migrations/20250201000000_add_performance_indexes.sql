-- Performance Optimization: Add Critical Indexes
-- This migration adds indexes to improve query performance at scale

-- ==================================================================
-- USER PROFILES TABLE INDEXES
-- ==================================================================

-- Covering index for active user profiles (most common query pattern)
-- CONCURRENTLY prevents table locking during index creation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_user_active_created
  ON user_profiles(user_id, created_at DESC)
  WHERE is_active = TRUE;

-- GIN index for JSONB skin_concerns array (enables fast array containment queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_skin_concerns_gin
  ON user_profiles USING GIN (skin_concerns);

-- GIN index for JSONB product_preferences (enables fast JSONB queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_product_prefs_gin
  ON user_profiles USING GIN (product_preferences);

-- GIN index for JSONB lifestyle_factors (analytics queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_lifestyle_gin
  ON user_profiles USING GIN (lifestyle_factors);

-- Partial index for high-confidence profiles (analytics/reporting)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_high_confidence
  ON user_profiles(archetype_id, created_at DESC)
  WHERE (confidence_scores->>'overall')::numeric > 0.8;

-- Index for profile lookup by archetype (grouping/analytics)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_archetype
  ON user_profiles(archetype_id, created_at DESC)
  WHERE archetype_id IS NOT NULL;

-- ==================================================================
-- ONBOARDING SESSIONS TABLE INDEXES
-- ==================================================================

-- Composite index for session lookup (most common pattern)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_token_status
  ON onboarding_sessions(session_token, session_status);

-- Index for finding active sessions by user
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_user_status_created
  ON onboarding_sessions(user_id, session_status, created_at DESC)
  WHERE user_id IS NOT NULL;

-- Partial index for abandoned session cleanup (background jobs)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_abandoned
  ON onboarding_sessions(created_at)
  WHERE session_status = 'abandoned';

-- Partial index for active sessions (monitoring)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_active_created
  ON onboarding_sessions(created_at DESC)
  WHERE session_status = 'active';

-- GIN index for message search (if needed for debugging/support)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_messages_gin
  ON onboarding_sessions USING GIN (messages);

-- ==================================================================
-- PHOTO UPLOADS TABLE INDEXES (if exists)
-- ==================================================================

-- Composite index for user's photos (timeline view)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_photo_uploads_user_created
  ON photo_uploads(user_id, upload_timestamp DESC)
  WHERE user_id IS NOT NULL;

-- Index for photo status filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_photo_uploads_status
  ON photo_uploads(upload_status, upload_timestamp DESC);

-- ==================================================================
-- QUERY PERFORMANCE HINTS
-- ==================================================================

-- Analyze tables to update statistics after index creation
ANALYZE user_profiles;
ANALYZE onboarding_sessions;
ANALYZE photo_uploads;

-- ==================================================================
-- COMMENTS FOR DOCUMENTATION
-- ==================================================================

COMMENT ON INDEX idx_user_profiles_user_active_created IS
  'Covering index for fetching active user profiles. Used in dashboard queries.';

COMMENT ON INDEX idx_user_profiles_skin_concerns_gin IS
  'GIN index for fast array containment queries on skin_concerns. Used in product recommendations.';

COMMENT ON INDEX idx_sessions_token_status IS
  'Primary lookup index for session retrieval by token. Critical for API performance.';

COMMENT ON INDEX idx_sessions_abandoned IS
  'Partial index for abandoned session cleanup jobs. Reduces table scan overhead.';

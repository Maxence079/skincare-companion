/**
 * Profile Service
 * Handles saving and retrieving user profiles from Supabase
 * Now with caching, proper logging, and singleton client
 */

import { GeneratedProfile } from '@/lib/ai-onboarding/profile-generator';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { cacheAside, CacheKeys, CacheTTL, deleteCached } from '@/lib/cache/redis';
import { logQuery, logError, logEvent } from '@/lib/logging/logger';
import { captureError } from '@/lib/monitoring/sentry-helpers';

export interface SaveProfileOptions {
  userId?: string; // Optional: for authenticated users
  sessionId?: string; // Link to onboarding session
  conversationMessages: Array<{ role: string; content: string }>;
  conversationMetadata?: {
    message_count: number;
    duration_minutes: number;
    quality_score: number;
  };
}

/**
 * Save generated profile to database
 */
export async function saveProfileToDatabase(
  profile: GeneratedProfile,
  options: SaveProfileOptions
): Promise<{ success: boolean; profileId?: string; error?: string }> {
  const startTime = Date.now();

  try {
    logEvent('profile_save_started', {
      userId: options.userId,
      sessionId: options.sessionId,
      skinType: profile.skin_type,
    });

    const profileData = {
      user_id: options.userId || null,
      session_id: options.sessionId || null,

      // Skin analysis
      skin_type: profile.skin_type,
      skin_concerns: profile.skin_concerns,
      sensitivity_level: profile.sensitivity_level,
      oil_production: profile.oil_production,
      hydration_level: profile.hydration_level,
      pore_size: profile.pore_size,
      texture_issues: profile.texture_issues,

      // Environmental
      climate_zone: profile.climate_zone,
      sun_exposure: profile.sun_exposure,

      // Lifestyle & routine (as JSONB)
      lifestyle_factors: profile.lifestyle_factors,
      current_routine: profile.current_routine,
      product_preferences: profile.product_preferences,

      // AI-generated insights
      archetype_id: profile.archetype_id,
      archetype_confidence: profile.archetype_confidence,
      profile_summary: profile.profile_summary,
      key_recommendations: profile.key_recommendations,

      // Conversation data (as JSONB)
      conversation_messages: options.conversationMessages,
      conversation_metadata: options.conversationMetadata,

      // Confidence scores (as JSONB)
      confidence_scores: profile.confidence_scores,

      // Machine-readable vector (reserved for future ML)
      profile_vector: null,
    };

    const { data, error }: any = await supabaseAdmin
      .from('user_profiles')
      .insert([profileData] as any)
      .select('id')
      .single();

    const duration = Date.now() - startTime;
    // logQuery('insert', 'user_profiles', duration, { profileId: data?.id });

    if (error) {
      logError(error.message, {
        context: 'profile_save',
        userId: options.userId,
        sessionId: options.sessionId,
      });

      captureError(new Error(error.message), {
        tags: { operation: 'profile_save' },
        extra: { userId: options.userId, sessionId: options.sessionId },
      });

      return {
        success: false,
        error: error.message,
      };
    }

    // Invalidate user profile cache
    if (options.userId) {
      await deleteCached(CacheKeys.userProfiles(options.userId));
    }

    logEvent('profile_saved', {
      profileId: data?.id,
      userId: options.userId,
      duration,
    });

    return {
      success: true,
      profileId: data?.id,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;

    logError(error, {
      context: 'profile_save_unexpected',
      userId: options.userId,
      duration,
    });

    captureError(error, {
      tags: { operation: 'profile_save', severity: 'high' },
      extra: { userId: options.userId },
    });

    return {
      success: false,
      error: error.message || 'Unknown error occurred',
    };
  }
}

/**
 * Retrieve user profile by ID (with caching)
 */
export async function getProfileById(profileId: string) {
  return cacheAside(
    CacheKeys.profile(profileId),
    async () => {
      const startTime = Date.now();

      const { data, error }: any = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      const duration = Date.now() - startTime;
      // logQuery('select', 'user_profiles', duration, { profileId });

      if (error) {
        logError(error.message, {
          context: 'profile_fetch',
          profileId,
        });
        return null;
      }

      return data;
    },
    CacheTTL.profile
  );
}

/**
 * Get all profiles for a user (with caching)
 */
export async function getUserProfiles(userId: string) {
  return cacheAside(
    CacheKeys.userProfiles(userId),
    async () => {
      const startTime = Date.now();

      const { data, error }: any = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      const duration = Date.now() - startTime;
      // logQuery('select', 'user_profiles', duration, { userId, count: data?.length });

      if (error) {
        logError(error.message, {
          context: 'user_profiles_fetch',
          userId,
        });
        return [];
      }

      return data || [];
    },
    CacheTTL.userProfiles
  );
}

/**
 * Get the most recent profile for a user (with caching)
 */
export async function getLatestUserProfile(userId: string) {
  return cacheAside(
    `${CacheKeys.userProfiles(userId)}:latest`,
    async () => {
      const startTime = Date.now();

      const { data, error }: any = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const duration = Date.now() - startTime;
      // logQuery('select', 'user_profiles', duration, { userId, operation: 'latest' });

      if (error) {
        logError(error.message, {
          context: 'latest_profile_fetch',
          userId,
        });
        return null;
      }

      return data;
    },
    CacheTTL.userProfiles
  );
}

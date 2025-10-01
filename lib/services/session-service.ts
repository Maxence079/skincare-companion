/**
 * Session Service
 * Handles conversation session persistence and resume functionality
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface SessionData {
  id: string;
  session_token: string;
  session_status: 'active' | 'completed' | 'abandoned';
  messages: ConversationMessage[];
  current_phase: number;
  geolocation?: any;
  enriched_context?: any;
  suggested_examples?: string[];
  conversation_signals?: any;
  message_count: number;
  estimated_completion: number;
  last_activity_at: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

/**
 * Generate a unique session token
 */
export function generateSessionToken(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`;
}

/**
 * Create a new onboarding session
 */
export async function createSession(data: {
  userId?: string;
  geolocation?: any;
  enrichedContext?: any;
}): Promise<{ success: boolean; session?: SessionData; error?: string }> {
  try {
    const sessionToken = generateSessionToken();

    const { data: session, error } = await supabase
      .from('onboarding_sessions')
      .insert([
        {
          user_id: data.userId || null,
          session_token: sessionToken,
          session_status: 'active',
          messages: [],
          current_phase: 0,
          geolocation: data.geolocation || null,
          enriched_context: data.enrichedContext || null,
          message_count: 0,
          estimated_completion: 0.0,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('[Session Service] Create error:', error);
      return { success: false, error: error.message };
    }

    console.log('[Session Service] Session created:', session.id);
    return { success: true, session };
  } catch (error: any) {
    console.error('[Session Service] Create exception:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get session by token
 */
export async function getSession(
  sessionToken: string
): Promise<{ success: boolean; session?: SessionData; error?: string }> {
  try {
    const { data: session, error } = await supabase
      .from('onboarding_sessions')
      .select('*')
      .eq('session_token', sessionToken)
      .eq('session_status', 'active')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return { success: false, error: 'Session not found or expired' };
      }
      console.error('[Session Service] Get error:', error);
      return { success: false, error: error.message };
    }

    // Check if session expired
    const expiresAt = new Date(session.expires_at);
    if (expiresAt < new Date()) {
      await markSessionAbandoned(sessionToken);
      return { success: false, error: 'Session expired' };
    }

    return { success: true, session };
  } catch (error: any) {
    console.error('[Session Service] Get exception:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update session with new message
 */
export async function updateSession(
  sessionToken: string,
  updates: {
    messages?: ConversationMessage[];
    currentPhase?: number;
    suggestedExamples?: string[];
    conversationSignals?: any;
    estimatedCompletion?: number;
  }
): Promise<{ success: boolean; session?: SessionData; error?: string }> {
  try {
    const updateData: any = {};

    if (updates.messages) {
      updateData.messages = updates.messages;
      updateData.message_count = updates.messages.length;
    }

    if (updates.currentPhase !== undefined) {
      updateData.current_phase = updates.currentPhase;
    }

    if (updates.suggestedExamples) {
      updateData.suggested_examples = updates.suggestedExamples;
    }

    if (updates.conversationSignals) {
      updateData.conversation_signals = updates.conversationSignals;
    }

    if (updates.estimatedCompletion !== undefined) {
      updateData.estimated_completion = updates.estimatedCompletion;
    }

    // Extend expiry by 48 hours on activity
    updateData.expires_at = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    const { data: session, error } = await supabase
      .from('onboarding_sessions')
      .update(updateData)
      .eq('session_token', sessionToken)
      .select()
      .single();

    if (error) {
      console.error('[Session Service] Update error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, session };
  } catch (error: any) {
    console.error('[Session Service] Update exception:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Mark session as completed
 */
export async function completeSession(
  sessionToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('onboarding_sessions')
      .update({
        session_status: 'completed',
        completed_at: new Date().toISOString(),
        estimated_completion: 1.0,
      })
      .eq('session_token', sessionToken);

    if (error) {
      console.error('[Session Service] Complete error:', error);
      return { success: false, error: error.message };
    }

    console.log('[Session Service] Session completed:', sessionToken);
    return { success: true };
  } catch (error: any) {
    console.error('[Session Service] Complete exception:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Mark session as abandoned
 */
export async function markSessionAbandoned(
  sessionToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('onboarding_sessions')
      .update({
        session_status: 'abandoned',
      })
      .eq('session_token', sessionToken);

    if (error) {
      console.error('[Session Service] Abandon error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('[Session Service] Abandon exception:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get user's recent sessions
 */
export async function getUserSessions(
  userId: string
): Promise<{ success: boolean; sessions?: SessionData[]; error?: string }> {
  try {
    const { data: sessions, error } = await supabase
      .from('onboarding_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('[Session Service] Get user sessions error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, sessions: sessions || [] };
  } catch (error: any) {
    console.error('[Session Service] Get user sessions exception:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Calculate estimated completion based on conversation state
 */
export function calculateEstimatedCompletion(
  messageCount: number,
  phase: number,
  hasProfile: boolean
): number {
  if (hasProfile) return 1.0;

  // Base completion on phase (0-3)
  const phaseCompletion = phase / 4; // 0, 0.25, 0.5, 0.75

  // Add message-based progress within phase
  const messagesInPhase = messageCount % 3; // Assume ~3 messages per phase
  const messageProgress = (messagesInPhase / 3) * 0.25;

  return Math.min(phaseCompletion + messageProgress, 0.95); // Cap at 95% until profile ready
}

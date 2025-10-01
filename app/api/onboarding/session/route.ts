/**
 * Onboarding Session Management API
 * Handles create, save, resume, and delete operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * POST - Create or resume a session
 */
export async function POST(request: NextRequest) {
  try {
    const { resumeSessionId } = await request.json();
    const supabase = createAdminClient(); // Use admin client to bypass RLS

    // Resume existing session
    if (resumeSessionId) {
      const { data: session, error } = await supabase
        .from('onboarding_sessions')
        .select(`
          *,
          answers:onboarding_answers(*)
        `)
        .eq('id', resumeSessionId)
        .single();

      if (error) throw error;

      if (!session) {
        return NextResponse.json(
          { error: 'Session not found or expired' },
          { status: 404 }
        );
      }

      // Type assertion for session
      const typedSession = session as any;

      // Check if already complete
      if (typedSession.is_complete) {
        return NextResponse.json({
          session_id: typedSession.id,
          is_complete: true,
          final_archetype: typedSession.final_archetype,
          message: 'This session is already complete'
        });
      }

      // Return session state with sorted answers
      const sortedAnswers = (typedSession.answers || [])
        .sort((a: any, b: any) => a.answer_order - b.answer_order);

      return NextResponse.json({
        session_id: typedSession.id,
        is_complete: false,
        current_question_id: typedSession.current_question_id,
        answers: sortedAnswers.map((a: any) => ({
          questionId: a.question_id,
          answerId: a.answer_value
        })),
        confidence: parseFloat(typedSession.confidence || '0'),
        questions_answered: typedSession.questions_answered,
        estimated_remaining: typedSession.estimated_remaining,
        top_archetypes: typedSession.top_archetypes,
        started_at: typedSession.started_at,
        resumed: true
      });
    }

    // Create new session
    const { data: newSession, error: createError } = await (supabase
      .from('onboarding_sessions')
      .insert({
        user_id: null, // Allow anonymous sessions
        questions_answered: 0,
        is_complete: false,
        confidence: 0
      } as any)
      .select()
      .single() as any);

    if (createError) throw createError;

    return NextResponse.json({
      session_id: newSession.id,
      is_complete: false,
      answers: [],
      confidence: 0,
      questions_answered: 0,
      created: true
    });

  } catch (error) {
    console.error('[Session API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to manage session', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET - Check for existing incomplete sessions for current user
 */
export async function GET(request: NextRequest) {
  try {
    // For now, skip session resume for anonymous users
    // TODO: Implement session resume when auth is added
    return NextResponse.json({ has_incomplete: false });
  } catch (error) {
    console.error('[Session GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to check sessions' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a session (user wants to start over)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { sessionId } = await request.json();
    const supabase = createAdminClient(); // Use admin client to bypass RLS

    const { error } = await supabase
      .from('onboarding_sessions')
      .delete()
      .eq('id', sessionId);

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[Session DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}
/**
 * Fully AI-Driven Onboarding API
 * Uses conversation orchestrator and profile generator
 * No fixed archetypes - generates unique profiles for each user
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { anthropic, createCachedMessage, calculateCost, logAPICall } from '@/lib/ai-classification/claude-config';
import { MULTI_EXPERT_FRAMEWORK } from '@/lib/ai-classification/expert-guidelines';
import { enrichUserContextServer } from '@/lib/services/environment-enrichment';
import { generateProfileFromConversation, calculateConversationQuality } from '@/lib/ai-onboarding/profile-generator';
import { saveProfileToDatabase } from '@/lib/services/profile-service';
import {
  createSession,
  getSession,
  updateSession,
  completeSession,
  calculateEstimatedCompletion,
  type ConversationMessage
} from '@/lib/services/session-service';
import { extractConversationMemory, buildContextString } from '@/lib/ai-onboarding/conversation-memory';
import { generateAdaptiveGuidance, buildAdaptiveGuidanceString } from '@/lib/ai-onboarding/adaptive-questioning';

// Core instructions (CACHED - most stable, ~800 tokens)
const ORCHESTRATOR_CORE = `${MULTI_EXPERT_FRAMEWORK}

You are an expert dermatological consultant creating a comprehensive "skin passport" through authentic conversation.

YOUR EXPERTISE: You have deep knowledge of skin physiology, dermatology, and cosmetic chemistry. Use this to provide professional insights, pattern recognition, and education during the conversation.

CONVERSATIONAL APPROACH:
- Warm and approachable, like a trusted skincare expert
- Show genuine empathy for their skin journey and frustrations
- Validate experiences while providing professional context
- Share insights and connections they might not see themselves
- Build trust through demonstrable expertise
- Natural, flowing conversation - not interrogation

GOAL: Create their complete skin profile through intelligent dialogue that educates and builds understanding.

WHAT YOU CAN DO:
✓ Provide dermatological insights ("That oily T-zone with dry cheeks suggests dehydrated skin compensating with oil")
✓ Recognize patterns ("Sensitivity to retinol + flaking indicates compromised barrier - very common!")
✓ Educate about skin behavior ("AC environments strip humidity, which explains worsening dryness")
✓ Connect dots between symptoms ("The stinging from sunscreen + dry patches point to barrier dysfunction")
✓ Infer beyond literal statements (read between the lines based on expertise)
✓ Build confidence through professional assessment
✓ Share "why" behind skin behaviors

MEDICAL BOUNDARIES (CRITICAL):
✗ NO medical diagnosis ("You have rosacea/eczema")
✗ NO prescription recommendations ("You need tretinoin")
✗ NO medical advice ("See a dermatologist for this condition")
→ If concerns seem medical, acknowledge and suggest professional consultation gently

DATA TO GATHER:
CRITICAL: Skin type, oil/hydration patterns, sensitivity triggers, main frustrations
IMPORTANT: Texture, pore size, current routine, past experiences, lifestyle, environment
VALUABLE: Product reactions, seasonal changes, hormonal patterns, stress impacts

CONVERSATION INTELLIGENCE:
- Multi-level probing: Surface question → Deeper follow-up based on answer
- Pattern recognition: "You mentioned X and Y - that combination typically indicates..."
- Professional insights woven naturally: "That's classic barrier dysfunction behavior"
- Cross-reference: "Earlier you said X, and now Y - this suggests..."
- Confidence building: Show you understand their skin deeply

PHASES:
1. DISCOVERY - Build rapport, understand main frustrations, establish expertise
2. ANALYSIS - Probe deeper, recognize patterns, provide insights, educate
3. SYNTHESIS - Connect dots, validate understanding, fill gaps
4. COMPLETION - Comprehensive understanding ready for professional profile

OUTPUT STYLE:
- 2-4 sentences with genuine insight
- Acknowledge + Insight + Question pattern when appropriate
- Professional yet warm language
- Show expertise through understanding, not jargon
- Make them feel heard AND understood at expert level`;


// Suggestion format instructions (CACHED - stable, ~400 tokens)
const SUGGESTION_FORMAT = `
CRITICAL: Provide 3 helpful response examples after EVERY question in this format:
[SUGGESTIONS]
- First suggestion: Short, straightforward answer
- Second suggestion: More detailed, specific answer
- Third suggestion: Personal/contextual answer
[/SUGGESTIONS]

Suggestion Guidelines:
- Make them sound like real people talking naturally
- Match the depth and specificity of your question
- Show different ways someone might express the same information
- Help users understand what level of detail is helpful
- Use conversational language, not clinical terms
- Vary the tone: factual, descriptive, emotional/personal`;

// Example suggestions library (CACHED - static reference, ~500 tokens)
const SUGGESTION_EXAMPLES = `
EXAMPLE SUGGESTION SETS (use as inspiration for natural, varied responses):

Q: "What frustrates you most about your skin right now?"
[SUGGESTIONS]
- My skin gets super oily during the day
- I keep getting breakouts no matter what I try, especially around my period
- My skin looks dull and tired, and I have some dark spots from old acne
[/SUGGESTIONS]

Q: "Tell me about your current skincare routine"
[SUGGESTIONS]
- Just a cleanser and moisturizer morning and night
- I do a full routine with vitamin C, retinol, and sunscreen daily
- Honestly? Pretty inconsistent - I wash my face when I remember
[/SUGGESTIONS]

Q: "How does your skin typically react to new products?"
[SUGGESTIONS]
- Pretty resilient - I can usually try new things
- It gets red and stings if there's fragrance or alcohol
- Hard to tell - sometimes I break out, sometimes it's fine, takes a few days to know
[/SUGGESTIONS]

Q: "Does your skin feel different in different seasons?"
[SUGGESTIONS]
- Definitely drier and tighter in winter
- More oily and breaks out more in summer heat
- Pretty consistent year-round actually
[/SUGGESTIONS]

PROFILE COMPLETION: When you have comprehensive understanding to create a professional dermatological assessment (skin type with confidence, concern patterns, behavioral triggers, lifestyle impacts), end your message with: PROFILE_READY

Note: Focus on deep understanding and insights during conversation. The profile will synthesize this into their "skin passport."`;

// Database-backed session storage (replaced in-memory Map)

// OPTIMIZATION 3: Response caching for identical/similar questions
const responseCache = new Map<string, { response: string, timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function getCachedResponse(userMessage: string): string | null {
  const normalizedMessage = userMessage.toLowerCase().trim();
  const cached = responseCache.get(normalizedMessage);

  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    console.log('[Response Cache] HIT - Reusing cached response');
    return cached.response;
  }

  return null;
}

function cacheResponse(userMessage: string, response: string): void {
  const normalizedMessage = userMessage.toLowerCase().trim();
  responseCache.set(normalizedMessage, {
    response,
    timestamp: Date.now()
  });

  // Clean old cache entries periodically
  if (responseCache.size > 1000) {
    const now = Date.now();
    for (const [key, value] of responseCache.entries()) {
      if (now - value.timestamp > CACHE_TTL) {
        responseCache.delete(key);
      }
    }
  }
}

// Session ID generation moved to session-service.ts

// CONTEXTUAL SUGGESTION GENERATION
// Analyzes conversation history to provide intelligent, contextual suggestions
function generateContextualSuggestions(messages: ConversationMessage[], currentQuestion: string): string[] {
  const userMessages = messages.filter(m => m.role === 'user');
  const allContent = userMessages.map(m => m.content.toLowerCase()).join(' ');
  const messageCount = messages.length;
  const questionLower = currentQuestion.toLowerCase();

  // Extract what we know about the user so far
  const hasOily = allContent.includes('oily') || allContent.includes('shiny') || allContent.includes('greasy');
  const hasDry = allContent.includes('dry') || allContent.includes('tight') || allContent.includes('flaky');
  const hasSensitive = allContent.includes('sensitive') || allContent.includes('irritat') || allContent.includes('react');
  const hasAcne = allContent.includes('acne') || allContent.includes('breakout') || allContent.includes('pimple');
  const hasAging = allContent.includes('wrinkle') || allContent.includes('fine line') || allContent.includes('aging');

  // Detect question type from current AI question
  const isAboutRoutine = questionLower.includes('routine') || questionLower.includes('products') || questionLower.includes('use');
  const isAboutConcerns = questionLower.includes('concern') || questionLower.includes('frustrat') || questionLower.includes('problem');
  const isAboutSkinType = questionLower.includes('skin') && (questionLower.includes('feel') || questionLower.includes('type') || questionLower.includes('describe'));
  const isAboutReactions = questionLower.includes('react') || questionLower.includes('sensitive') || questionLower.includes('irritat');
  const isAboutLifestyle = questionLower.includes('lifestyle') || questionLower.includes('stress') || questionLower.includes('sleep') || questionLower.includes('diet');
  const isAboutPreferences = questionLower.includes('prefer') || questionLower.includes('like') || questionLower.includes('avoid');

  // Early conversation (1-3 messages) - General concerns
  if (messageCount <= 3) {
    if (isAboutConcerns) {
      return [
        "My skin gets oily during the day and I have breakouts",
        "I'm dealing with dryness and some fine lines",
        "My skin is sensitive and reacts easily to products"
      ];
    }
    // Default early suggestions
    return [
      "Combination skin with an oily T-zone",
      "Dry patches especially in winter",
      "Normal skin but some occasional breakouts"
    ];
  }

  // Mid conversation (4-6 messages) - Build on what we know
  if (messageCount <= 6) {
    if (isAboutRoutine) {
      // Tailor routine suggestions based on their skin concerns
      if (hasOily && hasAcne) {
        return [
          "Gentle foaming cleanser twice a day, BHA treatment, oil-free moisturizer",
          "Salicylic acid cleanser and a lightweight gel moisturizer",
          "Pretty minimal - just cleanser and sometimes a spot treatment"
        ];
      }
      if (hasDry || hasAging) {
        return [
          "Cream cleanser, hyaluronic acid serum, rich moisturizer with SPF in morning",
          "Oil cleanser at night, retinol 2-3x per week, hydrating cream",
          "Just a gentle cleanser and moisturizer, keeping it simple"
        ];
      }
      if (hasSensitive) {
        return [
          "Fragrance-free gentle cleanser and a ceramide moisturizer",
          "Minimal routine - micellar water and a soothing cream",
          "I'm still figuring it out, keeping things very basic"
        ];
      }
    }

    if (isAboutReactions) {
      if (hasOily || hasAcne) {
        return [
          "Pretty resilient - can handle most actives without issues",
          "Sometimes get irritation from strong retinoids or high % acids",
          "Fragrance and alcohol make me break out more"
        ];
      }
      if (hasSensitive || hasDry) {
        return [
          "Gets red and stings with fragrances or essential oils",
          "Very reactive - even 'gentle' products can cause issues",
          "Takes time to adjust to new products, but usually okay"
        ];
      }
    }

    if (isAboutLifestyle) {
      return [
        "Pretty stressful work schedule, try to sleep 7 hours, regular exercise",
        "Moderate stress, decent sleep, mostly balanced diet",
        "High stress lately, inconsistent sleep, could improve my water intake"
      ];
    }

    // Generic mid-conversation fallback
    return [
      "Yes, definitely - I've noticed that pattern",
      "Sometimes, but it's not always consistent",
      "Not really, that hasn't been a major issue for me"
    ];
  }

  // Later conversation (7+ messages) - Specific preferences and details
  if (isAboutPreferences) {
    if (hasOily) {
      return [
        "Lightweight gels and serums, nothing too heavy or greasy",
        "Mattifying products, oil-control, fragrance-free if possible",
        "I like trying new ingredients but prefer affordable options"
      ];
    }
    if (hasDry || hasAging) {
      return [
        "Rich creams and hydrating serums, love anything with hyaluronic acid",
        "Anti-aging focused, willing to invest in retinol and peptides",
        "Natural oils and butters work well for me"
      ];
    }
  }

  // Budget/investment questions
  if (questionLower.includes('budget') || questionLower.includes('spend') || questionLower.includes('invest')) {
    return [
      "$50-100/month for core products, willing to splurge on key items",
      "Looking for affordable options, drugstore brands are great",
      "Ready to invest more if the products really work"
    ];
  }

  // Goals/expectations
  if (questionLower.includes('goal') || questionLower.includes('hope') || questionLower.includes('improve')) {
    if (hasAcne) {
      return [
        "Clear skin with minimal breakouts and reduced scarring",
        "Control the oil and prevent future breakouts",
        "Even skin tone and less post-acne marks"
      ];
    }
    if (hasAging || hasDry) {
      return [
        "Reduce fine lines and maintain hydrated, plump skin",
        "Prevent further aging and brighten my complexion",
        "Just healthier, more radiant-looking skin overall"
      ];
    }
  }

  // Generic late-conversation fallback (detailed, specific)
  return [
    "Yes, that sounds exactly right based on what I've described",
    "Mostly, though there are some exceptions depending on the season",
    "That's helpful context - I'd like to explore options that address that"
  ];
}

// OPTIMIZATION 2: Conversation compression for long sessions
// Reduces token count by summarizing old messages
function compressConversationHistory(messages: any[], maxMessages: number = 10): any[] {
  if (messages.length <= maxMessages) {
    return messages; // No compression needed
  }

  // Keep first message (important context) + last N messages
  const firstMessage = messages[0];
  const recentMessages = messages.slice(-maxMessages + 1);

  // Create summary of middle messages
  const middleMessages = messages.slice(1, -maxMessages + 1);
  const userMessages = middleMessages.filter(m => m.role === 'user');

  if (userMessages.length === 0) {
    return [firstMessage, ...recentMessages];
  }

  // Extract key points from compressed messages
  const keyPoints = userMessages.map(m => {
    const content = m.content;
    // Extract first sentence or up to 50 chars
    return content.split('.')[0].substring(0, 50);
  }).join('; ');

  // Create compressed summary message
  const summaryMessage = {
    role: 'assistant',
    content: `[Previous conversation summary: User mentioned: ${keyPoints}]`
  };

  console.log(`[Conversation Compression] Reduced ${messages.length} messages to ${recentMessages.length + 2} (saved ~${middleMessages.length * 100} tokens)`);

  return [firstMessage, summaryMessage, ...recentMessages];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, message, sessionId, geolocation } = body;

    // Extract headers for environment enrichment
    const userAgent = request.headers.get('user-agent') || undefined;
    const timezone = request.headers.get('x-timezone') || undefined;

    if (action === 'start') {
      // Start new conversation with database-backed session
      console.log('[API] Starting new session...');

      // Enrich with environmental context if geolocation provided
      let enrichedContext = null;
      if (geolocation?.latitude && geolocation?.longitude) {
        enrichedContext = await enrichUserContextServer(
          geolocation.latitude,
          geolocation.longitude,
          timezone,
          userAgent
        );
      }

      // Create session in database
      const result = await createSession({
        userId: undefined, // TODO: Add user auth
        geolocation,
        enrichedContext
      });

      if (!result.success || !result.session) {
        console.error('[API] Failed to create session:', result.error);
        return NextResponse.json(
          {
            error: "I'm having trouble starting our conversation. Please refresh the page and try again.",
            shouldRetry: true,
            technical: result.error
          },
          { status: 500 }
        );
      }

      const welcomeMessage = "Hi! I'm your skincare consultant. I'm here to create your personalized skin profile - a professional assessment that goes beyond surface symptoms to truly understand your skin. Let's start with what's frustrating you most about your skin right now?";

      console.log('[API] Session created:', result.session.session_token);

      return NextResponse.json({
        sessionId: result.session.session_token,
        message: welcomeMessage,
        isDone: false,
        environmentCollected: !!enrichedContext,
        estimatedCompletion: 0
      });
    }

    if (action === 'message') {
      // Get session from database
      const sessionResult = await getSession(sessionId);

      if (!sessionResult.success || !sessionResult.session) {
        console.error('[API] Invalid session:', sessionResult.error);

        // User-friendly session error messages
        let userMessage = "I couldn't find your conversation. Please start a new session.";
        if (sessionResult.error?.includes('expired')) {
          userMessage = "Your session has expired. Don't worry - let's start fresh and I'll help you create your profile!";
        } else if (sessionResult.error?.includes('not found')) {
          userMessage = "I couldn't find your conversation. Let's start a new one!";
        }

        return NextResponse.json(
          {
            error: userMessage,
            shouldRestart: true,
            technical: sessionResult.error
          },
          { status: 400 }
        );
      }

      const session = sessionResult.session;
      const messages = [...(session.messages as ConversationMessage[])];

      // Add user message to history
      messages.push({
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      });

      // Call Claude with ULTRA-AGGRESSIVE optimizations
      try {
        const startTime = Date.now();

        // OPTIMIZATION 3: Check response cache first (100% savings if hit!)
        const cachedResponse = getCachedResponse(message);
        let assistantMessage: string;
        let apiResponse: any = null;

        if (cachedResponse) {
          // Cache HIT - Zero AI cost!
          assistantMessage = cachedResponse;
          console.log('[Ultra Optimization] Response served from cache - $0.00 cost');
        } else {
          // Cache MISS - Call AI with optimizations

          // OPTIMIZATION 1: Multi-layer cache with separate concerns
          // Layer 1: Core instructions (most stable) - CACHED
          // Layer 2: Suggestion format (stable) - CACHED
          // Layer 3: Example library (static) - CACHED
          // Result: 3x cache layers = maximum cache hit rate

          // OPTIMIZATION 2: Compress conversation history if too long
          const compressedMessages = compressConversationHistory(messages);

          // Extract conversation memory for context awareness
          const conversationMemory = extractConversationMemory(messages);
          const memoryContext = buildContextString(conversationMemory);

          // Generate adaptive questioning guidance
          const adaptiveGuidance = generateAdaptiveGuidance(messages);
          const adaptiveContext = buildAdaptiveGuidanceString(adaptiveGuidance);

          // Combine dynamic contexts
          const fullDynamicContext = [memoryContext, adaptiveContext]
            .filter(ctx => ctx.trim().length > 0)
            .join('\n\n---\n\n');

          // Strip timestamps from messages before sending to Claude (API doesn't accept extra fields)
          const claudeMessages = compressedMessages.map(({ role, content }) => ({ role, content }));

          apiResponse = await createCachedMessage({
            systemPrompt: ORCHESTRATOR_CORE,        // CACHED Layer 1: ~800 tokens
            staticContext: SUGGESTION_FORMAT + '\n\n' + SUGGESTION_EXAMPLES,  // CACHED Layer 2+3: ~900 tokens
            dynamicContext: fullDynamicContext,     // Memory + Adaptive guidance for natural, personalized responses
            messages: claudeMessages,               // OPTIMIZED: Compressed if >10 messages, timestamps stripped
            maxTokens: 1024,
            temperature: 0.7
          });

          assistantMessage = apiResponse.content[0].type === 'text'
            ? apiResponse.content[0].text
            : 'I had trouble processing that. Could you rephrase?';

          // Cache the response for future identical questions
          cacheResponse(message, assistantMessage);
        }

        const latencyMs = Date.now() - startTime;

        // Track costs and cache performance
        if (apiResponse) {
          const usage = apiResponse.usage as any;
          const cost = calculateCost({
            input_tokens: usage.input_tokens,
            output_tokens: usage.output_tokens,
            cache_creation_input_tokens: usage.cache_creation_input_tokens || 0,
            cache_read_input_tokens: usage.cache_read_input_tokens || 0
          });

          logAPICall({
            endpoint: '/api/ai/fully-driven',
            sessionId: sessionId,
            promptVersion: 'orchestrator-v2-ultra',
            usage: apiResponse.usage,
            cost: cost.totalCost,
            latencyMs,
            success: true
          });
        }

        // Check if profile is ready
        const isDone = assistantMessage.includes('PROFILE_READY');

        // Extract suggestions from AI response
        let suggestions: string[] = [];
        let cleanMessage = assistantMessage;

        const suggestionsMatch = assistantMessage.match(/\[SUGGESTIONS\]([\s\S]*?)\[\/SUGGESTIONS\]/);
        if (suggestionsMatch) {
          const suggestionsText = suggestionsMatch[1];
          suggestions = suggestionsText
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.startsWith('-'))
            .map(line => line.substring(1).trim())
            .filter(Boolean);

          // Remove suggestions from display message
          cleanMessage = assistantMessage.replace(/\[SUGGESTIONS\][\s\S]*?\[\/SUGGESTIONS\]/, '').trim();
        }

        // Validate suggestion quality and provide contextual fallbacks
        if (suggestions.length === 0 || suggestions.some(s => s.length < 10)) {
          console.warn('[Fully-Driven API] AI did not provide quality suggestions, generating contextual fallbacks');

          // Generate truly contextual suggestions based on conversation history
          suggestions = generateContextualSuggestions(messages, cleanMessage);
        }

        // Log suggestion quality for monitoring
        console.log('[Fully-Driven API] Suggestions provided:', {
          count: suggestions.length,
          avgLength: Math.round(suggestions.reduce((sum, s) => sum + s.length, 0) / suggestions.length),
          source: suggestionsMatch ? 'AI-generated' : 'fallback'
        });

        // Add assistant message to history (with timestamp)
        messages.push({
          role: 'assistant',
          content: cleanMessage.replace('PROFILE_READY', '').trim(),
          timestamp: new Date().toISOString()
        });

        // Calculate current phase based on message count
        // Phase progression: 0-2 msgs = phase 0, 3-5 = phase 1, 6-8 = phase 2, 9+ = phase 3
        const currentPhase = Math.min(Math.floor(messages.length / 3), 3);

        // Calculate estimated completion
        const estimatedCompletion = calculateEstimatedCompletion(messages.length, currentPhase, isDone);

        // Update session in database
        const updateResult = await updateSession(sessionId, {
          messages,
          currentPhase,
          suggestedExamples: suggestions.length > 0 ? suggestions : undefined,
          estimatedCompletion
        });

        if (!updateResult.success) {
          console.error('[API] Failed to update session:', updateResult.error);
          // Continue anyway - don't fail the request
        }

        // If conversation is complete, generate profile
        let generatedProfile = null;
        let profileId = null;
        if (isDone) {
          try {
            console.log('[Fully-Driven API] Generating profile from conversation...');

            generatedProfile = await generateProfileFromConversation(
              messages,
              session.enriched_context
            );

            // Add conversation metadata
            const qualityScore = calculateConversationQuality(messages);
            const sessionStart = new Date(session.created_at);
            const duration = Math.round((Date.now() - sessionStart.getTime()) / 60000); // minutes

            const conversationMetadata = {
              message_count: messages.length,
              duration_minutes: duration,
              quality_score: qualityScore
            };

            generatedProfile.conversation_metadata = conversationMetadata;

            console.log('[Fully-Driven API] Profile generated successfully:', {
              skin_type: generatedProfile.skin_type,
              concerns: generatedProfile.skin_concerns,
              confidence: generatedProfile.confidence_scores.overall
            });

            // Save profile to database
            const saveResult = await saveProfileToDatabase(generatedProfile, {
              userId: undefined, // TODO: Add user authentication
              sessionId: sessionId,
              conversationMessages: messages,
              conversationMetadata: conversationMetadata
            });

            if (saveResult.success) {
              profileId = saveResult.profileId;
              console.log('[Fully-Driven API] Profile saved to database:', profileId);
            } else {
              console.error('[Fully-Driven API] Failed to save profile:', saveResult.error);
              // Continue anyway - profile is still returned to frontend
            }

            // Mark session as completed in database
            const completeResult = await completeSession(sessionId);
            if (!completeResult.success) {
              console.error('[API] Failed to mark session as completed:', completeResult.error);
            }

          } catch (profileError: any) {
            console.error('[Fully-Driven API] Profile generation failed:', profileError);
            // Don't fail the whole request - just return without profile
            // User can still see the conversation ended
          }
        }

        return NextResponse.json({
          message: cleanMessage.replace('PROFILE_READY', '').trim(),
          suggestions: suggestions.length > 0 ? suggestions : null,
          isDone,
          profile: generatedProfile,
          profileId: profileId,
          estimatedCompletion: estimatedCompletion,
          currentPhase: currentPhase
        });

      } catch (claudeError: any) {
        console.error('[Claude API Error]', claudeError);

        // Provide user-friendly error messages based on error type
        let userMessage = "I'm having trouble processing that. Could you try again?";
        let shouldRetry = true;

        if (claudeError.status === 429) {
          // Rate limit
          userMessage = "I'm getting a lot of requests right now. Please wait a moment and try again.";
          shouldRetry = true;
        } else if (claudeError.status >= 500) {
          // Server error
          userMessage = "I'm experiencing a temporary issue on my end. Your progress is saved - please try again in a moment.";
          shouldRetry = true;
        } else if (claudeError.message?.includes('timeout')) {
          // Timeout
          userMessage = "That took longer than expected. Your progress is saved - let's try that again.";
          shouldRetry = true;
        } else if (claudeError.status === 400) {
          // Bad request - shouldn't happen but handle gracefully
          userMessage = "I didn't quite understand that. Could you rephrase your response?";
          shouldRetry = false;
        }

        return NextResponse.json(
          {
            error: userMessage,
            shouldRetry: shouldRetry,
            technical: claudeError.message // For debugging
          },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Invalid request. Please refresh the page and start again.',
        shouldRestart: true
      },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('[Fully-Driven API] Unexpected Error:', error);
    return NextResponse.json(
      {
        error: "Something unexpected happened. Your progress is saved - please try again.",
        shouldRetry: true,
        technical: error.message
      },
      { status: 500 }
    );
  }
}

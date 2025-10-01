/**
 * AI Profile Generator
 * Generates comprehensive skin profiles from conversation history
 * Uses Claude to analyze conversation and extract structured profile data
 */

import { anthropic, createCachedMessage } from '@/lib/ai-classification/claude-config';
import { MULTI_EXPERT_FRAMEWORK } from '@/lib/ai-classification/expert-guidelines';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface GeneratedProfile {
  // Core profile data
  skin_type: 'oily' | 'dry' | 'combination' | 'normal' | 'sensitive' | 'unknown';
  skin_concerns: string[];
  sensitivity_level: 'low' | 'medium' | 'high';

  // Detailed characteristics
  oil_production: 'low' | 'moderate' | 'high' | 'very_high';
  hydration_level: 'dehydrated' | 'normal' | 'well_hydrated';
  pore_size: 'small' | 'medium' | 'large';
  texture_issues: string[];

  // Environmental & lifestyle
  climate_zone?: 'humid' | 'dry' | 'temperate' | 'cold';
  sun_exposure?: 'low' | 'moderate' | 'high';
  lifestyle_factors: {
    stress_level?: 'low' | 'moderate' | 'high';
    sleep_quality?: 'poor' | 'fair' | 'good';
    diet_quality?: 'poor' | 'fair' | 'good';
    exercise_frequency?: 'none' | 'occasional' | 'regular' | 'frequent';
  };

  // Routine analysis
  current_routine: {
    morning?: string[];
    evening?: string[];
    frequency: 'inconsistent' | 'regular' | 'very_consistent';
  };

  product_preferences: {
    textures_preferred?: string[];
    textures_disliked?: string[];
    ingredients_loved?: string[];
    ingredients_avoid?: string[];
  };

  // Summary & recommendations
  profile_summary: string;
  key_recommendations: string[];

  // Optional archetype
  archetype_id?: string;
  archetype_confidence?: number;

  // Metadata
  confidence_scores: {
    overall: number;
    skin_type: number;
    concerns: number;
    routine: number;
  };

  // Conversation metadata (added by API)
  conversation_metadata?: {
    message_count: number;
    duration_minutes: number;
    quality_score: number;
  };
}

const PROFILE_GENERATOR_PROMPT = `${MULTI_EXPERT_FRAMEWORK}

You are an expert dermatological analyst creating a professional "skin passport" - a comprehensive clinical assessment that provides DEEP INSIGHTS beyond what the customer explicitly stated.

YOUR TASK: Transform the conversation into a world-class dermatological profile with professional pattern recognition and analysis.

CRITICAL ANALYSIS APPROACH (GO DEEP - DON'T JUST REPEAT):

1. PATTERN RECOGNITION
   - Identify dermatological syndromes ("oily T-zone + dry cheeks + sensitivity" = barrier dysfunction with reactive seborrhea)
   - Connect seemingly unrelated symptoms
   - Recognize classic presentations

2. ROOT CAUSE ANALYSIS
   - Don't just list "dry skin" - identify WHY (barrier dysfunction? dehydration? lipid deficiency?)
   - Find underlying mechanisms, not surface symptoms
   - Understand cascading effects

3. BEHAVIORAL SYNTHESIS
   - How does their skin actually BEHAVE (not just descriptions)
   - Compensatory mechanisms (skin overproducing oil due to dehydration)
   - Trigger patterns (AC → dehydration → flaking)

4. PROFESSIONAL INFERENCE
   - Read between the lines using dermatological knowledge
   - Infer what they might not realize themselves
   - Connect environment/lifestyle to skin behavior

5. INSIGHT GENERATION
   - Provide NEW understanding they didn't have
   - Professional assessment beyond their self-description
   - "Your skin shows X pattern, which typically indicates Y"

OUTPUT FORMAT:
You MUST respond with ONLY valid JSON matching this exact structure:

{
  "skin_type": "oily" | "dry" | "combination" | "normal" | "sensitive" | "unknown",
  "skin_concerns": ["concern1", "concern2", ...],
  "sensitivity_level": "low" | "medium" | "high",

  "oil_production": "low" | "moderate" | "high" | "very_high",
  "hydration_level": "dehydrated" | "normal" | "well_hydrated",
  "pore_size": "small" | "medium" | "large",
  "texture_issues": ["issue1", "issue2", ...],

  "climate_zone": "humid" | "dry" | "temperate" | "cold" | null,
  "sun_exposure": "low" | "moderate" | "high" | null,
  "lifestyle_factors": {
    "stress_level": "low" | "moderate" | "high" | null,
    "sleep_quality": "poor" | "fair" | "good" | null,
    "diet_quality": "poor" | "fair" | "good" | null,
    "exercise_frequency": "none" | "occasional" | "regular" | "frequent" | null
  },

  "current_routine": {
    "morning": ["product1", "product2", ...] | null,
    "evening": ["product1", "product2", ...] | null,
    "frequency": "inconsistent" | "regular" | "very_consistent"
  },

  "product_preferences": {
    "textures_preferred": ["texture1", ...] | null,
    "textures_disliked": ["texture1", ...] | null,
    "ingredients_loved": ["ingredient1", ...] | null,
    "ingredients_avoid": ["ingredient1", ...] | null
  },

  "profile_summary": "2-3 sentence natural language summary of their skin",
  "key_recommendations": [
    "Specific actionable recommendation 1",
    "Specific actionable recommendation 2",
    "Specific actionable recommendation 3"
  ],

  "archetype_id": "ocean_pearl" | "desert_rose" | "forest_moss" | null,
  "archetype_confidence": 0.0 to 1.0 | null,

  "confidence_scores": {
    "overall": 0.0 to 1.0,
    "skin_type": 0.0 to 1.0,
    "concerns": 0.0 to 1.0,
    "routine": 0.0 to 1.0
  }
}

CONFIDENCE SCORING GUIDELINES:
- Overall: How confident are you in the complete profile (0.0-1.0)
- Skin Type: How certain about their skin type classification
- Concerns: How well you understand their main skin issues
- Routine: How clear their current skincare routine is

Score conservatively:
- 0.9-1.0: Extremely confident, explicit detailed information
- 0.7-0.9: Very confident, clear signals and descriptions
- 0.5-0.7: Moderately confident, some inference required
- 0.3-0.5: Low confidence, minimal information
- 0.0-0.3: Very uncertain, mostly guessing

PROFILE SUMMARY QUALITY (CRITICAL - THIS IS WHAT THEY SEE):
- Write like a professional dermatological assessment
- Include INSIGHTS and ANALYSIS, not just restatements
- Example: "Your skin exhibits classic barrier dysfunction patterns - the combination of an oily T-zone with dry, sensitive cheeks indicates dehydrated skin attempting to compensate through reactive seborrhea. The sensitivity to retinol and sunscreen ingredients, coupled with texture issues and flaking, confirms a compromised moisture barrier, likely exacerbated by AC exposure."
- NOT: "You have dry sensitive combination skin with an oily T-zone and dry cheeks"
- Explain WHY they're experiencing what they're experiencing
- Show professional understanding of underlying mechanisms
- Make them feel their skin is truly understood at expert level

KEY RECOMMENDATIONS QUALITY:
1. Based on dermatological analysis, not just surface symptoms
2. Include WHY: "Focus on barrier repair first - your sensitivity and texture issues stem from barrier dysfunction"
3. Be specific but professional: "Prioritize humectant-based hydration to address the underlying dehydration driving oil overproduction"
4. Address root causes, not just symptoms
5. Maximum 5 recommendations, ordered by root cause priority

IMPORTANT RULES:
1. GO DEEP - analyze, don't parrot
2. Use professional dermatological knowledge
3. Infer and connect patterns - show expertise
4. Profile summary MUST provide insights beyond what they said
5. Confidence scores reflect analysis depth (0.7-0.9 for good analysis)
6. DO NOT include any text outside the JSON object
7. DO NOT use markdown code blocks - return raw JSON only
8. NO medical diagnosis - but YES to professional cosmetic dermatology assessment

Now analyze the conversation and generate the profile:`;

export async function generateProfileFromConversation(
  messages: ConversationMessage[],
  enrichedContext?: any
): Promise<GeneratedProfile> {
  try {
    // Build dynamic context from enriched environmental data
    const dynamicContext = enrichedContext
      ? `ADDITIONAL CONTEXT (from geolocation):\n${JSON.stringify(enrichedContext, null, 2)}`
      : '';

    // Use cached message for profile generation (caches the large PROFILE_GENERATOR_PROMPT)
    const response = await createCachedMessage({
      systemPrompt: PROFILE_GENERATOR_PROMPT, // Cached - static prompt (~3000 tokens)
      staticContext: '', // No additional static context
      dynamicContext: dynamicContext, // Dynamic geolocation data (not cached)
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      })),
      maxTokens: 2048,
      temperature: 0.3 // Lower temperature for more consistent structured output
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Parse the JSON response
    const rawResponse = content.text.trim();

    // Remove markdown code blocks if present (Claude sometimes adds them despite instructions)
    const cleanedResponse = rawResponse
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const profile: GeneratedProfile = JSON.parse(cleanedResponse);

    // Validate required fields
    if (!profile.skin_type || !profile.skin_concerns || !profile.profile_summary) {
      throw new Error('Invalid profile: missing required fields');
    }

    // Ensure arrays are arrays
    profile.skin_concerns = Array.isArray(profile.skin_concerns) ? profile.skin_concerns : [];
    profile.texture_issues = Array.isArray(profile.texture_issues) ? profile.texture_issues : [];
    profile.key_recommendations = Array.isArray(profile.key_recommendations) ? profile.key_recommendations : [];

    return profile;

  } catch (error: any) {
    console.error('[Profile Generator] Error:', error);

    // If JSON parsing failed, log the raw response for debugging
    if (error instanceof SyntaxError) {
      console.error('[Profile Generator] Failed to parse JSON. Check Claude response format.');
    }

    throw new Error(`Profile generation failed: ${error.message}`);
  }
}

/**
 * Calculate conversation quality score
 * Based on message count, user engagement, and information completeness
 */
/**
 * Calculate conversation quality score
 * Enhanced scoring with multiple quality dimensions
 */
export function calculateConversationQuality(messages: ConversationMessage[]): number {
  const userMessages = messages.filter(m => m.role === 'user');
  const messageCount = userMessages.length;

  if (messageCount === 0) return 0;

  // 1. Message Count Score (0-1) - More messages = better understanding
  const lengthScore = Math.min(messageCount / 10, 1.0); // Optimal: 10+ messages

  // 2. Detail Score (0-1) - Longer, detailed responses = better quality
  const avgLength = userMessages.reduce((sum, m) => sum + m.content.length, 0) / userMessages.length;
  const detailScore = Math.min(avgLength / 80, 1.0); // Optimal: 80+ chars per message

  // 3. Depth Score (0-1) - Look for specific skincare terms and details
  const skincareTerms = [
    'oily', 'dry', 'sensitive', 'acne', 'breakout', 'pores', 'wrinkle', 'fine line',
    'cleanser', 'moisturizer', 'serum', 'retinol', 'vitamin', 'spf', 'sunscreen',
    'morning', 'evening', 'night', 'routine', 'product', 'skin', 'face'
  ];

  const mentionedTerms = new Set<string>();
  userMessages.forEach(msg => {
    const lowerContent = msg.content.toLowerCase();
    skincareTerms.forEach(term => {
      if (lowerContent.includes(term)) {
        mentionedTerms.add(term);
      }
    });
  });
  const depthScore = Math.min(mentionedTerms.size / 10, 1.0); // Optimal: 10+ unique terms

  // 4. Consistency Score (0-1) - Messages evenly distributed = engaged user
  const minLength = Math.min(...userMessages.map(m => m.content.length));
  const maxLength = Math.max(...userMessages.map(m => m.content.length));
  const consistencyScore = minLength > 10 ? (1 - ((maxLength - minLength) / maxLength)) * 0.5 + 0.5 : 0.5;

  // Weighted combination
  const qualityScore =
    (lengthScore * 0.35) +     // 35% - Number of exchanges
    (detailScore * 0.30) +      // 30% - Response detail
    (depthScore * 0.25) +       // 25% - Domain knowledge depth
    (consistencyScore * 0.10);  // 10% - Engagement consistency

  return Math.round(qualityScore * 100) / 100; // Round to 2 decimals
}

/**
 * Calculate confidence score for profile generation
 * More sophisticated than simple conversation quality
 */
export function calculateProfileConfidence(
  messages: ConversationMessage[],
  conversationQuality: number
): {
  overall: number;
  skin_type: number;
  concerns: number;
  routine: number;
  lifestyle: number;
} {
  const userMessages = messages.filter(m => m.role === 'user');
  const allContent = userMessages.map(m => m.content.toLowerCase()).join(' ');

  // Skin Type Confidence - based on specific descriptors
  const skinTypeTerms = ['oily', 'dry', 'combination', 'normal', 'sensitive', 't-zone', 'shiny', 'tight', 'flaky'];
  const skinTypeScore = Math.min(
    skinTypeTerms.filter(term => allContent.includes(term)).length / 3,
    1.0
  );

  // Concerns Confidence - based on problem descriptions
  const concernTerms = ['acne', 'breakout', 'wrinkle', 'fine line', 'dark spot', 'pore', 'redness', 'irritation', 'dull'];
  const concernsScore = Math.min(
    concernTerms.filter(term => allContent.includes(term)).length / 3,
    1.0
  );

  // Routine Confidence - based on product mentions
  const routineTerms = ['cleanser', 'moisturizer', 'serum', 'toner', 'spf', 'sunscreen', 'retinol', 'vitamin', 'morning', 'evening'];
  const routineScore = Math.min(
    routineTerms.filter(term => allContent.includes(term)).length / 4,
    1.0
  );

  // Lifestyle Confidence - based on context mentions
  const lifestyleTerms = ['stress', 'sleep', 'diet', 'exercise', 'water', 'work', 'outdoor', 'climate'];
  const lifestyleScore = Math.min(
    lifestyleTerms.filter(term => allContent.includes(term)).length / 3,
    1.0
  );

  // Overall confidence combines conversation quality with specific topic coverage
  const topicCoverage = (skinTypeScore + concernsScore + routineScore + lifestyleScore) / 4;
  const overall = (conversationQuality * 0.4) + (topicCoverage * 0.6);

  return {
    overall: Math.round(overall * 100) / 100,
    skin_type: Math.round(skinTypeScore * 100) / 100,
    concerns: Math.round(concernsScore * 100) / 100,
    routine: Math.round(routineScore * 100) / 100,
    lifestyle: Math.round(lifestyleScore * 100) / 100
  };
}

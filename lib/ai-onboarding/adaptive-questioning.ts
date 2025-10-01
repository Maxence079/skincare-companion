/**
 * Adaptive Question Depth
 * Analyzes user engagement and adjusts questioning style
 */

import { ConversationMessage } from '../services/session-service';

export interface AdaptiveGuidance {
  engagementLevel: 'high' | 'medium' | 'low';
  questioningStyle: string;
  examplePrompts: string[];
  shouldProvideExamples: boolean;
  shouldDiveDeeper: boolean;
}

/**
 * Generate adaptive questioning guidance based on user engagement
 */
export function generateAdaptiveGuidance(messages: ConversationMessage[]): AdaptiveGuidance {
  const userMessages = messages.filter(m => m.role === 'user');

  if (userMessages.length === 0) {
    return {
      engagementLevel: 'medium',
      questioningStyle: 'Start with open-ended questions to gauge engagement',
      examplePrompts: [],
      shouldProvideExamples: true,
      shouldDiveDeeper: false
    };
  }

  // Analyze engagement metrics
  const avgLength = userMessages.reduce((sum, m) => sum + m.content.length, 0) / userMessages.length;
  const avgWords = userMessages.reduce((sum, m) => sum + m.content.split(/\s+/).length, 0) / userMessages.length;
  const hasDetailedResponses = userMessages.filter(m => m.content.split(/\s+/).length > 20).length;
  const hasBriefResponses = userMessages.filter(m => m.content.split(/\s+/).length < 5).length;

  // Determine engagement level
  let engagementLevel: 'high' | 'medium' | 'low';
  if (avgLength > 120 && avgWords > 20 && hasDetailedResponses >= userMessages.length * 0.5) {
    engagementLevel = 'high';
  } else if (avgLength < 40 || avgWords < 8 || hasBriefResponses >= userMessages.length * 0.5) {
    engagementLevel = 'low';
  } else {
    engagementLevel = 'medium';
  }

  // Generate guidance based on engagement
  return buildGuidanceForLevel(engagementLevel, userMessages.length);
}

/**
 * Build guidance string for AI based on engagement level
 */
export function buildAdaptiveGuidanceString(guidance: AdaptiveGuidance): string {
  const lines: string[] = [
    'ADAPTIVE QUESTIONING GUIDANCE:',
    '',
    `User Engagement Level: ${guidance.engagementLevel.toUpperCase()}`,
    ''
  ];

  lines.push('Recommended Approach:');
  lines.push(`  ${guidance.questioningStyle}`);
  lines.push('');

  if (guidance.shouldProvideExamples) {
    lines.push('PROVIDE EXAMPLES:');
    lines.push('  - User tends to give brief responses');
    lines.push('  - Include specific examples to help them respond');
    lines.push('  - "For example: oily by midday, dry in winter, combination..."');
    lines.push('');
  }

  if (guidance.shouldDiveDeeper) {
    lines.push('DIVE DEEPER:');
    lines.push('  - User is engaged and provides detail');
    lines.push('  - Ask thoughtful follow-up questions');
    lines.push('  - Explore nuances and patterns they mention');
    lines.push('');
  }

  if (guidance.examplePrompts.length > 0) {
    lines.push('Example Questions for This User:');
    guidance.examplePrompts.forEach(prompt => {
      lines.push(`  - "${prompt}"`);
    });
  }

  return lines.join('\n');
}

/**
 * Build specific guidance for engagement level
 */
function buildGuidanceForLevel(level: 'high' | 'medium' | 'low', messageCount: number): AdaptiveGuidance {
  if (level === 'high') {
    return {
      engagementLevel: 'high',
      questioningStyle: 'User is highly engaged. Dive deep with follow-up questions. Explore nuances and patterns they mention. You can ask 2-3 related questions in sequence.',
      examplePrompts: [
        'That\'s really interesting - can you tell me more about what that feels like?',
        'You mentioned X earlier - how does that connect with what you just shared?',
        'I\'m curious about the timing - does this happen more in certain situations?'
      ],
      shouldProvideExamples: false,
      shouldDiveDeeper: true
    };
  } else if (level === 'medium') {
    return {
      engagementLevel: 'medium',
      questioningStyle: 'User provides moderate detail. Keep questions clear and focused. Gently encourage elaboration when needed, but don\'t overwhelm.',
      examplePrompts: [
        'Could you tell me a bit more about that?',
        'What does that look like for your skin day-to-day?',
        'How long have you noticed this pattern?'
      ],
      shouldProvideExamples: messageCount <= 2, // Provide examples early on
      shouldDiveDeeper: false
    };
  } else {
    // Low engagement
    return {
      engagementLevel: 'low',
      questioningStyle: 'User gives brief responses. Keep questions SIMPLE and SPECIFIC. Ask one thing at a time. Always provide concrete examples to help them respond.',
      examplePrompts: [
        'How does your skin feel by the end of the day? (For example: oily, tight, normal)',
        'Do you use any skincare products right now? (Like cleanser, moisturizer, sunscreen)',
        'What bothers you most about your skin? (For example: breakouts, dryness, oiliness)'
      ],
      shouldProvideExamples: true,
      shouldDiveDeeper: false
    };
  }
}

/**
 * Determine if user needs encouragement to provide more detail
 */
export function needsEncouragement(messages: ConversationMessage[]): boolean {
  const userMessages = messages.filter(m => m.role === 'user');
  if (userMessages.length < 2) return false;

  // Check last 2 responses
  const recentMessages = userMessages.slice(-2);
  const briefCount = recentMessages.filter(m => m.content.split(/\s+/).length < 5).length;

  return briefCount >= 2; // Last 2 responses were brief
}

/**
 * Generate encouraging transition for brief responders
 */
export function generateEncouragingTransition(): string {
  const transitions = [
    'I hear you! To give you the best recommendations, it helps if I understand a bit more.',
    'That\'s helpful - let me ask you about this in a different way.',
    'Thanks for sharing! Here\'s a simpler question that might be easier to answer.',
    'Got it! Let me break this down into something more specific.'
  ];

  return transitions[Math.floor(Math.random() * transitions.length)];
}

/**
 * Conversation Memory & Context Awareness
 * Extracts and maintains key facts from conversation history
 * to enable natural, contextual follow-up questions
 */

import { ConversationMessage } from '../services/session-service';

export interface ConversationFact {
  topic: string;
  statement: string;
  messageIndex: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface ConversationContext {
  facts: ConversationFact[];
  recentTopics: string[];
  userEngagementLevel: 'high' | 'medium' | 'low';
  conversationTone: 'detailed' | 'casual' | 'brief';
}

/**
 * Extract key facts from conversation for AI context
 */
export function extractConversationMemory(messages: ConversationMessage[]): ConversationContext {
  const userMessages = messages.filter(m => m.role === 'user');
  const facts: ConversationFact[] = [];
  const recentTopics: string[] = [];

  // Extract facts from each user message
  userMessages.forEach((msg, index) => {
    const content = msg.content.toLowerCase();
    const extractedFacts = extractFactsFromMessage(content, index);
    facts.push(...extractedFacts);

    // Track recent topics (last 3 messages)
    if (index >= userMessages.length - 3) {
      const topics = identifyTopics(content);
      recentTopics.push(...topics);
    }
  });

  // Analyze user engagement
  const userEngagementLevel = analyzeEngagement(userMessages);
  const conversationTone = analyzeConversationTone(userMessages);

  return {
    facts,
    recentTopics: [...new Set(recentTopics)], // Remove duplicates
    userEngagementLevel,
    conversationTone
  };
}

/**
 * Build context string for AI from conversation memory
 */
export function buildContextString(context: ConversationContext): string {
  if (context.facts.length === 0) {
    return '';
  }

  const lines: string[] = [
    'CONVERSATION MEMORY (Reference naturally):',
    ''
  ];

  // Group facts by topic
  const factsByTopic: Record<string, ConversationFact[]> = {};
  context.facts.forEach(fact => {
    if (!factsByTopic[fact.topic]) {
      factsByTopic[fact.topic] = [];
    }
    factsByTopic[fact.topic].push(fact);
  });

  // Add facts to context
  Object.entries(factsByTopic).forEach(([topic, facts]) => {
    lines.push(`${topic}:`);
    facts.forEach(fact => {
      lines.push(`  - ${fact.statement}`);
    });
    lines.push('');
  });

  // Add engagement guidance
  lines.push('USER ENGAGEMENT:');
  if (context.userEngagementLevel === 'high') {
    lines.push('- User is highly engaged, giving detailed responses');
    lines.push('- Feel free to dive deeper and ask follow-up questions');
  } else if (context.userEngagementLevel === 'medium') {
    lines.push('- User provides moderate detail');
    lines.push('- Gently encourage elaboration when needed');
  } else {
    lines.push('- User tends to give brief responses');
    lines.push('- Keep questions simple and specific');
    lines.push('- Provide examples to help them respond');
  }
  lines.push('');

  // Add recent topics for natural transitions
  if (context.recentTopics.length > 0) {
    lines.push('RECENT TOPICS (for natural transitions):');
    context.recentTopics.forEach(topic => {
      lines.push(`  - ${topic}`);
    });
  }

  return lines.join('\n');
}

/**
 * Extract facts from a single message
 */
function extractFactsFromMessage(content: string, messageIndex: number): ConversationFact[] {
  const facts: ConversationFact[] = [];

  // Skin type facts
  if (content.match(/\b(oily|greasy|shiny)\b/i)) {
    facts.push({
      topic: 'Skin Type',
      statement: 'They mentioned having oily/shiny skin',
      messageIndex,
      confidence: 'high'
    });
  }
  if (content.match(/\b(dry|tight|flaky|dehydrated)\b/i)) {
    facts.push({
      topic: 'Skin Type',
      statement: 'They mentioned experiencing dryness',
      messageIndex,
      confidence: 'high'
    });
  }
  if (content.match(/\b(t-zone|combination)\b/i)) {
    facts.push({
      topic: 'Skin Type',
      statement: 'They have combination skin with oily T-zone',
      messageIndex,
      confidence: 'high'
    });
  }
  if (content.match(/\b(sensitive|reactive|irritate)\b/i)) {
    facts.push({
      topic: 'Skin Type',
      statement: 'They have sensitive/reactive skin',
      messageIndex,
      confidence: 'high'
    });
  }

  // Concern facts
  if (content.match(/\b(acne|breakout|pimple|blemish)\b/i)) {
    facts.push({
      topic: 'Concerns',
      statement: 'They deal with acne/breakouts',
      messageIndex,
      confidence: 'high'
    });
  }
  if (content.match(/\b(wrinkle|fine line|aging)\b/i)) {
    facts.push({
      topic: 'Concerns',
      statement: 'They are concerned about aging/wrinkles',
      messageIndex,
      confidence: 'high'
    });
  }
  if (content.match(/\b(dark spot|hyperpigmentation|uneven tone)\b/i)) {
    facts.push({
      topic: 'Concerns',
      statement: 'They want to address dark spots/uneven tone',
      messageIndex,
      confidence: 'high'
    });
  }
  if (content.match(/\b(pore|enlarged pore|blackhead)\b/i)) {
    facts.push({
      topic: 'Concerns',
      statement: 'They mentioned pore concerns',
      messageIndex,
      confidence: 'high'
    });
  }

  // Timing patterns
  const timingMatch = content.match(/\b(morning|evening|night|midday|afternoon)\b/i);
  if (timingMatch) {
    facts.push({
      topic: 'Patterns',
      statement: `They mentioned skin changes during ${timingMatch[0]}`,
      messageIndex,
      confidence: 'medium'
    });
  }

  // Seasonal patterns
  if (content.match(/\b(winter|summer|spring|fall|season)\b/i)) {
    facts.push({
      topic: 'Patterns',
      statement: 'They mentioned seasonal skin changes',
      messageIndex,
      confidence: 'medium'
    });
  }

  // Product mentions
  if (content.match(/\b(cleanser|wash)\b/i)) {
    facts.push({
      topic: 'Routine',
      statement: 'They use a cleanser',
      messageIndex,
      confidence: 'high'
    });
  }
  if (content.match(/\b(moisturizer|cream|lotion)\b/i)) {
    facts.push({
      topic: 'Routine',
      statement: 'They use a moisturizer',
      messageIndex,
      confidence: 'high'
    });
  }
  if (content.match(/\b(retinol|retinoid)\b/i)) {
    facts.push({
      topic: 'Routine',
      statement: 'They use retinol/retinoids',
      messageIndex,
      confidence: 'high'
    });
  }
  if (content.match(/\b(spf|sunscreen|sun protection)\b/i)) {
    facts.push({
      topic: 'Routine',
      statement: 'They use SPF/sunscreen',
      messageIndex,
      confidence: 'high'
    });
  }
  if (content.match(/\b(vitamin c|ascorbic)\b/i)) {
    facts.push({
      topic: 'Routine',
      statement: 'They use vitamin C',
      messageIndex,
      confidence: 'high'
    });
  }
  if (content.match(/\b(minimal|nothing|no routine)\b/i) && content.match(/\broutine\b/i)) {
    facts.push({
      topic: 'Routine',
      statement: 'They keep their routine minimal or are just starting',
      messageIndex,
      confidence: 'high'
    });
  }

  // Lifestyle facts
  if (content.match(/\b(stress|stressed|anxiety|anxious)\b/i)) {
    facts.push({
      topic: 'Lifestyle',
      statement: 'They experience stress/anxiety',
      messageIndex,
      confidence: 'high'
    });
  }
  if (content.match(/\b(sleep|tired|exhausted)\b/i)) {
    facts.push({
      topic: 'Lifestyle',
      statement: 'They mentioned sleep patterns/tiredness',
      messageIndex,
      confidence: 'medium'
    });
  }
  if (content.match(/\b(exercise|gym|workout|active)\b/i)) {
    facts.push({
      topic: 'Lifestyle',
      statement: 'They exercise regularly',
      messageIndex,
      confidence: 'medium'
    });
  }
  if (content.match(/\b(outdoor|sun|outside)\b/i)) {
    facts.push({
      topic: 'Lifestyle',
      statement: 'They spend time outdoors',
      messageIndex,
      confidence: 'medium'
    });
  }

  // Budget/preference facts
  if (content.match(/\b(budget|afford|cheap|expensive|price)\b/i)) {
    facts.push({
      topic: 'Preferences',
      statement: 'They mentioned budget considerations',
      messageIndex,
      confidence: 'medium'
    });
  }
  if (content.match(/\b(fragrance-free|unscented|no fragrance)\b/i)) {
    facts.push({
      topic: 'Preferences',
      statement: 'They prefer fragrance-free products',
      messageIndex,
      confidence: 'high'
    });
  }

  return facts;
}

/**
 * Identify topics mentioned in a message
 */
function identifyTopics(content: string): string[] {
  const topics: string[] = [];

  if (content.match(/\b(skin type|oily|dry|combination|sensitive)\b/i)) {
    topics.push('skin type');
  }
  if (content.match(/\b(routine|product|cleanser|moisturizer|serum)\b/i)) {
    topics.push('routine');
  }
  if (content.match(/\b(acne|breakout|wrinkle|aging|concern)\b/i)) {
    topics.push('concerns');
  }
  if (content.match(/\b(stress|sleep|exercise|lifestyle)\b/i)) {
    topics.push('lifestyle');
  }
  if (content.match(/\b(goal|want|hope|improve)\b/i)) {
    topics.push('goals');
  }

  return topics;
}

/**
 * Analyze user engagement level
 */
function analyzeEngagement(userMessages: ConversationMessage[]): 'high' | 'medium' | 'low' {
  if (userMessages.length === 0) return 'low';

  const avgLength = userMessages.reduce((sum, m) => sum + m.content.length, 0) / userMessages.length;
  const detailWords = userMessages.filter(m =>
    m.content.split(/\s+/).length > 15
  ).length;

  if (avgLength > 100 || detailWords / userMessages.length > 0.6) {
    return 'high';
  } else if (avgLength > 50 || detailWords / userMessages.length > 0.3) {
    return 'medium';
  } else {
    return 'low';
  }
}

/**
 * Analyze conversation tone
 */
function analyzeConversationTone(userMessages: ConversationMessage[]): 'detailed' | 'casual' | 'brief' {
  if (userMessages.length === 0) return 'brief';

  const avgLength = userMessages.reduce((sum, m) => sum + m.content.length, 0) / userMessages.length;
  const avgWords = userMessages.reduce((sum, m) => sum + m.content.split(/\s+/).length, 0) / userMessages.length;

  if (avgLength > 120 && avgWords > 20) {
    return 'detailed';
  } else if (avgLength > 40 && avgWords > 8) {
    return 'casual';
  } else {
    return 'brief';
  }
}

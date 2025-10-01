/**
 * Claude API Configuration for Production
 * Includes prompt caching, rate limiting, and monitoring
 */

import Anthropic from '@anthropic-ai/sdk';

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

/**
 * Prompt versions - managed in Anthropic Console
 * Update these IDs when you publish new prompt versions
 */
export const PROMPT_VERSIONS = {
  orchestrator: 'v1.0.0',
  profileGenerator: 'v1.0.0',
  productMatcher: 'v1.0.0',
  visualAnalyzer: 'v1.0.0'
};

/**
 * Create message with prompt caching enabled
 * Caches static parts of system prompt to save costs
 */
export async function createCachedMessage(params: {
  systemPrompt: string;
  staticContext?: string;
  dynamicContext: string;
  messages: Anthropic.MessageParam[];
  maxTokens?: number;
  temperature?: number;
}) {
  const {
    systemPrompt,
    staticContext,
    dynamicContext,
    messages,
    maxTokens = 1000,
    temperature = 0.7
  } = params;

  // Build system array with cache control
  const systemArray: Array<Anthropic.Messages.TextBlockParam> = [
    {
      type: "text",
      text: systemPrompt,
      cache_control: { type: "ephemeral" } // Cache the system prompt
    }
  ];

  if (staticContext) {
    systemArray.push({
      type: "text",
      text: staticContext,
      cache_control: { type: "ephemeral" } // Cache static context (question bank, etc.)
    });
  }

  // Dynamic context doesn't get cached (changes every call)
  // Only add if non-empty
  if (dynamicContext && dynamicContext.trim()) {
    systemArray.push({
      type: "text",
      text: dynamicContext
    });
  }

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: maxTokens,
    temperature: temperature,
    system: systemArray,
    messages: messages
  });

  // Log cache performance
  const usage = response.usage;
  if ('cache_creation_input_tokens' in usage || 'cache_read_input_tokens' in usage) {
    console.log('[Claude Cache]', {
      cache_creation: (usage as any).cache_creation_input_tokens || 0,
      cache_read: (usage as any).cache_read_input_tokens || 0,
      regular_input: usage.input_tokens,
      output: usage.output_tokens
    });
  }

  return response;
}

/**
 * Rate limiting configuration
 */
export const RATE_LIMITS = {
  // Anthropic limits (as of 2024)
  requestsPerMinute: 50,
  tokensPerMinute: 100000,
  tokensPerDay: 2000000,

  // Our internal limits (can be lower)
  maxConcurrentRequests: 10,
  maxRequestsPerUser: 50 // per session
};

/**
 * Cost tracking
 */
export function calculateCost(usage: {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}) {
  // Pricing as of Dec 2024
  const PRICING = {
    input: 3 / 1_000_000,        // $3 per 1M tokens
    output: 15 / 1_000_000,      // $15 per 1M tokens
    cache_write: 3.75 / 1_000_000, // $3.75 per 1M tokens
    cache_read: 0.30 / 1_000_000  // $0.30 per 1M tokens (90% savings!)
  };

  const inputCost = usage.input_tokens * PRICING.input;
  const outputCost = usage.output_tokens * PRICING.output;
  const cacheWriteCost = (usage.cache_creation_input_tokens || 0) * PRICING.cache_write;
  const cacheReadCost = (usage.cache_read_input_tokens || 0) * PRICING.cache_read;

  const totalCost = inputCost + outputCost + cacheWriteCost + cacheReadCost;

  return {
    inputCost,
    outputCost,
    cacheWriteCost,
    cacheReadCost,
    totalCost,
    breakdown: {
      input_tokens: usage.input_tokens,
      output_tokens: usage.output_tokens,
      cache_creation_tokens: usage.cache_creation_input_tokens || 0,
      cache_read_tokens: usage.cache_read_input_tokens || 0
    }
  };
}

/**
 * Error handling with retry logic
 */
export async function callClaudeWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: any;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Check if error is retryable
      if (error.status === 429) {
        // Rate limit - wait longer
        console.warn('[Claude] Rate limited, retrying...', { attempt: i + 1 });
        await sleep(delayMs * (i + 1) * 2); // Exponential backoff
        continue;
      }

      if (error.status >= 500) {
        // Server error - retry
        console.warn('[Claude] Server error, retrying...', { attempt: i + 1 });
        await sleep(delayMs * (i + 1));
        continue;
      }

      // Non-retryable error
      throw error;
    }
  }

  throw lastError;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Monitoring - log all API calls for analysis
 */
export function logAPICall(metadata: {
  endpoint: string;
  userId?: string;
  sessionId: string;
  promptVersion: string;
  usage: any;
  cost: number;
  latencyMs: number;
  success: boolean;
  error?: string;
}) {
  // In production, send to analytics service (Mixpanel, Segment, etc.)
  console.log('[Claude API Call]', {
    timestamp: new Date().toISOString(),
    ...metadata
  });

  // Store in database for analysis
  // await db.claude_api_logs.insert(metadata);
}

/**
 * Batch processing for efficiency
 * Process multiple users' requests in parallel
 */
export async function batchProcess<T>(
  items: T[],
  processFn: (item: T) => Promise<any>,
  batchSize = 5
): Promise<any[]> {
  const results = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(item => processFn(item).catch(err => ({ error: err })))
    );
    results.push(...batchResults);
  }

  return results;
}

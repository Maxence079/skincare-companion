# AI Prompt Caching Strategy

## Overview

This document describes our comprehensive prompt caching strategy for Claude AI API calls. Caching reduces costs by up to **90%** on cached content while maintaining the same high-quality AI intelligence.

## How Prompt Caching Works

Anthropic's prompt caching allows you to cache parts of your system prompts that don't change between requests. Cached content is stored for **5 minutes** and can be reused across multiple API calls.

### Cost Breakdown

| Token Type | Cost per 1M Tokens | Savings vs Regular |
|-----------|-------------------|-------------------|
| Regular Input | $3.00 | - |
| Cache Write | $3.75 | +25% (first time) |
| Cache Read | $0.30 | **-90%** (subsequent) |
| Output | $15.00 | - |

**Key Insight:** After the first cache write, every subsequent request within 5 minutes saves 90% on cached tokens.

## Our Caching Architecture

### Core Caching Function

All caching goes through `createCachedMessage()` in `lib/ai-classification/claude-config.ts`:

```typescript
createCachedMessage({
  systemPrompt: string,      // Cached - large static prompts
  staticContext: string,      // Cached - static reference data
  dynamicContext: string,     // NOT cached - changes per request
  messages: MessageParam[],   // NOT cached - conversation history
  maxTokens: number,
  temperature: number
})
```

### What Gets Cached

**✅ ALWAYS Cache:**
- System prompts (MULTI_EXPERT_FRAMEWORK, instructions)
- Static guidelines and rules
- Fixed prompt templates
- Thinking instructions

**❌ NEVER Cache:**
- User-specific data (geolocation, user claims)
- Conversation history
- Dynamic context that changes per request
- Previous analysis results in iterative processes

## Implementation Across the Codebase

### 1. Onboarding Conversational AI

**File:** `app/api/ai/fully-driven/route.ts`

**What's Cached:**
- `ORCHESTRATOR_PROMPT` (~2000 tokens) - Contains MULTI_EXPERT_FRAMEWORK + conversation strategy

**What's NOT Cached:**
- User messages
- Conversation history
- Session-specific data

**Expected Savings:**
- First request: ~$0.0075 (cache write)
- Subsequent requests: ~$0.0006 (cache read)
- **Savings per conversation (5+ messages): ~$0.03** (~83% reduction)

```typescript
const response = await createCachedMessage({
  systemPrompt: ORCHESTRATOR_PROMPT,     // Cached ✅
  staticContext: '',
  dynamicContext: '',                     // Empty - no dynamic context
  messages: conversation.messages,        // NOT cached ❌
  maxTokens: 1024,
  temperature: 0.7
});
```

### 2. Profile Generation

**File:** `lib/ai-onboarding/profile-generator.ts`

**What's Cached:**
- `PROFILE_GENERATOR_PROMPT` (~3000 tokens) - Large structured output instructions

**What's NOT Cached:**
- Enriched environmental context (geolocation data)
- Conversation messages

**Expected Savings:**
- First request: ~$0.011 (cache write)
- Subsequent requests: ~$0.0009 (cache read)
- **Savings per profile: ~$0.01** (~90% reduction on prompt)

```typescript
const response = await createCachedMessage({
  systemPrompt: PROFILE_GENERATOR_PROMPT,  // Cached ✅
  staticContext: '',
  dynamicContext: enrichedContext || '',   // NOT cached ❌ (user-specific)
  messages: conversationMessages,          // NOT cached ❌
  maxTokens: 2048,
  temperature: 0.3
});
```

### 3. Photo Validation (Vision)

**File:** `lib/services/photo-validation.ts`

**What's Cached:**
- `VALIDATION_INSTRUCTIONS` (~500 tokens) - Photo quality checklist + contradiction rules

**What's NOT Cached:**
- User's self-description (skin type, concerns, oil level)
- Image data (images are never cached)

**Expected Savings:**
- First request: ~$0.0019 (cache write)
- Subsequent requests: ~$0.00015 (cache read)
- **Savings per validation: ~$0.0017** (~90% reduction on instructions)

```typescript
const systemArray: Array<Anthropic.Messages.TextBlockParam> = [
  {
    type: "text",
    text: VALIDATION_INSTRUCTIONS,
    cache_control: { type: "ephemeral" }  // Cached ✅
  }
];

// User context sent in message, NOT system
messages: [{
  role: 'user',
  content: [
    { type: 'image', source: { ... } },   // NOT cached ❌
    { type: 'text', text: userContext }   // NOT cached ❌
  ]
}]
```

### 4. Selfie Analysis (Vision)

**File:** `app/api/vision/analyze-selfie/route.ts`

**What's Cached:**
- `systemInstructions` (~700 tokens) - Dermatological analysis criteria

**What's NOT Cached:**
- Image data
- Analysis requests

**Expected Savings:**
- First request: ~$0.0026 (cache write)
- Subsequent requests: ~$0.0002 (cache read)
- **Savings per analysis: ~$0.0024** (~92% reduction)

### 5. Advanced Intelligence Features

**File:** `lib/ai-classification/claude-smart-config.ts`

#### createSmartMessage()
**Cached:** System prompt + thinking instructions
**NOT Cached:** Dynamic context per request
**Use Case:** When you want extended thinking enabled
**Savings:** 85-90% on system prompt + thinking framework

#### multiPassAnalysis()
**Cached:** System prompt + analysis task
**NOT Cached:** Data + previous pass results
**Use Case:** Iterative refinement (2-3 passes)
**Savings:** 90% on prompt across all passes (major benefit!)

#### selfCritique()
**Cached:** Critique system prompt + original prompt
**NOT Cached:** User data + Claude's response
**Use Case:** Quality assurance on critical outputs
**Savings:** 90% on critique instructions

#### ensembleAnalysis()
**Cached:** System prompt + task (shared across 3 models)
**NOT Cached:** Data
**Use Case:** High-stakes decisions requiring consensus
**Savings:** 90% on prompt × 3 calls = massive savings

#### iterativeRefinement()
**Cached:** System prompt
**NOT Cached:** Confidence instructions + conversation history
**Use Case:** Conversational refinement until confidence threshold met
**Savings:** 90% on base prompt across iterations

## Expected Cost Savings

### Daily Usage Estimate (100 users/day)

| Operation | Requests/Day | Cost Without Cache | Cost With Cache | Savings |
|-----------|-------------|-------------------|-----------------|---------|
| Onboarding Conversations | 500 | $3.75 | $0.75 | **$3.00** |
| Profile Generation | 100 | $1.10 | $0.15 | **$0.95** |
| Photo Validation | 200 | $0.38 | $0.06 | **$0.32** |
| Selfie Analysis | 150 | $0.39 | $0.06 | **$0.33** |
| **TOTAL** | 950 | **$5.62** | **$1.02** | **$4.60/day** |

### Monthly Savings

- **Monthly savings: ~$138** (at 100 users/day)
- **Yearly savings: ~$1,660**
- **Cost reduction: 82%**

### Scale Impact (1000 users/day)

- **Daily savings: $46**
- **Monthly savings: $1,380**
- **Yearly savings: $16,600**

## Cache Performance Monitoring

### Logging

All cached API calls log their cache performance:

```typescript
console.log('[Claude Cache]', {
  cache_creation: 2500,  // Tokens written to cache (first call)
  cache_read: 2500,      // Tokens read from cache (subsequent calls)
  regular_input: 150,    // Non-cached input tokens
  output: 450            // Output tokens
});
```

### Cost Tracking

The `logAPICall()` function tracks:
- Total cost per request
- Cache hit/miss ratio
- Latency
- Success rate

```typescript
logAPICall({
  endpoint: '/api/ai/fully-driven',
  sessionId: sessionId,
  promptVersion: 'orchestrator-v1',
  usage: response.usage,
  cost: cost.totalCost,
  latencyMs: latencyMs,
  success: true
});
```

## Best Practices

### ✅ DO:
1. **Cache large static prompts** - Anything >1000 tokens that doesn't change
2. **Cache framework instructions** - MULTI_EXPERT_FRAMEWORK, expert guidelines
3. **Cache in loops** - Multi-pass analysis, ensemble methods
4. **Monitor cache hits** - Check logs to ensure caching is working
5. **Keep cache windows in mind** - 5 minutes, so works best for active sessions

### ❌ DON'T:
1. **Cache user-specific data** - Privacy concern + no reuse benefit
2. **Cache images** - Not supported by API
3. **Cache dynamic conversation history** - Changes every turn
4. **Over-optimize small prompts** - <500 tokens, cache overhead not worth it
5. **Cache outputs** - Only system prompts can be cached, not responses

## Testing Cache Performance

### Manual Testing

1. Make an API request and check logs:
```bash
[Claude Cache] {
  cache_creation: 2000,  // First call - cache write
  cache_read: 0,
  regular_input: 100,
  output: 300
}
```

2. Make another request within 5 minutes:
```bash
[Claude Cache] {
  cache_creation: 0,
  cache_read: 2000,      // Second call - cache hit! ✅
  regular_input: 100,
  output: 300
}
```

### Automated Testing

```typescript
// Test cache behavior
const cost1 = await testAPICall(); // First call
const cost2 = await testAPICall(); // Second call (should be cheaper)

expect(cost2).toBeLessThan(cost1 * 0.2); // 80% savings
```

## Cache Strategy Decision Tree

```
Is the content static across requests?
├─ YES → Cache it!
│   ├─ Is it >500 tokens?
│   │   ├─ YES → Definitely cache
│   │   └─ NO → Cache if used frequently
│   └─ Is it used in loops/iterations?
│       └─ YES → MUST cache (huge savings)
└─ NO → Don't cache
    └─ Put it in dynamicContext or messages
```

## Future Optimizations

### Planned:
1. **Database-backed cache keys** - Track which prompts are most frequently used
2. **A/B testing** - Compare cache vs non-cache performance
3. **Dynamic cache TTL** - Extend caching window for highly stable prompts
4. **Prompt versioning** - Track prompt changes to invalidate cache strategically

### Potential:
1. **Hybrid caching** - Combine prompt caching with application-level response caching
2. **Prewarming** - Pre-cache prompts before peak hours
3. **Smart cache invalidation** - Only invalidate when prompts actually change

## Summary

**Current Status:** ✅ Comprehensive caching implemented across all AI endpoints

**Implementation Coverage:**
- ✅ Onboarding conversational AI
- ✅ Profile generation
- ✅ Photo validation
- ✅ Selfie analysis
- ✅ All smart config intelligence features

**Expected Savings:** 82% cost reduction (~$138/month at current scale)

**Cache Hit Rate Target:** >80% (achievable with 5-minute sessions)

**Next Steps:**
1. Monitor cache performance in production
2. Optimize based on actual usage patterns
3. Scale up with confidence knowing costs are controlled

# Anthropic Console Setup Guide

## 🎯 Why Use Anthropic Console?

1. **Cost Optimization** - Prompt caching saves 90% on input tokens
2. **Version Control** - Track prompt changes over time
3. **A/B Testing** - Test different prompt variations
4. **Monitoring** - Track performance and costs
5. **Collaboration** - Team can review/edit prompts

## 📊 Expected Cost Savings

### Without Optimization:
- Per user onboarding: **$0.15**
- 100K users/month: **$15,000**

### With Prompt Caching:
- Per user onboarding: **$0.02**
- 100K users/month: **$2,000**
- **Savings: $13,000/month (87%)**

---

## 🔧 Step 1: Enable Prompt Caching

Prompt caching is already integrated in `lib/ai-classification/claude-config.ts`.

**What gets cached:**
- System prompts (orchestrator, profile generator, product matcher)
- Question bank (doesn't change per user)
- Static context

**What doesn't get cached:**
- User conversation history
- Dynamic state (progress, extracted signals)
- User-specific data

**Cache duration:** 5 minutes
- If user responds within 5 min → cache hit (90% savings)
- If cache expires → cache miss (full cost, but cache recreated)

---

## 🎨 Step 2: Create Prompts in Console

Go to: https://console.anthropic.com/workbench

### Create These Prompts:

#### 1. **Conversation Orchestrator**
```
Name: skincare-orchestrator
Version: v1.0.0
Model: claude-sonnet-4-5
Tags: production, onboarding

Description: Manages skin analysis conversation, extracts signals,
             determines when enough data is collected

Prompt: [Copy from lib/ai-classification/conversation-orchestrator.ts]
        ORCHESTRATOR_SYSTEM_PROMPT
```

#### 2. **Profile Generator**
```
Name: skincare-profile-generator
Version: v1.0.0
Model: claude-sonnet-4-5
Tags: production, classification

Description: Synthesizes conversation data into unique skin profile
             with no fixed archetypes

Prompt: [Copy from lib/ai-classification/profile-generator.ts]
        PROFILE_GENERATION_PROMPT
```

#### 3. **Product Matcher**
```
Name: skincare-product-matcher
Version: v1.0.0
Model: claude-sonnet-4-5
Tags: production, recommendations

Description: Intelligently matches products from database to
             individual skin profiles

Prompt: [Copy from lib/ai-classification/product-matcher.ts]
        PRODUCT_MATCHING_PROMPT
```

---

## 📈 Step 3: Set Up Monitoring

### In Anthropic Console:

1. **Usage Dashboard**
   - Monitor daily/monthly token usage
   - Track cache hit rates
   - See cost breakdown by endpoint

2. **Prompt Performance**
   - Compare versions (v1.0 vs v1.1)
   - Track output quality metrics
   - Measure latency

### Custom Monitoring:

Add to your analytics:

```typescript
// Track in Mixpanel/Segment/etc.
analytics.track('claude_api_call', {
  endpoint: 'orchestrator',
  prompt_version: 'v1.0.0',
  user_id: userId,
  tokens_used: usage.input_tokens + usage.output_tokens,
  cache_hit: usage.cache_read_input_tokens > 0,
  cost: calculateCost(usage).totalCost,
  latency_ms: latency,
  success: true
});
```

---

## 🚀 Step 4: Optimization Best Practices

### 1. **Prompt Engineering for Caching**

Structure prompts for maximum cache reuse:

```typescript
// ❌ Bad - cache misses frequently
system: `You are analyzing user ${userId} at ${timestamp}...`

// ✅ Good - static prompt cached
system: [
  { text: "You are a skin analysis expert...", cache_control: { type: "ephemeral" } },
  { text: `User: ${userId}, Time: ${timestamp}` } // Only this changes
]
```

### 2. **Batch Similar Requests**

If analyzing multiple photos or processing multiple users:

```typescript
// Process 5 users concurrently (respects rate limits)
const results = await batchProcess(users, async (user) => {
  return await analyzeUser(user);
}, batchSize: 5);
```

### 3. **Monitor Cache Hit Rate**

Aim for 80%+ cache hit rate:

```typescript
const cacheHitRate = cache_read_tokens / (cache_read_tokens + input_tokens);

if (cacheHitRate < 0.8) {
  console.warn('Low cache hit rate - users taking too long to respond');
}
```

### 4. **Set Token Budgets**

Prevent runaway costs:

```typescript
const MAX_TOKENS_PER_USER = 10000;
const MAX_COST_PER_USER = 0.50;

if (userTokensUsed > MAX_TOKENS_PER_USER) {
  return { error: 'Token budget exceeded' };
}
```

---

## 🔍 Step 5: A/B Testing Prompts

Test prompt improvements safely:

### In Console:
1. Create prompt variant: `skincare-orchestrator-v1.1.0`
2. Change: Improved signal extraction logic
3. Test on 10% of traffic

### In Code:
```typescript
const promptVersion = Math.random() < 0.1 ? 'v1.1.0' : 'v1.0.0';

const response = await createCachedMessage({
  systemPrompt: getPrompt('orchestrator', promptVersion),
  // ...
});

logAPICall({
  promptVersion,
  // ... track performance
});
```

### Analysis:
After 1 week, compare:
- Data completeness scores
- User satisfaction
- Cost per user
- Classification accuracy

If v1.1 is better → promote to production

---

## 💰 Cost Breakdown Example

### Typical User Journey:

```
1. Initial greeting: 200 tokens
   - Cache MISS: $0.0006
   - Cache created

2. User response 1: 400 tokens
   - Cache HIT: $0.0001 (90% savings!)

3. User response 2: 400 tokens
   - Cache HIT: $0.0001

4. User response 3: 400 tokens
   - Cache HIT: $0.0001

5. Profile generation: 4000 tokens
   - Cache HIT for system: $0.0003
   - New context: $0.012

6. Routine generation: 6000 tokens
   - Cache HIT: $0.0002
   - Product matching: $0.018

Total: ~$0.032 (vs $0.15 without caching)
```

---

## ⚠️ Rate Limits

### Anthropic Limits (Claude Sonnet 4):
- 50 requests/minute
- 100,000 tokens/minute
- 2,000,000 tokens/day

### Our Limits (configured in claude-config.ts):
- 10 concurrent requests
- 50 requests per user session
- Auto-retry on 429 (rate limit)
- Exponential backoff

### Handling Spikes:
```typescript
// Queue requests during high load
if (currentLoad > RATE_LIMITS.maxConcurrentRequests) {
  await queueRequest(request);
} else {
  await processRequest(request);
}
```

---

## 🔒 Security Best Practices

### 1. **API Key Management**
```bash
# Never commit keys to git
ANTHROPIC_API_KEY=sk-ant-...  # In .env.local only

# Use environment-specific keys
ANTHROPIC_API_KEY_DEV=sk-ant-...
ANTHROPIC_API_KEY_PROD=sk-ant-...
```

### 2. **User Data Protection**
```typescript
// Never log sensitive data
console.log({
  userId: hash(userId), // Hash user IDs
  sessionId: sessionId,
  // Don't log: names, photos, medical info
});
```

### 3. **Rate Limiting per User**
```typescript
// Prevent abuse
const userRequestCount = await redis.get(`user:${userId}:requests`);
if (userRequestCount > 50) {
  return { error: 'Rate limit exceeded' };
}
```

---

## 📊 Monitoring Dashboard

### Metrics to Track:

1. **Usage Metrics**
   - Total API calls/day
   - Cache hit rate
   - Average tokens per user
   - Cost per user

2. **Performance Metrics**
   - Average latency
   - P95/P99 latency
   - Error rate
   - Retry rate

3. **Quality Metrics**
   - Profile confidence scores
   - User satisfaction ratings
   - Classification accuracy
   - Medical flag detection rate

4. **Business Metrics**
   - Cost per acquisition
   - Conversion rate (onboarding completion)
   - Time to complete onboarding
   - Return user rate

---

## 🎯 Success Criteria

Your Claude integration is optimized when:

- ✅ Cache hit rate > 80%
- ✅ Cost per user < $0.05
- ✅ P95 latency < 5 seconds
- ✅ Error rate < 1%
- ✅ User satisfaction > 85%
- ✅ Classification confidence > 80%

---

## 🚀 Next Steps

1. **Enable prompt caching** (already done in code)
2. **Create prompts in Console** (copy from source files)
3. **Set up monitoring dashboard** (analytics + console)
4. **Test with real users** (start with 100 users)
5. **Analyze results** (cost, quality, satisfaction)
6. **Iterate on prompts** (A/B test improvements)
7. **Scale with confidence** (to 100K+ users)

---

## 📚 Resources

- [Anthropic Prompt Caching Docs](https://docs.anthropic.com/claude/docs/prompt-caching)
- [Rate Limits](https://docs.anthropic.com/claude/reference/rate-limits)
- [Best Practices](https://docs.anthropic.com/claude/docs/intro-to-claude)
- [Console Access](https://console.anthropic.com)

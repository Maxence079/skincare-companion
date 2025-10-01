# AI Personalization Layer

## Overview

Hybrid approach that combines:
- **7 Archetypes** (foundation - stable, explainable)
- **AI Learning Layer** (dynamic, personalized)

This gives you the best of both worlds: explainability + personalization.

## Architecture

```
User Profile
├── Foundation: Archetype Classification (1 of 7)
│   ├── desert_rose, ocean_pearl, mountain_sage, etc.
│   ├── Used for initial product matching
│   └── Stable (only changes on re-analysis)
│
└── AI Learning Layer (builds on top)
    ├── Adjustments (learned from feedback)
    │   ├── increase_hydration: 0.15
    │   ├── prefer_gel_texture: true
    │   └── reduce_actives: 0.08
    │
    ├── Learned Patterns
    │   ├── responds_well_to_niacinamide
    │   ├── breakouts_from_coconut_oil
    │   └── prefers_lightweight_gels
    │
    └── AI Product Exceptions
        └── Products outside normal archetype
            (recommended based on similar user patterns)
```

## Database Schema

### Tables Created

1. **`user_ai_adjustments`**
   - Stores per-user AI learning layer
   - Primary archetype (foundation)
   - AI-learned adjustments and patterns
   - Confidence levels based on feedback count

2. **`ai_product_exceptions`**
   - Products AI recommends outside archetype
   - Tracks acceptance/rejection rates
   - Auto-deactivates if rejection rate > 70%

3. **`product_recommendations.personalization`**
   - JSONB column added to existing table
   - Stores personalization data with each recommendation

## API Response Format

### Phase 1: New User (No Feedback Yet)
```json
{
  "archetype": "ocean_pearl",
  "archetype_name": "Ocean Pearl",
  "archetype_confidence": 0.85,
  "explanation": "Combo skin with oily T-zone in humid climate",
  "products": [
    // Products matched via archetype
  ],
  "personalization": null  // No AI adjustments yet
}
```

### Phase 2: After 2-3 Feedback Cycles
```json
{
  "archetype": "ocean_pearl",
  "archetype_confidence": 0.85,
  "explanation": "Ocean Pearl with personalized adjustments",

  "personalization": {
    "adjustments": [
      "Increased hydration (15%)",
      "Prefer gel textures"
    ],
    "confidence": "medium",
    "based_on": "3 feedback cycles"
  },

  "products": [
    // Still archetype-matched, but adjusted
  ]
}
```

### Phase 3: After 5+ Feedback Cycles
```json
{
  "archetype": "ocean_pearl",
  "archetype_confidence": 0.85,

  "personalization": {
    "adjustments": [
      "Increased hydration (20%)",
      "Prefer gel textures",
      "Reduced active ingredients (10%)"
    ],
    "confidence": "high",
    "based_on": "7 feedback cycles",

    "ai_exceptions": [
      {
        "product_id": "xyz",
        "product_name": "Hydrating Serum Plus",
        "reason": "89% of users with your feedback pattern loved this",
        "confidence": 0.89
      }
    ]
  },

  "products": [...],

  "ai_recommendations": [
    {
      "product_id": "xyz",
      "reason": "Not typical for Ocean Pearl, but matches your learned patterns",
      "confidence": 0.89
    }
  ]
}
```

## Usage

### Initialize AI Adjustments (After Onboarding)

```typescript
import { PersonalizationService } from '@/lib/ai-personalization';

// After archetype classification
const adjustments = await PersonalizationService.initializeUserAdjustments(
  userId,
  sessionId,
  'ocean_pearl',  // primary archetype
  0.85,           // confidence
  'mountain_sage', // optional secondary
  0.42            // secondary confidence
);
```

### Get Personalization Layer (For Recommendations)

```typescript
// Include in recommendation API response
const personalization = await PersonalizationService.buildPersonalizationLayer(userId);

return {
  archetype: 'ocean_pearl',
  archetype_confidence: 0.85,
  personalization,  // null if no adjustments yet
  products: [...],
};
```

### Update Adjustments (After Feedback Processing)

```typescript
// Called by pattern analysis cron job
await PersonalizationService.updateAdjustments(
  userId,
  {
    increase_hydration: 0.15,
    prefer_gel_texture: true,
    reduce_actives: 0.08
  },
  [
    'responds_well_to_niacinamide',
    'breakouts_from_coconut_oil'
  ],
  feedbackCount
);
```

### Add AI Product Exception

```typescript
// When AI discovers a product match outside archetype
await PersonalizationService.addProductException(
  userId,
  'product-123',
  'Hydrating Serum Plus',
  'serum',
  'Users with your feedback pattern love this',
  'pattern_oily_humid_hydration',
  0.89
);
```

## Adjustment Types

AI can learn these adjustments:

- `increase_hydration` / `reduce_hydration`
- `increase_actives` / `reduce_actives`
- `prefer_gel_texture` / `prefer_cream_texture` / `prefer_oil_texture`
- `increase_sun_protection`
- `reduce_fragrance`
- `increase_soothing`
- `reduce_exfoliation`

## Pattern Types

AI can discover these patterns:

- **Ingredient Response**: `responds_well_to_niacinamide`
- **Ingredient Sensitivity**: `breakouts_from_coconut_oil`
- **Texture Preference**: `prefers_lightweight_gels`
- **Routine Timing**: `better_results_with_night_actives`
- **Climate Adjustment**: `needs_more_hydration_in_winter`
- **Concern Priority**: `prioritizes_anti_aging_over_brightness`

## Confidence Levels

Based on feedback count:
- **Low**: 0-1 feedback cycles
- **Medium**: 2-4 feedback cycles
- **High**: 5+ feedback cycles

## Running the Migration

### Option 1: Supabase CLI (Local)
```bash
npx supabase db start
npx supabase migration up
```

### Option 2: Remote Supabase
```bash
npx supabase link --project-ref your-project-ref
npx supabase db push
```

### Option 3: Supabase Dashboard
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/migrations/20250130000005_add_ai_personalization.sql`
3. Run the SQL

## Integration Points

### 1. Onboarding Complete
After archetype classification → Initialize user AI adjustments

### 2. Recommendation API
Fetch personalization layer → Include in response

### 3. Feedback Submission
User submits feedback → Trigger increments feedback count

### 4. Pattern Analysis Cron
Runs nightly → Updates user adjustments based on patterns

### 5. ML Retraining
Every 2-4 weeks → Train models with feedback + adjustments

## Benefits

✅ **Explainability**: "You're an Ocean Pearl" (clear archetype)
✅ **Personalization**: AI learns your specific preferences
✅ **Validation**: Can measure archetype performance
✅ **Flexibility**: AI discovers new patterns
✅ **User Trust**: Transparent adjustments with explanations
✅ **Marketing**: 7 archetypes create brand identity
✅ **Continuous Learning**: Gets better with every feedback

## Evolution Path

### Alpha (0-100 users)
- Use 7 archetypes for classification
- Begin collecting feedback
- No AI adjustments shown yet (building data)

### Beta (100-1000 users)
- AI adjustments layer becomes active
- Show personalization in UI
- Discover first patterns

### Scale (1000-10k users)
- AI discovers sub-archetypes
- "Ocean Pearl - Sensitive Variant"
- Product exceptions become common

### Mature (10k+ users)
- Consider expanding to 15-20 archetypes
- Sophisticated pattern discovery
- Multi-level personalization

## Files Created

- `supabase/migrations/20250130000005_add_ai_personalization.sql`
- `lib/ai-personalization/types.ts`
- `lib/ai-personalization/personalization-service.ts`
- `lib/ai-personalization/index.ts`

## Next Steps

1. ✅ Database schema created
2. ✅ TypeScript types defined
3. ✅ Personalization service implemented
4. 🔲 Run migration
5. 🔲 Integrate into onboarding flow
6. 🔲 Update recommendation API
7. 🔲 Add to pattern analysis cron
8. 🔲 Show in UI (optional for alpha)
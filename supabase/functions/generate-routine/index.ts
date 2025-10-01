/**
 * Supabase Edge Function: AI Routine Generation
 *
 * Generates personalized AM/PM skincare routines using Claude AI
 * Considers: user profile, owned products, recent checkins, environment
 *
 * Trigger: Called via API when user requests routine or completes checkin
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RoutineRequest {
  userId: string
  date?: string  // ISO date, defaults to today
  forceRegenerate?: boolean  // Skip cache
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Parse request
    const { userId, date = new Date().toISOString().split('T')[0], forceRegenerate = false }: RoutineRequest = await req.json()

    // 2. Initialize Supabase client (with service role to bypass RLS)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 3. Check cache (24h TTL unless forceRegenerate)
    if (!forceRegenerate) {
      const { data: existingRoutine } = await supabase
        .from('routine_plans')
        .select('*')
        .eq('user_id', userId)
        .eq('plan_date', date)
        .single()

      if (existingRoutine) {
        console.log(`Cache hit: returning existing routine for ${userId} on ${date}`)
        return new Response(
          JSON.stringify({ cached: true, routine: existingRoutine }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // 4. Fetch user data
    console.log(`Generating new routine for user ${userId}...`)

    const [profileRes, inventoryRes, checkinsRes, envRes] = await Promise.all([
      // User profile
      supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single(),

      // Owned products with full product details
      supabase
        .from('user_inventory')
        .select(`
          *,
          products (
            id, brand, name, category, description,
            ingredients, active_ingredients
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active'),

      // Recent checkins (last 7 days)
      supabase
        .from('checkins')
        .select('checkin_date, responses, adherence_score')
        .eq('user_id', userId)
        .order('checkin_date', { ascending: false })
        .limit(7),

      // Latest environment snapshot
      supabase
        .from('environment_snapshots')
        .select('*')
        .eq('user_id', userId)
        .order('snapshot_time', { ascending: false })
        .limit(1)
        .single()
    ])

    const profile = profileRes.data
    const inventory = inventoryRes.data || []
    const checkins = checkinsRes.data || []
    const environment = envRes.data

    if (!profile) {
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 5. Build AI prompt
    const prompt = buildPrompt(profile, inventory, checkins, environment, date)

    // 6. Call Claude API
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2500,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    if (!claudeResponse.ok) {
      const error = await claudeResponse.text()
      console.error('Claude API error:', error)
      throw new Error(`Claude API failed: ${error}`)
    }

    const claudeData = await claudeResponse.json()
    const routineText = claudeData.content[0].text

    // 7. Parse JSON response
    const routineJson = JSON.parse(routineText)

    // 8. Save to database
    const { data: savedRoutine, error: saveError } = await supabase
      .from('routine_plans')
      .upsert({
        user_id: userId,
        plan_date: date,
        am_steps: routineJson.am_steps,
        pm_steps: routineJson.pm_steps,
        insights: routineJson.insights,
        alternatives: routineJson.alternatives,
        generated_by: 'ai',
        ai_model: 'claude-3-5-sonnet-20241022',
        ai_reasoning: routineJson.reasoning,
        ai_tokens_used: claudeData.usage.input_tokens + claudeData.usage.output_tokens
      }, {
        onConflict: 'user_id,plan_date'
      })
      .select()
      .single()

    if (saveError) {
      console.error('Database save error:', saveError)
      throw saveError
    }

    console.log(`✅ Routine generated successfully for ${userId}`)

    return new Response(
      JSON.stringify({ cached: false, routine: savedRoutine }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in generate-routine:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const SYSTEM_PROMPT = `You are an expert AI skincare advisor specializing in cosmetic guidance. Your role is to create personalized, science-backed skincare routines.

CRITICAL RULES:
1. You provide COSMETIC GUIDANCE ONLY—never diagnose conditions or prescribe treatments
2. For medical concerns (severe acne, rashes, infections), advise consulting a dermatologist
3. Use only products the user already owns (unless suggesting gaps to fill)
4. Respect user constraints: allergen blacklist, max steps, budget, pregnancy status
5. Base recommendations on evidence (ingredient efficacy, user's skin feedback)
6. Be cautious with actives: avoid over-exfoliation, layering conflicts (e.g., retinol + AHA)
7. Sunscreen MUST be the final AM step (SPF 30+ if UV index > 3)
8. Provide clear reasoning for each step

OUTPUT FORMAT:
Return ONLY valid JSON (no markdown, no explanation outside JSON):
{
  "am_steps": [
    {
      "step": 1,
      "action": "Cleanse",
      "product_id": "uuid-here",
      "reason": "Why this product for this step",
      "wait_time": 0,
      "cadence": "daily"
    }
  ],
  "pm_steps": [...],
  "insights": [
    "UV index is 7 today—reapply sunscreen every 2 hours",
    "Your adherence has improved; skin barrier is strengthening"
  ],
  "alternatives": [
    {
      "step": 2,
      "reason": "If skin feels irritated, skip this step tonight",
      "product_ids": ["alternative-uuid"]
    }
  ],
  "reasoning": "Overall strategy: Your skin has been feeling tight (checkin feedback), so we're focusing on hydration. High UV today requires strong SPF..."
}`

function buildPrompt(
  profile: any,
  inventory: any[],
  checkins: any[],
  environment: any,
  date: string
): string {
  const ownedProducts = inventory
    .map(i => {
      const p = i.products
      return `- ${p.brand} ${p.name} (${p.category}) [ID: ${p.id}]
   Ingredients: ${p.active_ingredients?.join(', ') || 'N/A'}
   User rating: ${i.user_rating ? `${i.user_rating}/5` : 'Not rated'}`
    })
    .join('\n')

  const recentFeedback = checkins
    .map(c => `- ${c.checkin_date}: ${JSON.stringify(c.responses)} (adherence: ${(c.adherence_score * 100).toFixed(0)}%)`)
    .join('\n')

  return `Generate a personalized skincare routine for ${date}.

USER PROFILE:
- Skin tone: ${profile.skin_tone || 'Not specified'}
- Undertone: ${profile.undertone || 'Not specified'}
- Sensitivity: ${profile.sensitivity_level || 'Unknown'}/5
- Concerns: ${profile.concerns?.join(', ') || 'None specified'}
- Budget tier: ${profile.budget_tier || 'flexible'}
- Max routine steps: ${profile.max_routine_steps || 7}
- Allergen blacklist: ${profile.allergens?.length ? profile.allergens.join(', ') : 'None'}
- Preferred brands: ${profile.preferred_brands?.length ? profile.preferred_brands.join(', ') : 'No preference'}

OWNED PRODUCTS (use these first):
${ownedProducts || 'No products in inventory—suggest acquiring basics'}

RECENT SKIN FEEDBACK (last 7 days):
${recentFeedback || 'No recent checkins'}

ENVIRONMENT TODAY:
- UV Index: ${environment?.uv_index || 'Unknown'}
- Air Quality (AQI): ${environment?.aqi || 'Unknown'}
- Humidity: ${environment?.humidity || 'Unknown'}%
- Temperature: ${environment?.temperature_c || 'Unknown'}°C

INSTRUCTIONS:
1. Create AM and PM routines using owned products
2. If user lacks essential categories (cleanser, moisturizer, SPF), note in insights
3. Adjust for environment (e.g., higher SPF if UV > 7, extra hydration if humidity < 30%)
4. Incorporate recent feedback (e.g., if "skin feels tight" → add hydrating serum)
5. Provide wait times between actives (e.g., 2 min after vitamin C, 5 min after tretinoin)
6. Suggest cadence: daily | every-other-day | 2-3x-per-week
7. Include alternatives for sensitive days

Remember: Output ONLY JSON. No markdown formatting.`
}

// ============================================================================
// NOTES FOR DEPLOYMENT:
//
// 1. Set environment variables in Supabase Dashboard:
//    - ANTHROPIC_API_KEY (get from https://console.anthropic.com/)
//    - SUPABASE_URL (auto-provided)
//    - SUPABASE_SERVICE_ROLE_KEY (auto-provided)
//
// 2. Deploy:
//    supabase functions deploy generate-routine
//
// 3. Call from Next.js:
//    const { data } = await supabase.functions.invoke('generate-routine', {
//      body: { userId: user.id, date: '2025-09-30' }
//    })
// ============================================================================
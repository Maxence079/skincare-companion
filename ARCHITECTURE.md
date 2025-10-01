# SkinCare AI Companion - Simplified Architecture

## Overview

A lean, Supabase-centric architecture that scales from 0 → 100K MAU without major rewrites.

**Stack:**
- **Frontend:** Next.js 15 + React (Vercel)
- **Backend:** Supabase (Postgres + Auth + Storage + Edge Functions)
- **AI:** Claude 3.5 Sonnet via Anthropic API
- **Deployment:** Vercel (frontend) + Supabase (backend)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│          CLIENT (Mobile/Web - Next.js)               │
└───────────────────────┬─────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│      VERCEL (Next.js App Router + API Routes)       │
│  ├─ Server Components (SSR)                         │
│  ├─ API Routes: /api/routine, /api/checkin          │
│  ├─ Edge Middleware: Auth, Rate Limiting            │
└───────────────────────┬─────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│              SUPABASE (All-in-One Backend)          │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │ POSTGRES (OLTP + Analytics)                │    │
│  │ ├─ Row-Level Security (RLS)                │    │
│  │ ├─ pgvector (semantic search)              │    │
│  │ ├─ Materialized Views (analytics)          │    │
│  │ └─ pg_cron (scheduled jobs)                │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │ EDGE FUNCTIONS (Serverless AI Workers)     │    │
│  │ ├─ generate-routine (Claude API)           │    │
│  │ ├─ refresh-environment (Weather API)       │    │
│  │ └─ process-scan (OCR + matching)           │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │ STORAGE (Object Storage)                   │    │
│  │ ├─ User selfies                            │    │
│  │ ├─ Product images                          │    │
│  │ └─ Signed URLs (secure access)             │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │ AUTH (OIDC)                                 │    │
│  │ ├─ Email/password, Magic links             │    │
│  │ └─ Social OAuth (Google, Apple)            │    │
│  └────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

---

## Database Schema

### Core Tables

1. **profiles** - User profiles (extends Supabase auth.users)
   - Onboarding data (JSONB for 500+ data points)
   - Skin profile (tone, sensitivity, concerns)
   - Preferences (max steps, allergens, budget)

2. **products** - Global cosmetic product catalog
   - 10K+ products with INCI ingredients
   - Pre-computed scores (comedogenic, irritation risk)
   - pgvector embeddings for semantic search

3. **user_inventory** - Products user owns
   - Status tracking (active/depleted)
   - User ratings/reviews

4. **checkins** - Daily micro-questionnaires
   - Flexible JSONB responses
   - Adherence tracking
   - Optional selfies

5. **environment_snapshots** - Geo-aware environmental data
   - UV index, AQI, humidity
   - 6-hour cache by geohash

6. **routine_plans** - AI-generated routines
   - AM/PM steps (JSONB)
   - LLM reasoning + metadata
   - 24-hour cache

7. **ingredients** - Knowledge base for RAG
   - Safety ratings, evidence levels
   - pgvector embeddings

8. **scan_events** - Product scanning tracking

### Materialized Views (for analytics)

- **user_engagement_metrics** - User activity rollups
- **product_popularity_metrics** - Product scan/rating stats

---

## Key Features

### 1. Multi-Tenancy via Row-Level Security (RLS)
- Every table has `user_id` foreign key
- Postgres RLS policies enforce `auth.uid() = user_id`
- No application-level access control needed

### 2. Semantic Search via pgvector
- Products and ingredients have vector embeddings
- HNSW indexes for fast approximate nearest neighbor search
- Good for <1M vectors (migrate to Weaviate at scale)

### 3. AI Routine Generation
- Supabase Edge Function calls Claude API
- Context: user profile + inventory + checkins + environment
- Output: Structured JSON routine with reasoning
- 24-hour cache per user

### 4. Real-Time Updates (Optional)
- Supabase Realtime for WebSocket updates
- E.g., notify user when routine is ready

### 5. Analytics without OLAP Warehouse
- Materialized views for daily aggregations
- Direct SQL queries via Supabase Studio
- Scales to 100M rows; offload to ClickHouse at 1M+ MAU

---

## Scaling Strategy

| **Metric** | **Threshold** | **Action** |
|-----------|--------------|-----------|
| MAU | 10K | Nothing—Supabase handles this |
| MAU | 100K | Add read replicas (Supabase Pro) |
| MAU | 500K | Introduce Kafka for event streaming |
| MAU | 1M+ | Shard database by `user_id % N` |
| Vectors | 1M | Migrate to Weaviate |
| Analytics | Daily queries >10min | Add ClickHouse for OLAP |
| AI costs | >$5K/month | Fine-tune own models |

**Key Insight:** Supabase takes you to 100K MAU with zero infra work.

---

## Cost Estimates

### Phase 1: 0 → 10K MAU
- Supabase Pro: $25/month + $0.10/GB bandwidth
- Vercel Pro: $20/month + $0.40/GB bandwidth
- Claude API: ~100K tokens/day = $90/month
- **Total:** ~$200/month

### Phase 2: 10K → 100K MAU
- Supabase Pro: $200/month (more compute/storage)
- Vercel Pro: $100/month
- Claude API: ~1M tokens/day = $900/month
- **Total:** ~$1,200/month

### Phase 3: 100K+ MAU
- Supabase Enterprise: ~$2K/month
- Vercel Enterprise: ~$500/month
- Claude API: ~10M tokens/day = $9K/month
- **Total:** ~$12K/month

---

## Data Flow: Generate Routine

```
User → Next.js → Supabase Edge Function → Claude API → Postgres → User
  │                     │                      │           │
  │                     ├─ Fetch profile       │           │
  │                     ├─ Fetch inventory     │           │
  │                     ├─ Fetch checkins      │           │
  │                     ├─ Fetch environment   │           │
  │                     │                      │           │
  │                     └─ Build prompt ───────┤           │
  │                                            │           │
  │                                   Generate routine     │
  │                                            │           │
  │                     ┌────────────── Parse JSON        │
  │                     │                                  │
  │                     └─ Save to routine_plans ─────────┤
  │                                                        │
  │◄─────────────────── Return routine JSON ──────────────┘
```

---

## Security

1. **Authentication:** Supabase Auth (OIDC, JWT)
2. **Authorization:** Row-Level Security (RLS) policies
3. **Secrets:** Supabase environment variables (encrypted)
4. **API Keys:** Never exposed to client; used in Edge Functions only
5. **Data Privacy:** User data isolated by RLS; GDPR-compliant deletion

---

## When to Add Complexity

### Don't Add Until You Need:
- ❌ Kafka (Postgres WAL works until 500K MAU)
- ❌ Separate OLAP warehouse (Materialized views + Postgres enough)
- ❌ Separate cache (Postgres + Vercel Edge Cache is fast)
- ❌ Microservices (Monolith scales to 100K MAU easily)
- ❌ Custom ML infra (Claude API is cheaper until $5K/month)

### Add When:
- ✅ Read replicas at 100K MAU (Supabase built-in)
- ✅ CDN for static assets (Vercel does this automatically)
- ✅ Rate limiting at API Gateway (Vercel Edge Middleware)
- ✅ Monitoring (Vercel Analytics + Supabase Logs)

---

## Deployment Checklist

### 1. Supabase Setup
- [ ] Create project at supabase.com
- [ ] Run migration: `supabase/migrations/20250930_initial_schema.sql`
- [ ] Enable pgvector extension
- [ ] Set up scheduled jobs (pg_cron)
- [ ] Deploy Edge Functions

### 2. Environment Variables
```bash
# .env.local (already set)
NEXT_PUBLIC_SUPABASE_URL=https://gmhrjszytqslojujpvws.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Supabase Dashboard → Edge Functions → Secrets
ANTHROPIC_API_KEY=sk-ant-...
OPENWEATHER_API_KEY=your-key
```

### 3. Vercel Deployment
- [ ] Connect GitHub repo
- [ ] Add environment variables
- [ ] Enable Edge Middleware
- [ ] Deploy

---

## Development Workflow

### Local Development
```bash
# Start Next.js
npm run dev

# Start Supabase locally (optional)
npx supabase start
npx supabase db reset  # Apply migrations
```

### Database Migrations
```bash
# Create new migration
npx supabase migration new your_migration_name

# Apply migrations locally
npx supabase db reset

# Push to production (via Supabase Dashboard SQL Editor)
```

### Deploy Edge Functions
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref gmhrjszytqslojujpvws

# Deploy function
supabase functions deploy generate-routine
```

---

## Next Steps

1. **Run the database migration** in Supabase SQL Editor
2. **Deploy Edge Functions** for AI routine generation
3. **Build onboarding flow** (multi-step form)
4. **Build checkin interface** (daily questionnaire)
5. **Build routine display page** (AM/PM steps with product cards)
6. **Add product catalog** (seed with top 100 products)
7. **Implement scan flow** (barcode → product match → inventory)

---

## Questions?

- **Why not use X instead of Y?** See "When to Add Complexity" section
- **How much will this cost at scale?** See "Cost Estimates" section
- **When do I need to refactor?** See "Scaling Strategy" table
- **Is this production-ready?** Yes—Supabase powers companies with millions of users

**Philosophy:** Start simple, add complexity only when metrics demand it.
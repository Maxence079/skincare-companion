# SkinCare AI Companion

> An AI-powered skincare companion that collects 500+ behavioral data points in under 3 minutes and provides personalized cosmetic guidance.

**Status:** 🟢 Foundation Complete | **Stack:** Next.js 15 + Supabase + Claude AI

---

## 🎯 What Makes This Different

- **500+ data points in 3 min** - Gamified onboarding that feels fun, not clinical
- **AI-powered routines** - Claude 3.5 Sonnet analyzes your skin profile, environment, and progress
- **Uses your products first** - Scan what you own, get personalized guidance
- **Cosmetic guidance only** - Strict boundaries: no medical diagnoses, no treatment claims

---

## 🏗️ Architecture

### Simplified, Supabase-Centric Design

**Why this approach:**
- ✅ Ships fast (weeks, not months)
- ✅ Scales to 100K MAU without refactoring
- ✅ Costs <$500/month until 10K users
- ✅ Minimal tools (Supabase does 80% of the work)

**Stack:**
```
Next.js 15 (Frontend + API)
    ↓
Supabase (Backend)
    ├─ Postgres (OLTP + Analytics)
    ├─ pgvector (Semantic Search)
    ├─ Edge Functions (AI Workers)
    ├─ Auth (OIDC)
    └─ Storage (Images)
    ↓
Claude API (AI Routine Generation)
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for full details.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account (already connected)
- Anthropic API key (for Claude)

### Setup (5 minutes)

1. **Dev Server Already Running:**
   ```
   http://localhost:3000
   ```

2. **Next Steps:**
   - [ ] Run database migration in Supabase
   - [ ] Deploy Edge Function for AI
   - [ ] Build onboarding flow

See [QUICKSTART.md](./QUICKSTART.md) for detailed instructions.

---

## 📁 Project Structure

```
├── app/                    # Next.js App Router
│   ├── page.tsx           # ✅ Landing page
│   ├── (auth)/            # Login/signup (coming soon)
│   ├── onboarding/        # Multi-step form (coming soon)
│   └── api/               # API routes
├── lib/
│   └── supabase/         # ✅ Supabase clients configured
├── supabase/
│   ├── migrations/       # ✅ Database schema ready
│   └── functions/        # ✅ Edge Functions ready
└── components/           # React components
```

---

## 🎨 Development Roadmap

### Phase 1: MVP (4 weeks)

- [x] Next.js 15 + Supabase foundation
- [x] Database schema (9 tables)
- [x] AI routine generation (Edge Function)
- [x] Authentication setup
- [ ] **Week 1:** Gamified onboarding (7-step form)
- [ ] **Week 2:** Product catalog + barcode scanning
- [ ] **Week 3:** Daily checkin + routine display
- [ ] **Week 4:** Dashboard + polish

---

## 💰 Cost Estimates

| **Users** | **Supabase** | **Vercel** | **Claude API** | **Total/Month** |
|-----------|--------------|------------|----------------|-----------------|
| 1K        | $25          | $20        | $50            | **~$100**       |
| 10K       | $100         | $50        | $500           | **~$650**       |
| 100K      | $500         | $100       | $5K            | **~$5.5K**      |

---

## 📚 Documentation

- **[QUICKSTART.md](./QUICKSTART.md)** - Step-by-step setup guide
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Full architecture deep-dive
- **[supabase/migrations/](./supabase/migrations/)** - Database schema

---

## 🛠️ Tech Stack

| **Category** | **Technology** |
|-------------|----------------|
| Frontend | Next.js 15 |
| Backend | Supabase |
| Database | PostgreSQL + pgvector |
| AI | Claude 3.5 Sonnet |
| Auth | Supabase Auth |
| Deployment | Vercel |
| Language | TypeScript |
| Styling | Tailwind CSS |

---

## 🎉 Current Status

**What's Working:**
- ✅ Dev server running at http://localhost:3000
- ✅ Supabase connected
- ✅ Database schema designed (9 tables)
- ✅ AI Edge Function ready to deploy
- ✅ TypeScript types configured
- ✅ Landing page live

**What's Next:**
1. Run database migration
2. Deploy AI Edge Function
3. Build onboarding flow (Week 1)

**Target:** Ship to first 100 users in 4 weeks.

---

**Made with ❤️ using Claude Code**# Auto-deploy test

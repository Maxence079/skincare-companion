# ⚡ QUICK START - 30 Minutes to Production

## Prerequisites Checklist

- [ ] Supabase account with project
- [ ] Anthropic API key with credits
- [ ] GitHub account
- [ ] Vercel account

---

## 🚀 Deploy in 5 Steps

### 1️⃣ Create Upstash Redis (5 min)
```
→ https://upstash.com
→ Sign up (free)
→ Create Database
→ Copy: UPSTASH_REDIS_REST_URL + TOKEN
```

### 2️⃣ Create Sentry Project (5 min)
```
→ https://sentry.io
→ Sign up (free)
→ Create Project (Next.js)
→ Copy: NEXT_PUBLIC_SENTRY_DSN
```

### 3️⃣ Run Database Migrations (2 min)
```bash
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

### 4️⃣ Push to GitHub (1 min)
```bash
git add .
git commit -m "Deploy production"
git push origin main
```

### 5️⃣ Deploy on Vercel (10 min)
```
→ https://vercel.com/new
→ Import your repo
→ Add environment variables (see below)
→ Deploy!
```

---

## 📋 Environment Variables for Vercel

Copy-paste these into Vercel:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
NEXT_PUBLIC_SENTRY_DSN=
```

---

## ✅ Verify Deployment

```bash
# Check health
curl https://your-app.vercel.app/api/health

# Should return: {"status": "healthy"}
```

---

## 📚 Full Guides

- **Detailed Steps:** See `DEPLOY_NOW.md`
- **Setup Guide:** See `SETUP.md`
- **Architecture:** See `FINAL_REVIEW.md`
- **Checklist:** See `DEPLOYMENT_CHECKLIST.md`

---

## 🆘 Need Help?

**Common Issues:**
1. **Missing env var** → Add in Vercel → Redeploy
2. **Redis error** → Check Upstash credentials
3. **DB error** → Check Supabase credentials
4. **Build error** → Check `npm run build` locally

**Support:**
- Vercel: https://vercel.com/support
- Supabase: https://supabase.com/support

---

**You're 30 minutes away from production! 🚀**

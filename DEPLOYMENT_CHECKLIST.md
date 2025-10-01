# 🚀 Production Deployment Checklist

Complete this checklist before deploying to production.

---

## ⚙️ Environment Setup

### 1. Supabase
- [ ] Create production Supabase project
- [ ] Copy `NEXT_PUBLIC_SUPABASE_URL` to `.env.local`
- [ ] Copy `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`
- [ ] Copy `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`
- [ ] Enable Row-Level Security (RLS) on all tables
- [ ] Run database migrations: `npm run db:push`
- [ ] Verify indexes are created (check Supabase Dashboard → Database → Indexes)

### 2. Upstash Redis
- [ ] Create free Upstash account at https://upstash.com
- [ ] Create new Redis database
- [ ] Copy `UPSTASH_REDIS_REST_URL` to `.env.local`
- [ ] Copy `UPSTASH_REDIS_REST_TOKEN` to `.env.local`
- [ ] Test connection: `curl $UPSTASH_REDIS_REST_URL/ping -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN"`

### 3. Anthropic Claude
- [ ] Get API key from https://console.anthropic.com
- [ ] Add `ANTHROPIC_API_KEY` to `.env.local`
- [ ] Verify API key works
- [ ] Set up billing alerts ($50 threshold)

### 4. Sentry (Optional but Recommended)
- [ ] Create free Sentry account at https://sentry.io
- [ ] Create new Next.js project
- [ ] Copy `NEXT_PUBLIC_SENTRY_DSN` to `.env.local`
- [ ] Test error tracking in development

---

## 🧪 Testing

### Pre-Deployment Tests
- [ ] Run unit tests: `npm run test:unit`
- [ ] Verify test coverage >70%
- [ ] Run E2E tests: `npm run test:e2e`
- [ ] Test on mobile devices (Chrome DevTools)
- [ ] Test rate limiting (make 15+ requests quickly)
- [ ] Test error handling (disconnect network)

### Manual Testing
- [ ] Complete full onboarding flow
- [ ] Verify profile generation works
- [ ] Check dashboard displays correctly
- [ ] Test photo upload functionality
- [ ] Verify geolocation enrichment
- [ ] Test accessibility features

---

## 🔒 Security

### Critical Security Checks
- [ ] All environment variables use `process.env`
- [ ] No API keys hardcoded in source code
- [ ] `.env.local` is in `.gitignore`
- [ ] Security headers configured in `next.config.ts`
- [ ] Rate limiting enabled on all API endpoints
- [ ] Input validation on all API requests
- [ ] RLS policies enabled on Supabase tables

### Optional Security Enhancements
- [ ] Set up CSRF protection
- [ ] Enable 2FA on all admin accounts
- [ ] Set up secret rotation schedule
- [ ] Configure WAF rules (Cloudflare)

---

## 📊 Monitoring & Alerting

### Sentry Configuration
- [ ] Configure alert rules for errors
- [ ] Set up Slack/Discord notifications
- [ ] Configure performance monitoring
- [ ] Set up release tracking

### Custom Monitoring
- [ ] Create health check endpoint (`/api/health`)
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom)
- [ ] Configure log aggregation (if using Datadog/LogDNA)
- [ ] Set up custom metrics dashboard

---

## 🚢 Vercel Deployment

### 1. Push to GitHub
```bash
git add .
git commit -m "Production-ready architecture v9/10"
git push origin main
```

### 2. Import to Vercel
- [ ] Go to https://vercel.com/new
- [ ] Import your GitHub repository
- [ ] Select Framework: **Next.js**
- [ ] Configure environment variables (see below)

### 3. Environment Variables in Vercel
Copy all variables from `.env.local`:

**Required:**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

**Optional:**
```
NEXT_PUBLIC_SENTRY_DSN=
OPENWEATHER_API_KEY=
LOG_LEVEL=info
```

### 4. Deploy Settings
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `.next`
- [ ] Install Command: `npm ci`
- [ ] Node Version: `20.x`

### 5. Deploy!
- [ ] Click "Deploy"
- [ ] Wait for build to complete (~3-5 minutes)
- [ ] Verify deployment at your Vercel URL

---

## ✅ Post-Deployment Verification

### Immediate Checks (within 5 minutes)
- [ ] Visit production URL
- [ ] Check browser console for errors
- [ ] Test onboarding flow end-to-end
- [ ] Verify AI responses work
- [ ] Check Sentry dashboard for errors
- [ ] Test rate limiting (make 15+ requests)
- [ ] Verify security headers (check with https://securityheaders.com)

### Within 1 Hour
- [ ] Monitor Sentry for new errors
- [ ] Check Vercel analytics
- [ ] Verify database connections
- [ ] Check Redis cache hit rate
- [ ] Monitor AI API costs

### Within 24 Hours
- [ ] Review error logs
- [ ] Check performance metrics
- [ ] Analyze user behavior
- [ ] Review cost tracking
- [ ] Verify backups are running

---

## 📈 Performance Benchmarks

### Expected Metrics (First Week)

| Metric | Target | Alert If |
|--------|--------|----------|
| Uptime | >99.9% | <99% |
| API Response (p95) | <500ms | >1s |
| AI Response (p95) | <2s | >5s |
| Error Rate | <0.1% | >1% |
| Cache Hit Rate | >80% | <60% |

---

## 🚨 Incident Response

### If Something Goes Wrong

**1. Immediate Actions:**
- Check Sentry for error details
- Check Vercel logs: `vercel logs [deployment-url]`
- Check Supabase dashboard for DB issues
- Check Upstash dashboard for Redis issues

**2. Rollback Procedure:**
```bash
# In Vercel dashboard
# Go to Deployments → Find previous working deployment → Promote to Production
```

**3. Emergency Contacts:**
- Vercel Support: https://vercel.com/support
- Supabase Support: https://supabase.com/support
- Anthropic Support: support@anthropic.com

---

## 💰 Cost Monitoring

### Set Up Billing Alerts

**Anthropic (Claude):**
- [ ] Set alert at $50
- [ ] Set alert at $100
- [ ] Monitor cost per profile

**Vercel:**
- [ ] Monitor bandwidth usage
- [ ] Monitor function invocations
- [ ] Check Edge config usage

**Upstash:**
- [ ] Monitor requests per day
- [ ] Upgrade plan if approaching limit

**Supabase:**
- [ ] Monitor database size
- [ ] Monitor API requests
- [ ] Check storage usage

---

## 📝 Documentation

### Update Documentation
- [ ] Update README with production URL
- [ ] Document environment variables
- [ ] Create runbook for common issues
- [ ] Document deployment process

### Team Communication
- [ ] Notify team of deployment
- [ ] Share production URL
- [ ] Share monitoring dashboards
- [ ] Share incident response plan

---

## 🎉 Launch Day!

### Before Going Live
- [ ] All checklist items completed
- [ ] All tests passing
- [ ] Monitoring configured
- [ ] Team notified
- [ ] Coffee ready ☕

### After Launch
- [ ] Monitor for first hour
- [ ] Check error rates
- [ ] Verify user flows work
- [ ] Celebrate! 🎊

---

## 📞 Support Resources

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Supabase Dashboard:** https://supabase.com/dashboard
- **Upstash Dashboard:** https://console.upstash.com
- **Sentry Dashboard:** https://sentry.io/
- **Anthropic Console:** https://console.anthropic.com

---

## ⏭️ Post-Launch (Week 1)

- [ ] Review first week metrics
- [ ] Analyze user feedback
- [ ] Identify performance bottlenecks
- [ ] Plan optimization priorities
- [ ] Schedule retrospective meeting

---

**Status:** Ready for production deployment! 🚀

**Estimated Setup Time:** 2-3 hours

**Questions?** See `SETUP.md` for detailed instructions.

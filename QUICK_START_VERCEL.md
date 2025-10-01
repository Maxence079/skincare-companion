# Quick Start: Vercel Auto-Deploy

## 🚀 Get Started in 5 Minutes

### Step 1: Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Create a new repository (e.g., `skincare-companion`)
3. Don't initialize with README (we already have code)

### Step 2: Push Your Code

```bash
# Add GitHub as remote
git remote add origin https://github.com/YOUR_USERNAME/skincare-companion.git

# Push your code
git add .
git commit -m "Initial commit - SkinCare Companion"
git push -u origin master
```

### Step 3: Connect Vercel to GitHub

**Option A: Automatic Setup (Recommended)**
```bash
npm run vercel:setup
```

**Option B: Manual Setup**

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Find your project: `skincare-companion`
3. Click **Settings** → **Git**
4. Click **Connect Git Repository**
5. Authorize Vercel for GitHub
6. Select your repository
7. Configure:
   - Production Branch: `master`
   - Build Command: `npm run build`
   - Output Directory: `.next`

### Step 4: Add GitHub Secrets (for GitHub Actions)

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Add these secrets:

| Secret Name | Value | Where to Get It |
|-------------|-------|-----------------|
| `VERCEL_TOKEN` | Your Vercel token | [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | `team_Zi04HNn5Y4ELqTA3cDUq6L7j` | Already in `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | `prj_ZAYgBdfsqWqKyr8lV3IyU9IHkYLP` | Already in `.vercel/project.json` |

### Step 5: Verify Environment Variables

Check that all required environment variables are set in Vercel:

```bash
vercel env ls production
```

Required variables:
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `OPENAI_API_KEY`

If any are missing, add them:
```bash
vercel env add VARIABLE_NAME production
```

### Step 6: Test Auto-Deploy

Make a small change and push:

```bash
# Edit a file
echo "// Test auto-deploy" >> app/page.tsx

# Commit and push
git add .
git commit -m "test: Verify auto-deployment"
git push

# Watch the deployment
vercel ls
```

## ✅ You're Done!

Now every time you push code:
- **Master branch** → Automatically deploys to production
- **Other branches** → Creates preview deployments
- **Pull requests** → Creates preview with URL in comments

## Common Commands

```bash
# Setup auto-deploy
npm run vercel:setup

# Manual production deploy
npm run vercel:deploy

# Manual preview deploy
npm run vercel:preview

# List deployments
vercel ls

# View logs
vercel logs <deployment-url>

# Pull environment variables
vercel env pull .env.local
```

## Workflow Examples

### Feature Development

```bash
# Create feature branch
git checkout -b feature/new-analysis

# Make changes...
git add .
git commit -m "feat: Add advanced skin analysis"
git push -u origin feature/new-analysis

# ✅ Preview deployment created automatically!
# URL: skincare-companion-git-feature-new-analysis.vercel.app
```

### Production Release

```bash
# Merge to master
git checkout master
git merge feature/new-analysis
git push

# ✅ Production deployment starts automatically!
# URL: skincare-companion.vercel.app
```

### Hotfix

```bash
# Create hotfix branch
git checkout -b hotfix/urgent-fix

# Fix the issue
git add .
git commit -m "fix: Critical bug in skin analysis"
git push -u origin hotfix/urgent-fix

# Test preview deployment
# Then merge to master
git checkout master
git merge hotfix/urgent-fix
git push

# ✅ Deployed to production automatically!
```

## Troubleshooting

### Build Fails

```bash
# Check logs
vercel logs <deployment-url>

# Test build locally
npm run build
```

### Environment Variables Not Working

```bash
# Pull latest from Vercel
vercel env pull .env.local

# Check what's in Vercel
vercel env ls
```

### Deployment Not Triggering

1. Check Git integration in Vercel dashboard
2. Verify webhook in GitHub repository settings
3. Check GitHub Actions tab for errors

## Benefits

✅ **Zero Manual Deployment** - Push and forget
✅ **Preview Every Change** - Test before merging
✅ **Instant Rollback** - One click to previous version
✅ **Team Collaboration** - Share preview URLs
✅ **Automatic HTTPS** - SSL certificates managed
✅ **Global CDN** - Fast worldwide delivery

## Next Steps

- [ ] Set up branch protection rules
- [ ] Configure deployment notifications (Slack/Discord)
- [ ] Add custom domain
- [ ] Set up monitoring and alerts

For detailed information, see [VERCEL_AUTO_DEPLOY.md](./VERCEL_AUTO_DEPLOY.md)

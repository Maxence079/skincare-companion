# Vercel Automatic Deployment Setup

## Overview
This guide sets up automatic deployments to Vercel whenever you push code changes to your Git repository.

## Prerequisites
- ✅ Vercel CLI installed (version 48.1.6)
- ✅ Vercel project configured (`skincare-companion`)
- ⚠️ Git remote repository needed (GitHub/GitLab/Bitbucket)

## Setup Steps

### 1. Create and Push to Git Repository

If you haven't already, create a repository on GitHub/GitLab and push your code:

```bash
# Initialize git (already done)
git init

# Add remote repository
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Stage all files
git add .

# Commit your changes
git commit -m "Initial commit - SkinCare Companion"

# Push to remote
git push -u origin master
```

### 2. Connect Vercel to Git Repository

#### Option A: Using Vercel Dashboard (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to your project: `skincare-companion`
3. Go to **Settings** → **Git**
4. Click **Connect Git Repository**
5. Select your Git provider (GitHub/GitLab/Bitbucket)
6. Authorize Vercel to access your repositories
7. Select your repository
8. Configure deployment settings:
   - **Production Branch**: `master` (or `main`)
   - **Framework Preset**: Next.js (auto-detected)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

#### Option B: Using Vercel CLI

```bash
# Link your local project to Vercel and Git
vercel link

# Pull environment variables from Vercel
vercel env pull

# Deploy and set up Git integration
vercel --prod
```

### 3. Configure Deployment Behavior

Once connected, Vercel will automatically:

- **Production Deployments**: Every push to `master` branch
- **Preview Deployments**: Every push to other branches
- **Preview Deployments**: Every pull request

### 4. Environment Variables Setup

Ensure all environment variables are configured in Vercel:

1. Go to **Project Settings** → **Environment Variables**
2. Add all required variables for each environment:
   - Production
   - Preview
   - Development

**Required Environment Variables:**
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
NEXT_PUBLIC_APP_URL
```

You can sync environment variables from your local `.env` file:

```bash
# Add environment variables to Vercel
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add OPENAI_API_KEY production
```

Or pull them from Vercel to local:

```bash
vercel env pull .env.local
```

### 5. Deployment Workflow

Once set up, your workflow becomes:

```bash
# Make changes to your code
git add .
git commit -m "feat: Add new feature"
git push

# Vercel automatically:
# 1. Detects the push
# 2. Starts a new build
# 3. Runs tests (if configured)
# 4. Deploys to production (if master branch)
# 5. Sends you a deployment notification
```

### 6. Branch-Based Deployments

Create feature branches for testing:

```bash
# Create a feature branch
git checkout -b feature/new-skin-analysis

# Make changes and push
git add .
git commit -m "feat: Improve skin analysis algorithm"
git push -u origin feature/new-skin-analysis

# Vercel creates a preview deployment automatically
# You get a unique URL like: skincare-companion-git-feature-new-skin-analysis.vercel.app
```

### 7. Monitoring Deployments

Monitor your deployments:

```bash
# List recent deployments
vercel ls

# Check deployment status
vercel inspect <deployment-url>

# View deployment logs
vercel logs <deployment-url>
```

## GitHub Actions Integration (Optional Advanced Setup)

For additional CI/CD capabilities, create `.github/workflows/vercel-deploy.yml`:

```yaml
name: Vercel Deployment
on:
  push:
    branches: [master]
  pull_request:
    branches: [master]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

## Troubleshooting

### Build Fails on Vercel

Check build logs:
```bash
vercel logs <deployment-url>
```

Common issues:
- Missing environment variables
- Node version mismatch
- Build command errors

### Environment Variables Not Working

Pull latest environment variables:
```bash
vercel env pull .env.production
```

### Deployment Not Triggering

1. Check Git integration in Vercel dashboard
2. Verify webhook settings
3. Check repository permissions

## Current Configuration

**Project Details:**
- Project ID: `prj_ZAYgBdfsqWqKyr8lV3IyU9IHkYLP`
- Organization ID: `team_Zi04HNn5Y4ELqTA3cDUq6L7j`
- Project Name: `skincare-companion`
- Region: Singapore (sin1)

**Build Configuration:**
- Framework: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Node.js Version: Auto-detected

## Benefits of Automatic Deployment

✅ **Continuous Deployment**: Every push deploys automatically
✅ **Preview URLs**: Test changes before merging
✅ **Rollback**: Easy rollback to previous deployments
✅ **Team Collaboration**: Share preview URLs with team
✅ **Zero Downtime**: Atomic deployments
✅ **Automatic HTTPS**: SSL certificates managed automatically
✅ **Edge Network**: Global CDN distribution

## Next Steps

1. [ ] Create GitHub/GitLab repository
2. [ ] Push your code to remote repository
3. [ ] Connect Vercel to Git repository via dashboard
4. [ ] Configure environment variables in Vercel
5. [ ] Test automatic deployment by pushing a change
6. [ ] Set up branch protection rules (optional)
7. [ ] Configure deployment notifications (optional)

## Resources

- [Vercel Git Integration Docs](https://vercel.com/docs/concepts/git)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)

# Simple Vercel Git Integration Setup

## 🎯 Goal
Connect your GitHub repository to Vercel for automatic deployments.

## 📋 Current Situation
- ✅ Code is on GitHub: https://github.com/Maxence079/skincare-companion
- ✅ Vercel project exists: `skincare-companion`
- ⚠️ They're not connected (manual deployments only)

## 🚀 Simple 3-Step Solution

### Step 1: Install Vercel GitHub App

1. Go to: **https://github.com/apps/vercel**
2. Click **Configure** (or **Install** if not installed)
3. Select your account: **Maxence079**
4. Under "Repository access":
   - Select: **Only select repositories**
   - Choose: ✅ **skincare-companion**
5. Click **Install & Authorize** or **Save**

### Step 2: Link Repository via Vercel Dashboard

**Method A: Via Project Settings (Preferred)**

1. Go to: https://vercel.com/dashboard
2. Click on your project: **skincare-companion**
3. Click **Settings** (top navigation)
4. Look for **Git** in the left sidebar
   - If you see it: Click **Connect Git Repository**
   - If you don't see it: Go to Method B below

**Method B: Re-import from GitHub**

Since your project was created via CLI, you might need to re-import it:

1. Go to: **https://vercel.com/new**
2. Under "Import Git Repository"
3. You should now see: `Maxence079/skincare-companion`
4. Click **Import**
5. Configure project:
   ```
   Framework Preset: Next.js
   Root Directory: ./
   Build Command: npm run build
   Output Directory: .next
   ```
6. **Before clicking Deploy**, expand "Environment Variables"
7. Add your environment variables (you can import from your current project)
8. Click **Deploy**

> **Note**: This will create a new Vercel project connected to Git. You can delete the old CLI-only project after verifying this works.

### Step 3: Verify Auto-Deploy Works

After connecting, test it:

```bash
# Make a small change
echo "# Testing auto-deploy" >> README.md

# Commit and push
git add README.md
git commit -m "test: Verify auto-deployment"
git push
```

Then:
1. Go to: https://vercel.com/dashboard
2. You should see a new deployment automatically triggered
3. Check the **Deployments** tab to see the build progress

## 🔐 Add GitHub Secrets (For GitHub Actions)

Once Git integration is working, add these secrets for advanced CI/CD:

Go to: **https://github.com/Maxence079/skincare-companion/settings/secrets/actions**

Click **New repository secret** and add:

| Name | Value | Where to get it |
|------|-------|-----------------|
| `VERCEL_TOKEN` | Your token | https://vercel.com/account/tokens (create new) |
| `VERCEL_ORG_ID` | `team_Zi04HNn5Y4ELqTA3cDUq6L7j` | From `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | `prj_ZAYgBdfsqWqKyr8lV3IyU9IHkYLP` | From `.vercel/project.json` |

> **Note**: GitHub Actions are optional. Vercel's Git integration alone will handle auto-deployments.

## ✅ What You'll Get

Once connected:

- 🚀 **Push to `main`** → Automatic production deployment
- 🔍 **Push to other branches** → Automatic preview deployments
- 📝 **Create PR** → Preview deployment with comment on PR
- ⏮️ **Easy rollback** → One click to previous version
- 🌐 **Production URL**: Your domain (e.g., `skincare-companion.vercel.app`)
- 🔗 **Preview URLs**: Unique URL for each branch/PR

## 🔧 Alternative: Use Vercel CLI with Git Hooks

If you prefer to keep using CLI but want automation, you can add a Git hook:

```bash
# Create post-commit hook
cat > .git/hooks/post-commit << 'EOF'
#!/bin/bash
# Auto-deploy to Vercel after commit
echo "Deploying to Vercel..."
vercel --prod --yes
EOF

# Make it executable
chmod +x .git/hooks/post-commit
```

**However**, this is NOT recommended because:
- ❌ Runs on your local machine (not in the cloud)
- ❌ Requires you to have Vercel CLI configured
- ❌ No deployment history
- ❌ No preview deployments for branches

## 🆘 Troubleshooting

### Can't find Git section in Settings
- Your project was created via CLI without Git
- Solution: Re-import from GitHub (Method B above)

### Vercel GitHub App not showing repository
- Make sure you selected the repository in Step 1
- Try re-configuring: https://github.com/apps/vercel/installations/select_target

### Build fails after connecting
- Check environment variables are set
- Compare with your local `.env.local`
- Add missing variables in Vercel dashboard

### Multiple Vercel projects
- You can have both CLI and Git projects temporarily
- Test the Git one, then delete the CLI one
- Update your `.vercel` folder to point to the new project

## 📚 Resources

- Vercel Git Integration: https://vercel.com/docs/concepts/git
- GitHub App Install: https://github.com/apps/vercel
- Vercel Dashboard: https://vercel.com/dashboard

## ✨ Recommended Workflow After Setup

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes...
git add .
git commit -m "feat: Add new feature"
git push -u origin feature/new-feature
# → Vercel creates preview deployment automatically

# Review preview, then merge
git checkout main
git merge feature/new-feature
git push
# → Vercel deploys to production automatically
```

No more manual `vercel --prod` commands needed! 🎉

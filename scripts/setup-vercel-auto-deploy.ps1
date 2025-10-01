# Vercel Auto-Deploy Setup Script (PowerShell)
# This script helps set up automatic deployments to Vercel

Write-Host "🚀 Vercel Auto-Deploy Setup" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""

# Check if git is initialized
if (-not (Test-Path .git)) {
    Write-Host "❌ Git repository not found" -ForegroundColor Red
    Write-Host "Please initialize git first: git init"
    exit 1
}

Write-Host "✅ Git repository found" -ForegroundColor Green

# Check if Vercel CLI is installed
try {
    $vercelVersion = vercel --version 2>&1
    Write-Host "✅ Vercel CLI found: $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Vercel CLI not found" -ForegroundColor Red
    Write-Host "Installing Vercel CLI..."
    npm install -g vercel
}

# Check if remote repository is configured
try {
    $remoteUrl = git remote get-url origin 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Git remote configured: $remoteUrl" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  No git remote configured" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please add a remote repository:"
    Write-Host "  git remote add origin <your-repo-url>"
    Write-Host ""
    Write-Host "Create a repository on:"
    Write-Host "  • GitHub: https://github.com/new"
    Write-Host "  • GitLab: https://gitlab.com/projects/new"
    Write-Host "  • Bitbucket: https://bitbucket.org/repo/create"
    Write-Host ""
    Read-Host "Press Enter after you've added the remote"
}

# Check if Vercel project is linked
if (-not (Test-Path .vercel/project.json)) {
    Write-Host "⚠️  Vercel project not linked" -ForegroundColor Yellow
    Write-Host "Linking to Vercel project..."
    vercel link
} else {
    Write-Host "✅ Vercel project linked" -ForegroundColor Green
}

# Get project details
$projectConfig = Get-Content .vercel/project.json | ConvertFrom-Json
$projectId = $projectConfig.projectId
$orgId = $projectConfig.orgId

Write-Host ""
Write-Host "📋 Project Configuration" -ForegroundColor Cyan
Write-Host "Project ID: $projectId"
Write-Host "Organization ID: $orgId"
Write-Host ""

# Check environment variables
Write-Host "🔐 Checking Environment Variables" -ForegroundColor Cyan

$requiredVars = @(
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "OPENAI_API_KEY"
)

Write-Host "Checking Vercel environment variables..."
foreach ($var in $requiredVars) {
    $envCheck = vercel env ls production 2>&1 | Select-String $var
    if ($envCheck) {
        Write-Host "✅ $var is set" -ForegroundColor Green
    } else {
        Write-Host "❌ $var is missing" -ForegroundColor Red
        Write-Host "   Add it with: vercel env add $var production" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🔧 Setup GitHub Secrets" -ForegroundColor Cyan
Write-Host "To enable GitHub Actions deployment, add these secrets to your repository:"
Write-Host ""
Write-Host "1. Go to: https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions"
Write-Host "2. Add the following secrets:"
Write-Host ""
Write-Host "   VERCEL_TOKEN" -ForegroundColor Yellow
Write-Host "   Get it from: https://vercel.com/account/tokens"
Write-Host ""
Write-Host "   VERCEL_ORG_ID: $orgId" -ForegroundColor Yellow
Write-Host ""
Write-Host "   VERCEL_PROJECT_ID: $projectId" -ForegroundColor Yellow
Write-Host ""

Read-Host "Press Enter when you've added the GitHub secrets"

# Push to remote if not already pushed
$currentBranch = git branch --show-current
$remoteBranch = git ls-remote --heads origin $currentBranch 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Branch '$currentBranch' not pushed to remote" -ForegroundColor Yellow
    $push = Read-Host "Push to remote now? (y/n)"
    if ($push -eq 'y' -or $push -eq 'Y') {
        git push -u origin $currentBranch
        Write-Host "✅ Pushed to remote" -ForegroundColor Green
    }
} else {
    Write-Host "✅ Branch '$currentBranch' is up to date with remote" -ForegroundColor Green
}

Write-Host ""
Write-Host "🔗 Connecting Vercel to Git" -ForegroundColor Cyan
Write-Host ""
Write-Host "Now, connect your Vercel project to your Git repository:"
Write-Host ""
Write-Host "1. Go to: https://vercel.com/dashboard"
Write-Host "2. Select your project: skincare-companion"
Write-Host "3. Go to Settings → Git"
Write-Host "4. Click 'Connect Git Repository'"
Write-Host "5. Select your repository"
Write-Host "6. Configure:"
Write-Host "   - Production Branch: $currentBranch"
Write-Host "   - Framework: Next.js"
Write-Host "   - Build Command: npm run build"
Write-Host "   - Output Directory: .next"
Write-Host ""
Read-Host "Press Enter when you've connected the repository"

Write-Host ""
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Your automatic deployment workflow is now active:"
Write-Host ""
Write-Host "• Every push to $currentBranch → Production deployment"
Write-Host "• Every push to other branches → Preview deployment"
Write-Host "• Every pull request → Preview deployment with comment"
Write-Host ""
Write-Host "Test it by making a change and pushing:"
Write-Host "  git add ."
Write-Host "  git commit -m 'test: Verify auto-deployment'"
Write-Host "  git push"
Write-Host ""
Write-Host "Monitor deployments:"
Write-Host "  vercel ls"
Write-Host "  vercel logs [deployment-url]"
Write-Host ""
Write-Host "For more information, see: VERCEL_AUTO_DEPLOY.md"


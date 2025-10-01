#!/bin/bash

# Vercel Auto-Deploy Setup Script
# This script helps set up automatic deployments to Vercel

set -e

echo "🚀 Vercel Auto-Deploy Setup"
echo "============================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if git is initialized
if [ ! -d .git ]; then
    echo -e "${RED}❌ Git repository not found${NC}"
    echo "Please initialize git first: git init"
    exit 1
fi

echo -e "${GREEN}✅ Git repository found${NC}"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not found${NC}"
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

echo -e "${GREEN}✅ Vercel CLI found${NC}"

# Check if remote repository is configured
if ! git remote get-url origin &> /dev/null; then
    echo -e "${YELLOW}⚠️  No git remote configured${NC}"
    echo ""
    echo "Please add a remote repository:"
    echo "  git remote add origin <your-repo-url>"
    echo ""
    echo "Create a repository on:"
    echo "  • GitHub: https://github.com/new"
    echo "  • GitLab: https://gitlab.com/projects/new"
    echo "  • Bitbucket: https://bitbucket.org/repo/create"
    echo ""
    read -p "Press Enter after you've added the remote..."
fi

REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")
if [ -n "$REMOTE_URL" ]; then
    echo -e "${GREEN}✅ Git remote configured: $REMOTE_URL${NC}"
fi

# Check if Vercel project is linked
if [ ! -f .vercel/project.json ]; then
    echo -e "${YELLOW}⚠️  Vercel project not linked${NC}"
    echo "Linking to Vercel project..."
    vercel link
else
    echo -e "${GREEN}✅ Vercel project linked${NC}"
fi

# Get project details
PROJECT_ID=$(node -p "require('./.vercel/project.json').projectId" 2>/dev/null || echo "")
ORG_ID=$(node -p "require('./.vercel/project.json').orgId" 2>/dev/null || echo "")

echo ""
echo -e "${BLUE}📋 Project Configuration${NC}"
echo "Project ID: $PROJECT_ID"
echo "Organization ID: $ORG_ID"
echo ""

# Check environment variables
echo -e "${BLUE}🔐 Checking Environment Variables${NC}"

REQUIRED_VARS=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "OPENAI_API_KEY"
)

echo "Checking Vercel environment variables..."
for var in "${REQUIRED_VARS[@]}"; do
    if vercel env ls production | grep -q "$var"; then
        echo -e "${GREEN}✅ $var is set${NC}"
    else
        echo -e "${RED}❌ $var is missing${NC}"
        echo "   Add it with: vercel env add $var production"
    fi
done

echo ""
echo -e "${BLUE}🔧 Setup GitHub Secrets${NC}"
echo "To enable GitHub Actions deployment, add these secrets to your repository:"
echo ""
echo "1. Go to: https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions"
echo "2. Add the following secrets:"
echo ""
echo "   VERCEL_TOKEN"
echo "   Get it from: https://vercel.com/account/tokens"
echo ""
echo "   VERCEL_ORG_ID: $ORG_ID"
echo ""
echo "   VERCEL_PROJECT_ID: $PROJECT_ID"
echo ""

read -p "Press Enter when you've added the GitHub secrets..."

# Push to remote if not already pushed
CURRENT_BRANCH=$(git branch --show-current)
if ! git ls-remote --exit-code --heads origin "$CURRENT_BRANCH" &> /dev/null; then
    echo -e "${YELLOW}⚠️  Branch '$CURRENT_BRANCH' not pushed to remote${NC}"
    read -p "Push to remote now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git push -u origin "$CURRENT_BRANCH"
        echo -e "${GREEN}✅ Pushed to remote${NC}"
    fi
else
    echo -e "${GREEN}✅ Branch '$CURRENT_BRANCH' is up to date with remote${NC}"
fi

echo ""
echo -e "${BLUE}🔗 Connecting Vercel to Git${NC}"
echo ""
echo "Now, connect your Vercel project to your Git repository:"
echo ""
echo "1. Go to: https://vercel.com/dashboard"
echo "2. Select your project: skincare-companion"
echo "3. Go to Settings → Git"
echo "4. Click 'Connect Git Repository'"
echo "5. Select your repository: $REMOTE_URL"
echo "6. Configure:"
echo "   - Production Branch: $CURRENT_BRANCH"
echo "   - Framework: Next.js"
echo "   - Build Command: npm run build"
echo "   - Output Directory: .next"
echo ""
read -p "Press Enter when you've connected the repository..."

echo ""
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo ""
echo "Your automatic deployment workflow is now active:"
echo ""
echo "• Every push to $CURRENT_BRANCH → Production deployment"
echo "• Every push to other branches → Preview deployment"
echo "• Every pull request → Preview deployment with comment"
echo ""
echo "Test it by making a change and pushing:"
echo "  git add ."
echo "  git commit -m 'test: Verify auto-deployment'"
echo "  git push"
echo ""
echo "Monitor deployments:"
echo "  vercel ls"
echo "  vercel logs <deployment-url>"
echo ""
echo "For more information, see: VERCEL_AUTO_DEPLOY.md"

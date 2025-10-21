#!/bin/bash

# OpenAsApp Deployment Script
# This script helps you deploy to GitHub (Vercel needs manual setup)

echo "🚀 OpenAsApp Deployment Helper"
echo "================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in project directory"
    echo "Please run this from /c/Users/scott/Claude_Code/OpenAsApp_App"
    exit 1
fi

echo "✓ Found project directory"
echo ""

# Check git status
echo "📊 Checking Git status..."
git status --short
echo ""

# Get GitHub username
echo "📝 GitHub Setup"
echo "==============="
echo ""
read -p "Enter your GitHub username: " GITHUB_USER

if [ -z "$GITHUB_USER" ]; then
    echo "❌ GitHub username required"
    exit 1
fi

echo ""
echo "Your repository URL will be:"
echo "https://github.com/$GITHUB_USER/openasapp-quote-system"
echo ""
read -p "Is this correct? (y/n): " CONFIRM

if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "Cancelled"
    exit 0
fi

# Add remote
echo ""
echo "🔗 Adding GitHub remote..."
git remote remove origin 2>/dev/null  # Remove if exists
git remote add origin "https://github.com/$GITHUB_USER/openasapp-quote-system.git"

if [ $? -eq 0 ]; then
    echo "✓ Remote added successfully"
else
    echo "❌ Failed to add remote"
    exit 1
fi

# Rename branch
echo ""
echo "📝 Renaming branch to 'main'..."
git branch -M main
echo "✓ Branch renamed"

# Show what will be pushed
echo ""
echo "📦 Ready to push these commits:"
git log --oneline -5
echo ""

read -p "Push to GitHub now? (y/n): " PUSH_CONFIRM

if [ "$PUSH_CONFIRM" = "y" ] || [ "$PUSH_CONFIRM" = "Y" ]; then
    echo ""
    echo "⬆️  Pushing to GitHub..."
    git push -u origin main

    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ SUCCESS! Code pushed to GitHub"
        echo ""
        echo "🌐 View your repository at:"
        echo "https://github.com/$GITHUB_USER/openasapp-quote-system"
        echo ""
        echo "📋 Next Steps:"
        echo "1. Go to https://vercel.com/new"
        echo "2. Import your GitHub repository"
        echo "3. Add environment variables (see DEPLOY_EVERYTHING.md)"
        echo "4. Deploy!"
        echo ""
        echo "📖 Full instructions: Read DEPLOY_EVERYTHING.md"
    else
        echo ""
        echo "❌ Push failed"
        echo ""
        echo "Possible reasons:"
        echo "1. Repository doesn't exist on GitHub yet"
        echo "   → Create it at: https://github.com/new"
        echo "2. Authentication failed"
        echo "   → You may need to set up a personal access token"
        echo "3. Wrong repository name or username"
        echo ""
        echo "After fixing, try:"
        echo "git push -u origin main"
    fi
else
    echo ""
    echo "Push cancelled. When ready, run:"
    echo "git push -u origin main"
fi

echo ""
echo "📖 For complete deployment guide, read:"
echo "DEPLOY_EVERYTHING.md"

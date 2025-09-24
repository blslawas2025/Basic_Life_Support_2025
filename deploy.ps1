# Auto Deploy Script for Vercel
# This script will commit, push, and deploy changes automatically

param(
    [Parameter(Mandatory=$true)]
    [string]$Message
)

Write-Host "🚀 Starting Auto Deploy Process..." -ForegroundColor Green

# Step 1: Check git status
Write-Host "📋 Checking git status..." -ForegroundColor Yellow
git status

# Step 2: Add all changes
Write-Host "➕ Adding all changes..." -ForegroundColor Yellow
git add .

# Step 3: Commit with message
Write-Host "💾 Committing changes with message: $Message" -ForegroundColor Yellow
git commit -m $Message

# Step 4: Push to GitHub
Write-Host "📤 Pushing to GitHub..." -ForegroundColor Yellow
git push origin master

# Step 5: Confirm deployment
Write-Host "✅ Changes pushed to GitHub!" -ForegroundColor Green
Write-Host "🔄 Vercel will automatically deploy the changes..." -ForegroundColor Cyan
Write-Host "⏱️  Please wait 2-3 minutes for deployment to complete" -ForegroundColor Cyan
Write-Host "🌐 Check your Vercel dashboard for deployment status" -ForegroundColor Cyan

Write-Host "`n🎉 Auto Deploy Complete!" -ForegroundColor Green

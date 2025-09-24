@echo off
REM Auto Deploy Script for Vercel
REM This script will commit, push, and deploy changes automatically

if "%~1"=="" (
    echo Usage: deploy.bat "Your commit message"
    echo Example: deploy.bat "Add new feature"
    exit /b 1
)

echo Starting Auto Deploy Process...

REM Step 1: Check git status
echo Checking git status...
git status

REM Step 2: Add all changes
echo Adding all changes...
git add .

REM Step 3: Commit with message
echo Committing changes with message: "%~1"
git commit -m "%~1"

REM Step 4: Push to GitHub
echo Pushing to GitHub...
REM Push to master branch per project preference
git push origin master

REM Step 5: Confirm deployment
echo Changes pushed to GitHub!
echo Vercel will automatically deploy the changes...
echo Please wait 2-3 minutes for deployment to complete
echo Check your Vercel dashboard for deployment status

echo.
echo Auto Deploy Complete!
pause

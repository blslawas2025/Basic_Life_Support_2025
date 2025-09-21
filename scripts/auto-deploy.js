// Auto Deploy Script for Vercel
// This script will commit, push, and deploy changes automatically

const { execSync } = require('child_process');

function autoDeploy(message) {
  try {
    console.log('🚀 Starting Auto Deploy Process...');
    
    // Step 1: Check git status
    console.log('📋 Checking git status...');
    execSync('git status', { stdio: 'inherit' });
    
    // Step 2: Add all changes
    console.log('➕ Adding all changes...');
    execSync('git add .', { stdio: 'inherit' });
    
    // Step 3: Commit with message
    console.log(`💾 Committing changes with message: "${message}"`);
    execSync(`git commit -m "${message}"`, { stdio: 'inherit' });
    
    // Step 4: Push to GitHub
    console.log('📤 Pushing to GitHub...');
    execSync('git push origin master', { stdio: 'inherit' });
    
    // Step 5: Confirm deployment
    console.log('✅ Changes pushed to GitHub!');
    console.log('🔄 Vercel will automatically deploy the changes...');
    console.log('⏱️  Please wait 2-3 minutes for deployment to complete');
    console.log('🌐 Check your Vercel dashboard for deployment status');
    
    console.log('\n🎉 Auto Deploy Complete!');
    
  } catch (error) {
    console.error('❌ Deploy failed:', error.message);
    process.exit(1);
  }
}

// Get commit message from command line arguments
const message = process.argv[2];

if (!message) {
  console.error('❌ Please provide a commit message');
  console.log('Usage: node scripts/auto-deploy.js "Your commit message"');
  console.log('Example: node scripts/auto-deploy.js "Add new feature"');
  process.exit(1);
}

autoDeploy(message);

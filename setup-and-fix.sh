#!/bin/bash

# Setup and Fix Supabase Categories Script
echo "🚀 Setting up Supabase category fix..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm found: $(npm --version)"

# Copy package.json
echo "📦 Setting up dependencies..."
cp fix-categories-package.json package.json

# Install dependencies
echo "📥 Installing Supabase client..."
npm install

# Make the fix script executable
chmod +x fix-categories.js

echo "🔧 Running category fix..."
node fix-categories.js

echo "✅ Setup and fix completed!"

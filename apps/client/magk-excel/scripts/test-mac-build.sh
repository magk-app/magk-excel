#!/bin/bash

# MAGK Excel Mac Build Test Script
# This script tests the Mac build process on macOS

set -e  # Exit on any error

echo "🚀 Starting MAGK Excel Mac Build Test"
echo "======================================"

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ This script must be run on macOS"
    exit 1
fi

# Check Node.js version
echo "📋 Checking Node.js version..."
NODE_VERSION=$(node --version)
echo "✅ Node.js version: $NODE_VERSION"

# Check npm version
echo "📋 Checking npm version..."
NPM_VERSION=$(npm --version)
echo "✅ npm version: $NPM_VERSION"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Run tests
echo "🧪 Running tests..."
npm test

# Build the application
echo "🔨 Building application..."
npm run build:simple

# Test Mac build
echo "🍎 Building for macOS..."
npm run build:mac

# Check build output
echo "📁 Checking build output..."
if [ -d "release" ]; then
    echo "✅ Release directory created"
    ls -la release/
    
    # Check for Mac artifacts
    if find release -name "*.dmg" -o -name "*.zip" | grep -q .; then
        echo "✅ Mac artifacts found:"
        find release -name "*.dmg" -o -name "*.zip"
    else
        echo "❌ No Mac artifacts found"
        exit 1
    fi
else
    echo "❌ Release directory not found"
    exit 1
fi

# Test running the app
echo "▶️  Testing app launch..."
if [ -f "dist-electron/main.js" ]; then
    echo "✅ Main process file exists"
    # Note: We can't actually launch the app in CI, but we can check the file exists
else
    echo "❌ Main process file not found"
    exit 1
fi

echo "🎉 Mac build test completed successfully!"
echo "=========================================="

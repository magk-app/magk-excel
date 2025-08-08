@echo off
REM MAGK Excel Windows Build Test Script
REM This script tests the Windows build process

echo 🚀 Starting MAGK Excel Windows Build Test
echo ==========================================

REM Check Node.js version
echo 📋 Checking Node.js version...
node --version
if %errorlevel% neq 0 (
    echo ❌ Node.js not found
    exit /b 1
)

REM Check npm version
echo 📋 Checking npm version...
npm --version
if %errorlevel% neq 0 (
    echo ❌ npm not found
    exit /b 1
)

REM Install dependencies
echo 📦 Installing dependencies...
call npm ci
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    exit /b 1
)

REM Run tests
echo 🧪 Running tests...
call npm test
if %errorlevel% neq 0 (
    echo ❌ Tests failed
    exit /b 1
)

REM Build the application
echo 🔨 Building application...
call npm run build:simple
if %errorlevel% neq 0 (
    echo ❌ Build failed
    exit /b 1
)

REM Test Windows build (skip electron-builder due to permission issues)
echo 🪟 Testing Windows build components...
if exist "dist-electron\main.js" (
    echo ✅ Main process file exists
) else (
    echo ❌ Main process file not found
    exit /b 1
)

if exist "dist\index.html" (
    echo ✅ Frontend files exist
) else (
    echo ❌ Frontend files not found
    exit /b 1
)

REM Test running the app
echo ▶️ Testing app launch...
call npm start
if %errorlevel% neq 0 (
    echo ❌ App failed to start
    exit /b 1
)

echo 🎉 Windows build test completed successfully!
echo ==============================================

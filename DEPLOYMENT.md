# 🚀 MAGK Excel Deployment Guide

This guide covers deploying the MAGK Excel application, which consists of:
- **Frontend**: Electron + React + Vite application
- **Backend**: Node.js workflow engine with Hono.js
- **Infrastructure**: AWS services (optional for cloud deployment)

## 📋 Table of Contents
- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
- [Production Deployment](#production-deployment)
  - [Desktop Application (Electron)](#desktop-application-electron)
  - [Web Version](#web-version-optional)
  - [Backend API](#backend-api)
- [Environment Configuration](#environment-configuration)
- [CI/CD Setup](#cicd-setup)
- [Monitoring & Maintenance](#monitoring--maintenance)

## Prerequisites

### Required Tools
```bash
# Node.js 18+ and npm
node --version  # Should be 18.0.0 or higher
npm --version   # Should be 8.0.0 or higher

# Git
git --version

# Python 3.10+ (for server components)
python --version
```

### API Keys Required
- **Anthropic API Key** (for Claude integration)
- **AWS Credentials** (optional, for cloud deployment)
- **Smithery API Key** (optional, for MCP server browser)

## 🏠 Local Development

### 1. Clone and Setup
```bash
# Clone the repository
git clone https://github.com/your-org/magk-excel.git
cd magk-excel

# Install dependencies
npm install
```

### 2. Configure Environment Variables

#### Frontend (.env)
```bash
cd apps/client/magk-excel
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_URL=http://localhost:3001
VITE_SMITHERY_API_KEY=your_smithery_key_here
```

#### Backend (.env)
```bash
cd apps/workflow-engine
cp .env.example .env
```

Edit `.env`:
```env
PORT=3001
ANTHROPIC_API_KEY=your_anthropic_api_key_here
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

### 3. Start Development Servers

```bash
# Terminal 1: Start backend
cd apps/workflow-engine
npm run dev

# Terminal 2: Start frontend
cd apps/client/magk-excel
npm run dev

# Terminal 3: Start Electron (optional)
cd apps/client/magk-excel
npm run electron:dev
```

## 🌐 Production Deployment

## Desktop Application (Electron)

### Building for Distribution

#### Windows
```bash
cd apps/client/magk-excel

# Build for Windows
npm run build:win

# Output: release/[version]/MAGK-Excel-Setup-[version].exe
```

#### macOS
```bash
# Build for macOS
npm run build:mac

# Output: release/[version]/MAGK-Excel-[version].dmg
```

#### Linux
```bash
# Build for Linux
npm run build:linux

# Output: release/[version]/MAGK-Excel-[version].AppImage
```

### Auto-Update Configuration
```json
// electron-builder.json5
{
  "publish": {
    "provider": "github",
    "owner": "your-org",
    "repo": "magk-excel"
  }
}
```

### Code Signing (Windows)
```bash
# Set environment variables before building
export CSC_LINK="path/to/certificate.pfx"
export CSC_KEY_PASSWORD="your_password"
npm run build:win
```

### Code Signing (macOS)
```bash
# Set environment variables
export APPLE_ID="your@email.com"
export APPLE_ID_PASS="app-specific-password"
export APPLE_TEAM_ID="XXXXXXXXXX"
npm run build:mac
```

## Web Version (Optional)

If deploying as a web application without Electron:

### Build Web Version
```bash
cd apps/client/magk-excel

# Build for web
npm run build

# Output: dist/
```

### Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Create `vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ],
  "env": {
    "VITE_API_URL": "@production-api-url"
  }
}
```

### Deploy to Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

Create `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  VITE_API_URL = "https://api.magk-excel.com"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Backend API

### Option 1: Deploy to Railway

```bash
cd apps/workflow-engine

# Install Railway CLI
npm i -g @railway/cli

# Login and initialize
railway login
railway init

# Deploy
railway up
```

### Option 2: Deploy to Render

Create `render.yaml`:
```yaml
services:
  - type: web
    name: magk-excel-api
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: ANTHROPIC_API_KEY
        sync: false
      - key: NODE_ENV
        value: production
      - key: CORS_ORIGIN
        value: https://magk-excel.vercel.app
```

### Option 3: Deploy to AWS Lambda

```bash
cd apps/workflow-engine

# Install Serverless Framework
npm i -g serverless

# Deploy
serverless deploy --stage production
```

Create `serverless.yml`:
```yaml
service: magk-excel-api

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  environment:
    ANTHROPIC_API_KEY: ${env:ANTHROPIC_API_KEY}
    NODE_ENV: production

functions:
  api:
    handler: dist/lambda.handler
    events:
      - httpApi:
          path: /{proxy+}
          method: ANY
      - httpApi:
          path: /
          method: ANY

plugins:
  - serverless-esbuild
  - serverless-offline
```

### Option 4: Deploy to Docker Container

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application files
COPY . .
RUN npm run build

# Expose port
EXPOSE 3001

# Start application
CMD ["npm", "start"]
```

Build and deploy:
```bash
# Build Docker image
docker build -t magk-excel-api .

# Run locally
docker run -p 3001:3001 \
  -e ANTHROPIC_API_KEY=your_key \
  magk-excel-api

# Push to Docker Hub
docker tag magk-excel-api yourusername/magk-excel-api
docker push yourusername/magk-excel-api
```

## 🔧 Environment Configuration

### Production Environment Variables

#### Frontend Production
```env
# .env.production
VITE_API_URL=https://api.magk-excel.com
VITE_SMITHERY_API_KEY=prod_smithery_key
VITE_SENTRY_DSN=your_sentry_dsn
VITE_GA_TRACKING_ID=your_google_analytics_id
```

#### Backend Production
```env
# .env.production
NODE_ENV=production
PORT=3001
ANTHROPIC_API_KEY=your_anthropic_key
CORS_ORIGIN=https://magk-excel.com,https://app.magk-excel.com
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=900000
LOG_LEVEL=info
DATABASE_URL=postgresql://user:pass@host:5432/magk_excel
REDIS_URL=redis://user:pass@host:6379
```

### Security Configuration
```javascript
// apps/workflow-engine/src/middleware/security.ts
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'

export const securityMiddleware = [
  helmet(),
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  })
]
```

## 🔄 CI/CD Setup

### GitHub Actions

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [main]
  release:
    types: [created]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        run: |
          npm i -g @railway/cli
          railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: |
          cd apps/client/magk-excel
          npm ci
          npm run build
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./apps/client/magk-excel

  build-electron:
    needs: test
    if: github.event_name == 'release'
    strategy:
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: |
          cd apps/client/magk-excel
          npm ci
          npm run electron:build
      - uses: softprops/action-gh-release@v1
        with:
          files: apps/client/magk-excel/release/**/*
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## 📊 Monitoring & Maintenance

### Application Monitoring

#### Sentry Setup (Error Tracking)
```javascript
// apps/client/magk-excel/src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [
    new Sentry.BrowserTracing(),
  ],
  tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
});
```

#### Backend Monitoring
```javascript
// apps/workflow-engine/src/index.ts
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

### Health Checks

```javascript
// apps/workflow-engine/src/routes/health.ts
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  })
})

app.get('/ready', async (c) => {
  // Check database connection
  // Check external service availability
  return c.json({ ready: true })
})
```

### Logging

```javascript
// apps/workflow-engine/src/utils/logger.ts
import winston from 'winston'

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
})

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }))
}
```

## 🔒 Security Checklist

- [ ] All API keys stored in environment variables
- [ ] HTTPS enabled for all production endpoints
- [ ] CORS properly configured
- [ ] Rate limiting implemented
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (if using database)
- [ ] XSS protection headers
- [ ] Content Security Policy configured
- [ ] Regular dependency updates
- [ ] Security scanning in CI/CD pipeline

## 📝 Post-Deployment Checklist

- [ ] Verify all environment variables are set
- [ ] Test all API endpoints
- [ ] Verify file upload functionality
- [ ] Test MCP server connections
- [ ] Check error tracking (Sentry)
- [ ] Verify analytics (if configured)
- [ ] Test auto-update (for Electron)
- [ ] Monitor initial performance metrics
- [ ] Set up alerts for errors/downtime
- [ ] Document any deployment-specific configurations

## 🆘 Troubleshooting

### Common Issues

#### Backend won't start
```bash
# Check if port is in use
lsof -i :3001

# Check environment variables
npm run env:check

# Check logs
tail -f logs/error.log
```

#### Frontend can't connect to backend
```bash
# Check CORS configuration
curl -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: X-Requested-With" \
  -X OPTIONS \
  http://localhost:3001/chat
```

#### Electron build fails
```bash
# Clear electron cache
npm run electron:clear-cache

# Rebuild native modules
npm run electron:rebuild
```

## 📚 Additional Resources

- [Electron Builder Documentation](https://www.electron.build/)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Hono.js Documentation](https://hono.dev/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS Lambda with Node.js](https://docs.aws.amazon.com/lambda/latest/dg/lambda-nodejs.html)

## 🤝 Support

For deployment issues:
1. Check the [Issues](https://github.com/your-org/magk-excel/issues) page
2. Review deployment logs in GitHub Actions
3. Contact the development team

---

Last updated: 2025-01-07
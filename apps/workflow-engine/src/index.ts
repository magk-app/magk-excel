import 'dotenv/config';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { chatRoute } from './routes/chat.js';
import { chatV2Route } from './routes/chat-v2.js';
import { extractRoute } from './routes/extract.js';
import { pdfExtractRoute } from './routes/pdf-extract.js';
import { demoRoute } from './routes/demo.js';
import { workflowRoute } from './routes/workflow-generation.js';

const app = new Hono();

// Middleware
app.use('*', cors({
  origin: '*', // Allow all origins for development
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));
app.use('*', logger());

// Health check
app.get('/', (c) => {
  return c.json({ 
    message: 'MAGK Workflow Engine',
    version: '0.1.0',
    status: 'healthy'
  });
});

app.get('/health', (c) => {
  return c.json({ status: 'healthy', service: 'magk-workflow-engine' });
});

// Serve static files from downloads folder
app.use('/downloads/*', serveStatic({
  root: '../client/magk-excel/public',
  rewriteRequestPath: (path) => path
}));

// Mount routes
app.route('/api', chatRoute);  // Legacy chat at /api/chat
app.route('/api/v2', chatV2Route);  // New chat at /api/v2/chat
app.route('', extractRoute);
app.route('/api', pdfExtractRoute);  // PDF extraction at /api/pdf-extract
app.route('', demoRoute);
app.route('/api/workflow', workflowRoute);  // Workflow generation at /api/workflow

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
console.log(`🚀 MAGK Workflow Engine starting on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port
});
import 'dotenv/config';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { chatRoute } from './routes/chat.js';
import { extractRoute } from './routes/extract.js';
import { demoRoute } from './routes/demo.js';

const app = new Hono();

// Middleware
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Electron dev server
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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
app.route('', chatRoute);
app.route('', extractRoute);
app.route('', demoRoute);

const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
console.log(`🚀 MAGK Workflow Engine starting on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port
});
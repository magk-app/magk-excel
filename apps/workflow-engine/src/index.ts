import 'dotenv/config';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import { chatRoute } from './routes/chat.js';
import { extractRoute } from './routes/extract.js';

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

// Mount routes
app.route('', chatRoute);
app.route('', extractRoute);

const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
console.log(`🚀 MAGK Workflow Engine starting on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port
});
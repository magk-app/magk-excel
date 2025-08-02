import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

const app = new Hono();

// Middleware
app.use('*', cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.use('*', logger());

// Health check endpoint
app.get('/', (c) => {
  return c.json({ 
    message: 'MAGK Workflow Engine API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// API routes will be added here
app.get('/health', (c) => {
  return c.json({ 
    status: 'healthy',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// Start server
const port = Number(process.env.PORT) || 8080;

console.log(`🚀 Workflow Engine starting on port ${port}`);
console.log(`📱 Health check: http://localhost:${port}/health`);

// For Bun runtime
if (typeof Bun !== 'undefined') {
  Bun.serve({
    port,
    fetch: app.fetch,
  });
} else {
  // For Node.js runtime with @hono/node-server
  import('@hono/node-server').then(({ serve }) => {
    serve({
      fetch: app.fetch,
      port,
    });
  });
}

export default app;
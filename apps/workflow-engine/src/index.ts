import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { requestLogger } from './middleware';
import { logger as appLogger } from './utils/logger';
import { ValidationError, ExecutionError } from './utils/errors';

const app = new Hono();

// Global error handler
app.onError((err, c) => {
  const requestId = c.get('requestId');
  
  // Log the error
  appLogger.error(`Request failed: ${err.message}`, err, { 
    requestId,
    path: c.req.path,
    method: c.req.method
  });

  // Handle different error types
  if (err instanceof ValidationError) {
    return c.json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        timestamp: new Date().toISOString()
      }
    }, err.statusCode);
  }
  
  if (err instanceof ExecutionError) {
    return c.json({
      error: {
        code: err.code,
        message: err.message,
        stepId: err.stepId,
        details: err.details,
        timestamp: new Date().toISOString()
      }
    }, err.statusCode);
  }

  // Generic error response
  return c.json({
    error: {
      code: 'INTERNAL_ERROR', 
      message: err.message || 'An unexpected error occurred',
      requestId,
      timestamp: new Date().toISOString()
    }
  }, 500);
});

// Request logging with ID generation
app.use('*', requestLogger);

// CORS configuration
app.use('*', cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Basic HTTP logger (for development)
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

// Simple test endpoint
app.get('/test-simple', (c) => {
  return c.json({
    message: 'Error handling is working',
    requestId: c.get('requestId')
  });
});

// Example endpoint to test error handling
app.get('/test-error', (c) => {
  const errorType = c.req.query('type');
  
  // Debug log
  appLogger.info('Test error endpoint called', { errorType });
  
  try {
    if (errorType === 'validation') {
      throw new ValidationError('Invalid input provided', { field: 'test' });
    } else if (errorType === 'workflow') {
      throw new ExecutionError('Workflow step failed', 'step-123');
    } else {
      throw new Error('Generic error for testing');
    }
  } catch (error) {
    appLogger.error('Error in test endpoint', error as Error, { errorType });
    throw error;
  }
});

// 404 handler (must be last)
app.notFound((c) => {
  return c.json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${c.req.path} not found`,
      timestamp: new Date().toISOString()
    }
  }, 404);
});

// Start server
const port = Number(process.env.PORT) || 8080;

appLogger.info(`Workflow Engine starting on port ${port}`, {
  port,
  environment: process.env.NODE_ENV || 'development',
  event: 'server_starting'
});

// For Node.js runtime with @hono/node-server
import('@hono/node-server').then(({ serve }) => {
  serve({
    fetch: app.fetch,
    port,
  });
  appLogger.info(`Server started successfully (Node.js runtime)`, {
    port,
    runtime: 'node',
    healthCheck: `http://localhost:${port}/health`,
    event: 'server_started'
  });
});

export default app;
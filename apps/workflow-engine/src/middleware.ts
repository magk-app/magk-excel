import { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { WorkflowError, formatErrorResponse } from './utils/errors';
import { logger, generateRequestId } from './utils/logger';

/**
 * Request logger middleware - logs all incoming requests and responses
 * Adds a unique request ID to each request for tracing
 */
export async function requestLogger(c: Context, next: Next) {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  // Add request ID to context
  c.set('requestId', requestId);
  
  // Log request
  logger.info(`Request received: ${c.req.method} ${c.req.path}`, {
    requestId,
    method: c.req.method,
    path: c.req.path,
    query: c.req.query(),
    userAgent: c.req.header('user-agent'),
    event: 'request_received'
  });

  try {
    await next();
    
    const duration = Date.now() - startTime;
    const status = c.res.status;
    
    // Log response
    logger.info(`Request completed: ${c.req.method} ${c.req.path}`, {
      requestId,
      method: c.req.method,
      path: c.req.path,
      status,
      duration,
      event: 'request_completed'
    });
    
    // Add request ID to response headers
    c.header('X-Request-ID', requestId);
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error(`Request failed: ${c.req.method} ${c.req.path}`, error as Error, {
      requestId,
      method: c.req.method,
      path: c.req.path,
      duration,
      event: 'request_failed'
    });
    
    throw error;
  }
}

/**
 * Global error handler middleware - catches all errors and formats responses
 * Must be registered first in the middleware chain
 */
export async function errorHandler(c: Context, next: Next): Promise<Response> {
  try {
    await next();
    return c.res;
  } catch (error) {
    const requestId = c.get('requestId');
    
    // Log the error
    if (error instanceof Error) {
      logger.error(`Request failed: ${error.message}`, error, { 
        requestId,
        path: c.req.path,
        method: c.req.method
      });
    }

    // Handle different error types
    if (error instanceof WorkflowError) {
      return c.json(formatErrorResponse(error), error.statusCode as any);
    }
    
    if (error instanceof HTTPException) {
      return c.json({
        error: {
          code: 'HTTP_ERROR',
          message: error.message,
          timestamp: new Date().toISOString()
        }
      }, error.status);
    }

    // Generic error response
    return c.json({
      error: {
        code: 'INTERNAL_ERROR', 
        message: 'An unexpected error occurred',
        requestId,
        timestamp: new Date().toISOString()
      }
    }, 500);
  }
}
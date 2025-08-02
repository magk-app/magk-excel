// Custom error types for the workflow engine

export class WorkflowError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'WORKFLOW_ERROR',
    public details?: any
  ) {
    super(message);
    this.name = 'WorkflowError';
  }
}

export class ValidationError extends WorkflowError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class LLMError extends WorkflowError {
  constructor(message: string, details?: any) {
    super(message, 500, 'LLM_ERROR', details);
    this.name = 'LLMError';
  }
}

export class ExecutionError extends WorkflowError {
  constructor(message: string, public stepId?: string, details?: any) {
    super(message, 500, 'EXECUTION_ERROR', details);
    this.name = 'ExecutionError';
  }
}

export class AuthenticationError extends WorkflowError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class NotFoundError extends WorkflowError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

// Error response formatter
export function formatErrorResponse(error: Error) {
  if (error instanceof WorkflowError) {
    return {
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        timestamp: new Date().toISOString()
      }
    };
  }
  
  // Generic error fallback
  return {
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      timestamp: new Date().toISOString()
    }
  };
}
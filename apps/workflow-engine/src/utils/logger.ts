// Enhanced logging utilities for the workflow engine

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export interface LogContext {
  requestId?: string;
  workflowId?: string;
  stepId?: string;
  userId?: string;
  [key: string]: any;
}

class Logger {
  private formatMessage(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...context
    };
    
    return JSON.stringify(logEntry);
  }

  debug(message: string, context?: LogContext) {
    console.log(this.formatMessage(LogLevel.DEBUG, message, context));
  }

  info(message: string, context?: LogContext) {
    console.log(this.formatMessage(LogLevel.INFO, message, context));
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.formatMessage(LogLevel.WARN, message, context));
  }

  error(message: string, error?: Error, context?: LogContext) {
    const errorContext = {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    };
    console.error(this.formatMessage(LogLevel.ERROR, message, errorContext));
  }

  // Workflow-specific logging methods
  workflowStarted(workflowId: string, workflowName: string, context?: LogContext) {
    this.info(`Workflow started: ${workflowName}`, {
      ...context,
      workflowId,
      workflowName,
      event: 'workflow_started'
    });
  }

  workflowCompleted(workflowId: string, duration: number, context?: LogContext) {
    this.info(`Workflow completed in ${duration}ms`, {
      ...context,
      workflowId,
      duration,
      event: 'workflow_completed'
    });
  }

  stepExecuted(workflowId: string, stepId: string, stepName: string, duration: number, context?: LogContext) {
    this.info(`Step executed: ${stepName}`, {
      ...context,
      workflowId,
      stepId,
      stepName,
      duration,
      event: 'step_executed'
    });
  }

  llmRequest(prompt: string, model: string, context?: LogContext) {
    this.debug('LLM request initiated', {
      ...context,
      model,
      promptLength: prompt.length,
      event: 'llm_request'
    });
  }

  selfHealingAttempt(workflowId: string, stepId: string, error: string, attempt: number, context?: LogContext) {
    this.warn(`Self-healing attempt ${attempt} for step ${stepId}`, {
      ...context,
      workflowId,
      stepId,
      error,
      attempt,
      event: 'self_healing_attempt'
    });
  }
}

// Singleton instance
export const logger = new Logger();

// Request ID generator
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
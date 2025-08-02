/**
 * Workflow Execution Models
 * 
 * This module handles:
 * - Execution state tracking with natural language interpretation
 * - Step-by-step progress monitoring
 * - Human confirmation management
 * - Error handling and recovery states
 * - Real-time progress updates
 */

import { z } from 'zod';
import { WorkflowNode } from '../types/frontend-integration.js';

// ============================================================================
// EXECUTION ENUMS AND CONSTANTS
// ============================================================================

/**
 * Overall execution status for the entire workflow
 */
export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  PAUSED = 'paused',
  WAITING_CONFIRMATION = 'waiting_confirmation'
}

/**
 * Individual step execution status
 */
export enum StepExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
  WAITING_CONFIRMATION = 'waiting_confirmation',
  RETRYING = 'retrying'
}

/**
 * Error recovery strategies
 */
export enum ErrorRecoveryStrategy {
  FAIL_IMMEDIATELY = 'fail_immediately',
  RETRY_WITH_SAME_PARAMS = 'retry_with_same_params',
  RETRY_WITH_LLM_FIX = 'retry_with_llm_fix',
  SKIP_STEP = 'skip_step',
  ASK_HUMAN = 'ask_human',
  USE_FALLBACK = 'use_fallback'
}

/**
 * Human confirmation types
 */
export enum ConfirmationType {
  STEP_APPROVAL = 'step_approval',
  PARAMETER_VALIDATION = 'parameter_validation',
  OUTPUT_REVIEW = 'output_review',
  ERROR_RECOVERY = 'error_recovery',
  WORKFLOW_CONTINUE = 'workflow_continue'
}

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

/**
 * Natural Language Progress Schema
 * Provides human-readable updates about execution progress
 */
export const NaturalLanguageProgressSchema = z.object({
  current_activity: z.string().min(10, "Current activity must be descriptive"),
  completed_summary: z.string().min(10, "Completed summary must be informative"),
  next_activity: z.string().min(5, "Next activity description required"),
  overall_progress: z.string().min(5, "Overall progress message required"),
  time_remaining_estimate: z.string().optional(),
  encouragement_message: z.string().optional(),
  warnings: z.array(z.string()).default(() => []),
  user_actionable_items: z.array(z.string()).default(() => [])
});

/**
 * Step Execution Result Schema
 * Captures the outcome of executing a single workflow step
 */
export const StepExecutionResultSchema = z.object({
  status: z.nativeEnum(StepExecutionStatus),
  started_at: z.string().datetime(),
  completed_at: z.string().datetime().optional(),
  duration_ms: z.number().int().min(0).optional(),
  
  // Natural language logging
  natural_log: z.string().min(5, "Natural log entry required"),
  technical_log: z.string().optional(),
  
  // Outputs and context
  outputs: z.record(z.any()).default(() => ({})),
  context_updates: z.record(z.any()).default(() => ({})),
  
  // Error handling
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
    stack_trace: z.string().optional(),
    recovery_attempted: z.boolean().default(false),
    recovery_strategy: z.nativeEnum(ErrorRecoveryStrategy).optional()
  }).optional(),
  
  // Retry information
  retry_count: z.number().int().min(0).default(0),
  max_retries: z.number().int().min(0).default(3),
  
  // Performance metrics
  memory_usage_mb: z.number().positive().optional(),
  cpu_time_ms: z.number().int().min(0).optional(),
  
  // Tool-specific metadata
  tool_metadata: z.record(z.any()).default(() => ({}))
});

/**
 * Human Confirmation Request Schema
 * Manages human-in-the-loop approval points
 */
export const HumanConfirmationSchema = z.object({
  id: z.string().uuid(),
  execution_id: z.string().uuid(),
  step_id: z.string(),
  type: z.nativeEnum(ConfirmationType),
  
  // Request details
  title: z.string().min(5, "Confirmation title required"),
  description: z.string().min(10, "Detailed description required"),
  context: z.record(z.any()).default(() => ({})),
  
  // User interface hints
  options: z.array(z.object({
    id: z.string(),
    label: z.string(),
    description: z.string().optional(),
    action: z.string(), // 'approve', 'reject', 'modify', 'skip'
    style: z.enum(['primary', 'secondary', 'warning', 'danger']).default('secondary')
  })).min(1, "At least one option required"),
  
  // Timing and expiration
  created_at: z.string().datetime(),
  expires_at: z.string().datetime().optional(),
  timeout_action: z.enum(['approve', 'reject', 'pause']).default('pause'),
  
  // Response tracking
  responded_at: z.string().datetime().optional(),
  response: z.object({
    option_id: z.string(),
    user_notes: z.string().optional(),
    modified_parameters: z.record(z.any()).optional()
  }).optional(),
  
  // Priority and urgency
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  blocks_execution: z.boolean().default(true)
});

/**
 * Execution Context Schema
 * Maintains state across workflow execution
 */
export const ExecutionContextSchema = z.object({
  // Variable storage and passing
  variables: z.record(z.any()).default(() => ({})),
  step_outputs: z.record(z.any()).default(() => ({})),
  global_context: z.record(z.any()).default(() => ({})),
  
  // Tool connections and state
  active_connections: z.record(z.any()).default(() => ({})),
  tool_states: z.record(z.any()).default(() => ({})),
  
  // User session information
  user_id: z.string().optional(),
  session_id: z.string().uuid(),
  preferences: z.record(z.any()).default(() => ({})),
  
  // Execution environment
  environment: z.enum(['local', 'cloud', 'hybrid']).default('local'),
  resource_limits: z.object({
    max_memory_mb: z.number().positive().default(512),
    max_cpu_time_ms: z.number().positive().default(300000), // 5 minutes
    max_network_requests: z.number().positive().default(100)
  }).default(() => ({ max_memory_mb: 512, max_cpu_time_ms: 300000, max_network_requests: 100 })),
  
  // Feature flags and capabilities
  features_enabled: z.array(z.string()).default(() => []),
  debug_mode: z.boolean().default(false)
});

/**
 * Main Execution Schema
 * Complete execution state for a workflow
 */
export const ExecutionSchema = z.object({
  execution: z.object({
    // Core identification
    id: z.string().uuid(),
    workflow_id: z.string().uuid(),
    execution_name: z.string().optional(),
    
    // Status and timing
    status: z.nativeEnum(ExecutionStatus),
    started_at: z.string().datetime(),
    completed_at: z.string().datetime().optional(),
    paused_at: z.string().datetime().optional(),
    cancelled_at: z.string().datetime().optional(),
    total_duration_ms: z.number().int().min(0).optional(),
    
    // Current execution state
    current_step: z.string().optional(),
    current_step_index: z.number().int().min(0).default(0),
    
    // Natural language progress interpretation
    natural_language_progress: NaturalLanguageProgressSchema,
    
    // Step-by-step progress tracking
    steps_progress: z.record(StepExecutionResultSchema).default(() => ({})),
    
    // Error handling and recovery
    errors: z.array(z.object({
      step_id: z.string(),
      error_code: z.string(),
      error_message: z.string(),
      timestamp: z.string().datetime(),
      recovery_attempted: z.boolean().default(false),
      recovery_successful: z.boolean().optional()
    })).default(() => []),
    
    // Human confirmation management
    human_confirmations_pending: z.array(HumanConfirmationSchema).default(() => []),
    human_confirmations_completed: z.array(HumanConfirmationSchema).default(() => []),
    
    // Progress metrics
    progress_percentage: z.number().min(0).max(100).default(0),
    estimated_completion_time: z.string().datetime().optional(),
    
    // Execution context
    context: ExecutionContextSchema,
    
    // Performance and resource usage
    performance_metrics: z.object({
      total_memory_used_mb: z.number().min(0).default(0),
      peak_memory_used_mb: z.number().min(0).default(0),
      total_cpu_time_ms: z.number().int().min(0).default(0),
      network_requests_made: z.number().int().min(0).default(0),
      external_api_calls: z.number().int().min(0).default(0)
    }).default(() => ({ total_memory_used_mb: 0, peak_memory_used_mb: 0, total_cpu_time_ms: 0, network_requests_made: 0, external_api_calls: 0 })),
    
    // Workflow execution configuration
    execution_config: z.object({
      parallel_execution: z.boolean().default(false),
      max_parallel_steps: z.number().int().positive().default(3),
      auto_retry_enabled: z.boolean().default(true),
      human_confirmation_timeout_ms: z.number().positive().default(300000), // 5 minutes
      step_timeout_ms: z.number().positive().default(60000), // 1 minute
      debug_logging: z.boolean().default(false)
    }).default(() => ({ parallel_execution: false, max_parallel_steps: 3, auto_retry_enabled: true, human_confirmation_timeout_ms: 300000, step_timeout_ms: 60000, debug_logging: false })),
    
    // Metadata and tracking
    created_by: z.string().optional(),
    tags: z.array(z.string()).default(() => []),
    notes: z.string().optional(),
    parent_execution_id: z.string().uuid().optional(),
    child_executions: z.array(z.string().uuid()).default(() => [])
  })
});

// ============================================================================
// TYPESCRIPT TYPES
// ============================================================================

export type NaturalLanguageProgress = z.infer<typeof NaturalLanguageProgressSchema>;
export type StepExecutionResult = z.infer<typeof StepExecutionResultSchema>;
export type HumanConfirmation = z.infer<typeof HumanConfirmationSchema>;
export type ExecutionContext = z.infer<typeof ExecutionContextSchema>;
export type Execution = z.infer<typeof ExecutionSchema>;

/**
 * Execution creation request
 */
export interface CreateExecutionRequest {
  workflow_id: string;
  execution_name?: string;
  context?: Partial<ExecutionContext>;
  config?: Partial<Execution['execution']['execution_config']>;
  user_id?: string;
}

/**
 * Step execution update for real-time progress
 */
export interface StepExecutionUpdate {
  step_id: string;
  status: StepExecutionStatus;
  progress_percentage?: number;
  natural_update?: string;
  outputs?: Record<string, any>;
  error?: {
    code: string;
    message: string;
    recovery_strategy?: ErrorRecoveryStrategy;
  };
}

/**
 * Human confirmation response
 */
export interface ConfirmationResponse {
  confirmation_id: string;
  option_id: string;
  user_notes?: string;
  modified_parameters?: Record<string, any>;
}

/**
 * Execution summary for reporting and analytics
 */
export interface ExecutionSummary {
  id: string;
  workflow_id: string;
  workflow_name: string;
  status: ExecutionStatus;
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  success_rate: number;
  steps_completed: number;
  steps_total: number;
  errors_count: number;
  human_interventions: number;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculates execution progress based on completed steps
 */
export function calculateExecutionProgress(execution: Execution['execution']): number {
  const totalSteps = Object.keys(execution.steps_progress).length;
  if (totalSteps === 0) return 0;
  
  const completedSteps = Object.values(execution.steps_progress).filter(
    step => step.status === StepExecutionStatus.COMPLETED
  ).length;
  
  return Math.round((completedSteps / totalSteps) * 100);
}

/**
 * Estimates remaining execution time based on average step duration
 */
export function estimateRemainingTime(execution: Execution['execution']): number | null {
  const completedSteps = Object.values(execution.steps_progress).filter(
    step => step.status === StepExecutionStatus.COMPLETED && step.duration_ms
  );
  
  if (completedSteps.length === 0) return null;
  
  const avgStepDuration = completedSteps.reduce((sum, step) => 
    sum + (step.duration_ms || 0), 0
  ) / completedSteps.length;
  
  const remainingSteps = Object.values(execution.steps_progress).filter(
    step => step.status === StepExecutionStatus.PENDING
  ).length;
  
  return Math.round(avgStepDuration * remainingSteps);
}

/**
 * Generates natural language progress update
 */
export function generateProgressUpdate(
  execution: Execution['execution'],
  currentStep?: WorkflowNode
): Partial<NaturalLanguageProgress> {
  const progress = calculateExecutionProgress(execution);
  const remainingTime = estimateRemainingTime(execution);
  
  let currentActivity = "Getting ready to start the workflow...";
  let nextActivity = "Beginning first step";
  let overallProgress = `Just getting started!`;
  
  if (currentStep) {
    currentActivity = `Currently working on: ${currentStep.name}`;
    nextActivity = currentStep.next_steps.length > 0 
      ? `Next up: processing the results` 
      : `Wrapping up the workflow`;
    overallProgress = `${progress}% complete`;
    
    if (remainingTime) {
      const minutes = Math.ceil(remainingTime / 60000);
      overallProgress += ` - about ${minutes} minute${minutes !== 1 ? 's' : ''} remaining`;
    }
  }
  
  return {
    current_activity: currentActivity,
    next_activity: nextActivity,
    overall_progress: overallProgress,
    time_remaining_estimate: remainingTime ? `${remainingTime}ms` : undefined
  };
}

/**
 * Validates execution state consistency
 */
export function validateExecutionState(execution: Execution['execution']): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Check status consistency
  if (execution.status === ExecutionStatus.COMPLETED && !execution.completed_at) {
    errors.push("Completed execution must have completed_at timestamp");
  }
  
  if (execution.status === ExecutionStatus.FAILED && execution.errors.length === 0) {
    errors.push("Failed execution must have at least one error recorded");
  }
  
  // Check progress consistency
  const calculatedProgress = calculateExecutionProgress(execution);
  if (Math.abs(execution.progress_percentage - calculatedProgress) > 5) {
    errors.push(`Progress percentage (${execution.progress_percentage}) doesn't match calculated progress (${calculatedProgress})`);
  }
  
  // Check step status consistency
  for (const [stepId, stepResult] of Object.entries(execution.steps_progress)) {
    if (stepResult.status === StepExecutionStatus.COMPLETED && !stepResult.completed_at) {
      errors.push(`Step ${stepId} marked as completed but missing completed_at timestamp`);
    }
    
    if (stepResult.retry_count > stepResult.max_retries) {
      errors.push(`Step ${stepId} retry count exceeds maximum retries`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Creates a human confirmation request
 */
export function createConfirmationRequest(
  executionId: string,
  stepId: string,
  type: ConfirmationType,
  title: string,
  description: string,
  options: HumanConfirmation['options'] = [
    { id: 'approve', label: 'Approve', action: 'approve', style: 'primary' },
    { id: 'reject', label: 'Reject', action: 'reject', style: 'danger' }
  ]
): HumanConfirmation {
  return {
    id: crypto.randomUUID(),
    execution_id: executionId,
    step_id: stepId,
    type,
    title,
    description,
    context: {},
    options,
    created_at: new Date().toISOString(),
    timeout_action: 'pause',
    priority: 'medium',
    blocks_execution: true
  };
}

// Schemas are already exported at their definition points above
// No need for additional exports here
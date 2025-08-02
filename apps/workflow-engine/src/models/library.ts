/**
 * Workflow Library Models
 * 
 * This module handles:
 * - Workflow storage and organization
 * - Template system for reusable workflows
 * - Search and filtering capabilities
 * - Workflow sharing and collaboration
 * - Version control and history
 * - Analytics and usage tracking
 */

import { z } from 'zod';
import { Workflow } from '../types/frontend-integration.js';
import { ExecutionSummary } from './execution.js';

// ============================================================================
// LIBRARY ENUMS AND CONSTANTS
// ============================================================================

/**
 * Workflow access levels
 */
export enum AccessLevel {
  PRIVATE = 'private',
  SHARED = 'shared',
  PUBLIC = 'public',
  ORGANIZATION = 'organization'
}

/**
 * Template status for lifecycle management
 */
export enum TemplateStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  DEPRECATED = 'deprecated',
  ARCHIVED = 'archived'
}

/**
 * Workflow collection types
 */
export enum CollectionType {
  USER_CREATED = 'user_created',
  TEMPLATE_LIBRARY = 'template_library',
  SHARED_COLLECTION = 'shared_collection',
  ORGANIZATION_LIBRARY = 'organization_library',
  SYSTEM_TEMPLATES = 'system_templates'
}

/**
 * Sort options for workflow listings
 */
export enum SortBy {
  NAME = 'name',
  CREATED_AT = 'created_at',
  UPDATED_AT = 'updated_at',
  USAGE_COUNT = 'usage_count',
  SUCCESS_RATE = 'success_rate',
  RATING = 'rating',
  COMPLEXITY = 'complexity'
}

/**
 * Filter operators for advanced search
 */
export enum FilterOperator {
  EQUALS = 'equals',
  CONTAINS = 'contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  IN = 'in',
  NOT_IN = 'not_in'
}

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

/**
 * Workflow Template Schema
 * Reusable workflow patterns with variable substitution
 */
export const WorkflowTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(3, "Template name must be at least 3 characters"),
  description: z.string().min(10, "Description must be comprehensive"),
  category: z.nativeEnum(WorkflowCategory),
  
  // Template metadata
  status: z.nativeEnum(TemplateStatus).default(TemplateStatus.ACTIVE),
  version: z.string().regex(/^\d+\.\d+(\.\d+)?$/, "Version must be semantic"),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional(),
  
  // Template workflow definition
  workflow_template: z.object({
    name: z.string(),
    description: z.string(),
    natural_language_plan: z.object({
      overview: z.string(),
      steps: z.array(z.string()),
      estimated_time: z.string(),
      human_readable_summary: z.string()
    }),
    json_steps: z.array(z.any()), // Will be validated against WorkflowStep when instantiated
    metadata: z.any() // Will be validated against WorkflowMetadata
  }),
  
  // Template variables for customization
  template_variables: z.record(z.object({
    type: z.enum(['string', 'number', 'boolean', 'url', 'file', 'select']),
    description: z.string(),
    default: z.any().optional(),
    required: z.boolean().default(true),
    validation: z.string().optional(),
    options: z.array(z.string()).optional(), // For select type
    placeholder: z.string().optional(),
    help_text: z.string().optional()
  })).default(() => ({})),
  
  // Usage and analytics
  usage_count: z.number().int().min(0).default(0),
  success_rate: z.number().min(0).max(1).optional(),
  average_execution_time_ms: z.number().int().min(0).optional(),
  
  // Rating and feedback
  rating: z.number().min(0).max(5).default(0),
  rating_count: z.number().int().min(0).default(0),
  reviews: z.array(z.object({
    user_id: z.string(),
    rating: z.number().min(1).max(5),
    comment: z.string().optional(),
    created_at: z.string().datetime()
  })).default(() => []),
  
  // Access control
  created_by: z.string(),
  access_level: z.nativeEnum(AccessLevel).default(AccessLevel.PRIVATE),
  shared_with: z.array(z.string()).default(() => []),
  organization_id: z.string().optional(),
  
  // Categorization and discovery
  tags: z.array(z.string()).default(() => []),
  keywords: z.array(z.string()).default(() => []),
  use_cases: z.array(z.string()).default(() => []),
  
  // Template relationships
  parent_template_id: z.string().uuid().optional(),
  derived_templates: z.array(z.string().uuid()).default(() => []),
  
  // Documentation and help
  documentation: z.object({
    setup_instructions: z.string().optional(),
    usage_examples: z.array(z.string()).default(() => []),
    troubleshooting_tips: z.array(z.string()).default(() => []),
    requirements: z.array(z.string()).default(() => []),
    limitations: z.array(z.string()).default(() => [])
  }).default(() => ({ 
    usage_examples: [], 
    troubleshooting_tips: [], 
    requirements: [], 
    limitations: [] 
  }))
});

/**
 * Workflow Collection Schema
 * Organized groups of workflows and templates
 */
export const WorkflowCollectionSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2, "Collection name must be at least 2 characters"),
  description: z.string().optional(),
  type: z.nativeEnum(CollectionType),
  
  // Collection metadata
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional(),
  created_by: z.string(),
  
  // Contents
  workflows: z.array(z.string().uuid()).default(() => []),
  templates: z.array(z.string().uuid()).default(() => []),
  sub_collections: z.array(z.string().uuid()).default(() => []),
  
  // Organization
  parent_collection_id: z.string().uuid().optional(),
  category: z.nativeEnum(WorkflowCategory).optional(),
  tags: z.array(z.string()).default(() => []),
  
  // Access control
  access_level: z.nativeEnum(AccessLevel).default(AccessLevel.PRIVATE),
  shared_with: z.array(z.string()).default(() => []),
  organization_id: z.string().optional(),
  
  // Display and ordering
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  sort_order: z.number().int().default(0),
  
  // Analytics
  view_count: z.number().int().min(0).default(0),
  workflow_count: z.number().int().min(0).default(0),
  template_count: z.number().int().min(0).default(0)
});

/**
 * Search Query Schema
 * Advanced search and filtering for workflows
 */
export const SearchQuerySchema = z.object({
  // Text search
  query: z.string().optional(),
  search_fields: z.array(z.enum([
    'name', 'description', 'tags', 'keywords', 'category'
  ])).default(() => ['name', 'description', 'tags']),
  
  // Filters
  filters: z.array(z.object({
    field: z.string(),
    operator: z.nativeEnum(FilterOperator),
    value: z.any()
  })).default(() => []),
  
  // Category and type filters
  categories: z.array(z.nativeEnum(WorkflowCategory)).optional(),
  complexity_levels: z.array(z.nativeEnum(WorkflowComplexity)).optional(),
  access_levels: z.array(z.nativeEnum(AccessLevel)).optional(),
  
  // Date range filters
  created_after: z.string().datetime().optional(),
  created_before: z.string().datetime().optional(),
  updated_after: z.string().datetime().optional(),
  updated_before: z.string().datetime().optional(),
  
  // User and organization filters
  created_by: z.array(z.string()).optional(),
  organization_id: z.string().optional(),
  
  // Collection filters
  collection_ids: z.array(z.string().uuid()).optional(),
  exclude_collection_ids: z.array(z.string().uuid()).optional(),
  
  // Sorting
  sort_by: z.nativeEnum(SortBy).default(SortBy.UPDATED_AT),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  
  // Pagination
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().min(0).default(0),
  
  // Additional options
  include_templates: z.boolean().default(true),
  include_workflows: z.boolean().default(true),
  include_archived: z.boolean().default(false)
});

/**
 * Search Result Schema
 */
export const SearchResultSchema = z.object({
  results: z.array(z.object({
    id: z.string().uuid(),
    type: z.enum(['workflow', 'template']),
    name: z.string(),
    description: z.string(),
    category: z.nativeEnum(WorkflowCategory),
    complexity: z.nativeEnum(WorkflowComplexity).optional(),
    tags: z.array(z.string()),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime().optional(),
    created_by: z.string(),
    usage_count: z.number().int().min(0).default(0),
    success_rate: z.number().min(0).max(1).optional(),
    rating: z.number().min(0).max(5).default(0),
    access_level: z.nativeEnum(AccessLevel),
    
    // Search relevance
    relevance_score: z.number().min(0).max(1),
    matched_fields: z.array(z.string()).default(() => []),
    highlight: z.record(z.array(z.string())).optional()
  })),
  
  // Pagination info
  total_count: z.number().int().min(0),
  page_count: z.number().int().min(0),
  current_page: z.number().int().min(0),
  has_next: z.boolean(),
  has_previous: z.boolean(),
  
  // Search metadata
  query_time_ms: z.number().min(0),
  facets: z.record(z.array(z.object({
    value: z.string(),
    count: z.number().int().min(0)
  }))).optional()
});

/**
 * Workflow Analytics Schema
 * Usage statistics and performance metrics
 */
export const WorkflowAnalyticsSchema = z.object({
  workflow_id: z.string().uuid(),
  template_id: z.string().uuid().optional(),
  
  // Usage statistics
  total_executions: z.number().int().min(0).default(0),
  successful_executions: z.number().int().min(0).default(0),
  failed_executions: z.number().int().min(0).default(0),
  success_rate: z.number().min(0).max(1).default(0),
  
  // Performance metrics
  average_execution_time_ms: z.number().min(0).default(0),
  median_execution_time_ms: z.number().min(0).default(0),
  min_execution_time_ms: z.number().min(0).default(0),
  max_execution_time_ms: z.number().min(0).default(0),
  
  // Error analysis
  common_errors: z.array(z.object({
    error_code: z.string(),
    error_message: z.string(),
    occurrence_count: z.number().int().min(0),
    last_occurred: z.string().datetime()
  })).default(() => []),
  
  // User engagement
  unique_users: z.number().int().min(0).default(0),
  repeat_usage_rate: z.number().min(0).max(1).default(0),
  
  // Time-based statistics
  daily_usage: z.record(z.number().int().min(0)).default(() => ({})),
  weekly_usage: z.record(z.number().int().min(0)).default(() => ({})),
  monthly_usage: z.record(z.number().int().min(0)).default(() => ({})),
  
  // Geographic and demographic data
  usage_by_region: z.record(z.number().int().min(0)).default(() => ({})),
  usage_by_organization: z.record(z.number().int().min(0)).default(() => ({})),
  
  // Performance trends
  performance_trend: z.enum(['improving', 'stable', 'degrading']).optional(),
  last_updated: z.string().datetime()
});

// ============================================================================
// TYPESCRIPT TYPES
// ============================================================================

export type WorkflowTemplate = z.infer<typeof WorkflowTemplateSchema>;
export type WorkflowCollection = z.infer<typeof WorkflowCollectionSchema>;
export type SearchQuery = z.infer<typeof SearchQuerySchema>;
export type SearchResult = z.infer<typeof SearchResultSchema>;
export type WorkflowAnalytics = z.infer<typeof WorkflowAnalyticsSchema>;

/**
 * Template instantiation request
 */
export interface InstantiateTemplateRequest {
  template_id: string;
  workflow_name: string;
  workflow_description?: string;
  variable_values: Record<string, any>;
  save_as_workflow?: boolean;
  collection_id?: string;
}

/**
 * Template creation request
 */
export interface CreateTemplateRequest {
  name: string;
  description: string;
  category: WorkflowCategory;
  workflow: Workflow['workflow'];
  template_variables?: Record<string, TemplateVariable>;
  tags?: string[];
  access_level?: AccessLevel;
}

/**
 * Collection creation request
 */
export interface CreateCollectionRequest {
  name: string;
  description?: string;
  type?: CollectionType;
  parent_collection_id?: string;
  access_level?: AccessLevel;
  tags?: string[];
}

/**
 * Bulk operations request
 */
export interface BulkOperationRequest {
  operation: 'delete' | 'move' | 'copy' | 'share' | 'archive';
  target_ids: string[];
  destination_collection_id?: string;
  share_with_users?: string[];
  organization_id?: string;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Validates template variable values against their definitions
 */
export function validateTemplateVariables(
  templateVariables: Record<string, TemplateVariable>,
  values: Record<string, any>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check required variables
  for (const [key, variable] of Object.entries(templateVariables)) {
    if (variable.required && !(key in values)) {
      errors.push(`Required variable '${key}' is missing`);
      continue;
    }
    
    const value = values[key];
    if (value === undefined || value === null) continue;
    
    // Type validation
    switch (variable.type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push(`Variable '${key}' must be a string`);
        }
        break;
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          errors.push(`Variable '${key}' must be a number`);
        }
        break;
      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push(`Variable '${key}' must be a boolean`);
        }
        break;
      case 'url':
        try {
          new URL(value);
        } catch {
          errors.push(`Variable '${key}' must be a valid URL`);
        }
        break;
      case 'select':
        if (variable.options && !variable.options.includes(value)) {
          errors.push(`Variable '${key}' must be one of: ${variable.options.join(', ')}`);
        }
        break;
    }
    
    // Regex validation
    if (variable.validation && typeof value === 'string') {
      const regex = new RegExp(variable.validation);
      if (!regex.test(value)) {
        errors.push(`Variable '${key}' does not match required format`);
      }
    }
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Substitutes template variables in workflow definition
 */
export function instantiateTemplate(
  template: WorkflowTemplate,
  variableValues: Record<string, any>
): Workflow['workflow'] {
  // Deep clone the template workflow
  const workflowStr = JSON.stringify(template.workflow_template);
  
  // Replace template variables with actual values
  let instantiatedStr = workflowStr;
  for (const [key, value] of Object.entries(variableValues)) {
    const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    instantiatedStr = instantiatedStr.replace(pattern, JSON.stringify(value));
  }
  
  const instantiated = JSON.parse(instantiatedStr);
  
  // Add required fields for a complete workflow
  return {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    ...instantiated
  };
}

/**
 * Calculates search relevance score
 */
export function calculateRelevanceScore(
  item: { name: string; description: string; tags: string[] },
  query: string
): number {
  if (!query.trim()) return 0;
  
  const queryLower = query.toLowerCase();
  let score = 0;
  
  // Name match (highest weight)
  if (item.name.toLowerCase().includes(queryLower)) {
    score += 0.5;
    if (item.name.toLowerCase().startsWith(queryLower)) {
      score += 0.2;
    }
  }
  
  // Description match
  if (item.description.toLowerCase().includes(queryLower)) {
    score += 0.2;
  }
  
  // Tag matches
  const matchingTags = item.tags.filter(tag => 
    tag.toLowerCase().includes(queryLower)
  );
  score += Math.min(matchingTags.length * 0.1, 0.3);
  
  return Math.min(score, 1);
}

/**
 * Builds search filters from query parameters
 */
export function buildSearchFilters(query: SearchQuery): any[] {
  const filters: any[] = [];
  
  // Category filters
  if (query.categories?.length) {
    filters.push({
      field: 'category',
      operator: FilterOperator.IN,
      value: query.categories
    });
  }
  
  // Complexity filters
  if (query.complexity_levels?.length) {
    filters.push({
      field: 'metadata.complexity',
      operator: FilterOperator.IN,
      value: query.complexity_levels
    });
  }
  
  // Date range filters
  if (query.created_after) {
    filters.push({
      field: 'created_at',
      operator: FilterOperator.GREATER_THAN,
      value: query.created_after
    });
  }
  
  if (query.created_before) {
    filters.push({
      field: 'created_at',
      operator: FilterOperator.LESS_THAN,
      value: query.created_before
    });
  }
  
  // Add custom filters
  filters.push(...query.filters);
  
  return filters;
}

/**
 * Generates analytics summary for a workflow
 */
export function generateAnalyticsSummary(
  executions: ExecutionSummary[]
): Partial<WorkflowAnalytics> {
  if (executions.length === 0) {
    return {
      total_executions: 0,
      successful_executions: 0,
      failed_executions: 0,
      success_rate: 0,
      average_execution_time_ms: 0
    };
  }
  
  const successful = executions.filter(e => e.success_rate === 1);
  const failed = executions.filter(e => e.success_rate === 0);
  const executionTimes = executions
    .filter(e => e.duration_ms)
    .map(e => e.duration_ms!);
  
  return {
    total_executions: executions.length,
    successful_executions: successful.length,
    failed_executions: failed.length,
    success_rate: successful.length / executions.length,
    average_execution_time_ms: executionTimes.length > 0 
      ? Math.round(executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length)
      : 0,
    unique_users: new Set(executions.map(e => e.workflow_id)).size
  };
}

// Schemas are already exported at their definition points above
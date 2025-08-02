/**
 * TypeScript interfaces for MAGK Excel workflow nodes
 * Supports real-time status updates and Excel-specific operations
 */

import { Node } from 'reactflow';

// Node execution status
export type NodeStatus = 'pending' | 'running' | 'completed' | 'error' | 'paused';

// Enum for constants when needed
export enum NodeStatusEnum {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  ERROR = 'error',
  PAUSED = 'paused'
}

// Node types for Excel workflows
export type NodeType = 'web-scraping' | 'pdf-extraction' | 'excel-input' | 'api-fetch' | 'filter' | 'transform' | 'merge' | 'validation' | 'excel-export' | 'preview' | 'data-cleaner' | 'conditional' | 'scheduler' | 'email-sender' | 'file-watcher';

// Enum for constants when needed
export enum NodeTypeEnum {
  WEB_SCRAPING = 'web-scraping',     // Extract data from websites
  PDF_EXTRACTION = 'pdf-extraction', // Extract tables from PDFs
  EXCEL_INPUT = 'excel-input',       // Read existing Excel files
  API_FETCH = 'api-fetch',           // Fetch data from REST APIs
  FILTER = 'filter',                 // Apply filters to data
  TRANSFORM = 'transform',           // Map, clean, restructure data
  MERGE = 'merge',                   // Combine multiple data sources
  VALIDATION = 'validation',         // Check data quality and format
  EXCEL_EXPORT = 'excel-export',     // Write to Excel files with formatting
  PREVIEW = 'preview',               // Show data preview
  DATA_CLEANER = 'data-cleaner',     // Clean and standardize data
  CONDITIONAL = 'conditional',       // Conditional logic branching
  SCHEDULER = 'scheduler',           // Schedule workflow execution
  EMAIL_SENDER = 'email-sender',     // Send emails with attachments
  FILE_WATCHER = 'file-watcher'      // Monitor file system changes
}

// Progress information for real-time updates
export interface NodeProgress {
  current: number;
  total: number;
  percentage?: number; // 0-100
  message?: string;
  startTime?: Date;
  estimatedCompletion?: Date;
  estimatedTimeRemaining?: number; // in seconds
  throughputRate?: number; // items per second
  stages?: ProgressStage[];
}

// Individual progress stage
export interface ProgressStage {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress?: number; // 0-100
  message?: string;
}

// Base configuration for all nodes
export interface BaseNodeConfig {
  id: string;
  name: string;
  description?: string;
  timeout?: number; // in seconds
  retryAttempts?: number;
}

// Web scraping node configuration
export interface WebScrapingConfig extends BaseNodeConfig {
  url: string;
  selector?: string;
  waitForElement?: string;
  extractFormat: 'table' | 'list' | 'text' | 'structured';
  useFirecrawl?: boolean;
}

// PDF extraction node configuration
export interface PdfExtractionConfig extends BaseNodeConfig {
  filePath: string;
  pages?: number[]; // specific pages to extract, empty = all
  tableDetection: 'auto' | 'manual';
  extractFormat: 'table' | 'text';
}

// Excel input node configuration
export interface ExcelInputConfig extends BaseNodeConfig {
  filePath: string;
  sheetName?: string;
  range?: string; // A1:Z100 format
  hasHeaders: boolean;
}

// API fetch node configuration
export interface ApiFetchConfig extends BaseNodeConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
  responseFormat: 'json' | 'xml' | 'csv' | 'text';
  authentication?: {
    type: 'none' | 'basic' | 'bearer' | 'api-key';
    credentials?: Record<string, string>;
  };
  rateLimit?: {
    requestsPerSecond: number;
    burstLimit: number;
  };
}

// Data transformation node configuration
export interface TransformConfig extends BaseNodeConfig {
  operations: TransformOperation[];
}

// Transform operation definition
export interface TransformOperation {
  type: 'map' | 'filter' | 'sort' | 'group' | 'aggregate' | 'rename' | 'calculate';
  field?: string;
  expression?: string;
  newField?: string;
  condition?: string;
  parameters?: Record<string, unknown>;
}

// Filter node configuration
export interface FilterConfig extends BaseNodeConfig {
  conditions: FilterCondition[];
  operator: 'AND' | 'OR';
}

// Filter condition definition
export interface FilterCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'starts_with' | 'ends_with' | 'is_empty' | 'is_not_empty';
  value: string | number | boolean | Date;
  caseSensitive?: boolean;
}

// Merge node configuration
export interface MergeConfig extends BaseNodeConfig {
  strategy: 'inner' | 'left' | 'right' | 'outer' | 'union';
  joinKeys: Array<{
    leftField: string;
    rightField: string;
  }>;
  conflictResolution: 'left' | 'right' | 'combine' | 'error';
}

// Validation node configuration
export interface ValidationConfig extends BaseNodeConfig {
  rules: ValidationRule[];
  onError: 'stop' | 'skip' | 'mark' | 'continue';
}

// Validation rule definition
export interface ValidationRule {
  field: string;
  type: 'required' | 'type' | 'range' | 'pattern' | 'custom';
  parameters?: Record<string, unknown>;
  message?: string;
  severity: 'error' | 'warning' | 'info';
}

// Preview node configuration
export interface PreviewConfig extends BaseNodeConfig {
  maxRows: number;
  columns?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Data cleaner node configuration
export interface DataCleanerConfig extends BaseNodeConfig {
  operations: CleaningOperation[];
}

// Cleaning operation definition
export interface CleaningOperation {
  type: 'trim' | 'normalize_case' | 'remove_duplicates' | 'fill_missing' | 'standardize_format';
  field?: string;
  parameters?: Record<string, unknown>;
}

// Conditional node configuration
export interface ConditionalConfig extends BaseNodeConfig {
  condition: string;
  trueOutput: string;
  falseOutput: string;
}

// Scheduler node configuration
export interface SchedulerConfig extends BaseNodeConfig {
  schedule: {
    type: 'cron' | 'interval';
    expression: string;
    timezone?: string;
  };
  enabled: boolean;
}

// Email sender node configuration
export interface EmailSenderConfig extends BaseNodeConfig {
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  email: {
    from: string;
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    body: string;
    attachments?: string[];
  };
}

// File watcher node configuration
export interface FileWatcherConfig extends BaseNodeConfig {
  path: string;
  pattern?: string;
  events: Array<'add' | 'change' | 'unlink'>;
  recursive: boolean;
}

// Excel export node configuration
export interface ExcelExportConfig extends BaseNodeConfig {
  outputPath: string;
  sheetName: string;
  formatting?: {
    headerStyle?: Record<string, unknown>;
    cellStyle?: Record<string, unknown>;
    autoWidth?: boolean;
    freeze?: string; // A1 format for freeze panes
  };
  append?: boolean;
}

// Union type for all node configurations
export type NodeConfig = 
  | WebScrapingConfig
  | PdfExtractionConfig
  | ExcelInputConfig
  | ApiFetchConfig
  | TransformConfig
  | ExcelExportConfig
  | FilterConfig
  | MergeConfig
  | ValidationConfig
  | PreviewConfig
  | DataCleanerConfig
  | ConditionalConfig
  | SchedulerConfig
  | EmailSenderConfig
  | FileWatcherConfig
  | BaseNodeConfig;

// Enhanced workflow node data
export interface WorkflowNodeData {
  type: NodeType;
  config: NodeConfig;
  status: NodeStatus;
  progress?: NodeProgress;
  result?: NodeResult;
  error?: NodeError;
  logs?: NodeLog[];
  metadata?: NodeMetadata;
  validation?: NodeValidationResult;
  theme?: Partial<NodeTheme>;
}

// Node execution result
export interface NodeResult {
  data?: Record<string, unknown>;
  rowCount?: number;
  columnCount?: number;
  schema?: DataSchema;
  preview?: unknown[];
  statistics?: DataStatistics;
}

// Enhanced error information
export interface NodeError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
  stack?: string;
  timestamp?: Date;
  recoverable?: boolean;
  suggestions?: string[];
}

// Error codes for better error handling
export enum ErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  INVALID_CONFIG = 'INVALID_CONFIG',
  DATA_VALIDATION_FAILED = 'DATA_VALIDATION_FAILED',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  PARSE_ERROR = 'PARSE_ERROR',
  MEMORY_LIMIT_EXCEEDED = 'MEMORY_LIMIT_EXCEEDED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// Enhanced logging
export interface NodeLog {
  timestamp: Date;
  level: LogLevel;
  message: string;
  category?: string;
  details?: Record<string, unknown>;
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

// Enhanced metadata
export interface NodeMetadata {
  executionTime?: number; // in milliseconds
  rowsProcessed?: number;
  memoryUsage?: number; // in bytes
  lastExecuted?: Date;
  version?: string;
  dependencies?: string[];
  performance?: PerformanceMetrics;
}

// Performance metrics
export interface PerformanceMetrics {
  cpuUsage?: number; // percentage
  memoryPeak?: number; // bytes
  diskIO?: number; // bytes
  networkIO?: number; // bytes
  cacheHitRate?: number; // percentage
}

// Data schema definition
export interface DataSchema {
  fields: SchemaField[];
  primaryKey?: string[];
  foreignKeys?: ForeignKey[];
}

export interface SchemaField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
  nullable: boolean;
  unique?: boolean;
  format?: string;
  description?: string;
}

export interface ForeignKey {
  fields: string[];
  referencedTable: string;
  referencedFields: string[];
}

// Data statistics
export interface DataStatistics {
  totalRows: number;
  totalColumns: number;
  nullValues: number;
  duplicateRows: number;
  memorySize: number;
  columnStats?: Record<string, ColumnStatistics>;
}

export interface ColumnStatistics {
  name: string;
  type: string;
  nullCount: number;
  uniqueCount: number;
  min?: number | string | Date;
  max?: number | string | Date;
  avg?: number;
  median?: number;
  mode?: unknown;
}

// Node validation result
export interface NodeValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: ValidationSuggestion[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error';
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
  severity: 'warning';
}

export interface ValidationSuggestion {
  field: string;
  message: string;
  action: string;
  severity: 'info';
}

// React Flow node with workflow data
export interface WorkflowNode extends Node {
  type: NodeType;
  data: WorkflowNodeData;
}

// Enhanced edge for workflow connections
export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  data?: {
    dataSchema?: Record<string, unknown>; // Schema of data flowing through this edge
    sampleData?: Record<string, unknown>; // Sample data for preview
  };
}

// Complete workflow definition
export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  status: 'draft' | 'ready' | 'running' | 'completed' | 'error';
  metadata: {
    created: Date;
    modified: Date;
    author?: string;
    tags: string[];
    category: string;
    estimatedDuration?: number; // in minutes
  };
  executionHistory?: Array<{
    timestamp: Date;
    status: NodeStatus;
    duration: number;
    results?: Record<string, unknown>;
  }>;
}

// Real-time workflow execution events
export interface WorkflowEvent {
  type: 'node_started' | 'node_progress' | 'node_completed' | 'node_error' | 'workflow_completed';
  workflowId: string;
  nodeId?: string;
  timestamp: Date;
  data?: Record<string, unknown>;
}

// Node visual theme configuration
export interface NodeTheme {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  iconColor: string;
  statusColors: Record<NodeStatus, string>;
}

// Visual configuration for different node types
export const NODE_THEMES: Record<NodeType, NodeTheme> = {
  'web-scraping': {
    backgroundColor: 'hsl(var(--primary))',
    borderColor: 'hsl(var(--primary))',
    textColor: 'hsl(var(--primary-foreground))',
    iconColor: 'hsl(var(--primary-foreground))',
    statusColors: {
      pending: 'hsl(var(--muted))',
      running: 'hsl(var(--warning))',
      completed: 'hsl(var(--success))',
      error: 'hsl(var(--destructive))',
      paused: 'hsl(var(--secondary))'
    }
  },
  'pdf-extraction': {
    backgroundColor: 'hsl(var(--secondary))',
    borderColor: 'hsl(var(--secondary))',
    textColor: 'hsl(var(--secondary-foreground))',
    iconColor: 'hsl(var(--secondary-foreground))',
    statusColors: {
      pending: 'hsl(var(--muted))',
      running: 'hsl(var(--warning))',
      completed: 'hsl(var(--success))',
      error: 'hsl(var(--destructive))',
      paused: 'hsl(var(--secondary))'
    }
  },
  'excel-input': {
    backgroundColor: 'hsl(142 76% 36%)',
    borderColor: 'hsl(142 76% 36%)',
    textColor: 'hsl(var(--primary-foreground))',
    iconColor: 'hsl(var(--primary-foreground))',
    statusColors: {
      pending: 'hsl(var(--muted))',
      running: 'hsl(var(--warning))',
      completed: 'hsl(var(--success))',
      error: 'hsl(var(--destructive))',
      paused: 'hsl(var(--secondary))'
    }
  },
  'api-fetch': {
    backgroundColor: 'hsl(217 91% 60%)',
    borderColor: 'hsl(217 91% 60%)',
    textColor: 'hsl(var(--primary-foreground))',
    iconColor: 'hsl(var(--primary-foreground))',
    statusColors: {
      pending: 'hsl(var(--muted))',
      running: 'hsl(var(--warning))',
      completed: 'hsl(var(--success))',
      error: 'hsl(var(--destructive))',
      paused: 'hsl(var(--secondary))'
    }
  },
  'filter': {
    backgroundColor: 'hsl(47 96% 53%)',
    borderColor: 'hsl(47 96% 53%)',
    textColor: 'hsl(var(--foreground))',
    iconColor: 'hsl(var(--foreground))',
    statusColors: {
      pending: 'hsl(var(--muted))',
      running: 'hsl(var(--warning))',
      completed: 'hsl(var(--success))',
      error: 'hsl(var(--destructive))',
      paused: 'hsl(var(--secondary))'
    }
  },
  'transform': {
    backgroundColor: 'hsl(280 100% 70%)',
    borderColor: 'hsl(280 100% 70%)',
    textColor: 'hsl(var(--primary-foreground))',
    iconColor: 'hsl(var(--primary-foreground))',
    statusColors: {
      pending: 'hsl(var(--muted))',
      running: 'hsl(var(--warning))',
      completed: 'hsl(var(--success))',
      error: 'hsl(var(--destructive))',
      paused: 'hsl(var(--secondary))'
    }
  },
  'merge': {
    backgroundColor: 'hsl(24 70% 56%)',
    borderColor: 'hsl(24 70% 56%)',
    textColor: 'hsl(var(--primary-foreground))',
    iconColor: 'hsl(var(--primary-foreground))',
    statusColors: {
      pending: 'hsl(var(--muted))',
      running: 'hsl(var(--warning))',
      completed: 'hsl(var(--success))',
      error: 'hsl(var(--destructive))',
      paused: 'hsl(var(--secondary))'
    }
  },
  'validation': {
    backgroundColor: 'hsl(142 76% 36%)',
    borderColor: 'hsl(142 76% 36%)',
    textColor: 'hsl(var(--primary-foreground))',
    iconColor: 'hsl(var(--primary-foreground))',
    statusColors: {
      pending: 'hsl(var(--muted))',
      running: 'hsl(var(--warning))',
      completed: 'hsl(var(--success))',
      error: 'hsl(var(--destructive))',
      paused: 'hsl(var(--secondary))'
    }
  },
  'excel-export': {
    backgroundColor: 'hsl(142 76% 36%)',
    borderColor: 'hsl(142 76% 36%)',
    textColor: 'hsl(var(--primary-foreground))',
    iconColor: 'hsl(var(--primary-foreground))',
    statusColors: {
      pending: 'hsl(var(--muted))',
      running: 'hsl(var(--warning))',
      completed: 'hsl(var(--success))',
      error: 'hsl(var(--destructive))',
      paused: 'hsl(var(--secondary))'
    }
  },
  'preview': {
    backgroundColor: 'hsl(var(--muted))',
    borderColor: 'hsl(var(--border))',
    textColor: 'hsl(var(--muted-foreground))',
    iconColor: 'hsl(var(--muted-foreground))',
    statusColors: {
      pending: 'hsl(var(--muted))',
      running: 'hsl(var(--warning))',
      completed: 'hsl(var(--success))',
      error: 'hsl(var(--destructive))',
      paused: 'hsl(var(--secondary))'
    }
  },
  'data-cleaner': {
    backgroundColor: 'hsl(196 94% 67%)',
    borderColor: 'hsl(196 94% 67%)',
    textColor: 'hsl(var(--primary-foreground))',
    iconColor: 'hsl(var(--primary-foreground))',
    statusColors: {
      pending: 'hsl(var(--muted))',
      running: 'hsl(var(--warning))',
      completed: 'hsl(var(--success))',
      error: 'hsl(var(--destructive))',
      paused: 'hsl(var(--secondary))'
    }
  },
  'conditional': {
    backgroundColor: 'hsl(45 93% 47%)',
    borderColor: 'hsl(45 93% 47%)',
    textColor: 'hsl(var(--primary-foreground))',
    iconColor: 'hsl(var(--primary-foreground))',
    statusColors: {
      pending: 'hsl(var(--muted))',
      running: 'hsl(var(--warning))',
      completed: 'hsl(var(--success))',
      error: 'hsl(var(--destructive))',
      paused: 'hsl(var(--secondary))'
    }
  },
  'scheduler': {
    backgroundColor: 'hsl(262 83% 58%)',
    borderColor: 'hsl(262 83% 58%)',
    textColor: 'hsl(var(--primary-foreground))',
    iconColor: 'hsl(var(--primary-foreground))',
    statusColors: {
      pending: 'hsl(var(--muted))',
      running: 'hsl(var(--warning))',
      completed: 'hsl(var(--success))',
      error: 'hsl(var(--destructive))',
      paused: 'hsl(var(--secondary))'
    }
  },
  'email-sender': {
    backgroundColor: 'hsl(0 72% 51%)',
    borderColor: 'hsl(0 72% 51%)',
    textColor: 'hsl(var(--primary-foreground))',
    iconColor: 'hsl(var(--primary-foreground))',
    statusColors: {
      pending: 'hsl(var(--muted))',
      running: 'hsl(var(--warning))',
      completed: 'hsl(var(--success))',
      error: 'hsl(var(--destructive))',
      paused: 'hsl(var(--secondary))'
    }
  },
  'file-watcher': {
    backgroundColor: 'hsl(173 58% 39%)',
    borderColor: 'hsl(173 58% 39%)',
    textColor: 'hsl(var(--primary-foreground))',
    iconColor: 'hsl(var(--primary-foreground))',
    statusColors: {
      pending: 'hsl(var(--muted))',
      running: 'hsl(var(--warning))',
      completed: 'hsl(var(--success))',
      error: 'hsl(var(--destructive))',
      paused: 'hsl(var(--secondary))'
    }
  }
};
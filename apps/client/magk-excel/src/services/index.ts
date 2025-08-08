/**
 * Service layer index and integration utilities for MAGK Excel
 * Provides unified access to real-time services and store integration
 */

export { 
  RealtimeService,
  createRealtimeService,
  subscribeToWorkflow,
  subscribeToNode
} from './realtimeService';

export { 
  RealtimeAdapter,
  WorkflowController,
  createRealtimeAdapter
} from './realtimeAdapter';

export { default as RealtimeAdapterDefault } from './realtimeAdapter';

// Service integration utilities
export {
  useRealtimeIntegration,
  useWorkflowRealtime,
  useNodeRealtime,
  createGlobalRealtimeService,
  getGlobalRealtimeService,
  cleanupGlobalRealtimeService
} from './serviceIntegration';

export type {
  ConnectionType,
  ConnectionState,
  MessageType,
  RealtimeMessage,
  RealtimeConnectionConfig,
  EventListener,
  ConnectionEventListener,
  MessageEventListener,
  Subscription,
  QueuedMessage,
  ConnectionHealth,
  ErrorRecoveryStrategy,
  ErrorRecoveryConfig
} from './realtimeService';

export type {
  BackendMessage,
  WorkflowCommand,
  CommandPayload,
  CommandResponse,
  RealtimeAdapterConfig,
  BackendHealth
} from './realtimeAdapter';

export type {
  ServiceIntegrationConfig
} from './serviceIntegration';

// Executor service exports
export { 
  ExecutorMCPTool,
  executorMCPTool 
} from './executor/ExecutorMCPTool';

export { 
  exampleExcelCode,
  simpleReadExample,
  createSpreadsheetExample,
  createExecutorCall
} from './executor/ExcelExecutorExample';

export type {
  MCPToolRequest,
  MCPToolResponse
} from './executor/ExecutorMCPTool';

// Download service exports
export { 
  downloadService,
  DownloadService
} from './downloadService';

export type {
  DownloadProgress,
  DownloadHistoryItem
} from './downloadService';

// Excel service exports
export { 
  excelService,
  ExcelService
} from './excel/ExcelService';

export type {
  ExcelReadOptions,
  ExcelWriteOptions,
  ExcelFormatOptions,
  ExcelCalculateOptions,
  ExcelOperationResult
} from './excel/ExcelService';

// MCP service exports
export * from './mcpService';
export * from './fileAccessService';
export * from './chatHistoryService';
export * from './smitheryClient';

// Test discovery service exports
export { 
  testDiscoveryService,
  useTestDiscovery
} from './testDiscoveryService';

export type {
  TestFileInfo,
  TestCategory,
  TestDiscoveryResult,
  TestSearchOptions
} from './testDiscoveryService';

// Test executor service exports
export { 
  testExecutorService,
  useTestExecutor,
  TestExecutorService,
  HTMLTestExecutionStrategy,
  JavaScriptTestExecutionStrategy,
  TestStatusBroadcaster,
  TestArtifactManager
} from './testExecutorService';

export type {
  TestExecutionOptions,
  TestExecutionResult,
  TestError,
  TestArtifact,
  TestMetrics,
  TestExecutionStatus,
  TestExecutionStrategy
} from './testExecutorService';

// Re-export store integration
export {
  useNodeExecutionStore,
  useNodeState,
  useWorkflowNodes,
  useConnectionState,
  useNodeSubscription
} from '../stores/nodeExecutionStore';

export type {
  NodeExecutionState,
  NodeUpdatePayload,
  NodeSubscription,
  ConnectionConfig,
  OfflineUpdate,
  NodeSubscriptionCallback
} from '../stores/nodeExecutionStore';

// Export persistence types
export type { FileVersion, FileMetrics, PersistenceStrategy } from './persistence/UnifiedPersistenceService';
export type { StorageIntegrationConfig, IntegrationPoint, StorageOperation } from './persistence/StorageIntegrationService';
export type { ExcelMCPToolResult } from './persistence/EnhancedExcelMCPTool';
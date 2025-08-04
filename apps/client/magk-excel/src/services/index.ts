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
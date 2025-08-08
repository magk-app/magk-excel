/**
 * Service integration utilities for connecting RealtimeService with nodeExecutionStore
 * Provides hooks and utilities for seamless integration between real-time services and state management
 */

import { useEffect, useRef, useCallback } from 'react';
import { RealtimeService, RealtimeAdapter, RealtimeMessage } from './realtimeService';
import { createRealtimeAdapter } from './realtimeAdapter';
import { useNodeExecutionStore } from '../stores/nodeExecutionStore';
import type { 
  NodeUpdatePayload, 
  NodeUpdateType, 
  ConnectionConfig,
  NodeExecutionState 
} from '../stores/nodeExecutionStore';
import type { 
  WorkflowEvent, 
  NodeStatus, 
  NodeProgress, 
  NodeError, 
  NodeResult, 
  NodeMetadata, 
  NodeLog 
} from '../types/workflow';

// Integration configuration
export interface ServiceIntegrationConfig {
  // Backend configuration
  backendBaseUrl?: string;
  enableAutoReconnect?: boolean;
  
  // Real-time preferences
  preferWebSocket?: boolean;
  enableOfflineSync?: boolean;
  
  // Store integration
  enableStoreSync?: boolean;
  syncBidirectional?: boolean;
  
  // Debug options
  enableDebugLogging?: boolean;
}

// Integration state
interface IntegrationState {
  isConnected: boolean;
  adapter: RealtimeAdapter | null;
  subscriptions: Set<string>;
  lastSyncTime: Date | null;
}

// Global integration instance (singleton pattern)
let globalIntegration: IntegrationState | null = null;

/**
 * Hook for integrating real-time services with the node execution store
 */
export function useRealtimeIntegration(config?: ServiceIntegrationConfig) {
  const storeActions = useNodeExecutionStore((state) => state.actions);
  const connectionState = useNodeExecutionStore((state) => state.connectionState);
  
  const integrationRef = useRef<IntegrationState | null>(null);
  
  // Initialize integration
  const initializeIntegration = useCallback(async () => {
    if (integrationRef.current?.adapter) {
      return integrationRef.current.adapter;
    }

    const adapter = createRealtimeAdapter({
      backendBaseUrl: config?.backendBaseUrl || 'http://localhost:8000',
      enableHealthCheck: true,
      logMessages: config?.enableDebugLogging || false,
    });

    integrationRef.current = {
      isConnected: false,
      adapter,
      subscriptions: new Set(),
      lastSyncTime: null,
    };

    // Set up message handlers
    setupMessageHandlers(adapter, storeActions);
    
    try {
      await adapter.connect();
      integrationRef.current.isConnected = true;
      integrationRef.current.lastSyncTime = new Date();
    } catch (error) {
      console.error('Failed to initialize real-time integration:', error);
    }

    return adapter;
  }, [config, storeActions]);

  // Connect to real-time services
  const connect = useCallback(async () => {
    const adapter = await initializeIntegration();
    return adapter;
  }, [initializeIntegration]);

  // Disconnect from real-time services
  const disconnect = useCallback(() => {
    if (integrationRef.current?.adapter) {
      integrationRef.current.adapter.disconnect();
      integrationRef.current.isConnected = false;
      integrationRef.current.subscriptions.clear();
    }
  }, []);

  // Subscribe to workflow events
  const subscribeToWorkflow = useCallback(
    (workflowId: string) => {
      if (!integrationRef.current?.adapter) return null;
      
      const subscriptionId = integrationRef.current.adapter.subscribeToWorkflow(
        workflowId,
        (event: WorkflowEvent) => {
          handleWorkflowEvent(event, storeActions);
        }
      );
      
      integrationRef.current.subscriptions.add(subscriptionId);
      return subscriptionId;
    },
    [storeActions]
  );

  // Subscribe to node events
  const subscribeToNode = useCallback(
    (nodeId: string, workflowId: string) => {
      if (!integrationRef.current?.adapter) return null;
      
      const subscriptionId = integrationRef.current.adapter.subscribeToNode(
        nodeId,
        workflowId,
        (event) => {
          handleNodeEvent(nodeId, workflowId, event, storeActions);
        }
      );
      
      integrationRef.current.subscriptions.add(subscriptionId);
      return subscriptionId;
    },
    [storeActions]
  );

  // Unsubscribe from events
  const unsubscribe = useCallback((subscriptionId: string) => {
    if (integrationRef.current?.adapter) {
      integrationRef.current.adapter.unsubscribe(subscriptionId);
      integrationRef.current.subscriptions.delete(subscriptionId);
    }
  }, []);

  // Get integration status
  const getStatus = useCallback(() => {
    return {
      isConnected: integrationRef.current?.isConnected || false,
      adapter: integrationRef.current?.adapter || null,
      subscriptionCount: integrationRef.current?.subscriptions.size || 0,
      lastSyncTime: integrationRef.current?.lastSyncTime,
      storeConnectionState: connectionState,
    };
  }, [connectionState]);

  // Auto-connect on mount if configured
  useEffect(() => {
    if (config?.enableAutoReconnect !== false) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [connect, disconnect, config?.enableAutoReconnect]);

  return {
    connect,
    disconnect,
    subscribeToWorkflow,
    subscribeToNode,
    unsubscribe,
    getStatus,
    adapter: integrationRef.current?.adapter,
  };
}

/**
 * Hook for managing workflow-specific real-time connections
 */
export function useWorkflowRealtime(workflowId: string, config?: ServiceIntegrationConfig) {
  const integration = useRealtimeIntegration(config);
  const subscriptionRef = useRef<string | null>(null);

  // Subscribe to workflow events on mount
  useEffect(() => {
    if (workflowId && integration.adapter) {
      subscriptionRef.current = integration.subscribeToWorkflow(workflowId);
    }

    return () => {
      if (subscriptionRef.current) {
        integration.unsubscribe(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [workflowId, integration]);

  return {
    ...integration,
    workflowId,
    isSubscribed: subscriptionRef.current !== null,
  };
}

/**
 * Hook for managing node-specific real-time connections
 */
export function useNodeRealtime(
  nodeId: string, 
  workflowId: string, 
  config?: ServiceIntegrationConfig
) {
  const integration = useRealtimeIntegration(config);
  const subscriptionRef = useRef<string | null>(null);

  // Subscribe to node events on mount
  useEffect(() => {
    if (nodeId && workflowId && integration.adapter) {
      subscriptionRef.current = integration.subscribeToNode(nodeId, workflowId);
    }

    return () => {
      if (subscriptionRef.current) {
        integration.unsubscribe(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [nodeId, workflowId, integration]);

  return {
    ...integration,
    nodeId,
    workflowId,
    isSubscribed: subscriptionRef.current !== null,
  };
}

// Private helper functions

function setupMessageHandlers(_adapter: RealtimeAdapter, _storeActions: ReturnType<typeof useNodeExecutionStore.getState>['actions']) {
  // Set up global message handling if needed
  // This could include error handling, logging, etc.
}

function handleWorkflowEvent(event: WorkflowEvent, storeActions: ReturnType<typeof useNodeExecutionStore.getState>['actions']) {
  if (!event.nodeId) return;

  const updateType: NodeUpdateType = determineUpdateType(event.type);
  const update: NodeUpdatePayload = {
    nodeId: event.nodeId,
    workflowId: event.workflowId,
    type: updateType,
    data: transformEventData(event),
    timestamp: new Date(event.timestamp),
  };

  storeActions.updateNodeState(update);
}

function handleNodeEvent(
  nodeId: string, 
  workflowId: string, 
  event: Record<string, unknown>, 
  storeActions: ReturnType<typeof useNodeExecutionStore.getState>['actions']
) {
  if (event.status) {
    storeActions.updateNodeStatus(nodeId, workflowId, event.status);
  }
  
  if (event.progress) {
    storeActions.updateNodeProgress(nodeId, workflowId, event.progress);
  }
  
  if (event.error) {
    storeActions.updateNodeError(nodeId, workflowId, event.error);
  }
  
  if (event.result) {
    storeActions.updateNodeResult(nodeId, workflowId, event.result);
  }
  
  if (event.metadata) {
    storeActions.updateNodeMetadata(nodeId, workflowId, event.metadata);
  }
  
  if (event.logs && Array.isArray(event.logs)) {
    event.logs.forEach((log: NodeLog) => {
      storeActions.addNodeLog(nodeId, workflowId, log);
    });
  }
}

function determineUpdateType(eventType: string): NodeUpdateType {
  switch (eventType) {
    case 'node_started':
    case 'node_completed':
    case 'node_error':
      return 'status';
    case 'node_progress':
      return 'progress';
    default:
      return 'status';
  }
}

function transformEventData(event: WorkflowEvent): Partial<NodeExecutionState> {
  const data: Partial<NodeExecutionState> = {};

  switch (event.type) {
    case 'node_started':
      data.status = 'running';
      break;
    case 'node_completed':
      data.status = 'completed';
      if (event.data?.result) {
        data.result = event.data.result;
      }
      break;
    case 'node_error':
      data.status = 'error';
      if (event.data?.error) {
        data.error = event.data.error;
      }
      break;
    case 'node_progress':
      if (event.data?.progress) {
        data.progress = event.data.progress;
      }
      break;
  }

  return data;
}

/**
 * Utility function to create a global real-time service instance
 */
export function createGlobalRealtimeService(config?: ServiceIntegrationConfig): RealtimeAdapter {
  if (!globalIntegration) {
    const adapter = createRealtimeAdapter({
      backendBaseUrl: config?.backendBaseUrl || 'http://localhost:8000',
      enableHealthCheck: true,
      logMessages: config?.enableDebugLogging || false,
    });

    globalIntegration = {
      isConnected: false,
      adapter,
      subscriptions: new Set(),
      lastSyncTime: null,
    };
  }

  return globalIntegration.adapter;
}

/**
 * Utility function to get the global real-time service instance
 */
export function getGlobalRealtimeService(): RealtimeAdapter | null {
  return globalIntegration?.adapter || null;
}

/**
 * Utility function to cleanup global real-time service
 */
export function cleanupGlobalRealtimeService(): void {
  if (globalIntegration) {
    globalIntegration.adapter.disconnect();
    globalIntegration = null;
  }
}

/**
 * Integrate services with enhanced persistence functionality
 */
export const integrateServices = async () => {
  console.log('🔗 Integrating all services with enhanced persistence...');
  
  try {
    // Import storage integration service dynamically
    const { storageIntegrationService } = await import('./persistence/StorageIntegrationService');
    
    // Set up storage integration event handlers
    storageIntegrationService.addEventListener('executor-output-processed', (data) => {
      console.log('📊 Executor output processed:', data);
      // Could trigger chat notification or UI update
    });
    
    storageIntegrationService.addEventListener('file-uploaded', (data) => {
      console.log('📁 File uploaded:', data);
      // Could update file browser or chat context
    });
    
    storageIntegrationService.addEventListener('file-chat-linked', (data) => {
      console.log('🔗 File linked to chat:', data);
      // Could update chat history with file reference
    });
    
    console.log('✅ Services integrated successfully with enhanced persistence layer');
  } catch (error) {
    console.warn('⚠️ Storage integration not available:', error);
    console.log('✅ Services integrated successfully (basic mode)');
  }
};

export default {
  useRealtimeIntegration,
  useWorkflowRealtime,
  useNodeRealtime,
  createGlobalRealtimeService,
  getGlobalRealtimeService,
  cleanupGlobalRealtimeService,
  integrateServices
};
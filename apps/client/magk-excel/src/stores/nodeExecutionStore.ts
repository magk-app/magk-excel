/**
 * Zustand store for managing real-time node execution updates in the MAGK Excel application.
 * Handles WebSocket connections, node status tracking, progress updates, and offline synchronization.
 */

import React from 'react';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { 
  NodeStatus, 
  NodeProgress, 
  NodeError, 
  NodeResult, 
  NodeMetadata, 
  NodeLog,
  WorkflowEvent,
  LogLevel 
} from '../types/workflow';

// Connection states for WebSocket/EventSource
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

// Real-time update types
export type NodeUpdateType = 'status' | 'progress' | 'error' | 'result' | 'metadata' | 'log';

// Node execution state
export interface NodeExecutionState {
  nodeId: string;
  workflowId: string;
  status: NodeStatus;
  progress?: NodeProgress;
  error?: NodeError;
  result?: NodeResult;
  metadata?: NodeMetadata;
  logs: NodeLog[];
  lastUpdated: Date;
  version: number; // For optimistic updates and conflict resolution
}

// Update payload for node state changes
export interface NodeUpdatePayload {
  nodeId: string;
  workflowId: string;
  type: NodeUpdateType;
  data: Partial<NodeExecutionState>;
  timestamp: Date;
  version?: number;
}

// Offline queue item for updates when disconnected
export interface OfflineUpdate {
  id: string;
  payload: NodeUpdatePayload;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
}

// Subscription callback for node updates
export type NodeSubscriptionCallback = (nodeState: NodeExecutionState) => void;

// Node subscription
export interface NodeSubscription {
  id: string;
  nodeId: string;
  callback: NodeSubscriptionCallback;
  filter?: (update: NodeUpdatePayload) => boolean;
}

// Connection configuration
export interface ConnectionConfig {
  wsUrl?: string;
  eventSourceUrl?: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
  useWebSocket: boolean; // true for WebSocket, false for EventSource
}

// Store state interface
export interface NodeExecutionStore {
  // Connection state
  connectionState: ConnectionState;
  connectionConfig: ConnectionConfig;
  connection: WebSocket | EventSource | null;
  lastConnectionAttempt: Date | null;
  reconnectAttempts: number;
  isManuallyDisconnected: boolean;

  // Node execution states
  nodeStates: Map<string, NodeExecutionState>;
  
  // Subscriptions
  subscriptions: Map<string, NodeSubscription>;
  
  // Offline queue
  offlineQueue: OfflineUpdate[];
  
  // Metrics and debugging
  metrics: {
    totalUpdatesReceived: number;
    totalUpdatesSent: number;
    averageLatency: number;
    lastHeartbeat: Date | null;
    connectionUptime: number;
  };

  // Actions
  actions: {
    // Connection management
    connect: (config?: Partial<ConnectionConfig>) => Promise<void>;
    disconnect: () => void;
    reconnect: () => Promise<void>;
    
    // Node state management
    updateNodeState: (update: NodeUpdatePayload) => void;
    getNodeState: (nodeId: string) => NodeExecutionState | undefined;
    clearNodeState: (nodeId: string) => void;
    clearWorkflowStates: (workflowId: string) => void;
    clearAllStates: () => void;
    
    // Progress and status updates
    updateNodeStatus: (nodeId: string, workflowId: string, status: NodeStatus) => void;
    updateNodeProgress: (nodeId: string, workflowId: string, progress: NodeProgress) => void;
    updateNodeError: (nodeId: string, workflowId: string, error: NodeError) => void;
    updateNodeResult: (nodeId: string, workflowId: string, result: NodeResult) => void;
    updateNodeMetadata: (nodeId: string, workflowId: string, metadata: NodeMetadata) => void;
    addNodeLog: (nodeId: string, workflowId: string, log: NodeLog) => void;
    
    // Subscription management
    subscribe: (nodeId: string, callback: NodeSubscriptionCallback, filter?: (update: NodeUpdatePayload) => boolean) => string;
    unsubscribe: (subscriptionId: string) => void;
    unsubscribeAll: () => void;
    
    // Offline queue management
    processOfflineQueue: () => Promise<void>;
    clearOfflineQueue: () => void;
    
    // Utility methods
    getNodesByWorkflow: (workflowId: string) => NodeExecutionState[];
    getNodesByStatus: (status: NodeStatus) => NodeExecutionState[];
    isNodeRunning: (nodeId: string) => boolean;
    getConnectionHealth: () => { isHealthy: boolean; issues: string[] };
    
    // Event handlers (internal)
    handleMessage: (event: MessageEvent | Event) => void;
    handleConnectionOpen: () => void;
    handleConnectionClose: (event?: CloseEvent) => void;
    handleConnectionError: (event?: Event) => void;
  };
}

// Default configuration
const DEFAULT_CONFIG: ConnectionConfig = {
  wsUrl: 'ws://localhost:8000/ws/node-execution',
  eventSourceUrl: 'http://localhost:8000/events/node-execution',
  reconnectInterval: 5000,
  maxReconnectAttempts: 10,
  heartbeatInterval: 30000,
  useWebSocket: true,
};

// Create the store with Zustand
export const useNodeExecutionStore = create<NodeExecutionStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      // Initial state
      connectionState: 'disconnected',
      connectionConfig: DEFAULT_CONFIG,
      connection: null,
      lastConnectionAttempt: null,
      reconnectAttempts: 0,
      isManuallyDisconnected: false,
      nodeStates: new Map(),
      subscriptions: new Map(),
      offlineQueue: [],
      metrics: {
        totalUpdatesReceived: 0,
        totalUpdatesSent: 0,
        averageLatency: 0,
        lastHeartbeat: null,
        connectionUptime: 0,
      },

      actions: {
        // Connection management
        connect: async (config?: Partial<ConnectionConfig>) => {
          const state = get();
          
          // Don't connect if already connected or connecting
          if (state.connectionState === 'connected' || state.connectionState === 'connecting') {
            return;
          }

          set((draft) => {
            draft.connectionState = 'connecting';
            draft.lastConnectionAttempt = new Date();
            draft.isManuallyDisconnected = false;
            if (config) {
              draft.connectionConfig = { ...draft.connectionConfig, ...config };
            }
          });

          try {
            const { connectionConfig } = get();
            let connection: WebSocket | EventSource;

            if (connectionConfig.useWebSocket && connectionConfig.wsUrl) {
              // WebSocket connection
              connection = new WebSocket(connectionConfig.wsUrl);
              
              connection.onopen = get().actions.handleConnectionOpen;
              connection.onmessage = get().actions.handleMessage;
              connection.onclose = get().actions.handleConnectionClose;
              connection.onerror = get().actions.handleConnectionError;
            } else if (connectionConfig.eventSourceUrl) {
              // EventSource (Server-Sent Events) connection
              connection = new EventSource(connectionConfig.eventSourceUrl);
              
              connection.onopen = get().actions.handleConnectionOpen;
              connection.onmessage = get().actions.handleMessage;
              connection.onerror = get().actions.handleConnectionError;
              
              // EventSource doesn't have onclose, we'll handle it in onerror
            } else {
              throw new Error('No valid connection URL configured');
            }

            set((draft) => {
              draft.connection = connection;
            });

          } catch (error) {
            console.error('Failed to establish connection:', error);
            set((draft) => {
              draft.connectionState = 'error';
            });
          }
        },

        disconnect: () => {
          const state = get();
          
          set((draft) => {
            draft.isManuallyDisconnected = true;
            draft.connectionState = 'disconnected';
            draft.reconnectAttempts = 0;
          });

          if (state.connection) {
            if (state.connection instanceof WebSocket) {
              state.connection.close(1000, 'Manual disconnect');
            } else if (state.connection instanceof EventSource) {
              state.connection.close();
            }
            
            set((draft) => {
              draft.connection = null;
            });
          }
        },

        reconnect: async () => {
          const state = get();
          
          if (state.isManuallyDisconnected) {
            return;
          }

          if (state.reconnectAttempts >= state.connectionConfig.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            set((draft) => {
              draft.connectionState = 'error';
            });
            return;
          }

          set((draft) => {
            draft.connectionState = 'reconnecting';
            draft.reconnectAttempts += 1;
          });

          // Wait before reconnecting
          await new Promise(resolve => setTimeout(resolve, state.connectionConfig.reconnectInterval));

          await get().actions.connect();
        },

        // Node state management
        updateNodeState: (update: NodeUpdatePayload) => {
          set((draft) => {
            const existingState = draft.nodeStates.get(update.nodeId);
            const newVersion = (existingState?.version || 0) + 1;

            // Create or update node state
            const nodeState: NodeExecutionState = {
              nodeId: update.nodeId,
              workflowId: update.workflowId,
              status: existingState?.status || 'pending',
              progress: existingState?.progress,
              error: existingState?.error,
              result: existingState?.result,
              metadata: existingState?.metadata,
              logs: existingState?.logs || [],
              lastUpdated: update.timestamp,
              version: newVersion,
              ...update.data,
            };

            draft.nodeStates.set(update.nodeId, nodeState);
            draft.metrics.totalUpdatesReceived += 1;
          });

          // Notify subscribers
          const state = get();
          const nodeState = state.nodeStates.get(update.nodeId);
          if (nodeState) {
            state.subscriptions.forEach((subscription) => {
              if (subscription.nodeId === update.nodeId) {
                if (!subscription.filter || subscription.filter(update)) {
                  subscription.callback(nodeState);
                }
              }
            });
          }
        },

        getNodeState: (nodeId: string) => {
          return get().nodeStates.get(nodeId);
        },

        clearNodeState: (nodeId: string) => {
          set((draft) => {
            draft.nodeStates.delete(nodeId);
          });
        },

        clearWorkflowStates: (workflowId: string) => {
          set((draft) => {
            for (const [nodeId, state] of draft.nodeStates.entries()) {
              if (state.workflowId === workflowId) {
                draft.nodeStates.delete(nodeId);
              }
            }
          });
        },

        clearAllStates: () => {
          set((draft) => {
            draft.nodeStates.clear();
          });
        },

        // Convenience methods for specific updates
        updateNodeStatus: (nodeId: string, workflowId: string, status: NodeStatus) => {
          const update: NodeUpdatePayload = {
            nodeId,
            workflowId,
            type: 'status',
            data: { status },
            timestamp: new Date(),
          };
          get().actions.updateNodeState(update);
        },

        updateNodeProgress: (nodeId: string, workflowId: string, progress: NodeProgress) => {
          const update: NodeUpdatePayload = {
            nodeId,
            workflowId,
            type: 'progress',
            data: { progress },
            timestamp: new Date(),
          };
          get().actions.updateNodeState(update);
        },

        updateNodeError: (nodeId: string, workflowId: string, error: NodeError) => {
          const update: NodeUpdatePayload = {
            nodeId,
            workflowId,
            type: 'error',
            data: { error, status: 'error' },
            timestamp: new Date(),
          };
          get().actions.updateNodeState(update);
        },

        updateNodeResult: (nodeId: string, workflowId: string, result: NodeResult) => {
          const update: NodeUpdatePayload = {
            nodeId,
            workflowId,
            type: 'result',
            data: { result, status: 'completed' },
            timestamp: new Date(),
          };
          get().actions.updateNodeState(update);
        },

        updateNodeMetadata: (nodeId: string, workflowId: string, metadata: NodeMetadata) => {
          const update: NodeUpdatePayload = {
            nodeId,
            workflowId,
            type: 'metadata',
            data: { metadata },
            timestamp: new Date(),
          };
          get().actions.updateNodeState(update);
        },

        addNodeLog: (nodeId: string, workflowId: string, log: NodeLog) => {
          set((draft) => {
            const nodeState = draft.nodeStates.get(nodeId);
            if (nodeState) {
              nodeState.logs.push(log);
              nodeState.lastUpdated = new Date();
              nodeState.version += 1;
            } else {
              // Create new node state if it doesn't exist
              const newState: NodeExecutionState = {
                nodeId,
                workflowId,
                status: 'pending',
                logs: [log],
                lastUpdated: new Date(),
                version: 1,
              };
              draft.nodeStates.set(nodeId, newState);
            }
          });
        },

        // Subscription management
        subscribe: (nodeId: string, callback: NodeSubscriptionCallback, filter?: (update: NodeUpdatePayload) => boolean) => {
          const subscriptionId = `${nodeId}-${Date.now()}-${Math.random()}`;
          
          set((draft) => {
            draft.subscriptions.set(subscriptionId, {
              id: subscriptionId,
              nodeId,
              callback,
              filter,
            });
          });

          return subscriptionId;
        },

        unsubscribe: (subscriptionId: string) => {
          set((draft) => {
            draft.subscriptions.delete(subscriptionId);
          });
        },

        unsubscribeAll: () => {
          set((draft) => {
            draft.subscriptions.clear();
          });
        },

        // Offline queue management
        processOfflineQueue: async () => {
          const state = get();
          
          if (state.connectionState !== 'connected' || state.offlineQueue.length === 0) {
            return;
          }

          const updates = [...state.offlineQueue];
          
          set((draft) => {
            draft.offlineQueue = [];
          });

          // Process updates in order
          for (const update of updates) {
            try {
              get().actions.updateNodeState(update.payload);
            } catch (error) {
              console.error('Failed to process offline update:', error);
              
              // Re-queue if retries remaining
              if (update.retryCount < update.maxRetries) {
                set((draft) => {
                  draft.offlineQueue.push({
                    ...update,
                    retryCount: update.retryCount + 1,
                  });
                });
              }
            }
          }
        },

        clearOfflineQueue: () => {
          set((draft) => {
            draft.offlineQueue = [];
          });
        },

        // Utility methods
        getNodesByWorkflow: (workflowId: string) => {
          const state = get();
          return Array.from(state.nodeStates.values()).filter(node => node.workflowId === workflowId);
        },

        getNodesByStatus: (status: NodeStatus) => {
          const state = get();
          return Array.from(state.nodeStates.values()).filter(node => node.status === status);
        },

        isNodeRunning: (nodeId: string) => {
          const nodeState = get().nodeStates.get(nodeId);
          return nodeState?.status === 'running';
        },

        getConnectionHealth: () => {
          const state = get();
          const issues: string[] = [];
          
          if (state.connectionState !== 'connected') {
            issues.push(`Connection state: ${state.connectionState}`);
          }
          
          if (state.reconnectAttempts > 0) {
            issues.push(`Reconnection attempts: ${state.reconnectAttempts}`);
          }
          
          if (state.offlineQueue.length > 0) {
            issues.push(`Pending offline updates: ${state.offlineQueue.length}`);
          }

          const timeSinceLastHeartbeat = state.metrics.lastHeartbeat 
            ? Date.now() - state.metrics.lastHeartbeat.getTime()
            : Infinity;

          if (timeSinceLastHeartbeat > state.connectionConfig.heartbeatInterval * 2) {
            issues.push('Heartbeat timeout');
          }

          return {
            isHealthy: issues.length === 0,
            issues,
          };
        },

        // Event handlers
        handleMessage: (event: MessageEvent | Event) => {
          try {
            let data: Record<string, unknown>;
            
            if (event instanceof MessageEvent) {
              // WebSocket message
              data = JSON.parse(event.data);
            } else {
              // EventSource message
              data = JSON.parse((event as MessageEvent).data);
            }

            // Handle heartbeat
            if (data.type === 'heartbeat') {
              set((draft) => {
                draft.metrics.lastHeartbeat = new Date();
              });
              return;
            }

            // Handle workflow events
            if (data.type && data.workflowId && data.nodeId) {
              const workflowEvent: WorkflowEvent = data;
              
              const update: NodeUpdatePayload = {
                nodeId: workflowEvent.nodeId!,
                workflowId: workflowEvent.workflowId,
                type: workflowEvent.type.includes('progress') ? 'progress' : 'status',
                data: workflowEvent.data || {},
                timestamp: new Date(workflowEvent.timestamp),
              };

              // Handle specific event types
              switch (workflowEvent.type) {
                case 'node_started':
                  update.data.status = 'running';
                  break;
                case 'node_completed':
                  update.data.status = 'completed';
                  break;
                case 'node_error':
                  update.data.status = 'error';
                  if (workflowEvent.data?.error) {
                    update.data.error = workflowEvent.data.error;
                  }
                  break;
                case 'node_progress':
                  if (workflowEvent.data?.progress) {
                    update.data.progress = workflowEvent.data.progress;
                  }
                  break;
              }

              if (get().connectionState === 'connected') {
                get().actions.updateNodeState(update);
              } else {
                // Queue for offline processing
                const offlineUpdate: OfflineUpdate = {
                  id: `${update.nodeId}-${Date.now()}`,
                  payload: update,
                  timestamp: new Date(),
                  retryCount: 0,
                  maxRetries: 3,
                };

                set((draft) => {
                  draft.offlineQueue.push(offlineUpdate);
                });
              }
            }

          } catch (error) {
            console.error('Failed to handle message:', error);
          }
        },

        handleConnectionOpen: () => {
          set((draft) => {
            draft.connectionState = 'connected';
            draft.reconnectAttempts = 0;
            draft.metrics.lastHeartbeat = new Date();
          });

          // Process any queued offline updates
          setTimeout(() => {
            get().actions.processOfflineQueue();
          }, 100);
        },

        handleConnectionClose: (event?: CloseEvent) => {
          const state = get();
          
          set((draft) => {
            draft.connection = null;
          });

          if (!state.isManuallyDisconnected) {
            // Attempt to reconnect
            setTimeout(() => {
              get().actions.reconnect();
            }, state.connectionConfig.reconnectInterval);
          } else {
            set((draft) => {
              draft.connectionState = 'disconnected';
            });
          }
        },

        handleConnectionError: (event?: Event) => {
          console.error('Connection error:', event);
          
          const state = get();
          
          if (!state.isManuallyDisconnected) {
            set((draft) => {
              draft.connectionState = 'error';
            });

            // Attempt to reconnect
            setTimeout(() => {
              get().actions.reconnect();
            }, state.connectionConfig.reconnectInterval);
          }
        },
      },
    }))
  )
);

// Export types and utilities
export type { 
  NodeExecutionState, 
  NodeUpdatePayload, 
  NodeSubscription,
  ConnectionConfig,
  OfflineUpdate,
  NodeSubscriptionCallback 
};

// Convenience hooks for specific use cases
export const useNodeState = (nodeId: string) => {
  return useNodeExecutionStore((state) => state.nodeStates.get(nodeId));
};

export const useWorkflowNodes = (workflowId: string) => {
  return useNodeExecutionStore((state) => 
    Array.from(state.nodeStates.values()).filter(node => node.workflowId === workflowId)
  );
};

export const useConnectionState = () => {
  return useNodeExecutionStore((state) => ({
    connectionState: state.connectionState,
    reconnectAttempts: state.reconnectAttempts,
    isConnected: state.connectionState === 'connected',
  }));
};

export const useNodeSubscription = (
  nodeId: string, 
  callback: NodeSubscriptionCallback,
  filter?: (update: NodeUpdatePayload) => boolean
) => {
  const subscribe = useNodeExecutionStore((state) => state.actions.subscribe);
  const unsubscribe = useNodeExecutionStore((state) => state.actions.unsubscribe);
  
  // Subscribe on mount, unsubscribe on unmount
  React.useEffect(() => {
    const subscriptionId = subscribe(nodeId, callback, filter);
    return () => unsubscribe(subscriptionId);
  }, [nodeId, callback, filter, subscribe, unsubscribe]);
};
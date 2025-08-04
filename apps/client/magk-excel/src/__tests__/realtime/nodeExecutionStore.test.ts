/**
 * Comprehensive Test Suite for NodeExecutionStore
 * Tests Zustand store functionality, WebSocket/EventSource connections, 
 * state updates, subscriptions, offline queue, and error handling.
 */

import { act, renderHook } from '@testing-library/react';
import { 
  useNodeExecutionStore,
  type NodeExecutionState,
  type NodeUpdatePayload,
  type ConnectionConfig,
  type OfflineUpdate
} from '../../stores/nodeExecutionStore';
import { NodeStatus, LogLevel, WorkflowEvent } from '../../types/workflow';

// Mock WebSocket and EventSource for comprehensive testing
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  public readyState = MockWebSocket.CONNECTING;
  public onopen: ((event: Event) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onclose: ((event: CloseEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;

  public url: string;
  public protocol: string;
  public binaryType: BinaryType = 'blob';
  public bufferedAmount = 0;
  public extensions = '';

  constructor(url: string, protocols?: string | string[]) {
    this.url = url;
    this.protocol = Array.isArray(protocols) ? protocols[0] || '' : protocols || '';
    
    // Simulate async connection
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 10);
  }

  send = jest.fn((_data: string | ArrayBufferLike | Blob | ArrayBufferView) => {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
  });

  close = jest.fn((code?: number, reason?: string) => {
    this.readyState = MockWebSocket.CLOSING;
    setTimeout(() => {
      this.readyState = MockWebSocket.CLOSED;
      if (this.onclose) {
        this.onclose(new CloseEvent('close', { code: code || 1000, reason: reason || '' }));
      }
    }, 10);
  });

  addEventListener = jest.fn();
  removeEventListener = jest.fn();
  dispatchEvent = jest.fn();

  // Test helpers
  simulateMessage(data: Record<string, unknown>) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data: JSON.stringify(data) }));
    }
  }

  simulateError() {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }

  simulateClose(code = 1000, reason = '') {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close', { code, reason }));
    }
  }
}

class MockEventSource {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 2;

  public readyState = MockEventSource.CONNECTING;
  public onopen: ((event: Event) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;

  public url: string;
  public withCredentials = false;

  constructor(url: string, _eventSourceInitDict?: EventSourceInit) {
    this.url = url;
    this.withCredentials = _eventSourceInitDict?.withCredentials || false;
    
    // Simulate async connection
    setTimeout(() => {
      this.readyState = MockEventSource.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 10);
  }

  close = jest.fn(() => {
    this.readyState = MockEventSource.CLOSED;
  });

  addEventListener = jest.fn();
  removeEventListener = jest.fn();
  dispatchEvent = jest.fn();

  // Test helpers
  simulateMessage(data: Record<string, unknown>) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data: JSON.stringify(data) }));
    }
  }

  simulateError() {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }
}

// Setup global mocks
(global as any).WebSocket = MockWebSocket;
(global as any).EventSource = MockEventSource;

// Test utilities
const createMockNodeState = (overrides: Partial<NodeExecutionState> = {}): NodeExecutionState => ({
  nodeId: 'test-node-1',
  workflowId: 'test-workflow-1',
  status: 'pending',
  logs: [],
  lastUpdated: new Date(),
  version: 1,
  ...overrides
});

const createMockUpdatePayload = (overrides: Partial<NodeUpdatePayload> = {}): NodeUpdatePayload => ({
  nodeId: 'test-node-1',
  workflowId: 'test-workflow-1',
  type: 'status',
  data: { status: 'running' },
  timestamp: new Date(),
  ...overrides
});

const createMockWorkflowEvent = (overrides: Partial<WorkflowEvent> = {}): WorkflowEvent => ({
  type: 'node_started',
  workflowId: 'test-workflow-1',
  nodeId: 'test-node-1',
  timestamp: new Date(),
  data: { status: 'running' },
  ...overrides
});

describe('NodeExecutionStore - Comprehensive Tests', () => {
  let store: ReturnType<typeof useNodeExecutionStore.getState>;

  beforeEach(() => {
    // Reset store state
    store = useNodeExecutionStore.getState();
    store.actions.clearAllStates();
    store.actions.disconnect();
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Reset store to initial state
    useNodeExecutionStore.setState({
      connectionState: 'disconnected',
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
      }
    });
  });

  afterEach(() => {
    // Clean up any active connections
    store.actions.disconnect();
  });

  describe('State Updates and Management', () => {
    it('should update node state with version increment', () => {
      const update = createMockUpdatePayload({
        data: { status: 'running', progress: { current: 50, total: 100 } }
      });

      store.actions.updateNodeState(update);

      const nodeState = store.nodeStates.get('test-node-1');
      expect(nodeState).toBeDefined();
      expect(nodeState?.status).toBe('running');
      expect(nodeState?.progress).toEqual({ current: 50, total: 100 });
      expect(nodeState?.version).toBe(1);
      expect(store.metrics.totalUpdatesReceived).toBe(1);
    });

    it('should handle multiple updates with version increments', () => {
      const update1 = createMockUpdatePayload({ data: { status: 'running' } });
      const update2 = createMockUpdatePayload({ data: { status: 'completed' } });

      store.actions.updateNodeState(update1);
      store.actions.updateNodeState(update2);

      const nodeState = store.nodeStates.get('test-node-1');
      expect(nodeState?.version).toBe(2);
      expect(nodeState?.status).toBe('completed');
    });

    it('should update node status using convenience method', () => {
      store.actions.updateNodeStatus('test-node-1', 'test-workflow-1', 'running');

      const nodeState = store.nodeStates.get('test-node-1');
      expect(nodeState?.status).toBe('running');
      expect(nodeState?.nodeId).toBe('test-node-1');
      expect(nodeState?.workflowId).toBe('test-workflow-1');
    });

    it('should update node progress with detailed information', () => {
      const progress = {
        current: 75,
        total: 100,
        percentage: 75,
        message: 'Processing data...',
        startTime: new Date('2023-01-01T10:00:00Z'),
        estimatedCompletion: new Date('2023-01-01T10:30:00Z'),
        estimatedTimeRemaining: 300,
        throughputRate: 5.2,
        stages: [
          { name: 'Download', status: 'completed' as const, progress: 100 },
          { name: 'Process', status: 'running' as const, progress: 75 },
          { name: 'Upload', status: 'pending' as const, progress: 0 }
        ]
      };

      store.actions.updateNodeProgress('test-node-1', 'test-workflow-1', progress);

      const nodeState = store.nodeStates.get('test-node-1');
      expect(nodeState?.progress).toEqual(progress);
    });

    it('should update node error with recovery information', () => {
      const error = {
        message: 'Network connection failed',
        code: 'NETWORK_ERROR',
        details: { url: 'https://api.example.com', timeout: 30000 },
        stack: 'Error: Network connection failed\n    at fetch...',
        timestamp: new Date(),
        recoverable: true,
        suggestions: [
          'Check your internet connection',
          'Verify the API endpoint is accessible',
          'Try again in a few moments'
        ]
      };

      store.actions.updateNodeError('test-node-1', 'test-workflow-1', error);

      const nodeState = store.nodeStates.get('test-node-1');
      expect(nodeState?.error).toEqual(error);
      expect(nodeState?.status).toBe('error');
    });

    it('should update node result with comprehensive data', () => {
      const result = {
        data: { records: [{ id: 1, name: 'Test' }] },
        rowCount: 1000,
        columnCount: 5,
        schema: {
          fields: [
            { name: 'id', type: 'number', nullable: false },
            { name: 'name', type: 'string', nullable: true }
          ]
        },
        preview: [{ id: 1, name: 'Test' }, { id: 2, name: 'Sample' }],
        statistics: {
          totalRows: 1000,
          totalColumns: 5,
          nullValues: 25,
          duplicateRows: 3,
          memorySize: 1024000,
          columnStats: {
            id: { name: 'id', type: 'number', nullCount: 0, uniqueCount: 1000, min: 1, max: 1000 },
            name: { name: 'name', type: 'string', nullCount: 25, uniqueCount: 975 }
          }
        }
      };

      store.actions.updateNodeResult('test-node-1', 'test-workflow-1', result);

      const nodeState = store.nodeStates.get('test-node-1');
      expect(nodeState?.result).toEqual(result);
      expect(nodeState?.status).toBe('completed');
    });

    it('should add node logs maintaining chronological order', () => {
      const log1 = {
        timestamp: new Date('2023-01-01T10:00:00Z'),
        level: LogLevel.INFO,
        message: 'Node started',
        category: 'execution'
      };

      const log2 = {
        timestamp: new Date('2023-01-01T10:01:00Z'),
        level: LogLevel.DEBUG,
        message: 'Processing item 1',
        category: 'processing',
        details: { itemId: 1, progress: 0.1 }
      };

      store.actions.addNodeLog('test-node-1', 'test-workflow-1', log1);
      store.actions.addNodeLog('test-node-1', 'test-workflow-1', log2);

      const nodeState = store.nodeStates.get('test-node-1');
      expect(nodeState?.logs).toHaveLength(2);
      expect(nodeState?.logs[0]).toEqual(log1);
      expect(nodeState?.logs[1]).toEqual(log2);
    });

    it('should create new node state when adding log to non-existent node', () => {
      const log = {
        timestamp: new Date(),
        level: LogLevel.INFO,
        message: 'Node created via log',
        category: 'system'
      };

      store.actions.addNodeLog('new-node-1', 'test-workflow-1', log);

      const nodeState = store.nodeStates.get('new-node-1');
      expect(nodeState).toBeDefined();
      expect(nodeState?.status).toBe('pending');
      expect(nodeState?.logs).toHaveLength(1);
      expect(nodeState?.logs[0]).toEqual(log);
    });
  });

  describe('State Querying and Filtering', () => {
    beforeEach(() => {
      // Set up test data
      store.actions.updateNodeStatus('node-1', 'workflow-1', 'running');
      store.actions.updateNodeStatus('node-2', 'workflow-1', 'completed');
      store.actions.updateNodeStatus('node-3', 'workflow-1', 'error');
      store.actions.updateNodeStatus('node-4', 'workflow-2', 'running');
      store.actions.updateNodeStatus('node-5', 'workflow-2', 'pending');
    });

    it('should get nodes by workflow ID', () => {
      const workflow1Nodes = store.actions.getNodesByWorkflow('workflow-1');
      const workflow2Nodes = store.actions.getNodesByWorkflow('workflow-2');

      expect(workflow1Nodes).toHaveLength(3);
      expect(workflow2Nodes).toHaveLength(2);
      
      expect(workflow1Nodes.map(n => n.nodeId).sort()).toEqual(['node-1', 'node-2', 'node-3']);
      expect(workflow2Nodes.map(n => n.nodeId).sort()).toEqual(['node-4', 'node-5']);
    });

    it('should get nodes by status', () => {
      const runningNodes = store.actions.getNodesByStatus('running');
      const completedNodes = store.actions.getNodesByStatus('completed');
      const errorNodes = store.actions.getNodesByStatus('error');
      const pendingNodes = store.actions.getNodesByStatus('pending');

      expect(runningNodes.map(n => n.nodeId).sort()).toEqual(['node-1', 'node-4']);
      expect(completedNodes.map(n => n.nodeId)).toEqual(['node-2']);
      expect(errorNodes.map(n => n.nodeId)).toEqual(['node-3']);
      expect(pendingNodes.map(n => n.nodeId)).toEqual(['node-5']);
    });

    it('should check if node is running', () => {
      expect(store.actions.isNodeRunning('node-1')).toBe(true);
      expect(store.actions.isNodeRunning('node-2')).toBe(false);
      expect(store.actions.isNodeRunning('node-3')).toBe(false);
      expect(store.actions.isNodeRunning('node-4')).toBe(true);
      expect(store.actions.isNodeRunning('node-5')).toBe(false);
      expect(store.actions.isNodeRunning('non-existent')).toBe(false);
    });

    it('should clear individual node states', () => {
      expect(store.nodeStates.size).toBe(5);
      
      store.actions.clearNodeState('node-1');
      expect(store.nodeStates.size).toBe(4);
      expect(store.nodeStates.has('node-1')).toBe(false);
    });

    it('should clear workflow states', () => {
      expect(store.nodeStates.size).toBe(5);
      
      store.actions.clearWorkflowStates('workflow-1');
      expect(store.nodeStates.size).toBe(2);
      
      // Only workflow-2 nodes should remain
      const remainingNodes = Array.from(store.nodeStates.values());
      expect(remainingNodes.every(n => n.workflowId === 'workflow-2')).toBe(true);
    });

    it('should clear all states', () => {
      expect(store.nodeStates.size).toBe(5);
      
      store.actions.clearAllStates();
      expect(store.nodeStates.size).toBe(0);
    });
  });

  describe('Subscription Management', () => {
    it('should create and manage subscriptions', () => {
      const callback = jest.fn();
      
      const subscriptionId = store.actions.subscribe('test-node-1', callback);
      
      expect(store.subscriptions.has(subscriptionId)).toBe(true);
      const subscription = store.subscriptions.get(subscriptionId);
      expect(subscription?.nodeId).toBe('test-node-1');
      expect(subscription?.callback).toBe(callback);
    });

    it('should call subscription callback on matching node updates', () => {
      const callback = jest.fn();
      
      store.actions.subscribe('test-node-1', callback);
      store.actions.updateNodeStatus('test-node-1', 'test-workflow-1', 'running');
      
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          nodeId: 'test-node-1',
          status: 'running'
        })
      );
    });

    it('should not call subscription callback for non-matching nodes', () => {
      const callback = jest.fn();
      
      store.actions.subscribe('test-node-1', callback);
      store.actions.updateNodeStatus('test-node-2', 'test-workflow-1', 'running');
      
      expect(callback).not.toHaveBeenCalled();
    });

    it('should apply subscription filters', () => {
      const callback = jest.fn();
      const filter = (update: NodeUpdatePayload) => update.type === 'progress';
      
      store.actions.subscribe('test-node-1', callback, filter);
      
      // Status update should not trigger callback
      store.actions.updateNodeStatus('test-node-1', 'test-workflow-1', 'running');
      expect(callback).not.toHaveBeenCalled();
      
      // Progress update should trigger callback
      store.actions.updateNodeProgress('test-node-1', 'test-workflow-1', {
        current: 50,
        total: 100
      });
      expect(callback).toHaveBeenCalled();
    });

    it('should unsubscribe specific subscriptions', () => {
      const callback = jest.fn();
      
      const subscriptionId = store.actions.subscribe('test-node-1', callback);
      expect(store.subscriptions.has(subscriptionId)).toBe(true);
      
      store.actions.unsubscribe(subscriptionId);
      expect(store.subscriptions.has(subscriptionId)).toBe(false);
      
      // Should not call callback after unsubscription
      store.actions.updateNodeStatus('test-node-1', 'test-workflow-1', 'running');
      expect(callback).not.toHaveBeenCalled();
    });

    it('should unsubscribe all subscriptions', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      store.actions.subscribe('test-node-1', callback1);
      store.actions.subscribe('test-node-2', callback2);
      
      expect(store.subscriptions.size).toBe(2);
      
      store.actions.unsubscribeAll();
      expect(store.subscriptions.size).toBe(0);
    });

    it('should generate unique subscription IDs', () => {
      const callback = jest.fn();
      
      const id1 = store.actions.subscribe('test-node-1', callback);
      const id2 = store.actions.subscribe('test-node-1', callback);
      const id3 = store.actions.subscribe('test-node-2', callback);
      
      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });
  });

  describe('Connection Management', () => {
    it('should initialize with default configuration', () => {
      expect(store.connectionState).toBe('disconnected');
      expect(store.connection).toBeNull();
      expect(store.reconnectAttempts).toBe(0);
      expect(store.isManuallyDisconnected).toBe(false);
    });

    it('should establish WebSocket connection', async () => {
      await act(async () => {
        await store.actions.connect();
      });
      
      expect(store.connectionState).toBe('connecting');
      expect(store.connection).toBeInstanceOf(MockWebSocket);
      expect(store.lastConnectionAttempt).toBeInstanceOf(Date);
    });

    it('should establish EventSource connection when configured', async () => {
      const config: Partial<ConnectionConfig> = {
        useWebSocket: false,
        eventSourceUrl: 'http://localhost:8000/events'
      };
      
      await act(async () => {
        await store.actions.connect(config);
      });
      
      expect(store.connectionState).toBe('connecting');
      expect(store.connection).toBeInstanceOf(MockEventSource);
    });

    it('should handle connection open event', async () => {
      await act(async () => {
        await store.actions.connect();
      });
      
      // Simulate connection open
      act(() => {
        store.actions.handleConnectionOpen();
      });
      
      expect(store.connectionState).toBe('connected');
      expect(store.reconnectAttempts).toBe(0);
    });

    it('should handle manual disconnect', () => {
      store.actions.disconnect();
      
      expect(store.isManuallyDisconnected).toBe(true);
      expect(store.connectionState).toBe('disconnected');
      expect(store.reconnectAttempts).toBe(0);
    });

    it('should not reconnect when manually disconnected', async () => {
      await act(async () => {
        await store.actions.connect();
      });
      
      store.actions.disconnect();
      
      // Attempt reconnect should not work
      await act(async () => {
        await store.actions.reconnect();
      });
      
      expect(store.connectionState).toBe('disconnected');
    });

    it('should respect max reconnection attempts', async () => {
      const config: Partial<ConnectionConfig> = {
        maxReconnectAttempts: 3
      };
      
      await act(async () => {
        await store.actions.connect(config);
      });
      
      // Simulate multiple reconnection attempts
      useNodeExecutionStore.setState({ reconnectAttempts: 3 });
      
      await act(async () => {
        await store.actions.reconnect();
      });
      
      expect(store.connectionState).toBe('error');
    });

    it('should prevent multiple simultaneous connections', async () => {
      // First connection
      await act(async () => {
        await store.actions.connect();
      });
      
      const firstConnection = store.connection;
      
      // Second connection attempt should be ignored
      await act(async () => {
        await store.actions.connect();
      });
      
      expect(store.connection).toBe(firstConnection);
    });
  });

  describe('Message Handling', () => {
    beforeEach(async () => {
      await act(async () => {
        await store.actions.connect();
      });
      
      act(() => {
        store.actions.handleConnectionOpen();
      });
    });

    it('should handle heartbeat messages', () => {
      const heartbeatMessage = {
        type: 'heartbeat',
        timestamp: new Date().toISOString()
      };
      
      const mockEvent = {
        data: JSON.stringify(heartbeatMessage)
      } as MessageEvent;
      
      act(() => {
        store.actions.handleMessage(mockEvent);
      });
      
      expect(store.metrics.lastHeartbeat).toBeInstanceOf(Date);
    });

    it('should handle workflow events and create node updates', () => {
      const workflowEvent = createMockWorkflowEvent({
        type: 'node_started',
        data: { status: 'running' }
      });
      
      const mockEvent = {
        data: JSON.stringify(workflowEvent)
      } as MessageEvent;
      
      act(() => {
        store.actions.handleMessage(mockEvent);
      });
      
      const nodeState = store.nodeStates.get('test-node-1');
      expect(nodeState?.status).toBe('running');
      expect(store.metrics.totalUpdatesReceived).toBe(1);
    });

    it('should handle node progress events', () => {
      const progressEvent = createMockWorkflowEvent({
        type: 'node_progress',
        data: {
          progress: { current: 75, total: 100, percentage: 75 }
        }
      });
      
      const mockEvent = {
        data: JSON.stringify(progressEvent)
      } as MessageEvent;
      
      act(() => {
        store.actions.handleMessage(mockEvent);
      });
      
      const nodeState = store.nodeStates.get('test-node-1');
      expect(nodeState?.progress).toEqual({
        current: 75,
        total: 100,
        percentage: 75
      });
    });

    it('should handle node error events', () => {
      const errorEvent = createMockWorkflowEvent({
        type: 'node_error',
        data: {
          error: {
            message: 'Processing failed',
            code: 'PROCESSING_ERROR',
            recoverable: true
          }
        }
      });
      
      const mockEvent = {
        data: JSON.stringify(errorEvent)
      } as MessageEvent;
      
      act(() => {
        store.actions.handleMessage(mockEvent);
      });
      
      const nodeState = store.nodeStates.get('test-node-1');
      expect(nodeState?.status).toBe('error');
      expect(nodeState?.error?.message).toBe('Processing failed');
    });

    it('should handle malformed messages gracefully', () => {
      const malformedEvent = {
        data: 'invalid-json'
      } as MessageEvent;
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      act(() => {
        store.actions.handleMessage(malformedEvent);
      });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to handle message:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Offline Queue Management', () => {
    it('should queue updates when disconnected', () => {
      // Set disconnected state
      useNodeExecutionStore.setState({ connectionState: 'disconnected' });
      
      const workflowEvent = createMockWorkflowEvent();
      const mockEvent = {
        data: JSON.stringify(workflowEvent)
      } as MessageEvent;
      
      act(() => {
        store.actions.handleMessage(mockEvent);
      });
      
      expect(store.offlineQueue).toHaveLength(1);
      expect(store.offlineQueue[0].payload.nodeId).toBe('test-node-1');
    });

    it('should process offline queue when connected', async () => {
      // Add items to offline queue
      const offlineUpdate: OfflineUpdate = {
        id: 'test-offline-1',
        payload: createMockUpdatePayload(),
        timestamp: new Date(),
        retryCount: 0,
        maxRetries: 3
      };
      
      useNodeExecutionStore.setState({
        connectionState: 'connected',
        offlineQueue: [offlineUpdate]
      });
      
      await act(async () => {
        await store.actions.processOfflineQueue();
      });
      
      expect(store.offlineQueue).toHaveLength(0);
      expect(store.nodeStates.has('test-node-1')).toBe(true);
    });

    it('should retry failed offline updates', async () => {
      const failingUpdate: OfflineUpdate = {
        id: 'test-failing-1',
        payload: {
          ...createMockUpdatePayload(),
          nodeId: '', // Invalid nodeId to cause failure
        },
        timestamp: new Date(),
        retryCount: 0,
        maxRetries: 3
      };
      
      useNodeExecutionStore.setState({
        connectionState: 'connected',
        offlineQueue: [failingUpdate]
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await act(async () => {
        await store.actions.processOfflineQueue();
      });
      
      // Should retry and increment retry count
      const remainingUpdate = store.offlineQueue[0];
      expect(remainingUpdate?.retryCount).toBe(1);
      
      consoleSpy.mockRestore();
    });

    it('should remove updates after max retries', async () => {
      const exhaustedUpdate: OfflineUpdate = {
        id: 'test-exhausted-1',
        payload: {
          ...createMockUpdatePayload(),
          nodeId: '', // Invalid nodeId
        },
        timestamp: new Date(),
        retryCount: 3,
        maxRetries: 3
      };
      
      useNodeExecutionStore.setState({
        connectionState: 'connected',
        offlineQueue: [exhaustedUpdate]
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await act(async () => {
        await store.actions.processOfflineQueue();
      });
      
      expect(store.offlineQueue).toHaveLength(0);
      
      consoleSpy.mockRestore();
    });

    it('should clear offline queue', () => {
      const update1 = createMockUpdatePayload({ nodeId: 'node-1' });
      const update2 = createMockUpdatePayload({ nodeId: 'node-2' });
      
      useNodeExecutionStore.setState({
        offlineQueue: [
          {
            id: 'test-1',
            payload: update1,
            timestamp: new Date(),
            retryCount: 0,
            maxRetries: 3
          },
          {
            id: 'test-2',
            payload: update2,
            timestamp: new Date(),
            retryCount: 0,
            maxRetries: 3
          }
        ]
      });
      
      expect(store.offlineQueue).toHaveLength(2);
      
      store.actions.clearOfflineQueue();
      expect(store.offlineQueue).toHaveLength(0);
    });
  });

  describe('Connection Health Monitoring', () => {
    it('should report healthy connection', () => {
      useNodeExecutionStore.setState({
        connectionState: 'connected',
        reconnectAttempts: 0,
        offlineQueue: [],
        metrics: {
          ...store.metrics,
          lastHeartbeat: new Date()
        }
      });
      
      const health = store.actions.getConnectionHealth();
      
      expect(health.isHealthy).toBe(true);
      expect(health.issues).toHaveLength(0);
    });

    it('should report connection issues', () => {
      useNodeExecutionStore.setState({
        connectionState: 'error',
        reconnectAttempts: 3,
        offlineQueue: [
          {
            id: 'test',
            payload: createMockUpdatePayload(),
            timestamp: new Date(),
            retryCount: 0,
            maxRetries: 3
          }
        ],
        metrics: {
          ...store.metrics,
          lastHeartbeat: new Date(Date.now() - 120000) // 2 minutes ago
        }
      });
      
      const health = store.actions.getConnectionHealth();
      
      expect(health.isHealthy).toBe(false);
      expect(health.issues.length).toBeGreaterThan(0);
      expect(health.issues).toContain('Connection state: error');
      expect(health.issues).toContain('Reconnection attempts: 3');
      expect(health.issues).toContain('Pending offline updates: 1');
      expect(health.issues).toContain('Heartbeat timeout');
    });

    it('should detect heartbeat timeout', () => {
      const oldHeartbeat = new Date(Date.now() - 65000); // More than 1 minute ago
      
      useNodeExecutionStore.setState({
        connectionState: 'connected',
        connectionConfig: {
          ...store.connectionConfig,
          heartbeatInterval: 30000 // 30 seconds
        },
        metrics: {
          ...store.metrics,
          lastHeartbeat: oldHeartbeat
        }
      });
      
      const health = store.actions.getConnectionHealth();
      
      expect(health.isHealthy).toBe(false);
      expect(health.issues).toContain('Heartbeat timeout');
    });
  });

  describe('Connection Error Handling', () => {
    it('should handle connection close and attempt reconnect', async () => {
      await act(async () => {
        await store.actions.connect();
      });
      
      act(() => {
        store.actions.handleConnectionOpen();
      });
      
      expect(store.connectionState).toBe('connected');
      
      // Simulate connection close
      const closeEvent = new CloseEvent('close', { code: 1006, reason: 'Connection lost' });
      
      await act(async () => {
        store.actions.handleConnectionClose(closeEvent);
      });
      
      expect(store.connection).toBeNull();
    });

    it('should handle connection errors', async () => {
      await act(async () => {
        await store.actions.connect();
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      act(() => {
        store.actions.handleConnectionError(new Event('error'));
      });
      
      expect(consoleSpy).toHaveBeenCalledWith('Connection error:', expect.any(Event));
      
      consoleSpy.mockRestore();
    });

    it('should not reconnect when manually disconnected', async () => {
      await act(async () => {
        await store.actions.connect();
      });
      
      store.actions.disconnect();
      
      // Simulate connection close after manual disconnect
      const closeEvent = new CloseEvent('close', { code: 1000, reason: 'Manual disconnect' });
      
      await act(async () => {
        store.actions.handleConnectionClose(closeEvent);
      });
      
      expect(store.connectionState).toBe('disconnected');
    });
  });

  describe('Metrics and Performance', () => {
    it('should track update metrics', () => {
      expect(store.metrics.totalUpdatesReceived).toBe(0);
      
      store.actions.updateNodeStatus('test-node-1', 'test-workflow-1', 'running');
      store.actions.updateNodeProgress('test-node-2', 'test-workflow-1', { current: 50, total: 100 });
      
      expect(store.metrics.totalUpdatesReceived).toBe(2);
    });

    it('should track heartbeat timestamps', () => {
      expect(store.metrics.lastHeartbeat).toBeNull();
      
      act(() => {
        store.actions.handleConnectionOpen();
      });
      
      expect(store.metrics.lastHeartbeat).toBeInstanceOf(Date);
    });

    it('should maintain version consistency', () => {
      store.actions.updateNodeStatus('test-node-1', 'test-workflow-1', 'running');
      const firstState = store.nodeStates.get('test-node-1');
      
      store.actions.updateNodeProgress('test-node-1', 'test-workflow-1', { current: 50, total: 100 });
      const secondState = store.nodeStates.get('test-node-1');
      
      expect(secondState?.version).toBe((firstState?.version || 0) + 1);
    });
  });

  describe('Edge Cases and Error Conditions', () => {
    it('should handle updates for non-existent configurations', () => {
      const update = createMockUpdatePayload({
        nodeId: 'non-existent-node',
        data: { status: 'running' }
      });
      
      // Should not throw error
      expect(() => {
        store.actions.updateNodeState(update);
      }).not.toThrow();
      
      const nodeState = store.nodeStates.get('non-existent-node');
      expect(nodeState).toBeDefined();
      expect(nodeState?.status).toBe('running');
    });

    it('should handle empty or invalid data in updates', () => {
      const update = createMockUpdatePayload({
        data: {} // Empty data
      });
      
      expect(() => {
        store.actions.updateNodeState(update);
      }).not.toThrow();
      
      const nodeState = store.nodeStates.get('test-node-1');
      expect(nodeState).toBeDefined();
    });

    it('should handle subscription callbacks that throw errors', () => {
      const throwingCallback = jest.fn(() => {
        throw new Error('Callback error');
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      store.actions.subscribe('test-node-1', throwingCallback);
      store.actions.updateNodeStatus('test-node-1', 'test-workflow-1', 'running');
      
      expect(throwingCallback).toHaveBeenCalled();
      // Store should continue functioning despite callback error
      expect(store.nodeStates.get('test-node-1')?.status).toBe('running');
      
      consoleSpy.mockRestore();
    });

    it('should handle large numbers of subscriptions', () => {
      const callbacks = Array.from({ length: 1000 }, () => jest.fn());
      const subscriptionIds = callbacks.map(callback =>
        store.actions.subscribe('test-node-1', callback)
      );
      
      expect(store.subscriptions.size).toBe(1000);
      
      store.actions.updateNodeStatus('test-node-1', 'test-workflow-1', 'running');
      
      callbacks.forEach(callback => {
        expect(callback).toHaveBeenCalled();
      });
      
      // Clean up
      subscriptionIds.forEach(id => store.actions.unsubscribe(id));
      expect(store.subscriptions.size).toBe(0);
    });
  });
});
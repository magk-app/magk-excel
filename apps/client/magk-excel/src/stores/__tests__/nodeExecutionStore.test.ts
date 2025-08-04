/**
 * Tests for NodeExecutionStore
 * Compatible with multiple testing frameworks (Jest, Vitest, etc.)
 */

import { useNodeExecutionStore } from '../nodeExecutionStore';
import { NodeStatus, LogLevel } from '../../types/workflow';

// Mock WebSocket and EventSource for testing
if (typeof global !== 'undefined') {
  (global as any).WebSocket = class MockWebSocket {
    close = jest?.fn?.() || (() => {});
    send = jest?.fn?.() || (() => {});
    addEventListener = jest?.fn?.() || (() => {});
    removeEventListener = jest?.fn?.() || (() => {});
    readyState = 0; // CONNECTING
    onopen: any = null;
    onmessage: any = null;
    onclose: any = null;
    onerror: any = null;
  };

  (global as any).EventSource = class MockEventSource {
    close = jest?.fn?.() || (() => {});
    addEventListener = jest?.fn?.() || (() => {});
    removeEventListener = jest?.fn?.() || (() => {});
    readyState = 0; // CONNECTING
    onopen: any = null;
    onmessage: any = null;
    onerror: any = null;
  };
}

describe('NodeExecutionStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const store = useNodeExecutionStore.getState();
    store.actions.clearAllStates();
    store.actions.disconnect();
    // Clear mocks if available
    if (typeof jest !== 'undefined' && jest.clearAllMocks) {
      jest.clearAllMocks();
    }
  });

  afterEach(() => {
    // Clean up after each test
    const store = useNodeExecutionStore.getState();
    store.actions.disconnect();
  });

  describe('Node State Management', () => {
    it('should update node status', () => {
      const store = useNodeExecutionStore.getState();
      
      store.actions.updateNodeStatus('node-1', 'workflow-1', 'running');
      
      const nodeState = store.actions.getNodeState('node-1');
      expect(nodeState).toBeDefined();
      expect(nodeState?.status).toBe('running');
      expect(nodeState?.nodeId).toBe('node-1');
      expect(nodeState?.workflowId).toBe('workflow-1');
    });

    it('should update node progress', () => {
      const store = useNodeExecutionStore.getState();
      
      const progress = {
        current: 50,
        total: 100,
        percentage: 50,
        message: 'Processing data...',
      };
      
      store.actions.updateNodeProgress('node-1', 'workflow-1', progress);
      
      const nodeState = store.actions.getNodeState('node-1');
      expect(nodeState?.progress).toEqual(progress);
    });

    it('should update node error', () => {
      const store = useNodeExecutionStore.getState();
      
      const error = {
        message: 'Connection failed',
        code: 'NETWORK_ERROR',
        recoverable: true,
        suggestions: ['Check network connection'],
      };
      
      store.actions.updateNodeError('node-1', 'workflow-1', error);
      
      const nodeState = store.actions.getNodeState('node-1');
      expect(nodeState?.error).toEqual(error);
      expect(nodeState?.status).toBe('error');
    });

    it('should update node result', () => {
      const store = useNodeExecutionStore.getState();
      
      const result = {
        rowCount: 1000,
        columnCount: 5,
        data: { results: 'test data' },
      };
      
      store.actions.updateNodeResult('node-1', 'workflow-1', result);
      
      const nodeState = store.actions.getNodeState('node-1');
      expect(nodeState?.result).toEqual(result);
      expect(nodeState?.status).toBe('completed');
    });

    it('should add node logs', () => {
      const store = useNodeExecutionStore.getState();
      
      const log = {
        timestamp: new Date(),
        level: LogLevel.INFO,
        message: 'Processing started',
        category: 'execution',
      };
      
      store.actions.addNodeLog('node-1', 'workflow-1', log);
      
      const nodeState = store.actions.getNodeState('node-1');
      expect(nodeState?.logs).toHaveLength(1);
      expect(nodeState?.logs[0]).toEqual(log);
    });

    it('should clear node state', () => {
      const store = useNodeExecutionStore.getState();
      
      store.actions.updateNodeStatus('node-1', 'workflow-1', 'running');
      expect(store.actions.getNodeState('node-1')).toBeDefined();
      
      store.actions.clearNodeState('node-1');
      expect(store.actions.getNodeState('node-1')).toBeUndefined();
    });

    it('should clear workflow states', () => {
      const store = useNodeExecutionStore.getState();
      
      store.actions.updateNodeStatus('node-1', 'workflow-1', 'running');
      store.actions.updateNodeStatus('node-2', 'workflow-1', 'pending');
      store.actions.updateNodeStatus('node-3', 'workflow-2', 'running');
      
      store.actions.clearWorkflowStates('workflow-1');
      
      expect(store.actions.getNodeState('node-1')).toBeUndefined();
      expect(store.actions.getNodeState('node-2')).toBeUndefined();
      expect(store.actions.getNodeState('node-3')).toBeDefined();
    });
  });

  describe('Querying', () => {
    it('should get nodes by workflow', () => {
      const store = useNodeExecutionStore.getState();
      
      store.actions.updateNodeStatus('node-1', 'workflow-1', 'running');
      store.actions.updateNodeStatus('node-2', 'workflow-1', 'pending');
      store.actions.updateNodeStatus('node-3', 'workflow-2', 'running');
      
      const workflow1Nodes = store.actions.getNodesByWorkflow('workflow-1');
      expect(workflow1Nodes).toHaveLength(2);
      expect(workflow1Nodes.map(n => n.nodeId)).toEqual(['node-1', 'node-2']);
    });

    it('should get nodes by status', () => {
      const store = useNodeExecutionStore.getState();
      
      store.actions.updateNodeStatus('node-1', 'workflow-1', 'running');
      store.actions.updateNodeStatus('node-2', 'workflow-1', 'running');
      store.actions.updateNodeStatus('node-3', 'workflow-1', 'pending');
      
      const runningNodes = store.actions.getNodesByStatus('running');
      expect(runningNodes).toHaveLength(2);
      expect(runningNodes.map(n => n.nodeId)).toEqual(['node-1', 'node-2']);
    });

    it('should check if node is running', () => {
      const store = useNodeExecutionStore.getState();
      
      store.actions.updateNodeStatus('node-1', 'workflow-1', 'running');
      store.actions.updateNodeStatus('node-2', 'workflow-1', 'pending');
      
      expect(store.actions.isNodeRunning('node-1')).toBe(true);
      expect(store.actions.isNodeRunning('node-2')).toBe(false);
      expect(store.actions.isNodeRunning('node-3')).toBe(false);
    });
  });

  describe('Subscriptions', () => {
    it('should subscribe and unsubscribe to node updates', () => {
      const store = useNodeExecutionStore.getState();
      const callback = jest?.fn?.() || (() => {});
      
      const subscriptionId = store.actions.subscribe('node-1', callback);
      expect(store.subscriptions.has(subscriptionId)).toBe(true);
      
      store.actions.unsubscribe(subscriptionId);
      expect(store.subscriptions.has(subscriptionId)).toBe(false);
    });

    it('should call subscription callback on node update', () => {
      const store = useNodeExecutionStore.getState();
      const callback = jest?.fn?.() || (() => {});
      
      store.actions.subscribe('node-1', callback);
      store.actions.updateNodeStatus('node-1', 'workflow-1', 'running');
      
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          nodeId: 'node-1',
          status: 'running',
        })
      );
    });

    it('should filter subscription updates', () => {
      const store = useNodeExecutionStore.getState();
      const callback = jest?.fn?.() || (() => {});
      const filter = (update: any) => update.type === 'progress';
      
      store.actions.subscribe('node-1', callback, filter);
      
      // This should not trigger callback (wrong type)
      store.actions.updateNodeStatus('node-1', 'workflow-1', 'running');
      expect(callback).not.toHaveBeenCalled();
      
      // This should trigger callback (correct type)
      store.actions.updateNodeProgress('node-1', 'workflow-1', {
        current: 50,
        total: 100,
        percentage: 50,
      });
      expect(callback).toHaveBeenCalled();
    });

    it('should unsubscribe all subscriptions', () => {
      const store = useNodeExecutionStore.getState();
      
      store.actions.subscribe('node-1', jest?.fn?.() || (() => {}));
      store.actions.subscribe('node-2', vi.fn());
      expect(store.subscriptions.size).toBe(2);
      
      store.actions.unsubscribeAll();
      expect(store.subscriptions.size).toBe(0);
    });
  });

  describe('Connection Management', () => {
    it('should initialize with disconnected state', () => {
      const store = useNodeExecutionStore.getState();
      expect(store.connectionState).toBe('disconnected');
      expect(store.connection).toBeNull();
    });

    it('should update connection state when connecting', async () => {
      const store = useNodeExecutionStore.getState();
      
      // Mock WebSocket constructor
      const mockWs = {
        onopen: null,
        onmessage: null,
        onclose: null,
        onerror: null,
        close: jest?.fn?.() || (() => {}),
      };
      (global.WebSocket as any).mockImplementation(() => mockWs);
      
      await store.actions.connect();
      
      expect(store.connectionState).toBe('connecting');
      expect(store.connection).toBeDefined();
    });

    it('should handle connection open', () => {
      const store = useNodeExecutionStore.getState();
      
      store.actions.handleConnectionOpen();
      
      expect(store.connectionState).toBe('connected');
      expect(store.reconnectAttempts).toBe(0);
    });

    it('should handle manual disconnect', () => {
      const store = useNodeExecutionStore.getState();
      
      store.actions.disconnect();
      
      expect(store.isManuallyDisconnected).toBe(true);
      expect(store.connectionState).toBe('disconnected');
    });
  });

  describe('Offline Queue', () => {
    it('should queue updates when disconnected', () => {
      const store = useNodeExecutionStore.getState();
      
      // Simulate offline state
      useNodeExecutionStore.setState({ connectionState: 'disconnected' });
      
      const mockEvent = {
        data: JSON.stringify({
          type: 'node_started',
          workflowId: 'workflow-1',
          nodeId: 'node-1',
          timestamp: new Date().toISOString(),
          data: { status: 'running' },
        }),
      };
      
      store.actions.handleMessage(mockEvent as MessageEvent);
      
      expect(store.offlineQueue.length).toBe(1);
    });

    it('should clear offline queue', () => {
      const store = useNodeExecutionStore.getState();
      
      // Add items to queue
      useNodeExecutionStore.setState({
        offlineQueue: [
          {
            id: 'test-1',
            payload: {
              nodeId: 'node-1',
              workflowId: 'workflow-1',
              type: 'status',
              data: { status: 'running' },
              timestamp: new Date(),
            },
            timestamp: new Date(),
            retryCount: 0,
            maxRetries: 3,
          },
        ],
      });
      
      expect(store.offlineQueue.length).toBe(1);
      
      store.actions.clearOfflineQueue();
      expect(store.offlineQueue.length).toBe(0);
    });
  });

  describe('Connection Health', () => {
    it('should report healthy connection', () => {
      const store = useNodeExecutionStore.getState();
      
      // Set up healthy state
      useNodeExecutionStore.setState({
        connectionState: 'connected',
        reconnectAttempts: 0,
        offlineQueue: [],
        metrics: {
          ...store.metrics,
          lastHeartbeat: new Date(),
        },
      });
      
      const health = store.actions.getConnectionHealth();
      expect(health.isHealthy).toBe(true);
      expect(health.issues).toHaveLength(0);
    });

    it('should report connection issues', () => {
      const store = useNodeExecutionStore.getState();
      
      // Set up unhealthy state
      useNodeExecutionStore.setState({
        connectionState: 'error',
        reconnectAttempts: 3,
        offlineQueue: [
          {
            id: 'test',
            payload: {} as any,
            timestamp: new Date(),
            retryCount: 0,
            maxRetries: 3,
          },
        ],
      });
      
      const health = store.actions.getConnectionHealth();
      expect(health.isHealthy).toBe(false);
      expect(health.issues.length).toBeGreaterThan(0);
    });
  });
});
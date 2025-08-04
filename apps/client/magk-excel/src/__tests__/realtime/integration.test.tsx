/**
 * Comprehensive Integration Test Suite for Real-time Workflow Functionality
 * Tests end-to-end scenarios including full workflow execution simulation,
 * multiple node updates, connection failure recovery, and data consistency.
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { RealtimeService } from '../../services/realtimeService';
import { 
  useNodeExecutionStore,
  type NodeExecutionState,
  type NodeUpdatePayload,
  type ConnectionConfig
} from '../../stores/nodeExecutionStore';
import { RealtimeWorkflowNode } from '../../components/workflow/RealtimeWorkflowNode';
import { WorkflowNodeData, NodeStatus, LogLevel, WorkflowEvent } from '../../types/workflow';

// Enhanced WebSocket Mock for integration testing
class IntegrationWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  public readyState = IntegrationWebSocket.CONNECTING;
  public onopen: ((event: Event) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onclose: ((event: CloseEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;

  public url: string;
  public sentMessages: any[] = [];
  private messageHandlers: Map<string, (data: Record<string, unknown>) => void> = new Map();

  constructor(url: string) {
    this.url = url;
    // Add to global registry for test control
    (global as any).integrationWebSockets = (global as any).integrationWebSockets || [];
    (global as any).integrationWebSockets.push(this);
  }

  send = jest.fn((data: string) => {
    if (this.readyState !== IntegrationWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    const parsed = JSON.parse(data);
    this.sentMessages.push(parsed);
    
    // Handle specific message types
    if (this.messageHandlers.has(parsed.type)) {
      this.messageHandlers.get(parsed.type)!(parsed);
    }
  });

  close = jest.fn((code?: number, reason?: string) => {
    this.readyState = IntegrationWebSocket.CLOSING;
    setTimeout(() => {
      this.readyState = IntegrationWebSocket.CLOSED;
      if (this.onclose) {
        this.onclose(new CloseEvent('close', { code: code || 1000, reason: reason || '' }));
      }
    }, 10);
  });

  // Test utilities
  simulateOpen() {
    this.readyState = IntegrationWebSocket.OPEN;
    if (this.onopen) {
      this.onopen(new Event('open'));
    }
  }

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
    this.readyState = IntegrationWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close', { code, reason }));
    }
  }

  // Add message handler for automatic responses
  addMessageHandler(type: string, handler: (data: Record<string, unknown>) => void) {
    this.messageHandlers.set(type, handler);
  }

  getSentMessages() {
    return this.sentMessages;
  }

  clearSentMessages() {
    this.sentMessages = [];
  }
}

// Mock EventSource for integration testing
class IntegrationEventSource {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 2;

  public readyState = IntegrationEventSource.CONNECTING;
  public onopen: ((event: Event) => void) | null = null;
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onerror: ((event: Event) => void) | null = null;

  public url: string;

  constructor(url: string) {
    this.url = url;
    (global as any).integrationEventSources = (global as any).integrationEventSources || [];
    (global as any).integrationEventSources.push(this);
  }

  close = jest.fn(() => {
    this.readyState = IntegrationEventSource.CLOSED;
  });

  simulateOpen() {
    this.readyState = IntegrationEventSource.OPEN;
    if (this.onopen) {
      this.onopen(new Event('open'));
    }
  }

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
(global as any).WebSocket = IntegrationWebSocket;
(global as any).EventSource = IntegrationEventSource;

// Mock React components for integration testing
jest.mock('../../components/workflow/BaseWorkflowNode', () => ({
  BaseWorkflowNode: ({ data, selected, ...props }: { data: WorkflowNodeData; selected: boolean } & Record<string, unknown>) => (
    <div 
      data-testid="base-workflow-node"
      data-node-id={data.config.id}
      data-status={data.status}
      data-selected={selected}
      {...props}
    >
      <div data-testid="node-status">{data.status}</div>
      {data.progress && (
        <div data-testid="node-progress">
          {data.progress.current}/{data.progress.total}
          {data.progress.message && ` - ${data.progress.message}`}
        </div>
      )}
      {data.error && (
        <div data-testid="node-error">{data.error.message}</div>
      )}
      {data.result && (
        <div data-testid="node-result">{data.result.rowCount} rows</div>
      )}
    </div>
  )
}));

// Mock UI components
jest.mock('../../components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  Tooltip: ({ children }: React.PropsWithChildren) => children,
  TooltipTrigger: ({ children }: React.PropsWithChildren) => children,
  TooltipContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>
}));

jest.mock('../../components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: React.PropsWithChildren<{ onClick?: () => void; disabled?: boolean } & Record<string, unknown>>) => (
    <button onClick={onClick} disabled={disabled} data-testid="retry-button" {...props}>
      {children}
    </button>
  )
}));

jest.mock('../../components/ui/alert', () => ({
  Alert: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <div data-testid="alert" {...props}>{children}</div>,
  AlertDescription: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <div data-testid="alert-description" {...props}>{children}</div>
}));

jest.mock('../../components/ui/badge', () => ({
  Badge: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <span data-testid="badge" {...props}>{children}</span>
}));

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  RefreshCw: () => <div data-testid="refresh-icon" />,
  WifiOff: () => <div data-testid="wifi-off-icon" />,
  Wifi: () => <div data-testid="wifi-icon" />,
  AlertTriangle: () => <div data-testid="alert-icon" />,
  CheckCircle2: () => <div data-testid="check-icon" />
}));

// Test utilities
const createWorkflowNodeData = (overrides: Partial<WorkflowNodeData> = {}): WorkflowNodeData => ({
  type: 'web-scraping',
  config: {
    id: 'node-1',
    name: 'Web Scraping Node',
    url: 'https://example.com',
    extractFormat: 'table'
  },
  status: 'pending',
  logs: [],
  ...overrides
});

const createWorkflowEvent = (overrides: Partial<WorkflowEvent> = {}): WorkflowEvent => ({
  type: 'node_started',
  workflowId: 'workflow-1',
  nodeId: 'node-1',
  timestamp: new Date(),
  data: {},
  ...overrides
});

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Integration test wrapper
const IntegrationTestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div data-testid="integration-wrapper">
    {children}
  </div>
);

describe('Real-time Workflow Integration Tests', () => {
  let realtimeService: RealtimeService;
  let store: ReturnType<typeof useNodeExecutionStore.getState>;

  beforeEach(() => {
    // Clear global WebSocket registry
    (global as any).integrationWebSockets = [];
    (global as any).integrationEventSources = [];

    // Reset timers
    jest.clearAllTimers();
    jest.useFakeTimers();

    // Create fresh instances
    realtimeService = new RealtimeService({
      websocketUrl: 'ws://localhost:8000/ws/test',
      reconnectIntervalMs: 100,
      heartbeatIntervalMs: 1000,
      enableDebugLogging: false
    });

    store = useNodeExecutionStore.getState();
    store.actions.clearAllStates();
    store.actions.disconnect();

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'info').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    // Clean up
    realtimeService.disconnect();
    store.actions.disconnect();
    
    // Restore console
    jest.restoreAllMocks();
    
    // Restore timers
    jest.useRealTimers();
  });

  describe('End-to-End Workflow Execution', () => {
    it('should handle complete workflow execution with multiple nodes', async () => {
      // Set up multiple nodes
      const nodes = [
        { id: 'node-1', name: 'Web Scraping', type: 'web-scraping' as const },
        { id: 'node-2', name: 'Transform Data', type: 'transform' as const },
        { id: 'node-3', name: 'Export Excel', type: 'excel-export' as const }
      ];

      // Connect service and store
      await connectServiceAndStore();

      // Start workflow execution
      const workflowEvents = [
        createWorkflowEvent({ type: 'node_started', nodeId: 'node-1', data: { status: 'running' } }),
        createWorkflowEvent({ 
          type: 'node_progress', 
          nodeId: 'node-1', 
          data: { progress: { current: 50, total: 100, message: 'Scraping data...' } } 
        }),
        createWorkflowEvent({ 
          type: 'node_completed', 
          nodeId: 'node-1', 
          data: { 
            status: 'completed', 
            result: { rowCount: 1000, columnCount: 5 } 
          } 
        }),
        createWorkflowEvent({ type: 'node_started', nodeId: 'node-2', data: { status: 'running' } }),
        createWorkflowEvent({ 
          type: 'node_progress', 
          nodeId: 'node-2', 
          data: { progress: { current: 75, total: 100, message: 'Transforming data...' } } 
        }),
        createWorkflowEvent({ 
          type: 'node_completed', 
          nodeId: 'node-2', 
          data: { 
            status: 'completed', 
            result: { rowCount: 1000, columnCount: 8 } 
          } 
        }),
        createWorkflowEvent({ type: 'node_started', nodeId: 'node-3', data: { status: 'running' } }),
        createWorkflowEvent({ 
          type: 'node_completed', 
          nodeId: 'node-3', 
          data: { 
            status: 'completed', 
            result: { data: { filePath: '/path/to/output.xlsx' } } 
          } 
        })
      ];

      // Simulate workflow execution
      const ws = getLastWebSocket();
      for (const event of workflowEvents) {
        ws.simulateMessage(event);
        await act(async () => {
          jest.advanceTimersByTime(100);
        });
      }

      // Verify final states
      const node1State = store.actions.getNodeState('node-1');
      const node2State = store.actions.getNodeState('node-2');
      const node3State = store.actions.getNodeState('node-3');

      expect(node1State?.status).toBe('completed');
      expect(node1State?.result?.rowCount).toBe(1000);

      expect(node2State?.status).toBe('completed');
      expect(node2State?.result?.columnCount).toBe(8);

      expect(node3State?.status).toBe('completed');
      expect((node3State?.result?.data as Record<string, unknown>)?.filePath).toBe('/path/to/output.xlsx');
    });

    it('should handle workflow with error recovery', async () => {
      await connectServiceAndStore();

      const ws = getLastWebSocket();

      // Start node execution
      ws.simulateMessage(createWorkflowEvent({ 
        type: 'node_started', 
        nodeId: 'node-1', 
        data: { status: 'running' } 
      }));

      // Simulate error
      ws.simulateMessage(createWorkflowEvent({ 
        type: 'node_error', 
        nodeId: 'node-1', 
        data: { 
          status: 'error',
          error: {
            message: 'Network timeout',
            code: 'NETWORK_ERROR',
            recoverable: true,
            suggestions: ['Check network connection', 'Retry operation']
          }
        } 
      }));

      let nodeState = store.actions.getNodeState('node-1');
      expect(nodeState?.status).toBe('error');
      expect(nodeState?.error?.recoverable).toBe(true);

      // Simulate retry and recovery
      ws.simulateMessage(createWorkflowEvent({ 
        type: 'node_started', 
        nodeId: 'node-1', 
        data: { status: 'running' } 
      }));

      ws.simulateMessage(createWorkflowEvent({ 
        type: 'node_completed', 
        nodeId: 'node-1', 
        data: { 
          status: 'completed',
          result: { rowCount: 500, columnCount: 3 }
        } 
      }));

      nodeState = store.actions.getNodeState('node-1');
      expect(nodeState?.status).toBe('completed');
      expect(nodeState?.error).toBeUndefined();
      expect(nodeState?.result?.rowCount).toBe(500);
    });

    it('should handle concurrent node execution', async () => {
      await connectServiceAndStore();

      const ws = getLastWebSocket();

      // Start multiple nodes concurrently
      const concurrentEvents = [
        createWorkflowEvent({ type: 'node_started', nodeId: 'node-1', data: { status: 'running' } }),
        createWorkflowEvent({ type: 'node_started', nodeId: 'node-2', data: { status: 'running' } }),
        createWorkflowEvent({ type: 'node_started', nodeId: 'node-3', data: { status: 'running' } })
      ];

      // Send events simultaneously
      await act(async () => {
        concurrentEvents.forEach(event => ws.simulateMessage(event));
        jest.advanceTimersByTime(50);
      });

      // Verify all nodes are running
      expect(store.actions.getNodeState('node-1')?.status).toBe('running');
      expect(store.actions.getNodeState('node-2')?.status).toBe('running');
      expect(store.actions.getNodeState('node-3')?.status).toBe('running');

      // Complete nodes at different times
      await act(async () => {
        ws.simulateMessage(createWorkflowEvent({ 
          type: 'node_completed', 
          nodeId: 'node-2', 
          data: { status: 'completed' } 
        }));
        jest.advanceTimersByTime(100);
      });

      await act(async () => {
        ws.simulateMessage(createWorkflowEvent({ 
          type: 'node_completed', 
          nodeId: 'node-1', 
          data: { status: 'completed' } 
        }));
        jest.advanceTimersByTime(100);
      });

      await act(async () => {
        ws.simulateMessage(createWorkflowEvent({ 
          type: 'node_completed', 
          nodeId: 'node-3', 
          data: { status: 'completed' } 
        }));
        jest.advanceTimersByTime(100);
      });

      // Verify final states
      expect(store.actions.getNodeState('node-1')?.status).toBe('completed');
      expect(store.actions.getNodeState('node-2')?.status).toBe('completed');
      expect(store.actions.getNodeState('node-3')?.status).toBe('completed');
    });
  });

  describe('Connection Failure and Recovery', () => {
    it('should handle connection loss and recovery with data consistency', async () => {
      await connectServiceAndStore();

      const ws = getLastWebSocket();

      // Start some node execution
      ws.simulateMessage(createWorkflowEvent({ 
        type: 'node_started', 
        nodeId: 'node-1', 
        data: { status: 'running' } 
      }));

      expect(store.actions.getNodeState('node-1')?.status).toBe('running');

      // Simulate connection loss
      await act(async () => {
        ws.simulateClose(1006, 'Connection lost');
        jest.advanceTimersByTime(50);
      });

      expect(store.connectionState).toBe('disconnected');

      // Try to send updates while disconnected (should be queued)
      const offlineUpdate = createWorkflowEvent({ 
        type: 'node_progress', 
        nodeId: 'node-1', 
        data: { progress: { current: 75, total: 100 } } 
      });

      // Simulate receiving update while offline
      store.actions.handleMessage({
        data: JSON.stringify(offlineUpdate)
      } as MessageEvent);

      expect(store.offlineQueue.length).toBe(1);

      // Reconnect
      await act(async () => {
        jest.advanceTimersByTime(200); // Wait for reconnection attempt
      });

      const newWs = getLastWebSocket();
      await act(async () => {
        newWs.simulateOpen();
        jest.advanceTimersByTime(100);
      });

      expect(store.connectionState).toBe('connected');

      // Process offline queue
      await act(async () => {
        await store.actions.processOfflineQueue();
      });

      expect(store.offlineQueue.length).toBe(0);
      const nodeState = store.actions.getNodeState('node-1');
      expect(nodeState?.progress?.current).toBe(75);
    });

    it('should handle multiple reconnection attempts with exponential backoff', async () => {
      await connectServiceAndStore();

      const ws = getLastWebSocket();

      // Simulate connection loss
      await act(async () => {
        ws.simulateClose(1006, 'Connection lost');
        jest.advanceTimersByTime(50);
      });

      // Track reconnection attempts
      const reconnectionTimes: number[] = [];
      const originalWebSocket = global.WebSocket;

      (global as any).WebSocket = jest.fn().mockImplementation((url: string) => {
        reconnectionTimes.push(Date.now());
        const mockWs = new IntegrationWebSocket(url);
        // Make first few attempts fail
        if (reconnectionTimes.length <= 3) {
          setTimeout(() => mockWs.simulateError(), 10);
        } else {
          setTimeout(() => mockWs.simulateOpen(), 10);
        }
        return mockWs;
      });

      // Advance time to trigger multiple reconnection attempts
      for (let i = 0; i < 5; i++) {
        await act(async () => {
          jest.advanceTimersByTime(Math.pow(2, i) * 200);
        });
      }

      expect(reconnectionTimes.length).toBeGreaterThan(3);

      // Restore original WebSocket
      (global as any).WebSocket = originalWebSocket;
    });

    it('should handle fallback to EventSource when WebSocket fails', async () => {
      const service = new RealtimeService({
        websocketUrl: 'ws://localhost:8000/ws/test',
        eventSourceUrl: 'http://localhost:8000/events/test',
        preferredType: 'websocket',
        fallbackToSecondary: true,
        reconnectIntervalMs: 100
      });

      // Connect (should try WebSocket first)
      const connectPromise = service.connect();
      
      await act(async () => {
        jest.advanceTimersByTime(50);
      });

      const ws = getLastWebSocket();
      await act(async () => {
        ws.simulateError(); // Fail WebSocket
        jest.advanceTimersByTime(100);
      });

      // Should fallback to EventSource
      const eventSources = (global as any).integrationEventSources || [];
      expect(eventSources.length).toBe(1);

      const es = eventSources[0];
      await act(async () => {
        es.simulateOpen();
        jest.advanceTimersByTime(50);
      });

      await connectPromise;

      const health = service.getConnectionHealth();
      expect(health.connectionState).toBe('connected');

      service.disconnect();
    });
  });

  describe('Real-time Component Integration', () => {
    it('should integrate RealtimeWorkflowNode with store updates', async () => {
      // Set up store connection
      await connectServiceAndStore();

      const nodeData = createWorkflowNodeData({
        config: { id: 'test-node', name: 'Test Node' },
        status: 'pending'
      });

      // Render component
      const onRetry = jest.fn();

      render(
        <IntegrationTestWrapper>
          <RealtimeWorkflowNode
            id="test-node"
            position={{ x: 100, y: 100 }}
            data={nodeData}
            workflowId="test-workflow"
            onRetry={onRetry}
            selected={false}
            isConnectable={true}
            zIndex={1}
            xPos={100}
            yPos={100}
            dragging={false}
          />
        </IntegrationTestWrapper>
      );

      expect(screen.getByTestId('node-status')).toHaveTextContent('pending');

      // Simulate real-time updates
      const ws = getLastWebSocket();

      await act(async () => {
        ws.simulateMessage(createWorkflowEvent({
          type: 'node_started',
          nodeId: 'test-node',
          data: { status: 'running' }
        }));
        jest.advanceTimersByTime(50);
      });

      await waitFor(() => {
        expect(screen.getByTestId('node-status')).toHaveTextContent('running');
      });

      await act(async () => {
        ws.simulateMessage(createWorkflowEvent({
          type: 'node_progress',
          nodeId: 'test-node',
          data: { progress: { current: 50, total: 100, message: 'Processing...' } }
        }));
        jest.advanceTimersByTime(50);
      });

      await waitFor(() => {
        expect(screen.getByTestId('node-progress')).toHaveTextContent('50/100 - Processing...');
      });

      await act(async () => {
        ws.simulateMessage(createWorkflowEvent({
          type: 'node_completed',
          nodeId: 'test-node',
          data: { 
            status: 'completed',
            result: { rowCount: 1000, columnCount: 5 }
          }
        }));
        jest.advanceTimersByTime(50);
      });

      await waitFor(() => {
        expect(screen.getByTestId('node-status')).toHaveTextContent('completed');
        expect(screen.getByTestId('node-result')).toHaveTextContent('1000 rows');
      });
    });

    it('should handle component retry functionality with store integration', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      
      await connectServiceAndStore();

      const nodeData = createWorkflowNodeData({
        config: { id: 'retry-node', name: 'Retry Node' },
        status: 'error',
        error: {
          message: 'Processing failed',
          code: 'PROCESSING_ERROR',
          recoverable: true
        }
      });

      const onRetry = jest.fn().mockResolvedValue(undefined);

      render(
        <IntegrationTestWrapper>
          <RealtimeWorkflowNode
            id="retry-node"
            position={{ x: 100, y: 100 }}
            data={nodeData}
            workflowId="test-workflow"
            onRetry={onRetry}
            selected={false}
            isConnectable={true}
            zIndex={1}
            xPos={100}
            yPos={100}
            dragging={false}
          />
        </IntegrationTestWrapper>
      );

      expect(screen.getByTestId('node-error')).toHaveTextContent('Processing failed');

      // Click retry button
      const retryButton = screen.getByTestId('retry-button');
      await act(async () => {
        await user.click(retryButton);
      });

      expect(onRetry).toHaveBeenCalledWith('retry-node');

      // Simulate successful retry
      const ws = getLastWebSocket();
      
      await act(async () => {
        ws.simulateMessage(createWorkflowEvent({
          type: 'node_started',
          nodeId: 'retry-node',
          data: { status: 'running' }
        }));
        jest.advanceTimersByTime(50);
      });

      await waitFor(() => {
        expect(screen.getByTestId('node-status')).toHaveTextContent('running');
      });

      await act(async () => {
        ws.simulateMessage(createWorkflowEvent({
          type: 'node_completed',
          nodeId: 'retry-node',
          data: { 
            status: 'completed',
            result: { rowCount: 500 }
          }
        }));
        jest.advanceTimersByTime(50);
      });

      await waitFor(() => {
        expect(screen.getByTestId('node-status')).toHaveTextContent('completed');
        expect(screen.queryByTestId('node-error')).not.toBeInTheDocument();
      });
    });

    it('should display connection status in component', async () => {
      const nodeData = createWorkflowNodeData();

      render(
        <IntegrationTestWrapper>
          <RealtimeWorkflowNode
            id="connection-test-node"
            position={{ x: 100, y: 100 }}
            data={nodeData}
            workflowId="test-workflow"
            enableConnectionIndicator={true}
            selected={false}
            isConnectable={true}
            zIndex={1}
            xPos={100}
            yPos={100}
            dragging={false}
          />
        </IntegrationTestWrapper>
      );

      // Initially disconnected
      expect(screen.getByTestId('wifi-off-icon')).toBeInTheDocument();

      // Connect
      await connectServiceAndStore();

      await waitFor(() => {
        expect(screen.getByTestId('wifi-icon')).toBeInTheDocument();
      });

      // Disconnect
      const ws = getLastWebSocket();
      await act(async () => {
        ws.simulateClose();
        jest.advanceTimersByTime(50);
      });

      await waitFor(() => {
        expect(screen.getByTestId('wifi-off-icon')).toBeInTheDocument();
      });
    });
  });

  describe('Data Consistency and Validation', () => {
    it('should maintain data consistency across service and store', async () => {
      await connectServiceAndStore();

      const ws = getLastWebSocket();
      const testData = {
        nodeId: 'consistency-node',
        workflowId: 'test-workflow',
        progress: { current: 75, total: 100, message: 'Processing items...' },
        metadata: { executionTime: 5000, memoryUsage: 1024000 }
      };

      // Send update through service
      await act(async () => {
        ws.simulateMessage(createWorkflowEvent({
          type: 'node_progress',
          nodeId: testData.nodeId,
          workflowId: testData.workflowId,
          data: {
            progress: testData.progress,
            metadata: testData.metadata
          }
        }));
        jest.advanceTimersByTime(50);
      });

      // Verify data in store
      const nodeState = store.actions.getNodeState(testData.nodeId);
      expect(nodeState?.nodeId).toBe(testData.nodeId);
      expect(nodeState?.workflowId).toBe(testData.workflowId);
      expect(nodeState?.progress).toEqual(testData.progress);
      expect(nodeState?.metadata).toEqual(testData.metadata);

      // Verify version increments
      expect(nodeState?.version).toBe(1);

      // Send another update
      await act(async () => {
        ws.simulateMessage(createWorkflowEvent({
          type: 'node_progress',
          nodeId: testData.nodeId,
          workflowId: testData.workflowId,
          data: {
            progress: { current: 90, total: 100, message: 'Almost done...' }
          }
        }));
        jest.advanceTimersByTime(50);
      });

      const updatedState = store.actions.getNodeState(testData.nodeId);
      expect(updatedState?.version).toBe(2);
      expect(updatedState?.progress?.current).toBe(90);
    });

    it('should handle out-of-order message delivery', async () => {
      await connectServiceAndStore();

      const ws = getLastWebSocket();
      const nodeId = 'order-test-node';

      // Send messages out of order (version 3, then 1, then 2)
      const messages = [
        { version: 3, progress: { current: 90, total: 100 } },
        { version: 1, progress: { current: 30, total: 100 } },
        { version: 2, progress: { current: 60, total: 100 } }
      ];

      for (const msg of messages) {
        await act(async () => {
          ws.simulateMessage(createWorkflowEvent({
            type: 'node_progress',
            nodeId,
            data: { progress: msg.progress, version: msg.version }
          }));
          jest.advanceTimersByTime(10);
        });
      }

      // Should have the latest version's data
      const nodeState = store.actions.getNodeState(nodeId);
      expect(nodeState?.version).toBe(3);
      expect(nodeState?.progress?.current).toBe(90);
    });

    it('should validate message structure and handle malformed data', async () => {
      await connectServiceAndStore();

      const ws = getLastWebSocket();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Send malformed messages
      const malformedMessages = [
        '{"invalid": "json"', // Invalid JSON
        '{"type": "node_started"}', // Missing required fields
        '{"type": "node_progress", "nodeId": "", "workflowId": "test"}', // Empty nodeId
        '{"type": "unknown_type", "nodeId": "test", "workflowId": "test"}' // Unknown type
      ];

      for (const badMessage of malformedMessages) {
        await act(async () => {
          if (ws.onmessage) {
            ws.onmessage(new MessageEvent('message', { data: badMessage }));
          }
          jest.advanceTimersByTime(10);
        });
      }

      // Should have logged errors but not crashed
      expect(consoleSpy).toHaveBeenCalled();

      // Valid message should still work
      await act(async () => {
        ws.simulateMessage(createWorkflowEvent({
          type: 'node_started',
          nodeId: 'valid-node',
          data: { status: 'running' }
        }));
        jest.advanceTimersByTime(50);
      });

      expect(store.actions.getNodeState('valid-node')?.status).toBe('running');

      consoleSpy.mockRestore();
    });
  });

  describe('Performance and Scale Testing', () => {
    it('should handle high-frequency updates without performance degradation', async () => {
      await connectServiceAndStore();

      const ws = getLastWebSocket();
      const nodeIds = Array.from({ length: 10 }, (_, i) => `perf-node-${i}`);
      const updateCount = 100;

      const startTime = performance.now();

      // Send many rapid updates
      for (let i = 0; i < updateCount; i++) {
        for (const nodeId of nodeIds) {
          await act(async () => {
            ws.simulateMessage(createWorkflowEvent({
              type: 'node_progress',
              nodeId,
              data: { 
                progress: { 
                  current: i, 
                  total: updateCount,
                  message: `Update ${i}` 
                } 
              }
            }));
          });
        }
        
        if (i % 10 === 0) {
          jest.advanceTimersByTime(1);
        }
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Verify all updates were processed
      for (const nodeId of nodeIds) {
        const nodeState = store.actions.getNodeState(nodeId);
        expect(nodeState?.progress?.current).toBe(updateCount - 1);
        expect(nodeState?.version).toBe(updateCount);
      }

      // Performance should be reasonable (< 1 second for 1000 updates)
      expect(duration).toBeLessThan(1000);
    });

    it('should handle large message payloads efficiently', async () => {
      await connectServiceAndStore();

      const ws = getLastWebSocket();
      
      // Create large data payload
      const largeData = {
        records: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `Record ${i}`,
          data: Array.from({ length: 100 }, (_, j) => `value_${j}`),
          metadata: {
            created: new Date().toISOString(),
            tags: [`tag1`, `tag2`, `tag3`],
            properties: Object.fromEntries(
              Array.from({ length: 20 }, (_, k) => [`prop${k}`, `value${k}`])
            )
          }
        }))
      };

      const startTime = performance.now();

      await act(async () => {
        ws.simulateMessage(createWorkflowEvent({
          type: 'node_completed',
          nodeId: 'large-data-node',
          data: {
            status: 'completed',
            result: {
              data: largeData,
              rowCount: largeData.records.length,
              columnCount: 50
            }
          }
        }));
        jest.advanceTimersByTime(100);
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      const nodeState = store.actions.getNodeState('large-data-node');
      expect(nodeState?.status).toBe('completed');
      expect(nodeState?.result?.rowCount).toBe(1000);
      expect(nodeState?.result?.data).toEqual(largeData);

      // Should handle large payloads efficiently
      expect(duration).toBeLessThan(500);
    });

    it('should handle many concurrent subscriptions efficiently', async () => {
      await connectServiceAndStore();

      const subscriptionCallbacks: jest.Mock[] = [];
      const subscriptionIds: string[] = [];

      // Create many subscriptions
      for (let i = 0; i < 100; i++) {
        const callback = jest.fn();
        subscriptionCallbacks.push(callback);
        
        const id = store.actions.subscribe(`node-${i}`, callback);
        subscriptionIds.push(id);
      }

      const ws = getLastWebSocket();

      // Send update that should trigger all subscriptions
      const startTime = performance.now();

      for (let i = 0; i < 100; i++) {
        await act(async () => {
          ws.simulateMessage(createWorkflowEvent({
            type: 'node_started',
            nodeId: `node-${i}`,
            data: { status: 'running' }
          }));
        });
      }

      jest.advanceTimersByTime(100);

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Verify all callbacks were called
      subscriptionCallbacks.forEach(callback => {
        expect(callback).toHaveBeenCalledTimes(1);
      });

      // Performance should be reasonable
      expect(duration).toBeLessThan(1000);

      // Clean up subscriptions
      subscriptionIds.forEach(id => store.actions.unsubscribe(id));
    });
  });

  // Helper functions
  async function connectServiceAndStore(): Promise<void> {
    // Connect real-time service
    const connectPromise = realtimeService.connect();
    
    await act(async () => {
      jest.advanceTimersByTime(50);
    });

    const ws = getLastWebSocket();
    await act(async () => {
      ws.simulateOpen();
      jest.advanceTimersByTime(50);
    });

    await connectPromise;

    // Connect store
    await act(async () => {
      await store.actions.connect();
      jest.advanceTimersByTime(50);
    });

    const storeWs = getLastWebSocket();
    await act(async () => {
      storeWs.simulateOpen();
      store.actions.handleConnectionOpen();
      jest.advanceTimersByTime(50);
    });
  }

  function getLastWebSocket(): IntegrationWebSocket {
    const sockets = (global as any).integrationWebSockets || [];
    return sockets[sockets.length - 1];
  }

  function getLastEventSource(): IntegrationEventSource {
    const sources = (global as any).integrationEventSources || [];
    return sources[sources.length - 1];
  }
});
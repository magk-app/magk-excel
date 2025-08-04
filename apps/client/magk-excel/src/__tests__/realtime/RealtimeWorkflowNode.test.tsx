/**
 * Comprehensive Test Suite for RealtimeWorkflowNode React Component
 * Tests real-time updates rendering, status transitions, progress updates,
 * error display, retry functionality, and user interactions.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TooltipProvider } from '@radix-ui/react-tooltip';

import { RealtimeWorkflowNode } from '../../components/workflow/RealtimeWorkflowNode';
import { 
  useNodeExecutionStore,
  type NodeExecutionState,
  type NodeUpdatePayload
} from '../../stores/nodeExecutionStore';
import { WorkflowNodeData, NodeStatus, LogLevel } from '../../types/workflow';

// Mock framer-motion to avoid animation-related test issues
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, _animate, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <div {...props}>{children}</div>,
    svg: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <svg {...props}>{children}</svg>
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  useAnimation: () => ({
    start: jest.fn(),
    stop: jest.fn(),
    set: jest.fn()
  })
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  RefreshCw: ({ className, ...props }: { className?: string } & Record<string, unknown>) => <div data-testid="refresh-icon" className={className} {...props} />,
  WifiOff: ({ className, ...props }: { className?: string } & Record<string, unknown>) => <div data-testid="wifi-off-icon" className={className} {...props} />,
  Wifi: ({ className, ...props }: { className?: string } & Record<string, unknown>) => <div data-testid="wifi-icon" className={className} {...props} />,
  AlertTriangle: ({ className, ...props }: { className?: string } & Record<string, unknown>) => <div data-testid="alert-icon" className={className} {...props} />,
  CheckCircle2: ({ className, ...props }: { className?: string } & Record<string, unknown>) => <div data-testid="check-icon" className={className} {...props} />,
  Clock: ({ className, ...props }: { className?: string } & Record<string, unknown>) => <div data-testid="clock-icon" className={className} {...props} />
}));

// Mock BaseWorkflowNode
jest.mock('../../components/workflow/BaseWorkflowNode', () => ({
  BaseWorkflowNode: ({ data, selected, ...props }: { data: WorkflowNodeData; selected: boolean } & Record<string, unknown>) => (
    <div 
      data-testid="base-workflow-node"
      data-status={data.status}
      data-selected={selected}
      {...props}
    >
      <div data-testid="node-content">
        <div>Status: {data.status}</div>
        <div>Node ID: {data.config.id}</div>
        {data.progress && (
          <div data-testid="progress-display">
            Progress: {data.progress.current}/{data.progress.total}
            {data.progress.message && <span> - {data.progress.message}</span>}
          </div>
        )}
        {data.error && (
          <div data-testid="error-display">
            Error: {data.error.message}
            {data.error.recoverable && <span data-testid="error-recoverable"> (Recoverable)</span>}
          </div>
        )}
        {data.result && (
          <div data-testid="result-display">
            Result: {data.result.rowCount} rows
          </div>
        )}
        {data.logs && data.logs.length > 0 && (
          <div data-testid="logs-display">
            Logs: {data.logs.length} entries
          </div>
        )}
      </div>
    </div>
  )
}));

// Mock UI components
jest.mock('../../components/ui/button', () => ({
  Button: ({ children, onClick, disabled, className, ...props }: React.PropsWithChildren<{ onClick?: () => void; disabled?: boolean; className?: string } & Record<string, unknown>>) => (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={className}
      data-testid="ui-button"
      {...props}
    >
      {children}
    </button>
  )
}));

jest.mock('../../components/ui/badge', () => ({
  Badge: ({ children, variant, className, ...props }: React.PropsWithChildren<{ variant?: string; className?: string } & Record<string, unknown>>) => (
    <span 
      className={className}
      data-variant={variant}
      data-testid="ui-badge"
      {...props}
    >
      {children}
    </span>
  )
}));

jest.mock('../../components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: React.PropsWithChildren) => <div data-testid="tooltip-provider">{children}</div>,
  Tooltip: ({ children }: React.PropsWithChildren) => <div data-testid="tooltip">{children}</div>,
  TooltipTrigger: ({ children, _asChild, ...props }: React.PropsWithChildren<{ _asChild?: boolean } & Record<string, unknown>>) => (
    <div data-testid="tooltip-trigger" {...props}>{children}</div>
  ),
  TooltipContent: ({ children, side, ...props }: React.PropsWithChildren<{ side?: string } & Record<string, unknown>>) => (
    <div data-testid="tooltip-content" data-side={side} {...props}>{children}</div>
  )
}));

jest.mock('../../components/ui/alert', () => ({
  Alert: ({ children, variant, className, ...props }: React.PropsWithChildren<{ variant?: string; className?: string } & Record<string, unknown>>) => (
    <div 
      data-testid="ui-alert" 
      data-variant={variant}
      className={className}
      {...props}
    >
      {children}
    </div>
  ),
  AlertDescription: ({ children, className, ...props }: React.PropsWithChildren<{ className?: string } & Record<string, unknown>>) => (
    <div 
      data-testid="alert-description"
      className={className}
      {...props}
    >
      {children}
    </div>
  )
}));

// Test utilities
const createMockNodeData = (overrides: Partial<WorkflowNodeData> = {}): WorkflowNodeData => ({
  type: 'web-scraping',
  config: {
    id: 'test-node-1',
    name: 'Test Node',
    description: 'Test node for unit testing',
    url: 'https://example.com',
    extractFormat: 'table'
  },
  status: 'pending',
  logs: [],
  ...overrides
});

const createMockExecutionState = (overrides: Partial<NodeExecutionState> = {}): NodeExecutionState => ({
  nodeId: 'test-node-1',
  workflowId: 'test-workflow-1',
  status: 'pending',
  logs: [],
  lastUpdated: new Date(),
  version: 1,
  ...overrides
});

// Mock store implementation
const mockStore = {
  connectionState: 'connected' as const,
  connection: null,
  lastConnectionAttempt: null,
  reconnectAttempts: 0,
  isManuallyDisconnected: false,
  nodeStates: new Map<string, NodeExecutionState>(),
  subscriptions: new Map(),
  offlineQueue: [],
  metrics: {
    totalUpdatesReceived: 0,
    totalUpdatesSent: 0,
    averageLatency: 0,
    lastHeartbeat: new Date(),
    connectionUptime: 0
  },
  connectionConfig: {
    wsUrl: 'ws://localhost:8000/ws',
    reconnectInterval: 5000,
    maxReconnectAttempts: 10,
    heartbeatInterval: 30000,
    useWebSocket: true
  },
  actions: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    updateNodeState: jest.fn(),
    updateNodeStatus: jest.fn(),
    updateNodeProgress: jest.fn(),
    updateNodeError: jest.fn(),
    updateNodeResult: jest.fn(),
    subscribe: jest.fn(() => 'mock-subscription-id'),
    unsubscribe: jest.fn(),
    getNodeState: jest.fn(),
    clearNodeState: jest.fn(),
    processOfflineQueue: jest.fn(),
    getConnectionHealth: jest.fn(() => ({
      isHealthy: true,
      issues: []
    }))
  }
};

// Mock Zustand store
jest.mock('../../stores/nodeExecutionStore', () => ({
  useNodeExecutionStore: jest.fn(() => mockStore),
  useNodeState: jest.fn(),
  useConnectionState: jest.fn(() => ({
    connectionState: 'connected',
    reconnectAttempts: 0,
    isConnected: true
  })),
  useNodeSubscription: jest.fn()
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <TooltipProvider>
    {children}
  </TooltipProvider>
);

describe('RealtimeWorkflowNode - Comprehensive Tests', () => {
  const defaultProps = {
    id: 'test-node-1',
    position: { x: 100, y: 100 },
    data: createMockNodeData(),
    workflowId: 'test-workflow-1',
    selected: false,
    isConnectable: true,
    zIndex: 1,
    xPos: 100,
    yPos: 100,
    dragging: false
  };

  let mockUseNodeState: jest.MockedFunction<typeof useNodeState>;
  let mockUseConnectionState: jest.MockedFunction<typeof useConnectionState>;
  let mockUseNodeSubscription: jest.MockedFunction<typeof useNodeSubscription>;
  let mockUseNodeExecutionStore: jest.MockedFunction<typeof useNodeExecutionStore>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock implementations
    mockUseNodeState = useNodeState as jest.MockedFunction<typeof useNodeState>;
    mockUseConnectionState = useConnectionState as jest.MockedFunction<typeof useConnectionState>;
    mockUseNodeSubscription = useNodeSubscription as jest.MockedFunction<typeof useNodeSubscription>;
    mockUseNodeExecutionStore = useNodeExecutionStore as jest.MockedFunction<typeof useNodeExecutionStore>;

    // Default mock implementations
    mockUseNodeState.mockReturnValue(undefined);
    mockUseConnectionState.mockReturnValue({
      connectionState: 'connected',
      reconnectAttempts: 0,
      isConnected: true
    });
    mockUseNodeSubscription.mockImplementation((_nodeId, callback, _filter) => {
      // Store the callback for later triggering
      (global as Record<string, unknown>).lastSubscriptionCallback = callback;
    });
    mockUseNodeExecutionStore.mockReturnValue(mockStore);

    // Reset store state
    mockStore.nodeStates.clear();
    mockStore.offlineQueue = [];
  });

  describe('Component Rendering', () => {
    it('should render basic node with default props', () => {
      render(
        <TestWrapper>
          <RealtimeWorkflowNode {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByTestId('base-workflow-node')).toBeInTheDocument();
      expect(screen.getByText('Status: pending')).toBeInTheDocument();
      expect(screen.getByText('Node ID: test-node-1')).toBeInTheDocument();
    });

    it('should render with real-time data when available', () => {
      const executionState = createMockExecutionState({
        status: 'running',
        progress: { current: 50, total: 100, message: 'Processing...' }
      });

      mockUseNodeState.mockReturnValue(executionState);

      render(
        <TestWrapper>
          <RealtimeWorkflowNode {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Status: running')).toBeInTheDocument();
      expect(screen.getByTestId('progress-display')).toHaveTextContent('Progress: 50/100 - Processing...');
    });

    it('should merge real-time data with props data correctly', () => {
      const propsData = createMockNodeData({
        status: 'pending',
        metadata: { lastExecuted: new Date('2023-01-01') }
      });

      const executionState = createMockExecutionState({
        status: 'running',
        progress: { current: 75, total: 100 },
        lastUpdated: new Date('2023-01-02')
      });

      mockUseNodeState.mockReturnValue(executionState);

      render(
        <TestWrapper>
          <RealtimeWorkflowNode 
            {...defaultProps} 
            data={propsData}
          />
        </TestWrapper>
      );

      // Should show real-time status (running) not props status (pending)
      expect(screen.getByText('Status: running')).toBeInTheDocument();
      expect(screen.getByTestId('progress-display')).toHaveTextContent('Progress: 75/100');
    });

    it('should display connection indicator when enabled', () => {
      render(
        <TestWrapper>
          <RealtimeWorkflowNode 
            {...defaultProps} 
            enableConnectionIndicator={true}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('wifi-icon')).toBeInTheDocument();
    });

    it('should not display connection indicator when disabled', () => {
      render(
        <TestWrapper>
          <RealtimeWorkflowNode 
            {...defaultProps} 
            enableConnectionIndicator={false}
          />
        </TestWrapper>
      );

      expect(screen.queryByTestId('wifi-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('wifi-off-icon')).not.toBeInTheDocument();
    });
  });

  describe('Status Transitions and Updates', () => {
    it('should display different statuses correctly', () => {
      const statuses: NodeStatus[] = ['pending', 'running', 'completed', 'error', 'paused'];

      statuses.forEach(status => {
        const { rerender } = render(
          <TestWrapper>
            <RealtimeWorkflowNode 
              {...defaultProps} 
              data={createMockNodeData({ status })}
            />
          </TestWrapper>
        );

        expect(screen.getByText(`Status: ${status}`)).toBeInTheDocument();
        
        rerender(<div />); // Clean slate for next iteration
      });
    });

    it('should show real-time data indicator when real-time state exists', () => {
      const executionState = createMockExecutionState({ status: 'running' });
      mockUseNodeState.mockReturnValue(executionState);

      render(
        <TestWrapper>
          <RealtimeWorkflowNode {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByTestId('check-icon')).toBeInTheDocument();
      expect(screen.getByTestId('ui-badge')).toHaveTextContent('LIVE');
    });

    it('should handle status transitions with animations', () => {
      const { rerender } = render(
        <TestWrapper>
          <RealtimeWorkflowNode 
            {...defaultProps} 
            data={createMockNodeData({ status: 'pending' })}
          />
        </TestWrapper>
      );

      // Simulate status change to running
      rerender(
        <TestWrapper>
          <RealtimeWorkflowNode 
            {...defaultProps} 
            data={createMockNodeData({ status: 'running' })}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Status: running')).toBeInTheDocument();
    });

    it('should update last update time when receiving real-time updates', () => {
      const executionState = createMockExecutionState({
        status: 'running',
        lastUpdated: new Date()
      });

      mockUseNodeState.mockReturnValue(executionState);

      render(
        <TestWrapper>
          <RealtimeWorkflowNode {...defaultProps} />
        </TestWrapper>
      );

      // Simulate callback trigger (real-time update)
      act(() => {
        if ((global as Record<string, unknown>).lastSubscriptionCallback) {
          ((global as Record<string, unknown>).lastSubscriptionCallback as (state: NodeExecutionState) => void)(executionState);
        }
      });

      // Component should re-render with updated timestamp
      expect(screen.getByTestId('base-workflow-node')).toBeInTheDocument();
    });
  });

  describe('Progress Updates', () => {
    it('should display detailed progress information', () => {
      const progressData = {
        current: 75,
        total: 100,
        percentage: 75,
        message: 'Processing records...',
        estimatedTimeRemaining: 300,
        throughputRate: 2.5
      };

      const executionState = createMockExecutionState({
        status: 'running',
        progress: progressData
      });

      mockUseNodeState.mockReturnValue(executionState);

      render(
        <TestWrapper>
          <RealtimeWorkflowNode {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByTestId('progress-display')).toHaveTextContent(
        'Progress: 75/100 - Processing records...'
      );
    });

    it('should handle progress with stages', () => {
      const progressWithStages = {
        current: 50,
        total: 100,
        stages: [
          { name: 'Download', status: 'completed' as const, progress: 100 },
          { name: 'Process', status: 'running' as const, progress: 50 },
          { name: 'Upload', status: 'pending' as const, progress: 0 }
        ]
      };

      const executionState = createMockExecutionState({
        status: 'running',
        progress: progressWithStages
      });

      mockUseNodeState.mockReturnValue(executionState);

      render(
        <TestWrapper>
          <RealtimeWorkflowNode {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByTestId('progress-display')).toHaveTextContent('Progress: 50/100');
    });

    it('should update progress in real-time', () => {
      const initialState = createMockExecutionState({
        status: 'running',
        progress: { current: 25, total: 100 }
      });

      mockUseNodeState.mockReturnValue(initialState);

      const { rerender } = render(
        <TestWrapper>
          <RealtimeWorkflowNode {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByTestId('progress-display')).toHaveTextContent('Progress: 25/100');

      // Simulate progress update
      const updatedState = createMockExecutionState({
        status: 'running',
        progress: { current: 75, total: 100 }
      });

      mockUseNodeState.mockReturnValue(updatedState);

      rerender(
        <TestWrapper>
          <RealtimeWorkflowNode {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByTestId('progress-display')).toHaveTextContent('Progress: 75/100');
    });
  });

  describe('Error Handling and Display', () => {
    it('should display error information', () => {
      const errorData = {
        message: 'Connection failed',
        code: 'NETWORK_ERROR',
        recoverable: true,
        suggestions: ['Check network connection', 'Retry in a few moments']
      };

      const executionState = createMockExecutionState({
        status: 'error',
        error: errorData
      });

      mockUseNodeState.mockReturnValue(executionState);

      render(
        <TestWrapper>
          <RealtimeWorkflowNode {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Status: error')).toBeInTheDocument();
      expect(screen.getByTestId('error-display')).toHaveTextContent('Error: Connection failed');
      expect(screen.getByTestId('error-recoverable')).toBeInTheDocument();
    });

    it('should show retry button for error nodes when onRetry provided', () => {
      const onRetry = jest.fn();
      const errorData = { message: 'Processing failed', recoverable: true };

      const executionState = createMockExecutionState({
        status: 'error',
        error: errorData
      });

      mockUseNodeState.mockReturnValue(executionState);

      render(
        <TestWrapper>
          <RealtimeWorkflowNode 
            {...defaultProps} 
            onRetry={onRetry}
            retryButtonPosition="top-right"
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('refresh-icon')).toBeInTheDocument();
      expect(screen.getByTestId('ui-button')).toBeInTheDocument();
    });

    it('should not show retry button when onRetry not provided', () => {
      const errorData = { message: 'Processing failed', recoverable: true };

      const executionState = createMockExecutionState({
        status: 'error',
        error: errorData
      });

      mockUseNodeState.mockReturnValue(executionState);

      render(
        <TestWrapper>
          <RealtimeWorkflowNode {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.queryByTestId('refresh-icon')).not.toBeInTheDocument();
    });

    it('should handle inline retry button layout', () => {
      const onRetry = jest.fn();
      const errorData = { message: 'Processing failed', recoverable: true };

      const executionState = createMockExecutionState({
        status: 'error',
        error: errorData
      });

      mockUseNodeState.mockReturnValue(executionState);

      render(
        <TestWrapper>
          <RealtimeWorkflowNode 
            {...defaultProps} 
            onRetry={onRetry}
            retryButtonPosition="inline"
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
      expect(screen.getByText('Recoverable error')).toBeInTheDocument();
    });

    it('should display non-recoverable error message', () => {
      const onRetry = jest.fn();
      const errorData = { message: 'Fatal error', recoverable: false };

      const executionState = createMockExecutionState({
        status: 'error',
        error: errorData
      });

      mockUseNodeState.mockReturnValue(executionState);

      render(
        <TestWrapper>
          <RealtimeWorkflowNode 
            {...defaultProps} 
            onRetry={onRetry}
            retryButtonPosition="inline"
          />
        </TestWrapper>
      );

      expect(screen.getByText('Node failed')).toBeInTheDocument();
    });
  });

  describe('Retry Functionality', () => {
    it('should call onRetry when retry button clicked', async () => {
      const user = userEvent.setup();
      const onRetry = jest.fn();
      const errorData = { message: 'Processing failed', recoverable: true };

      const executionState = createMockExecutionState({
        status: 'error',
        error: errorData
      });

      mockUseNodeState.mockReturnValue(executionState);

      render(
        <TestWrapper>
          <RealtimeWorkflowNode 
            {...defaultProps} 
            onRetry={onRetry}
          />
        </TestWrapper>
      );

      const retryButton = screen.getByTestId('ui-button');
      await user.click(retryButton);

      expect(onRetry).toHaveBeenCalledWith('test-node-1');
    });

    it('should update store when retry is triggered', async () => {
      const user = userEvent.setup();
      const onRetry = jest.fn();
      const errorData = { message: 'Processing failed', recoverable: true };

      const executionState = createMockExecutionState({
        status: 'error',
        error: errorData
      });

      mockUseNodeState.mockReturnValue(executionState);

      render(
        <TestWrapper>
          <RealtimeWorkflowNode 
            {...defaultProps} 
            onRetry={onRetry}
          />
        </TestWrapper>
      );

      const retryButton = screen.getByTestId('ui-button');
      await user.click(retryButton);

      expect(mockStore.actions.updateNodeStatus).toHaveBeenCalledWith(
        'test-node-1',
        'test-workflow-1',
        'pending'
      );
    });

    it('should show retry animation when retrying', async () => {
      const user = userEvent.setup();
      const onRetry = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      const errorData = { message: 'Processing failed', recoverable: true };

      const executionState = createMockExecutionState({
        status: 'error',
        error: errorData
      });

      mockUseNodeState.mockReturnValue(executionState);

      render(
        <TestWrapper>
          <RealtimeWorkflowNode 
            {...defaultProps} 
            onRetry={onRetry}
          />
        </TestWrapper>
      );

      const retryButton = screen.getByTestId('ui-button');
      await user.click(retryButton);

      // Button should be disabled during retry
      expect(retryButton).toBeDisabled();
    });

    it('should not retry when already retrying', async () => {
      const user = userEvent.setup();
      const onRetry = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      const errorData = { message: 'Processing failed', recoverable: true };

      const executionState = createMockExecutionState({
        status: 'error',
        error: errorData
      });

      mockUseNodeState.mockReturnValue(executionState);

      render(
        <TestWrapper>
          <RealtimeWorkflowNode 
            {...defaultProps} 
            onRetry={onRetry}
          />
        </TestWrapper>
      );

      const retryButton = screen.getByTestId('ui-button');
      
      // Click multiple times rapidly
      await user.click(retryButton);
      await user.click(retryButton);
      await user.click(retryButton);

      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('should reset retry state when node recovers', () => {
      const onRetry = jest.fn();
      const errorState = createMockExecutionState({
        status: 'error',
        error: { message: 'Failed', recoverable: true }
      });

      mockUseNodeState.mockReturnValue(errorState);

      const { rerender } = render(
        <TestWrapper>
          <RealtimeWorkflowNode 
            {...defaultProps} 
            onRetry={onRetry}
          />
        </TestWrapper>
      );

      // Simulate recovery
      const recoveredState = createMockExecutionState({ status: 'running' });
      mockUseNodeState.mockReturnValue(recoveredState);

      rerender(
        <TestWrapper>
          <RealtimeWorkflowNode 
            {...defaultProps} 
            onRetry={onRetry}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Status: running')).toBeInTheDocument();
      expect(screen.queryByTestId('refresh-icon')).not.toBeInTheDocument();
    });
  });

  describe('Connection Status Display', () => {
    it('should show connected status', () => {
      mockUseConnectionState.mockReturnValue({
        connectionState: 'connected',
        reconnectAttempts: 0,
        isConnected: true
      });

      render(
        <TestWrapper>
          <RealtimeWorkflowNode 
            {...defaultProps} 
            enableConnectionIndicator={true}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('wifi-icon')).toBeInTheDocument();
    });

    it('should show disconnected status', () => {
      mockUseConnectionState.mockReturnValue({
        connectionState: 'disconnected',
        reconnectAttempts: 0,
        isConnected: false
      });

      render(
        <TestWrapper>
          <RealtimeWorkflowNode 
            {...defaultProps} 
            enableConnectionIndicator={true}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('wifi-off-icon')).toBeInTheDocument();
    });

    it('should show reconnecting status with attempt count', () => {
      mockUseConnectionState.mockReturnValue({
        connectionState: 'reconnecting',
        reconnectAttempts: 3,
        isConnected: false
      });

      render(
        <TestWrapper>
          <RealtimeWorkflowNode 
            {...defaultProps} 
            enableConnectionIndicator={true}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('wifi-off-icon')).toBeInTheDocument();
      // Tooltip content would show reconnection attempts
    });

    it('should show error status', () => {
      mockUseConnectionState.mockReturnValue({
        connectionState: 'error',
        reconnectAttempts: 5,
        isConnected: false
      });

      render(
        <TestWrapper>
          <RealtimeWorkflowNode 
            {...defaultProps} 
            enableConnectionIndicator={true}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('wifi-off-icon')).toBeInTheDocument();
    });
  });

  describe('Offline Mode Handling', () => {
    it('should show offline indicator when disconnected', () => {
      mockUseConnectionState.mockReturnValue({
        connectionState: 'disconnected',
        reconnectAttempts: 0,
        isConnected: false
      });

      render(
        <TestWrapper>
          <RealtimeWorkflowNode 
            {...defaultProps} 
            enableOfflineMode={true}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('ui-alert')).toBeInTheDocument();
      expect(screen.getByTestId('alert-description')).toHaveTextContent(
        'Offline mode - updates will sync when reconnected'
      );
    });

    it('should show queued updates count', () => {
      mockUseConnectionState.mockReturnValue({
        connectionState: 'disconnected',
        reconnectAttempts: 0,
        isConnected: false
      });

      // Mock offline queue with updates for this node
      mockStore.offlineQueue = [
        {
          id: 'update-1',
          payload: {
            nodeId: 'test-node-1',
            workflowId: 'test-workflow-1',
            type: 'status',
            data: { status: 'running' },
            timestamp: new Date()
          },
          timestamp: new Date(),
          retryCount: 0,
          maxRetries: 3
        },
        {
          id: 'update-2',
          payload: {
            nodeId: 'test-node-1',
            workflowId: 'test-workflow-1',
            type: 'progress',
            data: { progress: { current: 50, total: 100 } },
            timestamp: new Date()
          },
          timestamp: new Date(),
          retryCount: 0,
          maxRetries: 3
        }
      ];

      render(
        <TestWrapper>
          <RealtimeWorkflowNode 
            {...defaultProps} 
            enableOfflineMode={true}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('alert-description')).toHaveTextContent(
        'Offline mode - updates will sync when reconnected (2 pending)'
      );
    });

    it('should show syncing indicator when reconnected with queued updates', () => {
      mockUseConnectionState.mockReturnValue({
        connectionState: 'connected',
        reconnectAttempts: 0,
        isConnected: true
      });

      // Mock offline queue with updates
      mockStore.offlineQueue = [
        {
          id: 'update-1',
          payload: {
            nodeId: 'test-node-1',
            workflowId: 'test-workflow-1',
            type: 'status',
            data: { status: 'running' },
            timestamp: new Date()
          },
          timestamp: new Date(),
          retryCount: 0,
          maxRetries: 3
        }
      ];

      render(
        <TestWrapper>
          <RealtimeWorkflowNode 
            {...defaultProps} 
            enableOfflineMode={true}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('alert-description')).toHaveTextContent(
        'Syncing 1 offline updates...'
      );
    });

    it('should not show offline indicator when disabled', () => {
      mockUseConnectionState.mockReturnValue({
        connectionState: 'disconnected',
        reconnectAttempts: 0,
        isConnected: false
      });

      render(
        <TestWrapper>
          <RealtimeWorkflowNode 
            {...defaultProps} 
            enableOfflineMode={false}
          />
        </TestWrapper>
      );

      expect(screen.queryByTestId('ui-alert')).not.toBeInTheDocument();
    });
  });

  describe('Real-time Data Integration', () => {
    it('should subscribe to node updates on mount', () => {
      render(
        <TestWrapper>
          <RealtimeWorkflowNode {...defaultProps} />
        </TestWrapper>
      );

      expect(mockUseNodeSubscription).toHaveBeenCalledWith(
        'test-node-1',
        expect.any(Function),
        expect.any(Function)
      );
    });

    it('should filter updates by nodeId and workflowId', () => {
      render(
        <TestWrapper>
          <RealtimeWorkflowNode {...defaultProps} />
        </TestWrapper>
      );

      const filterFunction = mockUseNodeSubscription.mock.calls[0][2];
      
      // Should accept matching update
      const matchingUpdate = {
        nodeId: 'test-node-1',
        workflowId: 'test-workflow-1',
        type: 'status' as const,
        data: {},
        timestamp: new Date()
      };
      
      expect(filterFunction(matchingUpdate)).toBe(true);

      // Should reject non-matching nodeId
      const wrongNodeUpdate = {
        ...matchingUpdate,
        nodeId: 'other-node'
      };
      
      expect(filterFunction(wrongNodeUpdate)).toBe(false);

      // Should reject non-matching workflowId
      const wrongWorkflowUpdate = {
        ...matchingUpdate,
        workflowId: 'other-workflow'
      };
      
      expect(filterFunction(wrongWorkflowUpdate)).toBe(false);
    });

    it('should handle subscription updates', () => {
      const executionState = createMockExecutionState({ status: 'running' });
      mockUseNodeState.mockReturnValue(executionState);

      render(
        <TestWrapper>
          <RealtimeWorkflowNode {...defaultProps} />
        </TestWrapper>
      );

      // Simulate subscription callback
      const callback = mockUseNodeSubscription.mock.calls[0][1];
      
      act(() => {
        callback(executionState);
      });

      expect(screen.getByText('Status: running')).toBeInTheDocument();
    });

    it('should show enhanced metadata for real-time nodes', () => {
      const executionState = createMockExecutionState({
        status: 'running',
        version: 3,
        lastUpdated: new Date('2023-01-01T12:00:00Z')
      });

      mockUseNodeState.mockReturnValue(executionState);

      render(
        <TestWrapper>
          <RealtimeWorkflowNode {...defaultProps} />
        </TestWrapper>
      );

      // Enhanced data should include real-time metadata
      const baseNode = screen.getByTestId('base-workflow-node');
      expect(baseNode).toBeInTheDocument();
      
      // LIVE badge should be present
      expect(screen.getByTestId('ui-badge')).toHaveTextContent('LIVE');
    });
  });

  describe('Results and Logs Display', () => {
    it('should display node results', () => {
      const resultData = {
        data: { records: [{ id: 1, name: 'Test' }] },
        rowCount: 1000,
        columnCount: 5,
        schema: {
          fields: [
            { name: 'id', type: 'number', nullable: false },
            { name: 'name', type: 'string', nullable: true }
          ]
        }
      };

      const executionState = createMockExecutionState({
        status: 'completed',
        result: resultData
      });

      mockUseNodeState.mockReturnValue(executionState);

      render(
        <TestWrapper>
          <RealtimeWorkflowNode {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByTestId('result-display')).toHaveTextContent('Result: 1000 rows');
    });

    it('should display node logs', () => {
      const logs = [
        {
          timestamp: new Date('2023-01-01T10:00:00Z'),
          level: LogLevel.INFO,
          message: 'Node started',
          category: 'execution'
        },
        {
          timestamp: new Date('2023-01-01T10:01:00Z'),
          level: LogLevel.DEBUG,
          message: 'Processing item 1',
          category: 'processing'
        }
      ];

      const executionState = createMockExecutionState({
        status: 'running',
        logs
      });

      mockUseNodeState.mockReturnValue(executionState);

      render(
        <TestWrapper>
          <RealtimeWorkflowNode {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByTestId('logs-display')).toHaveTextContent('Logs: 2 entries');
    });

    it('should handle empty logs array', () => {
      const executionState = createMockExecutionState({
        status: 'running',
        logs: []
      });

      mockUseNodeState.mockReturnValue(executionState);

      render(
        <TestWrapper>
          <RealtimeWorkflowNode {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.queryByTestId('logs-display')).not.toBeInTheDocument();
    });
  });

  describe('Component Props and Configuration', () => {
    it('should handle different retry button positions', () => {
      const positions: Array<'top-right' | 'bottom-right' | 'inline'> = [
        'top-right', 'bottom-right', 'inline'
      ];

      const onRetry = jest.fn();
      const errorState = createMockExecutionState({
        status: 'error',
        error: { message: 'Failed', recoverable: true }
      });

      mockUseNodeState.mockReturnValue(errorState);

      positions.forEach(position => {
        const { unmount } = render(
          <TestWrapper>
            <RealtimeWorkflowNode 
              {...defaultProps} 
              onRetry={onRetry}
              retryButtonPosition={position}
            />
          </TestWrapper>
        );

        if (position === 'inline') {
          expect(screen.getByText('Recoverable error')).toBeInTheDocument();
        } else {
          expect(screen.getByTestId('refresh-icon')).toBeInTheDocument();
        }

        unmount();
      });
    });

    it('should handle selected state', () => {
      render(
        <TestWrapper>
          <RealtimeWorkflowNode 
            {...defaultProps} 
            selected={true}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('base-workflow-node')).toHaveAttribute('data-selected', 'true');
    });

    it('should handle different node types', () => {
      const nodeTypes = ['web-scraping', 'excel-export', 'transform', 'api-fetch'] as const;

      nodeTypes.forEach(type => {
        const { unmount } = render(
          <TestWrapper>
            <RealtimeWorkflowNode 
              {...defaultProps} 
              data={createMockNodeData({ type })}
            />
          </TestWrapper>
        );

        expect(screen.getByTestId('base-workflow-node')).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Edge Cases and Error Conditions', () => {
    it('should handle missing real-time data gracefully', () => {
      mockUseNodeState.mockReturnValue(undefined);

      render(
        <TestWrapper>
          <RealtimeWorkflowNode {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Status: pending')).toBeInTheDocument();
      expect(screen.queryByTestId('check-icon')).not.toBeInTheDocument();
    });

    it('should handle malformed real-time data', () => {
      const malformedState = {
        nodeId: 'test-node-1',
        workflowId: 'test-workflow-1',
        status: 'running' as NodeStatus,
        logs: [],
        lastUpdated: new Date(),
        version: 1,
        progress: null, // Malformed progress
        error: 'invalid-error-format' // Should be object
      } as unknown as NodeExecutionState;

      mockUseNodeState.mockReturnValue(malformedState);

      render(
        <TestWrapper>
          <RealtimeWorkflowNode {...defaultProps} />
        </TestWrapper>
      );

      // Should still render without crashing
      expect(screen.getByTestId('base-workflow-node')).toBeInTheDocument();
      expect(screen.getByText('Status: running')).toBeInTheDocument();
    });

    it('should handle subscription callback errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(
        <TestWrapper>
          <RealtimeWorkflowNode {...defaultProps} />
        </TestWrapper>
      );

      // Simulate subscription callback error
      const callback = mockUseNodeSubscription.mock.calls[0][1];
      const errorState = createMockExecutionState({ status: 'error' });

      // Mock error in callback
      const originalCallback = callback;
      mockUseNodeSubscription.mock.calls[0][1] = () => {
        throw new Error('Callback error');
      };

      expect(() => {
        act(() => {
          originalCallback(errorState);
        });
      }).not.toThrow();

      consoleSpy.mockRestore();
    });

    it('should handle rapid state changes', () => {
      const states = [
        createMockExecutionState({ status: 'pending' }),
        createMockExecutionState({ status: 'running', progress: { current: 25, total: 100 } }),
        createMockExecutionState({ status: 'running', progress: { current: 50, total: 100 } }),
        createMockExecutionState({ status: 'running', progress: { current: 75, total: 100 } }),
        createMockExecutionState({ status: 'completed', result: { rowCount: 1000 } })
      ];

      let currentStateIndex = 0;
      mockUseNodeState.mockImplementation(() => states[currentStateIndex]);

      const { rerender } = render(
        <TestWrapper>
          <RealtimeWorkflowNode {...defaultProps} />
        </TestWrapper>
      );

      // Rapidly change states
      states.forEach((_, index) => {
        currentStateIndex = index;
        
        rerender(
          <TestWrapper>
            <RealtimeWorkflowNode {...defaultProps} />
          </TestWrapper>
        );
        
        if (index === states.length - 1) {
          expect(screen.getByText('Status: completed')).toBeInTheDocument();
          expect(screen.getByTestId('result-display')).toBeInTheDocument();
        }
      });
    });
  });
});
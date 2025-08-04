# MAGK Excel Stores

This directory contains Zustand stores for managing application state in the MAGK Excel Electron application.

## NodeExecutionStore

The `NodeExecutionStore` manages real-time workflow node execution updates with WebSocket/EventSource connectivity.

### Features

- **Real-time Updates**: Connects to backend via WebSocket or Server-Sent Events
- **Node State Management**: Tracks status, progress, errors, results, and metadata for workflow nodes
- **Subscription System**: Subscribe to specific node updates with optional filtering
- **Offline Queue**: Queues updates when disconnected and syncs when reconnected
- **Connection Health**: Monitors connection state with automatic reconnection
- **Type Safety**: Full TypeScript support with existing workflow types

### Basic Usage

```typescript
import { useNodeExecutionStore, useNodeState, useConnectionState } from '@/stores';

// Get connection state
const { isConnected, connectionState } = useConnectionState();

// Get specific node state
const nodeState = useNodeState('node-123');

// Use the store directly
const { connect, updateNodeStatus } = useNodeExecutionStore(state => state.actions);

// Connect to backend
await connect({
  wsUrl: 'ws://localhost:8000/ws/node-execution',
  useWebSocket: true
});

// Update node status
updateNodeStatus('node-123', 'workflow-456', 'running');
```

### Connection Management

```typescript
import { useNodeExecutionStore } from '@/stores';

const store = useNodeExecutionStore();

// Connect with custom configuration
await store.actions.connect({
  wsUrl: 'ws://localhost:8000/ws',
  reconnectInterval: 5000,
  maxReconnectAttempts: 10,
  heartbeatInterval: 30000,
  useWebSocket: true // or false for EventSource
});

// Disconnect
store.actions.disconnect();

// Reconnect
await store.actions.reconnect();

// Check connection health
const health = store.actions.getConnectionHealth();
console.log('Is healthy:', health.isHealthy);
console.log('Issues:', health.issues);
```

### Node State Updates

```typescript
import { useNodeExecutionStore } from '@/stores';

const { actions } = useNodeExecutionStore();

// Update node status
actions.updateNodeStatus('node-1', 'workflow-1', 'running');

// Update progress
actions.updateNodeProgress('node-1', 'workflow-1', {
  current: 50,
  total: 100,
  percentage: 50,
  message: 'Processing data...',
  estimatedTimeRemaining: 30
});

// Update with error
actions.updateNodeError('node-1', 'workflow-1', {
  message: 'Connection failed',
  code: 'NETWORK_ERROR',
  recoverable: true,
  suggestions: ['Check network connection', 'Retry operation']
});

// Update with result
actions.updateNodeResult('node-1', 'workflow-1', {
  rowCount: 1000,
  columnCount: 5,
  data: { /* result data */ }
});

// Add log entry
actions.addNodeLog('node-1', 'workflow-1', {
  timestamp: new Date(),
  level: 'info',
  message: 'Data processing started',
  category: 'execution'
});
```

### Subscriptions

```typescript
import { useNodeExecutionStore, useNodeSubscription } from '@/stores';

// Subscribe to specific node updates
const subscriptionId = useNodeExecutionStore(state => 
  state.actions.subscribe(
    'node-123', 
    (nodeState) => {
      console.log('Node updated:', nodeState);
    },
    // Optional filter
    (update) => update.type === 'progress'
  )
);

// Unsubscribe
useNodeExecutionStore(state => state.actions.unsubscribe(subscriptionId));

// React hook for subscriptions
useNodeSubscription(
  'node-123',
  (nodeState) => {
    // Handle node state changes
    setLocalState(nodeState);
  },
  (update) => update.type === 'status' // Only status updates
);
```

### Querying Node States

```typescript
import { useNodeExecutionStore, useWorkflowNodes } from '@/stores';

// Get all nodes for a workflow
const workflowNodes = useWorkflowNodes('workflow-123');

// Get nodes by status
const runningNodes = useNodeExecutionStore(state => 
  state.actions.getNodesByStatus('running')
);

// Check if node is running
const isRunning = useNodeExecutionStore(state => 
  state.actions.isNodeRunning('node-123')
);

// Get specific node state
const nodeState = useNodeExecutionStore(state => 
  state.actions.getNodeState('node-123')
);
```

### React Component Integration

```typescript
import React from 'react';
import { useWorkflowNodes, useConnectionState } from '@/stores';

const WorkflowMonitor: React.FC<{ workflowId: string }> = ({ workflowId }) => {
  const { isConnected, connectionState } = useConnectionState();
  const nodes = useWorkflowNodes(workflowId);

  return (
    <div>
      <div>Connection: {connectionState}</div>
      {nodes.map(node => (
        <div key={node.nodeId}>
          {node.nodeId}: {node.status}
          {node.progress && (
            <div>Progress: {node.progress.percentage}%</div>
          )}
        </div>
      ))}
    </div>
  );
};
```

### Offline Handling

The store automatically queues updates when disconnected and processes them when reconnected:

```typescript
// Updates are automatically queued when offline
actions.updateNodeStatus('node-1', 'workflow-1', 'completed');

// When connection is restored, queued updates are processed
await actions.connect();
// Queued updates are automatically applied

// Manually process offline queue
await actions.processOfflineQueue();

// Clear offline queue
actions.clearOfflineQueue();
```

### WebSocket Message Format

The store expects messages in this format:

```json
{
  "type": "node_started" | "node_progress" | "node_completed" | "node_error" | "workflow_completed",
  "workflowId": "workflow-123",
  "nodeId": "node-456",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "status": "running",
    "progress": {
      "current": 50,
      "total": 100,
      "percentage": 50,
      "message": "Processing..."
    },
    "error": {
      "message": "Error details",
      "code": "ERROR_CODE",
      "recoverable": true
    }
  }
}
```

### Heartbeat

The store handles heartbeat messages for connection monitoring:

```json
{
  "type": "heartbeat",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## Example Component

See `NodeExecutionMonitor.tsx` for a complete example of how to use the store in a React component for monitoring workflow execution in real-time.
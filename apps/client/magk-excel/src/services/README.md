# MAGK Excel Services

This directory contains comprehensive services for the MAGK Excel application, including real-time connections, test discovery, and file management capabilities.

## Service Overview

### 🔍 Test Discovery Service
Comprehensive test file discovery and management system for the developer test panel. Automatically discovers, categorizes, and manages all test files with advanced search and filtering capabilities.

### 🔄 Real-time Connection Services
Robust real-time connection services providing WebSocket and EventSource connectivity with comprehensive error handling and automatic reconnection.

---

## 🔍 Test Discovery Service

The TestDiscoveryService provides comprehensive test file discovery and management for the MAGK Excel developer test panel. It automatically discovers, categorizes, and manages all test files in the `testing/` directory with advanced metadata extraction, search capabilities, and real-time monitoring.

### Key Features

- **🔍 Automatic Discovery**: Scans all test files with smart metadata extraction
- **📊 Smart Categorization**: Automatically categorizes tests by functionality (Chat, Excel, MCP, Workflow, etc.)
- **🔍 Advanced Search**: Full-text search with filtering by category, type, status, and tags
- **📈 Comprehensive Metadata**: Test complexity, status, dependencies, and more
- **⚡ Real-time Monitoring**: Hot reload capability for development
- **🚀 Performance Optimized**: Caching and intelligent discovery

### Quick Start

```typescript
import { useTestDiscovery } from '../services/testDiscoveryService';

function TestPanel() {
  const testDiscovery = useTestDiscovery();
  const [tests, setTests] = useState([]);
  
  useEffect(() => {
    testDiscovery.discoverTestFiles().then(result => {
      if (result.success) {
        setTests(result.tests);
      }
    });
  }, []);
  
  return (
    <div>
      {tests.map(test => (
        <div key={test.id}>
          {test.category.icon} {test.name} - {test.metadata.complexity}
        </div>
      ))}
    </div>
  );
}
```

### Search & Filtering

```typescript
// Advanced search with multiple filters
const searchResults = await testDiscovery.searchTests({
  query: 'excel processing',      // Full-text search
  category: 'excel',              // Filter by category
  type: 'html',                   // Filter by file type  
  status: 'active',               // Filter by test status
  tags: ['api', 'integration'],   // Filter by tags
  sortBy: 'complexity',           // Sort by field
  sortOrder: 'desc'              // Sort direction
});
```

### Test Categories

- **💬 Chat & Communication** - Chat API, messaging, communication tests
- **📊 Excel Processing** - Excel file handling, data processing, exports  
- **🔌 MCP Integration** - Model Context Protocol server integration
- **⚡ Workflow Engine** - Workflow creation, execution, management
- **📁 File Management** - File upload, persistence, processing
- **💾 Data Persistence** - Storage, retrieval, state management
- **🎨 User Interface** - UI components, interactions, user flows
- **🔗 System Integration** - End-to-end integration tests
- **🌐 API Testing** - API endpoints, requests, responses
- **🔨 Smithery Integration** - Smithery server browser and installation

### API Methods

```typescript
// Core discovery
await testDiscoveryService.discoverTestFiles(forceRefresh?: boolean)
await testDiscoveryService.listAllTests()
await testDiscoveryService.getTestsByCategory(categoryId: string)

// Search & filter  
await testDiscoveryService.searchTests(options: TestSearchOptions)
await testDiscoveryService.getTestDetails(testId: string)

// Utilities
testDiscoveryService.getCategories()
testDiscoveryService.getStats()
testDiscoveryService.enableHotReload()
testDiscoveryService.refresh()
```

---

## 🔄 Real-time Connection Services

The real-time services consist of three main components:

1. **RealtimeService** (`realtimeService.ts`) - Core connection management with WebSocket and EventSource support
2. **RealtimeAdapter** (`realtimeAdapter.ts`) - Backend integration layer with workflow command support
3. **Service Integration** (`serviceIntegration.ts`) - React hooks and utilities for store integration

## Features

### Core Features
- ✅ **Dual Protocol Support**: WebSocket and Server-Sent Events (EventSource)
- ✅ **Automatic Reconnection**: Exponential backoff with configurable retry limits
- ✅ **Heartbeat Monitoring**: Ping-pong mechanism for connection health checking
- ✅ **Offline Message Queue**: Message queuing and replay when reconnected
- ✅ **Event Subscription System**: Flexible event filtering and routing
- ✅ **Connection State Management**: Comprehensive state tracking and notifications

### Error Handling & Recovery
- ✅ **Multiple Recovery Strategies**: Reconnection, fallback protocols, offline queuing
- ✅ **Error Classification**: Different handling for network, timeout, auth, and server errors
- ✅ **Circuit Breaker Pattern**: Prevent excessive reconnection attempts
- ✅ **Graceful Degradation**: Continue operation with reduced functionality when offline

### Integration Features
- ✅ **Zustand Store Integration**: Seamless integration with existing nodeExecutionStore
- ✅ **React Hooks**: Easy-to-use hooks for workflow and node monitoring
- ✅ **TypeScript Support**: Full type safety with comprehensive interfaces
- ✅ **Command Pipeline**: Send workflow control commands to backend

## Quick Start

### Basic Connection

```typescript
import { useRealtimeIntegration } from './services';

function MyComponent() {
  const integration = useRealtimeIntegration({
    backendBaseUrl: 'http://localhost:8000',
    enableAutoReconnect: true,
  });

  return (
    <div>
      <button onClick={integration.connect}>Connect</button>
      <button onClick={integration.disconnect}>Disconnect</button>
      <p>Status: {integration.getStatus().isConnected ? 'Connected' : 'Disconnected'}</p>
    </div>
  );
}
```

### Workflow Monitoring

```typescript
import { useWorkflowRealtime } from './services';

function WorkflowMonitor({ workflowId }: { workflowId: string }) {
  const workflow = useWorkflowRealtime(workflowId);
  
  useEffect(() => {
    console.log('Workflow subscription active:', workflow.isSubscribed);
  }, [workflow.isSubscribed]);

  return <div>Monitoring workflow: {workflowId}</div>;
}
```

### Node-Specific Monitoring

```typescript
import { useNodeRealtime } from './services';

function NodeMonitor({ nodeId, workflowId }: { nodeId: string; workflowId: string }) {
  const node = useNodeRealtime(nodeId, workflowId);
  
  return <div>Monitoring node: {nodeId}</div>;
}
```

### Workflow Control Commands

```typescript
import { createRealtimeAdapter, WorkflowController } from './services';

async function controlWorkflow() {
  const adapter = createRealtimeAdapter();
  await adapter.connect();
  
  const controller = new WorkflowController(adapter, 'my-workflow-id');
  
  // Start workflow
  await controller.start({ config: 'value' });
  
  // Pause workflow
  await controller.pause();
  
  // Resume workflow
  await controller.resume();
  
  // Stop workflow
  await controller.stop();
}
```

## API Reference

### RealtimeService

The core service class that manages WebSocket and EventSource connections.

```typescript
class RealtimeService {
  constructor(config?: Partial<RealtimeConnectionConfig>)
  
  // Connection management
  async connect(): Promise<void>
  disconnect(): void
  async reconnect(): Promise<void>
  
  // Message handling
  async sendMessage(message: Partial<RealtimeMessage>): Promise<void>
  
  // Event subscription
  subscribe(eventTypes: MessageType[], callback: MessageEventListener, options?: SubscriptionOptions): string
  unsubscribe(subscriptionId: string): void
  
  // Health monitoring
  getConnectionHealth(): ConnectionHealth
  onConnectionStateChange(listener: ConnectionEventListener): () => void
}
```

### RealtimeAdapter

Backend integration layer with workflow-specific functionality.

```typescript
class RealtimeAdapter {
  constructor(config?: Partial<RealtimeAdapterConfig>)
  
  // Connection
  async connect(): Promise<void>
  disconnect(): void
  
  // Workflow subscriptions
  subscribeToWorkflow(workflowId: string, callback: (event: WorkflowEvent) => void): string
  subscribeToNode(nodeId: string, workflowId: string, callback: Function): string
  
  // Workflow commands
  async startWorkflow(workflowId: string, config?: Record<string, any>): Promise<CommandResponse>
  async stopWorkflow(workflowId: string): Promise<CommandResponse>
  async pauseWorkflow(workflowId: string): Promise<CommandResponse>
  async resumeWorkflow(workflowId: string): Promise<CommandResponse>
  async restartNode(workflowId: string, nodeId: string): Promise<CommandResponse>
  async skipNode(workflowId: string, nodeId: string): Promise<CommandResponse>
  
  // Health monitoring
  async getBackendHealth(): Promise<BackendHealth>
}
```

### Integration Hooks

React hooks for easy integration with components.

```typescript
// Main integration hook
function useRealtimeIntegration(config?: ServiceIntegrationConfig): {
  connect: () => Promise<RealtimeAdapter>
  disconnect: () => void
  subscribeToWorkflow: (workflowId: string) => string | null
  subscribeToNode: (nodeId: string, workflowId: string) => string | null
  unsubscribe: (subscriptionId: string) => void
  getStatus: () => IntegrationStatus
  adapter: RealtimeAdapter | null
}

// Workflow-specific hook
function useWorkflowRealtime(workflowId: string, config?: ServiceIntegrationConfig): {
  // ... all integration methods
  workflowId: string
  isSubscribed: boolean
}

// Node-specific hook
function useNodeRealtime(nodeId: string, workflowId: string, config?: ServiceIntegrationConfig): {
  // ... all integration methods
  nodeId: string
  workflowId: string
  isSubscribed: boolean
}
```

## Configuration

### RealtimeConnectionConfig

```typescript
interface RealtimeConnectionConfig {
  // Connection URLs
  websocketUrl?: string
  eventSourceUrl?: string
  
  // Connection preferences
  preferredType: 'websocket' | 'eventsource'
  fallbackToSecondary: boolean
  
  // Reconnection settings
  autoReconnect: boolean
  maxReconnectAttempts: number
  reconnectIntervalMs: number
  maxReconnectIntervalMs: number
  reconnectBackoffMultiplier: number
  
  // Heartbeat settings
  heartbeatIntervalMs: number
  heartbeatTimeoutMs: number
  enableHeartbeat: boolean
  
  // Message queue settings
  maxQueueSize: number
  enableOfflineQueue: boolean
  queueRetentionMs: number
  
  // Security and authentication
  authToken?: string
  authHeaders?: Record<string, string>
  
  // Timeouts
  connectionTimeoutMs: number
  messageTimeoutMs: number
  
  // Debug options
  enableDebugLogging: boolean
  logLevel: 'debug' | 'info' | 'warn' | 'error'
}
```

### RealtimeAdapterConfig

```typescript
interface RealtimeAdapterConfig {
  // Backend endpoints
  backendBaseUrl: string
  websocketPath: string
  eventSourcePath: string
  
  // Authentication
  apiKey?: string
  authToken?: string
  
  // Features
  enableMessageTransformation: boolean
  enableCommandPipeline: boolean
  enableHealthCheck: boolean
  
  // Timeouts and retries
  commandTimeoutMs: number
  maxRetries: number
  retryDelayMs: number
  healthCheckIntervalMs: number
  
  // Debug options
  logMessages: boolean
  logLevel: 'debug' | 'info' | 'warn' | 'error'
}
```

## Error Handling

The services implement comprehensive error handling with multiple recovery strategies:

### Error Categories

1. **Network Errors**: Connection failures, offline status
   - Default strategy: `['reconnect', 'queue_offline']`

2. **Timeout Errors**: Connection or message timeouts
   - Default strategy: `['reconnect']`

3. **Authentication Errors**: 401, 403, invalid tokens
   - Default strategy: `['notify_only']`

4. **Server Errors**: 500, 502, backend failures
   - Default strategy: `['reconnect', 'fallback_connection']`

5. **Unknown Errors**: Unclassified errors
   - Default strategy: `['reconnect', 'notify_only']`

### Recovery Strategies

- **reconnect**: Attempt to reconnect with exponential backoff
- **fallback_connection**: Switch to alternative connection type (WebSocket ↔ EventSource)
- **queue_offline**: Store messages for later delivery
- **notify_only**: Log error and notify listeners
- **escalate**: Trigger additional error reporting

### Custom Error Recovery

```typescript
const customErrorRecovery: ErrorRecoveryConfig = {
  networkErrors: ['queue_offline', 'notify_only'],
  timeoutErrors: ['reconnect'],
  authErrors: ['escalate', 'notify_only'],
  serverErrors: ['fallback_connection', 'reconnect'],
  unknownErrors: ['notify_only'],
};

const service = new RealtimeService(config, customErrorRecovery);
```

## Examples

Complete usage examples are available in `/services/examples/realtimeUsageExample.tsx`:

- **BasicRealtimeExample**: Basic connection management
- **WorkflowMonitorExample**: Real-time workflow monitoring
- **WorkflowControlExample**: Workflow command operations
- **NodeMonitorExample**: Node-specific monitoring
- **RealtimeServiceDemo**: Complete demonstration

## Integration with Existing Store

The services integrate seamlessly with the existing `nodeExecutionStore`:

```typescript
// The integration automatically:
// 1. Updates node states in the store
// 2. Triggers store subscriptions
// 3. Manages connection state
// 4. Handles offline synchronization

// Store hooks work automatically with real-time updates
const nodeState = useNodeState('my-node-id');
const workflowNodes = useWorkflowNodes('my-workflow-id');
const connectionState = useConnectionState();
```

## Testing

The services include comprehensive error simulation and testing capabilities:

```typescript
// Simulate connection failures
service.disconnect();

// Test offline queue
await service.sendMessage(message); // Will be queued
await service.connect(); // Queue will be processed

// Test error recovery
// (Network errors, timeouts, etc. are handled automatically)
```

## Best Practices

1. **Connection Management**
   - Use `useRealtimeIntegration` for automatic connection management
   - Always clean up subscriptions in `useEffect` cleanup functions
   - Monitor connection health for critical operations

2. **Error Handling**
   - Configure error recovery strategies based on your application needs
   - Implement user feedback for connection issues
   - Use offline queue for non-critical operations

3. **Performance**
   - Limit the number of simultaneous subscriptions
   - Use filters to reduce unnecessary message processing
   - Monitor memory usage with large message queues

4. **Security**
   - Always use authentication tokens in production
   - Validate message content before processing
   - Implement rate limiting for message sending

## Troubleshooting

### Common Issues

1. **Connection Won't Establish**
   - Check backend URL configuration
   - Verify network connectivity
   - Check authentication credentials

2. **Messages Not Received**
   - Verify subscription filters
   - Check message format compatibility
   - Monitor connection health

3. **High Memory Usage**
   - Reduce message queue size
   - Implement message cleanup
   - Limit subscription scope

4. **Frequent Reconnections**
   - Check network stability
   - Adjust heartbeat intervals
   - Review error recovery configuration

### Debug Options

Enable debug logging for detailed troubleshooting:

```typescript
const config = {
  enableDebugLogging: true,
  logLevel: 'debug' as const,
};
```

### Health Monitoring

Monitor connection health regularly:

```typescript
const health = service.getConnectionHealth();
console.log('Connection healthy:', health.isHealthy);
console.log('Issues:', health.errors);
```
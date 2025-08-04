# Real-time Workflow Test Suite

This directory contains comprehensive test suites for the real-time workflow node update functionality in the MAGK Excel application.

## Test Files Overview

### 1. `nodeExecutionStore.test.ts`
Tests the Zustand store functionality that manages real-time node execution state.

**Coverage includes:**
- State updates and management
- Subscription handling
- Connection management
- Offline queue functionality
- Error handling and recovery
- Performance and edge cases

**Key Features Tested:**
- Node state CRUD operations
- Real-time subscription callbacks
- WebSocket/EventSource connection handling
- Offline message queuing and replay
- Connection health monitoring
- Version-based conflict resolution

### 2. `realtimeService.test.ts`
Tests the real-time service that handles WebSocket and EventSource connections.

**Coverage includes:**
- WebSocket connection establishment and management
- EventSource fallback functionality
- Message handling and distribution
- Reconnection logic with exponential backoff
- Heartbeat mechanism
- Error recovery strategies
- Subscription management
- Offline message queuing

**Key Features Tested:**
- Connection lifecycle management
- Message serialization/deserialization
- Automatic reconnection with backoff
- Ping/pong heartbeat monitoring
- Error classification and recovery
- Subscription filtering and callbacks
- Queue management and processing

### 3. `RealtimeWorkflowNode.test.tsx`
Tests the React component that displays real-time workflow node updates.

**Coverage includes:**
- Component rendering with real-time data
- Status transition animations
- Progress update displays
- Error handling and retry functionality
- Connection status indicators
- Offline mode handling
- User interactions

**Key Features Tested:**
- Real-time data integration and display
- Status and progress visualizations
- Error recovery UI (retry buttons)
- Connection status indicators
- Offline/online state handling
- Animation and transition handling
- Component props and configuration

### 4. `integration.test.ts`
End-to-end integration tests that verify the complete real-time workflow functionality.

**Coverage includes:**
- Full workflow execution simulation
- Multi-node coordination
- Connection failure recovery
- Data consistency validation
- Performance testing
- Scale testing

**Key Features Tested:**
- Complete workflow execution scenarios
- Service-store-component integration
- Connection resilience and recovery
- Data consistency across components
- High-frequency update handling
- Large payload processing
- Concurrent subscription management

## Test Dependencies

The tests require the following dependencies (already included in package.json):

### Core Testing
- `@testing-library/react` - React component testing utilities
- `@testing-library/jest-dom` - Additional Jest matchers for DOM
- `@testing-library/user-event` - User interaction simulation

### Mocking
- `jest` - JavaScript testing framework
- Various component and service mocks for isolation

## Running the Tests

### Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Add testing dependencies to package.json:
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

### Test Commands

Run all real-time tests:
```bash
npm test src/__tests__/realtime/
```

Run specific test files:
```bash
# Store tests
npm test src/__tests__/realtime/nodeExecutionStore.test.ts

# Service tests
npm test src/__tests__/realtime/realtimeService.test.ts

# Component tests
npm test src/__tests__/realtime/RealtimeWorkflowNode.test.tsx

# Integration tests
npm test src/__tests__/realtime/integration.test.ts
```

Run tests in watch mode:
```bash
npm test src/__tests__/realtime/ -- --watch
```

Run tests with coverage:
```bash
npm test src/__tests__/realtime/ -- --coverage
```

## Test Configuration

### Jest Setup

Create a `jest.config.js` file in the project root if not exists:

```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts'
  ]
};
```

### Setup File

Create `src/setupTests.ts`:

```typescript
import '@testing-library/jest-dom';

// Mock WebSocket and EventSource globally
global.WebSocket = jest.fn();
global.EventSource = jest.fn();

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));
```

## Test Patterns and Best Practices

### 1. Mocking Strategy
- **WebSocket/EventSource**: Comprehensive mocks with test utilities
- **React Components**: Simplified mocks focusing on data flow
- **External Libraries**: Mock complex animations and UI components
- **Timers**: Use `jest.useFakeTimers()` for testing time-dependent behavior

### 2. Test Structure
- **Arrange**: Set up test data and mocks
- **Act**: Execute the functionality being tested
- **Assert**: Verify expected outcomes

### 3. Real-time Testing Patterns
- Use `act()` wrapper for state updates
- Mock WebSocket messages with realistic payloads
- Test both happy path and error scenarios
- Verify cleanup and resource management

### 4. Integration Testing
- Test complete data flow from service to component
- Verify state consistency across layers
- Test error recovery and reconnection scenarios
- Include performance and scale testing

## Common Test Scenarios

### Testing Real-time Updates
```typescript
// Simulate WebSocket message
const mockMessage = {
  type: 'node_progress',
  nodeId: 'test-node',
  workflowId: 'test-workflow',
  data: { progress: { current: 50, total: 100 } }
};

await act(async () => {
  mockWebSocket.simulateMessage(mockMessage);
  jest.advanceTimersByTime(50);
});

expect(store.getNodeState('test-node')?.progress?.current).toBe(50);
```

### Testing Component Updates
```typescript
render(<RealtimeWorkflowNode {...props} />);

// Simulate real-time update
act(() => {
  triggerSubscriptionCallback(updatedNodeState);
});

await waitFor(() => {
  expect(screen.getByText('Status: running')).toBeInTheDocument();
});
```

### Testing Error Recovery
```typescript
// Simulate connection failure
mockWebSocket.simulateClose(1006, 'Connection lost');

// Verify offline queue
expect(store.offlineQueue.length).toBeGreaterThan(0);

// Simulate reconnection
mockWebSocket.simulateOpen();
await store.actions.processOfflineQueue();

// Verify recovery
expect(store.offlineQueue.length).toBe(0);
```

## Debugging Tests

### Common Issues

1. **Timer-related tests failing**: Ensure `jest.useFakeTimers()` is called
2. **Async state updates**: Use `act()` wrapper for all state changes
3. **Mock cleanup**: Reset mocks in `beforeEach` hooks
4. **Memory leaks**: Clean up subscriptions and connections in `afterEach`

### Debug Commands

Run tests with verbose output:
```bash
npm test -- --verbose
```

Run single test with debugging:
```bash
npm test -- --testNamePattern="specific test name" --no-cache
```

## Performance Considerations

The test suite includes performance tests to ensure:
- Real-time updates don't cause memory leaks
- High-frequency messages are handled efficiently
- Large payloads don't block the UI
- Subscription management scales properly

## Contributing

When adding new tests:

1. Follow the existing test structure and naming conventions
2. Include both happy path and error scenarios
3. Add performance tests for new real-time features
4. Update this README with new test coverage
5. Ensure all tests pass before submitting changes

## Coverage Goals

Target coverage for real-time functionality:
- **Statements**: 95%+
- **Branches**: 90%+
- **Functions**: 95%+
- **Lines**: 95%+

Run coverage reports to verify:
```bash
npm test src/__tests__/realtime/ -- --coverage --watchAll=false
```
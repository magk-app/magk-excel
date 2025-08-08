/**
 * Comprehensive Test Suite for RealtimeService
 * Tests WebSocket/EventSource connections, message handling, reconnection logic,
 * heartbeat mechanism, error recovery, and subscription management.
 */

import { 
  RealtimeService,
  createRealtimeService,
  subscribeToWorkflow,
  subscribeToNode,
  type RealtimeConnectionConfig,
  type RealtimeMessage,
  type ConnectionState,
  type MessageType,
  type QueuedMessage,
  type ConnectionHealth
} from '../../services/realtimeService';

// Enhanced WebSocket Mock
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

  private messageQueue: Record<string, unknown>[] = [];

  constructor(url: string, protocols?: string | string[]) {
    this.url = url;
    this.protocol = Array.isArray(protocols) ? protocols[0] || '' : protocols || '';
  }

  send = jest.fn((data: string | ArrayBufferLike | Blob | ArrayBufferView) => {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    this.messageQueue.push(data as Record<string, unknown>);
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
  simulateOpen() {
    this.readyState = MockWebSocket.OPEN;
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
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close', { code, reason }));
    }
  }

  getMessageQueue() {
    return this.messageQueue;
  }

  clearMessageQueue() {
    this.messageQueue = [];
  }
}

// Enhanced EventSource Mock
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
  }

  close = jest.fn(() => {
    this.readyState = MockEventSource.CLOSED;
  });

  addEventListener = jest.fn();
  removeEventListener = jest.fn();
  dispatchEvent = jest.fn();

  // Test helpers
  simulateOpen() {
    this.readyState = MockEventSource.OPEN;
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
(global as Record<string, unknown>).WebSocket = MockWebSocket;
(global as Record<string, unknown>).EventSource = MockEventSource;

// Test utilities
const createMockMessage = (overrides: Partial<RealtimeMessage> = {}): RealtimeMessage => ({
  id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  type: 'node_status_update',
  timestamp: new Date(),
  workflowId: 'test-workflow-1',
  nodeId: 'test-node-1',
  data: { status: 'running' },
  version: 1,
  ...overrides
});

const createTestConfig = (overrides: Partial<RealtimeConnectionConfig> = {}): Partial<RealtimeConnectionConfig> => ({
  websocketUrl: 'ws://localhost:8000/ws/test',
  eventSourceUrl: 'http://localhost:8000/events/test',
  preferredType: 'websocket',
  autoReconnect: true,
  maxReconnectAttempts: 5,
  reconnectIntervalMs: 100, // Faster for testing
  heartbeatIntervalMs: 1000,
  heartbeatTimeoutMs: 500,
  enableDebugLogging: false,
  ...overrides
});

describe('RealtimeService - Comprehensive Tests', () => {
  let service: RealtimeService;
  let mockConsole: { [key: string]: jest.SpyInstance };

  beforeEach(() => {
    // Mock console methods to avoid test output noise
    mockConsole = {
      log: jest.spyOn(console, 'log').mockImplementation(),
      info: jest.spyOn(console, 'info').mockImplementation(),
      warn: jest.spyOn(console, 'warn').mockImplementation(),
      error: jest.spyOn(console, 'error').mockImplementation(),
      debug: jest.spyOn(console, 'debug').mockImplementation()
    };

    // Clear all mocks
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();

    // Create service with test configuration
    service = new RealtimeService(createTestConfig());
  });

  afterEach(() => {
    // Clean up service
    service.disconnect();
    
    // Restore console methods
    Object.values(mockConsole).forEach(spy => spy.mockRestore());
    
    // Restore timers
    jest.useRealTimers();
  });

  describe('Service Initialization', () => {
    it('should initialize with default configuration', () => {
      const defaultService = new RealtimeService();
      const health = defaultService.getConnectionHealth();
      
      expect(health.connectionState).toBe('disconnected');
      expect(health.reconnectAttempts).toBe(0);
      expect(health.totalMessages).toBe(0);
    });

    it('should initialize with custom configuration', () => {
      const customConfig = createTestConfig({
        maxReconnectAttempts: 10,
        heartbeatIntervalMs: 2000
      });
      
      const customService = new RealtimeService(customConfig);
      const health = customService.getConnectionHealth();
      
      expect(health.connectionState).toBe('disconnected');
      // Configuration is internal, but we can verify it works through behavior
      
      customService.disconnect();
    });

    it('should support configuration updates', () => {
      const newConfig = { heartbeatIntervalMs: 5000 };
      
      expect(() => {
        service.updateConfig(newConfig);
      }).not.toThrow();
    });
  });

  describe('WebSocket Connection Management', () => {
    it('should establish WebSocket connection', async () => {
      const connectPromise = service.connect();
      
      // Simulate successful connection
      jest.advanceTimersByTime(50);
      
      const mockWs = (WebSocket as any).mock.instances[0] as MockWebSocket;
      mockWs.simulateOpen();
      
      await connectPromise;
      
      const health = service.getConnectionHealth();
      expect(health.connectionState).toBe('connected');
      expect(health.connectedAt).toBeInstanceOf(Date);
    });

    it('should handle WebSocket connection timeout', async () => {
      const connectPromise = service.connect();
      
      // Advance time beyond connection timeout
      jest.advanceTimersByTime(15000);
      
      await expect(connectPromise).rejects.toThrow('Connection timeout');
    });

    it('should handle WebSocket connection errors', async () => {
      const connectPromise = service.connect();
      
      jest.advanceTimersByTime(50);
      
      const mockWs = (WebSocket as any).mock.instances[0] as MockWebSocket;
      mockWs.simulateError();
      
      await expect(connectPromise).rejects.toThrow();
    });

    it('should send messages through WebSocket', async () => {
      await connectAndOpen();
      
      const message = createMockMessage();
      await service.sendMessage(message);
      
      const mockWs = (WebSocket as any).mock.instances[0] as MockWebSocket;
      expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify(message));
    });

    it('should handle WebSocket send errors', async () => {
      await connectAndOpen();
      
      const mockWs = (WebSocket as any).mock.instances[0] as MockWebSocket;
      mockWs.send.mockImplementation(() => {
        throw new Error('Send failed');
      });
      
      const message = createMockMessage();
      
      await expect(service.sendMessage(message)).rejects.toThrow();
    });
  });

  describe('EventSource Connection Management', () => {
    beforeEach(() => {
      service = new RealtimeService(createTestConfig({
        preferredType: 'eventsource'
      }));
    });

    it('should establish EventSource connection', async () => {
      const connectPromise = service.connect();
      
      jest.advanceTimersByTime(50);
      
      const mockEs = (EventSource as any).mock.instances[0] as MockEventSource;
      mockEs.simulateOpen();
      
      await connectPromise;
      
      const health = service.getConnectionHealth();
      expect(health.connectionState).toBe('connected');
    });

    it('should handle EventSource connection errors', async () => {
      const connectPromise = service.connect();
      
      jest.advanceTimersByTime(50);
      
      const mockEs = (EventSource as any).mock.instances[0] as MockEventSource;
      mockEs.simulateError();
      
      await expect(connectPromise).rejects.toThrow();
    });

    it('should include auth token in EventSource URL', async () => {
      service.updateConfig({ authToken: 'test-token-123' });
      
      const connectPromise = service.connect();
      jest.advanceTimersByTime(50);
      
      const mockEs = (EventSource as any).mock.instances[0] as MockEventSource;
      expect(mockEs.url).toContain('token=test-token-123');
      
      mockEs.simulateOpen();
      await connectPromise;
    });
  });

  describe('Connection Fallback and Recovery', () => {
    it('should fallback to EventSource when WebSocket fails', async () => {
      service = new RealtimeService(createTestConfig({
        preferredType: 'websocket',
        fallbackToSecondary: true
      }));
      
      const connectPromise = service.connect();
      jest.advanceTimersByTime(50);
      
      // Fail WebSocket connection
      const mockWs = (WebSocket as any).mock.instances[0] as MockWebSocket;
      mockWs.simulateError();
      
      // Should attempt EventSource fallback
      jest.advanceTimersByTime(100);
      
      expect(EventSource).toHaveBeenCalled();
    });

    it('should respect max reconnection attempts', async () => {
      service = new RealtimeService(createTestConfig({
        maxReconnectAttempts: 2,
        reconnectIntervalMs: 100
      }));
      
      await connectAndOpen();
      
      // Simulate connection loss
      const mockWs = (WebSocket as any).mock.instances[0] as MockWebSocket;
      mockWs.simulateClose(1006, 'Connection lost');
      
      // Fast forward through reconnection attempts
      for (let i = 0; i < 3; i++) {
        jest.advanceTimersByTime(200);
        
        if ((WebSocket as any).mock.instances[i + 1]) {
          const reconnectWs = (WebSocket as any).mock.instances[i + 1] as MockWebSocket;
          reconnectWs.simulateError();
        }
      }
      
      const health = service.getConnectionHealth();
      expect(health.connectionState).toBe('error');
    });

    it('should implement exponential backoff for reconnections', async () => {
      service = new RealtimeService(createTestConfig({
        reconnectIntervalMs: 1000,
        reconnectBackoffMultiplier: 2,
        maxReconnectIntervalMs: 10000
      }));
      
      await connectAndOpen();
      
      // Track reconnection intervals
      const connectionTimes: number[] = [];
      const originalWebSocket = global.WebSocket;
      
      (global as Record<string, unknown>).WebSocket = jest.fn().mockImplementation((...args) => {
        connectionTimes.push(Date.now());
        return new MockWebSocket(...args);
      });
      
      // Simulate connection loss
      const mockWs = (WebSocket as any).mock.instances[0] as MockWebSocket;
      mockWs.simulateClose(1006, 'Connection lost');
      
      // Advance through multiple reconnection attempts
      jest.advanceTimersByTime(1000); // First attempt
      jest.advanceTimersByTime(2000); // Second attempt (2x backoff)
      jest.advanceTimersByTime(4000); // Third attempt (4x backoff)
      
      expect(global.WebSocket).toHaveBeenCalledTimes(3); // Initial + 2 reconnects
      
      // Restore original WebSocket
      (global as Record<string, unknown>).WebSocket = originalWebSocket;
    });

    it('should not reconnect after manual disconnect', async () => {
      await connectAndOpen();
      
      service.disconnect();
      
      // Simulate connection close
      const mockWs = (WebSocket as any).mock.instances[0] as MockWebSocket;
      mockWs.simulateClose(1000, 'Manual disconnect');
      
      // Advance time to see if reconnection happens
      jest.advanceTimersByTime(5000);
      
      expect(WebSocket).toHaveBeenCalledTimes(1); // Only initial connection
    });
  });

  describe('Message Handling and Distribution', () => {
    beforeEach(async () => {
      await connectAndOpen();
    });

    it('should receive and parse messages', async () => {
      const receivedMessages: RealtimeMessage[] = [];
      
      service.subscribe('node_status_update', (message) => {
        receivedMessages.push(message);
      });
      
      const testMessage = createMockMessage();
      const mockWs = (WebSocket as any).mock.instances[0] as MockWebSocket;
      mockWs.simulateMessage(testMessage);
      
      expect(receivedMessages).toHaveLength(1);
      expect(receivedMessages[0]).toMatchObject({
        ...testMessage,
        timestamp: expect.any(Date)
      });
    });

    it('should handle heartbeat messages', async () => {
      const heartbeatMessage = {
        id: 'heartbeat-1',
        type: 'heartbeat',
        timestamp: new Date(),
        data: { ping: 'ping-123' }
      };
      
      const mockWs = (WebSocket as any).mock.instances[0] as MockWebSocket;
      mockWs.simulateMessage(heartbeatMessage);
      
      const health = service.getConnectionHealth();
      expect(health.lastHeartbeatAt).toBeInstanceOf(Date);
    });

    it('should send pong responses to ping messages', async () => {
      const pingMessage = {
        id: 'ping-1',
        type: 'heartbeat',
        timestamp: new Date(),
        data: { ping: 'ping-123' }
      };
      
      const mockWs = (WebSocket as any).mock.instances[0] as MockWebSocket;
      mockWs.simulateMessage(pingMessage);
      
      // Should send pong response
      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"pong"')
      );
    });

    it('should handle pong responses and calculate latency', async () => {
      const pingId = Date.now().toString();
      const pongMessage = {
        id: 'pong-1',
        type: 'pong',
        timestamp: new Date(),
        data: { pingId }
      };
      
      // Simulate pending ping
      (service as unknown as { pendingPings: Set<string> }).pendingPings.add(pingId);
      
      const mockWs = (WebSocket as any).mock.instances[0] as MockWebSocket;
      mockWs.simulateMessage(pongMessage);
      
      expect((service as unknown as { pendingPings: Set<string> }).pendingPings.has(pingId)).toBe(false);
      expect((service as unknown as { latencyMeasurements: number[] }).latencyMeasurements.length).toBeGreaterThan(0);
    });

    it('should handle malformed messages gracefully', async () => {
      const mockWs = (WebSocket as any).mock.instances[0] as MockWebSocket;
      
      // Simulate malformed JSON
      if (mockWs.onmessage) {
        mockWs.onmessage(new MessageEvent('message', { data: 'invalid-json' }));
      }
      
      // Service should continue functioning
      const health = service.getConnectionHealth();
      expect(health.connectionState).toBe('connected');
    });
  });

  describe('Subscription Management', () => {
    beforeEach(async () => {
      await connectAndOpen();
    });

    it('should create and manage subscriptions', () => {
      const callback = jest.fn();
      
      const subscriptionId = service.subscribe('node_status_update', callback);
      
      expect(subscriptionId).toMatch(/^sub_/);
      expect((service as unknown as { subscriptions: Map<string, unknown> }).subscriptions.has(subscriptionId)).toBe(true);
    });

    it('should support multiple event types in subscription', () => {
      const callback = jest.fn();
      const eventTypes: MessageType[] = ['node_status_update', 'node_progress_update'];
      
      const subscriptionId = service.subscribe(eventTypes, callback);
      
      // Test both event types
      const mockWs = (WebSocket as any).mock.instances[0] as MockWebSocket;
      
      mockWs.simulateMessage(createMockMessage({ type: 'node_status_update' }));
      mockWs.simulateMessage(createMockMessage({ type: 'node_progress_update' }));
      mockWs.simulateMessage(createMockMessage({ type: 'node_error' })); // Should not match
      
      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('should filter messages by nodeId', () => {
      const callback = jest.fn();
      
      service.subscribe('node_status_update', callback, {
        nodeId: 'specific-node'
      });
      
      const mockWs = (WebSocket as any).mock.instances[0] as MockWebSocket;
      
      mockWs.simulateMessage(createMockMessage({ nodeId: 'specific-node' }));
      mockWs.simulateMessage(createMockMessage({ nodeId: 'other-node' }));
      
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should filter messages by workflowId', () => {
      const callback = jest.fn();
      
      service.subscribe('node_status_update', callback, {
        workflowId: 'specific-workflow'
      });
      
      const mockWs = (WebSocket as any).mock.instances[0] as MockWebSocket;
      
      mockWs.simulateMessage(createMockMessage({ workflowId: 'specific-workflow' }));
      mockWs.simulateMessage(createMockMessage({ workflowId: 'other-workflow' }));
      
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should apply custom filters', () => {
      const callback = jest.fn();
      const filter = (message: RealtimeMessage) => 
        message.data.status === 'completed';
      
      service.subscribe('node_status_update', callback, { filter });
      
      const mockWs = (WebSocket as any).mock.instances[0] as MockWebSocket;
      
      mockWs.simulateMessage(createMockMessage({ data: { status: 'running' } }));
      mockWs.simulateMessage(createMockMessage({ data: { status: 'completed' } }));
      
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should handle subscription callback errors gracefully', () => {
      const throwingCallback = jest.fn(() => {
        throw new Error('Callback error');
      });
      
      service.subscribe('node_status_update', throwingCallback);
      
      const mockWs = (WebSocket as any).mock.instances[0] as MockWebSocket;
      mockWs.simulateMessage(createMockMessage());
      
      expect(throwingCallback).toHaveBeenCalled();
      // Service should continue functioning
      expect(service.getConnectionHealth().connectionState).toBe('connected');
    });

    it('should unsubscribe properly', () => {
      const callback = jest.fn();
      
      const subscriptionId = service.subscribe('node_status_update', callback);
      expect((service as unknown as { subscriptions: Map<string, unknown> }).subscriptions.has(subscriptionId)).toBe(true);
      
      service.unsubscribe(subscriptionId);
      expect(service['subscriptions'].has(subscriptionId)).toBe(false);
      
      // Should not receive messages after unsubscription
      const mockWs = (WebSocket as any).mock.instances[0] as MockWebSocket;
      mockWs.simulateMessage(createMockMessage());
      
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Offline Message Queue', () => {
    it('should queue messages when disconnected', async () => {
      const message = createMockMessage();
      
      // Try to send message while disconnected
      await service.sendMessage(message);
      
      // Message should be queued
      expect((service as unknown as { messageQueue: { message: RealtimeMessage }[] }).messageQueue.length).toBe(1);
      expect((service as unknown as { messageQueue: { message: RealtimeMessage }[] }).messageQueue[0].message).toEqual(expect.objectContaining(message));
    });

    it('should process queued messages when reconnected', async () => {
      const message = createMockMessage();
      
      // Queue message while disconnected
      await service.sendMessage(message);
      expect(service['messageQueue'].length).toBe(1);
      
      // Connect and verify message is sent
      await connectAndOpen();
      
      const mockWs = (WebSocket as any).mock.instances[0] as MockWebSocket;
      expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify(expect.objectContaining(message)));
    });

    it('should retry failed queued messages', async () => {
      const message = createMockMessage();
      
      // Queue message
      await service.sendMessage(message);
      
      // Connect but make send fail
      await service.connect();
      jest.advanceTimersByTime(50);
      
      const mockWs = (WebSocket as any).mock.instances[0] as MockWebSocket;
      mockWs.simulateOpen();
      
      // Make send fail on first attempt
      mockWs.send.mockImplementationOnce(() => {
        throw new Error('Send failed');
      });
      
      // Advance time to trigger retry
      jest.advanceTimersByTime(2000);
      
      expect(mockWs.send).toHaveBeenCalledTimes(2); // Original + retry
    });

    it('should remove messages after max retries', async () => {
      const message = createMockMessage();
      
      // Add message to queue with high retry count
      const queuedMessage: QueuedMessage = {
        id: 'test-msg-1',
        message,
        timestamp: new Date(),
        retryCount: 3,
        maxRetries: 3,
        nextRetryAt: new Date()
      };
      
      (service as unknown as { messageQueue: QueuedMessage[] }).messageQueue = [queuedMessage];
      
      await connectAndOpen();
      
      const mockWs = (WebSocket as any).mock.instances[0] as MockWebSocket;
      mockWs.send.mockImplementation(() => {
        throw new Error('Send failed');
      });
      
      // Should remove message after max retries
      expect(service['messageQueue'].length).toBe(0);
    });

    it('should respect max queue size', async () => {
      service.updateConfig({ maxQueueSize: 2 });
      
      // Queue multiple messages
      for (let i = 0; i < 5; i++) {
        await service.sendMessage(createMockMessage({ id: `msg-${i}` }));
      }
      
      expect((service as unknown as { messageQueue: unknown[] }).messageQueue.length).toBe(2);
    });

    it('should clear queue on command', () => {
      (service as unknown as { messageQueue: QueuedMessage[] }).messageQueue = [
        {
          id: 'test-1',
          message: createMockMessage(),
          timestamp: new Date(),
          retryCount: 0,
          maxRetries: 3,
          nextRetryAt: new Date()
        }
      ];
      
      expect(service['messageQueue'].length).toBe(1);
      
      service.clearQueue();
      expect(service['messageQueue'].length).toBe(0);
    });
  });

  describe('Heartbeat and Health Monitoring', () => {
    beforeEach(async () => {
      await connectAndOpen();
    });

    it('should start heartbeat monitoring when connected', () => {
      // Advance time to trigger heartbeat
      jest.advanceTimersByTime(1500);
      
      const mockWs = (WebSocket as any).mock.instances[0] as MockWebSocket;
      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"ping"')
      );
    });

    it('should handle heartbeat timeout', () => {
      // Start heartbeat
      jest.advanceTimersByTime(1500);
      
      // Don't respond to ping, advance past timeout
      jest.advanceTimersByTime(1000);
      
      // Should log timeout warning
      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('Heartbeat timeout'),
        expect.any(Object)
      );
    });

    it('should calculate connection health correctly', () => {
      const health = service.getConnectionHealth();
      
      expect(health).toMatchObject({
        isHealthy: true,
        connectionState: 'connected',
        connectedAt: expect.any(Date),
        reconnectAttempts: 0,
        totalMessages: expect.any(Number),
        queuedMessages: 0,
        averageLatency: expect.any(Number),
        errors: []
      });
    });

    it('should track message statistics', async () => {
      const initialHealth = service.getConnectionHealth();
      const initialCount = initialHealth.totalMessages;
      
      const mockWs = (WebSocket as any).mock.instances[0] as MockWebSocket;
      mockWs.simulateMessage(createMockMessage());
      
      const updatedHealth = service.getConnectionHealth();
      expect(updatedHealth.totalMessages).toBe(initialCount + 1);
    });

    it('should maintain error history', () => {
      // Simulate error
      (service as unknown as { addError: (error: string) => void }).addError('Test error 1');
      (service as unknown as { addError: (error: string) => void }).addError('Test error 2');
      
      const health = service.getConnectionHealth();
      expect(health.errors.length).toBe(2);
      expect(health.isHealthy).toBe(false);
    });

    it('should limit error history size', () => {
      // Add many errors
      for (let i = 0; i < 120; i++) {
        (service as unknown as { addError: (error: string) => void }).addError(`Error ${i}`);
      }
      
      const health = service.getConnectionHealth();
      expect(health.errors.length).toBeLessThanOrEqual(50);
    });
  });

  describe('Error Recovery Strategies', () => {
    beforeEach(async () => {
      await connectAndOpen();
    });

    it('should determine recovery strategies based on error type', () => {
      const networkError = new Error('Network connection lost');
      const strategies = (service as unknown as { determineRecoveryStrategies: (error: Error) => string[] }).determineRecoveryStrategies(networkError);
      
      expect(strategies).toContain('reconnect');
      expect(strategies).toContain('queue_offline');
    });

    it('should handle authentication errors differently', () => {
      const authError = new Error('401 Unauthorized');
      const strategies = (service as unknown as { determineRecoveryStrategies: (error: Error) => string[] }).determineRecoveryStrategies(authError);
      
      expect(strategies).toContain('notify_only');
    });

    it('should execute fallback connection strategy', async () => {
      service = new RealtimeService(createTestConfig({
        preferredType: 'websocket',
        fallbackToSecondary: true
      }));
      
      await connectAndOpen();
      
      const serverError = new Error('500 Internal Server Error');
      await (service as unknown as { executeRecoveryStrategy: (strategy: string, error: Error) => Promise<void> }).executeRecoveryStrategy('fallback_connection', serverError);
      
      // Should attempt EventSource connection
      expect(EventSource).toHaveBeenCalled();
    });

    it('should queue messages during offline recovery', async () => {
      const networkError = new Error('Network error');
      await (service as unknown as { executeRecoveryStrategy: (strategy: string, error: Error) => Promise<void> }).executeRecoveryStrategy('queue_offline', networkError);
      
      // Subsequent messages should be queued
      const message = createMockMessage();
      await service.sendMessage(message);
      
      expect(service['messageQueue'].length).toBe(1);
    });
  });

  describe('Connection State Management', () => {
    it('should emit connection state changes', () => {
      const stateChangeListener = jest.fn();
      
      const unsubscribe = service.onConnectionStateChange(stateChangeListener);
      
      // Simulate state change
      (service as unknown as { setConnectionState: (state: string) => void }).setConnectionState('connecting');
      
      expect(stateChangeListener).toHaveBeenCalledWith('connecting', undefined);
      
      unsubscribe();
    });

    it('should handle multiple connection state listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      service.onConnectionStateChange(listener1);
      service.onConnectionStateChange(listener2);
      
      (service as unknown as { setConnectionState: (state: string) => void }).setConnectionState('connected');
      
      expect(listener1).toHaveBeenCalledWith('connected', undefined);
      expect(listener2).toHaveBeenCalledWith('connected', undefined);
    });

    it('should handle listener errors gracefully', () => {
      const throwingListener = jest.fn(() => {
        throw new Error('Listener error');
      });
      
      service.onConnectionStateChange(throwingListener);
      (service as unknown as { setConnectionState: (state: string) => void }).setConnectionState('connected');
      
      expect(throwingListener).toHaveBeenCalled();
      // Service should continue functioning
    });
  });

  describe('Utility Functions', () => {
    it('should create service with factory function', () => {
      const factoryService = createRealtimeService({ heartbeatIntervalMs: 5000 });
      
      expect(factoryService).toBeInstanceOf(RealtimeService);
      factoryService.disconnect();
    });

    it('should create workflow subscription', async () => {
      await connectAndOpen();
      
      const callback = jest.fn();
      const subscriptionId = subscribeToWorkflow(service, 'test-workflow', callback);
      
      expect(subscriptionId).toMatch(/^sub_/);
      
      const mockWs = (WebSocket as any).mock.instances[0] as MockWebSocket;
      mockWs.simulateMessage(createMockMessage({ 
        workflowId: 'test-workflow',
        type: 'node_status_update'
      }));
      
      expect(callback).toHaveBeenCalled();
    });

    it('should create node subscription', async () => {
      await connectAndOpen();
      
      const callback = jest.fn();
      const subscriptionId = subscribeToNode(service, 'test-node', callback);
      
      expect(subscriptionId).toMatch(/^sub_/);
      
      const mockWs = (WebSocket as any).mock.instances[0] as MockWebSocket;
      mockWs.simulateMessage(createMockMessage({ 
        nodeId: 'test-node',
        type: 'node_result'
      }));
      
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Performance', () => {
    it('should handle rapid connection/disconnection cycles', async () => {
      for (let i = 0; i < 10; i++) {
        const connectPromise = service.connect();
        jest.advanceTimersByTime(50);
        
        if ((WebSocket as any).mock.instances[i]) {
          const mockWs = (WebSocket as any).mock.instances[i] as MockWebSocket;
          mockWs.simulateOpen();
        }
        
        await connectPromise;
        service.disconnect();
      }
      
      // Should end in disconnected state
      expect(service.getConnectionHealth().connectionState).toBe('disconnected');
    });

    it('should handle large numbers of subscriptions', async () => {
      await connectAndOpen();
      
      const callbacks = Array.from({ length: 1000 }, () => jest.fn());
      callbacks.forEach(callback => {
        service.subscribe('node_status_update', callback);
      });
      
      const mockWs = (WebSocket as any).mock.instances[0] as MockWebSocket;
      mockWs.simulateMessage(createMockMessage());
      
      callbacks.forEach(callback => {
        expect(callback).toHaveBeenCalled();
      });
    });

    it('should handle high message throughput', async () => {
      await connectAndOpen();
      
      const callback = jest.fn();
      service.subscribe('node_status_update', callback);
      
      const mockWs = (WebSocket as any).mock.instances[0] as MockWebSocket;
      
      // Send many messages rapidly
      for (let i = 0; i < 1000; i++) {
        mockWs.simulateMessage(createMockMessage({ id: `msg-${i}` }));
      }
      
      expect(callback).toHaveBeenCalledTimes(1000);
    });

    it('should clean up resources properly on disconnect', () => {
      const connectionListener = jest.fn();
      service.onConnectionStateChange(connectionListener);
      
      service.disconnect();
      
      expect(service.getConnectionHealth().connectionState).toBe('disconnected');
      
      // Timers should be cleared
      expect((service as unknown as { heartbeatTimer: NodeJS.Timeout | null }).heartbeatTimer).toBeNull();
      expect((service as unknown as { reconnectTimer: NodeJS.Timeout | null }).reconnectTimer).toBeNull();
    });
  });

  // Helper function for common setup
  async function connectAndOpen(): Promise<MockWebSocket> {
    const connectPromise = service.connect();
    jest.advanceTimersByTime(50);
    
    const mockWs = (WebSocket as any).mock.instances[0] as MockWebSocket;
    mockWs.simulateOpen();
    
    await connectPromise;
    return mockWs;
  }
});
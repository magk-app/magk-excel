/**
 * Robust real-time connection service for MAGK Excel Electron application
 * Supports both WebSocket and Server-Sent Events (EventSource) with automatic reconnection,
 * heartbeat monitoring, offline message queuing, and comprehensive error handling.
 */

import { 
  WorkflowEvent, 
  NodeStatus, 
  NodeProgress, 
  NodeError, 
  NodeResult, 
  NodeMetadata, 
  NodeLog 
} from '../types/workflow';

// Connection types
export type ConnectionType = 'websocket' | 'eventsource';
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error' | 'closed';

// Message types for different event categories
export type MessageType = 
  | 'node_status_update'
  | 'node_progress_update' 
  | 'node_error'
  | 'node_result'
  | 'node_metadata'
  | 'node_log'
  | 'workflow_event'
  | 'heartbeat'
  | 'ping'
  | 'pong'
  | 'subscription_ack'
  | 'subscription_error';

// Real-time message structure
export interface RealtimeMessage {
  id: string;
  type: MessageType;
  timestamp: Date;
  workflowId?: string;
  nodeId?: string;
  data: Record<string, any>;
  retry?: number;
  version?: number;
}

// Connection configuration
export interface RealtimeConnectionConfig {
  // Connection URLs
  websocketUrl?: string;
  eventSourceUrl?: string;
  
  // Connection preferences
  preferredType: ConnectionType;
  fallbackToSecondary: boolean;
  
  // Reconnection settings
  autoReconnect: boolean;
  maxReconnectAttempts: number;
  reconnectIntervalMs: number;
  maxReconnectIntervalMs: number;
  reconnectBackoffMultiplier: number;
  
  // Heartbeat settings
  heartbeatIntervalMs: number;
  heartbeatTimeoutMs: number;
  enableHeartbeat: boolean;
  
  // Message queue settings
  maxQueueSize: number;
  enableOfflineQueue: boolean;
  queueRetentionMs: number;
  
  // Security and authentication
  authToken?: string;
  authHeaders?: Record<string, string>;
  
  // Connection timeout settings
  connectionTimeoutMs: number;
  messageTimeoutMs: number;
  
  // Debug and logging
  enableDebugLogging: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

// Event listener callback types
export type EventListener<T = any> = (event: T) => void | Promise<void>;
export type ConnectionEventListener = (state: ConnectionState, error?: Error) => void;
export type MessageEventListener = (message: RealtimeMessage) => void;

// Subscription management
export interface Subscription {
  id: string;
  nodeId?: string;
  workflowId?: string;
  eventTypes: MessageType[];
  callback: MessageEventListener;
  filter?: (message: RealtimeMessage) => boolean;
  createdAt: Date;
  isActive: boolean;
}

// Queued message for offline handling
export interface QueuedMessage {
  id: string;
  message: RealtimeMessage;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
  nextRetryAt: Date;
}

// Connection health metrics
export interface ConnectionHealth {
  isHealthy: boolean;
  connectionState: ConnectionState;
  connectedAt?: Date;
  lastMessageAt?: Date;
  lastHeartbeatAt?: Date;
  reconnectAttempts: number;
  totalMessages: number;
  queuedMessages: number;
  averageLatency: number;
  errors: string[];
}

// Error recovery strategies
export type ErrorRecoveryStrategy = 
  | 'reconnect'
  | 'fallback_connection'
  | 'queue_offline'
  | 'notify_only'
  | 'escalate';

export interface ErrorRecoveryConfig {
  networkErrors: ErrorRecoveryStrategy[];
  timeoutErrors: ErrorRecoveryStrategy[];
  authErrors: ErrorRecoveryStrategy[];
  serverErrors: ErrorRecoveryStrategy[];
  unknownErrors: ErrorRecoveryStrategy[];
}

// Default configuration
const DEFAULT_CONFIG: RealtimeConnectionConfig = {
  websocketUrl: 'ws://localhost:8000/ws/realtime',
  eventSourceUrl: 'http://localhost:8000/events/realtime',
  preferredType: 'websocket',
  fallbackToSecondary: true,
  autoReconnect: true,
  maxReconnectAttempts: 10,
  reconnectIntervalMs: 1000,
  maxReconnectIntervalMs: 30000,
  reconnectBackoffMultiplier: 1.5,
  heartbeatIntervalMs: 30000,
  heartbeatTimeoutMs: 10000,
  enableHeartbeat: true,
  maxQueueSize: 1000,
  enableOfflineQueue: true,
  queueRetentionMs: 300000, // 5 minutes
  connectionTimeoutMs: 10000,
  messageTimeoutMs: 5000,
  enableDebugLogging: false,
  logLevel: 'info',
};

const DEFAULT_ERROR_RECOVERY: ErrorRecoveryConfig = {
  networkErrors: ['reconnect', 'queue_offline'],
  timeoutErrors: ['reconnect'],
  authErrors: ['notify_only'],
  serverErrors: ['reconnect', 'fallback_connection'],
  unknownErrors: ['reconnect', 'notify_only'],
};

/**
 * Robust real-time connection service with comprehensive error handling and recovery
 */
export class RealtimeService {
  private config: RealtimeConnectionConfig;
  private errorRecovery: ErrorRecoveryConfig;
  
  // Connection management
  private connection: WebSocket | EventSource | null = null;
  private connectionState: ConnectionState = 'disconnected';
  private currentConnectionType: ConnectionType | null = null;
  
  // Reconnection handling
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isManuallyDisconnected = false;
  
  // Heartbeat management
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private heartbeatTimeoutTimer: NodeJS.Timeout | null = null;
  private lastHeartbeatAt: Date | null = null;
  private pendingPings = new Set<string>();
  
  // Message handling
  private messageQueue: QueuedMessage[] = [];
  private subscriptions = new Map<string, Subscription>();
  private messageCallbacks = new Map<string, EventListener>();
  
  // Metrics and health
  private connectedAt: Date | null = null;
  private lastMessageAt: Date | null = null;
  private totalMessages = 0;
  private latencyMeasurements: number[] = [];
  private errors: string[] = [];
  
  // Event emitter for connection state changes
  private connectionListeners = new Set<ConnectionEventListener>();

  constructor(config?: Partial<RealtimeConnectionConfig>, errorRecovery?: Partial<ErrorRecoveryConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.errorRecovery = { ...DEFAULT_ERROR_RECOVERY, ...errorRecovery };
    
    this.log('info', 'RealtimeService initialized', { config: this.config });
  }

  /**
   * Connect to the real-time service
   */
  async connect(): Promise<void> {
    if (this.connectionState === 'connected' || this.connectionState === 'connecting') {
      this.log('warn', 'Already connected or connecting');
      return;
    }

    this.isManuallyDisconnected = false;
    await this.establishConnection();
  }

  /**
   * Disconnect from the real-time service
   */
  disconnect(): void {
    this.log('info', 'Manual disconnect requested');
    this.isManuallyDisconnected = true;
    this.cleanup();
    this.setConnectionState('disconnected');
  }

  /**
   * Send a message through the connection
   */
  async sendMessage(message: Partial<RealtimeMessage>): Promise<void> {
    const fullMessage: RealtimeMessage = {
      id: message.id || this.generateMessageId(),
      type: message.type || 'workflow_event',
      timestamp: message.timestamp || new Date(),
      data: message.data || {},
      workflowId: message.workflowId,
      nodeId: message.nodeId,
      version: message.version || 1,
    };

    if (this.connectionState === 'connected' && this.connection instanceof WebSocket) {
      try {
        this.connection.send(JSON.stringify(fullMessage));
        this.log('debug', 'Message sent', { messageId: fullMessage.id });
      } catch (error) {
        this.log('error', 'Failed to send message', { error, messageId: fullMessage.id });
        await this.handleError(error as Error, 'send_message');
      }
    } else if (this.config.enableOfflineQueue) {
      this.queueMessage(fullMessage);
      this.log('debug', 'Message queued for offline delivery', { messageId: fullMessage.id });
    } else {
      throw new Error('Not connected and offline queue disabled');
    }
  }

  /**
   * Subscribe to specific events
   */
  subscribe(
    eventTypes: MessageType | MessageType[],
    callback: MessageEventListener,
    options?: {
      nodeId?: string;
      workflowId?: string;
      filter?: (message: RealtimeMessage) => boolean;
    }
  ): string {
    const subscriptionId = this.generateSubscriptionId();
    const types = Array.isArray(eventTypes) ? eventTypes : [eventTypes];
    
    const subscription: Subscription = {
      id: subscriptionId,
      nodeId: options?.nodeId,
      workflowId: options?.workflowId,
      eventTypes: types,
      callback,
      filter: options?.filter,
      createdAt: new Date(),
      isActive: true,
    };

    this.subscriptions.set(subscriptionId, subscription);
    this.log('debug', 'Subscription created', { subscriptionId, eventTypes: types });

    return subscriptionId;
  }

  /**
   * Unsubscribe from events
   */
  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.isActive = false;
      this.subscriptions.delete(subscriptionId);
      this.log('debug', 'Subscription removed', { subscriptionId });
    }
  }

  /**
   * Subscribe to connection state changes
   */
  onConnectionStateChange(listener: ConnectionEventListener): () => void {
    this.connectionListeners.add(listener);
    return () => this.connectionListeners.delete(listener);
  }

  /**
   * Get current connection health status
   */
  getConnectionHealth(): ConnectionHealth {
    const now = new Date();
    const errors = this.errors.slice(-10); // Last 10 errors

    return {
      isHealthy: this.connectionState === 'connected' && errors.length === 0,
      connectionState: this.connectionState,
      connectedAt: this.connectedAt,
      lastMessageAt: this.lastMessageAt,
      lastHeartbeatAt: this.lastHeartbeatAt,
      reconnectAttempts: this.reconnectAttempts,
      totalMessages: this.totalMessages,
      queuedMessages: this.messageQueue.length,
      averageLatency: this.calculateAverageLatency(),
      errors,
    };
  }

  /**
   * Force a reconnection
   */
  async reconnect(): Promise<void> {
    this.log('info', 'Manual reconnection requested');
    this.cleanup();
    await this.establishConnection();
  }

  /**
   * Clear the offline message queue
   */
  clearQueue(): void {
    this.messageQueue = [];
    this.log('info', 'Message queue cleared');
  }

  /**
   * Update service configuration
   */
  updateConfig(config: Partial<RealtimeConnectionConfig>): void {
    this.config = { ...this.config, ...config };
    this.log('info', 'Configuration updated', { config });
  }

  // Private methods

  private async establishConnection(): Promise<void> {
    if (this.isManuallyDisconnected) {
      return;
    }

    this.setConnectionState('connecting');
    
    try {
      const connectionType = this.determineConnectionType();
      await this.createConnection(connectionType);
      this.currentConnectionType = connectionType;
      
    } catch (error) {
      this.log('error', 'Failed to establish connection', { error });
      await this.handleConnectionError(error as Error);
    }
  }

  private determineConnectionType(): ConnectionType {
    // Try preferred type first, then fallback if configured
    if (this.config.preferredType === 'websocket' && this.config.websocketUrl) {
      return 'websocket';
    } else if (this.config.preferredType === 'eventsource' && this.config.eventSourceUrl) {
      return 'eventsource';
    } else if (this.config.fallbackToSecondary) {
      // Try the other type
      if (this.config.preferredType === 'websocket' && this.config.eventSourceUrl) {
        return 'eventsource';
      } else if (this.config.preferredType === 'eventsource' && this.config.websocketUrl) {
        return 'websocket';
      }
    }
    
    throw new Error('No valid connection URL configured');
  }

  private async createConnection(type: ConnectionType): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, this.config.connectionTimeoutMs);

      try {
        if (type === 'websocket') {
          this.createWebSocketConnection(resolve, reject, timeout);
        } else {
          this.createEventSourceConnection(resolve, reject, timeout);
        }
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  private createWebSocketConnection(
    resolve: () => void, 
    reject: (error: Error) => void, 
    timeout: NodeJS.Timeout
  ): void {
    if (!this.config.websocketUrl) {
      reject(new Error('WebSocket URL not configured'));
      return;
    }

    const ws = new WebSocket(this.config.websocketUrl);

    // Add auth headers if configured
    if (this.config.authToken) {
      // Note: WebSocket headers need to be set during construction in browser
      // For Node.js, you might need a different approach
    }

    ws.onopen = () => {
      clearTimeout(timeout);
      this.connection = ws;
      this.handleConnectionOpen();
      resolve();
    };

    ws.onmessage = (event) => {
      this.handleMessage(event.data);
    };

    ws.onclose = (event) => {
      this.handleConnectionClose(event.code, event.reason);
    };

    ws.onerror = (event) => {
      clearTimeout(timeout);
      const error = new Error('WebSocket connection error');
      this.handleConnectionError(error);
      reject(error);
    };
  }

  private createEventSourceConnection(
    resolve: () => void, 
    reject: (error: Error) => void, 
    timeout: NodeJS.Timeout
  ): void {
    if (!this.config.eventSourceUrl) {
      reject(new Error('EventSource URL not configured'));
      return;
    }

    let url = this.config.eventSourceUrl;
    
    // Add auth token as query parameter for EventSource
    if (this.config.authToken) {
      const separator = url.includes('?') ? '&' : '?';
      url += `${separator}token=${encodeURIComponent(this.config.authToken)}`;
    }

    const eventSource = new EventSource(url);

    eventSource.onopen = () => {
      clearTimeout(timeout);
      this.connection = eventSource;
      this.handleConnectionOpen();
      resolve();
    };

    eventSource.onmessage = (event) => {
      this.handleMessage(event.data);
    };

    eventSource.onerror = (event) => {
      clearTimeout(timeout);
      const error = new Error('EventSource connection error');
      this.handleConnectionError(error);
      reject(error);
    };
  }

  private handleConnectionOpen(): void {
    this.log('info', 'Connection established', { type: this.currentConnectionType });
    
    this.setConnectionState('connected');
    this.connectedAt = new Date();
    this.reconnectAttempts = 0;
    
    if (this.config.enableHeartbeat) {
      this.startHeartbeat();
    }
    
    // Process queued messages
    this.processQueuedMessages();
  }

  private handleConnectionClose(code?: number, reason?: string): void {
    this.log('warn', 'Connection closed', { code, reason });
    
    this.cleanup();
    
    if (!this.isManuallyDisconnected && this.config.autoReconnect) {
      this.scheduleReconnect();
    } else {
      this.setConnectionState('closed');
    }
  }

  private async handleConnectionError(error: Error): Promise<void> {
    this.log('error', 'Connection error', { error: error.message });
    this.addError(error.message);
    
    const recoveryStrategies = this.determineRecoveryStrategies(error);
    await this.executeRecoveryStrategies(recoveryStrategies, error);
  }

  private handleMessage(data: string): void {
    try {
      const message: RealtimeMessage = JSON.parse(data);
      
      // Update timestamp to received time
      message.timestamp = new Date();
      
      this.lastMessageAt = message.timestamp;
      this.totalMessages++;
      
      // Handle special message types
      if (message.type === 'heartbeat') {
        this.handleHeartbeat(message);
        return;
      }
      
      if (message.type === 'pong') {
        this.handlePong(message);
        return;
      }

      this.log('debug', 'Message received', { messageId: message.id, type: message.type });

      // Distribute to subscribers
      this.distributeMessage(message);
      
    } catch (error) {
      this.log('error', 'Failed to parse message', { error, data });
    }
  }

  private distributeMessage(message: RealtimeMessage): void {
    for (const subscription of this.subscriptions.values()) {
      if (!subscription.isActive) continue;
      
      // Check if message type matches subscription
      if (!subscription.eventTypes.includes(message.type)) continue;
      
      // Check node/workflow filters
      if (subscription.nodeId && message.nodeId !== subscription.nodeId) continue;
      if (subscription.workflowId && message.workflowId !== subscription.workflowId) continue;
      
      // Apply custom filter
      if (subscription.filter && !subscription.filter(message)) continue;
      
      try {
        subscription.callback(message);
      } catch (error) {
        this.log('error', 'Subscription callback error', { 
          error, 
          subscriptionId: subscription.id 
        });
      }
    }
  }

  private handleHeartbeat(message: RealtimeMessage): void {
    this.lastHeartbeatAt = new Date();
    
    // Send pong if this is a ping
    if (message.data.ping) {
      this.sendPong(message.data.ping);
    }
  }

  private handlePong(message: RealtimeMessage): void {
    const pingId = message.data.pingId;
    if (pingId && this.pendingPings.has(pingId)) {
      this.pendingPings.delete(pingId);
      
      // Calculate latency
      const latency = Date.now() - parseInt(pingId);
      this.latencyMeasurements.push(latency);
      
      // Keep only recent measurements
      if (this.latencyMeasurements.length > 100) {
        this.latencyMeasurements = this.latencyMeasurements.slice(-50);
      }
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.sendPing();
    }, this.config.heartbeatIntervalMs);
  }

  private sendPing(): void {
    const pingId = Date.now().toString();
    this.pendingPings.add(pingId);
    
    const pingMessage: RealtimeMessage = {
      id: this.generateMessageId(),
      type: 'ping',
      timestamp: new Date(),
      data: { pingId },
    };

    this.sendMessage(pingMessage).catch(error => {
      this.log('error', 'Failed to send ping', { error });
    });

    // Set timeout for ping response
    this.heartbeatTimeoutTimer = setTimeout(() => {
      if (this.pendingPings.has(pingId)) {
        this.pendingPings.delete(pingId);
        this.log('warn', 'Heartbeat timeout');
        this.handleError(new Error('Heartbeat timeout'), 'heartbeat_timeout');
      }
    }, this.config.heartbeatTimeoutMs);
  }

  private sendPong(pingId: string): void {
    const pongMessage: RealtimeMessage = {
      id: this.generateMessageId(),
      type: 'pong',
      timestamp: new Date(),
      data: { pingId },
    };

    this.sendMessage(pongMessage).catch(error => {
      this.log('error', 'Failed to send pong', { error });
    });
  }

  private queueMessage(message: RealtimeMessage): void {
    if (this.messageQueue.length >= this.config.maxQueueSize) {
      // Remove oldest message
      this.messageQueue.shift();
    }

    const queuedMessage: QueuedMessage = {
      id: this.generateMessageId(),
      message,
      timestamp: new Date(),
      retryCount: 0,
      maxRetries: 3,
      nextRetryAt: new Date(),
    };

    this.messageQueue.push(queuedMessage);
  }

  private async processQueuedMessages(): Promise<void> {
    const now = new Date();
    const messagesToProcess = this.messageQueue.filter(
      item => item.nextRetryAt <= now && item.retryCount < item.maxRetries
    );

    for (const queuedMessage of messagesToProcess) {
      try {
        await this.sendMessage(queuedMessage.message);
        
        // Remove from queue on success
        const index = this.messageQueue.indexOf(queuedMessage);
        if (index >= 0) {
          this.messageQueue.splice(index, 1);
        }
        
      } catch (error) {
        queuedMessage.retryCount++;
        queuedMessage.nextRetryAt = new Date(now.getTime() + (1000 * Math.pow(2, queuedMessage.retryCount)));
        
        if (queuedMessage.retryCount >= queuedMessage.maxRetries) {
          // Remove failed message
          const index = this.messageQueue.indexOf(queuedMessage);
          if (index >= 0) {
            this.messageQueue.splice(index, 1);
          }
          
          this.log('error', 'Message failed after max retries', { 
            messageId: queuedMessage.message.id,
            error 
          });
        }
      }
    }

    // Clean up old messages
    const cutoff = new Date(now.getTime() - this.config.queueRetentionMs);
    this.messageQueue = this.messageQueue.filter(item => item.timestamp > cutoff);
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.log('error', 'Max reconnection attempts reached');
      this.setConnectionState('error');
      return;
    }

    this.setConnectionState('reconnecting');
    
    const delay = Math.min(
      this.config.reconnectIntervalMs * Math.pow(this.config.reconnectBackoffMultiplier, this.reconnectAttempts),
      this.config.maxReconnectIntervalMs
    );

    this.log('info', 'Scheduling reconnection', { delay, attempt: this.reconnectAttempts + 1 });

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.establishConnection();
    }, delay);
  }

  private cleanup(): void {
    if (this.connection) {
      if (this.connection instanceof WebSocket) {
        this.connection.close(1000, 'Service cleanup');
      } else if (this.connection instanceof EventSource) {
        this.connection.close();
      }
      this.connection = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer);
      this.heartbeatTimeoutTimer = null;
    }

    this.connectedAt = null;
    this.currentConnectionType = null;
  }

  private setConnectionState(state: ConnectionState, error?: Error): void {
    if (this.connectionState !== state) {
      const previousState = this.connectionState;
      this.connectionState = state;
      
      this.log('info', 'Connection state changed', { 
        from: previousState, 
        to: state,
        error: error?.message 
      });

      // Notify listeners
      for (const listener of this.connectionListeners) {
        try {
          listener(state, error);
        } catch (listenerError) {
          this.log('error', 'Connection listener error', { error: listenerError });
        }
      }
    }
  }

  private determineRecoveryStrategies(error: Error): ErrorRecoveryStrategy[] {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('offline')) {
      return this.errorRecovery.networkErrors;
    } else if (message.includes('timeout')) {
      return this.errorRecovery.timeoutErrors;
    } else if (message.includes('auth') || message.includes('401') || message.includes('403')) {
      return this.errorRecovery.authErrors;
    } else if (message.includes('server') || message.includes('500') || message.includes('502')) {
      return this.errorRecovery.serverErrors;
    } else {
      return this.errorRecovery.unknownErrors;
    }
  }

  private async executeRecoveryStrategies(strategies: ErrorRecoveryStrategy[], error: Error): Promise<void> {
    for (const strategy of strategies) {
      try {
        await this.executeRecoveryStrategy(strategy, error);
        break; // Stop after first successful strategy
      } catch (strategyError) {
        this.log('warn', 'Recovery strategy failed', { strategy, error: strategyError });
      }
    }
  }

  private async executeRecoveryStrategy(strategy: ErrorRecoveryStrategy, error: Error): Promise<void> {
    switch (strategy) {
      case 'reconnect':
        if (!this.isManuallyDisconnected) {
          this.scheduleReconnect();
        }
        break;
        
      case 'fallback_connection':
        if (this.config.fallbackToSecondary && this.currentConnectionType) {
          const fallbackType = this.currentConnectionType === 'websocket' ? 'eventsource' : 'websocket';
          const hasUrl = fallbackType === 'websocket' ? this.config.websocketUrl : this.config.eventSourceUrl;
          
          if (hasUrl) {
            this.log('info', 'Attempting fallback connection', { fallbackType });
            this.cleanup();
            await this.createConnection(fallbackType);
          }
        }
        break;
        
      case 'queue_offline':
        // Messages are automatically queued when connection is down
        this.log('info', 'Entering offline mode, messages will be queued');
        break;
        
      case 'notify_only':
        this.addError(`Recovery notification: ${error.message}`);
        break;
        
      case 'escalate':
        // Could trigger additional error reporting or user notification
        this.log('error', 'Error escalated', { error });
        break;
    }
  }

  private async handleError(error: Error, context: string): Promise<void> {
    this.log('error', 'Error occurred', { error: error.message, context });
    this.addError(`${context}: ${error.message}`);
    
    const strategies = this.determineRecoveryStrategies(error);
    await this.executeRecoveryStrategies(strategies, error);
  }

  private addError(error: string): void {
    this.errors.push(`${new Date().toISOString()}: ${error}`);
    
    // Keep only recent errors
    if (this.errors.length > 100) {
      this.errors = this.errors.slice(-50);
    }
  }

  private calculateAverageLatency(): number {
    if (this.latencyMeasurements.length === 0) return 0;
    
    const sum = this.latencyMeasurements.reduce((acc, latency) => acc + latency, 0);
    return sum / this.latencyMeasurements.length;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private log(level: string, message: string, data?: any): void {
    if (!this.config.enableDebugLogging && level === 'debug') return;
    
    const logData = {
      timestamp: new Date().toISOString(),
      service: 'RealtimeService',
      level,
      message,
      ...data,
    };

    console[level as keyof Console](message, logData);
  }
}

// Convenience functions for common operations

/**
 * Create a realtime service instance with default configuration
 */
export function createRealtimeService(config?: Partial<RealtimeConnectionConfig>): RealtimeService {
  return new RealtimeService(config);
}

/**
 * Create subscription for workflow events
 */
export function subscribeToWorkflow(
  service: RealtimeService,
  workflowId: string,
  callback: MessageEventListener
): string {
  return service.subscribe(
    ['node_status_update', 'node_progress_update', 'node_error', 'workflow_event'],
    callback,
    { workflowId }
  );
}

/**
 * Create subscription for node events
 */
export function subscribeToNode(
  service: RealtimeService,
  nodeId: string,
  callback: MessageEventListener
): string {
  return service.subscribe(
    ['node_status_update', 'node_progress_update', 'node_error', 'node_result'],
    callback,
    { nodeId }
  );
}

export default RealtimeService;
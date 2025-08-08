/**
 * Real-time adapter for MAGK Excel backend integration
 * Provides a bridge between the RealtimeService and backend APIs,
 * handles message transformation, and manages backend-specific protocols.
 */

import { 
  RealtimeService, 
  RealtimeMessage, 
  MessageType, 
  RealtimeConnectionConfig,
  ConnectionState 
} from './realtimeService';
import { 
  WorkflowEvent, 
  NodeStatus, 
  NodeProgress, 
  NodeError, 
  NodeResult, 
  NodeMetadata, 
  NodeLog,
  LogLevel 
} from '../types/workflow';

// Backend-specific message formats
export interface BackendMessage {
  event: string;
  data: Record<string, any>;
  id?: string;
  timestamp?: string;
  retry?: number;
}

// Workflow execution commands that can be sent to backend
export type WorkflowCommand = 
  | 'start_workflow'
  | 'stop_workflow'
  | 'pause_workflow'
  | 'resume_workflow'
  | 'restart_node'
  | 'skip_node'
  | 'update_config';

// Command payload structure
export interface CommandPayload {
  command: WorkflowCommand;
  workflowId: string;
  nodeId?: string;
  data?: Record<string, any>;
  requestId?: string;
}

// Response from backend for commands
export interface CommandResponse {
  requestId: string;
  command: WorkflowCommand;
  success: boolean;
  error?: string;
  data?: Record<string, any>;
}

// Adapter configuration
export interface RealtimeAdapterConfig {
  // Backend endpoints
  backendBaseUrl: string;
  websocketPath: string;
  eventSourcePath: string;
  
  // Authentication
  apiKey?: string;
  authToken?: string;
  
  // Message transformation
  enableMessageTransformation: boolean;
  backendMessageFormat: 'standard' | 'custom';
  
  // Command handling
  enableCommandPipeline: boolean;
  commandTimeoutMs: number;
  
  // Retry and resilience
  maxRetries: number;
  retryDelayMs: number;
  
  // Health checking
  enableHealthCheck: boolean;
  healthCheckIntervalMs: number;
  
  // Debug options
  logMessages: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

// Health status from backend
export interface BackendHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  services: {
    database: boolean;
    messaging: boolean;
    workflows: boolean;
  };
  metrics: {
    activeConnections: number;
    queueLength: number;
    responseTime: number;
  };
}

// Subscription tracking
interface SubscriptionTracker {
  id: string;
  active: boolean;
  lastActivity: Date;
  messageCount: number;
}

// Default adapter configuration
const DEFAULT_ADAPTER_CONFIG: RealtimeAdapterConfig = {
  backendBaseUrl: 'http://localhost:8000',
  websocketPath: '/ws/realtime',
  eventSourcePath: '/events/realtime',
  enableMessageTransformation: true,
  backendMessageFormat: 'standard',
  enableCommandPipeline: true,
  commandTimeoutMs: 30000,
  maxRetries: 3,
  retryDelayMs: 1000,
  enableHealthCheck: true,
  healthCheckIntervalMs: 60000,
  logMessages: false,
  logLevel: 'info',
};

/**
 * Real-time adapter that bridges the RealtimeService with backend APIs
 */
export class RealtimeAdapter {
  private config: RealtimeAdapterConfig;
  private realtimeService: RealtimeService;
  
  // Command management
  private pendingCommands = new Map<string, {
    resolve: (response: CommandResponse) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
    command: CommandPayload;
  }>();
  
  // Subscription tracking
  private subscriptions = new Map<string, SubscriptionTracker>();
  
  // Health monitoring
  private lastHealthCheck: Date | null = null;
  private healthStatus: BackendHealth | null = null;
  private healthCheckTimer: NodeJS.Timeout | null = null;
  
  // Message transformation handlers
  private messageTransformers = new Map<string, (data: any) => RealtimeMessage>();
  private responseTransformers = new Map<string, (message: RealtimeMessage) => any>();

  constructor(config?: Partial<RealtimeAdapterConfig>) {
    this.config = { ...DEFAULT_ADAPTER_CONFIG, ...config };
    
    // Initialize realtime service with backend URLs
    const serviceConfig: Partial<RealtimeConnectionConfig> = {
      websocketUrl: `${this.config.backendBaseUrl.replace('http', 'ws')}${this.config.websocketPath}`,
      eventSourceUrl: `${this.config.backendBaseUrl}${this.config.eventSourcePath}`,
      authToken: this.config.authToken,
      enableDebugLogging: this.config.logMessages,
      logLevel: this.config.logLevel,
    };

    this.realtimeService = new RealtimeService(serviceConfig);
    
    this.setupMessageHandlers();
    this.setupHealthMonitoring();
    this.registerDefaultTransformers();
    
    this.log('info', 'RealtimeAdapter initialized', { config: this.config });
  }

  /**
   * Connect to the backend
   */
  async connect(): Promise<void> {
    this.log('info', 'Connecting to backend');
    await this.realtimeService.connect();
    
    if (this.config.enableHealthCheck) {
      this.startHealthMonitoring();
    }
  }

  /**
   * Disconnect from the backend
   */
  disconnect(): void {
    this.log('info', 'Disconnecting from backend');
    this.realtimeService.disconnect();
    this.stopHealthMonitoring();
    this.cleanupPendingCommands();
  }

  /**
   * Subscribe to workflow events
   */
  subscribeToWorkflow(
    workflowId: string,
    callback: (event: WorkflowEvent) => void
  ): string {
    const subscriptionId = this.realtimeService.subscribe(
      ['workflow_event', 'node_status_update', 'node_progress_update', 'node_error'],
      (message) => {
        if (message.workflowId === workflowId) {
          const workflowEvent = this.transformToWorkflowEvent(message);
          if (workflowEvent) {
            callback(workflowEvent);
            this.updateSubscriptionActivity(subscriptionId);
          }
        }
      },
      { workflowId }
    );

    this.trackSubscription(subscriptionId);
    return subscriptionId;
  }

  /**
   * Subscribe to node-specific events
   */
  subscribeToNode(
    nodeId: string,
    workflowId: string,
    callback: (event: {
      status?: NodeStatus;
      progress?: NodeProgress;
      error?: NodeError;
      result?: NodeResult;
      metadata?: NodeMetadata;
      logs?: NodeLog[];
    }) => void
  ): string {
    const subscriptionId = this.realtimeService.subscribe(
      ['node_status_update', 'node_progress_update', 'node_error', 'node_result', 'node_metadata', 'node_log'],
      (message) => {
        if (message.nodeId === nodeId && message.workflowId === workflowId) {
          const nodeEvent = this.transformToNodeEvent(message);
          if (nodeEvent) {
            callback(nodeEvent);
            this.updateSubscriptionActivity(subscriptionId);
          }
        }
      },
      { nodeId, workflowId }
    );

    this.trackSubscription(subscriptionId);
    return subscriptionId;
  }

  /**
   * Unsubscribe from events
   */
  unsubscribe(subscriptionId: string): void {
    this.realtimeService.unsubscribe(subscriptionId);
    this.subscriptions.delete(subscriptionId);
    this.log('debug', 'Unsubscribed from events', { subscriptionId });
  }

  /**
   * Send a workflow command to the backend
   */
  async sendWorkflowCommand(
    command: WorkflowCommand,
    workflowId: string,
    nodeId?: string,
    data?: Record<string, any>
  ): Promise<CommandResponse> {
    const requestId = this.generateRequestId();
    
    const payload: CommandPayload = {
      command,
      workflowId,
      nodeId,
      data,
      requestId,
    };

    this.log('debug', 'Sending workflow command', { command, workflowId, nodeId, requestId });

    return new Promise((resolve, reject) => {
      // Set up timeout
      const timeout = setTimeout(() => {
        this.pendingCommands.delete(requestId);
        reject(new Error(`Command timeout: ${command}`));
      }, this.config.commandTimeoutMs);

      // Store pending command
      this.pendingCommands.set(requestId, {
        resolve,
        reject,
        timeout,
        command: payload,
      });

      // Send command message
      const message: RealtimeMessage = {
        id: requestId,
        type: 'workflow_event',
        timestamp: new Date(),
        workflowId,
        nodeId,
        data: {
          type: 'command',
          command: payload,
        },
      };

      this.realtimeService.sendMessage(message).catch((error) => {
        this.pendingCommands.delete(requestId);
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  /**
   * Start a workflow
   */
  async startWorkflow(workflowId: string, config?: Record<string, any>): Promise<CommandResponse> {
    return this.sendWorkflowCommand('start_workflow', workflowId, undefined, config);
  }

  /**
   * Stop a workflow
   */
  async stopWorkflow(workflowId: string): Promise<CommandResponse> {
    return this.sendWorkflowCommand('stop_workflow', workflowId);
  }

  /**
   * Pause a workflow
   */
  async pauseWorkflow(workflowId: string): Promise<CommandResponse> {
    return this.sendWorkflowCommand('pause_workflow', workflowId);
  }

  /**
   * Resume a workflow
   */
  async resumeWorkflow(workflowId: string): Promise<CommandResponse> {
    return this.sendWorkflowCommand('resume_workflow', workflowId);
  }

  /**
   * Restart a specific node
   */
  async restartNode(workflowId: string, nodeId: string): Promise<CommandResponse> {
    return this.sendWorkflowCommand('restart_node', workflowId, nodeId);
  }

  /**
   * Skip a node execution
   */
  async skipNode(workflowId: string, nodeId: string): Promise<CommandResponse> {
    return this.sendWorkflowCommand('skip_node', workflowId, nodeId);
  }

  /**
   * Update workflow or node configuration
   */
  async updateConfig(
    workflowId: string, 
    config: Record<string, any>, 
    nodeId?: string
  ): Promise<CommandResponse> {
    return this.sendWorkflowCommand('update_config', workflowId, nodeId, config);
  }

  /**
   * Get backend health status
   */
  async getBackendHealth(): Promise<BackendHealth> {
    try {
      const response = await fetch(`${this.config.backendBaseUrl}/health`, {
        headers: this.getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }
      
      const healthData = await response.json();
      this.healthStatus = {
        status: healthData.status || 'unknown',
        timestamp: new Date(),
        services: healthData.services || {},
        metrics: healthData.metrics || {},
      };
      
      this.lastHealthCheck = new Date();
      return this.healthStatus;
      
    } catch (error) {
      this.log('error', 'Health check failed', { error });
      throw error;
    }
  }

  /**
   * Get connection status and metrics
   */
  getStatus(): {
    connected: boolean;
    health: BackendHealth | null;
    subscriptions: number;
    pendingCommands: number;
    connectionState: ConnectionState;
  } {
    const connectionHealth = this.realtimeService.getConnectionHealth();
    
    return {
      connected: connectionHealth.isHealthy,
      health: this.healthStatus,
      subscriptions: this.subscriptions.size,
      pendingCommands: this.pendingCommands.size,
      connectionState: connectionHealth.connectionState,
    };
  }

  /**
   * Register custom message transformer
   */
  registerMessageTransformer(eventType: string, transformer: (data: any) => RealtimeMessage): void {
    this.messageTransformers.set(eventType, transformer);
  }

  /**
   * Register custom response transformer
   */
  registerResponseTransformer(messageType: string, transformer: (message: RealtimeMessage) => any): void {
    this.responseTransformers.set(messageType, transformer);
  }

  // Private methods

  private setupMessageHandlers(): void {
    // Handle command responses
    this.realtimeService.subscribe(
      ['workflow_event'],
      (message) => {
        if (message.data.type === 'command_response') {
          this.handleCommandResponse(message);
        }
      }
    );

    // Handle connection state changes
    this.realtimeService.onConnectionStateChange((state, error) => {
      this.log('info', 'Connection state changed', { state, error: error?.message });
    });
  }

  private setupHealthMonitoring(): void {
    if (this.config.enableHealthCheck) {
      this.startHealthMonitoring();
    }
  }

  private startHealthMonitoring(): void {
    this.healthCheckTimer = setInterval(async () => {
      try {
        await this.getBackendHealth();
      } catch (error) {
        this.log('warn', 'Health check failed', { error });
      }
    }, this.config.healthCheckIntervalMs);
  }

  private stopHealthMonitoring(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
  }

  private handleCommandResponse(message: RealtimeMessage): void {
    const response = message.data.response as CommandResponse;
    if (!response || !response.requestId) {
      return;
    }

    const pending = this.pendingCommands.get(response.requestId);
    if (pending) {
      clearTimeout(pending.timeout);
      this.pendingCommands.delete(response.requestId);
      
      if (response.success) {
        pending.resolve(response);
      } else {
        pending.reject(new Error(response.error || 'Command failed'));
      }
    }
  }

  private transformToWorkflowEvent(message: RealtimeMessage): WorkflowEvent | null {
    try {
      const event: WorkflowEvent = {
        type: this.mapMessageTypeToEventType(message.type),
        workflowId: message.workflowId!,
        nodeId: message.nodeId,
        timestamp: message.timestamp,
        data: message.data,
      };
      
      return event;
    } catch (error) {
      this.log('error', 'Failed to transform workflow event', { error, message });
      return null;
    }
  }

  private transformToNodeEvent(message: RealtimeMessage): any | null {
    try {
      const event: any = {};
      
      switch (message.type) {
        case 'node_status_update':
          event.status = message.data.status as NodeStatus;
          break;
        case 'node_progress_update':
          event.progress = message.data.progress as NodeProgress;
          break;
        case 'node_error':
          event.error = message.data.error as NodeError;
          break;
        case 'node_result':
          event.result = message.data.result as NodeResult;
          break;
        case 'node_metadata':
          event.metadata = message.data.metadata as NodeMetadata;
          break;
        case 'node_log':
          event.logs = message.data.logs as NodeLog[];
          break;
      }
      
      return event;
    } catch (error) {
      this.log('error', 'Failed to transform node event', { error, message });
      return null;
    }
  }

  private mapMessageTypeToEventType(messageType: MessageType): WorkflowEvent['type'] {
    switch (messageType) {
      case 'node_status_update':
        return 'node_started'; // Could be more specific based on status
      case 'node_progress_update':
        return 'node_progress';
      case 'node_error':
        return 'node_error';
      case 'node_result':
        return 'node_completed';
      default:
        return 'workflow_completed';
    }
  }

  private trackSubscription(subscriptionId: string): void {
    this.subscriptions.set(subscriptionId, {
      id: subscriptionId,
      active: true,
      lastActivity: new Date(),
      messageCount: 0,
    });
  }

  private updateSubscriptionActivity(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.lastActivity = new Date();
      subscription.messageCount++;
    }
  }

  private cleanupPendingCommands(): void {
    for (const [requestId, pending] of this.pendingCommands.entries()) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Connection closed'));
    }
    this.pendingCommands.clear();
  }

  private registerDefaultTransformers(): void {
    // Register standard transformers for backend message formats
    this.registerMessageTransformer('workflow_started', (data) => ({
      id: this.generateRequestId(),
      type: 'workflow_event',
      timestamp: new Date(),
      workflowId: data.workflowId,
      data: { type: 'workflow_started', ...data },
    }));

    this.registerMessageTransformer('node_execution_update', (data) => ({
      id: this.generateRequestId(),
      type: 'node_status_update',
      timestamp: new Date(),
      workflowId: data.workflowId,
      nodeId: data.nodeId,
      data: { status: data.status, ...data },
    }));
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.apiKey) {
      headers['X-API-Key'] = this.config.apiKey;
    }

    if (this.config.authToken) {
      headers['Authorization'] = `Bearer ${this.config.authToken}`;
    }

    return headers;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private log(level: string, message: string, data?: any): void {
    if (!this.config.logMessages && level === 'debug') return;
    
    const logData = {
      timestamp: new Date().toISOString(),
      service: 'RealtimeAdapter',
      level,
      message,
      ...data,
    };

    const logMethod = console[level as keyof Console] as (message?: any, ...optionalParams: any[]) => void;
    if (typeof logMethod === 'function') {
      logMethod(message, logData);
    }
  }
}

// Factory function for creating configured adapter
export function createRealtimeAdapter(config?: Partial<RealtimeAdapterConfig>): RealtimeAdapter {
  return new RealtimeAdapter(config);
}

// Convenience wrapper for workflow operations
export class WorkflowController {
  private adapter: RealtimeAdapter;
  private workflowId: string;
  
  constructor(adapter: RealtimeAdapter, workflowId: string) {
    this.adapter = adapter;
    this.workflowId = workflowId;
  }

  async start(config?: Record<string, any>): Promise<CommandResponse> {
    return this.adapter.startWorkflow(this.workflowId, config);
  }

  async stop(): Promise<CommandResponse> {
    return this.adapter.stopWorkflow(this.workflowId);
  }

  async pause(): Promise<CommandResponse> {
    return this.adapter.pauseWorkflow(this.workflowId);
  }

  async resume(): Promise<CommandResponse> {
    return this.adapter.resumeWorkflow(this.workflowId);
  }

  async restartNode(nodeId: string): Promise<CommandResponse> {
    return this.adapter.restartNode(this.workflowId, nodeId);
  }

  async skipNode(nodeId: string): Promise<CommandResponse> {
    return this.adapter.skipNode(this.workflowId, nodeId);
  }

  async updateConfig(config: Record<string, any>, nodeId?: string): Promise<CommandResponse> {
    return this.adapter.updateConfig(this.workflowId, config, nodeId);
  }

  subscribeToEvents(callback: (event: WorkflowEvent) => void): string {
    return this.adapter.subscribeToWorkflow(this.workflowId, callback);
  }

  subscribeToNode(nodeId: string, callback: (event: any) => void): string {
    return this.adapter.subscribeToNode(nodeId, this.workflowId, callback);
  }

  unsubscribe(subscriptionId: string): void {
    this.adapter.unsubscribe(subscriptionId);
  }
}

export { RealtimeAdapter as default };
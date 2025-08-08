import { WebSocketServer, WebSocket } from 'ws';
import { EventEmitter } from 'events';

export interface WebSocketMessage {
  type: string;
  workflowId?: string;
  nodeId?: string;
  data?: any;
  timestamp: Date;
  naturalLanguage?: string; // Natural language description of the event
}

export interface ClientConnection {
  id: string;
  ws: WebSocket;
  subscriptions: Set<string>; // workflow IDs
  lastHeartbeat: Date;
}

export class WorkflowWebSocketService extends EventEmitter {
  private server: WebSocketServer;
  private clients: Map<string, ClientConnection> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(port: number = 8000) {
    super();
    
    this.server = new WebSocketServer({ port });
    console.log(`🔌 WebSocket server starting on port ${port}`);

    this.setupServer();
    this.startHeartbeat();
  }

  private setupServer(): void {
    this.server.on('connection', (ws: WebSocket) => {
      const clientId = this.generateClientId();
      console.log(`🔗 Client connected: ${clientId}`);

      const client: ClientConnection = {
        id: clientId,
        ws,
        subscriptions: new Set(),
        lastHeartbeat: new Date()
      };

      this.clients.set(clientId, client);

      // Handle messages from client
      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleClientMessage(clientId, message);
        } catch (error) {
          console.error('Failed to parse client message:', error);
        }
      });

      // Handle client disconnect
      ws.on('close', () => {
        console.log(`🔌 Client disconnected: ${clientId}`);
        this.clients.delete(clientId);
      });

      // Handle client errors
      ws.on('error', (error: Error) => {
        console.error(`Client ${clientId} error:`, error);
        this.clients.delete(clientId);
      });

      // Send welcome message
      this.sendToClient(clientId, {
        type: 'connected',
        data: { clientId },
        timestamp: new Date()
      });
    });

    this.server.on('error', (error: Error) => {
      console.error('WebSocket server error:', error);
    });
  }

  private handleClientMessage(clientId: string, message: any): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (message.type) {
      case 'subscribe':
        if (message.workflowId) {
          client.subscriptions.add(message.workflowId);
          console.log(`📺 Client ${clientId} subscribed to workflow ${message.workflowId}`);
        }
        break;

      case 'unsubscribe':
        if (message.workflowId) {
          client.subscriptions.delete(message.workflowId);
          console.log(`📺 Client ${clientId} unsubscribed from workflow ${message.workflowId}`);
        }
        break;

      case 'heartbeat':
        client.lastHeartbeat = new Date();
        this.sendToClient(clientId, {
          type: 'heartbeat',
          timestamp: new Date()
        });
        break;

      default:
        console.warn(`Unknown message type: ${message.type}`);
    }
  }

  /**
   * Broadcast workflow event to subscribed clients
   */
  broadcastWorkflowEvent(workflowId: string, event: WebSocketMessage): void {
    // Add natural language description if not already present
    const enhancedEvent = event.naturalLanguage ? event : this.addNaturalLanguageDescription(event);
    
    const message = {
      ...enhancedEvent,
      workflowId,
      timestamp: new Date()
    };

    this.clients.forEach((client) => {
      if (client.subscriptions.has(workflowId)) {
        this.sendToClient(client.id, message);
      }
    });

    console.log(`📡 Broadcasted ${event.type} to ${this.getSubscriberCount(workflowId)} clients`);
  }

  /**
   * Add natural language descriptions to workflow events
   */
  private addNaturalLanguageDescription(event: WebSocketMessage): WebSocketMessage {
    let naturalLanguage = '';
    
    switch (event.type) {
      case 'workflow_start':
        naturalLanguage = `🚀 Starting workflow execution...`;
        break;
      
      case 'node_start':
        const nodeType = event.data?.nodeType || event.data?.type || 'processing';
        naturalLanguage = this.getNodeStartDescription(nodeType, event.data);
        break;
      
      case 'node_progress':
        naturalLanguage = this.getNodeProgressDescription(event.data);
        break;
      
      case 'node_complete':
        naturalLanguage = this.getNodeCompleteDescription(event.data);
        break;
      
      case 'node_error':
        naturalLanguage = `❌ Error occurred: ${event.data?.error || 'Unknown error'}`;
        break;
      
      case 'workflow_complete':
        naturalLanguage = `✅ Workflow completed successfully! ${event.data?.summary || ''}`;
        break;
      
      case 'workflow_error':
        naturalLanguage = `❌ Workflow failed: ${event.data?.error || 'Unknown error'}`;
        break;
      
      default:
        naturalLanguage = `Processing ${event.type}...`;
    }
    
    return {
      ...event,
      naturalLanguage
    };
  }

  /**
   * Get natural language description for node start
   */
  private getNodeStartDescription(nodeType: string, data: any): string {
    const descriptions: Record<string, string> = {
      'web-scraping': `🌐 Starting to scrape data from ${data?.url || 'webpage'}...`,
      'pdf-extract': `📄 Beginning PDF extraction from ${data?.fileName || 'document'}...`,
      'api-call': `🔌 Making API call to ${data?.endpoint || 'external service'}...`,
      'data-transform': `🔄 Transforming data with ${data?.transformations?.length || 0} operations...`,
      'excel-export': `📊 Preparing Excel export to ${data?.fileName || 'spreadsheet'}...`
    };
    
    return descriptions[nodeType] || `⚙️ Starting ${nodeType} operation...`;
  }

  /**
   * Get natural language description for node progress
   */
  private getNodeProgressDescription(data: any): string {
    if (data?.progress !== undefined) {
      const percentage = Math.round(data.progress * 100);
      return `⏳ Processing... ${percentage}% complete`;
    }
    
    if (data?.message) {
      return `⏳ ${data.message}`;
    }
    
    if (data?.itemsProcessed !== undefined && data?.totalItems !== undefined) {
      return `⏳ Processed ${data.itemsProcessed} of ${data.totalItems} items`;
    }
    
    return `⏳ Operation in progress...`;
  }

  /**
   * Get natural language description for node completion
   */
  private getNodeCompleteDescription(data: any): string {
    const nodeType = data?.nodeType || data?.type;
    const result = data?.result;
    
    const descriptions: Record<string, string> = {
      'web-scraping': `✅ Successfully scraped ${result?.recordCount || 0} records`,
      'pdf-extract': `✅ Extracted ${result?.pageCount || 0} pages with ${result?.tableCount || 0} tables`,
      'api-call': `✅ API call completed with status ${result?.status || 200}`,
      'data-transform': `✅ Transformed ${result?.recordCount || 0} records`,
      'excel-export': `✅ Excel file created: ${result?.fileName || 'output.xlsx'}`
    };
    
    return descriptions[nodeType] || `✅ ${nodeType || 'Operation'} completed successfully`;
  }

  /**
   * Broadcast to all connected clients
   */
  broadcastToAll(message: WebSocketMessage): void {
    this.clients.forEach((client) => {
      this.sendToClient(client.id, message);
    });
  }

  /**
   * Send message to specific client
   */
  private sendToClient(clientId: string, message: WebSocketMessage): void {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      client.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error(`Failed to send message to client ${clientId}:`, error);
      this.clients.delete(clientId);
    }
  }

  /**
   * Generate unique client ID
   */
  private generateClientId(): string {
    return `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get number of subscribers for a workflow
   */
  private getSubscriberCount(workflowId: string): number {
    let count = 0;
    this.clients.forEach((client) => {
      if (client.subscriptions.has(workflowId)) {
        count++;
      }
    });
    return count;
  }

  /**
   * Start heartbeat to check client connections
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = new Date();
      const staleClients: string[] = [];

      this.clients.forEach((client, clientId) => {
        const timeSinceHeartbeat = now.getTime() - client.lastHeartbeat.getTime();
        
        if (timeSinceHeartbeat > 60000) { // 1 minute timeout
          staleClients.push(clientId);
        } else {
          // Send heartbeat to active clients
          this.sendToClient(clientId, {
            type: 'heartbeat',
            timestamp: now
          });
        }
      });

      // Remove stale clients
      staleClients.forEach((clientId) => {
        console.log(`💔 Removing stale client: ${clientId}`);
        const client = this.clients.get(clientId);
        if (client) {
          client.ws.terminate();
          this.clients.delete(clientId);
        }
      });
    }, 30000); // Every 30 seconds
  }

  /**
   * Get server statistics
   */
  getStats(): any {
    return {
      connectedClients: this.clients.size,
      totalSubscriptions: Array.from(this.clients.values())
        .reduce((sum, client) => sum + client.subscriptions.size, 0),
      activeWorkflows: new Set(
        Array.from(this.clients.values())
          .flatMap(client => Array.from(client.subscriptions))
      ).size
    };
  }

  /**
   * Shutdown the WebSocket server
   */
  shutdown(): void {
    console.log('🔌 Shutting down WebSocket server...');
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Close all client connections
    this.clients.forEach((client) => {
      client.ws.close(1000, 'Server shutting down');
    });

    // Close server
    this.server.close();
  }

  /**
   * Format workflow events for WebSocket transmission
   */
  static formatWorkflowEvent(eventType: string, data: any): WebSocketMessage {
    return {
      type: eventType,
      data,
      timestamp: new Date()
    };
  }
}
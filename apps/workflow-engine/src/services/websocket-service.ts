import { WebSocketServer, WebSocket } from 'ws';
import { EventEmitter } from 'events';

export interface WebSocketMessage {
  type: string;
  workflowId?: string;
  nodeId?: string;
  data?: any;
  timestamp: Date;
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
    const message = {
      ...event,
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
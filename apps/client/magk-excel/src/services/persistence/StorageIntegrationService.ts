/**
 * Storage Integration Service - Connects all persistence components
 * 
 * This service acts as the central coordinator for all file storage operations,
 * integrating the unified persistence service with MCP tools, executor outputs,
 * chat sessions, and download handlers.
 */

import { unifiedPersistenceService } from './UnifiedPersistenceService';
import { enhancedExcelMCPTool } from './EnhancedExcelMCPTool';
import { persistenceMCPTool } from './PersistenceMCPTool';
import { filesystemMCPTool } from './FilesystemMCPTool';
import { useFilePersistenceStore } from '../../stores/filePersistenceStore';
import { excelService } from '../excel/ExcelService';

export interface StorageIntegrationConfig {
  autoBackupEnabled: boolean;
  cloudSyncEnabled: boolean;
  compressionEnabled: boolean;
  versioningEnabled: boolean;
  maxVersionsPerFile: number;
  retentionPolicies: {
    temporary: number; // hours
    session: number; // hours 
    persistent: number; // days
  };
}

export interface IntegrationPoint {
  name: string;
  type: 'mcp-tool' | 'executor' | 'download' | 'chat' | 'upload';
  active: boolean;
  lastActivity: Date | null;
  metrics: {
    operationsCount: number;
    successRate: number;
    averageResponseTime: number;
  };
}

export interface StorageOperation {
  id: string;
  type: 'store' | 'retrieve' | 'update' | 'delete' | 'export';
  source: string; // Integration point that initiated the operation
  fileId: string;
  fileName: string;
  sessionId: string;
  timestamp: Date;
  duration: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

export class StorageIntegrationService {
  private config: StorageIntegrationConfig;
  private integrationPoints: Map<string, IntegrationPoint>;
  private operations: StorageOperation[];
  private eventListeners: Map<string, Set<(data: any) => void>>;
  
  constructor() {
    this.config = this.getDefaultConfig();
    this.integrationPoints = new Map();
    this.operations = [];
    this.eventListeners = new Map();
    
    this.initializeIntegrationPoints();
    this.setupEventHandlers();
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): StorageIntegrationConfig {
    return {
      autoBackupEnabled: true,
      cloudSyncEnabled: false,
      compressionEnabled: true,
      versioningEnabled: true,
      maxVersionsPerFile: 10,
      retentionPolicies: {
        temporary: 2, // 2 hours
        session: 24, // 24 hours
        persistent: 30 // 30 days
      }
    };
  }

  /**
   * Initialize integration points
   */
  private initializeIntegrationPoints(): void {
    const points: IntegrationPoint[] = [
      {
        name: 'excel-mcp-tool',
        type: 'mcp-tool',
        active: true,
        lastActivity: null,
        metrics: { operationsCount: 0, successRate: 0, averageResponseTime: 0 }
      },
      {
        name: 'persistence-mcp-tool',
        type: 'mcp-tool',
        active: true,
        lastActivity: null,
        metrics: { operationsCount: 0, successRate: 0, averageResponseTime: 0 }
      },
      {
        name: 'filesystem-mcp-tool',
        type: 'mcp-tool',
        active: true,
        lastActivity: null,
        metrics: { operationsCount: 0, successRate: 0, averageResponseTime: 0 }
      },
      {
        name: 'executor-output',
        type: 'executor',
        active: true,
        lastActivity: null,
        metrics: { operationsCount: 0, successRate: 0, averageResponseTime: 0 }
      },
      {
        name: 'chat-integration',
        type: 'chat',
        active: true,
        lastActivity: null,
        metrics: { operationsCount: 0, successRate: 0, averageResponseTime: 0 }
      },
      {
        name: 'download-handler',
        type: 'download',
        active: true,
        lastActivity: null,
        metrics: { operationsCount: 0, successRate: 0, averageResponseTime: 0 }
      },
      {
        name: 'file-upload',
        type: 'upload',
        active: true,
        lastActivity: null,
        metrics: { operationsCount: 0, successRate: 0, averageResponseTime: 0 }
      }
    ];

    points.forEach(point => {
      this.integrationPoints.set(point.name, point);
    });
  }

  /**
   * Setup event handlers for cross-component communication
   */
  private setupEventHandlers(): void {
    // Listen for file persistence store changes
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'file-persistence-storage') {
          this.handleStorageChange(e);
        }
      });
    }
  }

  /**
   * Handle storage changes from other tabs/windows
   */
  private handleStorageChange(event: StorageEvent): void {
    if (event.newValue) {
      try {
        const data = JSON.parse(event.newValue);
        this.emitEvent('storage-sync', {
          type: 'external-change',
          data
        });
      } catch (error) {
        console.warn('Failed to parse storage change event:', error);
      }
    }
  }

  /**
   * Process Excel output from executor
   */
  async processExecutorOutput(
    data: any[][],
    metadata: {
      sessionId: string;
      executorId: string;
      fileName?: string;
      headers?: string[];
      description?: string;
    }
  ): Promise<{ success: boolean; fileId?: string; downloadUrl?: string; error?: string }> {
    const startTime = Date.now();
    const operationId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      this.updateIntegrationPoint('executor-output');
      
      // Generate filename if not provided
      const fileName = metadata.fileName || `executor_output_${Date.now()}.xlsx`;
      
      // Create and store Excel file
      const result = await unifiedPersistenceService.createAndStoreExcel(data, {
        fileName,
        headers: metadata.headers,
        sessionId: metadata.sessionId,
        layer: 'persistent', // Executor outputs should be persistent
        description: metadata.description || `Output from executor ${metadata.executorId}`,
        tags: ['executor', 'generated', metadata.executorId]
      });
      
      // Record operation
      this.recordOperation({
        id: operationId,
        type: 'store',
        source: 'executor-output',
        fileId: result.fileId || 'unknown',
        fileName,
        sessionId: metadata.sessionId,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        success: result.success,
        error: result.error,
        metadata: {
          executorId: metadata.executorId,
          rowCount: data.length,
          columnCount: data[0]?.length || 0
        }
      });
      
      // Emit event for other components
      this.emitEvent('executor-output-processed', {
        operationId,
        result,
        metadata
      });
      
      return result;
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
      this.recordOperation({
        id: operationId,
        type: 'store',
        source: 'executor-output',
        fileId: 'failed',
        fileName: metadata.fileName || 'unknown',
        sessionId: metadata.sessionId,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        success: false,
        error: errorMsg
      });
      
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Handle file upload integration
   */
  async processFileUpload(
    file: File,
    options: {
      sessionId: string;
      persistent?: boolean;
      description?: string;
      tags?: string[];
    }
  ): Promise<{ success: boolean; fileId?: string; error?: string }> {
    const startTime = Date.now();
    const operationId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      this.updateIntegrationPoint('file-upload');
      
      const result = await unifiedPersistenceService.storeFile(file, {
        sessionId: options.sessionId,
        layer: options.persistent ? 'persistent' : 'temporary',
        description: options.description,
        tags: options.tags || ['uploaded']
      });
      
      this.recordOperation({
        id: operationId,
        type: 'store',
        source: 'file-upload',
        fileId: result.fileId || 'unknown',
        fileName: file.name,
        sessionId: options.sessionId,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        success: result.success,
        error: result.error,
        metadata: {
          fileSize: file.size,
          fileType: file.type,
          persistent: options.persistent
        }
      });
      
      this.emitEvent('file-uploaded', {
        operationId,
        result,
        file: {
          name: file.name,
          size: file.size,
          type: file.type
        }
      });
      
      return result;
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Upload failed';
      
      this.recordOperation({
        id: operationId,
        type: 'store',
        source: 'file-upload',
        fileId: 'failed',
        fileName: file.name,
        sessionId: options.sessionId,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        success: false,
        error: errorMsg
      });
      
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Handle chat session file references
   */
  async linkFileToChat(
    fileId: string,
    chatSessionId: string,
    messageId: string,
    context: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      this.updateIntegrationPoint('chat-integration');
      
      const store = useFilePersistenceStore.getState();
      const file = store.getFile(fileId);
      
      if (!file) {
        return { success: false, error: 'File not found' };
      }
      
      // Update file metadata with chat context
      store.updateFileMetadata(fileId, {
        tags: [...(file.tags || []), 'chat-linked'],
        description: `${file.description || ''} (Linked to chat: ${context})`.trim()
      });
      
      this.emitEvent('file-chat-linked', {
        fileId,
        chatSessionId,
        messageId,
        context,
        fileName: file.name
      });
      
      return { success: true };
      
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Link failed' 
      };
    }
  }

  /**
   * Generate download link for file
   */
  async generateDownloadLink(
    fileId: string,
    options: {
      format?: 'xlsx' | 'csv' | 'json';
      expiresIn?: number; // minutes
      version?: number;
    } = {}
  ): Promise<{ success: boolean; downloadUrl?: string; expiresAt?: Date; error?: string }> {
    const startTime = Date.now();
    
    try {
      this.updateIntegrationPoint('download-handler');
      
      const result = await unifiedPersistenceService.retrieveFile(fileId, {
        version: options.version,
        asBuffer: true
      });
      
      if (!result.success || !result.buffer || !result.file) {
        return { success: false, error: result.error || 'File not found' };
      }
      
      // Create blob URL for download
      const blob = new Blob([result.buffer], { type: result.file.type });
      const downloadUrl = URL.createObjectURL(blob);
      
      // Set expiration (default 1 hour)
      const expiresIn = options.expiresIn || 60;
      const expiresAt = new Date(Date.now() + (expiresIn * 60 * 1000));
      
      // Auto-revoke URL after expiration
      setTimeout(() => {
        URL.revokeObjectURL(downloadUrl);
      }, expiresIn * 60 * 1000);
      
      this.emitEvent('download-link-generated', {
        fileId,
        fileName: result.file.name,
        downloadUrl,
        expiresAt,
        format: options.format
      });
      
      return {
        success: true,
        downloadUrl,
        expiresAt
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Download link generation failed'
      };
    }
  }

  /**
   * Route MCP tool calls to appropriate handlers
   */
  async routeMCPToolCall(
    toolCall: { name: string; arguments: any },
    sessionId: string
  ): Promise<any> {
    const startTime = Date.now();
    let integrationPoint: string;
    let result: any;
    
    try {
      // Determine which tool should handle this call
      if (toolCall.name.startsWith('excel_')) {
        integrationPoint = 'excel-mcp-tool';
        this.updateIntegrationPoint(integrationPoint);
        result = await enhancedExcelMCPTool.handleToolCall(toolCall);
      } else if (toolCall.name.startsWith('persistence_')) {
        integrationPoint = 'persistence-mcp-tool';
        this.updateIntegrationPoint(integrationPoint);
        result = await persistenceMCPTool.handleToolCall(toolCall);
      } else if (toolCall.name.startsWith('filesystem_') || 
                 ['read_text_file', 'write_file', 'list_directory'].includes(toolCall.name)) {
        integrationPoint = 'filesystem-mcp-tool';
        this.updateIntegrationPoint(integrationPoint);
        result = await filesystemMCPTool.handleToolCall(toolCall);
      } else {
        throw new Error(`Unknown MCP tool: ${toolCall.name}`);
      }
      
      // Update metrics
      this.updateIntegrationPointMetrics(integrationPoint, {
        success: result.success !== false,
        responseTime: Date.now() - startTime
      });
      
      return result;
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'MCP tool call failed';
      
      if (integrationPoint!) {
        this.updateIntegrationPointMetrics(integrationPoint, {
          success: false,
          responseTime: Date.now() - startTime
        });
      }
      
      return {
        success: false,
        error: errorMsg
      };
    }
  }

  /**
   * Get integration status and metrics
   */
  getIntegrationStatus() {
    const points = Array.from(this.integrationPoints.values());
    const recentOperations = this.operations.slice(-100);
    
    return {
      integrationPoints: points,
      recentOperations,
      totalOperations: this.operations.length,
      successRate: this.operations.length > 0 
        ? this.operations.filter(op => op.success).length / this.operations.length 
        : 0,
      averageResponseTime: this.operations.length > 0
        ? this.operations.reduce((sum, op) => sum + op.duration, 0) / this.operations.length
        : 0,
      storageMetrics: unifiedPersistenceService.getStorageMetrics()
    };
  }

  /**
   * Update integration point activity
   */
  private updateIntegrationPoint(name: string): void {
    const point = this.integrationPoints.get(name);
    if (point) {
      point.lastActivity = new Date();
      point.metrics.operationsCount++;
    }
  }

  /**
   * Update integration point metrics
   */
  private updateIntegrationPointMetrics(
    name: string, 
    data: { success: boolean; responseTime: number }
  ): void {
    const point = this.integrationPoints.get(name);
    if (point) {
      const { metrics } = point;
      const successCount = metrics.operationsCount * metrics.successRate;
      
      metrics.successRate = data.success 
        ? (successCount + 1) / metrics.operationsCount
        : successCount / metrics.operationsCount;
        
      metrics.averageResponseTime = (
        (metrics.averageResponseTime * (metrics.operationsCount - 1)) + data.responseTime
      ) / metrics.operationsCount;
    }
  }

  /**
   * Record operation for audit trail
   */
  private recordOperation(operation: StorageOperation): void {
    this.operations.push(operation);
    
    // Keep only last 1000 operations
    if (this.operations.length > 1000) {
      this.operations.splice(0, this.operations.length - 1000);
    }
  }

  /**
   * Emit event to listeners
   */
  private emitEvent(eventName: string, data: any): void {
    const listeners = this.eventListeners.get(eventName);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.warn(`Error in event listener for ${eventName}:`, error);
        }
      });
    }
  }

  /**
   * Add event listener
   */
  addEventListener(eventName: string, listener: (data: any) => void): void {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, new Set());
    }
    this.eventListeners.get(eventName)!.add(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(eventName: string, listener: (data: any) => void): void {
    const listeners = this.eventListeners.get(eventName);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<StorageIntegrationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update unified persistence service strategy
    unifiedPersistenceService.updateStrategy({
      versioningEnabled: this.config.versioningEnabled,
      maxVersionsPerFile: this.config.maxVersionsPerFile,
      compressionEnabled: this.config.compressionEnabled,
      cloudSyncEnabled: this.config.cloudSyncEnabled
    });
    
    console.log('🔧 Updated storage integration config:', this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): StorageIntegrationConfig {
    return { ...this.config };
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    // Clear event listeners
    this.eventListeners.clear();
    
    // Dispose unified persistence service
    unifiedPersistenceService.dispose();
    
    console.log('🧹 Storage Integration Service disposed');
  }
}

// Export singleton instance
export const storageIntegrationService = new StorageIntegrationService();
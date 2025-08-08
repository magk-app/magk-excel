/**
 * Unified Persistence Service - Comprehensive file persistence strategy
 * 
 * This service provides a unified interface for managing Excel files throughout
 * their entire lifecycle from temporary uploads to persistent storage and versioning.
 * 
 * Features:
 * - Multi-layer storage (temporary, session, persistent, cloud-ready)
 * - File versioning and history
 * - Automatic cleanup and lifecycle management
 * - Integration with Excel MCP tools and executor outputs
 * - Storage usage monitoring and optimization
 * - Cloud storage preparation for future features
 */

import { useFilePersistenceStore, type PersistedFile } from '../../stores/filePersistenceStore';
import { excelService, type ExcelOperationResult } from '../excel/ExcelService';
import { PersistenceAccessTool } from './PersistenceMCPTool';
import { FilesystemMCPTool } from './FilesystemMCPTool';

export interface FileVersion {
  id: string;
  fileId: string;
  version: number;
  content: string; // Base64 encoded
  createdAt: Date;
  createdBy: string; // session ID or user ID
  changes: string; // Description of changes
  size: number;
  checksum: string;
}

export interface StorageLayer {
  name: 'temporary' | 'session' | 'persistent' | 'cloud';
  description: string;
  maxFiles: number;
  maxSize: number; // bytes
  retentionPolicy: {
    duration: number; // milliseconds
    autoCleanup: boolean;
  };
}

export interface FileMetrics {
  totalFiles: number;
  totalSize: number;
  byLayer: Record<string, { count: number; size: number }>;
  byType: Record<string, { count: number; size: number }>;
  oldestFile: Date | null;
  newestFile: Date | null;
  versionsCount: number;
}

export interface PersistenceStrategy {
  autoBackup: boolean;
  versioningEnabled: boolean;
  maxVersionsPerFile: number;
  compressionEnabled: boolean;
  cloudSyncEnabled: boolean;
  retentionPolicies: StorageLayer[];
}

export interface FileOperation {
  type: 'create' | 'read' | 'update' | 'delete' | 'version' | 'cleanup';
  fileId: string;
  timestamp: Date;
  sessionId: string;
  details: string;
  success: boolean;
  error?: string;
}

export class UnifiedPersistenceService {
  private strategy: PersistenceStrategy;
  private versions: Map<string, FileVersion[]>;
  private operations: FileOperation[];
  private cleanupIntervals: Map<string, NodeJS.Timeout>;
  private compressionWorker?: Worker;
  
  constructor() {
    this.strategy = this.getDefaultStrategy();
    this.versions = new Map();
    this.operations = [];
    this.cleanupIntervals = new Map();
    
    // Initialize cleanup intervals
    this.initializeCleanupSchedules();
  }

  /**
   * Get default persistence strategy
   */
  private getDefaultStrategy(): PersistenceStrategy {
    return {
      autoBackup: true,
      versioningEnabled: true,
      maxVersionsPerFile: 10,
      compressionEnabled: true,
      cloudSyncEnabled: false, // Future feature
      retentionPolicies: [
        {
          name: 'temporary',
          description: 'Files uploaded but not saved',
          maxFiles: 10,
          maxSize: 10 * 1024 * 1024, // 10MB
          retentionPolicy: {
            duration: 2 * 60 * 60 * 1000, // 2 hours
            autoCleanup: true
          }
        },
        {
          name: 'session',
          description: 'Files active in current session',
          maxFiles: 50,
          maxSize: 50 * 1024 * 1024, // 50MB
          retentionPolicy: {
            duration: 24 * 60 * 60 * 1000, // 24 hours
            autoCleanup: true
          }
        },
        {
          name: 'persistent',
          description: 'User-saved files',
          maxFiles: 200,
          maxSize: 500 * 1024 * 1024, // 500MB
          retentionPolicy: {
            duration: 30 * 24 * 60 * 60 * 1000, // 30 days
            autoCleanup: false
          }
        },
        {
          name: 'cloud',
          description: 'Cloud-synced files (future)',
          maxFiles: 1000,
          maxSize: 2 * 1024 * 1024 * 1024, // 2GB
          retentionPolicy: {
            duration: 365 * 24 * 60 * 60 * 1000, // 1 year
            autoCleanup: false
          }
        }
      ]
    };
  }

  /**
   * Initialize cleanup schedules for each storage layer
   */
  private initializeCleanupSchedules(): void {
    this.strategy.retentionPolicies.forEach(policy => {
      if (policy.retentionPolicy.autoCleanup) {
        // Run cleanup every hour for this layer
        const interval = setInterval(() => {
          this.cleanupStorageLayer(policy.name);
        }, 60 * 60 * 1000); // 1 hour
        
        this.cleanupIntervals.set(policy.name, interval);
      }
    });
  }

  /**
   * Store file with comprehensive persistence strategy
   */
  async storeFile(
    file: File, 
    options: {
      layer?: StorageLayer['name'];
      sessionId: string;
      description?: string;
      tags?: string[];
      generateVersion?: boolean;
      compress?: boolean;
    }
  ): Promise<{ success: boolean; fileId?: string; error?: string; version?: number }> {
    try {
      const store = useFilePersistenceStore.getState();
      const layer = options.layer || 'temporary';
      const isPersistent = layer === 'persistent' || layer === 'cloud';
      
      // Check storage limits
      const canStore = await this.checkStorageCapacity(file.size, layer);
      if (!canStore.allowed) {
        return { success: false, error: canStore.reason };
      }
      
      // Generate file checksum for versioning
      const checksum = await this.generateChecksum(file);
      
      // Check if file already exists (by checksum)
      const existingFile = await this.findFileByChecksum(checksum);
      if (existingFile && !options.generateVersion) {
        return { 
          success: true, 
          fileId: existingFile.id,
          error: 'File already exists (duplicate detected)'
        };
      }
      
      // Store file using existing persistence store
      const fileId = await store.addFile(file, isPersistent, options.sessionId);
      
      // Update metadata
      if (options.description || options.tags) {
        store.updateFileMetadata(fileId, {
          description: options.description,
          tags: options.tags
        });
      }
      
      // Create version if requested or if file exists
      let version = 1;
      if (this.strategy.versioningEnabled && (options.generateVersion || existingFile)) {
        version = await this.createFileVersion(fileId, checksum, options.sessionId, 
          options.description || 'File upload');
      }
      
      // Log operation
      this.logOperation({
        type: 'create',
        fileId,
        timestamp: new Date(),
        sessionId: options.sessionId,
        details: `Stored ${file.name} in ${layer} layer`,
        success: true
      });
      
      // Trigger background optimization
      this.optimizeStorage(layer);
      
      return { success: true, fileId, version };
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ UnifiedPersistenceService: Store file error:', error);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Retrieve file with version support
   */
  async retrieveFile(
    fileId: string, 
    options?: {
      version?: number;
      includeHistory?: boolean;
      asBuffer?: boolean;
    }
  ): Promise<{ success: boolean; file?: PersistedFile; versions?: FileVersion[]; buffer?: Buffer; error?: string }> {
    try {
      const store = useFilePersistenceStore.getState();
      const file = store.getFile(fileId);
      
      if (!file) {
        return { success: false, error: 'File not found' };
      }
      
      let targetFile = file;
      
      // Get specific version if requested
      if (options?.version && this.versions.has(fileId)) {
        const fileVersions = this.versions.get(fileId)!;
        const version = fileVersions.find(v => v.version === options.version);
        if (version) {
          targetFile = {
            ...file,
            content: version.content,
            size: version.size
          };
        }
      }
      
      // Convert to buffer if requested
      let buffer: Buffer | undefined;
      if (options?.asBuffer) {
        buffer = Buffer.from(targetFile.content, 'base64');
      }
      
      // Include version history if requested
      let versions: FileVersion[] | undefined;
      if (options?.includeHistory) {
        versions = this.versions.get(fileId) || [];
      }
      
      // Log operation
      this.logOperation({
        type: 'read',
        fileId,
        timestamp: new Date(),
        sessionId: file.sessionId,
        details: `Retrieved file ${file.name}${options?.version ? ` (version ${options.version})` : ''}`,
        success: true
      });
      
      return { success: true, file: targetFile, versions, buffer };
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ UnifiedPersistenceService: Retrieve file error:', error);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Create Excel file and store in persistence system
   */
  async createAndStoreExcel(
    data: any[][],
    options: {
      fileName: string;
      headers?: string[];
      sheetName?: string;
      sessionId: string;
      layer?: StorageLayer['name'];
      description?: string;
      tags?: string[];
    }
  ): Promise<{ success: boolean; fileId?: string; downloadUrl?: string; error?: string }> {
    try {
      // Create Excel buffer
      const excelResult = await excelService.createExcelBuffer({
        data,
        headers: options.headers,
        sheetName: options.sheetName
      });
      
      if (!excelResult.success || !excelResult.fileContent) {
        return { success: false, error: excelResult.error };
      }
      
      // Convert buffer to File object for storage
      const blob = new Blob([excelResult.fileContent], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      const file = new File([blob], options.fileName, {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      // Store in persistence system
      const storeResult = await this.storeFile(file, {
        layer: options.layer || 'persistent',
        sessionId: options.sessionId,
        description: options.description || `Excel file generated from ${data.length} rows`,
        tags: options.tags || ['excel', 'generated']
      });
      
      if (!storeResult.success) {
        return { success: false, error: storeResult.error };
      }
      
      // Create download URL via filesystem API
      let downloadUrl: string | undefined;
      if (window.fileAPI) {
        const dataUrl = `data:${file.type};base64,${btoa(String.fromCharCode(...new Uint8Array(await blob.arrayBuffer())))}`;
        const writeResult = await window.fileAPI.writePersistentFile(options.fileName, dataUrl, 'excel');
        if (writeResult.success) {
          downloadUrl = writeResult.filePath;
        }
      }
      
      return {
        success: true,
        fileId: storeResult.fileId,
        downloadUrl
      };
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ UnifiedPersistenceService: Create Excel error:', error);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Create file version
   */
  private async createFileVersion(
    fileId: string, 
    checksum: string, 
    sessionId: string, 
    changes: string
  ): Promise<number> {
    const store = useFilePersistenceStore.getState();
    const file = store.getFile(fileId);
    
    if (!file) {
      throw new Error('File not found for versioning');
    }
    
    const existingVersions = this.versions.get(fileId) || [];
    const nextVersion = Math.max(0, ...existingVersions.map(v => v.version)) + 1;
    
    const version: FileVersion = {
      id: `${fileId}_v${nextVersion}`,
      fileId,
      version: nextVersion,
      content: file.content,
      createdAt: new Date(),
      createdBy: sessionId,
      changes,
      size: file.size,
      checksum
    };
    
    existingVersions.push(version);
    
    // Keep only max versions
    if (existingVersions.length > this.strategy.maxVersionsPerFile) {
      existingVersions.splice(0, existingVersions.length - this.strategy.maxVersionsPerFile);
    }
    
    this.versions.set(fileId, existingVersions);
    
    return nextVersion;
  }

  /**
   * Generate file checksum for duplicate detection
   */
  private async generateChecksum(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Find file by checksum
   */
  private async findFileByChecksum(checksum: string): Promise<PersistedFile | null> {
    // This is a simplified implementation
    // In a real system, you'd maintain a checksum index
    return null;
  }

  /**
   * Check storage capacity for a layer
   */
  private async checkStorageCapacity(
    fileSize: number, 
    layer: StorageLayer['name']
  ): Promise<{ allowed: boolean; reason?: string }> {
    const policy = this.strategy.retentionPolicies.find(p => p.name === layer);
    if (!policy) {
      return { allowed: false, reason: 'Invalid storage layer' };
    }
    
    const store = useFilePersistenceStore.getState();
    const stats = store.getFileStats();
    
    // Check file count limit
    const currentCount = layer === 'persistent' ? stats.persistent : stats.temporary;
    if (currentCount >= policy.maxFiles) {
      return { allowed: false, reason: `Maximum file limit reached for ${layer} layer (${policy.maxFiles})` };
    }
    
    // Check size limit
    if (fileSize > policy.maxSize) {
      return { allowed: false, reason: `File size exceeds limit for ${layer} layer (${Math.round(policy.maxSize / 1024 / 1024)}MB)` };
    }
    
    return { allowed: true };
  }

  /**
   * Clean up files in a storage layer based on retention policy
   */
  private async cleanupStorageLayer(layer: StorageLayer['name']): Promise<void> {
    try {
      const policy = this.strategy.retentionPolicies.find(p => p.name === layer);
      if (!policy || !policy.retentionPolicy.autoCleanup) {
        return;
      }
      
      const store = useFilePersistenceStore.getState();
      const cutoffTime = new Date(Date.now() - policy.retentionPolicy.duration);
      
      let cleanedCount = 0;
      
      if (layer === 'temporary') {
        // Clean temporary files older than retention period
        const tempFiles = Array.from(store.temporaryFiles.values());
        tempFiles.forEach(file => {
          if (new Date(file.uploadedAt) < cutoffTime) {
            store.removeFile(file.id);
            cleanedCount++;
          }
        });
      }
      
      if (cleanedCount > 0) {
        console.log(`🧹 Cleaned up ${cleanedCount} files from ${layer} layer`);
        this.logOperation({
          type: 'cleanup',
          fileId: 'bulk',
          timestamp: new Date(),
          sessionId: 'system',
          details: `Cleaned ${cleanedCount} files from ${layer} layer`,
          success: true
        });
      }
      
    } catch (error) {
      console.error(`❌ Error cleaning up ${layer} layer:`, error);
    }
  }

  /**
   * Optimize storage by compressing old files, removing duplicates
   */
  private async optimizeStorage(layer: StorageLayer['name']): Promise<void> {
    // Background optimization - don't await
    setTimeout(async () => {
      try {
        if (this.strategy.compressionEnabled) {
          await this.compressOldFiles(layer);
        }
        await this.removeDuplicates(layer);
      } catch (error) {
        console.warn('⚠️ Storage optimization error:', error);
      }
    }, 5000); // Run after 5 seconds
  }

  /**
   * Compress old files to save space
   */
  private async compressOldFiles(layer: StorageLayer['name']): Promise<void> {
    // Placeholder for compression logic
    // Would use CompressionStream API or similar
    console.log(`📦 Compression optimization for ${layer} layer (placeholder)`);
  }

  /**
   * Remove duplicate files
   */
  private async removeDuplicates(layer: StorageLayer['name']): Promise<void> {
    // Placeholder for duplicate removal logic
    console.log(`🔍 Duplicate removal for ${layer} layer (placeholder)`);
  }

  /**
   * Get comprehensive storage metrics
   */
  getStorageMetrics(): FileMetrics {
    const store = useFilePersistenceStore.getState();
    const stats = store.getFileStats();
    
    // Get all files for detailed analysis
    const allTempFiles = Array.from(store.temporaryFiles.values());
    const allPersistentFiles = Array.from(store.persistentFiles.values());
    const allFiles = [...allTempFiles, ...allPersistentFiles];
    
    // Calculate metrics by type
    const byType: Record<string, { count: number; size: number }> = {};
    allFiles.forEach(file => {
      const type = file.type || 'unknown';
      if (!byType[type]) {
        byType[type] = { count: 0, size: 0 };
      }
      byType[type].count++;
      byType[type].size += file.size;
    });
    
    // Find oldest and newest files
    const dates = allFiles.map(f => new Date(f.uploadedAt));
    const oldestFile = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : null;
    const newestFile = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : null;
    
    // Count total versions
    const versionsCount = Array.from(this.versions.values())
      .reduce((total, versions) => total + versions.length, 0);
    
    return {
      totalFiles: stats.temporary + stats.persistent,
      totalSize: stats.totalSize,
      byLayer: {
        temporary: { count: stats.temporary, size: allTempFiles.reduce((sum, f) => sum + f.size, 0) },
        persistent: { count: stats.persistent, size: allPersistentFiles.reduce((sum, f) => sum + f.size, 0) }
      },
      byType,
      oldestFile,
      newestFile,
      versionsCount
    };
  }

  /**
   * Get file operation history
   */
  getOperationHistory(limit: number = 50): FileOperation[] {
    return this.operations.slice(-limit).reverse();
  }

  /**
   * Log file operation
   */
  private logOperation(operation: FileOperation): void {
    this.operations.push(operation);
    
    // Keep only last 1000 operations
    if (this.operations.length > 1000) {
      this.operations.splice(0, this.operations.length - 1000);
    }
  }

  /**
   * Update persistence strategy
   */
  updateStrategy(newStrategy: Partial<PersistenceStrategy>): void {
    this.strategy = { ...this.strategy, ...newStrategy };
    console.log('🔧 Updated persistence strategy:', this.strategy);
  }

  /**
   * Export storage data for backup
   */
  async exportStorageData(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const store = useFilePersistenceStore.getState();
      const exportData = {
        timestamp: new Date().toISOString(),
        temporaryFiles: Array.from(store.temporaryFiles.entries()),
        persistentFiles: Array.from(store.persistentFiles.entries()),
        versions: Array.from(this.versions.entries()),
        operations: this.operations,
        strategy: this.strategy,
        metrics: this.getStorageMetrics()
      };
      
      return { success: true, data: exportData };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Export failed' };
    }
  }

  /**
   * Import storage data from backup
   */
  async importStorageData(data: any): Promise<{ success: boolean; error?: string }> {
    try {
      if (data.versions) {
        this.versions = new Map(data.versions);
      }
      if (data.operations) {
        this.operations = data.operations;
      }
      if (data.strategy) {
        this.strategy = { ...this.strategy, ...data.strategy };
      }
      
      console.log('📥 Imported storage data successfully');
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Import failed' };
    }
  }

  /**
   * Cleanup all resources and intervals
   */
  dispose(): void {
    // Clear all cleanup intervals
    this.cleanupIntervals.forEach(interval => clearInterval(interval));
    this.cleanupIntervals.clear();
    
    // Cleanup compression worker if exists
    if (this.compressionWorker) {
      this.compressionWorker.terminate();
    }
    
    console.log('🧹 UnifiedPersistenceService disposed');
  }
}

// Export singleton instance
export const unifiedPersistenceService = new UnifiedPersistenceService();
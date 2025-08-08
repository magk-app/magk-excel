/**
 * Download Service for MAGK Excel
 * Handles downloads in both Electron and browser environments
 */

import { DownloadOptions, DownloadFromContentOptions, DownloadResult } from '../electron';

export interface DownloadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface DownloadHistoryItem {
  id: string;
  fileName: string;
  filePath?: string;
  timestamp: number;
  success: boolean;
  error?: string;
  size?: number;
}

export class DownloadService {
  private downloadHistory: DownloadHistoryItem[] = [];
  private progressCallbacks: Map<string, (progress: DownloadProgress) => void> = new Map();

  /**
   * Detect if running in Electron environment
   */
  private isElectron(): boolean {
    return typeof window !== 'undefined' && 
           typeof window.fileAPI !== 'undefined' &&
           typeof window.electronAPI !== 'undefined';
  }

  /**
   * Generate unique download ID
   */
  private generateDownloadId(): string {
    return `download_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add download to history
   */
  private addToHistory(item: DownloadHistoryItem): void {
    this.downloadHistory.unshift(item);
    // Keep only last 50 downloads
    if (this.downloadHistory.length > 50) {
      this.downloadHistory = this.downloadHistory.slice(0, 50);
    }
    
    // Save to localStorage for persistence
    try {
      localStorage.setItem('magk_download_history', JSON.stringify(this.downloadHistory));
    } catch (error) {
      console.warn('Failed to save download history to localStorage:', error);
    }
  }

  /**
   * Load download history from localStorage
   */
  private loadHistory(): void {
    try {
      const saved = localStorage.getItem('magk_download_history');
      if (saved) {
        this.downloadHistory = JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Failed to load download history from localStorage:', error);
      this.downloadHistory = [];
    }
  }

  /**
   * Download file from file path (Electron only)
   */
  async downloadFile(filePath: string, options?: DownloadOptions): Promise<DownloadResult> {
    const downloadId = this.generateDownloadId();
    
    if (!this.isElectron()) {
      const error = 'File path downloads only available in Electron environment';
      this.addToHistory({
        id: downloadId,
        fileName: filePath,
        timestamp: Date.now(),
        success: false,
        error
      });
      return { success: false, error };
    }

    try {
      const result = await window.fileAPI.downloadFile(filePath, options);
      
      this.addToHistory({
        id: downloadId,
        fileName: result.fileName || filePath,
        filePath: result.savedPath,
        timestamp: Date.now(),
        success: result.success,
        error: result.error
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.addToHistory({
        id: downloadId,
        fileName: filePath,
        timestamp: Date.now(),
        success: false,
        error: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Download file from content (works in both environments)
   */
  async downloadFromContent(options: DownloadFromContentOptions): Promise<DownloadResult> {
    const downloadId = this.generateDownloadId();
    
    try {
      if (this.isElectron()) {
        // Use Electron's download API
        const result = await window.fileAPI.downloadFromContent(options);
        
        this.addToHistory({
          id: downloadId,
          fileName: options.fileName,
          filePath: result.savedPath,
          timestamp: Date.now(),
          success: result.success,
          error: result.error,
          size: this.getContentSize(options.content)
        });
        
        return result;
      } else {
        // Use browser's download API
        return await this.browserDownload(downloadId, options);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.addToHistory({
        id: downloadId,
        fileName: options.fileName,
        timestamp: Date.now(),
        success: false,
        error: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Browser-based download implementation
   */
  private async browserDownload(downloadId: string, options: DownloadFromContentOptions): Promise<DownloadResult> {
    try {
      let blob: Blob;
      
      // Prepare blob from content
      if (Buffer.isBuffer(options.content)) {
        blob = new Blob([options.content], { type: options.mimeType || 'application/octet-stream' });
      } else if (typeof options.content === 'string') {
        if (options.content.startsWith('data:')) {
          // Handle data URL
          const response = await fetch(options.content);
          blob = await response.blob();
        } else if (options.encoding === 'base64') {
          // Handle base64 content
          const binaryString = atob(options.content);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          blob = new Blob([bytes], { type: options.mimeType || 'application/octet-stream' });
        } else {
          // Handle text content
          blob = new Blob([options.content], { type: options.mimeType || 'text/plain' });
        }
      } else {
        throw new Error('Unsupported content type');
      }

      // Create download URL
      const url = URL.createObjectURL(blob);
      
      // Create temporary download link
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = options.fileName;
      downloadLink.style.display = 'none';
      
      // Add to DOM, click, and remove
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      // Clean up URL after a short delay
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);

      const result = {
        success: true,
        fileName: options.fileName,
        savedPath: `Browser Downloads/${options.fileName}`
      };

      this.addToHistory({
        id: downloadId,
        fileName: options.fileName,
        filePath: result.savedPath,
        timestamp: Date.now(),
        success: true,
        size: blob.size
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Browser download failed';
      this.addToHistory({
        id: downloadId,
        fileName: options.fileName,
        timestamp: Date.now(),
        success: false,
        error: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get content size
   */
  private getContentSize(content: string | Buffer): number {
    if (Buffer.isBuffer(content)) {
      return content.length;
    } else if (typeof content === 'string') {
      if (content.startsWith('data:')) {
        const base64Data = content.split(',')[1];
        return Math.ceil(base64Data.length * 0.75); // Approximate decoded size
      }
      return new TextEncoder().encode(content).length;
    }
    return 0;
  }

  /**
   * Open file (Electron only)
   */
  async openFile(filePath: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isElectron()) {
      return { success: false, error: 'File opening only available in Electron environment' };
    }

    try {
      return await window.fileAPI.openFile(filePath);
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Show file in folder (Electron only)
   */
  async showInFolder(filePath: string): Promise<{ success: boolean; error?: string }> {
    if (!this.isElectron()) {
      return { success: false, error: 'Show in folder only available in Electron environment' };
    }

    try {
      return await window.fileAPI.showInFolder(filePath);
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get download history
   */
  getDownloadHistory(): DownloadHistoryItem[] {
    if (this.downloadHistory.length === 0) {
      this.loadHistory();
    }
    return [...this.downloadHistory];
  }

  /**
   * Clear download history
   */
  clearDownloadHistory(): void {
    this.downloadHistory = [];
    try {
      localStorage.removeItem('magk_download_history');
    } catch (error) {
      console.warn('Failed to clear download history from localStorage:', error);
    }
  }

  /**
   * Get environment info
   */
  getEnvironmentInfo(): {
    isElectron: boolean;
    supportsFilePathDownloads: boolean;
    supportsContentDownloads: boolean;
    supportsFileOperations: boolean;
  } {
    const isElectron = this.isElectron();
    return {
      isElectron,
      supportsFilePathDownloads: isElectron,
      supportsContentDownloads: true, // Both environments support this
      supportsFileOperations: isElectron
    };
  }

  /**
   * Register progress callback
   */
  onProgress(downloadId: string, callback: (progress: DownloadProgress) => void): void {
    this.progressCallbacks.set(downloadId, callback);
  }

  /**
   * Remove progress callback
   */
  offProgress(downloadId: string): void {
    this.progressCallbacks.delete(downloadId);
  }

  /**
   * Initialize service
   */
  initialize(): void {
    this.loadHistory();
    console.log('📥 Download Service initialized:', this.getEnvironmentInfo());
  }
}

// Export singleton instance
export const downloadService = new DownloadService();

// Auto-initialize
downloadService.initialize();
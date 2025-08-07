/**
 * File Access Service
 * Provides methods to access and work with persistent and temporary files in chat context
 */

import { useFilePersistenceStore } from '../stores/filePersistenceStore';

export interface FileAccessResult {
  success: boolean;
  files?: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    isPersistent: boolean;
    uploadedAt: Date;
    content?: string; // Base64 content
  }>;
  error?: string;
}

export interface FileContent {
  id: string;
  name: string;
  type: string;
  content: string; // Base64
  text?: string; // Decoded text for text files
}

class FileAccessService {
  constructor() {
    // Initialize service
  }

  /**
   * Get all files accessible in the current chat context
   */
  async getAccessibleFiles(sessionId: string): Promise<FileAccessResult> {
    try {
      const store = useFilePersistenceStore.getState();
      const sessionFiles = store.getSessionFiles(sessionId);
      
      return {
        success: true,
        files: sessionFiles.map(file => ({
          id: file.id,
          name: file.name,
          type: file.type,
          size: file.size,
          isPersistent: file.isPersistent,
          uploadedAt: file.uploadedAt,
          content: file.content
        }))
      };
    } catch (error) {
      console.error('Error getting accessible files:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get files'
      };
    }
  }

  /**
   * Get content of a specific file
   */
  async getFileContent(fileId: string): Promise<FileContent | null> {
    try {
      const store = useFilePersistenceStore.getState();
      const file = store.getFile(fileId);
      
      if (!file) {
        console.error('File not found:', fileId);
        return null;
      }

      // For text files, decode the content
      let text: string | undefined;
      if (file.type.startsWith('text/') || file.type === 'application/json') {
        try {
          const decoded = atob(file.content);
          text = decoded;
        } catch (e) {
          console.error('Failed to decode text content:', e);
        }
      }

      return {
        id: file.id,
        name: file.name,
        type: file.type,
        content: file.content,
        text
      };
    } catch (error) {
      console.error('Error getting file content:', error);
      return null;
    }
  }

  /**
   * Save a file to temporary storage for processing
   * Uses Electron IPC to handle file operations
   */
  async saveToTempStorage(fileId: string): Promise<string | null> {
    try {
      const store = useFilePersistenceStore.getState();
      const file = store.getFile(fileId);
      
      if (!file) {
        console.error('File not found:', fileId);
        return null;
      }

      // In Electron environment, we'll use IPC to handle file operations
      if (window.electronAPI?.saveTempFile) {
        const tempFilePath = await window.electronAPI.saveTempFile({
          fileId,
          fileName: file.name,
          content: file.content
        });
        console.log(`📁 File saved to temp storage: ${tempFilePath}`);
        return tempFilePath;
      }
      
      // For browser environment, we can't save to filesystem
      // Return a data URL instead
      const dataUrl = `data:${file.type};base64,${file.content}`;
      console.log(`📁 File available as data URL for: ${file.name}`);
      return dataUrl;
    } catch (error) {
      console.error('Error saving to temp storage:', error);
      return null;
    }
  }

  /**
   * Get file statistics for the current session
   */
  getFileStats(sessionId: string): {
    temporaryCount: number;
    persistentCount: number;
    totalSize: number;
    persistentSize: number;
  } {
    const store = useFilePersistenceStore.getState();
    const sessionFiles = store.getSessionFiles(sessionId);
    
    const temporary = sessionFiles.filter(f => !f.isPersistent);
    const persistent = sessionFiles.filter(f => f.isPersistent);
    
    return {
      temporaryCount: temporary.length,
      persistentCount: persistent.length,
      totalSize: sessionFiles.reduce((sum, f) => sum + f.size, 0),
      persistentSize: persistent.reduce((sum, f) => sum + f.size, 0)
    };
  }

  /**
   * Clean up old temporary files (delegated to Electron main process)
   */
  async cleanupTempFiles(olderThanHours: number = 24): Promise<void> {
    try {
      if (window.electronAPI?.cleanupTempFiles) {
        await window.electronAPI.cleanupTempFiles(olderThanHours);
        console.log('🗑️ Temp files cleanup requested');
      }
    } catch (error) {
      console.error('Error cleaning up temp files:', error);
    }
  }

  /**
   * Format file list for chat context
   */
  formatFileListForChat(sessionId: string): string {
    const store = useFilePersistenceStore.getState();
    const sessionFiles = store.getSessionFiles(sessionId);
    
    if (sessionFiles.length === 0) {
      return 'No files available in current context.';
    }
    
    const persistent = sessionFiles.filter(f => f.isPersistent);
    const temporary = sessionFiles.filter(f => !f.isPersistent);
    
    let message = '📁 **Available Files:**\n\n';
    
    if (persistent.length > 0) {
      message += '**Persistent Files (available across all sessions):**\n';
      persistent.forEach(file => {
        message += `• ${file.name} (${this.formatFileSize(file.size)}, ${file.type})\n`;
      });
      message += '\n';
    }
    
    if (temporary.length > 0) {
      message += '**Temporary Files (current session only):**\n';
      temporary.forEach(file => {
        message += `• ${file.name} (${this.formatFileSize(file.size)}, ${file.type})\n`;
      });
    }
    
    return message;
  }

  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }
}

// Export singleton instance
export const fileAccessService = new FileAccessService();

// Export hook for React components
export function useFileAccess() {
  const store = useFilePersistenceStore();
  
  return {
    getAccessibleFiles: (sessionId: string) => fileAccessService.getAccessibleFiles(sessionId),
    getFileContent: (fileId: string) => fileAccessService.getFileContent(fileId),
    saveToTempStorage: (fileId: string) => fileAccessService.saveToTempStorage(fileId),
    getFileStats: (sessionId: string) => fileAccessService.getFileStats(sessionId),
    formatFileListForChat: (sessionId: string) => fileAccessService.formatFileListForChat(sessionId),
    store
  };
}
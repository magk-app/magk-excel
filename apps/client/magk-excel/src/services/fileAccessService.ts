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

export interface TestFileAccessResult {
  success: boolean;
  files?: string[];
  testContent?: Map<string, string>;
  error?: string;
}

export interface FileWatchOptions {
  directory: string;
  extensions?: string[];
  recursive?: boolean;
  debounceMs?: number;
}

export interface FileContent {
  id: string;
  name: string;
  type: string;
  content: string; // Base64
  text?: string; // Decoded text for text files
}

class FileAccessService {
  private fileWatchers: Map<string, any> = new Map();
  private watchCallbacks: Map<string, Array<(files: string[]) => void>> = new Map();
  
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
   * Add a file to the persistence store
   */
  async addFile(file: File, isPersistent: boolean, sessionId: string): Promise<string | null> {
    try {
      const store = useFilePersistenceStore.getState();
      const fileId = await store.addFile(file, isPersistent, sessionId);
      console.log(`📁 File added to ${isPersistent ? 'persistent' : 'temporary'} storage: ${file.name}`);
      return fileId;
    } catch (error) {
      console.error('Error adding file:', error);
      return null;
    }
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
   * Discover test files in the testing directory
   * Integrated with Electron file system APIs for test discovery
   */
  async discoverTestFiles(forceRefresh: boolean = false): Promise<TestFileAccessResult> {
    try {
      console.log('🔍 Discovering test files via file access service...');
      
      // Use enhanced Electron API for directory reading
      if (window.electronAPI?.readDirectory) {
        const result = await window.electronAPI.readDirectory('testing');
        if (result.success && result.files) {
          // Filter for test files
          const testFiles = result.files.filter(file => 
            /\.(html|js|md|xlsx)$/i.test(file) && 
            (file.includes('test') || file.startsWith('test-'))
          );
          
          // Optionally load content for small files
          const testContent = new Map<string, string>();
          if (forceRefresh) {
            for (const filename of testFiles.slice(0, 10)) { // Limit to first 10 files
              try {
                const contentResult = await window.electronAPI.readFile(`testing/${filename}`);
                if (contentResult.success && contentResult.content) {
                  testContent.set(filename, contentResult.content);
                }
              } catch (error) {
                console.warn(`Could not read content for ${filename}:`, error);
              }
            }
          }
          
          return {
            success: true,
            files: testFiles,
            testContent: testContent.size > 0 ? testContent : undefined
          };
        } else {
          console.warn('Could not read testing directory:', result.error);
        }
      }
      
      // Fallback for browser environment or when Electron API fails
      return {
        success: false,
        error: 'Electron API not available or failed to read directory'
      };
      
    } catch (error) {
      console.error('Error discovering test files:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown discovery error'
      };
    }
  }

  /**
   * Read test file content with enhanced error handling
   */
  async readTestFile(filename: string): Promise<{ success: boolean; content?: string; error?: string }> {
    try {
      if (window.electronAPI?.readFile) {
        const result = await window.electronAPI.readFile(`testing/${filename}`);
        if (result.success && result.content) {
          return { success: true, content: result.content };
        } else {
          return { success: false, error: result.error || 'File not found' };
        }
      }
      
      return { success: false, error: 'Electron API not available' };
    } catch (error) {
      console.error(`Error reading test file ${filename}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Save test artifact with proper file organization
   */
  async saveTestArtifact(testId: string, artifactName: string, content: string, type: string): Promise<string | null> {
    try {
      if (window.electronAPI?.saveTestArtifact) {
        const result = await window.electronAPI.saveTestArtifact({
          testId,
          artifactName,
          content,
          type
        });
        
        if (result.success && result.path) {
          console.log(`📁 Test artifact saved: ${result.path}`);
          return result.path;
        } else {
          console.error('Failed to save test artifact:', result.error);
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error saving test artifact:', error);
      return null;
    }
  }

  /**
   * Watch test directory for file changes
   */
  async watchTestFiles(callback: (files: string[]) => void, options: FileWatchOptions = { directory: 'testing' }): Promise<string | null> {
    try {
      const watchId = `test-watch-${Date.now()}`;
      
      // Store callback for this watcher
      if (!this.watchCallbacks.has(watchId)) {
        this.watchCallbacks.set(watchId, []);
      }
      this.watchCallbacks.get(watchId)?.push(callback);
      
      // Set up periodic polling (since true file watching requires native implementation)
      const pollInterval = setInterval(async () => {
        try {
          const result = await this.discoverTestFiles(true);
          if (result.success && result.files) {
            callback(result.files);
          }
        } catch (error) {
          console.warn('Error during test file polling:', error);
        }
      }, options.debounceMs || 5000);
      
      this.fileWatchers.set(watchId, pollInterval);
      console.log(`👀 Started watching test files: ${watchId}`);
      
      return watchId;
      
    } catch (error) {
      console.error('Error setting up test file watcher:', error);
      return null;
    }
  }

  /**
   * Stop watching test files
   */
  stopWatching(watchId: string): void {
    try {
      const watcher = this.fileWatchers.get(watchId);
      if (watcher) {
        clearInterval(watcher);
        this.fileWatchers.delete(watchId);
        this.watchCallbacks.delete(watchId);
        console.log(`⏹️ Stopped watching test files: ${watchId}`);
      }
    } catch (error) {
      console.error('Error stopping file watcher:', error);
    }
  }

  /**
   * Get test environment information
   */
  async getTestEnvironmentInfo(): Promise<any> {
    try {
      if (window.electronAPI?.getTestEnvironmentInfo) {
        const result = await window.electronAPI.getTestEnvironmentInfo();
        if (result.success) {
          return result.info;
        }
      }
      
      // Fallback environment info
      return {
        platform: navigator.platform,
        userAgent: navigator.userAgent,
        testingSupported: !!window.electronAPI,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting test environment info:', error);
      return null;
    }
  }

  /**
   * List test artifacts for a specific test
   */
  async listTestArtifacts(testId: string): Promise<any[]> {
    try {
      if (window.electronAPI?.listTestArtifacts) {
        const result = await window.electronAPI.listTestArtifacts(testId);
        if (result.success) {
          return result.artifacts || [];
        }
      }
      
      return [];
    } catch (error) {
      console.error('Error listing test artifacts:', error);
      return [];
    }
  }

  /**
   * Cleanup resources and watchers
   */
  cleanup(): void {
    try {
      // Stop all file watchers
      for (const watchId of this.fileWatchers.keys()) {
        this.stopWatching(watchId);
      }
      
      console.log('🧹 File access service cleaned up');
    } catch (error) {
      console.error('Error during cleanup:', error);
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
    
    // Test-specific methods
    discoverTestFiles: (forceRefresh?: boolean) => fileAccessService.discoverTestFiles(forceRefresh),
    readTestFile: (filename: string) => fileAccessService.readTestFile(filename),
    saveTestArtifact: (testId: string, artifactName: string, content: string, type: string) => 
      fileAccessService.saveTestArtifact(testId, artifactName, content, type),
    watchTestFiles: (callback: (files: string[]) => void, options?: FileWatchOptions) => 
      fileAccessService.watchTestFiles(callback, options),
    stopWatching: (watchId: string) => fileAccessService.stopWatching(watchId),
    getTestEnvironmentInfo: () => fileAccessService.getTestEnvironmentInfo(),
    listTestArtifacts: (testId: string) => fileAccessService.listTestArtifacts(testId),
    cleanup: () => fileAccessService.cleanup(),
    
    store
  };
}
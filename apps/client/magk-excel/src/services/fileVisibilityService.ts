/**
 * File Visibility Service
 * Issue #4: Ensure all files (uploaded + persistent) are visible together
 */

import { useFilePersistenceStore } from '../stores/filePersistenceStore';

export interface VisibleFile {
  id: string;
  name: string;
  type: string;
  size: number;
  source: 'upload' | 'persistent' | 'temporary';
  content?: string;
  file?: File;
  uploadedAt: Date;
}

export class FileVisibilityService {
  /**
   * Get all visible files for a session (uploaded + persistent)
   */
  static getAllVisibleFiles(
    sessionId: string,
    uploadedFiles: Array<{ id: string; file: File; name: string; type: string; size: number }> = []
  ): VisibleFile[] {
    const store = useFilePersistenceStore.getState();
    const persistedFiles = store.getSessionFiles(sessionId);
    
    const visibleFiles: VisibleFile[] = [];
    
    // Add uploaded files
    uploadedFiles.forEach(upload => {
      visibleFiles.push({
        id: upload.id,
        name: upload.name,
        type: upload.type,
        size: upload.size,
        source: 'upload',
        file: upload.file,
        uploadedAt: new Date()
      });
    });
    
    // Add persisted files (both temporary and persistent)
    persistedFiles.forEach(persisted => {
      // Check if this file is already in uploaded files
      const isDuplicate = uploadedFiles.some(u => 
        u.name === persisted.name && u.size === persisted.size
      );
      
      if (!isDuplicate) {
        visibleFiles.push({
          id: persisted.id,
          name: persisted.name,
          type: persisted.type,
          size: persisted.size,
          source: persisted.isPersistent ? 'persistent' : 'temporary',
          content: persisted.content,
          uploadedAt: persisted.uploadedAt
        });
      }
    });
    
    // Sort by upload date (newest first)
    return visibleFiles.sort((a, b) => 
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
  }

  /**
   * Format file list for chat context
   */
  static formatFileListForChat(files: VisibleFile[]): string {
    if (files.length === 0) return '';
    
    const fileList = files.map(f => {
      const size = this.formatFileSize(f.size);
      const source = f.source === 'upload' ? '📤' : f.source === 'persistent' ? '📌' : '⏱️';
      return `${source} ${f.name} (${size})`;
    }).join('\n');
    
    return `\nAvailable Files:\n${fileList}\n`;
  }

  /**
   * Check if a file is accessible
   */
  static isFileAccessible(fileId: string, sessionId: string): boolean {
    const store = useFilePersistenceStore.getState();
    const sessionFiles = store.getSessionFiles(sessionId);
    return sessionFiles.some(f => f.id === fileId);
  }

  /**
   * Make files clickable/downloadable
   * Issue #5: Enable file interaction
   */
  static async downloadFile(file: VisibleFile): Promise<void> {
    let blob: Blob;
    
    if (file.file) {
      // Direct file object
      blob = file.file;
    } else if (file.content) {
      // Base64 content
      const base64Data = file.content;
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      blob = new Blob([byteArray], { type: file.type });
    } else {
      throw new Error('No file content available');
    }
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Format file size
   */
  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get file type icon
   */
  static getFileIcon(type: string): string {
    if (type.includes('pdf')) return '📄';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type.includes('image')) return '🖼️';
    if (type.includes('text')) return '📝';
    if (type.includes('csv')) return '📈';
    return '📎';
  }
}

export default FileVisibilityService;
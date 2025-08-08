/**
 * Claude Files API Service
 * Handles file uploads and management using Claude's Files API
 */

export interface ClaudeFileUpload {
  file: File;
  purpose: 'user_message';
}

export interface ClaudeFileResponse {
  id: string;
  object: 'file';
  bytes: number;
  created_at: number;
  filename: string;
  purpose: 'user_message';
  type: 'document' | 'image';
}

export interface FileUploadProgress {
  fileId: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface FileContent {
  type: 'base64' | 'file_id';
  source: {
    type: 'base64';
    media_type: string;
    data: string;
  } | {
    type: 'file';
    file_id: string;
  };
}

class ClaudeFilesService {
  private apiKey: string | null = null;
  private baseUrl = 'https://api.anthropic.com/v1';
  private uploadProgressCallbacks = new Map<string, (progress: FileUploadProgress) => void>();
  
  // Supported file types
  private readonly SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  private readonly SUPPORTED_DOCUMENT_TYPES = ['application/pdf', 'text/plain', 'text/csv', 'text/html', 'text/markdown'];
  private readonly MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  private readonly BASE64_THRESHOLD = 5 * 1024 * 1024; // 5MB - use base64 for smaller files

  constructor() {
    this.loadApiKey();
  }

  private loadApiKey(): void {
    // Try to get API key from various sources
    if (typeof window !== 'undefined') {
      this.apiKey = localStorage.getItem('anthropic-api-key') || 
                    sessionStorage.getItem('anthropic-api-key') || 
                    null;
    }
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    if (typeof window !== 'undefined') {
      localStorage.setItem('anthropic-api-key', apiKey);
    }
  }

  getApiKey(): string | null {
    return this.apiKey;
  }

  /**
   * Validate if file is supported
   */
  isFileSupported(file: File): boolean {
    const isImageSupported = this.SUPPORTED_IMAGE_TYPES.includes(file.type);
    const isDocumentSupported = this.SUPPORTED_DOCUMENT_TYPES.includes(file.type);
    const isSizeValid = file.size <= this.MAX_FILE_SIZE;
    
    return (isImageSupported || isDocumentSupported) && isSizeValid;
  }

  /**
   * Get file validation error message
   */
  getFileValidationError(file: File): string | null {
    if (file.size > this.MAX_FILE_SIZE) {
      return `File size exceeds 100MB limit. Current size: ${Math.round(file.size / (1024 * 1024))}MB`;
    }
    
    if (!this.SUPPORTED_IMAGE_TYPES.includes(file.type) && !this.SUPPORTED_DOCUMENT_TYPES.includes(file.type)) {
      return `Unsupported file type: ${file.type}. Supported types: Images (JPEG, PNG, GIF, WebP), Documents (PDF, TXT, CSV, HTML, Markdown)`;
    }
    
    return null;
  }

  /**
   * Determine if file should use base64 encoding or Files API
   */
  private shouldUseBase64(file: File): boolean {
    return file.size <= this.BASE64_THRESHOLD;
  }

  /**
   * Convert file to base64
   */
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Remove data URL prefix
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = () => reject(new Error('File reading failed'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Upload file using Claude Files API
   */
  async uploadFile(file: File, onProgress?: (progress: FileUploadProgress) => void): Promise<ClaudeFileResponse> {
    if (!this.apiKey) {
      throw new Error('Claude API key not set');
    }

    const validationError = this.getFileValidationError(file);
    if (validationError) {
      throw new Error(validationError);
    }

    const fileId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    if (onProgress) {
      this.uploadProgressCallbacks.set(fileId, onProgress);
      onProgress({ fileId, progress: 0, status: 'uploading' });
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('purpose', 'user_message');

      const response = await fetch(`${this.baseUrl}/files`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'files-api-2025-04-14'
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to upload file: ${response.status} ${error}`);
      }

      const result: ClaudeFileResponse = await response.json();
      
      if (onProgress) {
        onProgress({ fileId, progress: 100, status: 'completed' });
        this.uploadProgressCallbacks.delete(fileId);
      }

      return result;
    } catch (error) {
      if (onProgress) {
        onProgress({ 
          fileId, 
          progress: 0, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        this.uploadProgressCallbacks.delete(fileId);
      }
      throw error;
    }
  }

  /**
   * Process file for Claude API - either upload or convert to base64
   */
  async processFile(file: File, onProgress?: (progress: FileUploadProgress) => void): Promise<FileContent> {
    const validationError = this.getFileValidationError(file);
    if (validationError) {
      throw new Error(validationError);
    }

    // Use base64 for smaller files, Files API for larger ones
    if (this.shouldUseBase64(file)) {
      const base64Data = await this.fileToBase64(file);
      return {
        type: 'base64',
        source: {
          type: 'base64',
          media_type: file.type,
          data: base64Data
        }
      };
    } else {
      const uploadResult = await this.uploadFile(file, onProgress);
      return {
        type: 'file_id',
        source: {
          type: 'file',
          file_id: uploadResult.id
        }
      };
    }
  }

  /**
   * Process multiple files concurrently
   */
  async processFiles(
    files: File[], 
    onProgress?: (fileId: string, progress: FileUploadProgress) => void
  ): Promise<FileContent[]> {
    const processPromises = files.map(async (file, index) => {
      const fileId = `file_${index}_${Date.now()}`;
      const progressCallback = onProgress ? (progress: FileUploadProgress) => {
        onProgress(fileId, { ...progress, fileId });
      } : undefined;
      
      return this.processFile(file, progressCallback);
    });

    return Promise.all(processPromises);
  }

  /**
   * List uploaded files
   */
  async listFiles(): Promise<{ data: ClaudeFileResponse[] }> {
    if (!this.apiKey) {
      throw new Error('Claude API key not set');
    }

    const response = await fetch(`${this.baseUrl}/files`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'files-api-2025-04-14'
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to list files: ${response.status} ${error}`);
    }

    return response.json();
  }

  /**
   * Delete uploaded file
   */
  async deleteFile(fileId: string): Promise<void> {
    if (!this.apiKey) {
      throw new Error('Claude API key not set');
    }

    const response = await fetch(`${this.baseUrl}/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'files-api-2025-04-14'
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to delete file: ${response.status} ${error}`);
    }
  }

  /**
   * Get file content info
   */
  async getFileInfo(fileId: string): Promise<ClaudeFileResponse> {
    if (!this.apiKey) {
      throw new Error('Claude API key not set');
    }

    const response = await fetch(`${this.baseUrl}/files/${fileId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'files-api-2025-04-14'
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get file info: ${response.status} ${error}`);
    }

    return response.json();
  }
}

export const claudeFilesService = new ClaudeFilesService();
export default claudeFilesService;
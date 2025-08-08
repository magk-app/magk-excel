/**
 * PDF Extraction Service
 * Issue #7 & #8: Comprehensive PDF handling with multiple extraction methods
 */

import { PDFMCPTool } from './PDFMCPTool';

export interface PDFExtractionMethod {
  name: string;
  type: 'mcp' | 'api' | 'smithery';
  priority: number;
  isAvailable: () => Promise<boolean>;
  extract: (file: File | string, options?: any) => Promise<ExtractionResult>;
}

export interface ExtractionResult {
  success: boolean;
  data?: any;
  error?: string;
  method: string;
  performance?: {
    duration: number;
    accuracy?: number;
  };
}

export class PDFExtractionService {
  private static methods: PDFExtractionMethod[] = [];
  
  static {
    // Initialize available extraction methods
    this.registerMethod({
      name: 'Local MCP PDF Tool',
      type: 'mcp',
      priority: 1,
      isAvailable: async () => {
        // Check if local MCP PDF tool is available
        return typeof window.mcpTools?.pdf !== 'undefined';
      },
      extract: async (file, options) => {
        const start = Date.now();
        try {
          const pdfTool = new PDFMCPTool();
          const result = await pdfTool.extractFromFile(file as File, options);
          return {
            success: true,
            data: result,
            method: 'Local MCP PDF Tool',
            performance: {
              duration: Date.now() - start
            }
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            method: 'Local MCP PDF Tool'
          };
        }
      }
    });
    
    this.registerMethod({
      name: 'Smithery PDF Server',
      type: 'smithery',
      priority: 2,
      isAvailable: async () => {
        // Check if Smithery PDF server is available
        try {
          const response = await fetch('https://b1fcb47dfd4d.ngrok-free.app/api/smithery/status', {
            signal: AbortSignal.timeout(2000)
          });
          return response.ok;
        } catch {
          return false;
        }
      },
      extract: async (file, options) => {
        const start = Date.now();
        try {
          const formData = new FormData();
          if (file instanceof File) {
            formData.append('file', file);
          } else {
            formData.append('url', file);
          }
          if (options) {
            formData.append('options', JSON.stringify(options));
          }
          
          const response = await fetch('https://b1fcb47dfd4d.ngrok-free.app/api/smithery/pdf/extract', {
            method: 'POST',
            body: formData
          });
          
          if (!response.ok) {
            throw new Error(`Smithery extraction failed: ${response.statusText}`);
          }
          
          const result = await response.json();
          return {
            success: true,
            data: result,
            method: 'Smithery PDF Server',
            performance: {
              duration: Date.now() - start,
              accuracy: result.confidence || undefined
            }
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            method: 'Smithery PDF Server'
          };
        }
      }
    });
    
    this.registerMethod({
      name: 'Backend PDF API',
      type: 'api',
      priority: 3,
      isAvailable: async () => {
        // Check if backend PDF API is available
        try {
          const response = await fetch('https://b1fcb47dfd4d.ngrok-free.app/api/pdf/status', {
            signal: AbortSignal.timeout(2000)
          });
          return response.ok;
        } catch {
          return false;
        }
      },
      extract: async (file, options) => {
        const start = Date.now();
        try {
          let endpoint = 'https://b1fcb47dfd4d.ngrok-free.app/api/pdf/extract';
          const formData = new FormData();
          
          if (file instanceof File) {
            formData.append('file', file);
          } else {
            // It's a URL
            endpoint = 'https://b1fcb47dfd4d.ngrok-free.app/api/pdf/extract-url';
            formData.append('url', file);
          }
          
          if (options?.extractAll) {
            formData.append('extractAll', 'true');
          }
          if (options?.prompt) {
            formData.append('prompt', options.prompt);
          }
          
          const response = await fetch(endpoint, {
            method: 'POST',
            body: formData
          });
          
          if (!response.ok) {
            throw new Error(`API extraction failed: ${response.statusText}`);
          }
          
          const result = await response.json();
          return {
            success: true,
            data: result,
            method: 'Backend PDF API',
            performance: {
              duration: Date.now() - start
            }
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            method: 'Backend PDF API'
          };
        }
      }
    });
  }
  
  /**
   * Register a new extraction method
   */
  static registerMethod(method: PDFExtractionMethod): void {
    this.methods.push(method);
    // Sort by priority (lower number = higher priority)
    this.methods.sort((a, b) => a.priority - b.priority);
  }
  
  /**
   * Extract PDF using the best available method
   */
  static async extract(
    file: File | string,
    options?: {
      extractAll?: boolean;
      prompt?: string;
      preferredMethod?: string;
    }
  ): Promise<ExtractionResult> {
    // Try preferred method first if specified
    if (options?.preferredMethod) {
      const preferred = this.methods.find(m => m.name === options.preferredMethod);
      if (preferred && await preferred.isAvailable()) {
        const result = await preferred.extract(file, options);
        if (result.success) {
          return result;
        }
      }
    }
    
    // Try methods in priority order
    for (const method of this.methods) {
      if (await method.isAvailable()) {
        const result = await method.extract(file, options);
        if (result.success) {
          console.log(`✅ PDF extracted successfully using ${method.name}`);
          return result;
        } else {
          console.warn(`⚠️ ${method.name} failed:`, result.error);
        }
      }
    }
    
    // All methods failed
    return {
      success: false,
      error: 'No PDF extraction methods available',
      method: 'none'
    };
  }
  
  /**
   * Get available extraction methods
   */
  static async getAvailableMethods(): Promise<{
    name: string;
    type: string;
    available: boolean;
  }[]> {
    const results = await Promise.all(
      this.methods.map(async (method) => ({
        name: method.name,
        type: method.type,
        available: await method.isAvailable()
      }))
    );
    return results;
  }
  
  /**
   * Benchmark all available methods
   */
  static async benchmark(file: File): Promise<{
    method: string;
    success: boolean;
    duration?: number;
    accuracy?: number;
    error?: string;
  }[]> {
    const results = [];
    
    for (const method of this.methods) {
      if (await method.isAvailable()) {
        const result = await method.extract(file);
        results.push({
          method: method.name,
          success: result.success,
          duration: result.performance?.duration,
          accuracy: result.performance?.accuracy,
          error: result.error
        });
      } else {
        results.push({
          method: method.name,
          success: false,
          error: 'Method not available'
        });
      }
    }
    
    return results;
  }
  
  /**
   * Extract and discover files after upload
   * Issue #10: Fix extraction file discovery
   */
  static async discoverExtractedFiles(sessionId: string): Promise<string[]> {
    const discoveredFiles: string[] = [];
    
    try {
      // Check temp directory for extracted files
      const response = await fetch(`https://b1fcb47dfd4d.ngrok-free.app/api/files/extracted?sessionId=${sessionId}`);
      if (response.ok) {
        const files = await response.json();
        discoveredFiles.push(...files);
      }
    } catch (error) {
      console.warn('Could not discover extracted files:', error);
    }
    
    return discoveredFiles;
  }
}

export default PDFExtractionService;
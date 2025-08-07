/**
 * PDF MCP Tool Handler
 * Provides MCP-compatible interface for PDF operations
 */

import { PDFExtractionService } from '../pdfExtractionService';
import path from 'path';
import os from 'os';
import fs from 'fs';

export interface MCPToolRequest {
  name: string;
  arguments: Record<string, any>;
}

export interface MCPToolResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
}

export class PDFMCPTool {
  private defaultDownloadsPath: string;

  constructor() {
    // Set default downloads path
    this.defaultDownloadsPath = path.join(os.homedir(), 'Downloads', 'MAGK-Excel');
  }

  /**
   * Handle MCP tool calls for PDF operations
   */
  async handleToolCall(request: MCPToolRequest): Promise<MCPToolResponse> {
    try {
      console.log('🔧 PDF MCP Tool called:', request.name, request.arguments);

      switch (request.name) {
        case 'pdf_extract':
        case 'pdf_extract_tables':
          return await this.handleExtractTables(request.arguments);
        
        case 'pdf_extract_text':
          return await this.handleExtractText(request.arguments);
        
        case 'pdf_read':
          return await this.handleReadPDF(request.arguments);
        
        default:
          return {
            content: [{
              type: 'text',
              text: `❌ Unknown PDF operation: ${request.name}. Available operations: pdf_extract_tables, pdf_extract_text, pdf_read`
            }],
            isError: true
          };
      }
    } catch (error) {
      console.error('❌ Error in PDF MCP Tool:', error);
      return {
        content: [{
          type: 'text',
          text: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`
        }],
        isError: true
      };
    }
  }

  private async handleExtractTables(args: Record<string, any>): Promise<MCPToolResponse> {
    const filePath = this.resolvePath(args.file_path || args.filePath || args.file);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return {
        content: [{
          type: 'text',
          text: `❌ PDF file not found: ${filePath}`
        }],
        isError: true
      };
    }

    // For local files, we need to read and process them
    // Since PDFExtractionService expects URLs, we'll need to handle this differently
    // For now, we'll return a placeholder response
    return {
      content: [{
        type: 'text',
        text: `📄 **PDF Tables Extraction**\n\nFile: ${filePath}\n\n` +
              `⚠️ PDF extraction requires server-side processing. Please use the PDF extraction panel in the UI or upload the file directly to the chat.`
      }]
    };
  }

  private async handleExtractText(args: Record<string, any>): Promise<MCPToolResponse> {
    const filePath = this.resolvePath(args.file_path || args.filePath || args.file);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return {
        content: [{
          type: 'text',
          text: `❌ PDF file not found: ${filePath}`
        }],
        isError: true
      };
    }

    return {
      content: [{
        type: 'text',
        text: `📄 **PDF Text Extraction**\n\nFile: ${filePath}\n\n` +
              `⚠️ PDF extraction requires server-side processing. Please use the PDF extraction panel in the UI or upload the file directly to the chat.`
      }]
    };
  }

  private async handleReadPDF(args: Record<string, any>): Promise<MCPToolResponse> {
    const filePath = this.resolvePath(args.file_path || args.filePath || args.file);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      // If it's a URL, we can try to extract from it
      if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
        try {
          const result = await PDFExtractionService.extractAllTables(filePath);
          
          if (result.status === 'success') {
            const formatted = PDFExtractionService.formatResultsForChat(result);
            return {
              content: [{
                type: 'text',
                text: formatted
              }]
            };
          } else {
            return {
              content: [{
                type: 'text',
                text: `❌ Failed to extract from PDF URL: ${result.error}`
              }],
              isError: true
            };
          }
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `❌ Error extracting from PDF URL: ${error instanceof Error ? error.message : 'Unknown error'}`
            }],
            isError: true
          };
        }
      }
      
      return {
        content: [{
          type: 'text',
          text: `❌ PDF file not found: ${filePath}`
        }],
        isError: true
      };
    }

    // Get file info
    const stats = fs.statSync(filePath);
    const sizeKB = Math.round(stats.size / 1024);

    return {
      content: [{
        type: 'text',
        text: `📄 **PDF File Information**\n\n` +
              `**File:** ${filePath}\n` +
              `**Size:** ${sizeKB} KB\n` +
              `**Modified:** ${stats.mtime.toLocaleString()}\n\n` +
              `⚠️ To extract content from this PDF, please upload it directly to the chat or use the PDF extraction panel.`
      }]
    };
  }

  private resolvePath(inputPath: string): string {
    if (!inputPath) {
      throw new Error('File path is required');
    }

    // If it's a URL, return as-is
    if (inputPath.startsWith('http://') || inputPath.startsWith('https://')) {
      return inputPath;
    }

    // If it's already an absolute path, return as-is
    if (path.isAbsolute(inputPath)) {
      return inputPath;
    }

    // If it's a relative path, resolve it relative to the downloads folder
    return path.resolve(this.defaultDownloadsPath, inputPath);
  }

  /**
   * Get available tools for MCP registration
   */
  static getToolDefinitions() {
    return [
      {
        name: 'pdf_extract_tables',
        description: 'Extract tables from a PDF file',
        inputSchema: {
          type: 'object',
          properties: {
            file_path: { type: 'string', description: 'Path or URL to the PDF file' },
            prompt: { type: 'string', description: 'Optional extraction prompt' }
          },
          required: ['file_path']
        }
      },
      {
        name: 'pdf_extract_text',
        description: 'Extract text content from a PDF file',
        inputSchema: {
          type: 'object',
          properties: {
            file_path: { type: 'string', description: 'Path or URL to the PDF file' },
            pages: { type: 'array', items: { type: 'number' }, description: 'Specific pages to extract (optional)' }
          },
          required: ['file_path']
        }
      },
      {
        name: 'pdf_read',
        description: 'Read and get information about a PDF file',
        inputSchema: {
          type: 'object',
          properties: {
            file_path: { type: 'string', description: 'Path or URL to the PDF file' }
          },
          required: ['file_path']
        }
      }
    ];
  }
}

// Export singleton instance
export const pdfMCPTool = new PDFMCPTool();
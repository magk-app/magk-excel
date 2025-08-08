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
    
    try {
      console.log('📄 PDF MCP Tool: Extracting tables from:', filePath);
      
      // Read the PDF file and send it to the extraction API
      const fs = await import('fs');
      
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
      const fileBuffer = fs.readFileSync(filePath);
      const fileName = path.basename(filePath);
      
      // Create FormData for API request
      const formData = new FormData();
      const file = new File([fileBuffer], fileName, { type: 'application/pdf' });
      formData.append('file', file);
      formData.append('config', JSON.stringify({
        chunkSize: 25,
        fileName: fileName
      }));

      // Call the PDF extraction API
      const response = await fetch('http://localhost:3001/api/pdf-extract', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'PDF extraction failed');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'PDF extraction failed');
      }

      const result = data.result;
      
      // Create a clean, well-formatted table extraction summary
      const financialTables = result.tables.filter((t: any) => t.tableType === 'financial');
      const dataTables = result.tables.filter((t: any) => t.tableType === 'data');
      const highConfidenceTables = result.tables.filter((t: any) => t.confidence > 0.8).slice(0, 2);
      
      let output = `## 📊 PDF Table Analysis Complete\n\n`;
      output += `**File:** ${result.fileName}\n\n`;
      
      output += `### 📈 Extraction Summary\n`;
      output += `- **Pages Processed:** ${result.totalPages}\n`;
      output += `- **Tables Found:** ${result.tables.length}\n`;
      output += `  - 💰 Financial: ${financialTables.length}\n`;
      output += `  - 📊 Data: ${dataTables.length}\n`;
      output += `- **Processing Time:** ${(result.extractionTime / 1000).toFixed(2)}s\n`;
      
      // Show document type if detected
      if (financialTables.length > 5) {
        output += `- **Document Type:** Financial report (10-Q, 10-K, etc.)\n`;
      }
      output += `\n`;
      
      // Show a preview of the most important tables
      if (highConfidenceTables.length > 0) {
        output += `### 🔍 Key Tables Preview\n\n`;
        
        highConfidenceTables.forEach((table: any) => {
          const tableType = table.tableType === 'financial' ? '💰 Financial Data' : 
                          table.tableType === 'data' ? '📊 Data Table' : '📋 Table';
          
          output += `#### ${tableType} (Page ${table.page})\n`;
          output += `*Confidence: ${(table.confidence * 100).toFixed(1)}%*\n\n`;
          
          // Show table with limited rows
          if (table.headers && table.headers.length > 0) {
            output += '| ' + table.headers.join(' | ') + ' |\n';
            output += '| ' + table.headers.map(() => '---').join(' | ') + ' |\n';
          }
          
          if (table.rows && table.rows.length > 0) {
            // Show only first 3 rows for preview
            table.rows.slice(0, 3).forEach((row: string[]) => {
              output += '| ' + row.join(' | ') + ' |\n';
            });
            
            if (table.rows.length > 3) {
              output += `\n*... and ${table.rows.length - 3} more rows*\n`;
            }
          }
          output += `\n`;
        });
      }
      
      output += `### 🤖 What would you like me to analyze?\n\n`;
      output += `- 🔍 **Specific metrics** - Revenue, expenses, ratios, etc.\n`;
      output += `- 📊 **Export to Excel** - Selected tables or all data\n`;
      output += `- 📋 **Focus on sections** - Balance sheet, income statement, etc.\n`;
      output += `- 📈 **Compare periods** - Year-over-year or quarter-over-quarter\n`;
      output += `- 💡 **Generate insights** - Key takeaways and analysis\n\n`;
      output += `> 💡 **I have access to all ${result.tables.length} tables with full data. Just ask for what you need!**`

      return {
        content: [{
          type: 'text',
          text: output
        }]
      };
      
    } catch (error) {
      console.error('❌ PDF extraction error:', error);
      return {
        content: [{
          type: 'text',
          text: `❌ Error extracting PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
        }],
        isError: true
      };
    }
  }

  private async handleExtractText(args: Record<string, any>): Promise<MCPToolResponse> {
    const filePath = this.resolvePath(args.file_path || args.filePath || args.file);
    
    try {
      console.log('📄 PDF MCP Tool: Extracting text from:', filePath);
      
      // Read the PDF file and send it to the extraction API
      const fs = await import('fs');
      
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
      const fileBuffer = fs.readFileSync(filePath);
      const fileName = path.basename(filePath);
      
      // Create FormData for API request
      const formData = new FormData();
      const file = new File([fileBuffer], fileName, { type: 'application/pdf' });
      formData.append('file', file);
      formData.append('config', JSON.stringify({
        chunkSize: 25,
        fileName: fileName
      }));

      // Call the PDF extraction API
      const response = await fetch('http://localhost:3001/api/pdf-extract', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'PDF extraction failed');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'PDF extraction failed');
      }

      const result = data.result;
      
      // Create a clean, well-formatted text extraction summary
      let output = `## 📄 PDF Text Extraction Complete\n\n`;
      output += `**File:** ${result.fileName}\n\n`;
      
      output += `### 📊 Document Overview\n`;
      output += `- **Pages:** ${result.totalPages}\n`;
      output += `- **Characters:** ${result.text ? Math.round(result.text.length / 1000) : 0}K\n`;
      output += `- **Processing Time:** ${(result.extractionTime / 1000).toFixed(2)}s\n`;
      
      if (result.tables && result.tables.length > 0) {
        output += `- **Tables Found:** ${result.tables.length} (${result.tables.filter((t: any) => t.tableType === 'financial').length} financial)\n`;
      }
      output += `\n`;
      
      if (result.text && result.text.length > 0) {
        // Show a clean preview of the first page
        const pages = result.text.split(/\n=== PAGE \d+ ===\n/);
        
        if (pages.length > 1 && pages[1]) {
          const firstPageContent = pages[1].trim();
          if (firstPageContent) {
            output += `### 📖 First Page Preview\n\n`;
            const preview = firstPageContent.length > 600 ? firstPageContent.substring(0, 600).trim() + '...' : firstPageContent;
            output += `\`\`\`\n${preview}\n\`\`\`\n\n`;
            
            if (pages.length > 2) {
              output += `*📄 Document contains ${pages.length - 1} total pages*\n\n`;
            }
          }
        } else {
          // No page markers, show brief preview
          const preview = result.text.length > 600 ? result.text.substring(0, 600).trim() + '...' : result.text;
          output += `### 📖 Content Preview\n\n\`\`\`\n${preview}\n\`\`\`\n\n`;
        }
      } else {
        output += `⚠️ No text content was extracted from the PDF.\n\n`;
      }
      
      output += `### 🤖 How can I help you analyze this document?\n\n`;
      output += `- 🔍 **Search** for specific information or keywords\n`;
      output += `- 📝 **Summarize** sections, pages, or the entire document\n`;
      output += `- 📊 **Extract** key insights and important data points\n`;
      output += `- 📋 **Focus** on specific topics or sections\n`;
      output += `- 💾 **Export** content in different formats\n\n`;
      output += `> 💡 **I have access to all ${result.totalPages} pages of text content. Just ask for what you need!**`

      return {
        content: [{
          type: 'text',
          text: output
        }]
      };
      
    } catch (error) {
      console.error('❌ PDF text extraction error:', error);
      return {
        content: [{
          type: 'text',
          text: `❌ Error extracting PDF text: ${error instanceof Error ? error.message : 'Unknown error'}`
        }],
        isError: true
      };
    }
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
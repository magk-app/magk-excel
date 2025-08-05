/**
 * Excel MCP Tool Handler
 * Provides MCP-compatible interface for Excel operations using ExcelJS
 */

import { excelService, ExcelOperationResult } from './ExcelService';
import path from 'path';
import os from 'os';

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

export class ExcelMCPTool {
  private defaultDownloadsPath: string;

  constructor() {
    // Set default downloads path
    this.defaultDownloadsPath = path.join(os.homedir(), 'Downloads', 'MAGK-Excel');
  }

  /**
   * Handle MCP tool calls for Excel operations
   */
  async handleToolCall(request: MCPToolRequest): Promise<MCPToolResponse> {
    try {
      console.log('🔧 Excel MCP Tool called:', request.name, request.arguments);

      switch (request.name) {
        case 'excel_read':
          return await this.handleReadExcel(request.arguments);
        
        case 'excel_write':
        case 'excel_create':
          return await this.handleWriteExcel(request.arguments);
        
        case 'excel_format':
          return await this.handleFormatExcel(request.arguments);
        
        case 'excel_calculate':
          return await this.handleCalculateExcel(request.arguments);
        
        case 'excel_info':
          return await this.handleGetInfo(request.arguments);
        
        case 'excel_sample':
          return await this.handleCreateSample(request.arguments);
        
        default:
          return {
            content: [{
              type: 'text',
              text: `❌ Unknown Excel operation: ${request.name}. Available operations: excel_read, excel_write, excel_create, excel_format, excel_calculate, excel_info, excel_sample`
            }],
            isError: true
          };
      }
    } catch (error) {
      console.error('❌ Error in Excel MCP Tool:', error);
      return {
        content: [{
          type: 'text',
          text: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`
        }],
        isError: true
      };
    }
  }

  private async handleReadExcel(args: Record<string, any>): Promise<MCPToolResponse> {
    const filePath = this.resolvePath(args.filePath || args.file);
    const result = await excelService.readExcel({
      filePath,
      sheetName: args.sheetName || args.sheet,
      range: args.range,
      includeHeaders: args.includeHeaders !== false
    });

    return this.formatResult(result, 'Excel Read Operation');
  }

  private async handleWriteExcel(args: Record<string, any>): Promise<MCPToolResponse> {
    const filePath = this.resolvePath(args.filePath || args.file || this.generateFileName(args.name));
    
    // Parse data if it's a string
    let data = args.data;
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch {
        // If not JSON, treat as CSV-like data
        data = data.split('\n').map((row: string) => row.split(','));
      }
    }

    const result = await excelService.writeExcel({
      filePath,
      sheetName: args.sheetName || args.sheet,
      data: data || [],
      headers: args.headers,
      overwrite: args.overwrite !== false
    });

    return this.formatResult(result, 'Excel Write Operation');
  }

  private async handleFormatExcel(args: Record<string, any>): Promise<MCPToolResponse> {
    const filePath = this.resolvePath(args.filePath || args.file);
    const result = await excelService.formatExcel({
      filePath,
      sheetName: args.sheetName || args.sheet,
      range: args.range,
      format: args.format || {}
    });

    return this.formatResult(result, 'Excel Format Operation');
  }

  private async handleCalculateExcel(args: Record<string, any>): Promise<MCPToolResponse> {
    const filePath = this.resolvePath(args.filePath || args.file);
    const result = await excelService.calculateExcel({
      filePath,
      sheetName: args.sheetName || args.sheet,
      formula: args.formula,
      cell: args.cell
    });

    return this.formatResult(result, 'Excel Calculate Operation');
  }

  private async handleGetInfo(args: Record<string, any>): Promise<MCPToolResponse> {
    const filePath = this.resolvePath(args.filePath || args.file);
    const result = await excelService.getWorkbookInfo(filePath);

    return this.formatResult(result, 'Excel Info Operation');
  }

  private async handleCreateSample(args: Record<string, any>): Promise<MCPToolResponse> {
    const filePath = this.resolvePath(args.filePath || args.file || this.generateFileName('sample'));
    const result = await excelService.createSampleExcel(filePath, args.data);

    return this.formatResult(result, 'Excel Sample Creation');
  }

  private formatResult(result: ExcelOperationResult, operationName: string): MCPToolResponse {
    if (result.success) {
      let text = `✅ ${operationName} completed successfully!\n\n`;
      
      if (result.message) {
        text += `📋 **Result:** ${result.message}\n`;
      }
      
      if (result.filePath) {
        text += `📁 **File:** ${result.filePath}\n`;
      }
      
      if (result.rowsAffected !== undefined) {
        text += `📊 **Rows:** ${result.rowsAffected}\n`;
      }
      
      if (result.columnsAffected !== undefined) {
        text += `📈 **Columns:** ${result.columnsAffected}\n`;
      }
      
      if (result.data) {
        text += `\n📄 **Data:**\n\`\`\`json\n${JSON.stringify(result.data, null, 2)}\n\`\`\`\n`;
      }

      return {
        content: [{
          type: 'text',
          text
        }]
      };
    } else {
      return {
        content: [{
          type: 'text',
          text: `❌ ${operationName} failed:\n\n**Error:** ${result.error}`
        }],
        isError: true
      };
    }
  }

  private resolvePath(inputPath: string): string {
    if (!inputPath) {
      throw new Error('File path is required');
    }

    // If it's already an absolute path, return as-is
    if (path.isAbsolute(inputPath)) {
      return inputPath;
    }

    // If it's a relative path, resolve it relative to the downloads folder
    return path.resolve(this.defaultDownloadsPath, inputPath);
  }

  private generateFileName(baseName: string = 'excel-file'): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return path.join(this.defaultDownloadsPath, `${baseName}-${timestamp}.xlsx`);
  }

  /**
   * Get available tools for MCP registration
   */
  static getToolDefinitions() {
    return [
      {
        name: 'excel_read',
        description: 'Read data from an Excel file',
        inputSchema: {
          type: 'object',
          properties: {
            filePath: { type: 'string', description: 'Path to the Excel file' },
            sheetName: { type: 'string', description: 'Name of the worksheet (optional)' },
            range: { type: 'string', description: 'Cell range to read (optional)' },
            includeHeaders: { type: 'boolean', description: 'Include headers in the result (default: true)' }
          },
          required: ['filePath']
        }
      },
      {
        name: 'excel_write',
        description: 'Write data to an Excel file',
        inputSchema: {
          type: 'object',
          properties: {
            filePath: { type: 'string', description: 'Path to the Excel file' },
            data: { type: 'array', description: 'Array of arrays representing rows and columns' },
            headers: { type: 'array', description: 'Array of header names (optional)' },
            sheetName: { type: 'string', description: 'Name of the worksheet (optional)' },
            overwrite: { type: 'boolean', description: 'Overwrite existing file (default: true)' }
          },
          required: ['data']
        }
      },
      {
        name: 'excel_create',
        description: 'Create a new Excel file with data',
        inputSchema: {
          type: 'object',
          properties: {
            filePath: { type: 'string', description: 'Path for the new Excel file' },
            data: { type: 'array', description: 'Array of arrays representing rows and columns' },
            headers: { type: 'array', description: 'Array of header names (optional)' },
            sheetName: { type: 'string', description: 'Name of the worksheet (optional)' }
          },
          required: ['data']
        }
      },
      {
        name: 'excel_format',
        description: 'Format cells in an Excel file',
        inputSchema: {
          type: 'object',
          properties: {
            filePath: { type: 'string', description: 'Path to the Excel file' },
            sheetName: { type: 'string', description: 'Name of the worksheet (optional)' },
            range: { type: 'string', description: 'Cell range to format (optional)' },
            format: { type: 'object', description: 'Format options (font, fill, border, etc.)' }
          },
          required: ['filePath', 'format']
        }
      },
      {
        name: 'excel_calculate',
        description: 'Add formulas and calculations to an Excel file',
        inputSchema: {
          type: 'object',
          properties: {
            filePath: { type: 'string', description: 'Path to the Excel file' },
            formula: { type: 'string', description: 'Excel formula to add' },
            cell: { type: 'string', description: 'Target cell for the formula (optional)' },
            sheetName: { type: 'string', description: 'Name of the worksheet (optional)' }
          },
          required: ['filePath', 'formula']
        }
      },
      {
        name: 'excel_info',
        description: 'Get information about an Excel workbook',
        inputSchema: {
          type: 'object',
          properties: {
            filePath: { type: 'string', description: 'Path to the Excel file' }
          },
          required: ['filePath']
        }
      },
      {
        name: 'excel_sample',
        description: 'Create a sample Excel file with demo data',
        inputSchema: {
          type: 'object',
          properties: {
            filePath: { type: 'string', description: 'Path for the sample Excel file (optional)' },
            data: { type: 'array', description: 'Custom sample data (optional)' }
          }
        }
      }
    ];
  }
}

// Export singleton instance
export const excelMCPTool = new ExcelMCPTool();
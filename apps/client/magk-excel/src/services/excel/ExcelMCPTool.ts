/**
 * Excel MCP Tool Handler
 * Provides MCP-compatible interface for Excel operations using ExcelJS
 */

import { excelService, ExcelOperationResult } from './ExcelService';
import path from 'path';
import os from 'os';
import fs from 'fs';

export interface MCPToolRequest {
  name: string;
  arguments: Record<string, any>;
}

export interface MCPToolResponse {
  content: Array<{
    type: 'text' | 'resource';
    text?: string;
    resource?: {
      uri: string;
      mimeType: string;
      text?: string;
    };
  }>;
  isError?: boolean;
  downloadInfo?: {
    filePath: string;
    filename: string;
    url?: string;
  };
}

export class ExcelMCPTool {
  private defaultDownloadsPath: string;
  private webServerPath?: string;

  constructor() {
    // Set default downloads path
    this.defaultDownloadsPath = process.env.EXCEL_FILES_PATH || 
                                process.env.MAGK_EXCEL_PATH ||
                                path.join(os.homedir(), 'Downloads', 'MAGK-Excel');
    
    // Ensure the directory exists
    this.ensureDirectoryExists(this.defaultDownloadsPath);
    
    // Optional: Set web server path for downloads
    this.webServerPath = process.env.EXCEL_WEB_PATH;
  }
  
  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`📁 Created directory: ${dirPath}`);
    }
  }

  /**
   * Handle MCP tool calls for Excel operations
   */
  async handleToolCall(request: MCPToolRequest): Promise<MCPToolResponse> {
    try {
      console.log('🔧 Excel MCP Tool called:', request.name, request.arguments);

      switch (request.name) {
        case 'excel_read':
        case 'excel_read_sheet':
          return await this.handleReadExcel(request.arguments);
        
        case 'excel_write':
        case 'excel_create':
        case 'excel_write_to_sheet':
          return await this.handleWriteExcel(request.arguments);
        
        case 'excel_format':
          return await this.handleFormatExcel(request.arguments);
        
        case 'excel_calculate':
          return await this.handleCalculateExcel(request.arguments);
        
        case 'excel_info':
        case 'excel_describe_sheets':
          return await this.handleGetInfo(request.arguments);
        
        case 'excel_sample':
          return await this.handleCreateSample(request.arguments);
        
        default:
          return {
            content: [{
              type: 'text',
              text: `❌ Unknown Excel operation: ${request.name}. Available operations: excel_read_sheet, excel_write_to_sheet, excel_describe_sheets, excel_format, excel_calculate, excel_sample`
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
    const filePath = this.resolvePath(args.filePath || args.file_path || args.file);
    const result = await excelService.readExcel({
      filePath,
      sheetName: args.sheetName || args.sheet_name || args.sheet,
      range: args.range,
      includeHeaders: args.includeHeaders !== false
    });

    return this.formatResult(result, 'Excel Read Operation');
  }

  private async handleWriteExcel(args: Record<string, any>): Promise<MCPToolResponse> {
    // Handle filename parameter for excel_create
    const filename = args.filename || args.name;
    const filePath = this.resolvePath(
      args.filePath || 
      args.file_path || 
      args.file || 
      (filename ? this.generateFileNameFromName(filename) : this.generateFileName('excel-file'))
    );
    
    // Parse data if it's a string, or use values if provided (for compatibility)
    let data = args.data || args.values;
    
    // Handle object-style data (e.g., { "Year": [2023, 2024], "Rabbits": [1, 2] })
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const keys = Object.keys(data);
      const rows = [];
      
      // Add headers
      rows.push(keys);
      
      // Get the length of the first array to know how many rows we need
      const rowCount = data[keys[0]]?.length || 0;
      
      // Transform column-based data to row-based data
      for (let i = 0; i < rowCount; i++) {
        const row = keys.map(key => data[key][i]);
        rows.push(row);
      }
      
      data = rows;
    } else if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch {
        // If not JSON, treat as CSV-like data
        data = data.split('\n').map((row: string) => row.split(','));
      }
    }

    const result = await excelService.writeExcel({
      filePath,
      sheetName: args.sheetName || args.sheet_name || args.sheet,
      data: data || [],
      headers: args.headers,
      overwrite: args.overwrite !== false
    });

    return this.formatResultWithDownload(result, 'Excel Write Operation', filePath);
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
    const filePath = this.resolvePath(args.filePath || args.file_path || args.file);
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
  
  private formatResultWithDownload(result: ExcelOperationResult, operationName: string, filePath: string): MCPToolResponse {
    if (result.success) {
      const filename = path.basename(filePath);
      const downloadUrl = this.generateDownloadUrl(filePath);
      
      let text = `✅ ${operationName} completed successfully!\n\n`;
      text += `📁 **File Created:** ${filename}\n`;
      text += `📂 **Location:** ${filePath}\n`;
      
      if (result.rowsAffected !== undefined) {
        text += `📊 **Rows:** ${result.rowsAffected}\n`;
      }
      
      if (result.columnsAffected !== undefined) {
        text += `📈 **Columns:** ${result.columnsAffected}\n`;
      }
      
      text += `\n💾 **Download:** The file has been saved to your Downloads folder.\n`;
      text += `📥 **Path:** \`${filePath}\`\n`;
      
      if (downloadUrl) {
        text += `🔗 **Web Download:** ${downloadUrl}\n`;
      }
      
      text += `\n*You can now open this file with Excel or any spreadsheet application.*`;

      const response: MCPToolResponse = {
        content: [{
          type: 'text',
          text
        }],
        downloadInfo: {
          filePath,
          filename,
          url: downloadUrl
        }
      };
      
      // Add resource content if file exists
      if (fs.existsSync(filePath)) {
        response.content.push({
          type: 'resource',
          resource: {
            uri: `file://${filePath}`,
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            text: `Excel file: ${filename}`
          }
        });
      }
      
      return response;
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
  
  private generateDownloadUrl(filePath: string): string | undefined {
    if (!this.webServerPath) return undefined;
    
    const relativePath = path.relative(this.defaultDownloadsPath, filePath);
    return `${this.webServerPath}/${relativePath.replace(/\\/g, '/')}`;
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
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    return path.join(this.defaultDownloadsPath, `${baseName}-${timestamp}.xlsx`);
  }
  
  private generateFileNameFromName(name: string): string {
    // Remove extension if provided
    const nameWithoutExt = name.replace(/\.(xlsx?|xls)$/i, '');
    // Sanitize filename
    const sanitized = nameWithoutExt.replace(/[^a-zA-Z0-9-_]/g, '_');
    return path.join(this.defaultDownloadsPath, `${sanitized}.xlsx`);
  }

  /**
   * Get available tools for MCP registration
   */
  static getToolDefinitions() {
    return [
      {
        name: 'excel_read_sheet',
        description: 'Read data from an Excel sheet',
        inputSchema: {
          type: 'object',
          properties: {
            file_path: { type: 'string', description: 'Path to the Excel file' },
            sheet_name: { type: 'string', description: 'Name of the worksheet (optional)' },
            range: { type: 'string', description: 'Cell range to read (optional)' },
            limit: { type: 'number', description: 'Maximum number of rows to read (optional)' },
            includeHeaders: { type: 'boolean', description: 'Include headers in the result (default: true)' }
          },
          required: ['file_path']
        }
      },
      {
        name: 'excel_write_to_sheet',
        description: 'Write data to an Excel sheet',
        inputSchema: {
          type: 'object',
          properties: {
            file_path: { type: 'string', description: 'Path to the Excel file' },
            sheet_name: { type: 'string', description: 'Name of the worksheet (optional)' },
            values: { type: 'array', description: 'Array of arrays representing rows and columns' },
            headers: { type: 'array', description: 'Array of header names (optional)' },
            overwrite: { type: 'boolean', description: 'Overwrite existing file (default: true)' }
          },
          required: ['file_path', 'values']
        }
      },
      {
        name: 'excel_describe_sheets',
        description: 'Get information about sheets in an Excel workbook',
        inputSchema: {
          type: 'object',
          properties: {
            file_path: { type: 'string', description: 'Path to the Excel file' }
          },
          required: ['file_path']
        }
      },
      // Keep the other tools for backwards compatibility
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
            filename: { type: 'string', description: 'Name for the new Excel file' },
            filePath: { type: 'string', description: 'Path for the new Excel file (optional, uses filename if provided)' },
            data: { 
              type: ['array', 'object'], 
              description: 'Data as array of arrays OR object with column names as keys and arrays as values' 
            },
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
/**
 * Excel MCP Tool Handler
 * Provides MCP-compatible interface for Excel operations using ExcelJS
 */

import { excelService, ExcelOperationResult } from './ExcelService';
import { FilePathResolver, FilePathMapping, FilePathResolutionResult, debugFilePathResolution } from '../../utils/filePathResolver';
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
  private diagnosticsEnabled: boolean;

  constructor() {
    this.diagnosticsEnabled = process.env.NODE_ENV === 'development' || process.env.EXCEL_MCP_DEBUG === 'true';
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
    const inputPath = args.filePath || args.file_path || args.file;
    
    if (!inputPath) {
      return {
        content: [{
          type: 'text',
          text: '❌ Excel Read Operation failed:\n\n**Error:** File path is required. Please provide filePath, file_path, or file parameter.'
        }],
        isError: true
      };
    }
    
    const filePath = await this.resolvePath(inputPath, args);
    
    console.log(`📖 Excel MCP: Reading file: ${inputPath} -> ${filePath}`);
    
    const result = await excelService.readExcel({
      filePath,
      sheetName: args.sheetName || args.sheet_name || args.sheet,
      range: args.range,
      includeHeaders: args.includeHeaders !== false
    });

    return this.formatResult(result, 'Excel Read Operation', inputPath);
  }

  private async handleWriteExcel(args: Record<string, any>): Promise<MCPToolResponse> {
    // Handle filename parameter for excel_create
    const filename = args.filename || args.name;
    const inputPath = args.filePath || 
                     args.file_path || 
                     args.file || 
                     (filename ? this.generateFileNameFromName(filename) : this.generateFileName('excel-file'));
    
    const filePath = await this.resolvePath(inputPath, args);
    
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
    const inputPath = args.filePath || args.file;
    
    if (!inputPath) {
      return {
        content: [{
          type: 'text',
          text: '❌ Excel Format Operation failed:\n\n**Error:** File path is required. Please provide filePath or file parameter.'
        }],
        isError: true
      };
    }
    
    const filePath = await this.resolvePath(inputPath, args);
    
    console.log(`🎨 Excel MCP: Formatting file: ${inputPath} -> ${filePath}`);
    
    const result = await excelService.formatExcel({
      filePath,
      sheetName: args.sheetName || args.sheet,
      range: args.range,
      format: args.format || {}
    });

    return this.formatResult(result, 'Excel Format Operation', inputPath);
  }

  private async handleCalculateExcel(args: Record<string, any>): Promise<MCPToolResponse> {
    const inputPath = args.filePath || args.file;
    
    if (!inputPath) {
      return {
        content: [{
          type: 'text',
          text: '❌ Excel Calculate Operation failed:\n\n**Error:** File path is required. Please provide filePath or file parameter.'
        }],
        isError: true
      };
    }
    
    const filePath = await this.resolvePath(inputPath, args);
    
    console.log(`🧮 Excel MCP: Calculating formulas: ${inputPath} -> ${filePath}`);
    
    const result = await excelService.calculateExcel({
      filePath,
      sheetName: args.sheetName || args.sheet,
      formula: args.formula,
      cell: args.cell
    });

    return this.formatResult(result, 'Excel Calculate Operation', inputPath);
  }

  private async handleGetInfo(args: Record<string, any>): Promise<MCPToolResponse> {
    const inputPath = args.filePath || args.file_path || args.file;
    
    if (!inputPath) {
      return {
        content: [{
          type: 'text',
          text: '❌ Excel Info Operation failed:\n\n**Error:** File path is required. Please provide filePath, file_path, or file parameter.'
        }],
        isError: true
      };
    }
    
    const filePath = await this.resolvePath(inputPath, args);
    
    console.log(`📋 Excel MCP: Getting info: ${inputPath} -> ${filePath}`);
    
    const result = await excelService.getWorkbookInfo(filePath);

    return this.formatResult(result, 'Excel Info Operation', inputPath);
  }

  private async handleCreateSample(args: Record<string, any>): Promise<MCPToolResponse> {
    const inputPath = args.filePath || args.file || this.generateFileName('sample');
    const filePath = await this.resolvePath(inputPath, args);
    
    console.log(`📄 Excel MCP: Creating sample: ${inputPath} -> ${filePath}`);
    
    const result = await excelService.createSampleExcel(filePath, args.data);

    return this.formatResultWithDownload(result, 'Excel Sample Creation', filePath);
  }

  private formatResult(result: ExcelOperationResult, operationName: string, inputPath?: string): MCPToolResponse {
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
        // Limit data output for large datasets
        const dataToShow = Array.isArray(result.data) && result.data.length > 10 
          ? result.data.slice(0, 10) 
          : result.data;
        
        text += `\n📄 **Data Preview:**\n\`\`\`json\n${JSON.stringify(dataToShow, null, 2)}\n\`\`\`\n`;
        
        if (Array.isArray(result.data) && result.data.length > 10) {
          text += `\n*Showing first 10 rows of ${result.data.length} total rows.*\n`;
        }
      }

      return {
        content: [{
          type: 'text',
          text
        }]
      };
    } else {
      let errorText = `❌ ${operationName} failed:\n\n**Error:** ${result.error}`;
      
      // Add file path diagnostics if available
      if (inputPath && this.diagnosticsEnabled) {
        errorText += `\n\n🔍 **Diagnostics:**\n`;
        errorText += `- Input path: \`${inputPath}\`\n`;
        errorText += `- Resolved path: \`${result.filePath || 'N/A'}\`\n`;
        errorText += `\n💡 **Troubleshooting:**\n`;
        errorText += `- Verify the file exists and is accessible\n`;
        errorText += `- Check file permissions\n`;
        errorText += `- Try uploading the file again\n`;
        errorText += `- Use the complete file path if possible\n`;
      }
      
      return {
        content: [{
          type: 'text',
          text: errorText
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

  /**
   * Create a comprehensive file path mapping from persistence store and temp files
   */
  private async createFilePathMapping(sessionId?: string): Promise<FilePathMapping> {
    const mapping: FilePathMapping = {};
    
    try {
      // Try to access file persistence store if in browser environment
      if (typeof window !== 'undefined' && window.fileAPI) {
        // Get files from different sources
        const tempFiles = await this.getTempFilesMapping();
        const persistentFiles = await this.getPersistentFilesMapping();
        
        Object.assign(mapping, tempFiles, persistentFiles);
        
        console.log(`📋 Excel MCP: Created file mapping with ${Object.keys(mapping).length} entries`);
        if (this.diagnosticsEnabled) {
          console.log('File mapping entries:', Object.keys(mapping));
        }
      }
    } catch (error) {
      console.warn('⚠️ Excel MCP: Failed to create comprehensive file mapping:', error);
    }
    
    return mapping;
  }
  
  /**
   * Get file mappings from temp files
   */
  private async getTempFilesMapping(): Promise<FilePathMapping> {
    const mapping: FilePathMapping = {};
    
    try {
      if (window.fileAPI?.findFileByName) {
        // Get common Excel file extensions to search for
        const excelExtensions = ['xlsx', 'xls', 'csv'];
        
        for (const ext of excelExtensions) {
          const searchResult = await window.fileAPI.findFileByName(`*.${ext}`);
          if (searchResult.success && searchResult.files) {
            for (const file of searchResult.files) {
              const filename = path.basename(file.path);
              const nameWithoutExt = path.parse(filename).name;
              
              // Create multiple mapping entries for flexibility
              mapping[filename] = file.path;
              mapping[nameWithoutExt] = file.path;
              
              // Remove common prefixes
              const cleanName = nameWithoutExt.replace(/^(file_|upload_|temp_)/, '');
              if (cleanName !== nameWithoutExt) {
                mapping[cleanName] = file.path;
                mapping[cleanName + path.extname(filename)] = file.path;
              }
            }
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Excel MCP: Failed to get temp files mapping:', error);
    }
    
    return mapping;
  }
  
  /**
   * Get file mappings from persistent files
   */
  private async getPersistentFilesMapping(): Promise<FilePathMapping> {
    const mapping: FilePathMapping = {};
    
    try {
      if (window.fileAPI?.listPersistentFiles) {
        const result = await window.fileAPI.listPersistentFiles();
        if (result.success && result.files) {
          for (const file of result.files) {
            const nameWithoutExt = path.parse(file.name).name;
            
            // Create multiple mapping entries
            mapping[file.name] = file.path;
            mapping[nameWithoutExt] = file.path;
            
            // Also try Excel subdirectory
            const excelSubdirResult = await window.fileAPI.listPersistentFiles('excel');
            if (excelSubdirResult.success && excelSubdirResult.files) {
              for (const excelFile of excelSubdirResult.files) {
                const excelNameWithoutExt = path.parse(excelFile.name).name;
                mapping[excelFile.name] = excelFile.path;
                mapping[excelNameWithoutExt] = excelFile.path;
              }
            }
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Excel MCP: Failed to get persistent files mapping:', error);
    }
    
    return mapping;
  }

  /**
   * Enhanced file path resolution with comprehensive logging and diagnostics
   */
  private async resolvePath(inputPath: string, args?: any): Promise<string> {
    if (!inputPath) {
      throw new Error('❌ File path is required');
    }

    console.log(`🔍 Excel MCP: Starting path resolution for "${inputPath}"`);
    
    // Strategy 1: Check if it's already an absolute path and exists
    if (path.isAbsolute(inputPath)) {
      if (fs.existsSync(inputPath)) {
        console.log(`✅ Excel MCP: Absolute path exists: ${inputPath}`);
        return inputPath;
      } else {
        console.log(`⚠️ Excel MCP: Absolute path does not exist: ${inputPath}`);
      }
    }

    // Strategy 2: Create comprehensive file path mapping
    let filePathMap: FilePathMapping = {};
    
    // Merge provided mapping with our comprehensive mapping
    if (args && args._filePathMap && typeof args._filePathMap === 'object') {
      filePathMap = { ...args._filePathMap } as FilePathMapping;
      console.log(`📋 Excel MCP: Frontend file mapping available with ${Object.keys(filePathMap).length} entries`);
    }
    
    // Enhance with our own comprehensive mapping
    const comprehensiveMapping = await this.createFilePathMapping();
    filePathMap = { ...filePathMap, ...comprehensiveMapping };
    
    if (Object.keys(filePathMap).length > 0) {
      console.log(`📋 Excel MCP: Total file mapping entries: ${Object.keys(filePathMap).length}`);
      
      // Try exact match first
      if (filePathMap[inputPath]) {
        const resolvedPath = filePathMap[inputPath];
        if (fs.existsSync(resolvedPath)) {
          console.log(`✅ Excel MCP: Found exact match in mapping: ${inputPath} -> ${resolvedPath}`);
          return resolvedPath;
        } else {
          console.log(`⚠️ Excel MCP: Mapped path does not exist: ${resolvedPath}`);
        }
      }
      
      // Try fuzzy matching for similar filenames
      for (const [friendlyName, absolutePath] of Object.entries(filePathMap)) {
        if (friendlyName.toLowerCase().includes(inputPath.toLowerCase()) || 
            inputPath.toLowerCase().includes(friendlyName.toLowerCase())) {
          if (fs.existsSync(absolutePath)) {
            console.log(`✅ Excel MCP: Found fuzzy match in mapping: ${inputPath} ~ ${friendlyName} -> ${absolutePath}`);
            return absolutePath;
          } else {
            console.log(`⚠️ Excel MCP: Fuzzy matched path does not exist: ${absolutePath}`);
          }
        }
      }
    }

    // Strategy 3: Use Electron API to find files by name if available
    if (typeof window !== 'undefined' && window.fileAPI?.findFileByName) {
      try {
        const result = await window.fileAPI.findFileByName(inputPath);
        if (result.success && result.files && result.files.length > 0) {
          const bestMatch = result.files[0]; // First file is the newest
          console.log(`✅ Excel MCP: Found via Electron file search: ${bestMatch.path}`);
          return bestMatch.path;
        }
        console.log(`📭 Excel MCP: No files found via Electron search for "${inputPath}"`);
      } catch (error) {
        console.log(`⚠️ Excel MCP: Electron file search failed:`, error);
      }
    }

    // Strategy 4: Use FilePathResolver for systematic search
    const searchDirectories = [
      this.defaultDownloadsPath,
      os.tmpdir(),
      process.cwd()
    ];

    for (const searchDir of searchDirectories) {
      const result = FilePathResolver.resolvePath(inputPath, filePathMap, searchDir);
      if (result.success && fs.existsSync(result.resolvedPath)) {
        console.log(`✅ Excel MCP: Found via FilePathResolver (${result.method}): ${result.resolvedPath}`);
        return result.resolvedPath;
      }
      console.log(`📭 Excel MCP: FilePathResolver failed for directory ${searchDir}: ${result.error}`);
    }

    // Strategy 5: Check common file locations with variations
    const searchPaths = [
      path.join(os.tmpdir(), inputPath),
      path.join(this.defaultDownloadsPath, inputPath),
      path.resolve(process.cwd(), inputPath),
      // Try with common prefixes that might be added by file upload systems
      ...this.generateFileVariations(inputPath)
    ];

    for (const searchPath of searchPaths) {
      if (fs.existsSync(searchPath)) {
        console.log(`✅ Excel MCP: Found at search path: ${searchPath}`);
        return searchPath;
      }
    }

    // Strategy 6: Last resort - return path relative to downloads folder with detailed error
    const fallbackPath = path.resolve(this.defaultDownloadsPath, inputPath);
    
    // Create comprehensive error message
    const searchedPaths = searchPaths.join('\n  - ');
    const errorMessage = [
      `❌ Excel MCP: File "${inputPath}" not found in any location.`,
      `🔍 Searched paths:`,
      `  - ${searchedPaths}`,
      filePathMap ? `📋 File mapping had ${Object.keys(filePathMap).length} entries` : '📋 No file mapping available',
      `📁 Using fallback path: ${fallbackPath}`,
      ``,
      `💡 Suggestions:`,
      `  - Check if the file was uploaded correctly`,
      `  - Verify the filename spelling`,
      `  - Try using the full path instead of just filename`,
      `  - Check the Downloads/MAGK-Excel directory`
    ].join('\n');
    
    console.error(errorMessage);
    
    // Don't throw error, return fallback path to allow operation to attempt
    return fallbackPath;
  }

  /**
   * Generate possible file name variations that might exist
   */
  private generateFileVariations(inputPath: string): string[] {
    const variations: string[] = [];
    const basename = path.basename(inputPath);
    const dirname = path.dirname(inputPath);
    const { name, ext } = path.parse(basename);
    
    // Common prefixes added by upload systems
    const prefixes = ['file_', 'upload_', 'temp_', ''];
    const suffixes = ['', '_copy', '_1', '_2'];
    
    for (const prefix of prefixes) {
      for (const suffix of suffixes) {
        const variation = `${prefix}${name}${suffix}${ext}`;
        variations.push(path.join(os.tmpdir(), variation));
        variations.push(path.join(this.defaultDownloadsPath, variation));
        
        if (dirname !== '.') {
          variations.push(path.join(dirname, variation));
        }
      }
    }
    
    return variations;
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
   * Enable or disable diagnostics mode
   */
  public setDiagnosticsEnabled(enabled: boolean): void {
    this.diagnosticsEnabled = enabled;
    console.log(`🔧 Excel MCP: Diagnostics ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  /**
   * Test file path resolution with various scenarios
   */
  public async testPathResolution(testPaths: string[], sessionId?: string): Promise<{
    results: Array<{
      inputPath: string;
      resolvedPath: string;
      exists: boolean;
      method: string;
      error?: string;
    }>;
    summary: {
      total: number;
      resolved: number;
      existing: number;
    };
  }> {
    console.log(`🧪 Excel MCP: Testing path resolution for ${testPaths.length} paths...`);
    
    const results = [];
    let resolved = 0;
    let existing = 0;
    
    for (const inputPath of testPaths) {
      try {
        const resolvedPath = await this.resolvePath(inputPath, { sessionId });
        const exists = fs.existsSync(resolvedPath);
        
        results.push({
          inputPath,
          resolvedPath,
          exists,
          method: 'resolvePath'
        });
        
        resolved++;
        if (exists) existing++;
      } catch (error) {
        results.push({
          inputPath,
          resolvedPath: '',
          exists: false,
          method: 'error',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    const summary = {
      total: testPaths.length,
      resolved,
      existing
    };
    
    console.log(`📊 Excel MCP: Path resolution test completed:`, summary);
    return { results, summary };
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
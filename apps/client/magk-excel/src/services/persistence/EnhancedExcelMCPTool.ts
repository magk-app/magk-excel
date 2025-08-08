/**
 * Enhanced Excel MCP Tool - Integrates with Unified Persistence Service
 * 
 * This tool extends the existing Excel MCP functionality with comprehensive
 * persistence integration, automatic file management, and lifecycle handling.
 */

import { excelService, type ExcelOperationResult } from '../excel/ExcelService';
import { unifiedPersistenceService } from './UnifiedPersistenceService';
import { useFilePersistenceStore } from '../../stores/filePersistenceStore';

export interface ExcelMCPToolCall {
  name: string;
  arguments: Record<string, any>;
}

export interface ExcelMCPToolResult {
  success: boolean;
  data?: any;
  error?: string;
  fileId?: string;
  downloadUrl?: string;
  persistenceInfo?: {
    layer: string;
    fileId: string;
    version?: number;
    persistent: boolean;
  };
}

export class EnhancedExcelMCPTool {
  /**
   * Handle Excel MCP tool calls with persistence integration
   */
  static async handleToolCall(toolCall: ExcelMCPToolCall): Promise<ExcelMCPToolResult> {
    const { name, arguments: args } = toolCall;

    try {
      console.log(`🔧 Enhanced Excel MCP Tool: ${name}`, args);

      switch (name) {
        case 'excel_create_and_store':
          return await this.createAndStoreExcel(args);
          
        case 'excel_read_from_storage':
          return await this.readExcelFromStorage(args);
          
        case 'excel_update_stored':
          return await this.updateStoredExcel(args);
          
        case 'excel_export_formats':
          return await this.exportToMultipleFormats(args);
          
        case 'excel_batch_process':
          return await this.batchProcessFiles(args);
          
        case 'excel_template_create':
          return await this.createFromTemplate(args);
          
        case 'excel_merge_files':
          return await this.mergeExcelFiles(args);
          
        case 'excel_analysis_report':
          return await this.generateAnalysisReport(args);
          
        default:
          // Fall back to standard Excel service for basic operations
          return await this.handleStandardExcelOperation(toolCall);
      }
    } catch (error) {
      console.error(`❌ Enhanced Excel MCP Tool Error (${name}):`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Create Excel file and store with persistence strategy
   */
  private static async createAndStoreExcel(args: {
    data: any[][];
    fileName: string;
    headers?: string[];
    sheetName?: string;
    sessionId: string;
    persistent?: boolean;
    description?: string;
    tags?: string[];
    autoVersion?: boolean;
  }): Promise<ExcelMCPToolResult> {
    const {
      data,
      fileName,
      headers,
      sheetName,
      sessionId,
      persistent = false,
      description,
      tags = ['excel', 'generated'],
      autoVersion = true
    } = args;

    // Create and store Excel using unified persistence service
    const result = await unifiedPersistenceService.createAndStoreExcel(data, {
      fileName: fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`,
      headers,
      sheetName,
      sessionId,
      layer: persistent ? 'persistent' : 'temporary',
      description,
      tags
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error
      };
    }

    return {
      success: true,
      data: {
        fileName,
        rowCount: data.length,
        columnCount: data[0]?.length || 0,
        headers,
        sheetName: sheetName || 'Sheet1'
      },
      fileId: result.fileId,
      downloadUrl: result.downloadUrl,
      persistenceInfo: {
        layer: persistent ? 'persistent' : 'temporary',
        fileId: result.fileId!,
        persistent
      }
    };
  }

  /**
   * Read Excel file from storage
   */
  private static async readExcelFromStorage(args: {
    fileId: string;
    sheetName?: string;
    version?: number;
    range?: string;
  }): Promise<ExcelMCPToolResult> {
    const { fileId, sheetName, version, range } = args;

    // Retrieve file from persistence service
    const retrieveResult = await unifiedPersistenceService.retrieveFile(fileId, {
      version,
      asBuffer: true
    });

    if (!retrieveResult.success || !retrieveResult.buffer) {
      return {
        success: false,
        error: retrieveResult.error || 'Failed to retrieve file'
      };
    }

    // Create temporary file for Excel service to read
    const tempFilePath = `/tmp/excel_${fileId}_${Date.now()}.xlsx`;
    
    try {
      // For browser environment, we'll need to use Excel service buffer methods
      // This is a simplified approach - in production, you'd use proper temp file handling
      const workbook = await import('exceljs');
      const wb = new workbook.Workbook();
      await wb.xlsx.load(retrieveResult.buffer);

      const worksheet = sheetName ? wb.getWorksheet(sheetName) : wb.getWorksheet(1);
      if (!worksheet) {
        return {
          success: false,
          error: `Worksheet not found: ${sheetName || 'Sheet 1'}`
        };
      }

      // Extract data
      const data: any[][] = [];
      let rowCount = 0;
      let colCount = 0;

      worksheet.eachRow((row, rowNumber) => {
        const rowData: any[] = [];
        row.eachCell((cell, colNumber) => {
          rowData[colNumber - 1] = cell.value;
          colCount = Math.max(colCount, colNumber);
        });
        data.push(rowData);
        rowCount++;
      });

      return {
        success: true,
        data: {
          rows: data,
          rowCount,
          columnCount: colCount,
          sheetName: worksheet.name,
          fileName: retrieveResult.file?.name
        },
        fileId,
        persistenceInfo: {
          layer: retrieveResult.file?.isPersistent ? 'persistent' : 'temporary',
          fileId,
          version,
          persistent: retrieveResult.file?.isPersistent || false
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to read Excel data'
      };
    }
  }

  /**
   * Update stored Excel file with versioning
   */
  private static async updateStoredExcel(args: {
    fileId: string;
    data?: any[][];
    headers?: string[];
    sheetName?: string;
    sessionId: string;
    changes?: string;
    createVersion?: boolean;
  }): Promise<ExcelMCPToolResult> {
    const { fileId, data, headers, sheetName, sessionId, changes, createVersion = true } = args;

    try {
      // Get existing file
      const retrieveResult = await unifiedPersistenceService.retrieveFile(fileId);
      if (!retrieveResult.success || !retrieveResult.file) {
        return {
          success: false,
          error: 'File not found for update'
        };
      }

      const existingFile = retrieveResult.file;

      // If data provided, create new Excel with updated data
      if (data) {
        const excelResult = await excelService.createExcelBuffer({
          data,
          headers,
          sheetName
        });

        if (!excelResult.success || !excelResult.fileContent) {
          return {
            success: false,
            error: excelResult.error
          };
        }

        // Create new File object
        const blob = new Blob([excelResult.fileContent], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        
        const updatedFile = new File([blob], existingFile.name, {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        // Store updated version
        const storeResult = await unifiedPersistenceService.storeFile(updatedFile, {
          sessionId,
          layer: existingFile.isPersistent ? 'persistent' : 'temporary',
          generateVersion: createVersion,
          description: changes || 'File updated'
        });

        if (!storeResult.success) {
          return {
            success: false,
            error: storeResult.error
          };
        }

        return {
          success: true,
          data: {
            updated: true,
            version: storeResult.version,
            rowCount: data.length,
            columnCount: data[0]?.length || 0
          },
          fileId: storeResult.fileId,
          persistenceInfo: {
            layer: existingFile.isPersistent ? 'persistent' : 'temporary',
            fileId: storeResult.fileId!,
            version: storeResult.version,
            persistent: existingFile.isPersistent
          }
        };
      }

      return {
        success: false,
        error: 'No update data provided'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Update failed'
      };
    }
  }

  /**
   * Export to multiple formats (Excel, CSV, JSON)
   */
  private static async exportToMultipleFormats(args: {
    fileId: string;
    formats: ('xlsx' | 'csv' | 'json')[];
    sessionId: string;
  }): Promise<ExcelMCPToolResult> {
    const { fileId, formats, sessionId } = args;

    try {
      // Get the source data
      const readResult = await this.readExcelFromStorage({ fileId });
      if (!readResult.success || !readResult.data) {
        return {
          success: false,
          error: 'Failed to read source file'
        };
      }

      const { rows, fileName } = readResult.data;
      const baseName = fileName?.replace(/\.[^/.]+$/, '') || 'export';
      const exports: any[] = [];

      for (const format of formats) {
        try {
          let result;
          const exportFileName = `${baseName}.${format}`;

          switch (format) {
            case 'xlsx':
              result = await excelService.createDownloadableContent(rows, 'xlsx', {
                fileName: exportFileName
              });
              break;
            case 'csv':
              result = await excelService.createDownloadableContent(rows, 'csv', {
                fileName: exportFileName
              });
              break;
            case 'json':
              const jsonContent = JSON.stringify(rows, null, 2);
              const jsonBlob = new Blob([jsonContent], { type: 'application/json' });
              const jsonFile = new File([jsonBlob], exportFileName, { type: 'application/json' });
              
              const storeResult = await unifiedPersistenceService.storeFile(jsonFile, {
                sessionId,
                layer: 'temporary',
                description: `JSON export of ${fileName}`,
                tags: ['export', 'json']
              });
              
              result = {
                success: storeResult.success,
                fileId: storeResult.fileId,
                error: storeResult.error
              };
              break;
          }

          if (result?.success) {
            exports.push({
              format,
              fileName: exportFileName,
              fileId: result.fileId,
              success: true
            });
          } else {
            exports.push({
              format,
              fileName: exportFileName,
              success: false,
              error: result?.error
            });
          }
        } catch (error) {
          exports.push({
            format,
            fileName: `${baseName}.${format}`,
            success: false,
            error: error instanceof Error ? error.message : 'Export failed'
          });
        }
      }

      const successCount = exports.filter(e => e.success).length;

      return {
        success: successCount > 0,
        data: {
          exports,
          successCount,
          totalCount: formats.length
        },
        error: successCount === 0 ? 'All exports failed' : undefined
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export process failed'
      };
    }
  }

  /**
   * Batch process multiple files
   */
  private static async batchProcessFiles(args: {
    fileIds: string[];
    operation: 'merge' | 'convert' | 'analyze';
    sessionId: string;
    outputFileName?: string;
  }): Promise<ExcelMCPToolResult> {
    const { fileIds, operation, sessionId, outputFileName } = args;

    try {
      const results = [];
      
      for (const fileId of fileIds) {
        const readResult = await this.readExcelFromStorage({ fileId });
        if (readResult.success && readResult.data) {
          results.push({
            fileId,
            fileName: readResult.data.fileName,
            data: readResult.data.rows,
            success: true
          });
        } else {
          results.push({
            fileId,
            success: false,
            error: readResult.error
          });
        }
      }

      const successResults = results.filter(r => r.success);
      
      if (successResults.length === 0) {
        return {
          success: false,
          error: 'No files could be processed'
        };
      }

      // Perform batch operation
      let finalResult;
      
      switch (operation) {
        case 'merge':
          const mergedData = successResults.reduce((acc: any[][], result: any) => {
            return [...acc, ...result.data];
          }, []);
          
          finalResult = await this.createAndStoreExcel({
            data: mergedData,
            fileName: outputFileName || `merged_${Date.now()}.xlsx`,
            sessionId,
            description: `Merged from ${successResults.length} files`,
            tags: ['merged', 'batch'],
            persistent: true
          });
          break;
          
        case 'analyze':
          const analysis = {
            totalFiles: successResults.length,
            totalRows: successResults.reduce((sum: number, r: any) => sum + r.data.length, 0),
            averageRows: Math.round(successResults.reduce((sum: number, r: any) => sum + r.data.length, 0) / successResults.length),
            files: successResults.map((r: any) => ({
              fileName: r.fileName,
              rowCount: r.data.length,
              columnCount: r.data[0]?.length || 0
            }))
          };
          
          finalResult = {
            success: true,
            data: analysis
          };
          break;
          
        default:
          finalResult = {
            success: false,
            error: `Unsupported batch operation: ${operation}`
          };
      }

      return {
        success: finalResult.success,
        data: {
          batchOperation: operation,
          processedFiles: successResults.length,
          totalFiles: fileIds.length,
          results,
          ...finalResult.data
        },
        fileId: finalResult.fileId,
        error: finalResult.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Batch processing failed'
      };
    }
  }

  /**
   * Create Excel from template
   */
  private static async createFromTemplate(args: {
    templateName: string;
    data: any[][];
    fileName: string;
    sessionId: string;
    variables?: Record<string, any>;
  }): Promise<ExcelMCPToolResult> {
    // Template system would be more complex in real implementation
    const templates = {
      'report': {
        headers: ['Date', 'Item', 'Quantity', 'Amount'],
        formatting: true
      },
      'inventory': {
        headers: ['SKU', 'Product Name', 'Category', 'Stock', 'Price'],
        formatting: true
      },
      'financial': {
        headers: ['Account', 'Description', 'Debit', 'Credit', 'Balance'],
        formatting: true
      }
    };

    const template = templates[args.templateName as keyof typeof templates];
    if (!template) {
      return {
        success: false,
        error: `Template not found: ${args.templateName}`
      };
    }

    return await this.createAndStoreExcel({
      data: args.data,
      fileName: args.fileName,
      headers: template.headers,
      sessionId: args.sessionId,
      description: `Created from ${args.templateName} template`,
      tags: ['template', args.templateName],
      persistent: true
    });
  }

  /**
   * Merge multiple Excel files
   */
  private static async mergeExcelFiles(args: {
    fileIds: string[];
    outputFileName: string;
    sessionId: string;
    mergeStrategy: 'append' | 'side-by-side' | 'sheets';
  }): Promise<ExcelMCPToolResult> {
    return await this.batchProcessFiles({
      fileIds: args.fileIds,
      operation: 'merge',
      sessionId: args.sessionId,
      outputFileName: args.outputFileName
    });
  }

  /**
   * Generate analysis report
   */
  private static async generateAnalysisReport(args: {
    fileIds: string[];
    sessionId: string;
    includeCharts?: boolean;
  }): Promise<ExcelMCPToolResult> {
    return await this.batchProcessFiles({
      fileIds: args.fileIds,
      operation: 'analyze',
      sessionId: args.sessionId
    });
  }

  /**
   * Handle standard Excel operations and add persistence
   */
  private static async handleStandardExcelOperation(toolCall: ExcelMCPToolCall): Promise<ExcelMCPToolResult> {
    // This would delegate to the existing Excel MCP tool
    // but add persistence layer on top
    return {
      success: false,
      error: 'Standard Excel operation not implemented in enhanced tool'
    };
  }

  /**
   * Get available tool definitions
   */
  static getToolDefinitions() {
    return [
      {
        name: 'excel_create_and_store',
        description: 'Create Excel file and store with persistence strategy',
        inputSchema: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              description: '2D array of data to store in Excel'
            },
            fileName: {
              type: 'string',
              description: 'Name for the Excel file'
            },
            headers: {
              type: 'array',
              items: { type: 'string' },
              description: 'Column headers'
            },
            sheetName: {
              type: 'string',
              description: 'Name of the worksheet'
            },
            sessionId: {
              type: 'string',
              description: 'Current session ID'
            },
            persistent: {
              type: 'boolean',
              description: 'Whether to store persistently'
            },
            description: {
              type: 'string',
              description: 'Description of the file'
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Tags for categorization'
            }
          },
          required: ['data', 'fileName', 'sessionId']
        }
      },
      {
        name: 'excel_read_from_storage',
        description: 'Read Excel file from persistent storage',
        inputSchema: {
          type: 'object',
          properties: {
            fileId: {
              type: 'string',
              description: 'ID of the stored file'
            },
            sheetName: {
              type: 'string',
              description: 'Name of sheet to read'
            },
            version: {
              type: 'number',
              description: 'Specific version to read'
            }
          },
          required: ['fileId']
        }
      },
      {
        name: 'excel_update_stored',
        description: 'Update stored Excel file with versioning',
        inputSchema: {
          type: 'object',
          properties: {
            fileId: {
              type: 'string',
              description: 'ID of the file to update'
            },
            data: {
              type: 'array',
              description: 'New data for the file'
            },
            sessionId: {
              type: 'string',
              description: 'Current session ID'
            },
            changes: {
              type: 'string',
              description: 'Description of changes made'
            }
          },
          required: ['fileId', 'sessionId']
        }
      },
      {
        name: 'excel_export_formats',
        description: 'Export Excel file to multiple formats',
        inputSchema: {
          type: 'object',
          properties: {
            fileId: {
              type: 'string',
              description: 'ID of the source file'
            },
            formats: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['xlsx', 'csv', 'json']
              },
              description: 'Formats to export to'
            },
            sessionId: {
              type: 'string',
              description: 'Current session ID'
            }
          },
          required: ['fileId', 'formats', 'sessionId']
        }
      },
      {
        name: 'excel_batch_process',
        description: 'Process multiple Excel files in batch',
        inputSchema: {
          type: 'object',
          properties: {
            fileIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of file IDs to process'
            },
            operation: {
              type: 'string',
              enum: ['merge', 'convert', 'analyze'],
              description: 'Batch operation to perform'
            },
            sessionId: {
              type: 'string',
              description: 'Current session ID'
            },
            outputFileName: {
              type: 'string',
              description: 'Name for output file'
            }
          },
          required: ['fileIds', 'operation', 'sessionId']
        }
      }
    ];
  }
}

// Export singleton instance
export const enhancedExcelMCPTool = {
  getToolDefinitions: EnhancedExcelMCPTool.getToolDefinitions,
  handleToolCall: EnhancedExcelMCPTool.handleToolCall
};
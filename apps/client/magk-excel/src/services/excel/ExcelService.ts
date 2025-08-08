/**
 * Excel Service using ExcelJS
 * Provides comprehensive Excel file operations for the MAGK Excel application
 */

import ExcelJS from 'exceljs';

// Renderer-safe helpers to access Electron file APIs when available
function hasFileAPI(): boolean {
  return typeof window !== 'undefined' && typeof (window as any).fileAPI !== 'undefined';
}

function isRenderer(): boolean {
  return typeof window !== 'undefined';
}

async function readFileBase64(fileName: string, subDir?: string): Promise<string | null> {
  if (!hasFileAPI()) return null;
  const result = await (window as any).fileAPI.readPersistentFile(fileName, subDir);
  return result?.success && result.content ? result.content : null;
}

async function writeFileFromBuffer(
  fileName: string,
  buffer: ArrayBuffer | Buffer,
  mimeType: string,
  subDir?: string
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  if (!hasFileAPI()) return { success: false, error: 'File API not available in this environment' };
  const base64 = Buffer.from(buffer as ArrayBuffer).toString('base64');
  return (window as any).fileAPI.writePersistentFile(fileName, `data:${mimeType};base64,${base64}`, subDir);
}

export interface ExcelReadOptions {
  filePath: string;
  sheetName?: string;
  range?: string;
  includeHeaders?: boolean;
}

export interface ExcelWriteOptions {
  filePath: string;
  sheetName?: string;
  data: any[][];
  headers?: string[];
  overwrite?: boolean;
}

export interface ExcelFormatOptions {
  filePath: string;
  sheetName?: string;
  range?: string;
  format: {
    font?: Partial<ExcelJS.Font>;
    fill?: Partial<ExcelJS.Fill>;
    border?: Partial<ExcelJS.Borders>;
    alignment?: Partial<ExcelJS.Alignment>;
    numberFormat?: string;
  };
}

export interface ExcelCalculateOptions {
  filePath: string;
  sheetName?: string;
  formula: string;
  cell?: string;
}

export interface ExcelOperationResult {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
  filePath?: string;
  rowsAffected?: number;
  columnsAffected?: number;
  fileContent?: Buffer;
  mimeType?: string;
  fileName?: string;
  size?: number;
}

export class ExcelService {
  private workbook: ExcelJS.Workbook;

  constructor() {
    this.workbook = new ExcelJS.Workbook();
  }

  /**
   * Read data from an Excel file
   */
  async readExcel(options: ExcelReadOptions): Promise<ExcelOperationResult> {
    try {
      console.log('📖 Reading Excel file:', options.filePath);

      // Renderer/browser via fileAPI; Node/Electron-main via direct disk access
      if (hasFileAPI()) {
        const base64 = await readFileBase64(options.filePath);
        if (!base64) {
          return { success: false, error: `File not found: ${options.filePath}` };
        }
        const buffer = Buffer.from(base64, 'base64');
        await this.workbook.xlsx.load(buffer);
      } else {
        await this.workbook.xlsx.readFile(options.filePath);
      }

      // Get the worksheet
      const worksheet = options.sheetName 
        ? this.workbook.getWorksheet(options.sheetName)
        : this.workbook.getWorksheet(1);

      if (!worksheet) {
        return {
          success: false,
          error: `Worksheet not found: ${options.sheetName || 'Sheet 1'}`
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

      console.log(`✅ Successfully read ${rowCount} rows and ${colCount} columns`);

      return {
        success: true,
        data: data,
        message: `Successfully read ${rowCount} rows and ${colCount} columns`,
        rowsAffected: rowCount,
        columnsAffected: colCount,
        filePath: options.filePath
      };

    } catch (error) {
      console.error('❌ Error reading Excel file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Write data to an Excel file
   */
  async writeExcel(options: ExcelWriteOptions): Promise<ExcelOperationResult> {
    try {
      console.log('📝 Writing Excel file:', options.filePath);

      // Create a new workbook or reset for overwrite
      this.workbook = new ExcelJS.Workbook();

      // Get or create worksheet
      let worksheet = this.workbook.getWorksheet(options.sheetName || 'Sheet1');
      if (!worksheet) {
        worksheet = this.workbook.addWorksheet(options.sheetName || 'Sheet1');
      }

      // Clear existing data if overwriting
      if (options.overwrite) {
        worksheet.spliceRows(1, worksheet.rowCount);
      }

      // Add headers if provided
      let startRow = 1;
      if (options.headers) {
        worksheet.addRow(options.headers);
        startRow = 2;
        
        // Format headers
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true };
        headerRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
      }

      // Add data rows
      options.data.forEach((rowData, index) => {
        worksheet.addRow(rowData);
      });

      // Auto-fit columns
      worksheet.columns.forEach((column, index) => {
        let maxLength = 0;
        column.eachCell?.({ includeEmpty: true }, (cell) => {
          const cellValue = cell.value ? cell.value.toString() : '';
          maxLength = Math.max(maxLength, cellValue.length);
        });
        column.width = Math.min(Math.max(maxLength + 2, 10), 50);
      });

      // Save the file: renderer via fileAPI, Node/Electron via direct write
      if (hasFileAPI()) {
        const arrayBuffer = await this.workbook.xlsx.writeBuffer();
        const writeResult = await writeFileFromBuffer(
          options.filePath,
          arrayBuffer,
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        if (!writeResult.success) {
          return { success: false, error: writeResult.error || 'Failed to save file' };
        }
      } else {
        await this.workbook.xlsx.writeFile(options.filePath);
      }

      console.log(`✅ Successfully wrote ${options.data.length} rows to Excel file`);

      return {
        success: true,
        message: `Successfully wrote ${options.data.length} rows to ${options.filePath}`,
        filePath: options.filePath,
        rowsAffected: options.data.length,
        columnsAffected: options.data[0]?.length || 0
      };

    } catch (error) {
      console.error('❌ Error writing Excel file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Format cells in an Excel file
   */
  async formatExcel(options: ExcelFormatOptions): Promise<ExcelOperationResult> {
    try {
      console.log('🎨 Formatting Excel file:', options.filePath);

      // Load the workbook
      await this.workbook.xlsx.readFile(options.filePath);

      // Get the worksheet
      const worksheet = options.sheetName 
        ? this.workbook.getWorksheet(options.sheetName)
        : this.workbook.getWorksheet(1);

      if (!worksheet) {
        return {
          success: false,
          error: `Worksheet not found: ${options.sheetName || 'Sheet 1'}`
        };
      }

      let cellsFormatted = 0;

      if (options.range) {
        // Format specific range
        const range = worksheet.getCell(options.range);
        Object.assign(range, options.format);
        cellsFormatted = 1;
      } else {
        // Format all cells with data
        worksheet.eachRow((row) => {
          row.eachCell((cell) => {
            Object.assign(cell, options.format);
            cellsFormatted++;
          });
        });
      }

      // Save the file
      if (hasFileAPI()) {
        const arrayBuffer = await this.workbook.xlsx.writeBuffer();
        const writeResult = await writeFileFromBuffer(
          options.filePath,
          arrayBuffer,
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        if (!writeResult.success) {
          return { success: false, error: writeResult.error || 'Failed to save file' };
        }
      } else {
        await this.workbook.xlsx.writeFile(options.filePath);
      }

      console.log(`✅ Successfully formatted ${cellsFormatted} cells`);

      return {
        success: true,
        message: `Successfully formatted ${cellsFormatted} cells`,
        filePath: options.filePath,
        rowsAffected: cellsFormatted
      };

    } catch (error) {
      console.error('❌ Error formatting Excel file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Perform calculations in an Excel file
   */
  async calculateExcel(options: ExcelCalculateOptions): Promise<ExcelOperationResult> {
    try {
      console.log('🧮 Performing calculation in Excel file:', options.filePath);

      // Load workbook
      if (hasFileAPI()) {
        const base64 = await readFileBase64(options.filePath);
        if (!base64) {
          return { success: false, error: `File not found: ${options.filePath}` };
        }
        const buffer = Buffer.from(base64, 'base64');
        await this.workbook.xlsx.load(buffer);
      } else {
        await this.workbook.xlsx.readFile(options.filePath);
      }

      // Get the worksheet
      const worksheet = options.sheetName 
        ? this.workbook.getWorksheet(options.sheetName)
        : this.workbook.getWorksheet(1);

      if (!worksheet) {
        return {
          success: false,
          error: `Worksheet not found: ${options.sheetName || 'Sheet 1'}`
        };
      }

      // Set formula in specified cell or find next available cell
      const targetCell = options.cell || 'A1';
      const cell = worksheet.getCell(targetCell);
      
      // Set the formula
      cell.value = { formula: options.formula };

      // Save the file
      if (hasFileAPI()) {
        const arrayBuffer = await this.workbook.xlsx.writeBuffer();
        const writeResult = await writeFileFromBuffer(
          options.filePath,
          arrayBuffer,
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        if (!writeResult.success) {
          return { success: false, error: writeResult.error || 'Failed to save file' };
        }
      } else {
        await this.workbook.xlsx.writeFile(options.filePath);
      }

      console.log(`✅ Successfully added formula ${options.formula} to cell ${targetCell}`);

      return {
        success: true,
        message: `Successfully added formula to cell ${targetCell}`,
        data: { formula: options.formula, cell: targetCell },
        filePath: options.filePath
      };

    } catch (error) {
      console.error('❌ Error performing calculation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Create a new Excel file with sample data
   */
  async createSampleExcel(filePath: string, data?: any[][]): Promise<ExcelOperationResult> {
    const sampleData = data || [
      ['Name', 'Age', 'City', 'Salary'],
      ['John Doe', 30, 'New York', 75000],
      ['Jane Smith', 25, 'Los Angeles', 65000],
      ['Bob Johnson', 35, 'Chicago', 80000],
      ['Alice Brown', 28, 'Houston', 70000]
    ];

    return this.writeExcel({
      filePath,
      data: sampleData.slice(1), // Data without headers
      headers: sampleData[0], // First row as headers
      overwrite: true
    });
  }

  /**
   * Get workbook information
   */
  async getWorkbookInfo(filePath: string): Promise<ExcelOperationResult> {
    try {
      await this.workbook.xlsx.readFile(filePath);
      
      const worksheets = this.workbook.worksheets.map(ws => ({
        name: ws.name,
        rowCount: ws.rowCount,
        columnCount: ws.columnCount,
        id: ws.id
      }));

      return {
        success: true,
        data: {
          creator: this.workbook.creator,
          lastModifiedBy: this.workbook.lastModifiedBy,
          created: this.workbook.created,
          modified: this.workbook.modified,
          worksheets
        },
        message: `Workbook contains ${worksheets.length} worksheets`
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Create Excel file in memory and return as buffer for download
   */
  async createExcelBuffer(options: Omit<ExcelWriteOptions, 'filePath'>): Promise<ExcelOperationResult> {
    try {
      console.log('📝 Creating Excel buffer in memory');

      // Create a new workbook
      const workbook = new ExcelJS.Workbook();
      
      // Get or create worksheet
      const worksheet = workbook.addWorksheet(options.sheetName || 'Sheet1');

      // Add headers if provided
      let startRow = 1;
      if (options.headers) {
        worksheet.addRow(options.headers);
        startRow = 2;
        
        // Format headers
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true };
        headerRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
      }

      // Add data rows
      options.data.forEach((rowData) => {
        worksheet.addRow(rowData);
      });

      // Auto-fit columns
      worksheet.columns.forEach((column) => {
        let maxLength = 0;
        column.eachCell?.({ includeEmpty: true }, (cell) => {
          const cellValue = cell.value ? cell.value.toString() : '';
          maxLength = Math.max(maxLength, cellValue.length);
        });
        column.width = Math.min(Math.max(maxLength + 2, 10), 50);
      });

      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer() as Buffer;
      const fileName = `excel_export_${Date.now()}.xlsx`;

      console.log(`✅ Successfully created Excel buffer (${buffer.length} bytes)`);

      return {
        success: true,
        message: `Successfully created Excel file with ${options.data.length} rows`,
        fileContent: buffer,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        fileName,
        size: buffer.length,
        rowsAffected: options.data.length,
        columnsAffected: options.data[0]?.length || 0
      };

    } catch (error) {
      console.error('❌ Error creating Excel buffer:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Convert data to CSV format
   */
  createCSVContent(data: any[][], headers?: string[]): string {
    let csvContent = '';
    
    // Add headers if provided
    if (headers) {
      csvContent += headers.map(header => `"${header.replace(/"/g, '""')}"`).join(',') + '\n';
    }
    
    // Add data rows
    data.forEach(row => {
      const csvRow = row.map(cell => {
        const cellValue = cell != null ? cell.toString() : '';
        return `"${cellValue.replace(/"/g, '""')}"`;
      }).join(',');
      csvContent += csvRow + '\n';
    });
    
    return csvContent;
  }

  /**
   * Create CSV file buffer for download
   */
  createCSVBuffer(data: any[][], headers?: string[]): ExcelOperationResult {
    try {
      const csvContent = this.createCSVContent(data, headers);
      const buffer = Buffer.from(csvContent, 'utf8');
      const fileName = `csv_export_${Date.now()}.csv`;

      return {
        success: true,
        message: `Successfully created CSV file with ${data.length} rows`,
        fileContent: buffer,
        mimeType: 'text/csv',
        fileName,
        size: buffer.length,
        rowsAffected: data.length,
        columnsAffected: data[0]?.length || 0
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create CSV'
      };
    }
  }

  /**
   * Create downloadable content from various data formats
   */
  async createDownloadableContent(
    data: any[], 
    format: 'xlsx' | 'csv' = 'xlsx',
    options?: {
      headers?: string[];
      sheetName?: string;
      fileName?: string;
    }
  ): Promise<ExcelOperationResult> {
    try {
      // Convert single-dimensional data to 2D if needed
      const processedData = Array.isArray(data[0]) ? data : data.map(item => 
        typeof item === 'object' ? Object.values(item) : [item]
      );

      // Generate headers from data if not provided
      const headers = options?.headers || (
        typeof data[0] === 'object' && !Array.isArray(data[0]) 
          ? Object.keys(data[0]) 
          : undefined
      );

      if (format === 'csv') {
        const result = this.createCSVBuffer(processedData, headers);
        if (options?.fileName) {
          result.fileName = options.fileName.endsWith('.csv') ? options.fileName : `${options.fileName}.csv`;
        }
        return result;
      } else {
        const result = await this.createExcelBuffer({
          data: processedData,
          headers,
          sheetName: options?.sheetName
        });
        if (options?.fileName) {
          result.fileName = options.fileName.endsWith('.xlsx') ? options.fileName : `${options.fileName}.xlsx`;
        }
        return result;
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create downloadable content'
      };
    }
  }
}

// Export singleton instance
export const excelService = new ExcelService();
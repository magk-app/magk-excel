/**
 * Excel Service using ExcelJS
 * Provides comprehensive Excel file operations for the MAGK Excel application
 */

import ExcelJS from 'exceljs';
import { promises as fs } from 'fs';
import path from 'path';

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

      // Check if file exists
      try {
        await fs.access(options.filePath);
      } catch {
        return {
          success: false,
          error: `File not found: ${options.filePath}`
        };
      }

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

      // Create a new workbook or load existing one
      if (!options.overwrite) {
        try {
          await fs.access(options.filePath);
          await this.workbook.xlsx.readFile(options.filePath);
        } catch {
          // File doesn't exist, create new workbook
          this.workbook = new ExcelJS.Workbook();
        }
      } else {
        this.workbook = new ExcelJS.Workbook();
      }

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

      // Ensure the directory exists
      const dir = path.dirname(options.filePath);
      await fs.mkdir(dir, { recursive: true });

      // Save the file
      await this.workbook.xlsx.writeFile(options.filePath);

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
      await this.workbook.xlsx.writeFile(options.filePath);

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

      // Set formula in specified cell or find next available cell
      const targetCell = options.cell || 'A1';
      const cell = worksheet.getCell(targetCell);
      
      // Set the formula
      cell.value = { formula: options.formula };

      // Save the file
      await this.workbook.xlsx.writeFile(options.filePath);

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
}

// Export singleton instance
export const excelService = new ExcelService();
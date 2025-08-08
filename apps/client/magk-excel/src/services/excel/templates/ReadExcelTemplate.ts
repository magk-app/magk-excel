import * as ExcelJS from 'exceljs';

/**
 * Template for reading Excel files with comprehensive data extraction
 * Supports various data types, cell formats, and structure analysis
 */
export class ReadExcelTemplate {
  private workbook: ExcelJS.Workbook;
  private worksheet: ExcelJS.Worksheet | null = null;

  constructor() {
    this.workbook = new ExcelJS.Workbook();
  }

  /**
   * Load Excel file from buffer or file path
   * @param source - Buffer or file path
   * @returns Promise resolving to workbook
   */
  async loadFile(source: Buffer | string): Promise<ExcelJS.Workbook> {
    try {
      if (typeof source === 'string') {
        await this.workbook.xlsx.readFile(source);
      } else {
        await this.workbook.xlsx.load(source);
      }
      return this.workbook;
    } catch (error) {
      throw new Error(`Failed to load Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get worksheet by name or index
   * @param identifier - Worksheet name or index (0-based)
   * @returns Worksheet instance
   */
  getWorksheet(identifier: string | number): ExcelJS.Worksheet {
    try {
      if (typeof identifier === 'string') {
        this.worksheet = this.workbook.getWorksheet(identifier);
      } else {
        this.worksheet = this.workbook.getWorksheet(identifier + 1); // ExcelJS uses 1-based indexing
      }
      
      if (!this.worksheet) {
        throw new Error(`Worksheet '${identifier}' not found`);
      }
      
      return this.worksheet;
    } catch (error) {
      throw new Error(`Failed to get worksheet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Read all data from worksheet as array of objects
   * @param worksheetIdentifier - Worksheet name or index
   * @param options - Reading options
   * @returns Array of row objects
   */
  async readAsObjects(
    worksheetIdentifier: string | number,
    options: {
      startRow?: number;
      endRow?: number;
      headers?: string[] | boolean;
      skipEmptyRows?: boolean;
    } = {}
  ): Promise<Record<string, any>[]> {
    try {
      const worksheet = this.getWorksheet(worksheetIdentifier);
      const {
        startRow = 1,
        endRow = worksheet.rowCount,
        headers = true,
        skipEmptyRows = true
      } = options;

      const data: Record<string, any>[] = [];
      let headerRow: string[] = [];

      // Get headers
      if (typeof headers === 'boolean' && headers) {
        const firstRow = worksheet.getRow(startRow);
        headerRow = firstRow.values as string[];
        headerRow.shift(); // Remove first empty element
      } else if (Array.isArray(headers)) {
        headerRow = headers;
      }

      const dataStartRow = typeof headers === 'boolean' && headers ? startRow + 1 : startRow;

      // Read data rows
      for (let rowNumber = dataStartRow; rowNumber <= endRow; rowNumber++) {
        const row = worksheet.getRow(rowNumber);
        
        if (skipEmptyRows && this.isEmptyRow(row)) {
          continue;
        }

        const rowData: Record<string, any> = {};
        const values = row.values as any[];

        if (headerRow.length > 0) {
          headerRow.forEach((header, index) => {
            const cellValue = values[index + 1]; // ExcelJS arrays are 1-based
            rowData[header] = this.processCellValue(cellValue);
          });
        } else {
          values.forEach((value, index) => {
            if (index > 0) { // Skip first empty element
              rowData[`column_${index}`] = this.processCellValue(value);
            }
          });
        }

        data.push(rowData);
      }

      return data;
    } catch (error) {
      throw new Error(`Failed to read worksheet as objects: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Read specific cell value
   * @param worksheetIdentifier - Worksheet name or index
   * @param cellAddress - Cell address (e.g., 'A1')
   * @returns Cell value
   */
  readCell(worksheetIdentifier: string | number, cellAddress: string): any {
    try {
      const worksheet = this.getWorksheet(worksheetIdentifier);
      const cell = worksheet.getCell(cellAddress);
      return this.processCellValue(cell.value);
    } catch (error) {
      throw new Error(`Failed to read cell ${cellAddress}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Read a range of cells
   * @param worksheetIdentifier - Worksheet name or index
   * @param range - Cell range (e.g., 'A1:C10')
   * @returns 2D array of cell values
   */
  readRange(worksheetIdentifier: string | number, range: string): any[][] {
    try {
      const worksheet = this.getWorksheet(worksheetIdentifier);
      const rangeData: any[][] = [];

      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        const rowData: any[] = [];
        row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
          rowData[colNumber - 1] = this.processCellValue(cell.value);
        });
        rangeData.push(rowData);
      });

      return rangeData;
    } catch (error) {
      throw new Error(`Failed to read range ${range}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get worksheet information
   * @param worksheetIdentifier - Worksheet name or index
   * @returns Worksheet metadata
   */
  getWorksheetInfo(worksheetIdentifier: string | number): {
    name: string;
    rowCount: number;
    columnCount: number;
    hasData: boolean;
  } {
    try {
      const worksheet = this.getWorksheet(worksheetIdentifier);
      return {
        name: worksheet.name,
        rowCount: worksheet.rowCount,
        columnCount: worksheet.columnCount,
        hasData: worksheet.rowCount > 0
      };
    } catch (error) {
      throw new Error(`Failed to get worksheet info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List all worksheets in the workbook
   * @returns Array of worksheet information
   */
  listWorksheets(): Array<{ id: number; name: string; rowCount: number; columnCount: number }> {
    return this.workbook.worksheets.map(worksheet => ({
      id: worksheet.id,
      name: worksheet.name,
      rowCount: worksheet.rowCount,
      columnCount: worksheet.columnCount
    }));
  }

  /**
   * Process cell value to handle different data types
   * @param value - Raw cell value
   * @returns Processed value
   */
  private processCellValue(value: any): any {
    if (value === null || value === undefined) {
      return null;
    }

    // Handle formula results
    if (typeof value === 'object' && 'result' in value) {
      return value.result;
    }

    // Handle dates
    if (value instanceof Date) {
      return value;
    }

    // Handle rich text
    if (typeof value === 'object' && 'richText' in value) {
      return value.richText.map((rt: any) => rt.text).join('');
    }

    return value;
  }

  /**
   * Check if a row is empty
   * @param row - ExcelJS row
   * @returns True if row is empty
   */
  private isEmptyRow(row: ExcelJS.Row): boolean {
    const values = row.values as any[];
    return values.length <= 1 || values.slice(1).every(value => 
      value === null || value === undefined || value === ''
    );
  }

  /**
   * Example usage for reading an Excel file
   */
  static async example(): Promise<void> {
    const reader = new ReadExcelTemplate();
    
    try {
      // Load file
      await reader.loadFile('data.xlsx');
      
      // List all worksheets
      const worksheets = reader.listWorksheets();
      console.log('Available worksheets:', worksheets);
      
      // Read first worksheet as objects
      const data = await reader.readAsObjects(0, {
        headers: true,
        skipEmptyRows: true
      });
      console.log('Data:', data);
      
      // Read specific cell
      const cellValue = reader.readCell(0, 'A1');
      console.log('Cell A1:', cellValue);
      
      // Get worksheet info
      const info = reader.getWorksheetInfo(0);
      console.log('Worksheet info:', info);
      
    } catch (error) {
      console.error('Error reading Excel file:', error);
    }
  }
}

export default ReadExcelTemplate;
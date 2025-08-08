import * as ExcelJS from 'exceljs';

/**
 * Template for creating new Excel files with comprehensive formatting and styling
 * Supports multiple worksheets, data types, and professional formatting
 */
export class WriteExcelTemplate {
  private workbook: ExcelJS.Workbook;
  private worksheet: ExcelJS.Worksheet | null = null;

  constructor() {
    this.workbook = new ExcelJS.Workbook();
    this.initializeWorkbook();
  }

  /**
   * Initialize workbook with metadata
   */
  private initializeWorkbook(): void {
    this.workbook.creator = 'MAGK Excel';
    this.workbook.lastModifiedBy = 'MAGK Excel';
    this.workbook.created = new Date();
    this.workbook.modified = new Date();
    this.workbook.properties.date1904 = false;
  }

  /**
   * Create a new worksheet
   * @param name - Worksheet name
   * @param options - Worksheet options
   * @returns Created worksheet
   */
  createWorksheet(
    name: string,
    options: {
      pageSetup?: Partial<ExcelJS.PageSetup>;
      headerFooter?: Partial<ExcelJS.HeaderFooter>;
      views?: ExcelJS.WorksheetView[];
    } = {}
  ): ExcelJS.Worksheet {
    try {
      this.worksheet = this.workbook.addWorksheet(name);
      
      // Apply page setup
      if (options.pageSetup) {
        Object.assign(this.worksheet.pageSetup, options.pageSetup);
      }
      
      // Apply header/footer
      if (options.headerFooter) {
        Object.assign(this.worksheet.headerFooter, options.headerFooter);
      }
      
      // Apply views
      if (options.views) {
        this.worksheet.views = options.views;
      }
      
      return this.worksheet;
    } catch (error) {
      throw new Error(`Failed to create worksheet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Write data from array of objects
   * @param worksheetName - Target worksheet name
   * @param data - Array of objects to write
   * @param options - Writing options
   */
  async writeFromObjects(
    worksheetName: string,
    data: Record<string, any>[],
    options: {
      startRow?: number;
      startColumn?: number;
      headers?: boolean;
      headerStyle?: Partial<ExcelJS.Style>;
      dataStyle?: Partial<ExcelJS.Style>;
      autoFitColumns?: boolean;
    } = {}
  ): Promise<void> {
    try {
      const {
        startRow = 1,
        startColumn = 1,
        headers = true,
        headerStyle,
        dataStyle,
        autoFitColumns = true
      } = options;

      let worksheet = this.workbook.getWorksheet(worksheetName);
      if (!worksheet) {
        worksheet = this.createWorksheet(worksheetName);
      }

      if (data.length === 0) {
        return;
      }

      const keys = Object.keys(data[0]);
      let currentRow = startRow;

      // Write headers
      if (headers) {
        const headerRow = worksheet.getRow(currentRow);
        keys.forEach((key, index) => {
          const cell = headerRow.getCell(startColumn + index);
          cell.value = key;
          
          if (headerStyle) {
            Object.assign(cell, headerStyle);
          } else {
            // Default header style
            cell.font = { bold: true };
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFE0E0E0' }
            };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          }
        });
        currentRow++;
      }

      // Write data
      for (const item of data) {
        const dataRow = worksheet.getRow(currentRow);
        keys.forEach((key, index) => {
          const cell = dataRow.getCell(startColumn + index);
          const value = this.processValueForCell(item[key]);
          cell.value = value;
          
          if (dataStyle) {
            Object.assign(cell, dataStyle);
          }
        });
        currentRow++;
      }

      // Auto-fit columns
      if (autoFitColumns) {
        this.autoFitColumns(worksheet, keys.length, startColumn);
      }

    } catch (error) {
      throw new Error(`Failed to write data from objects: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Write data from 2D array
   * @param worksheetName - Target worksheet name
   * @param data - 2D array of data
   * @param options - Writing options
   */
  async writeFromArray(
    worksheetName: string,
    data: any[][],
    options: {
      startRow?: number;
      startColumn?: number;
      headerRow?: number;
      headerStyle?: Partial<ExcelJS.Style>;
      dataStyle?: Partial<ExcelJS.Style>;
    } = {}
  ): Promise<void> {
    try {
      const {
        startRow = 1,
        startColumn = 1,
        headerRow,
        headerStyle,
        dataStyle
      } = options;

      let worksheet = this.workbook.getWorksheet(worksheetName);
      if (!worksheet) {
        worksheet = this.createWorksheet(worksheetName);
      }

      for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
        const excelRow = worksheet.getRow(startRow + rowIndex);
        const rowData = data[rowIndex];
        
        for (let colIndex = 0; colIndex < rowData.length; colIndex++) {
          const cell = excelRow.getCell(startColumn + colIndex);
          const value = this.processValueForCell(rowData[colIndex]);
          cell.value = value;
          
          // Apply header style
          if (headerRow === rowIndex && headerStyle) {
            Object.assign(cell, headerStyle);
          }
          // Apply data style
          else if (headerRow !== rowIndex && dataStyle) {
            Object.assign(cell, dataStyle);
          }
        }
      }

    } catch (error) {
      throw new Error(`Failed to write data from array: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Write single cell value
   * @param worksheetName - Target worksheet name
   * @param cellAddress - Cell address (e.g., 'A1')
   * @param value - Value to write
   * @param style - Cell style
   */
  writeCell(
    worksheetName: string,
    cellAddress: string,
    value: any,
    style?: Partial<ExcelJS.Style>
  ): void {
    try {
      let worksheet = this.workbook.getWorksheet(worksheetName);
      if (!worksheet) {
        worksheet = this.createWorksheet(worksheetName);
      }

      const cell = worksheet.getCell(cellAddress);
      cell.value = this.processValueForCell(value);
      
      if (style) {
        Object.assign(cell, style);
      }

    } catch (error) {
      throw new Error(`Failed to write cell ${cellAddress}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add formula to cell
   * @param worksheetName - Target worksheet name
   * @param cellAddress - Cell address
   * @param formula - Formula string
   * @param style - Cell style
   */
  addFormula(
    worksheetName: string,
    cellAddress: string,
    formula: string,
    style?: Partial<ExcelJS.Style>
  ): void {
    try {
      let worksheet = this.workbook.getWorksheet(worksheetName);
      if (!worksheet) {
        worksheet = this.createWorksheet(worksheetName);
      }

      const cell = worksheet.getCell(cellAddress);
      cell.value = { formula };
      
      if (style) {
        Object.assign(cell, style);
      }

    } catch (error) {
      throw new Error(`Failed to add formula to cell ${cellAddress}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Apply formatting to a range
   * @param worksheetName - Target worksheet name
   * @param range - Cell range (e.g., 'A1:C10')
   * @param style - Style to apply
   */
  formatRange(
    worksheetName: string,
    range: string,
    style: Partial<ExcelJS.Style>
  ): void {
    try {
      const worksheet = this.workbook.getWorksheet(worksheetName);
      if (!worksheet) {
        throw new Error(`Worksheet ${worksheetName} not found`);
      }

      const rangeObj = worksheet.getCell(range);
      if ('eachCell' in rangeObj) {
        // It's a range
        (rangeObj as any).eachCell((cell: ExcelJS.Cell) => {
          Object.assign(cell, style);
        });
      } else {
        // It's a single cell
        Object.assign(rangeObj, style);
      }

    } catch (error) {
      throw new Error(`Failed to format range ${range}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add table to worksheet
   * @param worksheetName - Target worksheet name
   * @param data - Table data
   * @param options - Table options
   */
  addTable(
    worksheetName: string,
    data: Record<string, any>[],
    options: {
      name?: string;
      ref?: string;
      headerRow?: boolean;
      style?: string;
      showRowStripes?: boolean;
      showColumnStripes?: boolean;
    } = {}
  ): void {
    try {
      let worksheet = this.workbook.getWorksheet(worksheetName);
      if (!worksheet) {
        worksheet = this.createWorksheet(worksheetName);
      }

      const {
        name = `Table${Date.now()}`,
        ref = 'A1',
        headerRow = true,
        style = 'TableStyleMedium2',
        showRowStripes = true,
        showColumnStripes = false
      } = options;

      // First write the data
      this.writeFromObjects(worksheetName, data, { headers: headerRow });

      // Calculate table range
      const keys = Object.keys(data[0] || {});
      const endColumn = String.fromCharCode(64 + keys.length); // Convert to column letter
      const endRow = data.length + (headerRow ? 1 : 0);
      const tableRef = `A1:${endColumn}${endRow}`;

      // Add table
      worksheet.addTable({
        name,
        ref: tableRef,
        headerRow,
        style: {
          theme: style,
          showRowStripes,
          showColumnStripes,
        },
        columns: keys.map(key => ({ name: key }))
      });

    } catch (error) {
      throw new Error(`Failed to add table: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Save workbook to buffer
   * @returns Buffer containing Excel file
   */
  async toBuffer(): Promise<Buffer> {
    try {
      return await this.workbook.xlsx.writeBuffer() as Buffer;
    } catch (error) {
      throw new Error(`Failed to create buffer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Save workbook to file
   * @param filename - Output filename
   */
  async saveToFile(filename: string): Promise<void> {
    try {
      await this.workbook.xlsx.writeFile(filename);
    } catch (error) {
      throw new Error(`Failed to save file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process value for writing to cell
   * @param value - Raw value
   * @returns Processed value
   */
  private processValueForCell(value: any): any {
    if (value === null || value === undefined) {
      return null;
    }

    // Handle dates
    if (value instanceof Date) {
      return value;
    }

    // Handle numbers
    if (typeof value === 'number') {
      return value;
    }

    // Handle booleans
    if (typeof value === 'boolean') {
      return value;
    }

    // Convert everything else to string
    return String(value);
  }

  /**
   * Auto-fit columns based on content
   * @param worksheet - Target worksheet
   * @param columnCount - Number of columns
   * @param startColumn - Starting column index
   */
  private autoFitColumns(worksheet: ExcelJS.Worksheet, columnCount: number, startColumn: number): void {
    for (let i = 0; i < columnCount; i++) {
      const column = worksheet.getColumn(startColumn + i);
      let maxLength = 0;
      
      column.eachCell({ includeEmpty: false }, (cell) => {
        const cellValue = cell.value?.toString() || '';
        maxLength = Math.max(maxLength, cellValue.length);
      });
      
      // Set width with some padding, max 50 characters
      column.width = Math.min(Math.max(maxLength + 2, 10), 50);
    }
  }

  /**
   * Example usage for creating an Excel file
   */
  static async example(): Promise<void> {
    const writer = new WriteExcelTemplate();
    
    try {
      // Sample data
      const salesData = [
        { Product: 'Laptop', Category: 'Electronics', Sales: 15000, Date: new Date('2024-01-15') },
        { Product: 'Phone', Category: 'Electronics', Sales: 12000, Date: new Date('2024-01-16') },
        { Product: 'Tablet', Category: 'Electronics', Sales: 8000, Date: new Date('2024-01-17') },
      ];

      // Write data with custom styling
      await writer.writeFromObjects('Sales Data', salesData, {
        headers: true,
        headerStyle: {
          font: { bold: true, color: { argb: 'FFFFFF' } },
          fill: {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '366092' }
          }
        },
        autoFitColumns: true
      });

      // Add summary formulas
      writer.addFormula('Sales Data', 'B6', 'SUM(C2:C4)', {
        font: { bold: true }
      });

      // Add a table
      writer.addTable('Summary', [
        { Metric: 'Total Sales', Value: 35000 },
        { Metric: 'Average Sale', Value: 11667 },
        { Metric: 'Product Count', Value: 3 }
      ]);

      // Save to file
      await writer.saveToFile('sales_report.xlsx');
      console.log('Excel file created successfully!');
      
    } catch (error) {
      console.error('Error creating Excel file:', error);
    }
  }
}

export default WriteExcelTemplate;
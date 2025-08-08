import * as ExcelJS from 'exceljs';

/**
 * Template for updating existing Excel files with data modifications, formatting, and structural changes
 * Supports cell updates, row/column operations, and preserving existing formatting
 */
export class UpdateExcelTemplate {
  private workbook: ExcelJS.Workbook;
  private worksheet: ExcelJS.Worksheet | null = null;

  constructor() {
    this.workbook = new ExcelJS.Workbook();
  }

  /**
   * Load existing Excel file for updating
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
      throw new Error(`Failed to load Excel file for updating: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get worksheet for updating
   * @param identifier - Worksheet name or index
   * @returns Worksheet instance
   */
  getWorksheet(identifier: string | number): ExcelJS.Worksheet {
    try {
      if (typeof identifier === 'string') {
        this.worksheet = this.workbook.getWorksheet(identifier);
      } else {
        this.worksheet = this.workbook.getWorksheet(identifier + 1);
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
   * Update single cell value
   * @param worksheetIdentifier - Worksheet name or index
   * @param cellAddress - Cell address (e.g., 'A1')
   * @param value - New value
   * @param preserveFormat - Whether to preserve existing formatting
   */
  updateCell(
    worksheetIdentifier: string | number,
    cellAddress: string,
    value: any,
    preserveFormat: boolean = true
  ): void {
    try {
      const worksheet = this.getWorksheet(worksheetIdentifier);
      const cell = worksheet.getCell(cellAddress);
      
      // Store existing format if needed
      const existingStyle = preserveFormat ? { ...cell.style } : null;
      
      // Update value
      cell.value = this.processValueForCell(value);
      
      // Restore formatting if requested
      if (preserveFormat && existingStyle) {
        Object.assign(cell, { style: existingStyle });
      }

    } catch (error) {
      throw new Error(`Failed to update cell ${cellAddress}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update multiple cells from object data
   * @param worksheetIdentifier - Worksheet name or index
   * @param updates - Array of cell updates
   * @param preserveFormat - Whether to preserve existing formatting
   */
  updateCells(
    worksheetIdentifier: string | number,
    updates: Array<{ cell: string; value: any; style?: Partial<ExcelJS.Style> }>,
    preserveFormat: boolean = true
  ): void {
    try {
      const worksheet = this.getWorksheet(worksheetIdentifier);
      
      for (const update of updates) {
        const cell = worksheet.getCell(update.cell);
        const existingStyle = preserveFormat ? { ...cell.style } : null;
        
        // Update value
        cell.value = this.processValueForCell(update.value);
        
        // Apply new style if provided, or preserve existing
        if (update.style) {
          Object.assign(cell, { style: update.style });
        } else if (preserveFormat && existingStyle) {
          Object.assign(cell, { style: existingStyle });
        }
      }

    } catch (error) {
      throw new Error(`Failed to update cells: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update entire row with new data
   * @param worksheetIdentifier - Worksheet name or index
   * @param rowNumber - Row number (1-based)
   * @param data - Array of cell values or object with column mappings
   * @param preserveFormat - Whether to preserve existing formatting
   */
  updateRow(
    worksheetIdentifier: string | number,
    rowNumber: number,
    data: any[] | Record<string, any>,
    options: {
      preserveFormat?: boolean;
      startColumn?: number;
      columnMapping?: Record<string, number>; // For object data: { fieldName: columnIndex }
    } = {}
  ): void {
    try {
      const { preserveFormat = true, startColumn = 1, columnMapping } = options;
      const worksheet = this.getWorksheet(worksheetIdentifier);
      const row = worksheet.getRow(rowNumber);
      
      if (Array.isArray(data)) {
        // Handle array data
        for (let i = 0; i < data.length; i++) {
          const cell = row.getCell(startColumn + i);
          const existingStyle = preserveFormat ? { ...cell.style } : null;
          
          cell.value = this.processValueForCell(data[i]);
          
          if (preserveFormat && existingStyle) {
            Object.assign(cell, { style: existingStyle });
          }
        }
      } else if (columnMapping) {
        // Handle object data with column mapping
        for (const [field, columnIndex] of Object.entries(columnMapping)) {
          if (field in data) {
            const cell = row.getCell(columnIndex);
            const existingStyle = preserveFormat ? { ...cell.style } : null;
            
            cell.value = this.processValueForCell(data[field]);
            
            if (preserveFormat && existingStyle) {
              Object.assign(cell, { style: existingStyle });
            }
          }
        }
      }

    } catch (error) {
      throw new Error(`Failed to update row ${rowNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Insert new row with data
   * @param worksheetIdentifier - Worksheet name or index
   * @param insertAtRow - Row number to insert at (1-based)
   * @param data - Row data
   * @param copyFormatFromRow - Row number to copy formatting from
   */
  insertRow(
    worksheetIdentifier: string | number,
    insertAtRow: number,
    data: any[],
    copyFormatFromRow?: number
  ): void {
    try {
      const worksheet = this.getWorksheet(worksheetIdentifier);
      
      // Insert the row
      worksheet.insertRow(insertAtRow, data.map(d => this.processValueForCell(d)));
      
      // Copy formatting if requested
      if (copyFormatFromRow) {
        const sourceRow = worksheet.getRow(copyFormatFromRow);
        const targetRow = worksheet.getRow(insertAtRow);
        
        sourceRow.eachCell((sourceCell, colNumber) => {
          const targetCell = targetRow.getCell(colNumber);
          if (sourceCell.style) {
            Object.assign(targetCell, { style: sourceCell.style });
          }
        });
      }

    } catch (error) {
      throw new Error(`Failed to insert row at ${insertAtRow}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete row
   * @param worksheetIdentifier - Worksheet name or index
   * @param rowNumber - Row number to delete (1-based)
   * @param deleteCount - Number of rows to delete
   */
  deleteRow(
    worksheetIdentifier: string | number,
    rowNumber: number,
    deleteCount: number = 1
  ): void {
    try {
      const worksheet = this.getWorksheet(worksheetIdentifier);
      worksheet.spliceRows(rowNumber, deleteCount);

    } catch (error) {
      throw new Error(`Failed to delete row ${rowNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update column with new data
   * @param worksheetIdentifier - Worksheet name or index
   * @param columnIdentifier - Column letter or number
   * @param data - Array of cell values
   * @param options - Update options
   */
  updateColumn(
    worksheetIdentifier: string | number,
    columnIdentifier: string | number,
    data: any[],
    options: {
      startRow?: number;
      preserveFormat?: boolean;
      skipHeader?: boolean;
    } = {}
  ): void {
    try {
      const { startRow = 1, preserveFormat = true, skipHeader = false } = options;
      const worksheet = this.getWorksheet(worksheetIdentifier);
      const column = worksheet.getColumn(columnIdentifier);
      
      const actualStartRow = skipHeader ? startRow + 1 : startRow;
      
      data.forEach((value, index) => {
        const rowNumber = actualStartRow + index;
        const cell = column.worksheet?.getCell(rowNumber, column.number!);
        
        if (cell) {
          const existingStyle = preserveFormat ? { ...cell.style } : null;
          cell.value = this.processValueForCell(value);
          
          if (preserveFormat && existingStyle) {
            Object.assign(cell, { style: existingStyle });
          }
        }
      });

    } catch (error) {
      throw new Error(`Failed to update column ${columnIdentifier}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Append new data to the end of existing data
   * @param worksheetIdentifier - Worksheet name or index
   * @param data - Array of objects or 2D array
   * @param options - Append options
   */
  appendData(
    worksheetIdentifier: string | number,
    data: Record<string, any>[] | any[][],
    options: {
      copyHeaderFormat?: boolean;
      copyDataFormat?: boolean;
      startColumn?: number;
    } = {}
  ): void {
    try {
      const { copyHeaderFormat = true, copyDataFormat = true, startColumn = 1 } = options;
      const worksheet = this.getWorksheet(worksheetIdentifier);
      
      // Find the last row with data
      let lastDataRow = 0;
      worksheet.eachRow((row, rowNumber) => {
        if (this.hasRowData(row)) {
          lastDataRow = rowNumber;
        }
      });
      
      const insertRow = lastDataRow + 1;
      
      if (Array.isArray(data[0])) {
        // Handle 2D array data
        const arrayData = data as any[][];
        arrayData.forEach((rowData, index) => {
          const row = worksheet.getRow(insertRow + index);
          rowData.forEach((cellValue, cellIndex) => {
            const cell = row.getCell(startColumn + cellIndex);
            cell.value = this.processValueForCell(cellValue);
            
            // Copy formatting from previous data row
            if (copyDataFormat && lastDataRow > 0) {
              const sourceCell = worksheet.getCell(lastDataRow, startColumn + cellIndex);
              if (sourceCell.style) {
                Object.assign(cell, { style: sourceCell.style });
              }
            }
          });
        });
      } else {
        // Handle object data
        const objectData = data as Record<string, any>[];
        const headers = Object.keys(objectData[0] || {});
        
        objectData.forEach((item, index) => {
          const row = worksheet.getRow(insertRow + index);
          headers.forEach((header, headerIndex) => {
            const cell = row.getCell(startColumn + headerIndex);
            cell.value = this.processValueForCell(item[header]);
            
            // Copy formatting from previous data row
            if (copyDataFormat && lastDataRow > 0) {
              const sourceCell = worksheet.getCell(lastDataRow, startColumn + headerIndex);
              if (sourceCell.style) {
                Object.assign(cell, { style: sourceCell.style });
              }
            }
          });
        });
      }

    } catch (error) {
      throw new Error(`Failed to append data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update formulas in a range
   * @param worksheetIdentifier - Worksheet name or index
   * @param updates - Array of formula updates
   */
  updateFormulas(
    worksheetIdentifier: string | number,
    updates: Array<{ cell: string; formula: string; style?: Partial<ExcelJS.Style> }>
  ): void {
    try {
      const worksheet = this.getWorksheet(worksheetIdentifier);
      
      for (const update of updates) {
        const cell = worksheet.getCell(update.cell);
        cell.value = { formula: update.formula };
        
        if (update.style) {
          Object.assign(cell, { style: update.style });
        }
      }

    } catch (error) {
      throw new Error(`Failed to update formulas: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clear content from range while preserving formatting
   * @param worksheetIdentifier - Worksheet name or index
   * @param range - Cell range to clear
   * @param clearFormat - Whether to also clear formatting
   */
  clearRange(
    worksheetIdentifier: string | number,
    range: string,
    clearFormat: boolean = false
  ): void {
    try {
      const worksheet = this.getWorksheet(worksheetIdentifier);
      const rangeObj = worksheet.getCell(range);
      
      if ('eachCell' in rangeObj) {
        (rangeObj as any).eachCell((cell: ExcelJS.Cell) => {
          cell.value = null;
          if (clearFormat) {
            cell.style = {};
          }
        });
      } else {
        rangeObj.value = null;
        if (clearFormat) {
          rangeObj.style = {};
        }
      }

    } catch (error) {
      throw new Error(`Failed to clear range ${range}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Save updated workbook to buffer
   * @returns Buffer containing updated Excel file
   */
  async toBuffer(): Promise<Buffer> {
    try {
      return await this.workbook.xlsx.writeBuffer() as Buffer;
    } catch (error) {
      throw new Error(`Failed to create buffer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Save updated workbook to file
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

    if (value instanceof Date) {
      return value;
    }

    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'boolean') {
      return value;
    }

    return String(value);
  }

  /**
   * Check if row has any data
   * @param row - ExcelJS row
   * @returns True if row has data
   */
  private hasRowData(row: ExcelJS.Row): boolean {
    const values = row.values as any[];
    return values.length > 1 && values.slice(1).some(value => 
      value !== null && value !== undefined && value !== ''
    );
  }

  /**
   * Example usage for updating an Excel file
   */
  static async example(): Promise<void> {
    const updater = new UpdateExcelTemplate();
    
    try {
      // Load existing file
      await updater.loadFile('existing_data.xlsx');
      
      // Update single cell
      updater.updateCell(0, 'A1', 'Updated Title');
      
      // Update multiple cells
      updater.updateCells(0, [
        { cell: 'B2', value: 25000 },
        { cell: 'B3', value: 30000 },
        { cell: 'B4', value: 18000 }
      ]);
      
      // Update entire row
      updater.updateRow(0, 5, ['New Product', 'Electronics', 15000, new Date()]);
      
      // Insert new row
      updater.insertRow(0, 3, ['Inserted Product', 'Category', 12000], 2);
      
      // Append new data
      updater.appendData(0, [
        { Product: 'Phone', Category: 'Electronics', Sales: 22000 },
        { Product: 'Tablet', Category: 'Electronics', Sales: 18000 }
      ]);
      
      // Update formulas
      updater.updateFormulas(0, [
        { cell: 'D10', formula: 'SUM(D2:D9)' },
        { cell: 'D11', formula: 'AVERAGE(D2:D9)' }
      ]);
      
      // Save updated file
      await updater.saveToFile('updated_data.xlsx');
      console.log('Excel file updated successfully!');
      
    } catch (error) {
      console.error('Error updating Excel file:', error);
    }
  }
}

export default UpdateExcelTemplate;
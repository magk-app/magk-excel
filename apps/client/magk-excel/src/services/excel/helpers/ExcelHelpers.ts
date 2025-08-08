import * as ExcelJS from 'exceljs';

/**
 * Common utility functions for Excel operations
 * Provides reusable helper methods for data processing, formatting, and validation
 */
export class ExcelHelpers {
  
  /**
   * Convert column letter to column number (A=1, B=2, etc.)
   * @param columnLetter - Column letter(s) like 'A', 'AB', 'AAA'
   * @returns Column number (1-based)
   */
  static columnLetterToNumber(columnLetter: string): number {
    let result = 0;
    const letters = columnLetter.toUpperCase();
    
    for (let i = 0; i < letters.length; i++) {
      result = result * 26 + (letters.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
    }
    
    return result;
  }

  /**
   * Convert column number to column letter (1=A, 2=B, etc.)
   * @param columnNumber - Column number (1-based)
   * @returns Column letter(s)
   */
  static columnNumberToLetter(columnNumber: number): string {
    let result = '';
    let num = columnNumber;
    
    while (num > 0) {
      num--;
      result = String.fromCharCode('A'.charCodeAt(0) + (num % 26)) + result;
      num = Math.floor(num / 26);
    }
    
    return result;
  }

  /**
   * Parse cell address into row and column components
   * @param cellAddress - Cell address like 'A1', 'B10', 'AB123'
   * @returns Object with row and column information
   */
  static parseCellAddress(cellAddress: string): {
    row: number;
    column: number;
    columnLetter: string;
  } {
    const match = cellAddress.match(/^([A-Z]+)(\d+)$/);
    
    if (!match) {
      throw new Error(`Invalid cell address: ${cellAddress}`);
    }
    
    const columnLetter = match[1];
    const row = parseInt(match[2], 10);
    const column = this.columnLetterToNumber(columnLetter);
    
    return { row, column, columnLetter };
  }

  /**
   * Generate cell address from row and column numbers
   * @param row - Row number (1-based)
   * @param column - Column number (1-based)
   * @returns Cell address like 'A1'
   */
  static createCellAddress(row: number, column: number): string {
    const columnLetter = this.columnNumberToLetter(column);
    return `${columnLetter}${row}`;
  }

  /**
   * Parse range string into start and end cell addresses
   * @param range - Range string like 'A1:C10'
   * @returns Object with start and end cell information
   */
  static parseRange(range: string): {
    start: { row: number; column: number; address: string };
    end: { row: number; column: number; address: string };
    rowCount: number;
    columnCount: number;
  } {
    const [startAddress, endAddress] = range.split(':');
    
    if (!startAddress || !endAddress) {
      throw new Error(`Invalid range: ${range}`);
    }
    
    const start = this.parseCellAddress(startAddress);
    const end = this.parseCellAddress(endAddress);
    
    return {
      start: { ...start, address: startAddress },
      end: { ...end, address: endAddress },
      rowCount: end.row - start.row + 1,
      columnCount: end.column - start.column + 1
    };
  }

  /**
   * Create range string from start and end coordinates
   * @param startRow - Start row (1-based)
   * @param startColumn - Start column (1-based)
   * @param endRow - End row (1-based)
   * @param endColumn - End column (1-based)
   * @returns Range string like 'A1:C10'
   */
  static createRange(startRow: number, startColumn: number, endRow: number, endColumn: number): string {
    const startAddress = this.createCellAddress(startRow, startColumn);
    const endAddress = this.createCellAddress(endRow, endColumn);
    return `${startAddress}:${endAddress}`;
  }

  /**
   * Auto-detect data types in a column
   * @param values - Array of cell values
   * @returns Detected data type and statistics
   */
  static detectDataType(values: any[]): {
    primaryType: 'number' | 'string' | 'date' | 'boolean' | 'mixed';
    confidence: number;
    statistics: {
      totalCount: number;
      numberCount: number;
      stringCount: number;
      dateCount: number;
      booleanCount: number;
      nullCount: number;
    };
    samples: { type: string; value: any; count: number }[];
  } {
    const stats = {
      totalCount: values.length,
      numberCount: 0,
      stringCount: 0,
      dateCount: 0,
      booleanCount: 0,
      nullCount: 0
    };

    const typeExamples = new Map<string, { value: any; count: number }>();

    for (const value of values) {
      if (value === null || value === undefined || value === '') {
        stats.nullCount++;
        continue;
      }

      let detectedType = 'string';
      
      if (typeof value === 'number') {
        detectedType = 'number';
        stats.numberCount++;
      } else if (typeof value === 'boolean') {
        detectedType = 'boolean';
        stats.booleanCount++;
      } else if (value instanceof Date) {
        detectedType = 'date';
        stats.dateCount++;
      } else if (typeof value === 'string') {
        // Try to detect if string represents other types
        const trimmed = value.trim();
        
        if (!isNaN(Number(trimmed)) && trimmed !== '') {
          detectedType = 'number';
          stats.numberCount++;
        } else if (trimmed.toLowerCase() === 'true' || trimmed.toLowerCase() === 'false') {
          detectedType = 'boolean';
          stats.booleanCount++;
        } else if (!isNaN(Date.parse(trimmed)) && trimmed.length > 5) {
          // Basic date detection
          detectedType = 'date';
          stats.dateCount++;
        } else {
          stats.stringCount++;
        }
      }

      // Track examples
      const exampleKey = `${detectedType}_${String(value).substring(0, 20)}`;
      if (typeExamples.has(exampleKey)) {
        typeExamples.get(exampleKey)!.count++;
      } else {
        typeExamples.set(exampleKey, { value, count: 1 });
      }
    }

    // Determine primary type
    const nonNullCount = stats.totalCount - stats.nullCount;
    const typeScores = {
      number: stats.numberCount / nonNullCount,
      string: stats.stringCount / nonNullCount,
      date: stats.dateCount / nonNullCount,
      boolean: stats.booleanCount / nonNullCount
    };

    let primaryType: 'number' | 'string' | 'date' | 'boolean' | 'mixed' = 'mixed';
    let confidence = 0;

    for (const [type, score] of Object.entries(typeScores)) {
      if (score > confidence) {
        confidence = score;
        primaryType = type as any;
      }
    }

    // If no single type dominates, mark as mixed
    if (confidence < 0.6) {
      primaryType = 'mixed';
      confidence = Math.max(...Object.values(typeScores));
    }

    // Convert examples to array
    const samples = Array.from(typeExamples.entries())
      .map(([key, data]) => ({
        type: key.split('_')[0],
        value: data.value,
        count: data.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      primaryType,
      confidence,
      statistics: stats,
      samples
    };
  }

  /**
   * Apply consistent formatting to a range of cells
   * @param worksheet - Target worksheet
   * @param range - Range to format
   * @param style - Style to apply
   */
  static formatRange(
    worksheet: ExcelJS.Worksheet,
    range: string,
    style: Partial<ExcelJS.Style>
  ): void {
    const rangeInfo = this.parseRange(range);
    
    for (let row = rangeInfo.start.row; row <= rangeInfo.end.row; row++) {
      for (let col = rangeInfo.start.column; col <= rangeInfo.end.column; col++) {
        const cell = worksheet.getCell(row, col);
        Object.assign(cell, style);
      }
    }
  }

  /**
   * Create professional table formatting
   * @param worksheet - Target worksheet
   * @param range - Table range
   * @param options - Formatting options
   */
  static formatAsTable(
    worksheet: ExcelJS.Worksheet,
    range: string,
    options: {
      headerRow?: boolean;
      alternateRows?: boolean;
      borderStyle?: 'thin' | 'medium' | 'thick';
      headerColor?: string;
      alternateColor?: string;
    } = {}
  ): void {
    const {
      headerRow = true,
      alternateRows = true,
      borderStyle = 'thin',
      headerColor = 'FF366092',
      alternateColor = 'FFF8F8FF'
    } = options;

    const rangeInfo = this.parseRange(range);
    const borders = {
      top: { style: borderStyle },
      left: { style: borderStyle },
      bottom: { style: borderStyle },
      right: { style: borderStyle }
    };

    // Apply borders to entire range
    this.formatRange(worksheet, range, { border: borders });

    // Format header row
    if (headerRow) {
      const headerRange = this.createRange(
        rangeInfo.start.row,
        rangeInfo.start.column,
        rangeInfo.start.row,
        rangeInfo.end.column
      );
      
      this.formatRange(worksheet, headerRange, {
        font: { bold: true, color: { argb: 'FFFFFFFF' } },
        fill: {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: headerColor }
        },
        alignment: { horizontal: 'center', vertical: 'middle' }
      });
    }

    // Apply alternating row colors
    if (alternateRows) {
      const dataStartRow = headerRow ? rangeInfo.start.row + 1 : rangeInfo.start.row;
      
      for (let row = dataStartRow; row <= rangeInfo.end.row; row++) {
        if ((row - dataStartRow) % 2 === 1) {
          const rowRange = this.createRange(
            row,
            rangeInfo.start.column,
            row,
            rangeInfo.end.column
          );
          
          this.formatRange(worksheet, rowRange, {
            fill: {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: alternateColor }
            }
          });
        }
      }
    }
  }

  /**
   * Auto-resize columns based on content
   * @param worksheet - Target worksheet
   * @param options - Resize options
   */
  static autoResizeColumns(
    worksheet: ExcelJS.Worksheet,
    options: {
      minWidth?: number;
      maxWidth?: number;
      padding?: number;
      columns?: number[]; // Specific columns to resize (1-based)
    } = {}
  ): void {
    const {
      minWidth = 8,
      maxWidth = 50,
      padding = 2,
      columns
    } = options;

    const targetColumns = columns || Array.from(
      { length: worksheet.columnCount }, 
      (_, i) => i + 1
    );

    for (const colIndex of targetColumns) {
      const column = worksheet.getColumn(colIndex);
      let maxLength = minWidth;
      
      column.eachCell({ includeEmpty: false }, (cell) => {
        const cellValue = this.getCellDisplayValue(cell);
        maxLength = Math.max(maxLength, cellValue.length);
      });
      
      column.width = Math.min(maxLength + padding, maxWidth);
    }
  }

  /**
   * Get display value of a cell (handles formulas, rich text, etc.)
   * @param cell - Excel cell
   * @returns String representation of cell value
   */
  static getCellDisplayValue(cell: ExcelJS.Cell): string {
    const value = cell.value;
    
    if (value === null || value === undefined) {
      return '';
    }
    
    if (typeof value === 'object') {
      if ('result' in value) {
        // Formula cell
        return String(value.result || value.formula || '');
      }
      
      if ('richText' in value) {
        // Rich text cell
        return value.richText.map((rt: any) => rt.text).join('');
      }
      
      if ('hyperlink' in value) {
        // Hyperlink cell
        return value.text || value.hyperlink || '';
      }
    }
    
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    
    return String(value);
  }

  /**
   * Find cells matching criteria
   * @param worksheet - Worksheet to search
   * @param criteria - Search criteria
   * @returns Array of matching cell addresses
   */
  static findCells(
    worksheet: ExcelJS.Worksheet,
    criteria: {
      value?: any;
      contains?: string;
      pattern?: RegExp;
      dataType?: 'number' | 'string' | 'date' | 'boolean' | 'formula';
      range?: string;
    }
  ): Array<{ address: string; row: number; column: number; value: any }> {
    const results: Array<{ address: string; row: number; column: number; value: any }> = [];
    const searchRange = criteria.range ? this.parseRange(criteria.range) : null;

    worksheet.eachRow((row, rowNumber) => {
      if (searchRange && (rowNumber < searchRange.start.row || rowNumber > searchRange.end.row)) {
        return;
      }

      row.eachCell((cell, colNumber) => {
        if (searchRange && (colNumber < searchRange.start.column || colNumber > searchRange.end.column)) {
          return;
        }

        const cellValue = cell.value;
        const displayValue = this.getCellDisplayValue(cell);
        let matches = false;

        // Check value match
        if (criteria.value !== undefined) {
          matches = cellValue === criteria.value;
        }
        
        // Check contains
        if (criteria.contains && !matches) {
          matches = displayValue.toLowerCase().includes(criteria.contains.toLowerCase());
        }
        
        // Check pattern
        if (criteria.pattern && !matches) {
          matches = criteria.pattern.test(displayValue);
        }
        
        // Check data type
        if (criteria.dataType && !matches) {
          matches = this.matchesDataType(cellValue, criteria.dataType);
        }

        if (matches) {
          results.push({
            address: this.createCellAddress(rowNumber, colNumber),
            row: rowNumber,
            column: colNumber,
            value: cellValue
          });
        }
      });
    });

    return results;
  }

  /**
   * Check if value matches specified data type
   * @param value - Cell value
   * @param dataType - Target data type
   * @returns True if value matches type
   */
  private static matchesDataType(value: any, dataType: string): boolean {
    switch (dataType) {
      case 'number':
        return typeof value === 'number' || !isNaN(Number(value));
      case 'string':
        return typeof value === 'string';
      case 'date':
        return value instanceof Date || (!isNaN(Date.parse(String(value))) && String(value).length > 5);
      case 'boolean':
        return typeof value === 'boolean' || ['true', 'false'].includes(String(value).toLowerCase());
      case 'formula':
        return typeof value === 'object' && value !== null && 'formula' in value;
      default:
        return false;
    }
  }

  /**
   * Convert Excel serial date to JavaScript Date
   * @param serial - Excel serial date number
   * @param date1904 - Whether using 1904 date system
   * @returns JavaScript Date object
   */
  static excelDateToJSDate(serial: number, date1904: boolean = false): Date {
    const epoch = date1904 ? new Date(1904, 0, 1) : new Date(1900, 0, 1);
    const days = date1904 ? serial : serial - 1; // Excel's leap year bug
    return new Date(epoch.getTime() + days * 24 * 60 * 60 * 1000);
  }

  /**
   * Convert JavaScript Date to Excel serial date
   * @param date - JavaScript Date object
   * @param date1904 - Whether using 1904 date system
   * @returns Excel serial date number
   */
  static jsDateToExcelDate(date: Date, date1904: boolean = false): number {
    const epoch = date1904 ? new Date(1904, 0, 1) : new Date(1900, 0, 1);
    const diffTime = date.getTime() - epoch.getTime();
    const diffDays = diffTime / (24 * 60 * 60 * 1000);
    return date1904 ? diffDays : diffDays + 1; // Excel's leap year bug
  }

  /**
   * Generate summary statistics for numeric data in a range
   * @param worksheet - Source worksheet
   * @param range - Data range
   * @returns Statistical summary
   */
  static calculateRangeStatistics(
    worksheet: ExcelJS.Worksheet,
    range: string
  ): {
    count: number;
    sum: number;
    average: number;
    min: number;
    max: number;
    median: number;
    standardDeviation: number;
  } | null {
    const rangeInfo = this.parseRange(range);
    const values: number[] = [];

    for (let row = rangeInfo.start.row; row <= rangeInfo.end.row; row++) {
      for (let col = rangeInfo.start.column; col <= rangeInfo.end.column; col++) {
        const cell = worksheet.getCell(row, col);
        const value = cell.value;
        
        if (typeof value === 'number') {
          values.push(value);
        } else if (typeof value === 'string' && !isNaN(Number(value))) {
          values.push(Number(value));
        }
      }
    }

    if (values.length === 0) {
      return null;
    }

    const sum = values.reduce((acc, val) => acc + val, 0);
    const average = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Calculate median
    const sortedValues = [...values].sort((a, b) => a - b);
    const median = sortedValues.length % 2 === 0
      ? (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2
      : sortedValues[Math.floor(sortedValues.length / 2)];

    // Calculate standard deviation
    const variance = values.reduce((acc, val) => acc + Math.pow(val - average, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);

    return {
      count: values.length,
      sum,
      average,
      min,
      max,
      median,
      standardDeviation
    };
  }

  /**
   * Example usage of Excel helpers
   */
  static exampleUsage(): void {
    console.log('Excel Helper Examples:');
    
    // Column conversions
    console.log('A -> 1:', ExcelHelpers.columnLetterToNumber('A'));
    console.log('1 -> A:', ExcelHelpers.columnNumberToLetter(1));
    console.log('AB -> 28:', ExcelHelpers.columnLetterToNumber('AB'));
    
    // Cell address parsing
    const cellInfo = ExcelHelpers.parseCellAddress('B10');
    console.log('B10 parsed:', cellInfo);
    
    // Range parsing
    const rangeInfo = ExcelHelpers.parseRange('A1:C10');
    console.log('A1:C10 parsed:', rangeInfo);
    
    // Data type detection
    const dataTypes = ExcelHelpers.detectDataType([1, 2, 3, '4', '5.5']);
    console.log('Data types detected:', dataTypes);
  }
}

export default ExcelHelpers;
import * as ExcelJS from 'exceljs';
import { ExcelHelpers } from './ExcelHelpers';

/**
 * Data extraction utilities for Excel files
 * Provides specialized methods for extracting specific data patterns and structures
 */
export class DataExtractor {

  /**
   * Extract table data with automatic header detection
   * @param worksheet - Source worksheet
   * @param options - Extraction options
   * @returns Extracted table data
   */
  static extractTable(
    worksheet: ExcelJS.Worksheet,
    options: {
      range?: string;
      autoDetectHeaders?: boolean;
      headerRow?: number;
      dataStartRow?: number;
      skipEmptyRows?: boolean;
      skipEmptyColumns?: boolean;
      columnMapping?: Record<string, string>; // Map original headers to new names
    } = {}
  ): {
    headers: string[];
    data: Record<string, any>[];
    metadata: {
      totalRows: number;
      dataRows: number;
      emptyRows: number;
      columnCount: number;
      range: string;
    };
  } {
    const {
      range,
      autoDetectHeaders = true,
      headerRow = 1,
      dataStartRow,
      skipEmptyRows = true,
      skipEmptyColumns = true,
      columnMapping = {}
    } = options;

    let workingRange: { start: { row: number; column: number }; end: { row: number; column: number } };
    
    if (range) {
      const rangeInfo = ExcelHelpers.parseRange(range);
      workingRange = { start: rangeInfo.start, end: rangeInfo.end };
    } else {
      // Auto-detect data range
      workingRange = this.detectDataRange(worksheet);
    }

    let headers: string[] = [];
    let actualDataStartRow: number;

    // Extract headers
    if (autoDetectHeaders) {
      const detectedHeaders = this.detectHeaders(worksheet, workingRange);
      if (detectedHeaders.found) {
        headers = detectedHeaders.headers;
        actualDataStartRow = detectedHeaders.headerRow + 1;
      } else {
        // Generate default column headers
        const columnCount = workingRange.end.column - workingRange.start.column + 1;
        headers = Array.from({ length: columnCount }, (_, i) => `Column${i + 1}`);
        actualDataStartRow = workingRange.start.row;
      }
    } else {
      // Use specified header row
      const headerRowData = this.extractRow(worksheet, headerRow, workingRange.start.column, workingRange.end.column);
      headers = headerRowData.map(cell => String(cell || `Column${headers.length + 1}`));
      actualDataStartRow = dataStartRow || headerRow + 1;
    }

    // Apply column mapping
    headers = headers.map(header => columnMapping[header] || header);

    // Extract data
    const extractedData: Record<string, any>[] = [];
    let totalRows = 0;
    let dataRows = 0;
    let emptyRows = 0;

    for (let rowNum = actualDataStartRow; rowNum <= workingRange.end.row; rowNum++) {
      totalRows++;
      const rowData = this.extractRow(worksheet, rowNum, workingRange.start.column, workingRange.end.column);
      
      const isEmptyRow = this.isEmptyRowData(rowData);
      
      if (isEmptyRow) {
        emptyRows++;
        if (skipEmptyRows) {
          continue;
        }
      } else {
        dataRows++;
      }

      // Create row object
      const rowObject: Record<string, any> = {};
      headers.forEach((header, index) => {
        rowObject[header] = this.processExtractedValue(rowData[index]);
      });

      extractedData.push(rowObject);
    }

    // Remove empty columns if requested
    if (skipEmptyColumns && extractedData.length > 0) {
      const nonEmptyColumns = this.identifyNonEmptyColumns(extractedData);
      const filteredData = extractedData.map(row => {
        const filteredRow: Record<string, any> = {};
        nonEmptyColumns.forEach(colName => {
          filteredRow[colName] = row[colName];
        });
        return filteredRow;
      });
      
      return {
        headers: nonEmptyColumns,
        data: filteredData,
        metadata: {
          totalRows,
          dataRows,
          emptyRows,
          columnCount: nonEmptyColumns.length,
          range: ExcelHelpers.createRange(workingRange.start.row, workingRange.start.column, workingRange.end.row, workingRange.end.column)
        }
      };
    }

    return {
      headers,
      data: extractedData,
      metadata: {
        totalRows,
        dataRows,
        emptyRows,
        columnCount: headers.length,
        range: ExcelHelpers.createRange(workingRange.start.row, workingRange.start.column, workingRange.end.row, workingRange.end.column)
      }
    };
  }

  /**
   * Extract data by column patterns (e.g., find all numeric columns)
   * @param worksheet - Source worksheet
   * @param pattern - Pattern to match
   * @param options - Extraction options
   * @returns Extracted column data
   */
  static extractColumnsByPattern(
    worksheet: ExcelJS.Worksheet,
    pattern: {
      dataType?: 'number' | 'string' | 'date' | 'boolean';
      headerPattern?: RegExp | string;
      valuePattern?: RegExp;
      minimumDataPercentage?: number; // Minimum percentage of non-empty cells
    },
    options: {
      range?: string;
      includeHeaders?: boolean;
    } = {}
  ): Array<{
    columnIndex: number;
    columnLetter: string;
    header?: string;
    data: any[];
    dataType: string;
    confidence: number;
    statistics?: any;
  }> {
    const { range, includeHeaders = true } = options;
    const { dataType, headerPattern, valuePattern, minimumDataPercentage = 0.1 } = pattern;

    let workingRange: { start: { row: number; column: number }; end: { row: number; column: number } };
    
    if (range) {
      const rangeInfo = ExcelHelpers.parseRange(range);
      workingRange = { start: rangeInfo.start, end: rangeInfo.end };
    } else {
      workingRange = this.detectDataRange(worksheet);
    }

    const matchingColumns: Array<any> = [];

    for (let col = workingRange.start.column; col <= workingRange.end.column; col++) {
      const columnData = this.extractColumn(worksheet, col, workingRange.start.row, workingRange.end.row);
      
      // Check if column matches pattern
      let matches = true;
      let header: string | undefined;
      let dataStartIndex = 0;

      if (includeHeaders && columnData.length > 0) {
        header = String(columnData[0] || '');
        dataStartIndex = 1;

        // Check header pattern
        if (headerPattern && !this.matchesPattern(header, headerPattern)) {
          matches = false;
        }
      }

      if (matches && columnData.length > dataStartIndex) {
        const actualData = columnData.slice(dataStartIndex);
        
        // Filter out empty values for analysis
        const nonEmptyData = actualData.filter(val => val !== null && val !== undefined && val !== '');
        
        // Check minimum data percentage
        if (nonEmptyData.length / actualData.length < minimumDataPercentage) {
          matches = false;
        }

        if (matches) {
          // Detect data type of column
          const typeInfo = ExcelHelpers.detectDataType(nonEmptyData);
          
          // Check data type match
          if (dataType && typeInfo.primaryType !== dataType) {
            matches = false;
          }

          // Check value pattern
          if (matches && valuePattern) {
            const patternMatches = nonEmptyData.filter(val => 
              this.matchesPattern(String(val), valuePattern)
            ).length;
            
            if (patternMatches / nonEmptyData.length < 0.8) {
              matches = false;
            }
          }

          if (matches) {
            matchingColumns.push({
              columnIndex: col,
              columnLetter: ExcelHelpers.columnNumberToLetter(col),
              header,
              data: actualData,
              dataType: typeInfo.primaryType,
              confidence: typeInfo.confidence,
              statistics: this.calculateColumnStatistics(actualData, typeInfo.primaryType)
            });
          }
        }
      }
    }

    return matchingColumns;
  }

  /**
   * Extract key-value pairs from worksheet (useful for forms, settings, etc.)
   * @param worksheet - Source worksheet
   * @param options - Extraction options
   * @returns Key-value pairs
   */
  static extractKeyValuePairs(
    worksheet: ExcelJS.Worksheet,
    options: {
      range?: string;
      keyColumn?: number;
      valueColumn?: number;
      autoDetect?: boolean;
      skipEmptyValues?: boolean;
      keyPattern?: RegExp;
    } = {}
  ): Array<{ key: string; value: any; row: number; confidence: number }> {
    const {
      range,
      keyColumn = 1,
      valueColumn = 2,
      autoDetect = true,
      skipEmptyValues = true,
      keyPattern
    } = options;

    let workingRange: { start: { row: number; column: number }; end: { row: number; column: number } };
    
    if (range) {
      const rangeInfo = ExcelHelpers.parseRange(range);
      workingRange = { start: rangeInfo.start, end: rangeInfo.end };
    } else {
      workingRange = this.detectDataRange(worksheet);
    }

    const keyValuePairs: Array<{ key: string; value: any; row: number; confidence: number }> = [];

    if (autoDetect) {
      // Auto-detect key-value structure
      for (let row = workingRange.start.row; row <= workingRange.end.row; row++) {
        const rowData = this.extractRow(worksheet, row, workingRange.start.column, workingRange.end.column);
        
        // Look for key-value patterns in the row
        const kvPairs = this.detectKeyValueInRow(rowData, row, keyPattern, skipEmptyValues);
        keyValuePairs.push(...kvPairs);
      }
    } else {
      // Use specified columns
      for (let row = workingRange.start.row; row <= workingRange.end.row; row++) {
        const keyCell = worksheet.getCell(row, keyColumn);
        const valueCell = worksheet.getCell(row, valueColumn);
        
        const key = String(keyCell.value || '').trim();
        const value = this.processExtractedValue(valueCell.value);
        
        if (!key) continue;
        if (skipEmptyValues && (value === null || value === undefined || value === '')) continue;
        if (keyPattern && !keyPattern.test(key)) continue;

        keyValuePairs.push({
          key,
          value,
          row,
          confidence: 1.0
        });
      }
    }

    return keyValuePairs;
  }

  /**
   * Extract financial/numeric data with calculations
   * @param worksheet - Source worksheet
   * @param options - Extraction options
   * @returns Financial data with calculations
   */
  static extractFinancialData(
    worksheet: ExcelJS.Worksheet,
    options: {
      range?: string;
      currencyColumns?: number[];
      percentageColumns?: number[];
      dateColumns?: number[];
      calculateTotals?: boolean;
      calculateGrowthRates?: boolean;
    } = {}
  ): {
    data: Record<string, any>[];
    calculations: {
      totals?: Record<string, number>;
      averages?: Record<string, number>;
      growthRates?: Record<string, number[]>;
      trends?: Record<string, 'increasing' | 'decreasing' | 'stable'>;
    };
    metadata: {
      currencyFormat: string;
      dateFormat: string;
      precision: number;
    };
  } {
    const {
      range,
      currencyColumns = [],
      percentageColumns = [],
      dateColumns = [],
      calculateTotals = true,
      calculateGrowthRates = true
    } = options;

    // Extract base data
    const tableData = this.extractTable(worksheet, { range, autoDetectHeaders: true });
    const data = tableData.data;
    const calculations: any = {};
    
    // Process currency columns
    const processedData = data.map(row => {
      const processedRow = { ...row };
      
      // Convert currency values
      currencyColumns.forEach(colIndex => {
        const header = tableData.headers[colIndex - 1];
        if (header && processedRow[header] !== undefined) {
          processedRow[header] = this.parseCurrency(processedRow[header]);
        }
      });
      
      // Convert percentage values
      percentageColumns.forEach(colIndex => {
        const header = tableData.headers[colIndex - 1];
        if (header && processedRow[header] !== undefined) {
          processedRow[header] = this.parsePercentage(processedRow[header]);
        }
      });
      
      // Convert date values
      dateColumns.forEach(colIndex => {
        const header = tableData.headers[colIndex - 1];
        if (header && processedRow[header] !== undefined) {
          processedRow[header] = this.parseDate(processedRow[header]);
        }
      });
      
      return processedRow;
    });

    // Calculate totals and averages
    if (calculateTotals) {
      calculations.totals = {};
      calculations.averages = {};
      
      tableData.headers.forEach(header => {
        const values = processedData
          .map(row => row[header])
          .filter(val => typeof val === 'number' && !isNaN(val));
        
        if (values.length > 0) {
          calculations.totals[header] = values.reduce((sum, val) => sum + val, 0);
          calculations.averages[header] = calculations.totals[header] / values.length;
        }
      });
    }

    // Calculate growth rates
    if (calculateGrowthRates) {
      calculations.growthRates = {};
      calculations.trends = {};
      
      tableData.headers.forEach(header => {
        const values = processedData
          .map(row => row[header])
          .filter(val => typeof val === 'number' && !isNaN(val));
        
        if (values.length > 1) {
          const growthRates: number[] = [];
          
          for (let i = 1; i < values.length; i++) {
            if (values[i - 1] !== 0) {
              const growthRate = ((values[i] - values[i - 1]) / Math.abs(values[i - 1])) * 100;
              growthRates.push(growthRate);
            }
          }
          
          calculations.growthRates[header] = growthRates;
          
          // Determine trend
          if (growthRates.length > 0) {
            const avgGrowth = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
            if (Math.abs(avgGrowth) < 1) {
              calculations.trends[header] = 'stable';
            } else {
              calculations.trends[header] = avgGrowth > 0 ? 'increasing' : 'decreasing';
            }
          }
        }
      });
    }

    return {
      data: processedData,
      calculations,
      metadata: {
        currencyFormat: 'USD', // Could be auto-detected
        dateFormat: 'MM/DD/YYYY',
        precision: 2
      }
    };
  }

  // Helper methods

  private static detectDataRange(worksheet: ExcelJS.Worksheet): { start: { row: number; column: number }; end: { row: number; column: number } } {
    let minRow = Number.MAX_SAFE_INTEGER;
    let maxRow = 0;
    let minCol = Number.MAX_SAFE_INTEGER;
    let maxCol = 0;
    let hasData = false;

    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell, colNumber) => {
        if (cell.value !== null && cell.value !== undefined && cell.value !== '') {
          hasData = true;
          minRow = Math.min(minRow, rowNumber);
          maxRow = Math.max(maxRow, rowNumber);
          minCol = Math.min(minCol, colNumber);
          maxCol = Math.max(maxCol, colNumber);
        }
      });
    });

    if (!hasData) {
      return { start: { row: 1, column: 1 }, end: { row: 1, column: 1 } };
    }

    return {
      start: { row: minRow, column: minCol },
      end: { row: maxRow, column: maxCol }
    };
  }

  private static detectHeaders(worksheet: ExcelJS.Worksheet, range: { start: { row: number; column: number }; end: { row: number; column: number } }): {
    found: boolean;
    headers: string[];
    headerRow: number;
  } {
    // Check first few rows for header patterns
    for (let row = range.start.row; row <= Math.min(range.start.row + 3, range.end.row); row++) {
      const rowData = this.extractRow(worksheet, row, range.start.column, range.end.column);
      
      const hasTextData = rowData.some(cell => 
        typeof cell === 'string' && isNaN(Number(cell)) && cell.trim() !== ''
      );
      
      if (hasTextData && row < range.end.row) {
        // Check if next row has different data pattern (likely data row)
        const nextRowData = this.extractRow(worksheet, row + 1, range.start.column, range.end.column);
        const hasNumericData = nextRowData.some(cell => 
          typeof cell === 'number' || (!isNaN(Number(cell)) && String(cell).trim() !== '')
        );
        
        if (hasNumericData) {
          return {
            found: true,
            headers: rowData.map(cell => String(cell || '').trim()),
            headerRow: row
          };
        }
      }
    }

    return { found: false, headers: [], headerRow: 0 };
  }

  private static extractRow(worksheet: ExcelJS.Worksheet, rowNumber: number, startColumn: number, endColumn: number): any[] {
    const row = worksheet.getRow(rowNumber);
    const data: any[] = [];
    
    for (let col = startColumn; col <= endColumn; col++) {
      const cell = row.getCell(col);
      data.push(this.processExtractedValue(cell.value));
    }
    
    return data;
  }

  private static extractColumn(worksheet: ExcelJS.Worksheet, columnNumber: number, startRow: number, endRow: number): any[] {
    const data: any[] = [];
    
    for (let row = startRow; row <= endRow; row++) {
      const cell = worksheet.getCell(row, columnNumber);
      data.push(this.processExtractedValue(cell.value));
    }
    
    return data;
  }

  private static isEmptyRowData(rowData: any[]): boolean {
    return rowData.every(cell => 
      cell === null || cell === undefined || String(cell).trim() === ''
    );
  }

  private static identifyNonEmptyColumns(data: Record<string, any>[]): string[] {
    const columnCounts: Record<string, number> = {};
    
    data.forEach(row => {
      Object.entries(row).forEach(([key, value]) => {
        if (value !== null && value !== undefined && String(value).trim() !== '') {
          columnCounts[key] = (columnCounts[key] || 0) + 1;
        }
      });
    });
    
    // Return columns with at least some data
    return Object.entries(columnCounts)
      .filter(([_, count]) => count > 0)
      .map(([key, _]) => key);
  }

  private static processExtractedValue(value: any): any {
    if (value === null || value === undefined) {
      return null;
    }
    
    if (typeof value === 'object') {
      if ('result' in value) {
        return value.result;
      }
      if ('richText' in value) {
        return value.richText.map((rt: any) => rt.text).join('');
      }
      if ('hyperlink' in value) {
        return value.text || value.hyperlink;
      }
    }
    
    return value;
  }

  private static matchesPattern(text: string, pattern: RegExp | string): boolean {
    if (pattern instanceof RegExp) {
      return pattern.test(text);
    }
    return text.toLowerCase().includes(pattern.toLowerCase());
  }

  private static detectKeyValueInRow(rowData: any[], rowNumber: number, keyPattern?: RegExp, skipEmptyValues: boolean = true): Array<{ key: string; value: any; row: number; confidence: number }> {
    const pairs: Array<{ key: string; value: any; row: number; confidence: number }> = [];
    
    // Look for key-value patterns within the row
    for (let i = 0; i < rowData.length - 1; i++) {
      const potentialKey = String(rowData[i] || '').trim();
      const potentialValue = rowData[i + 1];
      
      if (!potentialKey) continue;
      if (skipEmptyValues && (potentialValue === null || potentialValue === undefined || potentialValue === '')) continue;
      if (keyPattern && !keyPattern.test(potentialKey)) continue;
      
      // Calculate confidence based on key characteristics
      let confidence = 0.5;
      
      if (potentialKey.endsWith(':')) confidence += 0.3;
      if (potentialKey.includes('_') || potentialKey.includes(' ')) confidence += 0.2;
      if (/^[A-Za-z]/.test(potentialKey)) confidence += 0.2;
      
      pairs.push({
        key: potentialKey.replace(/:$/, ''), // Remove trailing colon
        value: this.processExtractedValue(potentialValue),
        row: rowNumber,
        confidence: Math.min(confidence, 1.0)
      });
    }
    
    return pairs;
  }

  private static calculateColumnStatistics(data: any[], dataType: string): any {
    if (dataType === 'number') {
      const numericData = data.filter(val => typeof val === 'number' && !isNaN(val));
      if (numericData.length === 0) return null;
      
      const sum = numericData.reduce((acc, val) => acc + val, 0);
      const avg = sum / numericData.length;
      const min = Math.min(...numericData);
      const max = Math.max(...numericData);
      
      return { sum, avg, min, max, count: numericData.length };
    }
    
    if (dataType === 'string') {
      const stringData = data.filter(val => typeof val === 'string' && val.trim() !== '');
      const avgLength = stringData.reduce((acc, val) => acc + val.length, 0) / stringData.length;
      const uniqueCount = new Set(stringData).size;
      
      return { avgLength, uniqueCount, count: stringData.length };
    }
    
    return { count: data.filter(val => val !== null && val !== undefined).length };
  }

  private static parseCurrency(value: any): number | null {
    if (typeof value === 'number') return value;
    
    const strValue = String(value || '');
    const cleanValue = strValue.replace(/[^\d.-]/g, '');
    const numValue = Number(cleanValue);
    
    return isNaN(numValue) ? null : numValue;
  }

  private static parsePercentage(value: any): number | null {
    if (typeof value === 'number') {
      return value > 1 ? value / 100 : value; // Assume values > 1 are already percentages
    }
    
    const strValue = String(value || '');
    if (strValue.includes('%')) {
      const cleanValue = strValue.replace('%', '');
      const numValue = Number(cleanValue);
      return isNaN(numValue) ? null : numValue / 100;
    }
    
    const numValue = Number(strValue);
    return isNaN(numValue) ? null : numValue;
  }

  private static parseDate(value: any): Date | null {
    if (value instanceof Date) return value;
    
    if (typeof value === 'number') {
      // Assume Excel serial date
      return ExcelHelpers.excelDateToJSDate(value);
    }
    
    const dateValue = new Date(value);
    return isNaN(dateValue.getTime()) ? null : dateValue;
  }

  /**
   * Example usage of data extractor
   */
  static exampleUsage(): void {
    console.log('Data Extractor Examples:');
    console.log('Use extractTable() for structured data');
    console.log('Use extractColumnsByPattern() for specific column types');
    console.log('Use extractKeyValuePairs() for form-like data');
    console.log('Use extractFinancialData() for financial analysis');
  }
}

export default DataExtractor;
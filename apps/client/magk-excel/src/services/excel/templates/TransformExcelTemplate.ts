import * as ExcelJS from 'exceljs';

/**
 * Template for transforming Excel data with operations like filtering, sorting, grouping, and calculations
 * Supports complex data transformations while maintaining Excel formatting and structure
 */
export class TransformExcelTemplate {
  private workbook: ExcelJS.Workbook;
  private sourceWorksheet: ExcelJS.Worksheet | null = null;
  private targetWorksheet: ExcelJS.Worksheet | null = null;

  constructor() {
    this.workbook = new ExcelJS.Workbook();
  }

  /**
   * Load source Excel file for transformation
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
   * Set source worksheet for transformation
   * @param identifier - Worksheet name or index
   * @returns Source worksheet
   */
  setSourceWorksheet(identifier: string | number): ExcelJS.Worksheet {
    try {
      if (typeof identifier === 'string') {
        this.sourceWorksheet = this.workbook.getWorksheet(identifier);
      } else {
        this.sourceWorksheet = this.workbook.getWorksheet(identifier + 1);
      }
      
      if (!this.sourceWorksheet) {
        throw new Error(`Source worksheet '${identifier}' not found`);
      }
      
      return this.sourceWorksheet;
    } catch (error) {
      throw new Error(`Failed to set source worksheet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create target worksheet for transformed data
   * @param name - Target worksheet name
   * @returns Target worksheet
   */
  createTargetWorksheet(name: string): ExcelJS.Worksheet {
    try {
      this.targetWorksheet = this.workbook.addWorksheet(name);
      return this.targetWorksheet;
    } catch (error) {
      throw new Error(`Failed to create target worksheet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract data from source worksheet as objects
   * @param options - Extraction options
   * @returns Array of data objects
   */
  async extractSourceData(options: {
    startRow?: number;
    endRow?: number;
    headers?: boolean;
    headerRow?: number;
    skipEmptyRows?: boolean;
  } = {}): Promise<Record<string, any>[]> {
    try {
      if (!this.sourceWorksheet) {
        throw new Error('Source worksheet not set');
      }

      const {
        startRow = 1,
        endRow = this.sourceWorksheet.rowCount,
        headers = true,
        headerRow = 1,
        skipEmptyRows = true
      } = options;

      const data: Record<string, any>[] = [];
      let headerRow_data: string[] = [];

      // Get headers
      if (headers) {
        const firstRow = this.sourceWorksheet.getRow(headerRow);
        headerRow_data = firstRow.values as string[];
        headerRow_data.shift(); // Remove first empty element
      }

      const dataStartRow = headers ? Math.max(startRow, headerRow + 1) : startRow;

      // Read data rows
      for (let rowNumber = dataStartRow; rowNumber <= endRow; rowNumber++) {
        const row = this.sourceWorksheet.getRow(rowNumber);
        
        if (skipEmptyRows && this.isEmptyRow(row)) {
          continue;
        }

        const rowData: Record<string, any> = {};
        const values = row.values as any[];

        if (headerRow_data.length > 0) {
          headerRow_data.forEach((header, index) => {
            const cellValue = values[index + 1];
            rowData[header] = this.processCellValue(cellValue);
          });
        } else {
          values.forEach((value, index) => {
            if (index > 0) {
              rowData[`column_${index}`] = this.processCellValue(value);
            }
          });
        }

        data.push(rowData);
      }

      return data;
    } catch (error) {
      throw new Error(`Failed to extract source data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Filter data based on conditions
   * @param data - Source data
   * @param conditions - Filter conditions
   * @returns Filtered data
   */
  filterData(
    data: Record<string, any>[],
    conditions: Array<{
      field: string;
      operator: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'greaterThan' | 'lessThan' | 'greaterOrEqual' | 'lessOrEqual' | 'isEmpty' | 'isNotEmpty';
      value?: any;
      caseSensitive?: boolean;
    }>
  ): Record<string, any>[] {
    try {
      return data.filter(row => {
        return conditions.every(condition => {
          const fieldValue = row[condition.field];
          const { operator, value, caseSensitive = false } = condition;

          switch (operator) {
            case 'equals':
              return this.compareValues(fieldValue, value, caseSensitive) === 0;
            case 'notEquals':
              return this.compareValues(fieldValue, value, caseSensitive) !== 0;
            case 'contains':
              return String(fieldValue || '').toLowerCase().includes(String(value || '').toLowerCase());
            case 'notContains':
              return !String(fieldValue || '').toLowerCase().includes(String(value || '').toLowerCase());
            case 'greaterThan':
              return Number(fieldValue) > Number(value);
            case 'lessThan':
              return Number(fieldValue) < Number(value);
            case 'greaterOrEqual':
              return Number(fieldValue) >= Number(value);
            case 'lessOrEqual':
              return Number(fieldValue) <= Number(value);
            case 'isEmpty':
              return fieldValue === null || fieldValue === undefined || fieldValue === '';
            case 'isNotEmpty':
              return fieldValue !== null && fieldValue !== undefined && fieldValue !== '';
            default:
              return true;
          }
        });
      });
    } catch (error) {
      throw new Error(`Failed to filter data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Sort data by multiple fields
   * @param data - Source data
   * @param sortBy - Array of sort configurations
   * @returns Sorted data
   */
  sortData(
    data: Record<string, any>[],
    sortBy: Array<{
      field: string;
      direction: 'asc' | 'desc';
      dataType?: 'string' | 'number' | 'date';
    }>
  ): Record<string, any>[] {
    try {
      return [...data].sort((a, b) => {
        for (const sort of sortBy) {
          const aValue = a[sort.field];
          const bValue = b[sort.field];
          const { direction, dataType = 'string' } = sort;
          
          let comparison = 0;
          
          if (dataType === 'number') {
            comparison = Number(aValue || 0) - Number(bValue || 0);
          } else if (dataType === 'date') {
            const aDate = new Date(aValue || 0);
            const bDate = new Date(bValue || 0);
            comparison = aDate.getTime() - bDate.getTime();
          } else {
            comparison = String(aValue || '').localeCompare(String(bValue || ''));
          }
          
          if (comparison !== 0) {
            return direction === 'asc' ? comparison : -comparison;
          }
        }
        return 0;
      });
    } catch (error) {
      throw new Error(`Failed to sort data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Group data by fields and calculate aggregations
   * @param data - Source data
   * @param groupBy - Fields to group by
   * @param aggregations - Aggregation functions
   * @returns Grouped and aggregated data
   */
  groupData(
    data: Record<string, any>[],
    groupBy: string[],
    aggregations: Array<{
      field: string;
      function: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'first' | 'last';
      outputField?: string;
    }>
  ): Record<string, any>[] {
    try {
      const groups = new Map<string, Record<string, any>[]>();
      
      // Group data
      for (const row of data) {
        const groupKey = groupBy.map(field => String(row[field] || '')).join('|');
        
        if (!groups.has(groupKey)) {
          groups.set(groupKey, []);
        }
        groups.get(groupKey)!.push(row);
      }
      
      // Calculate aggregations
      const result: Record<string, any>[] = [];
      
      for (const [groupKey, groupRows] of groups.entries()) {
        const groupValues = groupKey.split('|');
        const aggregatedRow: Record<string, any> = {};
        
        // Add group by fields
        groupBy.forEach((field, index) => {
          aggregatedRow[field] = groupValues[index];
        });
        
        // Calculate aggregations
        for (const agg of aggregations) {
          const outputField = agg.outputField || `${agg.function}_${agg.field}`;
          const values = groupRows.map(row => row[agg.field]).filter(v => v !== null && v !== undefined && v !== '');
          
          switch (agg.function) {
            case 'sum':
              aggregatedRow[outputField] = values.reduce((sum, val) => sum + Number(val || 0), 0);
              break;
            case 'avg':
              aggregatedRow[outputField] = values.length > 0 
                ? values.reduce((sum, val) => sum + Number(val || 0), 0) / values.length 
                : 0;
              break;
            case 'count':
              aggregatedRow[outputField] = values.length;
              break;
            case 'min':
              aggregatedRow[outputField] = values.length > 0 ? Math.min(...values.map(v => Number(v))) : null;
              break;
            case 'max':
              aggregatedRow[outputField] = values.length > 0 ? Math.max(...values.map(v => Number(v))) : null;
              break;
            case 'first':
              aggregatedRow[outputField] = values.length > 0 ? values[0] : null;
              break;
            case 'last':
              aggregatedRow[outputField] = values.length > 0 ? values[values.length - 1] : null;
              break;
          }
        }
        
        result.push(aggregatedRow);
      }
      
      return result;
    } catch (error) {
      throw new Error(`Failed to group data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add calculated columns to data
   * @param data - Source data
   * @param calculations - Array of calculation definitions
   * @returns Data with calculated columns
   */
  addCalculatedColumns(
    data: Record<string, any>[],
    calculations: Array<{
      outputField: string;
      formula: string | ((row: Record<string, any>) => any);
      dataType?: 'string' | 'number' | 'date' | 'boolean';
    }>
  ): Record<string, any>[] {
    try {
      return data.map(row => {
        const enhancedRow = { ...row };
        
        for (const calc of calculations) {
          try {
            let result: any;
            
            if (typeof calc.formula === 'function') {
              result = calc.formula(row);
            } else {
              // Simple formula parsing for basic operations
              result = this.evaluateSimpleFormula(calc.formula, row);
            }
            
            // Apply data type conversion
            if (calc.dataType) {
              result = this.convertDataType(result, calc.dataType);
            }
            
            enhancedRow[calc.outputField] = result;
          } catch (error) {
            console.warn(`Failed to calculate ${calc.outputField}: ${error}`);
            enhancedRow[calc.outputField] = null;
          }
        }
        
        return enhancedRow;
      });
    } catch (error) {
      throw new Error(`Failed to add calculated columns: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Pivot data (transform rows to columns)
   * @param data - Source data
   * @param config - Pivot configuration
   * @returns Pivoted data
   */
  pivotData(
    data: Record<string, any>[],
    config: {
      rows: string[]; // Fields to use as row identifiers
      columns: string; // Field to pivot into columns
      values: string; // Field to aggregate
      aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max';
    }
  ): Record<string, any>[] {
    try {
      const { rows, columns, values, aggregation } = config;
      const pivotMap = new Map<string, Map<string, any[]>>();
      
      // Build pivot structure
      for (const row of data) {
        const rowKey = rows.map(field => String(row[field] || '')).join('|');
        const columnKey = String(row[columns] || '');
        const value = row[values];
        
        if (!pivotMap.has(rowKey)) {
          pivotMap.set(rowKey, new Map());
        }
        
        const rowMap = pivotMap.get(rowKey)!;
        if (!rowMap.has(columnKey)) {
          rowMap.set(columnKey, []);
        }
        
        rowMap.get(columnKey)!.push(value);
      }
      
      // Get all unique column keys
      const allColumnKeys = new Set<string>();
      for (const rowMap of pivotMap.values()) {
        for (const colKey of rowMap.keys()) {
          allColumnKeys.add(colKey);
        }
      }
      
      // Build result
      const result: Record<string, any>[] = [];
      
      for (const [rowKey, rowMap] of pivotMap.entries()) {
        const pivotRow: Record<string, any> = {};
        const rowValues = rowKey.split('|');
        
        // Add row identifier fields
        rows.forEach((field, index) => {
          pivotRow[field] = rowValues[index];
        });
        
        // Add pivoted columns
        for (const colKey of allColumnKeys) {
          const values = rowMap.get(colKey) || [];
          let aggregatedValue: any = null;
          
          if (values.length > 0) {
            const numericValues = values.filter(v => v !== null && v !== undefined).map(v => Number(v));
            
            switch (aggregation) {
              case 'sum':
                aggregatedValue = numericValues.reduce((sum, val) => sum + val, 0);
                break;
              case 'avg':
                aggregatedValue = numericValues.length > 0 ? numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length : 0;
                break;
              case 'count':
                aggregatedValue = values.length;
                break;
              case 'min':
                aggregatedValue = numericValues.length > 0 ? Math.min(...numericValues) : null;
                break;
              case 'max':
                aggregatedValue = numericValues.length > 0 ? Math.max(...numericValues) : null;
                break;
            }
          }
          
          pivotRow[colKey] = aggregatedValue;
        }
        
        result.push(pivotRow);
      }
      
      return result;
    } catch (error) {
      throw new Error(`Failed to pivot data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Write transformed data to target worksheet
   * @param data - Transformed data
   * @param options - Writing options
   */
  async writeTransformedData(
    data: Record<string, any>[],
    options: {
      targetWorksheet?: string;
      headers?: boolean;
      startRow?: number;
      startColumn?: number;
      autoFit?: boolean;
      headerStyle?: Partial<ExcelJS.Style>;
      dataStyle?: Partial<ExcelJS.Style>;
    } = {}
  ): Promise<void> {
    try {
      const {
        targetWorksheet = 'Transformed Data',
        headers = true,
        startRow = 1,
        startColumn = 1,
        autoFit = true,
        headerStyle,
        dataStyle
      } = options;

      // Create or get target worksheet
      let worksheet = this.workbook.getWorksheet(targetWorksheet);
      if (!worksheet) {
        worksheet = this.workbook.addWorksheet(targetWorksheet);
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
            cell.font = { bold: true };
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFE0E0E0' }
            };
          }
        });
        currentRow++;
      }

      // Write data
      for (const item of data) {
        const dataRow = worksheet.getRow(currentRow);
        keys.forEach((key, index) => {
          const cell = dataRow.getCell(startColumn + index);
          cell.value = this.processValueForCell(item[key]);
          
          if (dataStyle) {
            Object.assign(cell, dataStyle);
          }
        });
        currentRow++;
      }

      // Auto-fit columns
      if (autoFit) {
        this.autoFitColumns(worksheet, keys.length, startColumn);
      }

    } catch (error) {
      throw new Error(`Failed to write transformed data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Save transformed workbook
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
   * Get transformed workbook as buffer
   * @returns Buffer containing Excel file
   */
  async toBuffer(): Promise<Buffer> {
    try {
      return await this.workbook.xlsx.writeBuffer() as Buffer;
    } catch (error) {
      throw new Error(`Failed to create buffer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Helper methods

  private processCellValue(value: any): any {
    if (value === null || value === undefined) return null;
    if (typeof value === 'object' && 'result' in value) return value.result;
    if (value instanceof Date) return value;
    if (typeof value === 'object' && 'richText' in value) {
      return value.richText.map((rt: any) => rt.text).join('');
    }
    return value;
  }

  private processValueForCell(value: any): any {
    if (value === null || value === undefined) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'number') return value;
    if (typeof value === 'boolean') return value;
    return String(value);
  }

  private isEmptyRow(row: ExcelJS.Row): boolean {
    const values = row.values as any[];
    return values.length <= 1 || values.slice(1).every(value => 
      value === null || value === undefined || value === ''
    );
  }

  private compareValues(a: any, b: any, caseSensitive: boolean): number {
    if (a === b) return 0;
    
    const aStr = String(a || '');
    const bStr = String(b || '');
    
    if (caseSensitive) {
      return aStr.localeCompare(bStr);
    } else {
      return aStr.toLowerCase().localeCompare(bStr.toLowerCase());
    }
  }

  private evaluateSimpleFormula(formula: string, row: Record<string, any>): any {
    try {
      // Replace field references with actual values
      let expression = formula;
      for (const [field, value] of Object.entries(row)) {
        const regex = new RegExp(`\\b${field}\\b`, 'g');
        expression = expression.replace(regex, String(value || 0));
      }
      
      // Basic arithmetic evaluation (unsafe - for demo only)
      // In production, use a proper expression parser
      return Function(`"use strict"; return (${expression})`)();
    } catch {
      return null;
    }
  }

  private convertDataType(value: any, dataType: string): any {
    switch (dataType) {
      case 'number':
        return Number(value) || 0;
      case 'string':
        return String(value || '');
      case 'boolean':
        return Boolean(value);
      case 'date':
        return new Date(value);
      default:
        return value;
    }
  }

  private autoFitColumns(worksheet: ExcelJS.Worksheet, columnCount: number, startColumn: number): void {
    for (let i = 0; i < columnCount; i++) {
      const column = worksheet.getColumn(startColumn + i);
      let maxLength = 0;
      
      column.eachCell({ includeEmpty: false }, (cell) => {
        const cellValue = cell.value?.toString() || '';
        maxLength = Math.max(maxLength, cellValue.length);
      });
      
      column.width = Math.min(Math.max(maxLength + 2, 10), 50);
    }
  }

  /**
   * Example usage for data transformation
   */
  static async example(): Promise<void> {
    const transformer = new TransformExcelTemplate();
    
    try {
      // Load source data
      await transformer.loadFile('sales_data.xlsx');
      transformer.setSourceWorksheet(0);
      
      // Extract data
      const sourceData = await transformer.extractSourceData({
        headers: true,
        skipEmptyRows: true
      });
      
      // Filter data (sales > 10000)
      const filteredData = transformer.filterData(sourceData, [
        { field: 'Sales', operator: 'greaterThan', value: 10000 }
      ]);
      
      // Sort by sales descending
      const sortedData = transformer.sortData(filteredData, [
        { field: 'Sales', direction: 'desc', dataType: 'number' }
      ]);
      
      // Group by category and calculate totals
      const groupedData = transformer.groupData(sortedData, ['Category'], [
        { field: 'Sales', function: 'sum', outputField: 'Total_Sales' },
        { field: 'Sales', function: 'avg', outputField: 'Avg_Sales' },
        { field: 'Product', function: 'count', outputField: 'Product_Count' }
      ]);
      
      // Add calculated columns
      const enhancedData = transformer.addCalculatedColumns(groupedData, [
        {
          outputField: 'Sales_Per_Product',
          formula: (row: any) => row.Total_Sales / row.Product_Count,
          dataType: 'number'
        }
      ]);
      
      // Write transformed data
      await transformer.writeTransformedData(enhancedData, {
        targetWorksheet: 'Sales Analysis',
        headers: true,
        autoFit: true
      });
      
      // Save result
      await transformer.saveToFile('sales_analysis.xlsx');
      console.log('Data transformation completed!');
      
    } catch (error) {
      console.error('Error transforming data:', error);
    }
  }
}

export default TransformExcelTemplate;
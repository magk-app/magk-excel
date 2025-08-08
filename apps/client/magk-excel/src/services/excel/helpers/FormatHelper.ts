import * as ExcelJS from 'exceljs';
import { ExcelHelpers } from './ExcelHelpers';

/**
 * Formatting utilities for Excel files
 * Provides comprehensive styling, formatting, and visual enhancement tools
 */
export class FormatHelper {

  /**
   * Pre-defined style themes for consistent formatting
   */
  static readonly THEMES = {
    PROFESSIONAL: {
      header: {
        font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 },
        fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF2C3E50' } },
        alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
        border: {
          top: { style: 'medium' as const, color: { argb: 'FF2C3E50' } },
          bottom: { style: 'medium' as const, color: { argb: 'FF2C3E50' } },
          left: { style: 'medium' as const, color: { argb: 'FF2C3E50' } },
          right: { style: 'medium' as const, color: { argb: 'FF2C3E50' } }
        }
      },
      data: {
        font: { size: 11 },
        alignment: { vertical: 'middle' as const },
        border: {
          top: { style: 'thin' as const, color: { argb: 'FFD0D0D0' } },
          bottom: { style: 'thin' as const, color: { argb: 'FFD0D0D0' } },
          left: { style: 'thin' as const, color: { argb: 'FFD0D0D0' } },
          right: { style: 'thin' as const, color: { argb: 'FFD0D0D0' } }
        }
      },
      alternateRow: {
        fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFF8F9FA' } }
      }
    },
    MODERN: {
      header: {
        font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 13 },
        fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF3498DB' } },
        alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
        border: {
          top: { style: 'thick' as const, color: { argb: 'FF2980B9' } },
          bottom: { style: 'thick' as const, color: { argb: 'FF2980B9' } },
          left: { style: 'medium' as const, color: { argb: 'FF2980B9' } },
          right: { style: 'medium' as const, color: { argb: 'FF2980B9' } }
        }
      },
      data: {
        font: { size: 11 },
        alignment: { vertical: 'middle' as const, wrapText: true },
        border: {
          top: { style: 'hair' as const, color: { argb: 'FFE0E0E0' } },
          bottom: { style: 'hair' as const, color: { argb: 'FFE0E0E0' } }
        }
      },
      alternateRow: {
        fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFECF0F1' } }
      }
    },
    FINANCIAL: {
      header: {
        font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 },
        fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF27AE60' } },
        alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
        border: {
          top: { style: 'medium' as const },
          bottom: { style: 'medium' as const },
          left: { style: 'medium' as const },
          right: { style: 'medium' as const }
        }
      },
      data: {
        font: { size: 11 },
        alignment: { vertical: 'middle' as const },
        border: {
          top: { style: 'thin' as const },
          bottom: { style: 'thin' as const },
          left: { style: 'thin' as const },
          right: { style: 'thin' as const }
        }
      },
      alternateRow: {
        fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFF7F9FA' } }
      }
    }
  };

  /**
   * Number format patterns
   */
  static readonly NUMBER_FORMATS = {
    INTEGER: '#,##0',
    DECIMAL: '#,##0.00',
    CURRENCY_USD: '$#,##0.00',
    CURRENCY_EUR: '€#,##0.00',
    PERCENTAGE: '0.00%',
    SCIENTIFIC: '0.00E+00',
    FRACTION: '# ?/?',
    ACCOUNTING: '_($* #,##0.00_);_($* (#,##0.00);_($* "-"??_);_(@_)'
  };

  /**
   * Date format patterns
   */
  static readonly DATE_FORMATS = {
    SHORT_DATE: 'mm/dd/yyyy',
    LONG_DATE: 'dddd, mmmm dd, yyyy',
    ISO_DATE: 'yyyy-mm-dd',
    TIME_12H: 'h:mm AM/PM',
    TIME_24H: 'hh:mm',
    DATETIME: 'mm/dd/yyyy hh:mm',
    MONTH_YEAR: 'mmmm yyyy',
    QUARTER: '"Q"q yyyy'
  };

  /**
   * Apply theme formatting to a range
   * @param worksheet - Target worksheet
   * @param range - Range to format
   * @param theme - Theme to apply
   * @param options - Formatting options
   */
  static applyTheme(
    worksheet: ExcelJS.Worksheet,
    range: string,
    theme: keyof typeof FormatHelper.THEMES,
    options: {
      hasHeaders?: boolean;
      alternateRows?: boolean;
      freezeHeader?: boolean;
      autoFit?: boolean;
    } = {}
  ): void {
    const {
      hasHeaders = true,
      alternateRows = true,
      freezeHeader = true,
      autoFit = true
    } = options;

    const rangeInfo = ExcelHelpers.parseRange(range);
    const themeStyles = this.THEMES[theme];

    // Apply header formatting
    if (hasHeaders) {
      const headerRange = ExcelHelpers.createRange(
        rangeInfo.start.row,
        rangeInfo.start.column,
        rangeInfo.start.row,
        rangeInfo.end.column
      );
      
      ExcelHelpers.formatRange(worksheet, headerRange, themeStyles.header);
      
      // Freeze header row
      if (freezeHeader) {
        worksheet.views = [{ 
          state: 'frozen', 
          ySplit: rangeInfo.start.row,
          activeCell: ExcelHelpers.createCellAddress(rangeInfo.start.row + 1, rangeInfo.start.column)
        }];
      }
    }

    // Apply data formatting
    const dataStartRow = hasHeaders ? rangeInfo.start.row + 1 : rangeInfo.start.row;
    const dataRange = ExcelHelpers.createRange(
      dataStartRow,
      rangeInfo.start.column,
      rangeInfo.end.row,
      rangeInfo.end.column
    );

    ExcelHelpers.formatRange(worksheet, dataRange, themeStyles.data);

    // Apply alternating row colors
    if (alternateRows && themeStyles.alternateRow) {
      for (let row = dataStartRow; row <= rangeInfo.end.row; row++) {
        if ((row - dataStartRow) % 2 === 1) {
          const rowRange = ExcelHelpers.createRange(
            row,
            rangeInfo.start.column,
            row,
            rangeInfo.end.column
          );
          
          ExcelHelpers.formatRange(worksheet, rowRange, themeStyles.alternateRow);
        }
      }
    }

    // Auto-fit columns
    if (autoFit) {
      ExcelHelpers.autoResizeColumns(worksheet, {
        minWidth: 10,
        maxWidth: 50
      });
    }
  }

  /**
   * Apply conditional formatting based on data values
   * @param worksheet - Target worksheet
   * @param range - Range to format
   * @param rules - Conditional formatting rules
   */
  static applyConditionalFormatting(
    worksheet: ExcelJS.Worksheet,
    range: string,
    rules: Array<{
      type: 'cellValue' | 'expression' | 'colorScale' | 'dataBar' | 'iconSet';
      condition?: {
        operator: 'equal' | 'notEqual' | 'greaterThan' | 'lessThan' | 'between' | 'contains';
        value?: any;
        value2?: any;
      };
      formula?: string;
      style?: Partial<ExcelJS.Style>;
      colorScale?: {
        min: string;
        mid?: string;
        max: string;
      };
      dataBar?: {
        color: string;
        showValue?: boolean;
      };
      iconSet?: {
        type: '3Arrows' | '3TrafficLights' | '4Arrows' | '5Arrows';
        reverse?: boolean;
      };
    }>
  ): void {
    try {
      const rangeInfo = ExcelHelpers.parseRange(range);
      
      for (const rule of rules) {
        switch (rule.type) {
          case 'cellValue':
            if (rule.condition && rule.style) {
              this.applyCellValueFormatting(worksheet, rangeInfo, rule.condition, rule.style);
            }
            break;
          case 'expression':
            if (rule.formula && rule.style) {
              this.applyExpressionFormatting(worksheet, rangeInfo, rule.formula, rule.style);
            }
            break;
          case 'colorScale':
            if (rule.colorScale) {
              this.applyColorScaleFormatting(worksheet, rangeInfo, rule.colorScale);
            }
            break;
          case 'dataBar':
            if (rule.dataBar) {
              this.applyDataBarFormatting(worksheet, rangeInfo, rule.dataBar);
            }
            break;
        }
      }
    } catch (error) {
      console.warn('Conditional formatting failed:', error);
    }
  }

  /**
   * Format numbers with specific patterns
   * @param worksheet - Target worksheet
   * @param range - Range to format
   * @param formatType - Number format type
   * @param customFormat - Custom format string
   */
  static formatNumbers(
    worksheet: ExcelJS.Worksheet,
    range: string,
    formatType: keyof typeof FormatHelper.NUMBER_FORMATS | 'custom',
    customFormat?: string
  ): void {
    const rangeInfo = ExcelHelpers.parseRange(range);
    const format = formatType === 'custom' ? customFormat : this.NUMBER_FORMATS[formatType];
    
    if (!format) {
      throw new Error(`Invalid format type: ${formatType}`);
    }

    for (let row = rangeInfo.start.row; row <= rangeInfo.end.row; row++) {
      for (let col = rangeInfo.start.column; col <= rangeInfo.end.column; col++) {
        const cell = worksheet.getCell(row, col);
        cell.numFmt = format;
      }
    }
  }

  /**
   * Format dates with specific patterns
   * @param worksheet - Target worksheet
   * @param range - Range to format
   * @param formatType - Date format type
   * @param customFormat - Custom format string
   */
  static formatDates(
    worksheet: ExcelJS.Worksheet,
    range: string,
    formatType: keyof typeof FormatHelper.DATE_FORMATS | 'custom',
    customFormat?: string
  ): void {
    const rangeInfo = ExcelHelpers.parseRange(range);
    const format = formatType === 'custom' ? customFormat : this.DATE_FORMATS[formatType];
    
    if (!format) {
      throw new Error(`Invalid format type: ${formatType}`);
    }

    for (let row = rangeInfo.start.row; row <= rangeInfo.end.row; row++) {
      for (let col = rangeInfo.start.column; col <= rangeInfo.end.column; col++) {
        const cell = worksheet.getCell(row, col);
        cell.numFmt = format;
      }
    }
  }

  /**
   * Create professional charts and visualizations
   * @param worksheet - Target worksheet
   * @param chartConfig - Chart configuration
   */
  static addChart(
    worksheet: ExcelJS.Worksheet,
    chartConfig: {
      type: 'column' | 'line' | 'pie' | 'bar' | 'scatter' | 'area';
      title: string;
      dataRange: string;
      categoryRange?: string;
      position: { row: number; column: number };
      size?: { width: number; height: number };
      style?: {
        colors?: string[];
        showLegend?: boolean;
        showDataLabels?: boolean;
      };
    }
  ): void {
    // Note: ExcelJS has limited chart support, this is a placeholder for chart creation
    // In a real implementation, you might use a different library or export instructions
    
    const { position, size = { width: 600, height: 400 }, title } = chartConfig;
    
    // Add chart placeholder and instructions
    const chartCell = worksheet.getCell(position.row, position.column);
    chartCell.value = `[CHART: ${chartConfig.type.toUpperCase()}]`;
    chartCell.font = { bold: true, size: 14, color: { argb: 'FF3498DB' } };
    chartCell.alignment = { horizontal: 'center', vertical: 'middle' };
    
    const titleCell = worksheet.getCell(position.row, position.column + 1);
    titleCell.value = title;
    titleCell.font = { bold: true, size: 12 };
    
    const dataCell = worksheet.getCell(position.row + 1, position.column);
    dataCell.value = `Data Range: ${chartConfig.dataRange}`;
    dataCell.font = { italic: true, size: 10 };
    
    if (chartConfig.categoryRange) {
      const categoryCell = worksheet.getCell(position.row + 2, position.column);
      categoryCell.value = `Categories: ${chartConfig.categoryRange}`;
      categoryCell.font = { italic: true, size: 10 };
    }
  }

  /**
   * Apply advanced cell formatting
   * @param worksheet - Target worksheet
   * @param cellAddress - Cell address
   * @param formatting - Formatting options
   */
  static formatCell(
    worksheet: ExcelJS.Worksheet,
    cellAddress: string,
    formatting: {
      font?: {
        name?: string;
        size?: number;
        bold?: boolean;
        italic?: boolean;
        underline?: boolean;
        color?: string;
      };
      fill?: {
        type: 'solid' | 'gradient';
        color?: string;
        gradientColors?: string[];
      };
      border?: {
        style: 'thin' | 'medium' | 'thick' | 'double';
        color?: string;
        sides?: ('top' | 'bottom' | 'left' | 'right')[];
      };
      alignment?: {
        horizontal?: 'left' | 'center' | 'right';
        vertical?: 'top' | 'middle' | 'bottom';
        wrapText?: boolean;
        textRotation?: number;
      };
      numberFormat?: string;
    }
  ): void {
    const cell = worksheet.getCell(cellAddress);
    
    // Apply font formatting
    if (formatting.font) {
      const font: any = {};
      if (formatting.font.name) font.name = formatting.font.name;
      if (formatting.font.size) font.size = formatting.font.size;
      if (formatting.font.bold) font.bold = formatting.font.bold;
      if (formatting.font.italic) font.italic = formatting.font.italic;
      if (formatting.font.underline) font.underline = formatting.font.underline;
      if (formatting.font.color) font.color = { argb: formatting.font.color };
      
      if (Object.keys(font).length > 0) {
        cell.font = { ...cell.font, ...font };
      }
    }

    // Apply fill formatting
    if (formatting.fill) {
      if (formatting.fill.type === 'solid' && formatting.fill.color) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: formatting.fill.color }
        };
      }
    }

    // Apply border formatting
    if (formatting.border) {
      const borderStyle = {
        style: formatting.border.style,
        color: formatting.border.color ? { argb: formatting.border.color } : undefined
      };
      
      const sides = formatting.border.sides || ['top', 'bottom', 'left', 'right'];
      const border: any = {};
      
      sides.forEach(side => {
        border[side] = borderStyle;
      });
      
      cell.border = { ...cell.border, ...border };
    }

    // Apply alignment
    if (formatting.alignment) {
      const alignment: any = {};
      if (formatting.alignment.horizontal) alignment.horizontal = formatting.alignment.horizontal;
      if (formatting.alignment.vertical) alignment.vertical = formatting.alignment.vertical;
      if (formatting.alignment.wrapText !== undefined) alignment.wrapText = formatting.alignment.wrapText;
      if (formatting.alignment.textRotation) alignment.textRotation = formatting.alignment.textRotation;
      
      cell.alignment = { ...cell.alignment, ...alignment };
    }

    // Apply number format
    if (formatting.numberFormat) {
      cell.numFmt = formatting.numberFormat;
    }
  }

  /**
   * Create summary tables with totals and calculations
   * @param worksheet - Target worksheet
   * @param data - Source data
   * @param config - Summary configuration
   */
  static createSummaryTable(
    worksheet: ExcelJS.Worksheet,
    data: Record<string, any>[],
    config: {
      position: { row: number; column: number };
      groupBy?: string[];
      calculations: Array<{
        field: string;
        function: 'sum' | 'average' | 'count' | 'min' | 'max';
        label?: string;
      }>;
      formatting?: {
        theme?: keyof typeof FormatHelper.THEMES;
        headerStyle?: Partial<ExcelJS.Style>;
        dataStyle?: Partial<ExcelJS.Style>;
        totalStyle?: Partial<ExcelJS.Style>;
      };
    }
  ): void {
    const { position, groupBy, calculations, formatting } = config;
    let currentRow = position.row;
    let currentCol = position.column;

    // Create summary data
    const summaryData = this.calculateSummaryData(data, groupBy, calculations);
    
    // Write headers
    const headers = [
      ...(groupBy || []),
      ...calculations.map(calc => calc.label || `${calc.function}_${calc.field}`)
    ];

    headers.forEach((header, index) => {
      const cell = worksheet.getCell(currentRow, currentCol + index);
      cell.value = header;
      
      if (formatting?.headerStyle) {
        Object.assign(cell, formatting.headerStyle);
      } else if (formatting?.theme) {
        Object.assign(cell, this.THEMES[formatting.theme].header);
      }
    });
    
    currentRow++;

    // Write summary data
    summaryData.forEach(row => {
      headers.forEach((header, index) => {
        const cell = worksheet.getCell(currentRow, currentCol + index);
        cell.value = row[header];
        
        if (formatting?.dataStyle) {
          Object.assign(cell, formatting.dataStyle);
        } else if (formatting?.theme) {
          Object.assign(cell, this.THEMES[formatting.theme].data);
        }
      });
      currentRow++;
    });

    // Add totals row if applicable
    if (calculations.some(calc => ['sum', 'average', 'count'].includes(calc.function))) {
      const totalsRow = this.calculateTotals(summaryData, calculations);
      
      // Write "Total" label
      const totalLabelCell = worksheet.getCell(currentRow, currentCol);
      totalLabelCell.value = 'TOTAL';
      
      if (formatting?.totalStyle) {
        Object.assign(totalLabelCell, formatting.totalStyle);
      }
      
      // Write total values
      Object.entries(totalsRow).forEach(([key, value], index) => {
        const cell = worksheet.getCell(currentRow, currentCol + (groupBy?.length || 0) + index);
        cell.value = value;
        
        if (formatting?.totalStyle) {
          Object.assign(cell, formatting.totalStyle);
        }
      });
    }
  }

  // Helper methods for conditional formatting

  private static applyCellValueFormatting(
    worksheet: ExcelJS.Worksheet,
    rangeInfo: any,
    condition: any,
    style: Partial<ExcelJS.Style>
  ): void {
    for (let row = rangeInfo.start.row; row <= rangeInfo.end.row; row++) {
      for (let col = rangeInfo.start.column; col <= rangeInfo.end.column; col++) {
        const cell = worksheet.getCell(row, col);
        const cellValue = cell.value;
        
        let shouldFormat = false;
        
        switch (condition.operator) {
          case 'equal':
            shouldFormat = cellValue === condition.value;
            break;
          case 'notEqual':
            shouldFormat = cellValue !== condition.value;
            break;
          case 'greaterThan':
            shouldFormat = Number(cellValue) > Number(condition.value);
            break;
          case 'lessThan':
            shouldFormat = Number(cellValue) < Number(condition.value);
            break;
          case 'between':
            const num = Number(cellValue);
            shouldFormat = num >= Number(condition.value) && num <= Number(condition.value2);
            break;
          case 'contains':
            shouldFormat = String(cellValue).includes(String(condition.value));
            break;
        }
        
        if (shouldFormat) {
          Object.assign(cell, style);
        }
      }
    }
  }

  private static applyExpressionFormatting(
    worksheet: ExcelJS.Worksheet,
    rangeInfo: any,
    formula: string,
    style: Partial<ExcelJS.Style>
  ): void {
    // Simple expression evaluation for demonstration
    // In a real implementation, you'd use a proper formula parser
    for (let row = rangeInfo.start.row; row <= rangeInfo.end.row; row++) {
      for (let col = rangeInfo.start.column; col <= rangeInfo.end.column; col++) {
        const cell = worksheet.getCell(row, col);
        
        try {
          // This is a simplified example - real implementation would be more robust
          const cellRef = ExcelHelpers.createCellAddress(row, col);
          const evaluatedFormula = formula.replace(/[A-Z]+\d+/g, String(cell.value || 0));
          const result = Function(`"use strict"; return (${evaluatedFormula})`)();
          
          if (result) {
            Object.assign(cell, style);
          }
        } catch (error) {
          // Ignore evaluation errors
        }
      }
    }
  }

  private static applyColorScaleFormatting(
    worksheet: ExcelJS.Worksheet,
    rangeInfo: any,
    colorScale: { min: string; mid?: string; max: string }
  ): void {
    // Collect all numeric values to determine min/max
    const values: number[] = [];
    
    for (let row = rangeInfo.start.row; row <= rangeInfo.end.row; row++) {
      for (let col = rangeInfo.start.column; col <= rangeInfo.end.column; col++) {
        const cell = worksheet.getCell(row, col);
        const numValue = Number(cell.value);
        if (!isNaN(numValue)) {
          values.push(numValue);
        }
      }
    }
    
    if (values.length === 0) return;
    
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue;
    
    // Apply color scaling
    for (let row = rangeInfo.start.row; row <= rangeInfo.end.row; row++) {
      for (let col = rangeInfo.start.column; col <= rangeInfo.end.column; col++) {
        const cell = worksheet.getCell(row, col);
        const numValue = Number(cell.value);
        
        if (!isNaN(numValue)) {
          const ratio = range > 0 ? (numValue - minValue) / range : 0.5;
          const color = this.interpolateColor(colorScale.min, colorScale.max, ratio);
          
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: color }
          };
        }
      }
    }
  }

  private static applyDataBarFormatting(
    worksheet: ExcelJS.Worksheet,
    rangeInfo: any,
    dataBar: { color: string; showValue?: boolean }
  ): void {
    // Data bars are typically implemented as conditional formatting in Excel
    // This is a simplified representation
    for (let row = rangeInfo.start.row; row <= rangeInfo.end.row; row++) {
      for (let col = rangeInfo.start.column; col <= rangeInfo.end.column; col++) {
        const cell = worksheet.getCell(row, col);
        
        if (typeof cell.value === 'number') {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: dataBar.color }
          };
        }
      }
    }
  }

  private static calculateSummaryData(
    data: Record<string, any>[],
    groupBy?: string[],
    calculations: Array<{ field: string; function: string; label?: string }>
  ): Record<string, any>[] {
    if (!groupBy || groupBy.length === 0) {
      // No grouping, calculate overall totals
      const result: Record<string, any> = {};
      
      calculations.forEach(calc => {
        const values = data.map(row => Number(row[calc.field])).filter(val => !isNaN(val));
        const label = calc.label || `${calc.function}_${calc.field}`;
        
        switch (calc.function) {
          case 'sum':
            result[label] = values.reduce((sum, val) => sum + val, 0);
            break;
          case 'average':
            result[label] = values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
            break;
          case 'count':
            result[label] = values.length;
            break;
          case 'min':
            result[label] = values.length > 0 ? Math.min(...values) : 0;
            break;
          case 'max':
            result[label] = values.length > 0 ? Math.max(...values) : 0;
            break;
        }
      });
      
      return [result];
    }

    // Group data and calculate summaries
    const groups = new Map<string, Record<string, any>[]>();
    
    for (const row of data) {
      const groupKey = groupBy.map(field => String(row[field] || '')).join('|');
      
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(row);
    }
    
    const summaryData: Record<string, any>[] = [];
    
    for (const [groupKey, groupRows] of groups.entries()) {
      const groupValues = groupKey.split('|');
      const summary: Record<string, any> = {};
      
      // Add group by fields
      groupBy.forEach((field, index) => {
        summary[field] = groupValues[index];
      });
      
      // Calculate aggregations
      calculations.forEach(calc => {
        const values = groupRows.map(row => Number(row[calc.field])).filter(val => !isNaN(val));
        const label = calc.label || `${calc.function}_${calc.field}`;
        
        switch (calc.function) {
          case 'sum':
            summary[label] = values.reduce((sum, val) => sum + val, 0);
            break;
          case 'average':
            summary[label] = values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
            break;
          case 'count':
            summary[label] = values.length;
            break;
          case 'min':
            summary[label] = values.length > 0 ? Math.min(...values) : 0;
            break;
          case 'max':
            summary[label] = values.length > 0 ? Math.max(...values) : 0;
            break;
        }
      });
      
      summaryData.push(summary);
    }
    
    return summaryData;
  }

  private static calculateTotals(
    summaryData: Record<string, any>[],
    calculations: Array<{ field: string; function: string; label?: string }>
  ): Record<string, any> {
    const totals: Record<string, any> = {};
    
    calculations.forEach(calc => {
      const label = calc.label || `${calc.function}_${calc.field}`;
      const values = summaryData.map(row => Number(row[label])).filter(val => !isNaN(val));
      
      if (calc.function === 'sum' || calc.function === 'count') {
        totals[label] = values.reduce((sum, val) => sum + val, 0);
      } else if (calc.function === 'average') {
        totals[label] = values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
      }
    });
    
    return totals;
  }

  private static interpolateColor(color1: string, color2: string, ratio: number): string {
    // Simple color interpolation between two hex colors
    const hex1 = color1.replace('#', '').replace('FF', '');
    const hex2 = color2.replace('#', '').replace('FF', '');
    
    const r1 = parseInt(hex1.substr(0, 2), 16);
    const g1 = parseInt(hex1.substr(2, 2), 16);
    const b1 = parseInt(hex1.substr(4, 2), 16);
    
    const r2 = parseInt(hex2.substr(0, 2), 16);
    const g2 = parseInt(hex2.substr(2, 2), 16);
    const b2 = parseInt(hex2.substr(4, 2), 16);
    
    const r = Math.round(r1 + (r2 - r1) * ratio);
    const g = Math.round(g1 + (g2 - g1) * ratio);
    const b = Math.round(b1 + (b2 - b1) * ratio);
    
    return `FF${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  /**
   * Example usage of format helper
   */
  static exampleUsage(): void {
    console.log('Format Helper Examples:');
    console.log('Use applyTheme() for consistent styling');
    console.log('Use formatNumbers() for number formatting');
    console.log('Use formatDates() for date formatting');
    console.log('Use applyConditionalFormatting() for dynamic styling');
  }
}

export default FormatHelper;
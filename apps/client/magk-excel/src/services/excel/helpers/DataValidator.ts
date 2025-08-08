import * as ExcelJS from 'exceljs';
import { ExcelHelpers } from './ExcelHelpers';

/**
 * Data validation utilities for Excel files
 * Provides comprehensive validation rules and error reporting for Excel data
 */
export class DataValidator {

  /**
   * Validate data types in a range
   * @param worksheet - Source worksheet
   * @param range - Range to validate
   * @param expectedTypes - Expected data types by column
   * @returns Validation results
   */
  static validateDataTypes(
    worksheet: ExcelJS.Worksheet,
    range: string,
    expectedTypes: Record<string | number, 'number' | 'string' | 'date' | 'boolean' | 'email' | 'url' | 'phone'>
  ): {
    isValid: boolean;
    errors: Array<{
      cell: string;
      expected: string;
      actual: string;
      value: any;
      severity: 'error' | 'warning';
    }>;
    summary: {
      totalCells: number;
      validCells: number;
      errorCells: number;
      warningCells: number;
    };
  } {
    const rangeInfo = ExcelHelpers.parseRange(range);
    const errors: Array<{
      cell: string;
      expected: string;
      actual: string;
      value: any;
      severity: 'error' | 'warning';
    }> = [];
    
    let totalCells = 0;
    let validCells = 0;

    for (let row = rangeInfo.start.row; row <= rangeInfo.end.row; row++) {
      for (let col = rangeInfo.start.column; col <= rangeInfo.end.column; col++) {
        totalCells++;
        const cell = worksheet.getCell(row, col);
        const cellAddress = ExcelHelpers.createCellAddress(row, col);
        const cellValue = cell.value;
        
        // Skip empty cells
        if (cellValue === null || cellValue === undefined || cellValue === '') {
          validCells++;
          continue;
        }

        // Get expected type for this column
        const expectedType = expectedTypes[col] || expectedTypes[ExcelHelpers.columnNumberToLetter(col)];
        
        if (!expectedType) {
          validCells++;
          continue;
        }

        const validation = this.validateCellValue(cellValue, expectedType);
        
        if (!validation.isValid) {
          errors.push({
            cell: cellAddress,
            expected: expectedType,
            actual: validation.actualType,
            value: cellValue,
            severity: validation.severity
          });
        } else {
          validCells++;
        }
      }
    }

    const errorCells = errors.filter(e => e.severity === 'error').length;
    const warningCells = errors.filter(e => e.severity === 'warning').length;

    return {
      isValid: errorCells === 0,
      errors,
      summary: {
        totalCells,
        validCells,
        errorCells,
        warningCells
      }
    };
  }

  /**
   * Validate required fields
   * @param worksheet - Source worksheet
   * @param requiredFields - Required field definitions
   * @returns Validation results
   */
  static validateRequiredFields(
    worksheet: ExcelJS.Worksheet,
    requiredFields: Array<{
      column: string | number;
      name: string;
      range?: string;
      allowEmpty?: boolean;
      customValidator?: (value: any) => { isValid: boolean; message?: string };
    }>
  ): {
    isValid: boolean;
    errors: Array<{
      field: string;
      cell: string;
      message: string;
      severity: 'error' | 'warning';
    }>;
    summary: {
      totalFields: number;
      validFields: number;
      missingFields: number;
    };
  } {
    const errors: Array<{
      field: string;
      cell: string;
      message: string;
      severity: 'error' | 'warning';
    }> = [];

    let totalFields = 0;
    let validFields = 0;
    let missingFields = 0;

    for (const field of requiredFields) {
      const columnNumber = typeof field.column === 'string' 
        ? ExcelHelpers.columnLetterToNumber(field.column)
        : field.column;

      let workingRange: { start: { row: number; column: number }; end: { row: number; column: number } };
      
      if (field.range) {
        const rangeInfo = ExcelHelpers.parseRange(field.range);
        workingRange = { start: rangeInfo.start, end: rangeInfo.end };
      } else {
        // Use entire column data range
        const dataRange = this.detectColumnDataRange(worksheet, columnNumber);
        workingRange = dataRange;
      }

      for (let row = workingRange.start.row; row <= workingRange.end.row; row++) {
        totalFields++;
        const cell = worksheet.getCell(row, columnNumber);
        const cellAddress = ExcelHelpers.createCellAddress(row, columnNumber);
        const cellValue = cell.value;

        const isEmpty = cellValue === null || cellValue === undefined || String(cellValue).trim() === '';

        if (isEmpty && !field.allowEmpty) {
          missingFields++;
          errors.push({
            field: field.name,
            cell: cellAddress,
            message: `Required field '${field.name}' is missing`,
            severity: 'error'
          });
        } else if (!isEmpty && field.customValidator) {
          const customValidation = field.customValidator(cellValue);
          if (!customValidation.isValid) {
            errors.push({
              field: field.name,
              cell: cellAddress,
              message: customValidation.message || `Custom validation failed for '${field.name}'`,
              severity: 'error'
            });
          } else {
            validFields++;
          }
        } else {
          validFields++;
        }
      }
    }

    return {
      isValid: errors.filter(e => e.severity === 'error').length === 0,
      errors,
      summary: {
        totalFields,
        validFields,
        missingFields
      }
    };
  }

  /**
   * Validate data consistency and business rules
   * @param worksheet - Source worksheet
   * @param rules - Business validation rules
   * @returns Validation results
   */
  static validateBusinessRules(
    worksheet: ExcelJS.Worksheet,
    rules: Array<{
      name: string;
      description: string;
      validator: (row: Record<string, any>, rowIndex: number) => { isValid: boolean; message?: string; severity?: 'error' | 'warning' };
      range?: string;
      headers?: string[];
    }>
  ): {
    isValid: boolean;
    errors: Array<{
      rule: string;
      row: number;
      message: string;
      severity: 'error' | 'warning';
    }>;
    summary: {
      totalRulesChecked: number;
      passedRules: number;
      failedRules: number;
      warnings: number;
    };
  } {
    const errors: Array<{
      rule: string;
      row: number;
      message: string;
      severity: 'error' | 'warning';
    }> = [];

    let totalRulesChecked = 0;
    let passedRules = 0;

    for (const rule of rules) {
      let workingRange: { start: { row: number; column: number }; end: { row: number; column: number } };
      
      if (rule.range) {
        const rangeInfo = ExcelHelpers.parseRange(rule.range);
        workingRange = { start: rangeInfo.start, end: rangeInfo.end };
      } else {
        workingRange = this.detectWorksheetDataRange(worksheet);
      }

      // Extract headers if provided or auto-detect
      let headers: string[] = [];
      let dataStartRow = workingRange.start.row;

      if (rule.headers) {
        headers = rule.headers;
      } else {
        // Try to detect headers from first row
        const firstRowData = this.extractRowData(worksheet, workingRange.start.row, workingRange.start.column, workingRange.end.column);
        const hasTextHeaders = firstRowData.some(cell => 
          typeof cell === 'string' && isNaN(Number(cell)) && cell.trim() !== ''
        );
        
        if (hasTextHeaders) {
          headers = firstRowData.map(cell => String(cell || ''));
          dataStartRow = workingRange.start.row + 1;
        } else {
          // Generate default headers
          const columnCount = workingRange.end.column - workingRange.start.column + 1;
          headers = Array.from({ length: columnCount }, (_, i) => `Column${i + 1}`);
        }
      }

      // Validate each data row
      for (let row = dataStartRow; row <= workingRange.end.row; row++) {
        totalRulesChecked++;
        
        const rowData = this.extractRowData(worksheet, row, workingRange.start.column, workingRange.end.column);
        const rowObject: Record<string, any> = {};
        
        headers.forEach((header, index) => {
          rowObject[header] = rowData[index];
        });

        const ruleResult = rule.validator(rowObject, row);
        
        if (!ruleResult.isValid) {
          errors.push({
            rule: rule.name,
            row,
            message: ruleResult.message || `Business rule '${rule.name}' failed`,
            severity: ruleResult.severity || 'error'
          });
        } else {
          passedRules++;
        }
      }
    }

    const failedRules = errors.filter(e => e.severity === 'error').length;
    const warnings = errors.filter(e => e.severity === 'warning').length;

    return {
      isValid: failedRules === 0,
      errors,
      summary: {
        totalRulesChecked,
        passedRules,
        failedRules,
        warnings
      }
    };
  }

  /**
   * Validate data format patterns
   * @param worksheet - Source worksheet
   * @param formatRules - Format validation rules
   * @returns Validation results
   */
  static validateFormats(
    worksheet: ExcelJS.Worksheet,
    formatRules: Record<string | number, {
      pattern: RegExp;
      description: string;
      examples?: string[];
      severity?: 'error' | 'warning';
    }>
  ): {
    isValid: boolean;
    errors: Array<{
      cell: string;
      column: string;
      value: any;
      expected: string;
      message: string;
      severity: 'error' | 'warning';
    }>;
    summary: {
      totalCells: number;
      validFormats: number;
      invalidFormats: number;
    };
  } {
    const errors: Array<{
      cell: string;
      column: string;
      value: any;
      expected: string;
      message: string;
      severity: 'error' | 'warning';
    }> = [];

    let totalCells = 0;
    let validFormats = 0;

    const dataRange = this.detectWorksheetDataRange(worksheet);

    for (let row = dataRange.start.row; row <= dataRange.end.row; row++) {
      for (let col = dataRange.start.column; col <= dataRange.end.column; col++) {
        const columnLetter = ExcelHelpers.columnNumberToLetter(col);
        const formatRule = formatRules[col] || formatRules[columnLetter];
        
        if (!formatRule) continue;

        totalCells++;
        const cell = worksheet.getCell(row, col);
        const cellAddress = ExcelHelpers.createCellAddress(row, col);
        const cellValue = cell.value;

        // Skip empty cells
        if (cellValue === null || cellValue === undefined || cellValue === '') {
          validFormats++;
          continue;
        }

        const stringValue = String(cellValue);
        
        if (!formatRule.pattern.test(stringValue)) {
          errors.push({
            cell: cellAddress,
            column: columnLetter,
            value: cellValue,
            expected: formatRule.description,
            message: `Invalid format in column ${columnLetter}. Expected: ${formatRule.description}`,
            severity: formatRule.severity || 'error'
          });
        } else {
          validFormats++;
        }
      }
    }

    return {
      isValid: errors.filter(e => e.severity === 'error').length === 0,
      errors,
      summary: {
        totalCells,
        validFormats,
        invalidFormats: errors.length
      }
    };
  }

  /**
   * Validate data ranges and constraints
   * @param worksheet - Source worksheet
   * @param constraints - Data constraint rules
   * @returns Validation results
   */
  static validateConstraints(
    worksheet: ExcelJS.Worksheet,
    constraints: Record<string | number, {
      type: 'range' | 'list' | 'unique' | 'length' | 'custom';
      min?: number;
      max?: number;
      values?: any[];
      minLength?: number;
      maxLength?: number;
      validator?: (value: any) => boolean;
      message?: string;
      severity?: 'error' | 'warning';
    }>
  ): {
    isValid: boolean;
    errors: Array<{
      cell: string;
      column: string;
      constraint: string;
      value: any;
      message: string;
      severity: 'error' | 'warning';
    }>;
    summary: {
      totalChecks: number;
      passedChecks: number;
      failedChecks: number;
    };
  } {
    const errors: Array<{
      cell: string;
      column: string;
      constraint: string;
      value: any;
      message: string;
      severity: 'error' | 'warning';
    }> = [];

    let totalChecks = 0;
    let passedChecks = 0;
    const uniqueValueTrackers: Record<string, Set<any>> = {};

    const dataRange = this.detectWorksheetDataRange(worksheet);

    // Initialize unique value trackers
    for (const [colKey, constraint] of Object.entries(constraints)) {
      if (constraint.type === 'unique') {
        uniqueValueTrackers[colKey] = new Set();
      }
    }

    for (let row = dataRange.start.row; row <= dataRange.end.row; row++) {
      for (let col = dataRange.start.column; col <= dataRange.end.column; col++) {
        const columnLetter = ExcelHelpers.columnNumberToLetter(col);
        const constraint = constraints[col] || constraints[columnLetter];
        
        if (!constraint) continue;

        totalChecks++;
        const cell = worksheet.getCell(row, col);
        const cellAddress = ExcelHelpers.createCellAddress(row, col);
        const cellValue = cell.value;

        // Skip empty cells for most validations (except required)
        if (cellValue === null || cellValue === undefined || cellValue === '') {
          passedChecks++;
          continue;
        }

        let validationResult = { isValid: true, message: '' };

        switch (constraint.type) {
          case 'range':
            validationResult = this.validateRange(cellValue, constraint.min, constraint.max);
            break;
          case 'list':
            validationResult = this.validateList(cellValue, constraint.values || []);
            break;
          case 'unique':
            validationResult = this.validateUnique(cellValue, uniqueValueTrackers[col] || uniqueValueTrackers[columnLetter]);
            break;
          case 'length':
            validationResult = this.validateLength(cellValue, constraint.minLength, constraint.maxLength);
            break;
          case 'custom':
            validationResult = this.validateCustom(cellValue, constraint.validator);
            break;
        }

        if (!validationResult.isValid) {
          errors.push({
            cell: cellAddress,
            column: columnLetter,
            constraint: constraint.type,
            value: cellValue,
            message: constraint.message || validationResult.message,
            severity: constraint.severity || 'error'
          });
        } else {
          passedChecks++;
        }
      }
    }

    return {
      isValid: errors.filter(e => e.severity === 'error').length === 0,
      errors,
      summary: {
        totalChecks,
        passedChecks,
        failedChecks: errors.length
      }
    };
  }

  /**
   * Generate comprehensive validation report
   * @param worksheet - Source worksheet
   * @param validationConfig - Validation configuration
   * @returns Complete validation report
   */
  static generateValidationReport(
    worksheet: ExcelJS.Worksheet,
    validationConfig: {
      dataTypes?: Record<string | number, 'number' | 'string' | 'date' | 'boolean' | 'email' | 'url' | 'phone'>;
      requiredFields?: Array<{
        column: string | number;
        name: string;
        range?: string;
        allowEmpty?: boolean;
        customValidator?: (value: any) => { isValid: boolean; message?: string };
      }>;
      businessRules?: Array<{
        name: string;
        description: string;
        validator: (row: Record<string, any>, rowIndex: number) => { isValid: boolean; message?: string; severity?: 'error' | 'warning' };
        range?: string;
        headers?: string[];
      }>;
      formatRules?: Record<string | number, {
        pattern: RegExp;
        description: string;
        examples?: string[];
        severity?: 'error' | 'warning';
      }>;
      constraints?: Record<string | number, {
        type: 'range' | 'list' | 'unique' | 'length' | 'custom';
        min?: number;
        max?: number;
        values?: any[];
        minLength?: number;
        maxLength?: number;
        validator?: (value: any) => boolean;
        message?: string;
        severity?: 'error' | 'warning';
      }>;
      range?: string;
    }
  ): {
    isValid: boolean;
    summary: {
      totalValidations: number;
      passedValidations: number;
      failedValidations: number;
      warnings: number;
    };
    results: {
      dataTypes?: any;
      requiredFields?: any;
      businessRules?: any;
      formatRules?: any;
      constraints?: any;
    };
    recommendations: string[];
  } {
    const results: any = {};
    const recommendations: string[] = [];
    let totalValidations = 0;
    let passedValidations = 0;
    let failedValidations = 0;
    let warnings = 0;

    // Run data type validation
    if (validationConfig.dataTypes) {
      const range = validationConfig.range || this.getWorksheetRange(worksheet);
      results.dataTypes = this.validateDataTypes(worksheet, range, validationConfig.dataTypes);
      
      totalValidations += results.dataTypes.summary.totalCells;
      passedValidations += results.dataTypes.summary.validCells;
      failedValidations += results.dataTypes.summary.errorCells;
      warnings += results.dataTypes.summary.warningCells;

      if (results.dataTypes.summary.errorCells > 0) {
        recommendations.push('Fix data type mismatches to ensure data consistency');
      }
    }

    // Run required fields validation
    if (validationConfig.requiredFields) {
      results.requiredFields = this.validateRequiredFields(worksheet, validationConfig.requiredFields);
      
      totalValidations += results.requiredFields.summary.totalFields;
      passedValidations += results.requiredFields.summary.validFields;
      failedValidations += results.requiredFields.summary.missingFields;

      if (results.requiredFields.summary.missingFields > 0) {
        recommendations.push('Fill in all required fields to ensure data completeness');
      }
    }

    // Run business rules validation
    if (validationConfig.businessRules) {
      results.businessRules = this.validateBusinessRules(worksheet, validationConfig.businessRules);
      
      totalValidations += results.businessRules.summary.totalRulesChecked;
      passedValidations += results.businessRules.summary.passedRules;
      failedValidations += results.businessRules.summary.failedRules;
      warnings += results.businessRules.summary.warnings;

      if (results.businessRules.summary.failedRules > 0) {
        recommendations.push('Review and fix business rule violations');
      }
    }

    // Run format validation
    if (validationConfig.formatRules) {
      results.formatRules = this.validateFormats(worksheet, validationConfig.formatRules);
      
      totalValidations += results.formatRules.summary.totalCells;
      passedValidations += results.formatRules.summary.validFormats;
      failedValidations += results.formatRules.summary.invalidFormats;

      if (results.formatRules.summary.invalidFormats > 0) {
        recommendations.push('Standardize data formats for better consistency');
      }
    }

    // Run constraints validation
    if (validationConfig.constraints) {
      results.constraints = this.validateConstraints(worksheet, validationConfig.constraints);
      
      totalValidations += results.constraints.summary.totalChecks;
      passedValidations += results.constraints.summary.passedChecks;
      failedValidations += results.constraints.summary.failedChecks;

      if (results.constraints.summary.failedChecks > 0) {
        recommendations.push('Address data constraint violations');
      }
    }

    return {
      isValid: failedValidations === 0,
      summary: {
        totalValidations,
        passedValidations,
        failedValidations,
        warnings
      },
      results,
      recommendations
    };
  }

  // Helper methods

  private static validateCellValue(value: any, expectedType: string): {
    isValid: boolean;
    actualType: string;
    severity: 'error' | 'warning';
  } {
    let actualType = typeof value;
    let isValid = true;
    let severity: 'error' | 'warning' = 'error';

    switch (expectedType) {
      case 'number':
        isValid = typeof value === 'number' || !isNaN(Number(value));
        actualType = typeof value === 'number' ? 'number' : 'string';
        break;
      case 'string':
        isValid = typeof value === 'string';
        break;
      case 'date':
        isValid = value instanceof Date || !isNaN(Date.parse(String(value)));
        actualType = value instanceof Date ? 'date' : typeof value;
        break;
      case 'boolean':
        isValid = typeof value === 'boolean' || ['true', 'false', '1', '0', 'yes', 'no'].includes(String(value).toLowerCase());
        actualType = typeof value === 'boolean' ? 'boolean' : typeof value;
        severity = 'warning'; // Boolean conversion is often acceptable
        break;
      case 'email':
        isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value));
        actualType = 'string';
        break;
      case 'url':
        try {
          new URL(String(value));
          isValid = true;
        } catch {
          isValid = false;
        }
        actualType = 'string';
        break;
      case 'phone':
        isValid = /^\+?[\d\s\-\(\)]+$/.test(String(value)) && String(value).replace(/\D/g, '').length >= 10;
        actualType = 'string';
        break;
    }

    return { isValid, actualType, severity };
  }

  private static validateRange(value: any, min?: number, max?: number): { isValid: boolean; message: string } {
    const numValue = Number(value);
    
    if (isNaN(numValue)) {
      return { isValid: false, message: 'Value must be numeric for range validation' };
    }

    if (min !== undefined && numValue < min) {
      return { isValid: false, message: `Value ${numValue} is below minimum ${min}` };
    }

    if (max !== undefined && numValue > max) {
      return { isValid: false, message: `Value ${numValue} is above maximum ${max}` };
    }

    return { isValid: true, message: '' };
  }

  private static validateList(value: any, allowedValues: any[]): { isValid: boolean; message: string } {
    const isValid = allowedValues.includes(value);
    const message = isValid ? '' : `Value '${value}' is not in allowed list: ${allowedValues.join(', ')}`;
    return { isValid, message };
  }

  private static validateUnique(value: any, uniqueTracker: Set<any>): { isValid: boolean; message: string } {
    if (uniqueTracker.has(value)) {
      return { isValid: false, message: `Duplicate value '${value}' found` };
    }
    
    uniqueTracker.add(value);
    return { isValid: true, message: '' };
  }

  private static validateLength(value: any, minLength?: number, maxLength?: number): { isValid: boolean; message: string } {
    const stringValue = String(value);
    const length = stringValue.length;

    if (minLength !== undefined && length < minLength) {
      return { isValid: false, message: `Length ${length} is below minimum ${minLength}` };
    }

    if (maxLength !== undefined && length > maxLength) {
      return { isValid: false, message: `Length ${length} is above maximum ${maxLength}` };
    }

    return { isValid: true, message: '' };
  }

  private static validateCustom(value: any, validator?: (value: any) => boolean): { isValid: boolean; message: string } {
    if (!validator) {
      return { isValid: true, message: '' };
    }

    const isValid = validator(value);
    return { 
      isValid, 
      message: isValid ? '' : `Custom validation failed for value '${value}'` 
    };
  }

  private static detectColumnDataRange(worksheet: ExcelJS.Worksheet, columnNumber: number): {
    start: { row: number; column: number };
    end: { row: number; column: number };
  } {
    let startRow = Number.MAX_SAFE_INTEGER;
    let endRow = 0;
    let hasData = false;

    worksheet.eachRow((row, rowNumber) => {
      const cell = row.getCell(columnNumber);
      if (cell.value !== null && cell.value !== undefined && cell.value !== '') {
        hasData = true;
        startRow = Math.min(startRow, rowNumber);
        endRow = Math.max(endRow, rowNumber);
      }
    });

    if (!hasData) {
      return { start: { row: 1, column: columnNumber }, end: { row: 1, column: columnNumber } };
    }

    return {
      start: { row: startRow, column: columnNumber },
      end: { row: endRow, column: columnNumber }
    };
  }

  private static detectWorksheetDataRange(worksheet: ExcelJS.Worksheet): {
    start: { row: number; column: number };
    end: { row: number; column: number };
  } {
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

  private static extractRowData(worksheet: ExcelJS.Worksheet, rowNumber: number, startColumn: number, endColumn: number): any[] {
    const row = worksheet.getRow(rowNumber);
    const data: any[] = [];
    
    for (let col = startColumn; col <= endColumn; col++) {
      const cell = row.getCell(col);
      data.push(cell.value);
    }
    
    return data;
  }

  private static getWorksheetRange(worksheet: ExcelJS.Worksheet): string {
    const dataRange = this.detectWorksheetDataRange(worksheet);
    return ExcelHelpers.createRange(
      dataRange.start.row,
      dataRange.start.column,
      dataRange.end.row,
      dataRange.end.column
    );
  }

  /**
   * Example usage of data validator
   */
  static exampleUsage(): void {
    console.log('Data Validator Examples:');
    console.log('Use validateDataTypes() for type checking');
    console.log('Use validateRequiredFields() for mandatory data');
    console.log('Use validateBusinessRules() for complex logic');
    console.log('Use generateValidationReport() for comprehensive validation');
  }
}

export default DataValidator;
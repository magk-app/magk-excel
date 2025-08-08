/**
 * MAGK Excel Services - Comprehensive Excel operation library
 * 
 * This module provides a complete suite of Excel templates, helpers, and code generation tools
 * designed to make Excel operations easy and intuitive for both developers and AI systems.
 * 
 * @author MAGK Excel Team
 * @version 1.0.0
 */

// Templates
export { ReadExcelTemplate } from './templates/ReadExcelTemplate';
export { WriteExcelTemplate } from './templates/WriteExcelTemplate';
export { UpdateExcelTemplate } from './templates/UpdateExcelTemplate';
export { TransformExcelTemplate } from './templates/TransformExcelTemplate';
export { AnalysisExcelTemplate } from './templates/AnalysisExcelTemplate';
export { PDFToExcelTemplate } from './templates/PDFToExcelTemplate';

// Helpers
export { ExcelHelpers } from './helpers/ExcelHelpers';
export { DataExtractor } from './helpers/DataExtractor';
export { DataValidator } from './helpers/DataValidator';
export { FormatHelper } from './helpers/FormatHelper';

// Code Generation
export { ExcelCodeGenerator } from './codeGen/ExcelCodeGenerator';
export { TemplateSelector } from './codeGen/TemplateSelector';

/**
 * Main Excel service class that combines all templates and helpers
 * Provides a unified interface for all Excel operations
 */
export class ExcelService {
  /**
   * Quick access to all templates
   */
  static get Templates() {
    return {
      Read: ReadExcelTemplate,
      Write: WriteExcelTemplate,
      Update: UpdateExcelTemplate,
      Transform: TransformExcelTemplate,
      Analysis: AnalysisExcelTemplate,
      PDFToExcel: PDFToExcelTemplate
    };
  }

  /**
   * Quick access to all helpers
   */
  static get Helpers() {
    return {
      Excel: ExcelHelpers,
      DataExtractor: DataExtractor,
      DataValidator: DataValidator,
      FormatHelper: FormatHelper
    };
  }

  /**
   * Quick access to code generation tools
   */
  static get CodeGen() {
    return {
      Generator: ExcelCodeGenerator,
      TemplateSelector: TemplateSelector
    };
  }

  /**
   * Generate Excel code from natural language prompt
   * @param prompt - User's request in natural language
   * @param context - Additional context information
   * @returns Generated code with explanation
   */
  static generateCode(prompt: string, context?: any) {
    return ExcelCodeGenerator.generateCode(prompt, context);
  }

  /**
   * Create a new Excel reader instance
   * @returns ReadExcelTemplate instance
   */
  static createReader() {
    return new ReadExcelTemplate();
  }

  /**
   * Create a new Excel writer instance
   * @returns WriteExcelTemplate instance
   */
  static createWriter() {
    return new WriteExcelTemplate();
  }

  /**
   * Create a new Excel updater instance
   * @returns UpdateExcelTemplate instance
   */
  static createUpdater() {
    return new UpdateExcelTemplate();
  }

  /**
   * Create a new Excel transformer instance
   * @returns TransformExcelTemplate instance
   */
  static createTransformer() {
    return new TransformExcelTemplate();
  }

  /**
   * Create a new Excel analyzer instance
   * @returns AnalysisExcelTemplate instance
   */
  static createAnalyzer() {
    return new AnalysisExcelTemplate();
  }

  /**
   * Create a new PDF to Excel converter instance
   * @returns PDFToExcelTemplate instance
   */
  static createPDFConverter() {
    return new PDFToExcelTemplate();
  }

  /**
   * Validate Excel data using common rules
   * @param worksheet - Excel worksheet
   * @param validationRules - Validation configuration
   * @returns Validation results
   */
  static validateData(worksheet: any, validationRules: any) {
    return DataValidator.generateValidationReport(worksheet, validationRules);
  }

  /**
   * Extract structured data from Excel worksheet
   * @param worksheet - Excel worksheet
   * @param options - Extraction options
   * @returns Extracted data
   */
  static extractData(worksheet: any, options?: any) {
    return DataExtractor.extractTable(worksheet, options);
  }

  /**
   * Apply professional formatting to Excel range
   * @param worksheet - Excel worksheet
   * @param range - Cell range to format
   * @param theme - Formatting theme
   * @param options - Formatting options
   */
  static formatRange(worksheet: any, range: string, theme: any, options?: any) {
    return FormatHelper.applyTheme(worksheet, range, theme, options);
  }

  /**
   * Get help and examples for Excel operations
   * @returns Help information
   */
  static getHelp() {
    return {
      templates: {
        description: 'Pre-built templates for common Excel operations',
        available: [
          'ReadExcelTemplate - Reading and extracting data from Excel files',
          'WriteExcelTemplate - Creating new Excel files with formatting',
          'UpdateExcelTemplate - Modifying existing Excel files',
          'TransformExcelTemplate - Data transformation and processing',
          'AnalysisExcelTemplate - Statistical analysis and reporting',
          'PDFToExcelTemplate - Converting PDF content to Excel'
        ]
      },
      helpers: {
        description: 'Utility functions for Excel operations',
        available: [
          'ExcelHelpers - Common Excel utilities and conversions',
          'DataExtractor - Specialized data extraction methods',
          'DataValidator - Comprehensive data validation',
          'FormatHelper - Professional formatting and styling'
        ]
      },
      codeGeneration: {
        description: 'AI-powered code generation from natural language',
        usage: 'ExcelService.generateCode("Create an Excel file with sales data")',
        features: [
          'Natural language to ExcelJS code conversion',
          'Automatic template selection',
          'Error handling and best practices',
          'TypeScript and JavaScript support'
        ]
      },
      examples: {
        basicUsage: `
// Create and use a writer
const writer = ExcelService.createWriter();
await writer.writeFromObjects('Sales', data, { headers: true });
await writer.saveToFile('output.xlsx');

// Generate code from prompt
const result = ExcelService.generateCode('Read sales data and calculate totals');
console.log(result.code);

// Extract data with validation
const reader = ExcelService.createReader();
await reader.loadFile('data.xlsx');
const data = await reader.readAsObjects(0);
const validation = ExcelService.validateData(worksheet, validationRules);
        `
      }
    };
  }

  /**
   * Get version information
   * @returns Version and build information
   */
  static getVersion() {
    return {
      version: '1.0.0',
      build: '2024.01',
      description: 'MAGK Excel Services - Comprehensive Excel operation library',
      features: [
        '6 specialized templates for different Excel operations',
        '4 helper classes with utility functions',
        'AI-powered code generation from natural language',
        'Comprehensive data validation and extraction',
        'Professional formatting and styling tools',
        'Full TypeScript support with type safety',
        'Extensive error handling and logging',
        'Compatible with ExcelJS and executor tools'
      ],
      license: 'MIT',
      author: 'MAGK Excel Team'
    };
  }
}

// Re-export everything for convenience
import { ReadExcelTemplate } from './templates/ReadExcelTemplate';
import { WriteExcelTemplate } from './templates/WriteExcelTemplate';
import { UpdateExcelTemplate } from './templates/UpdateExcelTemplate';
import { TransformExcelTemplate } from './templates/TransformExcelTemplate';
import { AnalysisExcelTemplate } from './templates/AnalysisExcelTemplate';
import { PDFToExcelTemplate } from './templates/PDFToExcelTemplate';
import { ExcelHelpers } from './helpers/ExcelHelpers';
import { DataExtractor } from './helpers/DataExtractor';
import { DataValidator } from './helpers/DataValidator';
import { FormatHelper } from './helpers/FormatHelper';
import { ExcelCodeGenerator } from './codeGen/ExcelCodeGenerator';
import { TemplateSelector } from './codeGen/TemplateSelector';

export default ExcelService;
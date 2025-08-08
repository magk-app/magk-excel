import { TemplateSelector } from './TemplateSelector';

/**
 * Code generator for ExcelJS operations based on user prompts
 * Analyzes user intent and generates appropriate ExcelJS code using templates
 */
export class ExcelCodeGenerator {

  /**
   * Generate ExcelJS code from user prompt
   * @param prompt - User's natural language request
   * @param context - Additional context information
   * @returns Generated code with explanation
   */
  static generateCode(
    prompt: string,
    context: {
      availableFiles?: string[];
      dataStructure?: Record<string, any>;
      outputFormat?: 'typescript' | 'javascript';
      includeComments?: boolean;
      includeErrorHandling?: boolean;
    } = {}
  ): {
    code: string;
    explanation: string;
    template: string;
    dependencies: string[];
    executionSteps: string[];
  } {
    const {
      outputFormat = 'typescript',
      includeComments = true,
      includeErrorHandling = true
    } = context;

    // Analyze the prompt to determine intent
    const intent = this.analyzePrompt(prompt, context);
    
    // Select appropriate template
    const templateInfo = TemplateSelector.selectTemplate(intent);
    
    // Generate code based on template and intent
    const codeGeneration = this.generateCodeFromTemplate(
      templateInfo,
      intent,
      outputFormat,
      includeComments,
      includeErrorHandling
    );

    return {
      code: codeGeneration.code,
      explanation: codeGeneration.explanation,
      template: templateInfo.template,
      dependencies: codeGeneration.dependencies,
      executionSteps: codeGeneration.steps
    };
  }

  /**
   * Analyze user prompt to extract intent and parameters
   * @param prompt - User prompt
   * @param context - Additional context
   * @returns Analyzed intent
   */
  private static analyzePrompt(
    prompt: string,
    context: any
  ): {
    operation: string;
    dataSource?: string;
    targetFile?: string;
    columns?: string[];
    filters?: any[];
    transformations?: any[];
    analysis?: any[];
    formatting?: any;
    businessRules?: any[];
    parameters: Record<string, any>;
  } {
    const lowerPrompt = prompt.toLowerCase();
    const intent: any = {
      operation: 'unknown',
      parameters: {}
    };

    // Detect primary operation
    if (lowerPrompt.includes('read') || lowerPrompt.includes('load') || lowerPrompt.includes('import')) {
      intent.operation = 'read';
    } else if (lowerPrompt.includes('create') || lowerPrompt.includes('generate') || lowerPrompt.includes('new')) {
      intent.operation = 'write';
    } else if (lowerPrompt.includes('update') || lowerPrompt.includes('modify') || lowerPrompt.includes('change')) {
      intent.operation = 'update';
    } else if (lowerPrompt.includes('transform') || lowerPrompt.includes('convert') || lowerPrompt.includes('process')) {
      intent.operation = 'transform';
    } else if (lowerPrompt.includes('analyze') || lowerPrompt.includes('statistics') || lowerPrompt.includes('summary')) {
      intent.operation = 'analysis';
    } else if (lowerPrompt.includes('pdf') && (lowerPrompt.includes('extract') || lowerPrompt.includes('convert'))) {
      intent.operation = 'pdf_to_excel';
    }

    // Extract file references
    const fileMatches = prompt.match(/['"`]([^'"`]+\.xlsx?)["`']/gi);
    if (fileMatches) {
      intent.dataSource = fileMatches[0].replace(/['"]/g, '');
    }

    // Extract column references
    const columnMatches = prompt.match(/column[s]?\s+([A-Za-z,\s]+)/gi);
    if (columnMatches) {
      intent.columns = columnMatches[0]
        .replace(/column[s]?\s+/gi, '')
        .split(',')
        .map(col => col.trim());
    }

    // Detect data transformations
    intent.transformations = [];
    if (lowerPrompt.includes('filter')) {
      intent.transformations.push({ type: 'filter', detected: true });
    }
    if (lowerPrompt.includes('sort')) {
      intent.transformations.push({ type: 'sort', detected: true });
    }
    if (lowerPrompt.includes('group') || lowerPrompt.includes('aggregate')) {
      intent.transformations.push({ type: 'group', detected: true });
    }
    if (lowerPrompt.includes('pivot')) {
      intent.transformations.push({ type: 'pivot', detected: true });
    }

    // Detect analysis requirements
    intent.analysis = [];
    if (lowerPrompt.includes('statistics') || lowerPrompt.includes('stats')) {
      intent.analysis.push({ type: 'descriptive', detected: true });
    }
    if (lowerPrompt.includes('correlation')) {
      intent.analysis.push({ type: 'correlation', detected: true });
    }
    if (lowerPrompt.includes('trend')) {
      intent.analysis.push({ type: 'trend', detected: true });
    }

    // Detect formatting requirements
    if (lowerPrompt.includes('format') || lowerPrompt.includes('style')) {
      intent.formatting = { required: true };
    }

    // Extract specific parameters
    this.extractParameters(prompt, intent);

    return intent;
  }

  /**
   * Extract specific parameters from prompt
   * @param prompt - User prompt
   * @param intent - Intent object to populate
   */
  private static extractParameters(prompt: string, intent: any): void {
    const parameters = intent.parameters;

    // Extract numeric values
    const numberMatches = prompt.match(/\d+/g);
    if (numberMatches) {
      parameters.numbers = numberMatches.map(n => parseInt(n, 10));
    }

    // Extract ranges
    const rangeMatches = prompt.match(/[A-Z]\d+:[A-Z]\d+/gi);
    if (rangeMatches) {
      parameters.ranges = rangeMatches;
    }

    // Extract file types
    if (prompt.includes('.xlsx')) parameters.fileType = 'xlsx';
    if (prompt.includes('.xls')) parameters.fileType = 'xls';
    if (prompt.includes('.csv')) parameters.fileType = 'csv';
    if (prompt.includes('.pdf')) parameters.sourceType = 'pdf';

    // Extract operation modifiers
    if (prompt.toLowerCase().includes('header')) parameters.hasHeaders = true;
    if (prompt.toLowerCase().includes('no header')) parameters.hasHeaders = false;
    if (prompt.toLowerCase().includes('sum')) parameters.includeSum = true;
    if (prompt.toLowerCase().includes('average')) parameters.includeAverage = true;
    if (prompt.toLowerCase().includes('count')) parameters.includeCount = true;
    if (prompt.toLowerCase().includes('chart') || prompt.toLowerCase().includes('graph')) {
      parameters.includeChart = true;
    }
  }

  /**
   * Generate code from selected template and intent
   * @param templateInfo - Selected template information
   * @param intent - Analyzed intent
   * @param outputFormat - Code output format
   * @param includeComments - Whether to include comments
   * @param includeErrorHandling - Whether to include error handling
   * @returns Generated code with metadata
   */
  private static generateCodeFromTemplate(
    templateInfo: any,
    intent: any,
    outputFormat: string,
    includeComments: boolean,
    includeErrorHandling: boolean
  ): {
    code: string;
    explanation: string;
    dependencies: string[];
    steps: string[];
  } {
    const isTypeScript = outputFormat === 'typescript';
    
    switch (templateInfo.template) {
      case 'read':
        return this.generateReadCode(intent, isTypeScript, includeComments, includeErrorHandling);
      case 'write':
        return this.generateWriteCode(intent, isTypeScript, includeComments, includeErrorHandling);
      case 'update':
        return this.generateUpdateCode(intent, isTypeScript, includeComments, includeErrorHandling);
      case 'transform':
        return this.generateTransformCode(intent, isTypeScript, includeComments, includeErrorHandling);
      case 'analysis':
        return this.generateAnalysisCode(intent, isTypeScript, includeComments, includeErrorHandling);
      case 'pdf_to_excel':
        return this.generatePDFToExcelCode(intent, isTypeScript, includeComments, includeErrorHandling);
      default:
        return this.generateGenericCode(intent, isTypeScript, includeComments, includeErrorHandling);
    }
  }

  /**
   * Generate code for reading Excel files
   */
  private static generateReadCode(
    intent: any,
    isTypeScript: boolean,
    includeComments: boolean,
    includeErrorHandling: boolean
  ): any {
    const imports = isTypeScript 
      ? "import * as ExcelJS from 'exceljs';\nimport { ReadExcelTemplate } from './templates/ReadExcelTemplate';"
      : "const ExcelJS = require('exceljs');\nconst { ReadExcelTemplate } = require('./templates/ReadExcelTemplate');";

    let code = imports + '\n\n';

    if (includeComments) {
      code += '// Generated code for reading Excel file\n';
    }

    if (includeErrorHandling) {
      code += 'async function readExcelFile() {\n  try {\n';
    } else {
      code += 'async function readExcelFile() {\n';
    }

    code += '    const reader = new ReadExcelTemplate();\n';
    
    if (intent.dataSource) {
      code += `    await reader.loadFile('${intent.dataSource}');\n`;
    } else {
      code += '    await reader.loadFile(\'data.xlsx\');\n';
    }

    if (includeComments) {
      code += '\n    // Extract data as objects\n';
    }

    const options: string[] = [];
    if (intent.parameters.hasHeaders !== false) {
      options.push('headers: true');
    }
    options.push('skipEmptyRows: true');

    code += `    const data = await reader.readAsObjects(0, {\n      ${options.join(',\n      ')}\n    });\n`;

    if (includeComments) {
      code += '\n    // Log the extracted data\n';
    }
    code += '    console.log(\'Extracted data:\', data);\n';
    code += '    return data;\n';

    if (includeErrorHandling) {
      code += '  } catch (error) {\n';
      code += '    console.error(\'Error reading Excel file:\', error);\n';
      code += '    throw error;\n';
      code += '  }\n';
    }

    code += '}\n\n';
    code += '// Execute the function\n';
    code += 'readExcelFile().then(data => {\n';
    code += '  console.log(\'Successfully read\', data.length, \'rows\');\n';
    code += '}).catch(error => {\n';
    code += '  console.error(\'Failed to read Excel file:\', error);\n';
    code += '});';

    return {
      code,
      explanation: 'This code reads an Excel file and extracts data as JavaScript objects, with automatic header detection and empty row filtering.',
      dependencies: ['exceljs'],
      steps: [
        'Import ReadExcelTemplate',
        'Create reader instance',
        'Load Excel file',
        'Extract data with options',
        'Process and return data'
      ]
    };
  }

  /**
   * Generate code for creating Excel files
   */
  private static generateWriteCode(
    intent: any,
    isTypeScript: boolean,
    includeComments: boolean,
    includeErrorHandling: boolean
  ): any {
    const imports = isTypeScript 
      ? "import * as ExcelJS from 'exceljs';\nimport { WriteExcelTemplate } from './templates/WriteExcelTemplate';"
      : "const ExcelJS = require('exceljs');\nconst { WriteExcelTemplate } = require('./templates/WriteExcelTemplate');";

    let code = imports + '\n\n';

    if (includeComments) {
      code += '// Generated code for creating Excel file\n';
    }

    if (includeErrorHandling) {
      code += 'async function createExcelFile() {\n  try {\n';
    } else {
      code += 'async function createExcelFile() {\n';
    }

    code += '    const writer = new WriteExcelTemplate();\n\n';

    if (includeComments) {
      code += '    // Sample data - replace with your actual data\n';
    }

    code += '    const sampleData = [\n';
    code += '      { Name: \'John Doe\', Age: 30, Salary: 50000, Department: \'Engineering\' },\n';
    code += '      { Name: \'Jane Smith\', Age: 25, Salary: 45000, Department: \'Marketing\' },\n';
    code += '      { Name: \'Bob Johnson\', Age: 35, Salary: 60000, Department: \'Sales\' }\n';
    code += '    ];\n\n';

    if (includeComments) {
      code += '    // Write data to Excel worksheet\n';
    }

    const options: string[] = [];
    if (intent.parameters.hasHeaders !== false) {
      options.push('headers: true');
    }
    options.push('autoFitColumns: true');

    if (intent.formatting) {
      options.push(`headerStyle: {
        font: { bold: true, color: { argb: 'FFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '366092' } }
      }`);
    }

    code += `    await writer.writeFromObjects('Data', sampleData, {\n      ${options.join(',\n      ')}\n    });\n\n`;

    const fileName = intent.dataSource || 'output.xlsx';
    code += `    await writer.saveToFile('${fileName}');\n`;
    code += `    console.log('Excel file created: ${fileName}');\n`;

    if (includeErrorHandling) {
      code += '  } catch (error) {\n';
      code += '    console.error(\'Error creating Excel file:\', error);\n';
      code += '    throw error;\n';
      code += '  }\n';
    }

    code += '}\n\n';
    code += '// Execute the function\n';
    code += 'createExcelFile();';

    return {
      code,
      explanation: 'This code creates a new Excel file with sample data, including headers and professional formatting.',
      dependencies: ['exceljs'],
      steps: [
        'Import WriteExcelTemplate',
        'Create writer instance',
        'Define sample data',
        'Write data with formatting options',
        'Save file to disk'
      ]
    };
  }

  /**
   * Generate code for updating Excel files
   */
  private static generateUpdateCode(
    intent: any,
    isTypeScript: boolean,
    includeComments: boolean,
    includeErrorHandling: boolean
  ): any {
    const imports = isTypeScript 
      ? "import * as ExcelJS from 'exceljs';\nimport { UpdateExcelTemplate } from './templates/UpdateExcelTemplate';"
      : "const ExcelJS = require('exceljs');\nconst { UpdateExcelTemplate } = require('./templates/UpdateExcelTemplate');";

    let code = imports + '\n\n';

    if (includeComments) {
      code += '// Generated code for updating Excel file\n';
    }

    if (includeErrorHandling) {
      code += 'async function updateExcelFile() {\n  try {\n';
    } else {
      code += 'async function updateExcelFile() {\n';
    }

    code += '    const updater = new UpdateExcelTemplate();\n\n';

    const sourceFile = intent.dataSource || 'existing_data.xlsx';
    code += `    await updater.loadFile('${sourceFile}');\n\n`;

    if (includeComments) {
      code += '    // Update specific cells\n';
    }

    code += '    updater.updateCell(0, \'A1\', \'Updated Value\');\n\n';

    if (includeComments) {
      code += '    // Update multiple cells at once\n';
    }

    code += '    updater.updateCells(0, [\n';
    code += '      { cell: \'B2\', value: 25000 },\n';
    code += '      { cell: \'B3\', value: 30000 },\n';
    code += '      { cell: \'B4\', value: 18000 }\n';
    code += '    ]);\n\n';

    if (intent.transformations?.some((t: any) => t.type === 'add_data')) {
      if (includeComments) {
        code += '    // Append new data\n';
      }
      code += '    updater.appendData(0, [\n';
      code += '      { Product: \'New Item\', Category: \'Electronics\', Sales: 15000 }\n';
      code += '    ]);\n\n';
    }

    const outputFile = intent.targetFile || sourceFile;
    code += `    await updater.saveToFile('${outputFile}');\n`;
    code += `    console.log('Excel file updated: ${outputFile}');\n`;

    if (includeErrorHandling) {
      code += '  } catch (error) {\n';
      code += '    console.error(\'Error updating Excel file:\', error);\n';
      code += '    throw error;\n';
      code += '  }\n';
    }

    code += '}\n\n';
    code += '// Execute the function\n';
    code += 'updateExcelFile();';

    return {
      code,
      explanation: 'This code updates an existing Excel file with new values, preserving existing formatting and structure.',
      dependencies: ['exceljs'],
      steps: [
        'Import UpdateExcelTemplate',
        'Create updater instance',
        'Load existing Excel file',
        'Update specific cells and ranges',
        'Save updated file'
      ]
    };
  }

  /**
   * Generate code for data transformation
   */
  private static generateTransformCode(
    intent: any,
    isTypeScript: boolean,
    includeComments: boolean,
    includeErrorHandling: boolean
  ): any {
    const imports = isTypeScript 
      ? "import * as ExcelJS from 'exceljs';\nimport { TransformExcelTemplate } from './templates/TransformExcelTemplate';"
      : "const ExcelJS = require('exceljs');\nconst { TransformExcelTemplate } = require('./templates/TransformExcelTemplate');";

    let code = imports + '\n\n';

    if (includeComments) {
      code += '// Generated code for data transformation\n';
    }

    if (includeErrorHandling) {
      code += 'async function transformData() {\n  try {\n';
    } else {
      code += 'async function transformData() {\n';
    }

    code += '    const transformer = new TransformExcelTemplate();\n\n';

    const sourceFile = intent.dataSource || 'source_data.xlsx';
    code += `    await transformer.loadFile('${sourceFile}');\n`;
    code += '    transformer.setSourceWorksheet(0);\n\n';

    if (includeComments) {
      code += '    // Extract source data\n';
    }
    code += '    const sourceData = await transformer.extractSourceData({\n';
    code += '      headers: true,\n';
    code += '      skipEmptyRows: true\n';
    code += '    });\n\n';

    let transformedData = 'sourceData';

    // Apply transformations based on intent
    if (intent.transformations?.some((t: any) => t.type === 'filter')) {
      if (includeComments) {
        code += '    // Filter data\n';
      }
      code += '    const filteredData = transformer.filterData(sourceData, [\n';
      code += '      { field: \'Status\', operator: \'equals\', value: \'Active\' }\n';
      code += '    ]);\n\n';
      transformedData = 'filteredData';
    }

    if (intent.transformations?.some((t: any) => t.type === 'sort')) {
      if (includeComments) {
        code += '    // Sort data\n';
      }
      code += `    const sortedData = transformer.sortData(${transformedData}, [\n`;
      code += '      { field: \'Date\', direction: \'desc\', dataType: \'date\' }\n';
      code += '    ]);\n\n';
      transformedData = 'sortedData';
    }

    if (intent.transformations?.some((t: any) => t.type === 'group')) {
      if (includeComments) {
        code += '    // Group and aggregate data\n';
      }
      code += `    const groupedData = transformer.groupData(${transformedData}, ['Category'], [\n`;
      code += '      { field: \'Sales\', function: \'sum\', outputField: \'Total_Sales\' },\n';
      code += '      { field: \'Sales\', function: \'avg\', outputField: \'Avg_Sales\' }\n';
      code += '    ]);\n\n';
      transformedData = 'groupedData';
    }

    if (includeComments) {
      code += '    // Write transformed data\n';
    }
    code += `    await transformer.writeTransformedData(${transformedData}, {\n`;
    code += '      targetWorksheet: \'Transformed Data\',\n';
    code += '      headers: true,\n';
    code += '      autoFit: true\n';
    code += '    });\n\n';

    const outputFile = intent.targetFile || 'transformed_data.xlsx';
    code += `    await transformer.saveToFile('${outputFile}');\n`;
    code += `    console.log('Data transformation completed: ${outputFile}');\n`;

    if (includeErrorHandling) {
      code += '  } catch (error) {\n';
      code += '    console.error(\'Error transforming data:\', error);\n';
      code += '    throw error;\n';
      code += '  }\n';
    }

    code += '}\n\n';
    code += '// Execute the function\n';
    code += 'transformData();';

    return {
      code,
      explanation: 'This code transforms Excel data with filtering, sorting, and grouping operations, then saves the results to a new file.',
      dependencies: ['exceljs'],
      steps: [
        'Import TransformExcelTemplate',
        'Load source Excel file',
        'Extract source data',
        'Apply transformations (filter, sort, group)',
        'Write transformed data to new worksheet',
        'Save output file'
      ]
    };
  }

  /**
   * Generate code for data analysis
   */
  private static generateAnalysisCode(
    intent: any,
    isTypeScript: boolean,
    includeComments: boolean,
    includeErrorHandling: boolean
  ): any {
    const imports = isTypeScript 
      ? "import * as ExcelJS from 'exceljs';\nimport { AnalysisExcelTemplate } from './templates/AnalysisExcelTemplate';"
      : "const ExcelJS = require('exceljs');\nconst { AnalysisExcelTemplate } = require('./templates/AnalysisExcelTemplate');";

    let code = imports + '\n\n';

    if (includeComments) {
      code += '// Generated code for data analysis\n';
    }

    if (includeErrorHandling) {
      code += 'async function analyzeData() {\n  try {\n';
    } else {
      code += 'async function analyzeData() {\n';
    }

    code += '    const analyzer = new AnalysisExcelTemplate();\n\n';

    const sourceFile = intent.dataSource || 'data.xlsx';
    code += `    await analyzer.loadFile('${sourceFile}');\n`;
    code += '    analyzer.setSourceWorksheet(0);\n\n';

    if (includeComments) {
      code += '    // Generate comprehensive analysis report\n';
    }

    code += '    const analyses = [];\n\n';

    if (intent.analysis?.some((a: any) => a.type === 'descriptive') || intent.analysis.length === 0) {
      code += '    analyses.push({\n';
      code += '      name: \'Descriptive Statistics\',\n';
      code += '      type: \'descriptive\',\n';
      code += '      columnX: \'C\', // Adjust column as needed\n';
      code += '      options: { skipHeader: true }\n';
      code += '    });\n\n';
    }

    if (intent.analysis?.some((a: any) => a.type === 'correlation')) {
      code += '    analyses.push({\n';
      code += '      name: \'Correlation Analysis\',\n';
      code += '      type: \'correlation\',\n';
      code += '      columnX: \'B\', // First variable\n';
      code += '      columnY: \'C\', // Second variable\n';
      code += '      options: { skipHeader: true }\n';
      code += '    });\n\n';
    }

    if (intent.analysis?.some((a: any) => a.type === 'trend')) {
      code += '    analyses.push({\n';
      code += '      name: \'Trend Analysis\',\n';
      code += '      type: \'trend\',\n';
      code += '      columnX: \'C\', // Time series data\n';
      code += '      options: { skipHeader: true, periods: 3 }\n';
      code += '    });\n\n';
    }

    code += '    await analyzer.generateAnalysisReport(analyses);\n\n';

    const outputFile = intent.targetFile || 'analysis_report.xlsx';
    code += `    await analyzer.saveToFile('${outputFile}');\n`;
    code += `    console.log('Data analysis completed: ${outputFile}');\n`;

    if (includeErrorHandling) {
      code += '  } catch (error) {\n';
      code += '    console.error(\'Error analyzing data:\', error);\n';
      code += '    throw error;\n';
      code += '  }\n';
    }

    code += '}\n\n';
    code += '// Execute the function\n';
    code += 'analyzeData();';

    return {
      code,
      explanation: 'This code performs comprehensive data analysis including descriptive statistics, correlation analysis, and trend analysis.',
      dependencies: ['exceljs'],
      steps: [
        'Import AnalysisExcelTemplate',
        'Load source Excel file',
        'Configure analysis types',
        'Generate comprehensive report',
        'Save analysis results'
      ]
    };
  }

  /**
   * Generate code for PDF to Excel conversion
   */
  private static generatePDFToExcelCode(
    intent: any,
    isTypeScript: boolean,
    includeComments: boolean,
    includeErrorHandling: boolean
  ): any {
    const imports = isTypeScript 
      ? "import * as ExcelJS from 'exceljs';\nimport { PDFToExcelTemplate } from './templates/PDFToExcelTemplate';"
      : "const ExcelJS = require('exceljs');\nconst { PDFToExcelTemplate } = require('./templates/PDFToExcelTemplate');";

    let code = imports + '\n\n';

    if (includeComments) {
      code += '// Generated code for PDF to Excel conversion\n';
    }

    if (includeErrorHandling) {
      code += 'async function convertPDFToExcel() {\n  try {\n';
    } else {
      code += 'async function convertPDFToExcel() {\n';
    }

    code += '    const converter = new PDFToExcelTemplate();\n\n';

    if (includeComments) {
      code += '    // Note: PDF extraction should be done with a PDF processing service\n';
      code += '    // This example assumes you have extracted PDF data\n';
    }

    code += '    const extractedPDFData = {\n';
    code += '      text: \'Sample PDF text content...\',\n';
    code += '      tables: [\n';
    code += '        {\n';
    code += '          data: [\n';
    code += '            [\'Product\', \'Q1\', \'Q2\', \'Q3\', \'Q4\'],\n';
    code += '            [\'Laptop\', \'15000\', \'18000\', \'22000\', \'25000\'],\n';
    code += '            [\'Phone\', \'12000\', \'14000\', \'16000\', \'18000\']\n';
    code += '          ],\n';
    code += '          page: 1,\n';
    code += '          confidence: 0.95\n';
    code += '        }\n';
    code += '      ],\n';
    code += '      metadata: {\n';
    code += '        title: \'Sales Report\',\n';
    code += '        pages: 3,\n';
    code += '        creationDate: new Date()\n';
    code += '      }\n';
    code += '    };\n\n';

    if (includeComments) {
      code += '    // Process PDF data and convert to Excel\n';
    }

    code += '    await converter.processPDFData(extractedPDFData, {\n';
    code += '      tableProcessing: {\n';
    code += '        autoDetectHeaders: true,\n';
    code += '        removeEmptyRows: true,\n';
    code += '        cleanWhitespace: true\n';
    code += '      },\n';
    code += '      formatting: {\n';
    code += '        autoFit: true\n';
    code += '      }\n';
    code += '    });\n\n';

    const outputFile = intent.targetFile || 'converted_from_pdf.xlsx';
    code += `    await converter.saveToFile('${outputFile}');\n`;
    code += `    console.log('PDF to Excel conversion completed: ${outputFile}');\n`;

    if (includeErrorHandling) {
      code += '  } catch (error) {\n';
      code += '    console.error(\'Error converting PDF to Excel:\', error);\n';
      code += '    throw error;\n';
      code += '  }\n';
    }

    code += '}\n\n';
    code += '// Execute the function\n';
    code += 'convertPDFToExcel();';

    return {
      code,
      explanation: 'This code converts extracted PDF data (tables, text, metadata) into a structured Excel file with proper formatting.',
      dependencies: ['exceljs'],
      steps: [
        'Import PDFToExcelTemplate',
        'Define extracted PDF data structure',
        'Process PDF data with options',
        'Apply formatting and cleaning',
        'Save converted Excel file'
      ]
    };
  }

  /**
   * Generate generic Excel code
   */
  private static generateGenericCode(
    intent: any,
    isTypeScript: boolean,
    includeComments: boolean,
    includeErrorHandling: boolean
  ): any {
    const imports = isTypeScript 
      ? "import * as ExcelJS from 'exceljs';"
      : "const ExcelJS = require('exceljs');";

    let code = imports + '\n\n';

    if (includeComments) {
      code += '// Generic Excel operation\n';
    }

    if (includeErrorHandling) {
      code += 'async function performExcelOperation() {\n  try {\n';
    } else {
      code += 'async function performExcelOperation() {\n';
    }

    code += '    const workbook = new ExcelJS.Workbook();\n';
    code += '    const worksheet = workbook.addWorksheet(\'Data\');\n\n';

    if (includeComments) {
      code += '    // Add sample data\n';
    }
    code += '    worksheet.addRow([\'Name\', \'Value\', \'Date\']);\n';
    code += '    worksheet.addRow([\'Sample\', 100, new Date()]);\n\n';

    if (includeComments) {
      code += '    // Save workbook\n';
    }
    const outputFile = intent.targetFile || 'output.xlsx';
    code += `    await workbook.xlsx.writeFile('${outputFile}');\n`;
    code += `    console.log('Excel operation completed: ${outputFile}');\n`;

    if (includeErrorHandling) {
      code += '  } catch (error) {\n';
      code += '    console.error(\'Error performing Excel operation:\', error);\n';
      code += '    throw error;\n';
      code += '  }\n';
    }

    code += '}\n\n';
    code += '// Execute the function\n';
    code += 'performExcelOperation();';

    return {
      code,
      explanation: 'This is a basic Excel operation that creates a new workbook with sample data.',
      dependencies: ['exceljs'],
      steps: [
        'Create new workbook',
        'Add worksheet',
        'Add sample data',
        'Save to file'
      ]
    };
  }

  /**
   * Generate helper code snippets
   * @param operation - Specific operation to generate helper for
   * @returns Code snippet with explanation
   */
  static generateHelper(operation: string): {
    code: string;
    explanation: string;
    usage: string;
  } {
    switch (operation) {
      case 'cell-reference':
        return {
          code: `// Convert column letter to number
function columnToNumber(col) {
  let result = 0;
  for (let i = 0; i < col.length; i++) {
    result = result * 26 + (col.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
  }
  return result;
}

// Convert column number to letter
function numberToColumn(num) {
  let result = '';
  while (num > 0) {
    num--;
    result = String.fromCharCode('A'.charCodeAt(0) + (num % 26)) + result;
    num = Math.floor(num / 26);
  }
  return result;
}`,
          explanation: 'Helper functions to convert between Excel column letters and numbers.',
          usage: 'columnToNumber("AB") // returns 28\nnumberToColumn(28) // returns "AB"'
        };

      case 'data-validation':
        return {
          code: `// Validate Excel data
function validateData(data, rules) {
  const errors = [];
  
  data.forEach((row, rowIndex) => {
    Object.entries(rules).forEach(([field, rule]) => {
      const value = row[field];
      
      if (rule.required && (value === null || value === undefined || value === '')) {
        errors.push({ row: rowIndex, field, error: 'Required field is empty' });
      }
      
      if (rule.type && typeof value !== rule.type) {
        errors.push({ row: rowIndex, field, error: \`Expected \${rule.type}, got \${typeof value}\` });
      }
      
      if (rule.min && value < rule.min) {
        errors.push({ row: rowIndex, field, error: \`Value \${value} is below minimum \${rule.min}\` });
      }
      
      if (rule.max && value > rule.max) {
        errors.push({ row: rowIndex, field, error: \`Value \${value} is above maximum \${rule.max}\` });
      }
    });
  });
  
  return errors;
}`,
          explanation: 'Validates Excel data against defined rules.',
          usage: `const rules = {
  age: { required: true, type: 'number', min: 0, max: 120 },
  name: { required: true, type: 'string' }
};
const errors = validateData(data, rules);`
        };

      case 'format-currency':
        return {
          code: `// Format cells as currency
function formatCurrency(worksheet, range, symbol = '$') {
  const cells = worksheet.getCell(range);
  
  if (cells.eachCell) {
    cells.eachCell(cell => {
      cell.numFmt = \`\${symbol}#,##0.00\`;
    });
  } else {
    cells.numFmt = \`\${symbol}#,##0.00\`;
  }
}`,
          explanation: 'Formats a range of cells as currency values.',
          usage: 'formatCurrency(worksheet, "B2:B10", "$");'
        };

      default:
        return {
          code: '// No helper available for this operation',
          explanation: 'No specific helper code available.',
          usage: 'N/A'
        };
    }
  }

  /**
   * Example usage of the code generator
   */
  static exampleUsage(): void {
    console.log('ExcelJS Code Generator Examples:');
    
    const examples = [
      'Read data from sales.xlsx file',
      'Create a new Excel file with customer data',
      'Update existing inventory.xlsx with new quantities',
      'Transform sales data by grouping by region and calculating totals',
      'Analyze financial data and generate statistics report',
      'Convert PDF tables to Excel format'
    ];

    examples.forEach((example, index) => {
      console.log(`${index + 1}. "${example}"`);
      const result = ExcelCodeGenerator.generateCode(example);
      console.log(`   -> Uses ${result.template} template`);
      console.log(`   -> ${result.explanation}`);
      console.log('');
    });
  }
}

export default ExcelCodeGenerator;
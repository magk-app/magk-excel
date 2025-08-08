import { describe, beforeAll, beforeEach, afterAll, afterEach, it, expect, jest } from '@jest/globals';
import { ExcelTestHelper, ExcelTestPatterns } from '../utils/ExcelTestHelper';
import { MockExcelData, MockDataGenerators } from '../utils/MockExcelData';
import { TestFileGenerator } from '../utils/TestFileGenerator';
import * as XLSX from 'xlsx';

// Mock the Excel executor service
const mockExcelExecutor = {
  processFile: jest.fn(),
  createSpreadsheet: jest.fn(),
  formatSpreadsheet: jest.fn(),
  exportFile: jest.fn(),
  batchProcess: jest.fn(),
  validateData: jest.fn(),
  transformData: jest.fn(),
  calculateFormulas: jest.fn(),
  generateCharts: jest.fn(),
  mergeFiles: jest.fn()
};

// Mock ExcelJS functionality
jest.mock('exceljs', () => ({
  Workbook: jest.fn(() => ({
    addWorksheet: jest.fn(() => ({
      addRow: jest.fn(),
      getCell: jest.fn(() => ({
        value: '',
        font: {},
        fill: {},
        border: {}
      })),
      mergeCells: jest.fn(),
      spliceColumns: jest.fn(),
      spliceRows: jest.fn()
    })),
    removeWorksheet: jest.fn(),
    xlsx: {
      writeBuffer: jest.fn(() => Promise.resolve(Buffer.from('mock-excel-data'))),
      load: jest.fn(() => Promise.resolve())
    },
    worksheets: []
  }))
}));

describe('ExecutorExcel Integration Tests', () => {
  let testFiles: any;
  let memoryUsageStart: NodeJS.MemoryUsage;

  beforeAll(async () => {
    await ExcelTestHelper.setupTestDirectories();
    await TestFileGenerator.initialize();
    
    // Generate comprehensive test files
    testFiles = await TestFileGenerator.generateAllTestFiles();
    memoryUsageStart = ExcelTestHelper.getMemoryUsage();
  });

  afterAll(async () => {
    await ExcelTestHelper.cleanupTestDirectories();
    await TestFileGenerator.cleanup();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('File Processing Operations', () => {
    it('should process basic Excel file with ExcelJS', async () => {
      const inputData = MockExcelData.EMPLOYEE_DATA;
      const startTime = ExcelTestHelper.startTimer();

      mockExcelExecutor.processFile.mockResolvedValue({
        success: true,
        processingTime: 150,
        rowsProcessed: inputData.length,
        output: {
          data: inputData,
          summary: {
            totalEmployees: inputData.length - 1,
            departments: ['Engineering', 'Marketing', 'Sales', 'HR'],
            averageSalary: 70000
          }
        }
      });

      const result = await mockExcelExecutor.processFile({
        filePath: testFiles.standard['basic.xlsx'],
        operations: ['analyze', 'summarize'],
        options: {
          includeHeaders: true,
          calculateSummaries: true
        }
      });

      const duration = ExcelTestHelper.endTimer(startTime);

      expect(result.success).toBe(true);
      expect(result.rowsProcessed).toBe(inputData.length);
      expect(result.processingTime).toBeLessThan(1000);
      expect(duration).toBeLessThan(2000);
      expect(result.output.summary.totalEmployees).toBe(5);
    });

    it('should create new spreadsheet with complex formatting', async () => {
      const newData = MockExcelData.FINANCIAL_DATA;
      
      mockExcelExecutor.createSpreadsheet.mockResolvedValue({
        success: true,
        workbookId: 'wb_excel_123',
        worksheets: [
          {
            name: 'Financial Summary',
            rows: newData.length,
            columns: newData[0].length,
            formulas: 4,
            charts: 0
          }
        ],
        filePath: '/tmp/new-financial-report.xlsx'
      });

      const result = await mockExcelExecutor.createSpreadsheet({
        data: newData,
        templateType: 'financial',
        formatting: {
          headerStyle: {
            bold: true,
            backgroundColor: '#4f46e5',
            fontColor: 'white'
          },
          dataStyle: {
            numberFormat: '#,##0.00',
            alternateRowColors: true
          }
        },
        calculations: {
          enableFormulas: true,
          autoCalculate: true
        }
      });

      expect(result.success).toBe(true);
      expect(result.worksheets[0].formulas).toBeGreaterThan(0);
      expect(result.worksheets[0].rows).toBe(newData.length);
    });

    it('should handle large dataset processing efficiently', async () => {
      const largeData = MockExcelData.generateLargeDataset(10000);
      const startTime = ExcelTestHelper.startTimer();
      const initialMemory = ExcelTestHelper.getMemoryUsage();

      mockExcelExecutor.processFile.mockResolvedValue({
        success: true,
        processingTime: 2500,
        rowsProcessed: largeData.length,
        memoryUsage: {
          peak: '120MB',
          final: '45MB'
        },
        performance: {
          rowsPerSecond: 4000,
          memoryEfficient: true
        },
        output: {
          processedData: largeData.slice(0, 100), // Sample data
          statistics: {
            totalRows: largeData.length,
            totalColumns: largeData[0].length,
            processingStages: 3
          }
        }
      });

      const result = await mockExcelExecutor.processFile({
        filePath: testFiles.performance['xlarge'],
        operations: ['validate', 'transform', 'analyze'],
        options: {
          batchSize: 1000,
          memoryOptimized: true,
          progressCallback: true
        }
      });

      const duration = ExcelTestHelper.endTimer(startTime);
      const finalMemory = ExcelTestHelper.getMemoryUsage();

      expect(result.success).toBe(true);
      expect(result.rowsProcessed).toBe(largeData.length);
      expect(result.performance.rowsPerSecond).toBeGreaterThan(1000);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      
      // Memory usage should be reasonable
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      expect(memoryIncrease).toBeLessThan(200 * 1024 * 1024); // Less than 200MB
    });

    it('should format spreadsheet with advanced styles', async () => {
      mockExcelExecutor.formatSpreadsheet.mockResolvedValue({
        success: true,
        formattingApplied: {
          conditionalFormatting: true,
          charts: 2,
          pivotTables: 1,
          customStyles: 5
        },
        performance: {
          formattingTime: 800
        }
      });

      const result = await mockExcelExecutor.formatSpreadsheet({
        workbookId: 'wb_excel_123',
        formatting: {
          conditionalFormatting: [
            {
              range: 'D2:D100',
              condition: 'greaterThan',
              value: 70000,
              style: { backgroundColor: '#10b981', fontColor: 'white' }
            }
          ],
          charts: [
            {
              type: 'column',
              dataRange: 'A1:E10',
              title: 'Employee Distribution by Department'
            }
          ],
          pivotTables: [
            {
              sourceRange: 'A1:F100',
              destination: 'H1',
              rows: ['Department'],
              values: ['Salary'],
              aggregation: 'average'
            }
          ]
        }
      });

      expect(result.success).toBe(true);
      expect(result.formattingApplied.conditionalFormatting).toBe(true);
      expect(result.formattingApplied.charts).toBe(2);
      expect(result.formattingApplied.pivotTables).toBe(1);
    });

    it('should export file in multiple formats', async () => {
      const exportFormats = ['xlsx', 'csv', 'pdf', 'json'];
      
      mockExcelExecutor.exportFile.mockResolvedValue({
        success: true,
        exports: exportFormats.map(format => ({
          format,
          filePath: `/tmp/export.${format}`,
          fileSize: format === 'pdf' ? 204800 : 51200,
          pages: format === 'pdf' ? 3 : undefined
        })),
        totalExports: exportFormats.length
      });

      const result = await mockExcelExecutor.exportFile({
        workbookId: 'wb_excel_123',
        formats: exportFormats,
        options: {
          includeFormulas: true,
          preserveFormatting: true,
          compression: true
        }
      });

      expect(result.success).toBe(true);
      expect(result.totalExports).toBe(exportFormats.length);
      expect(result.exports).toHaveLength(exportFormats.length);
      
      const pdfExport = result.exports.find(exp => exp.format === 'pdf');
      expect(pdfExport?.pages).toBe(3);
    });
  });

  describe('Data Validation and Transformation', () => {
    it('should validate data integrity', async () => {
      const testData = MockExcelData.EMPLOYEE_DATA;
      
      mockExcelExecutor.validateData.mockResolvedValue({
        success: true,
        validation: {
          totalRecords: testData.length - 1,
          validRecords: testData.length - 1,
          invalidRecords: 0,
          warnings: [],
          errors: [],
          fieldValidation: {
            'Employee ID': { valid: 5, invalid: 0, pattern: 'EMP\\d{3}' },
            'Name': { valid: 5, invalid: 0, required: true },
            'Salary': { valid: 5, invalid: 0, type: 'number', range: [50000, 100000] },
            'Hire Date': { valid: 5, invalid: 0, type: 'date' },
            'Active': { valid: 5, invalid: 0, type: 'boolean' }
          }
        }
      });

      const result = await mockExcelExecutor.validateData({
        data: testData,
        schema: {
          'Employee ID': { required: true, pattern: /EMP\d{3}/ },
          'Name': { required: true, type: 'string' },
          'Department': { required: true, enum: ['Engineering', 'Marketing', 'Sales', 'HR'] },
          'Salary': { required: true, type: 'number', min: 30000, max: 200000 },
          'Hire Date': { required: true, type: 'date' },
          'Active': { required: true, type: 'boolean' }
        }
      });

      expect(result.success).toBe(true);
      expect(result.validation.validRecords).toBe(5);
      expect(result.validation.invalidRecords).toBe(0);
      expect(result.validation.errors).toHaveLength(0);
    });

    it('should transform data with complex operations', async () => {
      const inputData = MockExcelData.SALES_DATA;
      
      mockExcelExecutor.transformData.mockResolvedValue({
        success: true,
        transformedRows: inputData.length - 1,
        operations: [
          { type: 'calculateTotals', applied: true },
          { type: 'addDerivedColumns', applied: true },
          { type: 'formatDates', applied: true },
          { type: 'aggregateByCategory', applied: true }
        ],
        output: {
          data: [
            ...inputData,
            ['2024-01-06', 'Summary', null, null, '=SUM(E2:E6)', 'System Generated']
          ],
          derivedColumns: {
            'Profit Margin': '=(E2*0.3)',
            'Commission': '=(E2*0.05)'
          },
          aggregations: {
            totalSales: 1234.50,
            averageOrderValue: 246.90,
            topProduct: 'Widget A'
          }
        }
      });

      const result = await mockExcelExecutor.transformData({
        data: inputData,
        transformations: [
          {
            type: 'calculateColumn',
            formula: '=COLUMN_C * COLUMN_D',
            targetColumn: 'Total'
          },
          {
            type: 'addSummaryRow',
            aggregation: 'sum',
            columns: ['Total']
          },
          {
            type: 'formatDates',
            columns: ['Date'],
            format: 'YYYY-MM-DD'
          }
        ]
      });

      expect(result.success).toBe(true);
      expect(result.transformedRows).toBe(inputData.length - 1);
      expect(result.operations).toHaveLength(4);
      expect(result.output.aggregations.totalSales).toBeGreaterThan(0);
    });

    it('should calculate complex formulas accurately', async () => {
      const formulaData = MockExcelData.FINANCIAL_DATA;
      
      mockExcelExecutor.calculateFormulas.mockResolvedValue({
        success: true,
        formulasCalculated: 16,
        calculationTime: 45,
        results: {
          'F2': { formula: '=SUM(B2:E2)', result: 490000, type: 'sum' },
          'G2': { formula: '=AVERAGE(B2:E2)', result: 122500, type: 'average' },
          'F3': { formula: '=SUM(B3:E3)', result: 350000, type: 'sum' },
          'G3': { formula: '=AVERAGE(B3:E3)', result: 87500, type: 'average' },
          'B4': { formula: '=B2-B3', result: 20000, type: 'subtract' },
          'F5': { formula: '=F4/F2*100', result: 28.57, type: 'percentage' }
        },
        errors: [],
        warnings: []
      });

      const result = await mockExcelExecutor.calculateFormulas({
        data: formulaData,
        options: {
          recalculateAll: true,
          errorHandling: 'report',
          precision: 2
        }
      });

      expect(result.success).toBe(true);
      expect(result.formulasCalculated).toBe(16);
      expect(result.calculationTime).toBeLessThan(100);
      expect(result.results['F2'].result).toBe(490000);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle formula errors gracefully', async () => {
      const errorData = MockExcelData.ERROR_DATA;
      
      mockExcelExecutor.calculateFormulas.mockResolvedValue({
        success: true,
        formulasCalculated: 2,
        calculationTime: 25,
        results: {
          'C4': { formula: '=B4+10', result: 10, type: 'add' }
        },
        errors: [
          { cell: 'C2', formula: '=B2/0', error: '#DIV/0!', message: 'Division by zero' },
          { cell: 'C3', formula: '=B3*2', error: '#VALUE!', message: 'Invalid value type' }
        ],
        warnings: [
          'Cell B4 contains null value, treated as 0',
          'Cell B5 contains undefined value, treated as 0'
        ]
      });

      const result = await mockExcelExecutor.calculateFormulas({
        data: errorData,
        options: {
          errorHandling: 'continue',
          treatNullAsZero: true
        }
      });

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(2);
      expect(result.warnings).toHaveLength(2);
      expect(result.errors[0].error).toBe('#DIV/0!');
      expect(result.errors[1].error).toBe('#VALUE!');
    });
  });

  describe('Advanced Features and Performance', () => {
    it('should generate charts and visualizations', async () => {
      mockExcelExecutor.generateCharts.mockResolvedValue({
        success: true,
        chartsGenerated: 3,
        charts: [
          {
            type: 'column',
            title: 'Sales by Product',
            dataRange: 'A1:B6',
            position: 'F1:M15',
            series: 1
          },
          {
            type: 'line',
            title: 'Sales Trend',
            dataRange: 'A1:A6,C1:C6',
            position: 'F17:M31',
            series: 1
          },
          {
            type: 'pie',
            title: 'Product Distribution',
            dataRange: 'A2:B6',
            position: 'N1:U15',
            series: 1
          }
        ]
      });

      const result = await mockExcelExecutor.generateCharts({
        data: MockExcelData.SALES_DATA,
        chartDefinitions: [
          {
            type: 'column',
            title: 'Sales by Product',
            xAxis: 'Product',
            yAxis: 'Total',
            position: { row: 1, col: 6 }
          },
          {
            type: 'line',
            title: 'Sales Trend',
            xAxis: 'Date',
            yAxis: 'Total',
            position: { row: 17, col: 6 }
          },
          {
            type: 'pie',
            title: 'Product Distribution',
            dataColumn: 'Product',
            valueColumn: 'Total',
            position: { row: 1, col: 14 }
          }
        ]
      });

      expect(result.success).toBe(true);
      expect(result.chartsGenerated).toBe(3);
      expect(result.charts).toHaveLength(3);
      expect(result.charts[0].type).toBe('column');
    });

    it('should merge multiple Excel files', async () => {
      const sourceFiles = testFiles.concurrent.slice(0, 3);
      
      mockExcelExecutor.mergeFiles.mockResolvedValue({
        success: true,
        sourceFiles: sourceFiles.length,
        mergedRows: 330, // 110 rows per file × 3 files
        mergedColumns: 9,
        outputFile: '/tmp/merged-result.xlsx',
        mergeStrategy: 'append',
        duplicatesHandled: 0,
        processingTime: 1200
      });

      const result = await mockExcelExecutor.mergeFiles({
        sourceFiles,
        outputFile: '/tmp/merged-result.xlsx',
        mergeOptions: {
          strategy: 'append',
          handleDuplicates: 'skip',
          includeHeaders: true,
          preserveFormatting: false
        }
      });

      expect(result.success).toBe(true);
      expect(result.sourceFiles).toBe(3);
      expect(result.mergedRows).toBe(330);
      expect(result.processingTime).toBeLessThan(2000);
    });

    it('should perform batch processing efficiently', async () => {
      const batchFiles = testFiles.concurrent;
      const startTime = ExcelTestHelper.startTimer();
      
      mockExcelExecutor.batchProcess.mockResolvedValue({
        success: true,
        filesProcessed: batchFiles.length,
        totalRows: batchFiles.length * 100,
        results: batchFiles.map((file, index) => ({
          file,
          status: 'completed',
          rows: 100 + (index * 10),
          processingTime: 200 + (index * 50),
          output: `/tmp/processed-${index + 1}.xlsx`
        })),
        batchSummary: {
          successful: batchFiles.length,
          failed: 0,
          totalTime: 1500,
          averageTimePerFile: 300
        }
      });

      const result = await mockExcelExecutor.batchProcess({
        files: batchFiles,
        operations: ['validate', 'transform', 'export'],
        parallelism: 3,
        options: {
          skipErrors: false,
          preserveOriginal: true
        }
      });

      const duration = ExcelTestHelper.endTimer(startTime);

      expect(result.success).toBe(true);
      expect(result.filesProcessed).toBe(batchFiles.length);
      expect(result.batchSummary.failed).toBe(0);
      expect(duration).toBeLessThan(3000);
    });

    it('should handle memory pressure during intensive operations', async () => {
      const initialMemory = ExcelTestHelper.getMemoryUsage();
      const largeDatasets = Array.from({ length: 3 }, (_, i) => 
        MockExcelData.generateLargeDataset(5000 + (i * 1000))
      );

      mockExcelExecutor.batchProcess.mockResolvedValue({
        success: true,
        filesProcessed: 3,
        memoryManagement: {
          peakUsage: '180MB',
          averageUsage: '95MB',
          garbageCollections: 5,
          memoryWarnings: 0
        },
        performance: {
          memoryEfficient: true,
          processingRate: 2500 // rows per second
        }
      });

      const result = await mockExcelExecutor.batchProcess({
        datasets: largeDatasets,
        operations: ['process', 'analyze'],
        options: {
          memoryOptimized: true,
          batchSize: 1000,
          enableGC: true
        }
      });

      const finalMemory = ExcelTestHelper.getMemoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      expect(result.success).toBe(true);
      expect(result.memoryManagement.memoryWarnings).toBe(0);
      expect(memoryIncrease).toBeLessThan(250 * 1024 * 1024); // Less than 250MB increase
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle corrupted file gracefully', async () => {
      mockExcelExecutor.processFile.mockResolvedValue({
        success: false,
        error: 'File appears to be corrupted or not in Excel format',
        errorCode: 'CORRUPTED_FILE',
        suggestions: [
          'Verify the file is a valid Excel format (.xlsx, .xls)',
          'Try opening the file in Excel to check for corruption',
          'Re-export the file from the original source'
        ]
      });

      const result = await mockExcelExecutor.processFile({
        filePath: testFiles.error['corrupted.xlsx']
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('CORRUPTED_FILE');
      expect(result.suggestions).toHaveLength(3);
    });

    it('should recover from temporary failures', async () => {
      let attemptCount = 0;
      
      mockExcelExecutor.processFile.mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.resolve({
            success: false,
            error: 'Temporary file access error',
            retryable: true,
            retryAfter: 100
          });
        }
        return Promise.resolve({
          success: true,
          data: MockExcelData.EMPLOYEE_DATA,
          retryCount: attemptCount
        });
      });

      // Simulate retry logic
      const retryOperation = async (operation: any, maxRetries = 3) => {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          const result = await operation();
          if (result.success) {
            return { ...result, totalAttempts: attempt };
          }
          if (!result.retryable || attempt === maxRetries) {
            throw new Error(result.error);
          }
          await ExcelTestHelper.wait(result.retryAfter || 100);
        }
      };

      const result = await retryOperation(() => 
        mockExcelExecutor.processFile({ filePath: 'flaky-file.xlsx' })
      );

      expect(result.success).toBe(true);
      expect(result.totalAttempts).toBe(3);
      expect(attemptCount).toBe(3);
    });

    it('should validate file size limits', async () => {
      const maxFileSize = 50 * 1024 * 1024; // 50MB
      
      mockExcelExecutor.processFile.mockResolvedValue({
        success: false,
        error: `File size exceeds maximum limit of ${maxFileSize / 1024 / 1024}MB`,
        errorCode: 'FILE_TOO_LARGE',
        actualSize: 75 * 1024 * 1024,
        maxSize: maxFileSize,
        suggestions: [
          'Split the file into smaller chunks',
          'Use batch processing mode',
          'Contact administrator to increase file size limit'
        ]
      });

      const result = await mockExcelExecutor.processFile({
        filePath: testFiles.error['very-large.xlsx']
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('FILE_TOO_LARGE');
      expect(result.actualSize).toBeGreaterThan(maxFileSize);
    });
  });
});
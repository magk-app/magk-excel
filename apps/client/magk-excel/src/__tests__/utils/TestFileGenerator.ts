import * as XLSX from 'xlsx';
import * as fs from 'fs/promises';
import * as path from 'path';
import { MockExcelData, MockDataGenerators } from './MockExcelData';

/**
 * Test file generator for comprehensive Excel testing scenarios
 */
export class TestFileGenerator {
  private static readonly OUTPUT_DIR = path.join(__dirname, '../../test-files');
  
  /**
   * Initialize test file directory
   */
  static async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.OUTPUT_DIR, { recursive: true });
    } catch (error) {
      console.warn('Failed to create test files directory:', error);
    }
  }

  /**
   * Clean up generated test files
   */
  static async cleanup(): Promise<void> {
    try {
      const files = await fs.readdir(this.OUTPUT_DIR);
      for (const file of files) {
        await fs.unlink(path.join(this.OUTPUT_DIR, file));
      }
    } catch (error) {
      console.warn('Failed to cleanup test files:', error);
    }
  }

  /**
   * Generate standard test Excel files
   */
  static async generateStandardTestFiles(): Promise<{ [fileName: string]: string }> {
    const files: { [fileName: string]: string } = {};

    // Basic Excel file
    files['basic.xlsx'] = await this.createExcelFile(
      'basic.xlsx',
      'Basic Data',
      MockExcelData.EMPLOYEE_DATA
    );

    // Multi-sheet Excel file
    files['multi-sheet.xlsx'] = await this.createMultiSheetExcelFile(
      'multi-sheet.xlsx',
      MockExcelData.MULTI_SHEET_DATA
    );

    // Large Excel file for performance testing
    files['large.xlsx'] = await this.createExcelFile(
      'large.xlsx',
      'Large Dataset',
      MockExcelData.generateLargeDataset(5000)
    );

    // Excel file with formulas
    files['formulas.xlsx'] = await this.createExcelFile(
      'formulas.xlsx',
      'Financial Data',
      MockExcelData.FINANCIAL_DATA
    );

    // Excel file with formatting
    files['formatted.xlsx'] = await this.createFormattedExcelFile(
      'formatted.xlsx',
      MockExcelData.FORMATTED_DATA
    );

    // Empty Excel file
    files['empty.xlsx'] = await this.createExcelFile(
      'empty.xlsx',
      'Empty Sheet',
      [[]]
    );

    // Single cell Excel file
    files['single-cell.xlsx'] = await this.createExcelFile(
      'single-cell.xlsx',
      'Single Cell',
      [['Single Value']]
    );

    // Unicode content Excel file
    files['unicode.xlsx'] = await this.createExcelFile(
      'unicode.xlsx',
      'Unicode Data',
      MockExcelData.UNICODE_DATA
    );

    // Time series data
    files['time-series.xlsx'] = await this.createExcelFile(
      'time-series.xlsx',
      'Time Series',
      MockDataGenerators.generateTimeSeriesData(90)
    );

    return files;
  }

  /**
   * Generate specific test files for error scenarios
   */
  static async generateErrorTestFiles(): Promise<{ [fileName: string]: string }> {
    const files: { [fileName: string]: string } = {};

    // Corrupted file (not actually Excel format)
    files['corrupted.xlsx'] = path.join(this.OUTPUT_DIR, 'corrupted.xlsx');
    await fs.writeFile(files['corrupted.xlsx'], 'This is not an Excel file content');

    // Excel file with error formulas
    files['with-errors.xlsx'] = await this.createExcelFile(
      'with-errors.xlsx',
      'Error Data',
      MockExcelData.ERROR_DATA
    );

    // Very large file (>10MB)
    files['very-large.xlsx'] = await this.createExcelFile(
      'very-large.xlsx',
      'Very Large Dataset',
      MockExcelData.generateLargeDataset(50000)
    );

    return files;
  }

  /**
   * Create a basic Excel file
   */
  private static async createExcelFile(
    fileName: string,
    sheetName: string,
    data: any[][]
  ): Promise<string> {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const filePath = path.join(this.OUTPUT_DIR, fileName);
    XLSX.writeFile(wb, filePath);
    
    return filePath;
  }

  /**
   * Create a multi-sheet Excel file
   */
  private static async createMultiSheetExcelFile(
    fileName: string,
    sheetsData: { [sheetName: string]: any[][] }
  ): Promise<string> {
    const wb = XLSX.utils.book_new();
    
    Object.entries(sheetsData).forEach(([sheetName, data]) => {
      const ws = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });

    const filePath = path.join(this.OUTPUT_DIR, fileName);
    XLSX.writeFile(wb, filePath);
    
    return filePath;
  }

  /**
   * Create a formatted Excel file with styling
   */
  private static async createFormattedExcelFile(
    fileName: string,
    data: any[][]
  ): Promise<string> {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Add some basic formatting
    if (!ws['!cols']) ws['!cols'] = [];
    ws['!cols'][0] = { wch: 15 }; // Column width
    ws['!cols'][1] = { wch: 10 };
    ws['!cols'][2] = { wch: 12 };
    ws['!cols'][3] = { wch: 15 };

    // Add some cell formatting
    const headerRange = 'A1:E1';
    if (!ws['!merges']) ws['!merges'] = [];
    
    XLSX.utils.book_append_sheet(wb, ws, 'Formatted Data');

    const filePath = path.join(this.OUTPUT_DIR, fileName);
    XLSX.writeFile(wb, filePath);
    
    return filePath;
  }

  /**
   * Generate performance test files with different sizes
   */
  static async generatePerformanceTestFiles(): Promise<{ [size: string]: string }> {
    const files: { [size: string]: string } = {};

    const sizes = [
      { name: 'small', rows: 100 },
      { name: 'medium', rows: 1000 },
      { name: 'large', rows: 10000 },
      { name: 'xlarge', rows: 50000 }
    ];

    for (const size of sizes) {
      const fileName = `performance-${size.name}.xlsx`;
      files[size.name] = await this.createExcelFile(
        fileName,
        'Performance Test',
        MockDataGenerators.generateSurveyData(size.rows)
      );
    }

    return files;
  }

  /**
   * Generate template test files
   */
  static async generateTemplateTestFiles(): Promise<{ [template: string]: string }> {
    const files: { [template: string]: string } = {};

    // Invoice template
    const invoiceData = [
      ['Invoice #', 'Date', 'Customer', 'Amount'],
      ['INV-001', '2024-01-01', 'Customer A', 1500.00],
      ['INV-002', '2024-01-02', 'Customer B', 2300.50],
      ['', '', 'Total:', '=SUM(D2:D3)']
    ];
    files['invoice-template.xlsx'] = await this.createExcelFile(
      'invoice-template.xlsx',
      'Invoice',
      invoiceData
    );

    // Report template
    const reportData = [
      ['Report: Monthly Sales Analysis'],
      ['Generated:', new Date().toISOString().split('T')[0]],
      [''],
      ['Product', 'Units Sold', 'Revenue', 'Profit Margin'],
      ['Product A', 150, 15000, '25%'],
      ['Product B', 200, 20000, '30%'],
      ['Product C', 100, 12000, '20%'],
      ['', 'Total:', '=SUM(C5:C7)', '=AVERAGE(D5:D7)']
    ];
    files['report-template.xlsx'] = await this.createExcelFile(
      'report-template.xlsx',
      'Monthly Report',
      reportData
    );

    // Budget template
    const budgetData = [
      ['Category', 'Budgeted', 'Actual', 'Variance', 'Variance %'],
      ['Salary', 50000, 48000, '=C2-B2', '=D2/B2*100'],
      ['Benefits', 15000, 16000, '=C3-B3', '=D3/B3*100'],
      ['Office', 10000, 9500, '=C4-B4', '=D4/B4*100'],
      ['Marketing', 20000, 22000, '=C5-B5', '=D5/B5*100'],
      ['Total', '=SUM(B2:B5)', '=SUM(C2:C5)', '=SUM(D2:D5)', '=D6/B6*100']
    ];
    files['budget-template.xlsx'] = await this.createExcelFile(
      'budget-template.xlsx',
      'Budget',
      budgetData
    );

    return files;
  }

  /**
   * Generate CSV files for import testing
   */
  static async generateCSVTestFiles(): Promise<{ [fileName: string]: string }> {
    const files: { [fileName: string]: string } = {};

    // Basic CSV
    const basicCsvContent = MockExcelData.EMPLOYEE_DATA
      .map(row => row.join(','))
      .join('\n');
    files['basic.csv'] = path.join(this.OUTPUT_DIR, 'basic.csv');
    await fs.writeFile(files['basic.csv'], basicCsvContent);

    // CSV with special characters
    const specialCsvContent = [
      'Name,Description,Price',
      '"Product, with comma","Description with ""quotes""",29.99',
      'Product with\nnewline,Simple description,19.99',
      'Product with;semicolon,Another description,39.99'
    ].join('\n');
    files['special-chars.csv'] = path.join(this.OUTPUT_DIR, 'special-chars.csv');
    await fs.writeFile(files['special-chars.csv'], specialCsvContent);

    return files;
  }

  /**
   * Get file information
   */
  static async getFileInfo(filePath: string): Promise<{
    exists: boolean;
    size: number;
    created: Date;
    extension: string;
  }> {
    try {
      const stats = await fs.stat(filePath);
      return {
        exists: true,
        size: stats.size,
        created: stats.birthtime,
        extension: path.extname(filePath)
      };
    } catch (error) {
      return {
        exists: false,
        size: 0,
        created: new Date(0),
        extension: ''
      };
    }
  }

  /**
   * Generate test files for specific Excel features
   */
  static async generateFeatureTestFiles(): Promise<{ [feature: string]: string }> {
    const files: { [feature: string]: string } = {};

    // Charts and graphs (data only - visual charts require Excel)
    const chartData = [
      ['Month', 'Sales', 'Profit'],
      ['Jan', 10000, 2000],
      ['Feb', 12000, 2400],
      ['Mar', 15000, 3000],
      ['Apr', 11000, 2200],
      ['May', 16000, 3200]
    ];
    files['chart-data.xlsx'] = await this.createExcelFile(
      'chart-data.xlsx',
      'Chart Data',
      chartData
    );

    // Pivot table source data
    const pivotSourceData = [];
    pivotSourceData.push(['Date', 'Region', 'Product', 'Sales', 'Quantity']);
    
    const regions = ['North', 'South', 'East', 'West'];
    const products = ['Widget A', 'Widget B', 'Widget C'];
    
    for (let i = 0; i < 100; i++) {
      const date = new Date(2024, Math.floor(i / 30), (i % 30) + 1);
      pivotSourceData.push([
        date.toISOString().split('T')[0],
        regions[Math.floor(Math.random() * regions.length)],
        products[Math.floor(Math.random() * products.length)],
        Math.round(Math.random() * 10000),
        Math.round(Math.random() * 100) + 1
      ]);
    }
    
    files['pivot-source.xlsx'] = await this.createExcelFile(
      'pivot-source.xlsx',
      'Sales Data',
      pivotSourceData
    );

    // Conditional formatting data
    const conditionalData = [
      ['Score', 'Grade', 'Status'],
      [95, 'A', 'Excellent'],
      [87, 'B', 'Good'],
      [76, 'C', 'Average'],
      [65, 'D', 'Below Average'],
      [45, 'F', 'Fail'],
      [98, 'A', 'Excellent'],
      [82, 'B', 'Good']
    ];
    files['conditional-format.xlsx'] = await this.createExcelFile(
      'conditional-format.xlsx',
      'Grades',
      conditionalData
    );

    return files;
  }

  /**
   * Generate files for concurrent testing
   */
  static async generateConcurrentTestFiles(count: number = 10): Promise<string[]> {
    const files: string[] = [];
    
    for (let i = 1; i <= count; i++) {
      const fileName = `concurrent-test-${i}.xlsx`;
      const data = MockDataGenerators.generateSurveyData(100 + (i * 10));
      const filePath = await this.createExcelFile(fileName, `Dataset ${i}`, data);
      files.push(filePath);
    }
    
    return files;
  }

  /**
   * Generate all test files at once
   */
  static async generateAllTestFiles(): Promise<{
    standard: { [fileName: string]: string };
    error: { [fileName: string]: string };
    performance: { [size: string]: string };
    templates: { [template: string]: string };
    csv: { [fileName: string]: string };
    features: { [feature: string]: string };
    concurrent: string[];
  }> {
    await this.initialize();
    
    return {
      standard: await this.generateStandardTestFiles(),
      error: await this.generateErrorTestFiles(),
      performance: await this.generatePerformanceTestFiles(),
      templates: await this.generateTemplateTestFiles(),
      csv: await this.generateCSVTestFiles(),
      features: await this.generateFeatureTestFiles(),
      concurrent: await this.generateConcurrentTestFiles(5)
    };
  }
}
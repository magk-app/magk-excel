import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Excel Test Helper - Utilities for testing Excel operations
 */
export class ExcelTestHelper {
  private static tempDir = '/tmp/test-excel';
  
  /**
   * Initialize test environment
   */
  static async initialize(): Promise<void> {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }
  
  /**
   * Clean up test files
   */
  static async cleanup(): Promise<void> {
    if (fs.existsSync(this.tempDir)) {
      fs.rmSync(this.tempDir, { recursive: true, force: true });
    }
  }
  
  /**
   * Create a test Excel file with sample data
   */
  static async createTestExcel(
    fileName: string,
    data: any[][] = [
      ['Name', 'Age', 'City'],
      ['John Doe', 30, 'New York'],
      ['Jane Smith', 25, 'Los Angeles'],
      ['Bob Johnson', 35, 'Chicago']
    ]
  ): Promise<string> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');
    
    // Add data
    data.forEach(row => worksheet.addRow(row));
    
    // Apply basic formatting
    worksheet.getRow(1).font = { bold: true };
    worksheet.columns.forEach(column => {
      column.width = 15;
    });
    
    // Save file
    const filePath = path.join(this.tempDir, fileName);
    await workbook.xlsx.writeFile(filePath);
    
    return filePath;
  }
  
  /**
   * Create a complex Excel file with multiple sheets and formatting
   */
  static async createComplexExcel(fileName: string): Promise<string> {
    const workbook = new ExcelJS.Workbook();
    
    // Sheet 1: Sales Data
    const salesSheet = workbook.addWorksheet('Sales', {
      properties: { tabColor: { argb: 'FF00FF00' } }
    });
    
    salesSheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Product', key: 'product', width: 20 },
      { header: 'Quantity', key: 'quantity', width: 10 },
      { header: 'Price', key: 'price', width: 10 },
      { header: 'Total', key: 'total', width: 15 }
    ];
    
    const salesData = [
      { date: new Date(2024, 0, 1), product: 'Widget A', quantity: 10, price: 25.00, total: 250.00 },
      { date: new Date(2024, 0, 2), product: 'Widget B', quantity: 5, price: 50.00, total: 250.00 },
      { date: new Date(2024, 0, 3), product: 'Widget C', quantity: 15, price: 15.00, total: 225.00 }
    ];
    
    salesData.forEach(row => salesSheet.addRow(row));
    
    // Add formulas
    salesSheet.getCell('E5').value = { formula: 'SUM(E2:E4)' };
    
    // Sheet 2: Inventory
    const inventorySheet = workbook.addWorksheet('Inventory', {
      properties: { tabColor: { argb: 'FFFF0000' } }
    });
    
    inventorySheet.columns = [
      { header: 'SKU', key: 'sku', width: 15 },
      { header: 'Product', key: 'product', width: 20 },
      { header: 'Stock', key: 'stock', width: 10 },
      { header: 'Reorder Level', key: 'reorder', width: 15 }
    ];
    
    const inventoryData = [
      { sku: 'WA-001', product: 'Widget A', stock: 100, reorder: 20 },
      { sku: 'WB-002', product: 'Widget B', stock: 15, reorder: 10 },
      { sku: 'WC-003', product: 'Widget C', stock: 5, reorder: 15 }
    ];
    
    inventoryData.forEach(row => inventorySheet.addRow(row));
    
    // Apply conditional formatting
    inventorySheet.getColumn('stock').eachCell((cell, rowNumber) => {
      if (rowNumber > 1) {
        const stock = cell.value as number;
        const reorder = inventorySheet.getCell(rowNumber, 4).value as number;
        if (stock < reorder) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFF0000' }
          };
        }
      }
    });
    
    // Sheet 3: Charts Data
    const chartSheet = workbook.addWorksheet('Charts');
    chartSheet.addRow(['Month', 'Revenue', 'Expenses', 'Profit']);
    chartSheet.addRow(['Jan', 10000, 7000, 3000]);
    chartSheet.addRow(['Feb', 12000, 8000, 4000]);
    chartSheet.addRow(['Mar', 15000, 9000, 6000]);
    
    // Save file
    const filePath = path.join(this.tempDir, fileName);
    await workbook.xlsx.writeFile(filePath);
    
    return filePath;
  }
  
  /**
   * Create a large Excel file for performance testing
   */
  static async createLargeExcel(fileName: string, rows: number = 10000): Promise<string> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('LargeData');
    
    // Add headers
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Address', 'City', 'State', 'Zip', 'Country', 'Date'];
    worksheet.addRow(headers);
    
    // Add data rows
    for (let i = 1; i <= rows; i++) {
      worksheet.addRow([
        i,
        `User ${i}`,
        `user${i}@example.com`,
        `555-${String(i).padStart(4, '0')}`,
        `${i} Main Street`,
        'City ' + (i % 100),
        'State ' + (i % 50),
        String(10000 + i),
        'USA',
        new Date()
      ]);
    }
    
    // Save file
    const filePath = path.join(this.tempDir, fileName);
    await workbook.xlsx.writeFile(filePath);
    
    return filePath;
  }
  
  /**
   * Read Excel file and return data
   */
  static async readExcel(filePath: string): Promise<any[][]> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    const worksheet = workbook.getWorksheet(1);
    const data: any[][] = [];
    
    worksheet?.eachRow((row, rowNumber) => {
      data.push(row.values as any[]);
    });
    
    return data;
  }
  
  /**
   * Compare two Excel files
   */
  static async compareExcelFiles(file1: string, file2: string): Promise<boolean> {
    const data1 = await this.readExcel(file1);
    const data2 = await this.readExcel(file2);
    
    if (data1.length !== data2.length) return false;
    
    for (let i = 0; i < data1.length; i++) {
      if (JSON.stringify(data1[i]) !== JSON.stringify(data2[i])) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Generate test file path
   */
  static getTestFilePath(fileName: string): string {
    return path.join(this.tempDir, fileName);
  }
  
  /**
   * Create a CSV file for testing
   */
  static async createTestCSV(fileName: string, data: any[][] = null): Promise<string> {
    const csvData = data || [
      ['Name', 'Age', 'City'],
      ['John Doe', '30', 'New York'],
      ['Jane Smith', '25', 'Los Angeles']
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const filePath = path.join(this.tempDir, fileName);
    
    fs.writeFileSync(filePath, csvContent);
    return filePath;
  }
  
  /**
   * Create an invalid Excel file for error testing
   */
  static async createInvalidExcel(fileName: string): Promise<string> {
    const filePath = path.join(this.tempDir, fileName);
    fs.writeFileSync(filePath, 'This is not a valid Excel file');
    return filePath;
  }
  
  /**
   * Create test directory structure
   */
  static async createTestDirectory(): Promise<string> {
    const testDir = path.join(this.tempDir, uuidv4());
    fs.mkdirSync(testDir, { recursive: true });
    return testDir;
  }
  
  /**
   * Measure execution time
   */
  static async measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; time: number }> {
    const start = Date.now();
    const result = await fn();
    const time = Date.now() - start;
    return { result, time };
  }
  
  /**
   * Get file size in bytes
   */
  static getFileSize(filePath: string): number {
    const stats = fs.statSync(filePath);
    return stats.size;
  }
  
  /**
   * Create multiple test files
   */
  static async createMultipleTestFiles(count: number): Promise<string[]> {
    const files: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const fileName = `test-file-${i}.xlsx`;
      const filePath = await this.createTestExcel(fileName);
      files.push(filePath);
    }
    
    return files;
  }

  /**
   * Setup test directories
   */
  static async setupTestDirectories(): Promise<void> {
    await this.initialize();
  }

  /**
   * Cleanup test directories
   */
  static async cleanupTestDirectories(): Promise<void> {
    await this.cleanup();
  }
}
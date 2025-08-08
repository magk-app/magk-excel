import { ExcelMCPTool } from '../../services/excel/ExcelMCPTool';
import { ExcelTestHelper } from '../utils/ExcelTestHelper';
import { MockExcelData } from '../utils/MockExcelData';
import * as fs from 'fs';
import * as path from 'path';

describe('ExcelMCPTool Integration Tests', () => {
  let excelTool: ExcelMCPTool;
  let testFiles: string[] = [];

  beforeAll(async () => {
    await ExcelTestHelper.initialize();
    excelTool = new ExcelMCPTool();
  });

  afterEach(async () => {
    // Clean up test files
    for (const file of testFiles) {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    }
    testFiles = [];
  });

  afterAll(async () => {
    await ExcelTestHelper.cleanup();
  });

  describe('File Path Resolution', () => {
    it('should resolve absolute file paths', async () => {
      const filePath = await ExcelTestHelper.createTestExcel('absolute-test.xlsx');
      testFiles.push(filePath);

      const result = await excelTool.handleToolCall({
        name: 'excel_describe_sheets',
        arguments: { name: filePath }
      });

      expect(result.content[0].text).toContain('Sheet1');
    });

    it('should resolve relative file paths', async () => {
      const fileName = 'relative-test.xlsx';
      const filePath = await ExcelTestHelper.createTestExcel(fileName);
      testFiles.push(filePath);

      // Set file path mapping
      excelTool.setFilePathMapping({ [fileName]: filePath });

      const result = await excelTool.handleToolCall({
        name: 'excel_describe_sheets',
        arguments: { name: fileName }
      });

      expect(result.content[0].text).toContain('Sheet1');
    });

    it('should handle missing files gracefully', async () => {
      const result = await excelTool.handleToolCall({
        name: 'excel_describe_sheets',
        arguments: { name: 'non-existent-file.xlsx' }
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('not found');
    });

    it('should resolve files with fuzzy matching', async () => {
      const fileName = 'fuzzy_match_test.xlsx';
      const filePath = await ExcelTestHelper.createTestExcel(`file_${fileName}`);
      testFiles.push(filePath);

      // Set partial mapping
      excelTool.setFilePathMapping({ 'fuzzy_match': filePath });

      const result = await excelTool.handleToolCall({
        name: 'excel_describe_sheets',
        arguments: { name: 'fuzzy_match_test' }
      });

      expect(result.content[0].text).toContain('Sheet1');
    });
  });

  describe('Excel Read Operations', () => {
    it('should read Excel file with all sheets', async () => {
      const filePath = await ExcelTestHelper.createComplexExcel('read-test.xlsx');
      testFiles.push(filePath);

      const result = await excelTool.handleToolCall({
        name: 'excel_read',
        arguments: { file: filePath }
      });

      expect(result.content[0].text).toContain('Sales');
      expect(result.content[0].text).toContain('Inventory');
      expect(result.content[0].text).toContain('Charts');
    });

    it('should read specific sheet', async () => {
      const filePath = await ExcelTestHelper.createComplexExcel('sheet-test.xlsx');
      testFiles.push(filePath);

      const result = await excelTool.handleToolCall({
        name: 'excel_read_sheet',
        arguments: { 
          file: filePath,
          sheet: 'Inventory'
        }
      });

      expect(result.content[0].text).toContain('SKU');
      expect(result.content[0].text).toContain('Stock');
      expect(result.content[0].text).not.toContain('Sales');
    });

    it('should read with range specification', async () => {
      const filePath = await ExcelTestHelper.createTestExcel('range-test.xlsx');
      testFiles.push(filePath);

      const result = await excelTool.handleToolCall({
        name: 'excel_read_sheet',
        arguments: { 
          file: filePath,
          sheet: 'Sheet1',
          range: 'A1:B2'
        }
      });

      const data = JSON.parse(result.content[0].text);
      expect(data).toHaveLength(2);
      expect(data[0]).toHaveLength(2);
    });

    it('should handle large files efficiently', async () => {
      const filePath = await ExcelTestHelper.createLargeExcel('large-test.xlsx', 1000);
      testFiles.push(filePath);

      const { result, time } = await ExcelTestHelper.measureTime(async () => {
        return await excelTool.handleToolCall({
          name: 'excel_describe_sheets',
          arguments: { name: filePath }
        });
      });

      expect(result.content[0].text).toContain('LargeData');
      expect(result.content[0].text).toContain('1001 rows'); // 1000 data + 1 header
      expect(time).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Excel Write Operations', () => {
    it('should create new Excel file', async () => {
      const fileName = 'create-test.xlsx';
      const filePath = ExcelTestHelper.getTestFilePath(fileName);
      testFiles.push(filePath);

      const data = MockExcelData.getSalesData();
      
      const result = await excelTool.handleToolCall({
        name: 'excel_create',
        arguments: { 
          filename: fileName,
          data: {
            'Sales': data
          }
        }
      });

      expect(result.content[0].text).toContain('created successfully');
      expect(fs.existsSync(filePath)).toBe(true);
      
      const readData = await ExcelTestHelper.readExcel(filePath);
      expect(readData.length).toBe(data.length);
    });

    it('should write to existing Excel file', async () => {
      const filePath = await ExcelTestHelper.createTestExcel('write-test.xlsx');
      testFiles.push(filePath);

      const newData = MockExcelData.getEmployeeData();

      const result = await excelTool.handleToolCall({
        name: 'excel_write_to_sheet',
        arguments: { 
          file: filePath,
          sheet: 'Employees',
          data: newData,
          startCell: 'A1'
        }
      });

      expect(result.content[0].text).toContain('written successfully');
      
      // Verify the data was written
      const readResult = await excelTool.handleToolCall({
        name: 'excel_read_sheet',
        arguments: { 
          file: filePath,
          sheet: 'Employees'
        }
      });
      
      expect(readResult.content[0].text).toContain('Employee ID');
    });

    it('should append data to existing sheet', async () => {
      const filePath = await ExcelTestHelper.createTestExcel('append-test.xlsx');
      testFiles.push(filePath);

      const additionalData = [
        ['New Person', 40, 'Boston']
      ];

      const result = await excelTool.handleToolCall({
        name: 'excel_append',
        arguments: { 
          file: filePath,
          sheet: 'Sheet1',
          data: additionalData
        }
      });

      expect(result.content[0].text).toContain('appended successfully');
      
      const readData = await ExcelTestHelper.readExcel(filePath);
      expect(readData.length).toBe(5); // Original 4 + 1 new
      expect(readData[4][1]).toBe('New Person');
    });
  });

  describe('Excel Format Operations', () => {
    it('should format cells with styles', async () => {
      const filePath = await ExcelTestHelper.createTestExcel('format-test.xlsx');
      testFiles.push(filePath);

      const result = await excelTool.handleToolCall({
        name: 'excel_format',
        arguments: { 
          file: filePath,
          sheet: 'Sheet1',
          range: 'A1:C1',
          format: {
            font: { bold: true, size: 14, color: 'FF0000' },
            fill: { type: 'pattern', pattern: 'solid', bgColor: 'FFFF00' },
            alignment: { horizontal: 'center' }
          }
        }
      });

      expect(result.content[0].text).toContain('formatted successfully');
    });

    it('should apply conditional formatting', async () => {
      const filePath = await ExcelTestHelper.createComplexExcel('conditional-test.xlsx');
      testFiles.push(filePath);

      const result = await excelTool.handleToolCall({
        name: 'excel_format',
        arguments: { 
          file: filePath,
          sheet: 'Inventory',
          range: 'D2:D10',
          conditionalFormat: {
            type: 'cellIs',
            operator: 'lessThan',
            value: 50,
            format: {
              fill: { type: 'pattern', pattern: 'solid', bgColor: 'FF0000' }
            }
          }
        }
      });

      expect(result.content[0].text).toContain('formatted successfully');
    });

    it('should add formulas', async () => {
      const filePath = await ExcelTestHelper.createTestExcel('formula-test.xlsx');
      testFiles.push(filePath);

      const result = await excelTool.handleToolCall({
        name: 'excel_write_to_sheet',
        arguments: { 
          file: filePath,
          sheet: 'Sheet1',
          data: [['=SUM(B2:B4)']],
          startCell: 'B5'
        }
      });

      expect(result.content[0].text).toContain('written successfully');
    });
  });

  describe('Excel Analysis Operations', () => {
    it('should describe sheet structure', async () => {
      const filePath = await ExcelTestHelper.createComplexExcel('describe-test.xlsx');
      testFiles.push(filePath);

      const result = await excelTool.handleToolCall({
        name: 'excel_describe_sheets',
        arguments: { name: filePath }
      });

      const description = result.content[0].text;
      expect(description).toContain('3 sheets');
      expect(description).toContain('Sales');
      expect(description).toContain('Inventory');
      expect(description).toContain('Charts');
      expect(description).toContain('rows');
      expect(description).toContain('columns');
    });

    it('should search for values in Excel', async () => {
      const filePath = await ExcelTestHelper.createComplexExcel('search-test.xlsx');
      testFiles.push(filePath);

      const result = await excelTool.handleToolCall({
        name: 'excel_search',
        arguments: { 
          file: filePath,
          searchValue: 'Widget B'
        }
      });

      expect(result.content[0].text).toContain('found');
      expect(result.content[0].text).toContain('Sales');
    });

    it('should filter data', async () => {
      const filePath = await ExcelTestHelper.createTestExcel('filter-test.xlsx', 
        MockExcelData.getInventoryData()
      );
      testFiles.push(filePath);

      const result = await excelTool.handleToolCall({
        name: 'excel_filter',
        arguments: { 
          file: filePath,
          sheet: 'Sheet1',
          column: 'Status',
          value: 'Critical'
        }
      });

      const filteredData = JSON.parse(result.content[0].text);
      expect(filteredData.length).toBe(2); // Two items with 'Critical' status
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid Excel files', async () => {
      const filePath = await ExcelTestHelper.createInvalidExcel('invalid.xlsx');
      testFiles.push(filePath);

      const result = await excelTool.handleToolCall({
        name: 'excel_read',
        arguments: { file: filePath }
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error');
    });

    it('should handle missing sheets', async () => {
      const filePath = await ExcelTestHelper.createTestExcel('missing-sheet.xlsx');
      testFiles.push(filePath);

      const result = await excelTool.handleToolCall({
        name: 'excel_read_sheet',
        arguments: { 
          file: filePath,
          sheet: 'NonExistentSheet'
        }
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Sheet not found');
    });

    it('should handle invalid ranges', async () => {
      const filePath = await ExcelTestHelper.createTestExcel('invalid-range.xlsx');
      testFiles.push(filePath);

      const result = await excelTool.handleToolCall({
        name: 'excel_read_sheet',
        arguments: { 
          file: filePath,
          sheet: 'Sheet1',
          range: 'INVALID'
        }
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Invalid range');
    });
  });

  describe('Performance Tests', () => {
    it('should handle concurrent operations', async () => {
      const fileCount = 5;
      const files = await ExcelTestHelper.createMultipleTestFiles(fileCount);
      testFiles.push(...files);

      const operations = files.map(file => 
        excelTool.handleToolCall({
          name: 'excel_describe_sheets',
          arguments: { name: file }
        })
      );

      const results = await Promise.all(operations);
      
      expect(results).toHaveLength(fileCount);
      results.forEach(result => {
        expect(result.content[0].text).toContain('Sheet1');
      });
    });

    it('should handle memory efficiently with large files', async () => {
      const filePath = await ExcelTestHelper.createLargeExcel('memory-test.xlsx', 5000);
      testFiles.push(filePath);

      const initialMemory = process.memoryUsage().heapUsed;

      await excelTool.handleToolCall({
        name: 'excel_read',
        arguments: { file: filePath }
      });

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB

      expect(memoryIncrease).toBeLessThan(100); // Should use less than 100MB
    });

    it('should complete batch operations within time limit', async () => {
      const filePath = await ExcelTestHelper.createTestExcel('batch-test.xlsx');
      testFiles.push(filePath);

      const operations = [
        { name: 'excel_read', arguments: { file: filePath } },
        { name: 'excel_describe_sheets', arguments: { name: filePath } },
        { name: 'excel_write_to_sheet', arguments: { 
          file: filePath, 
          sheet: 'NewSheet', 
          data: [['Test']] 
        }},
        { name: 'excel_format', arguments: { 
          file: filePath, 
          sheet: 'Sheet1', 
          range: 'A1', 
          format: { font: { bold: true } } 
        }}
      ];

      const { result, time } = await ExcelTestHelper.measureTime(async () => {
        const results = [];
        for (const op of operations) {
          results.push(await excelTool.handleToolCall(op));
        }
        return results;
      });

      expect(result).toHaveLength(operations.length);
      expect(time).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });
});
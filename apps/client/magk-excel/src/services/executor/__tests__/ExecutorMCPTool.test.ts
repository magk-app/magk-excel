/**
 * Tests for ExecutorMCPTool with Excel processing capabilities
 */

import { ExecutorMCPTool } from '../ExecutorMCPTool';
import { exampleExcelCode, simpleReadExample, createSpreadsheetExample } from '../ExcelExecutorExample';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('ExecutorMCPTool Excel Processing', () => {
  let tool: ExecutorMCPTool;

  beforeEach(() => {
    tool = new ExecutorMCPTool();
  });

  describe('Tool Definition', () => {
    it('should provide correct tool definitions', () => {
      const definitions = ExecutorMCPTool.getToolDefinitions();
      expect(definitions).toHaveLength(1);
      expect(definitions[0].name).toBe('run_ts');
      expect(definitions[0].description).toContain('ExcelJS');
      expect(definitions[0].inputSchema.required).toContain('code');
    });

    it('should include filePathMap in schema', () => {
      const definitions = ExecutorMCPTool.getToolDefinitions();
      const schema = definitions[0].inputSchema;
      expect(schema.properties).toHaveProperty('filePathMap');
    });
  });

  describe('Basic Code Execution', () => {
    it('should handle unknown tool names', async () => {
      const result = await tool.handleToolCall({
        name: 'unknown_tool',
        arguments: {}
      });
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Unknown executor operation');
    });

    it('should require code parameter', async () => {
      const result = await tool.handleToolCall({
        name: 'run_ts',
        arguments: {}
      });
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Missing \"code\" string');
    });

    it('should validate main function export', async () => {
      const result = await tool.handleToolCall({
        name: 'run_ts',
        arguments: {
          code: 'console.log(\"hello\");' // Missing main export
        }
      });
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('export an async function named \"main\"');
    });
  });

  describe('Simple Excel Operations', () => {
    it('should create a basic spreadsheet', async () => {
      const code = `
        import ExcelJS from 'npm:exceljs@4.4.0';
        
        export async function main(ctx) {
          const workbook = new ExcelJS.Workbook();
          const worksheet = workbook.addWorksheet('Test Sheet');
          
          worksheet.addRow(['Header 1', 'Header 2']);
          worksheet.addRow(['Value 1', 'Value 2']);
          
          const filename = 'test_output.xlsx';
          const buffer = await workbook.xlsx.writeBuffer();
          const savedPath = await ctx.files.write(filename, new Uint8Array(buffer));
          
          return { success: true, filename, path: savedPath };
        }
      `;

      const result = await tool.handleToolCall({
        name: 'run_ts',
        arguments: {
          code,
          libraries: ['exceljs'],
          allowNet: true,
          timeoutMs: 10000
        }
      });

      // Parse the JSON response
      const response = JSON.parse(result.content[0].text);
      expect(response.ok).toBe(true);
      expect(response.result.success).toBe(true);
      expect(response.result.filename).toBe('test_output.xlsx');
      
      // Verify file was created
      const outputPath = response.result.path;
      expect(fs.existsSync(outputPath)).toBe(true);
      
      // Cleanup
      fs.unlinkSync(outputPath);
    }, 15000);

    it('should use context utilities correctly', async () => {
      const code = `
        export async function main(ctx) {
          // Test context utilities
          const outputPath = ctx.files.createOutputPath('context_test.txt');
          await ctx.files.write('context_test.txt', 'Hello from context!');
          
          return {
            success: true,
            platform: ctx.env.platform,
            outputDir: ctx.paths.output,
            tempDir: ctx.paths.temp,
            excelMimeType: ctx.excel.MIME_TYPES.XLSX,
            generatedName: ctx.excel.generateOutputName('test')
          };
        }
      `;

      const result = await tool.handleToolCall({
        name: 'run_ts',
        arguments: {
          code,
          timeoutMs: 5000
        }
      });

      const response = JSON.parse(result.content[0].text);
      expect(response.ok).toBe(true);
      expect(response.result.success).toBe(true);
      expect(response.result.platform).toBeDefined();
      expect(response.result.outputDir).toContain('MAGK-Excel');
      expect(response.result.excelMimeType).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(response.result.generatedName).toMatch(/^test_.*\.xlsx$/);
    }, 10000);
  });

  describe('File Path Mapping', () => {
    it('should handle file path mappings correctly', async () => {
      // Create a temporary test file
      const tempDir = os.tmpdir();
      const testFilePath = path.join(tempDir, 'test_input.txt');
      fs.writeFileSync(testFilePath, 'Test file content');

      const code = `
        export async function main(ctx) {
          const mappedFiles = ctx.files.listMapped();
          const fileContent = await ctx.files.read('input.txt');
          const textContent = new TextDecoder().decode(fileContent);
          
          return {
            success: true,
            mappedFiles,
            fileContent: textContent,
            fileExists: ctx.files.exists('input.txt'),
            filePath: ctx.files.getPath('input.txt')
          };
        }
      `;

      const result = await tool.handleToolCall({
        name: 'run_ts',
        arguments: {
          code,
          filePathMap: {
            'input.txt': testFilePath
          },
          timeoutMs: 5000
        }
      });

      const response = JSON.parse(result.content[0].text);
      expect(response.ok).toBe(true);
      expect(response.result.success).toBe(true);
      expect(response.result.mappedFiles).toContain('input.txt');
      expect(response.result.fileContent).toBe('Test file content');
      expect(response.result.fileExists).toBe(true);
      expect(response.result.filePath).toBe(testFilePath);

      // Cleanup
      fs.unlinkSync(testFilePath);
    }, 10000);
  });

  describe('Error Handling', () => {
    it('should handle import errors gracefully', async () => {
      const code = `
        import NonExistentModule from 'npm:this-does-not-exist@1.0.0';
        
        export async function main(ctx) {
          return { success: true };
        }
      `;

      const result = await tool.handleToolCall({
        name: 'run_ts',
        arguments: {
          code,
          allowNet: true,
          timeoutMs: 5000
        }
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Module import failed');
    }, 10000);

    it('should handle runtime errors with stack trace', async () => {
      const code = `
        export async function main(ctx) {
          throw new Error('Intentional test error');
        }
      `;

      const result = await tool.handleToolCall({
        name: 'run_ts',
        arguments: {
          code,
          timeoutMs: 5000
        }
      });

      const response = JSON.parse(result.content[0].text);
      expect(response.ok).toBe(false);
      expect(response.error).toContain('Intentional test error');
    }, 10000);
  });

  describe('Examples Integration', () => {
    it('should run the simple read example without files', async () => {
      const result = await tool.handleToolCall({
        name: 'run_ts',
        arguments: {
          code: simpleReadExample,
          libraries: ['exceljs'],
          allowNet: true,
          timeoutMs: 10000
        }
      });

      const response = JSON.parse(result.content[0].text);
      expect(response.ok).toBe(true);
      expect(response.result.error).toContain('No files provided');
    }, 15000);

    it('should run the create spreadsheet example', async () => {
      const result = await tool.handleToolCall({
        name: 'run_ts',
        arguments: {
          code: createSpreadsheetExample,
          inputs: {
            title: 'Test Report',
            data: [
              ['Item', 'Count'],
              ['A', 1],
              ['B', 2]
            ]
          },
          libraries: ['exceljs'],
          allowNet: true,
          timeoutMs: 10000
        }
      });

      const response = JSON.parse(result.content[0].text);
      expect(response.ok).toBe(true);
      expect(response.result.success).toBe(true);
      expect(response.result.rowCount).toBe(3);
      expect(response.result.filename).toContain('Test_Report');

      // Cleanup
      if (response.result.path && fs.existsSync(response.result.path)) {
        fs.unlinkSync(response.result.path);
      }
    }, 15000);
  });
});
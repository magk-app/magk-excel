# Excel Executor MCP Tool

The Excel Executor provides a secure sandboxed environment for running TypeScript code with ExcelJS support. This tool enables powerful Excel processing operations while maintaining security through Deno's sandbox capabilities.

## Features

- **Secure Execution**: Code runs in Deno sandbox with controlled permissions
- **ExcelJS Integration**: Full support for Excel file reading, writing, and manipulation  
- **File Path Mapping**: Intelligent handling of uploaded files with path resolution
- **Rich Context API**: Comprehensive utilities for Excel operations
- **Error Handling**: Detailed error reporting with stack traces
- **Memory Management**: Configurable memory limits and execution timeouts

## Quick Start

### Basic Usage

```typescript
import { executorMCPTool } from '../services';

const result = await executorMCPTool.handleToolCall({
  name: 'run_ts',
  arguments: {
    code: `
      import ExcelJS from 'npm:exceljs@4.4.0';
      
      export async function main(ctx) {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('My Sheet');
        
        worksheet.addRow(['Name', 'Score']);
        worksheet.addRow(['Alice', 95]);
        worksheet.addRow(['Bob', 87]);
        
        const buffer = await workbook.xlsx.writeBuffer();
        const path = await ctx.files.write('results.xlsx', new Uint8Array(buffer));
        
        return { success: true, path };
      }
    `,
    libraries: ['exceljs'],
    allowNet: true
  }
});
```

### With File Upload

```typescript
const result = await executorMCPTool.handleToolCall({
  name: 'run_ts',
  arguments: {
    code: `
      import ExcelJS from 'npm:exceljs@4.4.0';
      
      export async function main(ctx) {
        // Read uploaded file
        const fileData = await ctx.files.read('data.xlsx');
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(fileData.buffer);
        
        // Process data
        const worksheet = workbook.getWorksheet(1);
        let total = 0;
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber > 1) { // Skip header
            total += row.getCell(2).value || 0;
          }
        });
        
        // Create summary
        worksheet.addRow(['Total:', total]);
        
        const buffer = await workbook.xlsx.writeBuffer();
        const path = await ctx.files.write('processed.xlsx', new Uint8Array(buffer));
        
        return { success: true, total, path };
      }
    `,
    filePathMap: {
      'data.xlsx': '/path/to/uploaded/file.xlsx'
    },
    libraries: ['exceljs'],
    allowNet: true
  }
});
```

## Context API

The executor provides a rich context object (`ctx`) with the following utilities:

### File Operations

```typescript
// Get mapped file path
const filePath = ctx.files.getPath('filename.xlsx');

// Check if file exists
const exists = ctx.files.exists('filename.xlsx');

// Read file
const data = await ctx.files.read('filename.xlsx');

// Write file
const path = await ctx.files.write('output.xlsx', buffer);

// Create output path
const outputPath = ctx.files.createOutputPath('report.xlsx');

// List mapped files
const files = ctx.files.listMapped();

// Get file mappings
const mappings = ctx.files.getMapping();
```

### Excel Utilities

```typescript
// MIME types
ctx.excel.MIME_TYPES.XLSX; // 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
ctx.excel.MIME_TYPES.XLS;  // 'application/vnd.ms-excel'
ctx.excel.MIME_TYPES.CSV;  // 'text/csv'

// Detect file type
const type = ctx.excel.getFileType('data.xlsx'); // 'xlsx'

// Generate unique filename
const filename = ctx.excel.generateOutputName('report', 'xlsx'); // 'report_2024-01-01T10-30-00.xlsx'
```

### Path Information

```typescript
ctx.paths.output;    // Output directory (Downloads/MAGK-Excel)
ctx.paths.temp;      // Temporary directory
ctx.paths.downloads; // Downloads directory
ctx.paths.current;   // Current working directory
```

### Logging

```typescript
ctx.log.info('Processing started');
ctx.log.warn('Warning message');
ctx.log.error('Error occurred');
ctx.log.debug('Debug info'); // Only shown if DEBUG=true
```

### Environment

```typescript
ctx.env.get('VAR_NAME', 'default');  // Get environment variable
ctx.env.isDebug();                   // Check if debug mode
ctx.env.platform;                    // OS platform
```

## Examples

### Create Spreadsheet from Data

```typescript
export async function main(ctx) {
  const { data } = ctx.inputs;
  
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Data');
  
  // Add headers
  const headers = Object.keys(data[0] || {});
  worksheet.addRow(headers);
  
  // Add data rows
  data.forEach(row => {
    worksheet.addRow(headers.map(h => row[h]));
  });
  
  // Style headers
  worksheet.getRow(1).font = { bold: true };
  
  const buffer = await workbook.xlsx.writeBuffer();
  const path = await ctx.files.write('data_export.xlsx', new Uint8Array(buffer));
  
  return { success: true, path, rowCount: data.length + 1 };
}
```

### Process Multiple Files

```typescript
export async function main(ctx) {
  const results = [];
  const mappedFiles = ctx.files.listMapped();
  
  for (const filename of mappedFiles) {
    if (ctx.excel.getFileType(filename) === 'xlsx') {
      const fileData = await ctx.files.read(filename);
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(fileData.buffer);
      
      let rowCount = 0;
      workbook.eachSheet(sheet => {
        rowCount += sheet.rowCount;
      });
      
      results.push({ filename, rowCount });
    }
  }
  
  return { success: true, processed: results };
}
```

### Advanced Formatting

```typescript
export async function main(ctx) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Formatted Report');
  
  // Add data
  worksheet.addRow(['Product', 'Q1', 'Q2', 'Q3', 'Q4', 'Total']);
  worksheet.addRow(['Widget A', 100, 120, 130, 140, '=B2+C2+D2+E2']);
  worksheet.addRow(['Widget B', 200, 180, 220, 210, '=B3+C3+D3+E3']);
  
  // Format headers
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };
  
  // Auto-fit columns
  worksheet.columns.forEach(column => {
    column.width = Math.max(10, column.header?.length || 0);
  });
  
  // Add borders
  worksheet.eachRow(row => {
    row.eachCell(cell => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });
  
  const buffer = await workbook.xlsx.writeBuffer();
  const path = await ctx.files.write('formatted_report.xlsx', new Uint8Array(buffer));
  
  return { success: true, path };
}
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `code` | string | Required | TypeScript code with `export async function main(ctx)` |
| `inputs` | object | `{}` | JSON inputs accessible as `ctx.inputs` |
| `filePathMap` | object | `{}` | Map filenames to actual paths |
| `readPaths` | array | `[]` | Additional read-only paths |
| `writePaths` | array | `[]` | Additional writable paths |
| `timeoutMs` | number | `3000` | Execution timeout (max 10000) |
| `memoryMb` | number | `256` | Memory limit (max 1024) |
| `libraries` | array | `[]` | npm libraries to enable |
| `allowNet` | boolean | `auto` | Enable network access |

## Security

- Code runs in Deno sandbox with restricted permissions
- Only approved npm packages can be imported
- Network access limited to npm registries
- File system access limited to specified paths
- Memory and CPU limits enforced
- No access to system APIs or processes

## Error Handling

The tool provides detailed error messages for common issues:

- **Module import failed**: Check npm package name and version
- **File access denied**: Verify file paths and permissions  
- **Missing main function**: Code must export `async function main(ctx)`
- **Syntax errors**: TypeScript compilation errors with line numbers
- **Runtime errors**: Stack traces with context

## Testing

Run the test suite:

```bash
npm test -- src/services/executor/__tests__/ExecutorMCPTool.test.ts
```

## Best Practices

1. **Always export main function**: `export async function main(ctx) { ... }`
2. **Use ExcelJS npm import**: `import ExcelJS from 'npm:exceljs@4.4.0'`
3. **Handle file mappings**: Use `ctx.files.getPath()` for uploaded files
4. **Use context utilities**: Leverage `ctx.files`, `ctx.excel`, `ctx.log`
5. **Error handling**: Wrap operations in try-catch blocks
6. **Clean output**: Return structured results for better integration
7. **Memory awareness**: Be mindful of large files and memory limits

## Troubleshooting

**Import errors**: Ensure proper npm: syntax and package exists
**File not found**: Check file path mappings and uploaded files
**Permission denied**: Verify paths are included in readPaths/writePaths
**Timeout**: Increase timeoutMs for complex operations
**Memory limit**: Increase memoryMb for large files
/**
 * Excel Executor Usage Example
 * 
 * This example demonstrates how to use the enhanced ExecutorMCPTool
 * for Excel processing with ExcelJS in a sandboxed environment.
 */

export const exampleExcelCode = `
import ExcelJS from 'npm:exceljs@4.4.0';

export async function main(ctx: any) {
  ctx.log.info('Starting Excel processing example');
  
  // Example 1: Create a new workbook from scratch
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sample Data');
  
  // Add headers
  worksheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: 'Name', key: 'name', width: 30 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Score', key: 'score', width: 15 }
  ];
  
  // Add sample data
  const sampleData = [
    { id: 1, name: 'John Doe', email: 'john@example.com', score: 95 },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', score: 87 },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', score: 92 }
  ];
  
  worksheet.addRows(sampleData);
  
  // Apply formatting
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE6E6FA' }
  };
  
  // Save the new workbook
  const outputFileName = ctx.excel.generateOutputName('sample_data', 'xlsx');
  const buffer = await workbook.xlsx.writeBuffer();
  const savedPath = await ctx.files.write(outputFileName, new Uint8Array(buffer));
  
  ctx.log.info(\`Created new workbook: \${savedPath}\`);
  
  // Example 2: Process uploaded Excel file (if available)
  let processedFiles = [];
  const mappedFiles = ctx.files.listMapped();
  
  for (const filename of mappedFiles) {
    if (ctx.excel.getFileType(filename) === 'xlsx' || ctx.excel.getFileType(filename) === 'xls') {
      try {
        ctx.log.info(\`Processing uploaded file: \${filename}\`);
        
        const filePath = ctx.files.getPath(filename);
        const fileData = await ctx.files.read(filename);
        
        const uploadedWorkbook = new ExcelJS.Workbook();
        await uploadedWorkbook.xlsx.load(fileData.buffer);
        
        // Process each worksheet
        let totalRows = 0;
        uploadedWorkbook.eachSheet((worksheet, sheetId) => {
          const rowCount = worksheet.rowCount;
          totalRows += rowCount;
          ctx.log.info(\`Sheet "\${worksheet.name}" has \${rowCount} rows\`);
          
          // Example: Add a summary row
          worksheet.addRow(['TOTAL ROWS:', totalRows]);
        });
        
        // Save processed file
        const processedFileName = ctx.excel.generateOutputName(\`processed_\${filename.split('.')[0]}\`, 'xlsx');
        const processedBuffer = await uploadedWorkbook.xlsx.writeBuffer();
        const processedPath = await ctx.files.write(processedFileName, new Uint8Array(processedBuffer));
        
        processedFiles.push({
          original: filename,
          processed: processedFileName,
          path: processedPath,
          totalRows
        });
        
      } catch (error) {
        ctx.log.error(\`Failed to process file \${filename}:\`, error);
      }
    }
  }
  
  // Return comprehensive results
  return {
    success: true,
    summary: {
      newFileCreated: savedPath,
      processedFiles: processedFiles,
      totalFilesProcessed: processedFiles.length
    },
    outputs: {
      newWorkbook: outputFileName,
      processedFiles: processedFiles.map(f => f.processed)
    },
    metadata: {
      timestamp: new Date().toISOString(),
      platform: ctx.env.platform,
      outputDirectory: ctx.paths.output
    }
  };
}
`;

export const simpleReadExample = `
import ExcelJS from 'npm:exceljs@4.4.0';

export async function main(ctx: any) {
  const mappedFiles = ctx.files.listMapped();
  
  if (mappedFiles.length === 0) {
    return { error: 'No files provided. Please upload an Excel file first.' };
  }
  
  const filename = mappedFiles[0]; // Use first file
  const fileData = await ctx.files.read(filename);
  
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(fileData.buffer);
  
  const results = [];
  workbook.eachSheet((worksheet) => {
    const data = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 10) { // Only read first 10 rows
        data.push(row.values);
      }
    });
    results.push({
      sheetName: worksheet.name,
      rowCount: worksheet.rowCount,
      columnCount: worksheet.columnCount,
      preview: data
    });
  });
  
  return { success: true, sheets: results };
}
`;

export const createSpreadsheetExample = `
import ExcelJS from 'npm:exceljs@4.4.0';

export async function main(ctx: any) {
  const { title = 'My Report', data = [] } = ctx.inputs;
  
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(title);
  
  // If data provided, use it; otherwise create sample data
  const rowData = data.length > 0 ? data : [
    ['Product', 'Quantity', 'Price', 'Total'],
    ['Widget A', 10, 19.99, 199.90],
    ['Widget B', 25, 29.99, 749.75],
    ['Widget C', 5, 49.99, 249.95]
  ];
  
  // Add data
  rowData.forEach((row, index) => {
    const worksheetRow = worksheet.addRow(row);
    if (index === 0) { // Header row
      worksheetRow.font = { bold: true };
      worksheetRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
    }
  });
  
  // Auto-fit columns
  worksheet.columns.forEach((column) => {
    column.width = 15;
  });
  
  // Save file
  const filename = ctx.excel.generateOutputName(title.replace(/\\s+/g, '_'), 'xlsx');
  const buffer = await workbook.xlsx.writeBuffer();
  const savedPath = await ctx.files.write(filename, new Uint8Array(buffer));
  
  return {
    success: true,
    filename,
    path: savedPath,
    rowCount: rowData.length,
    message: \`Created spreadsheet with \${rowData.length} rows\`
  };
}
`;

/**
 * Helper function to call the executor with proper configuration
 */
export function createExecutorCall(code: string, inputs?: any, filePathMap?: Record<string, string>) {
  return {
    name: 'run_ts',
    arguments: {
      code,
      inputs: inputs || {},
      filePathMap: filePathMap || {},
      libraries: ['exceljs'],
      allowNet: true,
      timeoutMs: 10000,
      memoryMb: 512
    }
  };
}
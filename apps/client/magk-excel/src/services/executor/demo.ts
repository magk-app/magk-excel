/**
 * Demo: Excel Processing with Enhanced ExecutorMCPTool
 * 
 * This demo shows the complete capabilities of the enhanced executor
 * for Excel file processing with ExcelJS in a secure sandbox.
 */

import { executorMCPTool, createExecutorCall } from './index';

// Demo 1: Create a complex Excel report
const complexExcelDemo = `
import ExcelJS from 'npm:exceljs@4.4.0';

export async function main(ctx) {
  ctx.log.info('Creating complex Excel report with multiple sheets');
  
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'MAGK Excel Processor';
  workbook.created = new Date();
  
  // Sheet 1: Sales Data
  const salesSheet = workbook.addWorksheet('Sales Data');
  salesSheet.columns = [
    { header: 'Date', key: 'date', width: 12 },
    { header: 'Product', key: 'product', width: 20 },
    { header: 'Quantity', key: 'quantity', width: 10 },
    { header: 'Price', key: 'price', width: 12 },
    { header: 'Total', key: 'total', width: 12 }
  ];
  
  const salesData = [
    { date: '2024-01-01', product: 'Widget A', quantity: 10, price: 19.99, total: 199.90 },
    { date: '2024-01-02', product: 'Widget B', quantity: 25, price: 29.99, total: 749.75 },
    { date: '2024-01-03', product: 'Widget C', quantity: 5, price: 49.99, total: 249.95 }
  ];
  
  salesData.forEach(row => {
    salesSheet.addRow(row);
  });
  
  // Format header
  salesSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  salesSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };
  
  // Add totals row
  const totalRow = salesSheet.addRow({
    date: 'TOTAL:',
    quantity: salesData.reduce((sum, row) => sum + row.quantity, 0),
    total: salesData.reduce((sum, row) => sum + row.total, 0)
  });
  totalRow.font = { bold: true };
  
  // Sheet 2: Charts and Analysis (data only, charts would need additional setup)
  const analysisSheet = workbook.addWorksheet('Analysis');
  analysisSheet.addRow(['Product Performance Analysis']);
  analysisSheet.addRow(['']);
  analysisSheet.addRow(['Product', 'Units Sold', 'Revenue', 'Avg Price']);
  
  const productSummary = salesData.reduce((acc, row) => {
    if (!acc[row.product]) {
      acc[row.product] = { quantity: 0, total: 0, count: 0 };
    }
    acc[row.product].quantity += row.quantity;
    acc[row.product].total += row.total;
    acc[row.product].count += 1;
    return acc;
  }, {});
  
  Object.entries(productSummary).forEach(([product, data]) => {
    analysisSheet.addRow([
      product,
      data.quantity,
      data.total,
      (data.total / data.quantity).toFixed(2)
    ]);
  });
  
  // Save with generated filename
  const filename = ctx.excel.generateOutputName('sales_report', 'xlsx');
  const buffer = await workbook.xlsx.writeBuffer();
  const savedPath = await ctx.files.write(filename, new Uint8Array(buffer));
  
  return {
    success: true,
    filename,
    path: savedPath,
    sheets: ['Sales Data', 'Analysis'],
    totalRecords: salesData.length,
    totalRevenue: salesData.reduce((sum, row) => sum + row.total, 0)
  };
}
`;

// Demo 2: Process uploaded Excel file
const processUploadedFileDemo = `
import ExcelJS from 'npm:exceljs@4.4.0';

export async function main(ctx) {
  ctx.log.info('Processing uploaded Excel files');
  
  const mappedFiles = ctx.files.listMapped();
  const results = [];
  
  for (const filename of mappedFiles) {
    const fileType = ctx.excel.getFileType(filename);
    
    if (fileType === 'xlsx' || fileType === 'xls') {
      ctx.log.info(\`Processing file: \${filename}\`);
      
      try {
        const fileData = await ctx.files.read(filename);
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(fileData.buffer);
        
        const sheetInfo = [];
        let totalCells = 0;
        let totalRows = 0;
        
        workbook.eachSheet((worksheet, sheetId) => {
          const rowCount = worksheet.rowCount;
          const colCount = worksheet.columnCount;
          const cellCount = rowCount * colCount;
          
          totalRows += rowCount;
          totalCells += cellCount;
          
          // Extract sample data from first few rows
          const sampleData = [];
          let rowIndex = 0;
          worksheet.eachRow((row, rowNumber) => {
            if (rowIndex < 5) { // Only first 5 rows
              const values = [];
              row.eachCell((cell, colNumber) => {
                values[colNumber - 1] = cell.value;
              });
              sampleData.push(values);
              rowIndex++;
            }
          });
          
          sheetInfo.push({
            name: worksheet.name,
            rows: rowCount,
            columns: colCount,
            cells: cellCount,
            sample: sampleData
          });
        });
        
        // Create enhanced version with metadata
        const enhancedWorkbook = new ExcelJS.Workbook();
        
        // Copy all original sheets
        workbook.eachSheet((originalSheet) => {
          const newSheet = enhancedWorkbook.addWorksheet(originalSheet.name + '_Enhanced');
          
          // Copy data
          originalSheet.eachRow((row, rowNumber) => {
            const values = [];
            row.eachCell((cell, colNumber) => {
              values[colNumber - 1] = cell.value;
            });
            newSheet.addRow(values);
          });
        });
        
        // Add summary sheet
        const summarySheet = enhancedWorkbook.addWorksheet('Processing_Summary');
        summarySheet.addRow(['File Processing Summary']);
        summarySheet.addRow(['Original File:', filename]);
        summarySheet.addRow(['Processed At:', new Date().toISOString()]);
        summarySheet.addRow(['Total Sheets:', sheetInfo.length]);
        summarySheet.addRow(['Total Rows:', totalRows]);
        summarySheet.addRow(['Total Cells:', totalCells]);
        summarySheet.addRow([]);
        summarySheet.addRow(['Sheet Details:']);
        summarySheet.addRow(['Name', 'Rows', 'Columns', 'Cells']);
        
        sheetInfo.forEach(sheet => {
          summarySheet.addRow([sheet.name, sheet.rows, sheet.columns, sheet.cells]);
        });
        
        // Style the summary
        summarySheet.getRow(1).font = { bold: true, size: 14 };
        summarySheet.getRow(8).font = { bold: true };
        summarySheet.getRow(9).font = { bold: true };
        
        const processedFilename = ctx.excel.generateOutputName(\`processed_\${filename.split('.')[0]}\`, 'xlsx');
        const buffer = await enhancedWorkbook.xlsx.writeBuffer();
        const savedPath = await ctx.files.write(processedFilename, new Uint8Array(buffer));
        
        results.push({
          originalFile: filename,
          processedFile: processedFilename,
          path: savedPath,
          sheets: sheetInfo,
          totalRows,
          totalCells,
          processingTime: new Date().toISOString()
        });
        
        ctx.log.info(\`Successfully processed \${filename}: \${totalRows} rows, \${totalCells} cells\`);
        
      } catch (error) {
        ctx.log.error(\`Failed to process \${filename}:\`, error);
        results.push({
          originalFile: filename,
          error: error.message,
          status: 'failed'
        });
      }
    }
  }
  
  return {
    success: true,
    filesProcessed: results.length,
    results,
    timestamp: new Date().toISOString()
  };
}
`;

// Demo 3: Convert data formats
const dataConversionDemo = `
import ExcelJS from 'npm:exceljs@4.4.0';

export async function main(ctx) {
  const { inputData, format = 'xlsx' } = ctx.inputs;
  
  ctx.log.info(\`Converting data to \${format} format\`);
  
  if (!inputData || !Array.isArray(inputData)) {
    throw new Error('Input data must be an array of objects');
  }
  
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Converted Data');
  
  if (inputData.length > 0) {
    // Add headers from first object keys
    const headers = Object.keys(inputData[0]);
    worksheet.addRow(headers);
    
    // Add data rows
    inputData.forEach(item => {
      const row = headers.map(header => item[header] ?? '');
      worksheet.addRow(row);
    });
    
    // Auto-fit columns
    headers.forEach((header, index) => {
      const column = worksheet.getColumn(index + 1);
      const maxLength = Math.max(
        header.length,
        ...inputData.map(item => String(item[header] ?? '').length)
      );
      column.width = Math.min(maxLength + 2, 50);
    });
    
    // Style headers
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6E6FA' }
    };
  }
  
  // Save in requested format
  const filename = ctx.excel.generateOutputName('converted_data', format);
  let buffer;
  let mimeType;
  
  if (format === 'csv') {
    // Convert to CSV (simplified)
    let csvContent = '';
    if (inputData.length > 0) {
      const headers = Object.keys(inputData[0]);
      csvContent += headers.join(',') + '\\n';
      inputData.forEach(item => {
        const row = headers.map(header => {
          const value = item[header] ?? '';
          return typeof value === 'string' && value.includes(',') 
            ? \`"\${value}"\` 
            : String(value);
        });
        csvContent += row.join(',') + '\\n';
      });
    }
    const savedPath = await ctx.files.write(filename, csvContent);
    mimeType = ctx.excel.MIME_TYPES.CSV;
    
    return {
      success: true,
      filename,
      path: savedPath,
      format: 'csv',
      records: inputData.length,
      mimeType
    };
  } else {
    buffer = await workbook.xlsx.writeBuffer();
    mimeType = ctx.excel.MIME_TYPES.XLSX;
  }
  
  const savedPath = await ctx.files.write(filename, new Uint8Array(buffer));
  
  return {
    success: true,
    filename,
    path: savedPath,
    format,
    records: inputData.length,
    mimeType,
    sheets: 1
  };
}
`;

// Demo execution functions
export async function runComplexExcelDemo() {
  console.log('🚀 Running Complex Excel Report Demo...');
  
  const result = await executorMCPTool.handleToolCall(
    createExecutorCall(complexExcelDemo)
  );
  
  const response = JSON.parse(result.content[0].text);
  console.log('📊 Complex Excel Demo Result:', response);
  return response;
}

export async function runFileProcessingDemo(filePathMap: Record<string, string>) {
  console.log('📁 Running File Processing Demo...');
  
  const result = await executorMCPTool.handleToolCall(
    createExecutorCall(processUploadedFileDemo, {}, filePathMap)
  );
  
  const response = JSON.parse(result.content[0].text);
  console.log('🔄 File Processing Demo Result:', response);
  return response;
}

export async function runDataConversionDemo(data: any[], format: 'xlsx' | 'csv' = 'xlsx') {
  console.log(`🔄 Running Data Conversion Demo (format: ${format})...`);
  
  const result = await executorMCPTool.handleToolCall(
    createExecutorCall(dataConversionDemo, { inputData: data, format })
  );
  
  const response = JSON.parse(result.content[0].text);
  console.log('📝 Data Conversion Demo Result:', response);
  return response;
}

// Complete demo runner
export async function runAllDemos() {
  console.log('🎯 Starting Complete Excel Processing Demos...');
  
  try {
    // Demo 1: Complex Excel Report
    const complexResult = await runComplexExcelDemo();
    console.log('✅ Complex Excel Report Demo completed');
    
    // Demo 2: Data Conversion
    const sampleData = [
      { name: 'Alice', age: 30, city: 'New York', score: 95 },
      { name: 'Bob', age: 25, city: 'Los Angeles', score: 87 },
      { name: 'Charlie', age: 35, city: 'Chicago', score: 92 }
    ];
    
    const conversionResult = await runDataConversionDemo(sampleData);
    console.log('✅ Data Conversion Demo completed');
    
    console.log('🎉 All demos completed successfully!');
    
    return {
      success: true,
      demos: {
        complexExcel: complexResult,
        dataConversion: conversionResult
      }
    };
    
  } catch (error) {
    console.error('❌ Demo execution failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Export the demo code for use in UI components
export const demoCode = {
  complexExcel: complexExcelDemo,
  processUploadedFile: processUploadedFileDemo,
  dataConversion: dataConversionDemo
};
/**
 * Excel Service - Provides functionality to read and process Excel files
 * Uses the xlsx library to parse Excel files in the browser
 */

import * as XLSX from 'xlsx';

export interface ExcelProcessingResponse {
  status: 'success' | 'error';
  data?: unknown[];
  sheets?: string[];
  error?: string;
  metadata?: {
    fileName: string;
    fileSize: number;
    sheetCount: number;
    totalRows: number;
    totalCells: number;
  };
}

export class ExcelService {
  
  /**
   * Read Excel file and convert to JSON data
   */
  static async readExcelFile(file: File): Promise<ExcelProcessingResponse> {
    try {
      console.log('📊 Reading Excel file:', file.name);
      
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      const sheets = workbook.SheetNames;
      const data: unknown[] = [];
      let totalRows = 0;
      let totalCells = 0;
      
      // Process each sheet
      for (const sheetName of sheets) {
        const worksheet = workbook.Sheets[sheetName];
        const sheetData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1, // Use array format to preserve headers
          defval: '' // Default value for empty cells
        });
        
        if (sheetData.length > 0) {
          // Convert array format to object format with proper headers
          const headers = sheetData[0] as string[];
          const rows = sheetData.slice(1);
          
          const processedData = rows.map((row: unknown, index) => {
            const rowArray = row as unknown[];
            const rowObject: Record<string, unknown> = { _sheet: sheetName, _row: index + 2 }; // +2 because row 1 is headers
            headers.forEach((header, colIndex) => {
              const cellValue = rowArray[colIndex];
              rowObject[header || `Column_${colIndex + 1}`] = cellValue;
            });
            return rowObject;
          });
          
          data.push(...processedData);
          totalRows += rows.length;
          totalCells += rows.length * headers.length;
        }
      }
      
      const metadata = {
        fileName: file.name,
        fileSize: file.size,
        sheetCount: sheets.length,
        totalRows,
        totalCells
      };
      
      console.log('✅ Excel file processed successfully:', metadata);
      
      return {
        status: 'success',
        data,
        sheets,
        metadata
      };
      
    } catch (error) {
      console.error('❌ Excel processing error:', error);
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
  
  /**
   * Get sheet names from Excel file
   */
  static async getSheetNames(file: File): Promise<string[]> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      return workbook.SheetNames;
    } catch (error) {
      console.error('Error getting sheet names:', error);
      return [];
    }
  }
  
  /**
   * Read specific sheet from Excel file
   */
  static async readExcelSheet(file: File, sheetName: string): Promise<ExcelProcessingResponse> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      if (!workbook.Sheets[sheetName]) {
        return {
          status: 'error',
          error: `Sheet "${sheetName}" not found in workbook`
        };
      }
      
      const worksheet = workbook.Sheets[sheetName];
      const sheetData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: ''
      });
      
      if (sheetData.length === 0) {
        return {
          status: 'success',
          data: [],
          sheets: [sheetName],
          metadata: {
            fileName: file.name,
            fileSize: file.size,
            sheetCount: 1,
            totalRows: 0,
            totalCells: 0
          }
        };
      }
      
      // Convert to object format
      const headers = sheetData[0] as string[];
      const rows = sheetData.slice(1);
      
      const data = rows.map((row: unknown, index) => {
        const rowArray = row as unknown[];
        const rowObject: Record<string, unknown> = { _sheet: sheetName, _row: index + 2 };
        headers.forEach((header, colIndex) => {
          const cellValue = rowArray[colIndex];
          rowObject[header || `Column_${colIndex + 1}`] = cellValue;
        });
        return rowObject;
      });
      
      const metadata = {
        fileName: file.name,
        fileSize: file.size,
        sheetCount: 1,
        totalRows: rows.length,
        totalCells: rows.length * headers.length
      };
      
      return {
        status: 'success',
        data,
        sheets: [sheetName],
        metadata
      };
      
    } catch (error) {
      console.error('Excel sheet reading error:', error);
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
  
  /**
   * Format Excel data for display in chat
   */
  static formatExcelDataForChat(response: ExcelProcessingResponse): string {
    if (response.status === 'error') {
      return `❌ **Excel Processing Error**: ${response.error}`;
    }
    
    const { data, metadata } = response;
    if (!data || !metadata) {
      return '❌ **Excel Processing Error**: No data found';
    }
    
    const previewRows = Math.min(5, data.length);
    const previewData = data.slice(0, previewRows);
    
    let result = `📊 **Excel File Processed Successfully!**\n\n`;
    result += `**📄 File Details:**\n`;
    result += `- **Filename:** ${metadata.fileName}\n`;
    result += `- **File Size:** ${(metadata.fileSize / 1024).toFixed(1)} KB\n`;
    result += `- **Sheets:** ${metadata.sheetCount}\n`;
    result += `- **Total Rows:** ${metadata.totalRows.toLocaleString()}\n`;
    result += `- **Total Cells:** ${metadata.totalCells.toLocaleString()}\n\n`;
    
    if (response.sheets && response.sheets.length > 0) {
      result += `**📋 Sheets:** ${response.sheets.join(', ')}\n\n`;
    }
    
    if (previewData.length > 0) {
      result += `**🔍 Data Preview** (first ${previewRows} rows):\n\n`;
      
      // Get columns (excluding internal columns)
      const sampleRow = previewData[0] as Record<string, unknown>;
      const columns = Object.keys(sampleRow).filter(key => !key.startsWith('_'));
      
      if (columns.length > 0) {
        // Create table header
        result += `| ${columns.join(' | ')} |\n`;
        result += `| ${columns.map(() => '---').join(' | ')} |\n`;
        
        // Add data rows
        previewData.forEach(row => {
          const rowObject = row as Record<string, unknown>;
          const values = columns.map(col => {
            const value = rowObject[col];
            if (value === null || value === undefined || value === '') return '-';
            return String(value).length > 30 ? String(value).substring(0, 27) + '...' : String(value);
          });
          result += `| ${values.join(' | ')} |\n`;
        });
        
        if (data.length > previewRows) {
          result += `\n*... and ${data.length - previewRows} more rows*\n`;
        }
      }
    }
    
    result += `\n**✨ The Excel data is now available for analysis and can be used in workflows!**`;
    
    return result;
  }
  
  /**
   * Write data to Excel file and download it
   */
  static async writeExcelFile(
    data: unknown[],
    filename: string = 'export.xlsx',
    sheetName: string = 'Sheet1'
  ): Promise<void> {
    try {
      console.log('📝 Writing Excel file:', filename);
      
      // Create a new workbook
      const workbook = XLSX.utils.book_new();
      
      // Convert data to worksheet
      const worksheet = XLSX.utils.json_to_sheet(data);
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      
      // Write the file and trigger download
      XLSX.writeFile(workbook, filename);
      
      console.log('✅ Excel file written successfully:', filename);
    } catch (error) {
      console.error('❌ Excel writing error:', error);
      throw error;
    }
  }
  
  /**
   * Create Excel file from multiple sheets
   */
  static async writeMultiSheetExcel(
    sheets: { name: string; data: unknown[] }[],
    filename: string = 'export.xlsx'
  ): Promise<void> {
    try {
      console.log('📝 Writing multi-sheet Excel file:', filename);
      
      // Create a new workbook
      const workbook = XLSX.utils.book_new();
      
      // Add each sheet
      for (const sheet of sheets) {
        const worksheet = XLSX.utils.json_to_sheet(sheet.data);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
      }
      
      // Write the file and trigger download
      XLSX.writeFile(workbook, filename);
      
      console.log('✅ Multi-sheet Excel file written successfully:', filename);
    } catch (error) {
      console.error('❌ Excel writing error:', error);
      throw error;
    }
  }
  
  /**
   * Convert JSON data to Excel with formatting
   */
  static async exportToExcel(
    data: unknown[],
    options: {
      filename?: string;
      sheetName?: string;
      headers?: string[];
      columnWidths?: number[];
    } = {}
  ): Promise<void> {
    try {
      const {
        filename = 'export.xlsx',
        sheetName = 'Data',
        headers,
        columnWidths
      } = options;
      
      console.log('📊 Exporting to Excel with formatting:', filename);
      
      // Create workbook
      const workbook = XLSX.utils.book_new();
      
      // Process data with custom headers if provided
      let processedData = data;
      if (headers && data.length > 0) {
        processedData = data.map(row => {
          const newRow: Record<string, unknown> = {};
          const rowObj = row as Record<string, unknown>;
          headers.forEach((header, index) => {
            const originalKey = Object.keys(rowObj)[index];
            newRow[header] = rowObj[originalKey];
          });
          return newRow;
        });
      }
      
      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(processedData);
      
      // Apply column widths if provided
      if (columnWidths) {
        worksheet['!cols'] = columnWidths.map(width => ({ wch: width }));
      } else {
        // Auto-size columns based on content
        const cols: { wch: number }[] = [];
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        for (let C = range.s.c; C <= range.e.c; ++C) {
          let maxWidth = 10;
          for (let R = range.s.r; R <= range.e.r; ++R) {
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
            const cell = worksheet[cellAddress];
            if (cell && cell.v) {
              const cellLength = String(cell.v).length;
              if (cellLength > maxWidth) maxWidth = cellLength;
            }
          }
          cols.push({ wch: Math.min(maxWidth + 2, 50) });
        }
        worksheet['!cols'] = cols;
      }
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      
      // Write file
      XLSX.writeFile(workbook, filename);
      
      console.log('✅ Excel export completed:', filename);
    } catch (error) {
      console.error('❌ Excel export error:', error);
      throw error;
    }
  }
}
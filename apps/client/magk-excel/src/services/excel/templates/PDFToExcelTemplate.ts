import * as ExcelJS from 'exceljs';

/**
 * Template for converting PDF data to Excel format with table extraction and data processing
 * Supports structured data extraction from PDFs and conversion to Excel with formatting
 */
export class PDFToExcelTemplate {
  private workbook: ExcelJS.Workbook;
  private worksheet: ExcelJS.Worksheet | null = null;

  constructor() {
    this.workbook = new ExcelJS.Workbook();
    this.initializeWorkbook();
  }

  /**
   * Initialize workbook with metadata
   */
  private initializeWorkbook(): void {
    this.workbook.creator = 'MAGK Excel - PDF Converter';
    this.workbook.lastModifiedBy = 'MAGK Excel';
    this.workbook.created = new Date();
    this.workbook.modified = new Date();
    this.workbook.properties.date1904 = false;
  }

  /**
   * Process extracted PDF data and convert to Excel
   * @param pdfData - Extracted data from PDF
   * @param options - Processing options
   */
  async processPDFData(
    pdfData: {
      text?: string;
      tables?: Array<{
        data: string[][];
        headers?: string[];
        page?: number;
        confidence?: number;
      }>;
      metadata?: {
        title?: string;
        author?: string;
        subject?: string;
        creator?: string;
        producer?: string;
        creationDate?: Date;
        modificationDate?: Date;
        pages?: number;
      };
      images?: Array<{
        src: string;
        width: number;
        height: number;
        page: number;
      }>;
    },
    options: {
      sheetNames?: {
        tables?: string;
        text?: string;
        metadata?: string;
      };
      tableProcessing?: {
        autoDetectHeaders?: boolean;
        removeEmptyRows?: boolean;
        removeEmptyColumns?: boolean;
        cleanWhitespace?: boolean;
        mergeNumericData?: boolean;
      };
      formatting?: {
        headerStyle?: Partial<ExcelJS.Style>;
        dataStyle?: Partial<ExcelJS.Style>;
        autoFit?: boolean;
      };
    } = {}
  ): Promise<void> {
    try {
      const {
        sheetNames = {
          tables: 'Tables',
          text: 'Text Content',
          metadata: 'Document Info'
        },
        tableProcessing = {
          autoDetectHeaders: true,
          removeEmptyRows: true,
          removeEmptyColumns: true,
          cleanWhitespace: true,
          mergeNumericData: false
        },
        formatting = {
          autoFit: true
        }
      } = options;

      // Process tables if available
      if (pdfData.tables && pdfData.tables.length > 0) {
        await this.processTablesData(pdfData.tables, sheetNames.tables!, tableProcessing, formatting);
      }

      // Process text content if available
      if (pdfData.text) {
        await this.processTextData(pdfData.text, sheetNames.text!, formatting);
      }

      // Process metadata if available
      if (pdfData.metadata) {
        await this.processMetadata(pdfData.metadata, sheetNames.metadata!, formatting);
      }

    } catch (error) {
      throw new Error(`Failed to process PDF data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process tables data from PDF
   * @param tables - Extracted tables
   * @param sheetName - Worksheet name
   * @param processing - Processing options
   * @param formatting - Formatting options
   */
  private async processTablesData(
    tables: Array<{
      data: string[][];
      headers?: string[];
      page?: number;
      confidence?: number;
    }>,
    sheetName: string,
    processing: any,
    formatting: any
  ): Promise<void> {
    try {
      const worksheet = this.workbook.addWorksheet(sheetName);
      let currentRow = 1;

      for (let tableIndex = 0; tableIndex < tables.length; tableIndex++) {
        const table = tables[tableIndex];
        let tableData = [...table.data];

        // Clean and process table data
        if (processing.cleanWhitespace) {
          tableData = this.cleanTableData(tableData);
        }

        if (processing.removeEmptyRows) {
          tableData = this.removeEmptyRows(tableData);
        }

        if (processing.removeEmptyColumns) {
          tableData = this.removeEmptyColumns(tableData);
        }

        if (tableData.length === 0) {
          continue; // Skip empty tables
        }

        // Add table header if multiple tables
        if (tables.length > 1) {
          const tableHeaderCell = worksheet.getCell(`A${currentRow}`);
          tableHeaderCell.value = `Table ${tableIndex + 1}${table.page ? ` (Page ${table.page})` : ''}`;
          tableHeaderCell.font = { bold: true, size: 12 };
          tableHeaderCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD0D0D0' }
          };
          
          if (table.confidence !== undefined) {
            const confidenceCell = worksheet.getCell(`B${currentRow}`);
            confidenceCell.value = `Confidence: ${(table.confidence * 100).toFixed(1)}%`;
            confidenceCell.font = { italic: true, size: 10 };
          }
          
          currentRow += 2;
        }

        // Detect headers
        let headers: string[] = [];
        let dataStartIndex = 0;

        if (table.headers && table.headers.length > 0) {
          headers = table.headers;
        } else if (processing.autoDetectHeaders && tableData.length > 0) {
          headers = this.detectHeaders(tableData);
          if (headers.length > 0) {
            dataStartIndex = 1;
          }
        }

        // Write headers
        if (headers.length > 0) {
          for (let colIndex = 0; colIndex < headers.length; colIndex++) {
            const cell = worksheet.getCell(currentRow, colIndex + 1);
            cell.value = headers[colIndex];
            
            if (formatting.headerStyle) {
              Object.assign(cell, formatting.headerStyle);
            } else {
              cell.font = { bold: true };
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0E0E0' }
              };
              cell.alignment = { horizontal: 'center', vertical: 'middle' };
            }
          }
          currentRow++;
        }

        // Write table data
        for (let rowIndex = dataStartIndex; rowIndex < tableData.length; rowIndex++) {
          const rowData = tableData[rowIndex];
          
          for (let colIndex = 0; colIndex < rowData.length; colIndex++) {
            const cell = worksheet.getCell(currentRow, colIndex + 1);
            let cellValue = rowData[colIndex];
            
            // Try to convert to appropriate data type
            cellValue = this.convertDataType(cellValue);
            cell.value = cellValue;
            
            if (formatting.dataStyle) {
              Object.assign(cell, formatting.dataStyle);
            }
          }
          currentRow++;
        }

        // Add spacing between tables
        if (tableIndex < tables.length - 1) {
          currentRow += 2;
        }
      }

      // Auto-fit columns
      if (formatting.autoFit) {
        this.autoFitColumns(worksheet);
      }

    } catch (error) {
      throw new Error(`Failed to process tables data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process text content from PDF
   * @param text - Extracted text
   * @param sheetName - Worksheet name
   * @param formatting - Formatting options
   */
  private async processTextData(
    text: string,
    sheetName: string,
    formatting: any
  ): Promise<void> {
    try {
      const worksheet = this.workbook.addWorksheet(sheetName);
      
      // Process text into structured format
      const textStructure = this.analyzeTextStructure(text);
      
      let currentRow = 1;

      // Add document structure
      if (textStructure.sections.length > 0) {
        // Header
        const headerCell = worksheet.getCell(`A${currentRow}`);
        headerCell.value = 'Document Text Content';
        headerCell.font = { bold: true, size: 14 };
        headerCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
        currentRow += 2;

        // Content sections
        for (const section of textStructure.sections) {
          if (section.title) {
            const titleCell = worksheet.getCell(`A${currentRow}`);
            titleCell.value = section.title;
            titleCell.font = { bold: true, size: 12 };
            currentRow++;
          }
          
          if (section.content) {
            // Split long content into multiple rows if needed
            const contentLines = section.content.split('\n');
            for (const line of contentLines) {
              if (line.trim()) {
                const contentCell = worksheet.getCell(`A${currentRow}`);
                contentCell.value = line.trim();
                contentCell.alignment = { wrapText: true, vertical: 'top' };
                currentRow++;
              }
            }
          }
          
          currentRow++; // Add spacing between sections
        }
      } else {
        // Simple text processing
        const lines = text.split('\n');
        
        const headerCell = worksheet.getCell(`A${currentRow}`);
        headerCell.value = 'Text Content';
        headerCell.font = { bold: true, size: 14 };
        currentRow += 2;
        
        for (const line of lines) {
          if (line.trim()) {
            const cell = worksheet.getCell(`A${currentRow}`);
            cell.value = line.trim();
            cell.alignment = { wrapText: true, vertical: 'top' };
            currentRow++;
          }
        }
      }

      // Set column width for text content
      worksheet.getColumn(1).width = 80;

    } catch (error) {
      throw new Error(`Failed to process text data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process PDF metadata
   * @param metadata - PDF metadata
   * @param sheetName - Worksheet name
   * @param formatting - Formatting options
   */
  private async processMetadata(
    metadata: any,
    sheetName: string,
    formatting: any
  ): Promise<void> {
    try {
      const worksheet = this.workbook.addWorksheet(sheetName);
      
      let currentRow = 1;

      // Header
      const headerCell = worksheet.getCell(`A${currentRow}`);
      headerCell.value = 'Document Metadata';
      headerCell.font = { bold: true, size: 14 };
      headerCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
      currentRow += 2;

      // Metadata entries
      const metadataEntries = [
        ['Title', metadata.title],
        ['Author', metadata.author],
        ['Subject', metadata.subject],
        ['Creator', metadata.creator],
        ['Producer', metadata.producer],
        ['Creation Date', metadata.creationDate?.toLocaleString()],
        ['Modification Date', metadata.modificationDate?.toLocaleString()],
        ['Number of Pages', metadata.pages]
      ];

      for (const [key, value] of metadataEntries) {
        if (value !== undefined && value !== null) {
          const keyCell = worksheet.getCell(`A${currentRow}`);
          const valueCell = worksheet.getCell(`B${currentRow}`);
          
          keyCell.value = key;
          keyCell.font = { bold: true };
          
          valueCell.value = value;
          
          currentRow++;
        }
      }

      // Set column widths
      worksheet.getColumn(1).width = 20;
      worksheet.getColumn(2).width = 40;

    } catch (error) {
      throw new Error(`Failed to process metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clean table data by trimming whitespace and normalizing
   * @param tableData - Raw table data
   * @returns Cleaned table data
   */
  private cleanTableData(tableData: string[][]): string[][] {
    return tableData.map(row => 
      row.map(cell => 
        typeof cell === 'string' ? cell.trim().replace(/\s+/g, ' ') : cell
      )
    );
  }

  /**
   * Remove empty rows from table data
   * @param tableData - Table data
   * @returns Data without empty rows
   */
  private removeEmptyRows(tableData: string[][]): string[][] {
    return tableData.filter(row => 
      row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '')
    );
  }

  /**
   * Remove empty columns from table data
   * @param tableData - Table data
   * @returns Data without empty columns
   */
  private removeEmptyColumns(tableData: string[][]): string[][] {
    if (tableData.length === 0) return tableData;
    
    const columnCount = Math.max(...tableData.map(row => row.length));
    const nonEmptyColumns: number[] = [];
    
    for (let colIndex = 0; colIndex < columnCount; colIndex++) {
      const hasData = tableData.some(row => {
        const cell = row[colIndex];
        return cell !== null && cell !== undefined && String(cell).trim() !== '';
      });
      
      if (hasData) {
        nonEmptyColumns.push(colIndex);
      }
    }
    
    return tableData.map(row => 
      nonEmptyColumns.map(colIndex => row[colIndex] || '')
    );
  }

  /**
   * Detect headers in table data
   * @param tableData - Table data
   * @returns Detected headers or empty array
   */
  private detectHeaders(tableData: string[][]): string[] {
    if (tableData.length < 2) return [];
    
    const firstRow = tableData[0];
    const secondRow = tableData[1];
    
    // Check if first row looks like headers
    const firstRowHasText = firstRow.some(cell => 
      typeof cell === 'string' && isNaN(Number(cell)) && cell.trim() !== ''
    );
    
    const secondRowHasNumbers = secondRow.some(cell => 
      !isNaN(Number(cell)) && String(cell).trim() !== ''
    );
    
    // If first row has text and second row has numbers, assume first row is headers
    if (firstRowHasText && secondRowHasNumbers) {
      return firstRow.map(cell => String(cell).trim());
    }
    
    return [];
  }

  /**
   * Convert string data to appropriate data types
   * @param value - String value
   * @returns Converted value
   */
  private convertDataType(value: any): any {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    
    const strValue = String(value).trim();
    
    // Try to convert to number
    if (/^-?\d+\.?\d*$/.test(strValue)) {
      const numValue = Number(strValue);
      if (!isNaN(numValue)) {
        return numValue;
      }
    }
    
    // Try to convert to date
    const dateValue = new Date(strValue);
    if (!isNaN(dateValue.getTime()) && strValue.length > 5) {
      // Only convert if it looks like a reasonable date string
      if (/\d{4}[-\/]\d{1,2}[-\/]\d{1,2}/.test(strValue) || 
          /\d{1,2}[-\/]\d{1,2}[-\/]\d{4}/.test(strValue)) {
        return dateValue;
      }
    }
    
    // Try to convert boolean
    const lowerValue = strValue.toLowerCase();
    if (lowerValue === 'true' || lowerValue === 'yes' || lowerValue === '1') {
      return true;
    }
    if (lowerValue === 'false' || lowerValue === 'no' || lowerValue === '0') {
      return false;
    }
    
    return strValue;
  }

  /**
   * Analyze text structure to identify sections
   * @param text - Raw text
   * @returns Structured text analysis
   */
  private analyzeTextStructure(text: string): {
    sections: Array<{ title?: string; content?: string; level?: number }>;
  } {
    const lines = text.split('\n');
    const sections: Array<{ title?: string; content?: string; level?: number }> = [];
    
    let currentSection: { title?: string; content?: string; level?: number } | null = null;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) {
        continue;
      }
      
      // Detect potential headings (all caps, short lines, etc.)
      const isHeading = this.isLikelyHeading(trimmedLine);
      
      if (isHeading) {
        // Save current section if exists
        if (currentSection) {
          sections.push(currentSection);
        }
        
        // Start new section
        currentSection = {
          title: trimmedLine,
          content: '',
          level: this.getHeadingLevel(trimmedLine)
        };
      } else {
        // Add to current section content
        if (currentSection) {
          currentSection.content = currentSection.content 
            ? `${currentSection.content}\n${trimmedLine}`
            : trimmedLine;
        } else {
          // Create a section for content without a title
          if (sections.length === 0) {
            currentSection = { content: trimmedLine };
          } else {
            currentSection!.content = currentSection!.content 
              ? `${currentSection!.content}\n${trimmedLine}`
              : trimmedLine;
          }
        }
      }
    }
    
    // Save final section
    if (currentSection) {
      sections.push(currentSection);
    }
    
    return { sections };
  }

  /**
   * Check if a line looks like a heading
   * @param line - Text line
   * @returns True if likely a heading
   */
  private isLikelyHeading(line: string): boolean {
    // Simple heuristics for heading detection
    return (
      line.length < 100 && // Not too long
      (
        line === line.toUpperCase() || // All caps
        /^[A-Z][^.]*$/.test(line) || // Starts with capital, no periods
        /^\d+\.?\s/.test(line) // Starts with number
      )
    );
  }

  /**
   * Get heading level based on formatting
   * @param heading - Heading text
   * @returns Heading level (1-3)
   */
  private getHeadingLevel(heading: string): number {
    if (/^\d+\./.test(heading)) return 2; // Numbered headings
    if (heading === heading.toUpperCase()) return 1; // All caps
    return 3; // Default level
  }

  /**
   * Auto-fit columns in worksheet
   * @param worksheet - Target worksheet
   */
  private autoFitColumns(worksheet: ExcelJS.Worksheet): void {
    worksheet.columns.forEach((column, index) => {
      let maxLength = 0;
      
      column.eachCell({ includeEmpty: false }, (cell) => {
        const cellValue = cell.value?.toString() || '';
        maxLength = Math.max(maxLength, cellValue.length);
      });
      
      // Set width with some padding, min 10, max 50
      const width = Math.min(Math.max(maxLength + 2, 10), 50);
      worksheet.getColumn(index + 1).width = width;
    });
  }

  /**
   * Save workbook to file
   * @param filename - Output filename
   */
  async saveToFile(filename: string): Promise<void> {
    try {
      await this.workbook.xlsx.writeFile(filename);
    } catch (error) {
      throw new Error(`Failed to save file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get workbook as buffer
   * @returns Buffer containing Excel file
   */
  async toBuffer(): Promise<Buffer> {
    try {
      return await this.workbook.xlsx.writeBuffer() as Buffer;
    } catch (error) {
      throw new Error(`Failed to create buffer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Example usage for PDF to Excel conversion
   */
  static async example(): Promise<void> {
    const converter = new PDFToExcelTemplate();
    
    try {
      // Example extracted PDF data
      const pdfData = {
        text: 'ANNUAL SALES REPORT\n\nThis report contains sales data for 2024.\n\nCONCLUSION\n\nSales have increased by 15%.',
        tables: [
          {
            data: [
              ['Product', 'Q1 Sales', 'Q2 Sales', 'Q3 Sales', 'Q4 Sales'],
              ['Laptop', '15000', '18000', '22000', '25000'],
              ['Phone', '12000', '14000', '16000', '18000'],
              ['Tablet', '8000', '9000', '11000', '13000']
            ],
            page: 1,
            confidence: 0.95
          }
        ],
        metadata: {
          title: 'Sales Report 2024',
          author: 'Sales Department',
          pages: 5,
          creationDate: new Date('2024-01-15')
        }
      };
      
      // Process PDF data
      await converter.processPDFData(pdfData, {
        tableProcessing: {
          autoDetectHeaders: true,
          removeEmptyRows: true,
          cleanWhitespace: true
        },
        formatting: {
          autoFit: true,
          headerStyle: {
            font: { bold: true, color: { argb: 'FFFFFF' } },
            fill: {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: '366092' }
            }
          }
        }
      });
      
      // Save converted Excel file
      await converter.saveToFile('converted_pdf_data.xlsx');
      console.log('PDF to Excel conversion completed!');
      
    } catch (error) {
      console.error('Error converting PDF to Excel:', error);
    }
  }
}

export default PDFToExcelTemplate;
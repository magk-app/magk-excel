import { chromium, Browser, Page } from 'playwright';
import ExcelJS from 'exceljs';
import path from 'path';

export interface ScrapingOptions {
  headless?: boolean;
  timeout?: number;
  outputDir?: string;
}

export interface TableData {
  headers: string[][];
  rows: string[][];
}

export class HKTableExtractService {
  private browser: Browser | null = null;

  constructor(private options: ScrapingOptions = {}) {
    this.options = {
      headless: true,
      timeout: 30000,
      outputDir: './output',
      ...options
    };
  }

  /**
   * Initialize the browser instance
   */
  private async initBrowser(): Promise<Browser> {
    if (!this.browser) {
      console.log('🚀 Initializing Playwright browser...');
      this.browser = await chromium.launch({
        headless: this.options.headless,
        args: [
          '--disable-gpu',
          '--window-size=1920,1080'
        ]
      });
    }
    return this.browser;
  }

  /**
   * Close the browser instance
   */
  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      console.log('🔒 Browser closed');
    }
  }

  /**
   * Scrape passenger statistics from Hong Kong Immigration Department
   * Equivalent to scrape_manually_reconstruct() in Python
   */
  async scrapePassengerStatistics(dateStr: string, outputFile?: string): Promise<string> {
    const url = `https://www.immd.gov.hk/eng/facts/passenger-statistics.html?d=${dateStr}`;
    console.log(`🌐 Scraping URL: ${url}`);

    const browser = await this.initBrowser();
    const page = await browser.newPage();

    try {
      // Navigate to the page
      await page.goto(url, { waitUntil: 'networkidle', timeout: this.options.timeout });
      console.log('📄 Page loaded successfully');

      // Wait for the table to be present
      await page.waitForSelector('table', { timeout: 10000 });
      console.log('📊 Table found on page');

      // Extract table data using the same logic as Python script
      const tableData = await this.extractTableData(page);
      console.log(`📋 Extracted ${tableData.rows.length} rows from table`);

      // Process and structure the data
      const processedData = this.processTableData(tableData);
      
      // Generate Excel file
      const filename = outputFile || `passenger_stats_${dateStr}.xlsx`;
      const fullPath = await this.generateExcelFile(processedData, filename);
      
      console.log(`✅ Successfully saved Excel file: ${fullPath}`);
      return fullPath;

    } catch (error) {
      console.error('❌ Error during scraping:', error);
      throw new Error(`Scraping failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      await page.close();
    }
  }

  /**
   * Extract table data from the page
   */
  private async extractTableData(page: Page): Promise<TableData> {
    const tableData = await page.evaluate(() => {
      // Find table containing "Control Point" in header
      const tables = Array.from(document.querySelectorAll('table'));
      const targetTable = tables.find(table => 
        table.textContent?.includes('Control Point')
      );

      if (!targetTable) {
        throw new Error('Table with "Control Point" header not found');
      }

      const rows = Array.from(targetTable.querySelectorAll('tr'));
      console.log(`Found ${rows.length} rows in the table`);

      const allRows: string[][] = [];
      
      rows.forEach((row) => {
        const cells = Array.from(row.querySelectorAll('th, td'));
        const rowData = cells.map(cell => cell.textContent?.trim() || '');
        
        // Only add rows that have some content
        if (rowData.some(cell => cell.length > 0)) {
          allRows.push(rowData);
        }
      });

      return {
        headers: allRows.slice(0, 3), // First 3 rows are headers
        rows: allRows.slice(3) // Rest are data rows
      };
    });

    // Log sample of extracted data
    console.log('Sample of first 5 extracted rows:');
    tableData.headers.concat(tableData.rows.slice(0, 2)).forEach((row, index) => {
      console.log(`Row ${index}: ${JSON.stringify(row)}`);
    });

    return tableData;
  }

  /**
   * Process and structure the table data similar to Python script
   */
  private processTableData(tableData: TableData): { headers: string[][], data: string[][] } {
    const { headers, rows } = tableData;
    
    // Manual header adjustment (equivalent to Python script lines 48-51)
    const adjustedHeaders = [...headers];
    
    // Reconstruct headers based on the structure found in the Python script
    if (adjustedHeaders.length >= 2) {
      adjustedHeaders[0] = ['', '', '', '', '', 'Arrival', '', '', '', '', 'Departure'];
      adjustedHeaders[1] = [
        '', '', '', '', '', 
        'Hong Kong Residents', 'Mainland Visitors', 'Other Visitors', 'Total',
        '', 
        'Hong Kong Residents', 'Mainland Visitors', 'Other Visitors', 'Total'
      ];
    }

    // Pad headers to consistent length (14 columns as in Python)
    const maxLen = 14;
    const paddedHeaders = adjustedHeaders.map(row => {
      const padded = [...row];
      while (padded.length < maxLen) {
        padded.push('');
      }
      return padded.slice(0, maxLen); // Ensure exactly maxLen columns
    });

    console.log(`Padded all header rows to ${maxLen} columns`);
    paddedHeaders.forEach((row, index) => {
      console.log(`Padded header row ${index} length: ${row.length}, content: ${JSON.stringify(row)}`);
    });

    // Filter out rows that contain 'Control Point' (repeated headers in data)
    const filteredRows = rows.filter(row => 
      !row.some(cell => cell.includes('Control Point'))
    );

    // Remove completely empty rows
    const cleanedRows = filteredRows.filter(row => 
      row.some(cell => cell.trim().length > 0)
    );

    return {
      headers: paddedHeaders,
      data: cleanedRows
    };
  }

  /**
   * Generate Excel file from processed data
   */
  private async generateExcelFile(
    processedData: { headers: string[][], data: string[][] }, 
    filename: string
  ): Promise<string> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Passenger Statistics');

    // Create flattened column headers (equivalent to Python's column flattening)
    const flattenedHeaders = processedData.headers[0].map((_, colIndex) => {
      const columnParts = processedData.headers.map(headerRow => headerRow[colIndex])
        .filter(part => part && part.trim().length > 0);
      return columnParts.join(' ').trim() || `Column ${colIndex + 1}`;
    });

    console.log('Flattened headers:', flattenedHeaders);

    // Add headers to worksheet
    worksheet.addRow(flattenedHeaders);

    // Style the header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add data rows
    processedData.data.forEach(row => {
      // Pad row to match header length
      const paddedRow = [...row];
      while (paddedRow.length < flattenedHeaders.length) {
        paddedRow.push('');
      }
      worksheet.addRow(paddedRow.slice(0, flattenedHeaders.length));
    });

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      if (column.header) {
        column.width = Math.max(12, column.header.toString().length + 2);
      }
    });

    // Ensure output directory exists
    const outputDir = this.options.outputDir || './output';
    const fullPath = path.resolve(outputDir, filename);
    
    // Create directory if it doesn't exist
    const fs = await import('fs');
    const dirname = path.dirname(fullPath);
    if (!fs.existsSync(dirname)) {
      fs.mkdirSync(dirname, { recursive: true });
    }

    // Save the file
    await workbook.xlsx.writeFile(fullPath);
    
    return fullPath;
  }

  /**
   * Public method to scrape with automatic cleanup
   */
  async scrapeAndExport(dateStr: string, outputFile?: string): Promise<string> {
    try {
      const result = await this.scrapePassengerStatistics(dateStr, outputFile);
      return result;
    } finally {
      await this.closeBrowser();
    }
  }
}

// Example usage function (equivalent to Python's __main__ block)
export async function runExample(): Promise<void> {
  const dateToScrape = "20250718";
  const outputFilePath = `passenger_stats_${dateToScrape}.xlsx`;
  
  const scraper = new HKTableExtractService({
    headless: true,
    outputDir: './output'
  });

  try {
    const result = await scraper.scrapeAndExport(dateToScrape, outputFilePath);
    console.log(`✅ Scraping completed successfully: ${result}`);
  } catch (error) {
    console.error('❌ Scraping failed:', error);
    throw error;
  }
}

// Export for use as a standalone script
if (import.meta.url === `file://${process.argv[1]}`) {
  runExample().catch(console.error);
}
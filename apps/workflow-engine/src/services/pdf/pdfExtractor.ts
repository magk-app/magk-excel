#!/usr/bin/env tsx
/**
 * Large PDF Financial Data Extractor
 * 
 * Processes large financial PDFs (hundreds of pages) with table preservation
 * Usage: npx tsx largePdfExtractor.ts <pdf_file> [output_dir] [--chunk-size N]
 * 
 * Example:
 *   npx tsx largePdfExtractor.ts ../../../pdf_misc/test-cases/Google.pdf ./output --chunk-size 25
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// For Node.js compatibility with PDF.js
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PDF.js setup for Node.js
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs';

// Set up PDF.js worker
GlobalWorkerOptions.workerSrc = path.join(__dirname, '../../../node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs');

// Node.js polyfills for PDF.js
if (typeof global !== 'undefined') {
  // Polyfill DOMMatrix for Node.js
  global.DOMMatrix = class DOMMatrix {
    constructor() {
      this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
    }
  };
}

export interface FinancialTable {
  page: number;
  startY: number;
  endY: number;
  headers: string[];
  rows: string[][];
  confidence: number; // 0-1 score for table detection confidence
  tableType: 'financial' | 'data' | 'unknown';
}

export interface PDFExtractionResult {
  fileName: string;
  totalPages: number;
  processedPages: number;
  extractionTime: number;
  text: string;
  tables: FinancialTable[];
  metadata: {
    hasFinancialData: boolean;
    tableCount: number;
    averageTableConfidence: number;
  };
}

export class LargePDFExtractor {
  private chunkSize: number = 25;
  private outputDir: string;
  
  constructor(chunkSize: number = 25, outputDir: string = './output') {
    this.chunkSize = chunkSize;
    this.outputDir = outputDir;
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  }

  async extractLargePDF(pdfPath: string): Promise<PDFExtractionResult> {
    const startTime = Date.now();
    console.log(`🚀 Starting extraction of: ${path.basename(pdfPath)}`);
    
    try {
      // Load PDF
      const pdfBuffer = fs.readFileSync(pdfPath);
      const pdfData = new Uint8Array(pdfBuffer);
      const loadingTask = getDocument({
        data: pdfData,
        useSystemFonts: true,
        verbosity: 0 // Reduce console noise
      });
      
      const pdfDocument = await loadingTask.promise;
      const totalPages = pdfDocument.numPages;
      
      console.log(`📄 PDF loaded: ${totalPages} pages`);
      console.log(`📦 Processing in chunks of ${this.chunkSize} pages`);
      
      // Process in chunks
      const allText: string[] = [];
      const allTables: FinancialTable[] = [];
      
      for (let startPage = 1; startPage <= totalPages; startPage += this.chunkSize) {
        const endPage = Math.min(startPage + this.chunkSize - 1, totalPages);
        const progress = Math.round((startPage / totalPages) * 100);
        
        console.log(`\n⚡ Processing chunk: pages ${startPage}-${endPage} (${progress}%)`);
        
        const chunkResult = await this.processChunk(pdfDocument, startPage, endPage);
        
        // Save chunk to file
        const chunkFile = path.join(this.outputDir, `chunk_${startPage}-${endPage}.txt`);
        fs.writeFileSync(chunkFile, chunkResult.text);
        console.log(`💾 Saved chunk to: ${chunkFile}`);
        
        allText.push(chunkResult.text);
        allTables.push(...chunkResult.tables);
        
        // Memory cleanup
        if (global.gc) {
          global.gc();
        }
      }
      
      const extractionTime = Date.now() - startTime;
      
      // Compile final results
      const result: PDFExtractionResult = {
        fileName: path.basename(pdfPath),
        totalPages,
        processedPages: totalPages,
        extractionTime,
        text: allText.join('\n\n'),
        tables: allTables,
        metadata: {
          hasFinancialData: allTables.some(t => t.tableType === 'financial'),
          tableCount: allTables.length,
          averageTableConfidence: allTables.length > 0 
            ? allTables.reduce((sum, t) => sum + t.confidence, 0) / allTables.length 
            : 0
        }
      };
      
      // Save complete results
      await this.saveResults(result);
      
      console.log(`\n✅ Extraction completed in ${(extractionTime / 1000).toFixed(2)}s`);
      console.log(`📊 Found ${allTables.length} tables (${allTables.filter(t => t.tableType === 'financial').length} financial)`);
      
      return result;
      
    } catch (error) {
      console.error('❌ Extraction failed:', error);
      throw error;
    }
  }

  private async processChunk(
    pdfDocument: any, 
    startPage: number, 
    endPage: number
  ): Promise<{ text: string; tables: FinancialTable[] }> {
    
    const chunkText: string[] = [];
    const chunkTables: FinancialTable[] = [];
    
    for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      
      // Get text content with positioning information
      const textContent = await page.getTextContent({
        normalizeWhitespace: false,
        disableCombineTextItems: false,
        includeMarkedContent: true
      });
      
      // Process text items to detect and extract tables
      const pageResult = this.extractPageContent(textContent, pageNum);
      
      chunkText.push(`\n=== PAGE ${pageNum} ===\n${pageResult.text}`);
      chunkTables.push(...pageResult.tables);
      
      // Progress indicator
      process.stdout.write(`📄 ${pageNum} `);
    }
    
    process.stdout.write('\n');
    
    return {
      text: chunkText.join('\n'),
      tables: chunkTables
    };
  }

  private extractPageContent(textContent: any, pageNum: number): {
    text: string;
    tables: FinancialTable[];
  } {
    const items = textContent.items;
    
    // Group text items by Y position (rows) with tolerance for slight misalignments
    const rowTolerance = 3; // pixels
    const rowGroups = new Map<number, Array<{x: number, text: string, width: number}>>();
    
    items.forEach((item: any) => {
      if (!item.str.trim()) return; // Skip empty items
      
      const y = Math.round(item.transform[5]);
      const x = Math.round(item.transform[4]);
      const width = item.width || 0;
      
      // Find existing row within tolerance or create new one
      let targetY = y;
      for (const existingY of rowGroups.keys()) {
        if (Math.abs(existingY - y) <= rowTolerance) {
          targetY = existingY;
          break;
        }
      }
      
      if (!rowGroups.has(targetY)) {
        rowGroups.set(targetY, []);
      }
      
      rowGroups.get(targetY)!.push({ 
        x, 
        text: item.str, 
        width 
      });
    });
    
    // Sort rows by Y position (top to bottom)
    const sortedRows = Array.from(rowGroups.entries())
      .sort(([a], [b]) => b - a) // Higher Y = top of page
      .map(([y, items]) => ({
        y,
        items: items.sort((a, b) => a.x - b.x) // Left to right
      }));
    
    // Detect and extract tables
    const { processedText, detectedTables } = this.detectFinancialTables(sortedRows, pageNum);
    
    return {
      text: processedText,
      tables: detectedTables
    };
  }

  private detectFinancialTables(
    rows: Array<{y: number, items: Array<{x: number, text: string, width: number}>}>,
    pageNum: number
  ): { processedText: string; detectedTables: FinancialTable[] } {
    
    const tables: FinancialTable[] = [];
    const textLines: string[] = [];
    
    let potentialTable: Array<{y: number, cells: string[]}> = [];
    let tableStartY: number | null = null;
    let consecutiveTableRows = 0;
    
    rows.forEach(({ y, items }) => {
      const rowText = items.map(item => item.text).join(' ').trim();
      
      // Enhanced table detection for financial data
      const tableScore = this.calculateTableScore(items, rowText);
      
      if (tableScore.isTableRow) {
        if (tableStartY === null) {
          tableStartY = y;
          consecutiveTableRows = 0;
        }
        
        consecutiveTableRows++;
        
        // Convert items to table cells with better column detection
        const tableCells = this.extractTableCells(items);
        potentialTable.push({ y, cells: tableCells });
        
      } else {
        // End of potential table - evaluate if it's worth keeping
        if (potentialTable.length >= 2 && consecutiveTableRows >= 2) {
          const table = this.buildFinancialTable(potentialTable, pageNum, tableStartY!);
          if (table.confidence > 0.3) { // Only keep confident tables
            tables.push(table);
          }
        }
        
        // Reset table detection
        potentialTable = [];
        tableStartY = null;
        consecutiveTableRows = 0;
        
        // Add regular text
        if (rowText) {
          textLines.push(rowText);
        }
      }
    });
    
    // Handle table at end of page
    if (potentialTable.length >= 2 && consecutiveTableRows >= 2) {
      const table = this.buildFinancialTable(potentialTable, pageNum, tableStartY!);
      if (table.confidence > 0.3) {
        tables.push(table);
      }
    }
    
    return {
      processedText: textLines.join('\n'),
      detectedTables: tables
    };
  }

  private calculateTableScore(
    items: Array<{x: number, text: string, width: number}>,
    rowText: string
  ): { isTableRow: boolean; confidence: number; financialScore: number } {
    
    let score = 0;
    let financialScore = 0;
    
    // Multiple columns indicator
    if (items.length >= 2) score += 0.3;
    if (items.length >= 3) score += 0.2;
    if (items.length >= 4) score += 0.2;
    
    // Financial data patterns
    const financialPatterns = [
      /\$[\d,]+(\.\d{2})?/g,        // Dollar amounts: $1,234.56
      /\d+\.\d{2}%/g,               // Percentages: 12.34%
      /\d{1,3}(,\d{3})+(\.\d+)?/g,  // Large numbers with commas: 1,234,567
      /Q[1-4]\s+\d{4}/g,            // Quarters: Q1 2023
      /\d{4}$/g,                    // Years: 2023
      /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/g, // Months
      /(Revenue|Income|Profit|Loss|Assets|Liabilities|Equity)/gi, // Financial terms
    ];
    
    financialPatterns.forEach(pattern => {
      const matches = rowText.match(pattern);
      if (matches) {
        financialScore += matches.length * 0.1;
        score += matches.length * 0.1;
      }
    });
    
    // Consistent spacing (table-like structure)
    if (items.length > 1) {
      const gaps = [];
      for (let i = 1; i < items.length; i++) {
        gaps.push(items[i].x - (items[i-1].x + items[i-1].width));
      }
      
      if (gaps.length > 0) {
        const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
        const variance = gaps.reduce((sum, gap) => sum + Math.pow(gap - avgGap, 2), 0) / gaps.length;
        
        // Low variance indicates consistent spacing
        if (variance < avgGap * 0.5 && avgGap > 10) {
          score += 0.3;
        }
      }
    }
    
    // Alignment patterns
    const hasRightAlignedNumbers = items.some(item => 
      /^\d+(\.\d+)?$/.test(item.text.trim())
    );
    if (hasRightAlignedNumbers) score += 0.2;
    
    return {
      isTableRow: score > 0.4,
      confidence: Math.min(score, 1.0),
      financialScore: Math.min(financialScore, 1.0)
    };
  }

  private extractTableCells(items: Array<{x: number, text: string, width: number}>): string[] {
    // Smart cell grouping based on gaps
    const cells: string[] = [];
    let currentCell = '';
    let lastEndX = -1;
    
    items.forEach((item, index) => {
      const gap = lastEndX === -1 ? 0 : item.x - lastEndX;
      const cellThreshold = 30; // Minimum gap to consider new cell
      
      if (gap > cellThreshold && currentCell.trim()) {
        cells.push(currentCell.trim());
        currentCell = item.text;
      } else {
        currentCell += (currentCell ? ' ' : '') + item.text;
      }
      
      lastEndX = item.x + item.width;
    });
    
    if (currentCell.trim()) {
      cells.push(currentCell.trim());
    }
    
    return cells;
  }

  private buildFinancialTable(
    potentialTable: Array<{y: number, cells: string[]}>,
    pageNum: number,
    startY: number
  ): FinancialTable {
    
    const rows = potentialTable.map(row => row.cells);
    const headers = rows[0] || [];
    const dataRows = rows.slice(1);
    
    // Calculate confidence based on data quality
    let confidence = 0.5; // Base confidence
    
    // Bonus for consistent column count
    const columnCounts = rows.map(row => row.length);
    const avgColumns = columnCounts.reduce((a, b) => a + b, 0) / columnCounts.length;
    const columnConsistency = columnCounts.filter(count => 
      Math.abs(count - avgColumns) <= 1
    ).length / columnCounts.length;
    confidence += columnConsistency * 0.3;
    
    // Bonus for financial data in cells
    const allCells = rows.flat();
    const financialCells = allCells.filter(cell => 
      /[\$€£¥%]|\d+[,.]?\d*[KMB]?/.test(cell)
    ).length;
    const financialRatio = financialCells / Math.max(allCells.length, 1);
    confidence += financialRatio * 0.2;
    
    // Determine table type
    let tableType: 'financial' | 'data' | 'unknown' = 'unknown';
    
    // Check for explicit financial statement indicators
    const allTableText = [headers.join(' '), ...dataRows.map(row => row.join(' '))].join(' ').toLowerCase();
    const hasFinancialKeywords = /revenue|income|expense|profit|cost|assets|liabilities|equity|cash flow/i.test(allTableText);
    
    if (financialRatio > 0.15 || hasFinancialKeywords) {
      tableType = 'financial';
    } else if (financialRatio > 0.05 || columnConsistency > 0.7) {
      tableType = 'data';
    }
    
    return {
      page: pageNum,
      startY,
      endY: potentialTable[potentialTable.length - 1].y,
      headers,
      rows: dataRows,
      confidence: Math.min(confidence, 1.0),
      tableType
    };
  }

  /**
   * Create a unified markdown document from all extracted data
   */
  private createUnifiedMarkdown(result: PDFExtractionResult): string {
    const baseName = path.basename(result.fileName, path.extname(result.fileName));
    
    let markdown = `# ${baseName} - Financial Document Analysis\n\n`;
    markdown += `**Extracted:** ${new Date().toLocaleDateString()}\n`;
    markdown += `**Pages:** ${result.totalPages}\n`;
    markdown += `**Tables Found:** ${result.tables.length} (${result.tables.filter(t => t.tableType === 'financial').length} financial)\n\n`;
    
    if (result.tables.length === 0) {
      markdown += `## Document Text\n\n${this.cleanText(result.text)}\n\n`;
      return markdown;
    }
    
    // Group and organize tables by type and page
    const financialTables = result.tables.filter(t => t.tableType === 'financial');
    const otherTables = result.tables.filter(t => t.tableType !== 'financial');
    
    // Add financial data section
    if (financialTables.length > 0) {
      markdown += `## Financial Data\n\n`;
      
      // Try to identify statement types and merge related tables
      const mergedFinancialData = this.mergeRelatedTables(financialTables);
      
      mergedFinancialData.forEach((tableGroup, index) => {
        const statementType = this.identifyStatementType(tableGroup);
        markdown += `### ${statementType}\n\n`;
        markdown += this.tableGroupToMarkdown(tableGroup);
        markdown += `\n`;
      });
    }
    
    // Add other tables if any
    if (otherTables.length > 0) {
      markdown += `## Additional Data\n\n`;
      otherTables.forEach((table, index) => {
        markdown += `### Table ${index + 1} (Page ${table.page})\n\n`;
        markdown += this.singleTableToMarkdown(table);
        markdown += `\n`;
      });
    }
    
    return markdown;
  }
  
  /**
   * Clean and normalize text content
   */
  private cleanText(text: string): string {
    return text
      // Fix common character encoding issues - map problematic Unicode to readable text
      .replace(/[ݘڻںܜھڹڸڽہڿھڼڼڹڿۀۀڽںۀښښށ]/g, '')
      .replace(/ܛ/g, '.')
      // Remove parentheses artifacts
      .replace(/\(\s*\)/g, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  /**
   * Merge related financial tables (e.g., multi-page income statements)
   */
  private mergeRelatedTables(tables: FinancialTable[]): FinancialTable[][] {
    // For now, return each table as its own group
    // TODO: Implement intelligent table merging based on headers and content
    return tables.map(table => [table]);
  }
  
  /**
   * Identify the type of financial statement
   */
  private identifyStatementType(tableGroup: FinancialTable[]): string {
    const firstTable = tableGroup[0];
    const allText = [
      ...firstTable.headers,
      ...firstTable.rows.flat()
    ].join(' ').toLowerCase();
    
    if (allText.includes('revenue') || allText.includes('income') || allText.includes('expense')) {
      return 'Income Statement';
    } else if (allText.includes('assets') || allText.includes('liabilities') || allText.includes('equity')) {
      return 'Balance Sheet';
    } else if (allText.includes('cash flow') || allText.includes('operating activities')) {
      return 'Cash Flow Statement';
    } else {
      return `Financial Data (Page ${firstTable.page})`;
    }
  }
  
  /**
   * Convert a group of related tables to markdown
   */
  private tableGroupToMarkdown(tableGroup: FinancialTable[]): string {
    // For now, just render the first table
    // TODO: Implement intelligent merging of related tables
    return this.singleTableToMarkdown(tableGroup[0]);
  }
  
  /**
   * Convert a single table to clean markdown format
   */
  private singleTableToMarkdown(table: FinancialTable): string {
    let markdown = '';
    
    // Determine column count
    const maxCols = Math.max(
      table.headers.length,
      ...table.rows.map(row => row.length)
    );
    
    if (maxCols === 0) return '';
    
    // Create headers
    const headers = table.headers.length > 0 ? 
      table.headers.map(h => this.cleanText(h)) : 
      Array.from({length: maxCols}, (_, i) => `Column ${i + 1}`);
    
    // Ensure we have enough headers
    while (headers.length < maxCols) {
      headers.push(`Column ${headers.length + 1}`);
    }
    
    // Build markdown table
    markdown += '| ' + headers.slice(0, maxCols).join(' | ') + ' |\n';
    markdown += '| ' + Array(maxCols).fill('---').join(' | ') + ' |\n';
    
    // Add data rows
    table.rows.forEach(row => {
      const cleanRow = row.map(cell => this.cleanText(cell));
      // Pad row to match column count
      while (cleanRow.length < maxCols) {
        cleanRow.push('');
      }
      markdown += '| ' + cleanRow.slice(0, maxCols).join(' | ') + ' |\n';
    });
    
    return markdown;
  }

  private async saveResults(result: PDFExtractionResult): Promise<void> {
    // Create unified markdown file
    const markdownFile = path.join(this.outputDir, `${result.fileName}_extracted.md`);
    const markdown = this.createUnifiedMarkdown(result);
    fs.writeFileSync(markdownFile, markdown, 'utf-8');
    
    // Save summary
    const summaryFile = path.join(this.outputDir, `${result.fileName}_summary.json`);
    fs.writeFileSync(summaryFile, JSON.stringify({
      fileName: result.fileName,
      totalPages: result.totalPages,
      totalTables: result.tables.length,
      financialTables: result.tables.filter(t => t.tableType === 'financial').length,
      averageConfidence: result.tables.reduce((sum, t) => sum + t.confidence, 0) / result.tables.length,
      extractionTime: result.extractionTime,
      metadata: result.metadata,
      outputFile: path.basename(markdownFile),
      extractedAt: new Date().toISOString()
    }, null, 2));
    
    console.log(`\n📁 Results saved to: ${this.outputDir}`);
    console.log(`📄 Unified markdown: ${path.basename(markdownFile)}`);
    console.log(`📊 Summary: ${path.basename(summaryFile)}`);
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
📄 Large PDF Financial Data Extractor

Usage: npx tsx largePdfExtractor.ts <pdf_file> [output_dir] [--chunk-size N]

Examples:
  npx tsx largePdfExtractor.ts ../../../pdf_misc/test-cases/Google.pdf
  npx tsx largePdfExtractor.ts report.pdf ./output --chunk-size 50

Options:
  --chunk-size N    Pages per chunk (default: 25)
    `);
    process.exit(1);
  }
  
  const pdfFile = args[0];
  let outputDir = './output';
  let chunkSize = 25;
  
  // Parse arguments
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--chunk-size' && i + 1 < args.length) {
      chunkSize = parseInt(args[i + 1]);
      i++; // Skip next argument
    } else if (!args[i].startsWith('--')) {
      outputDir = args[i];
    }
  }
  
  if (!fs.existsSync(pdfFile)) {
    console.error(`❌ PDF file not found: ${pdfFile}`);
    process.exit(1);
  }
  
  try {
    const extractor = new LargePDFExtractor(chunkSize, outputDir);
    await extractor.extractLargePDF(pdfFile);
    
    console.log('\n🎉 Extraction completed successfully!');
  } catch (error) {
    console.error('❌ Extraction failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

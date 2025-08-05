/**
 * PDF Extraction Service - Integrates with Modal API endpoints
 * Provides functionality to extract tables from PDFs using AI
 */

export interface PDFExtractionRequest {
  pdf_source: string;
  prompt?: string;
}

export interface PDFExtractionResponse {
  status: 'success' | 'error';
  data?: any;
  error?: string;
  tables?: any[];
  extracted_data?: any;
}

export class PDFExtractionService {
  private static readonly BASE_URL = 'https://jandhyala-karthik-r--magk-excel-api';
  
  /**
   * Extract all tables from a PDF
   */
  static async extractAllTables(pdfSource: string): Promise<PDFExtractionResponse> {
    try {
      const response = await fetch(`${this.BASE_URL}-extract-tables.modal.run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdf_source: pdfSource
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        status: 'success',
        data,
        tables: data.tables || data
      };
    } catch (error) {
      console.error('PDF extraction error:', error);
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Extract specific table from PDF using a prompt
   */
  static async extractSpecificTable(pdfSource: string, prompt: string): Promise<PDFExtractionResponse> {
    try {
      const response = await fetch(`${this.BASE_URL}-extract-specific-table.modal.run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdf_source: pdfSource,
          prompt: prompt
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        status: 'success',
        data,
        extracted_data: data
      };
    } catch (error) {
      console.error('PDF specific extraction error:', error);
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Check API health
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.BASE_URL}-health.modal.run`);
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  /**
   * Format extraction results for display in chat
   */
  static formatResultsForChat(results: PDFExtractionResponse): string {
    if (results.status === 'error') {
      return `❌ **PDF Extraction Failed**: ${results.error}`;
    }

    if (results.tables && results.tables.length > 0) {
      return `✅ **PDF Tables Extracted Successfully**\n\n` +
        `Found ${results.tables.length} table(s):\n` +
        results.tables.map((table, index) => 
          `**Table ${index + 1}:** ${JSON.stringify(table, null, 2)}`
        ).join('\n\n');
    }

    if (results.extracted_data) {
      return `✅ **PDF Data Extracted Successfully**\n\n` +
        `**Extracted Data:**\n` +
        `\`\`\`json\n${JSON.stringify(results.extracted_data, null, 2)}\n\`\`\``;
    }

    return `✅ **PDF Processing Complete**\n\n` +
      `\`\`\`json\n${JSON.stringify(results.data, null, 2)}\n\`\`\``;
  }
}
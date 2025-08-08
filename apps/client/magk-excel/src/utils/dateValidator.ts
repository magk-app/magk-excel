/**
 * Date validation utilities for MAGK
 * Issue #15: Accept future dates and 2025+ documents
 */

export class DateValidator {
  /**
   * Check if a date is valid (can be in the future)
   */
  static isValidDate(date: Date | string): boolean {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return !isNaN(dateObj.getTime());
  }

  /**
   * Check if a document date is acceptable (always true now)
   */
  static isAcceptableDocumentDate(date: Date | string): boolean {
    // Always accept any valid date, including future dates
    return this.isValidDate(date);
  }

  /**
   * Get the current date
   */
  static getCurrentDate(): Date {
    return new Date();
  }

  /**
   * Format a message about document dates
   */
  static getDateAcceptanceMessage(documentDate: Date | string): string {
    const dateObj = typeof documentDate === 'string' ? new Date(documentDate) : documentDate;
    const currentYear = new Date().getFullYear();
    const docYear = dateObj.getFullYear();
    
    if (docYear > currentYear) {
      return `Processing document from ${docYear}. MAGK accepts documents from any year.`;
    } else if (docYear === currentYear) {
      return `Processing current year (${docYear}) document.`;
    } else {
      return `Processing historical document from ${docYear}.`;
    }
  }

  /**
   * Extract year from filename or content
   */
  static extractYearFromText(text: string): number | null {
    // Look for 4-digit years between 1900 and 2100
    const yearMatch = text.match(/\b(19|20|21)\d{2}\b/);
    return yearMatch ? parseInt(yearMatch[0]) : null;
  }
}

export default DateValidator;
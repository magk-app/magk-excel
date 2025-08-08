/**
 * Request Validation Service
 * Issue #3: Reduce strictness in request handling
 */

export interface ValidationResult {
  isValid: boolean;
  warnings?: string[];
  errors?: string[];
}

export class RequestValidator {
  private static readonly PERMISSIVE_MODE = true; // Enable permissive mode by default

  /**
   * Validate a user request
   * Be permissive and helpful rather than restrictive
   */
  static validateRequest(request: string): ValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];
    
    // Only block truly harmful requests
    if (this.isHarmfulRequest(request)) {
      errors.push('This request appears to contain harmful content.');
      return { isValid: false, errors };
    }
    
    // Warn about potentially complex requests but don't block them
    if (this.isComplexRequest(request)) {
      warnings.push('This request may take longer to process.');
    }
    
    // Always try to help with reasonable requests
    return { 
      isValid: true, 
      warnings: warnings.length > 0 ? warnings : undefined 
    };
  }

  /**
   * Check if a request is harmful (very limited set)
   */
  private static isHarmfulRequest(request: string): boolean {
    const harmful_patterns = [
      /malware/i,
      /virus/i,
      /hack\s+into/i,
      /steal\s+data/i,
      /illegal/i
    ];
    
    if (!this.PERMISSIVE_MODE) {
      return harmful_patterns.some(pattern => pattern.test(request));
    }
    
    // In permissive mode, only block if multiple harmful patterns match
    const matches = harmful_patterns.filter(pattern => pattern.test(request));
    return matches.length >= 2;
  }

  /**
   * Check if a request is complex
   */
  private static isComplexRequest(request: string): boolean {
    // Requests over 1000 characters might be complex
    return request.length > 1000;
  }

  /**
   * Validate file uploads
   * Be permissive with file types and sizes
   */
  static validateFile(file: {
    name: string;
    size: number;
    type: string;
  }): ValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];
    
    // Very generous file size limit (100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      errors.push(`File size exceeds ${maxSize / (1024 * 1024)}MB limit.`);
      return { isValid: false, errors };
    }
    
    // Warn about large files but don't block them
    if (file.size > 50 * 1024 * 1024) {
      warnings.push('Large file may take longer to process.');
    }
    
    // Accept all common file types
    const acceptedTypes = [
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'text/plain',
      'image/png',
      'image/jpeg',
      'image/gif',
      'application/json',
      'application/xml',
      'text/html'
    ];
    
    // In permissive mode, accept any file type with a warning
    if (this.PERMISSIVE_MODE && !acceptedTypes.includes(file.type)) {
      warnings.push(`File type ${file.type} may have limited support.`);
    }
    
    return { 
      isValid: true, 
      warnings: warnings.length > 0 ? warnings : undefined 
    };
  }

  /**
   * Validate date inputs
   * Accept any valid date including future dates
   */
  static validateDate(date: string | Date): ValidationResult {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return { 
        isValid: false, 
        errors: ['Invalid date format.'] 
      };
    }
    
    // Accept any valid date, including future dates
    return { isValid: true };
  }

  /**
   * Sanitize user input while being permissive
   */
  static sanitizeInput(input: string): string {
    // Only remove truly dangerous patterns
    let sanitized = input;
    
    // Remove script tags but preserve the content
    sanitized = sanitized.replace(/<script[^>]*>(.*?)<\/script>/gi, '$1');
    
    // Remove other potentially dangerous HTML but keep text
    sanitized = sanitized.replace(/<iframe[^>]*>(.*?)<\/iframe>/gi, '$1');
    
    // Trim excessive whitespace
    sanitized = sanitized.trim();
    
    return sanitized;
  }
}

export default RequestValidator;
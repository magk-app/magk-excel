/**
 * Input sanitization utilities for security
 */

/**
 * Sanitize user input to prevent XSS and injection attacks
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Remove any script tags and their content
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, '');
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Remove data: URLs that could contain scripts
  sanitized = sanitized.replace(/data:text\/html[^,]*,/gi, '');
  
  // Escape HTML entities for display
  const htmlEntities: Record<string, string> = {
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };
  
  // Only escape HTML in content that looks like it contains HTML
  if (/<[^>]+>/.test(sanitized)) {
    sanitized = sanitized.replace(/[<>&"'\/]/g, char => htmlEntities[char] || char);
  }
  
  return sanitized.trim();
}

/**
 * Validate message length
 */
export function validateMessageLength(message: string, maxLength: number = 10000): boolean {
  return message.length <= maxLength;
}

/**
 * Validate file attachments
 */
export function validateFileAttachment(file: File): { valid: boolean; error?: string } {
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = [
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'image/png',
    'image/jpeg',
    'image/jpg'
  ];
  
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` };
  }
  
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'File type not allowed' };
  }
  
  // Check file extension as additional validation
  const extension = file.name.split('.').pop()?.toLowerCase();
  const ALLOWED_EXTENSIONS = ['pdf', 'xls', 'xlsx', 'csv', 'png', 'jpg', 'jpeg'];
  
  if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
    return { valid: false, error: 'Invalid file extension' };
  }
  
  return { valid: true };
}

/**
 * Rate limiting check
 */
export class RateLimiter {
  private requestCounts: Map<string, { count: number; resetTime: number }> = new Map();
  
  constructor(
    private maxRequests: number = 10,
    private windowMs: number = 60000 // 1 minute
  ) {}
  
  canMakeRequest(identifier: string = 'default'): boolean {
    const now = Date.now();
    const record = this.requestCounts.get(identifier);
    
    if (!record || now > record.resetTime) {
      // Reset or create new record
      this.requestCounts.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return true;
    }
    
    if (record.count >= this.maxRequests) {
      return false;
    }
    
    record.count++;
    return true;
  }
  
  getRemainingRequests(identifier: string = 'default'): number {
    const record = this.requestCounts.get(identifier);
    if (!record) return this.maxRequests;
    
    const now = Date.now();
    if (now > record.resetTime) return this.maxRequests;
    
    return Math.max(0, this.maxRequests - record.count);
  }
  
  getResetTime(identifier: string = 'default'): number {
    const record = this.requestCounts.get(identifier);
    if (!record) return Date.now() + this.windowMs;
    return record.resetTime;
  }
}
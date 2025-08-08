import { Context, Next } from 'hono';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private records: Map<string, RateLimitRecord> = new Map();
  
  constructor(
    private maxRequests: number = 30,
    private windowMs: number = 60000 // 1 minute
  ) {}
  
  private getIdentifier(c: Context): string {
    // Use IP address as identifier
    const ip = c.req.header('x-forwarded-for') || 
                c.req.header('x-real-ip') || 
                'unknown';
    return ip;
  }
  
  private cleanupExpired(): void {
    const now = Date.now();
    for (const [key, record] of this.records.entries()) {
      if (now > record.resetTime) {
        this.records.delete(key);
      }
    }
  }
  
  middleware() {
    return async (c: Context, next: Next) => {
      const identifier = this.getIdentifier(c);
      const now = Date.now();
      
      // Cleanup expired records periodically
      if (Math.random() < 0.1) { // 10% chance to cleanup
        this.cleanupExpired();
      }
      
      let record = this.records.get(identifier);
      
      if (!record || now > record.resetTime) {
        // Create new record
        record = {
          count: 1,
          resetTime: now + this.windowMs
        };
        this.records.set(identifier, record);
      } else {
        record.count++;
        
        if (record.count > this.maxRequests) {
          // Rate limit exceeded
          const retryAfter = Math.ceil((record.resetTime - now) / 1000);
          
          return c.json({
            status: 'error',
            error: 'Rate limit exceeded. Please try again later.',
            retryAfter: retryAfter
          }, 429, {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': this.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(record.resetTime).toISOString()
          });
        }
      }
      
      // Add rate limit headers
      c.header('X-RateLimit-Limit', this.maxRequests.toString());
      c.header('X-RateLimit-Remaining', (this.maxRequests - record.count).toString());
      c.header('X-RateLimit-Reset', new Date(record.resetTime).toISOString());
      
      await next();
    };
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter(30, 60000); // 30 requests per minute
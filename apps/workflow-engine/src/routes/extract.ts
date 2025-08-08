import { Hono } from 'hono';
import { z } from 'zod';
import { HKTableExtractService } from '../services/hk-table-extract.js';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';

const extractRoute = new Hono();

// Request schema validation for HK extract
const hkExtractRequestSchema = z.object({
  date: z.string()
    .min(8, 'Date must be at least 8 characters (YYYYMMDD)')
    .max(8, 'Date must be exactly 8 characters (YYYYMMDD)')
    .regex(/^\d{8}$/, 'Date must be in YYYYMMDD format'),
  filename: z.string().optional(),
  headless: z.boolean().optional().default(true)
});

/**
 * POST /hk-extract
 * Scrape Hong Kong passenger statistics and stream Excel file directly
 */
extractRoute.post('/hk-extract', async (c) => {
  try {
    const body = await c.req.json();
    const { date, filename, headless } = hkExtractRequestSchema.parse(body);

    console.log(`📊 HK Extract request for date: ${date}`);

    // Create service instance with options
    const extractService = new HKTableExtractService({
      headless: headless ?? true,
      outputDir: '../client/magk-excel/public/downloads', // Save to client downloads folder
      timeout: 30000
    });

    console.log('🚀 Starting extraction process...');
    const startTime = Date.now();
    const filePath = await extractService.scrapeAndExport(date, filename);
    const endTime = Date.now();

    console.log(`✅ Extraction completed in ${(endTime - startTime) / 1000}s`);

    // Get file stats for headers
    const fileStats = await stat(filePath);
    const finalFilename = filename || `passenger_stats_${date}.xlsx`;

    // Set headers for Excel file download
    c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    c.header('Content-Disposition', `attachment; filename="${finalFilename}"`);
    c.header('Content-Length', fileStats.size.toString());
    c.header('X-Processing-Time', `${(endTime - startTime) / 1000}s`);
    c.header('X-File-Size', fileStats.size.toString());

    console.log(`📥 Streaming file: ${finalFilename} (${fileStats.size} bytes)`);

    // Stream the Excel file directly to the client
    const stream = createReadStream(filePath);
    return c.body(stream as any); // Type assertion for Hono compatibility

  } catch (error) {
    console.error('❌ HK Extract error:', error);
    
    if (error instanceof z.ZodError) {
      return c.json({
        status: 'error',
        message: 'Invalid request format',
        error: error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
      }, 400);
    }

    return c.json({
      status: 'error',
      message: 'Failed to extract Hong Kong passenger statistics',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, 500);
  }
});

/**
 * GET /hk-extract/status
 * Health check for HK extraction service
 */
extractRoute.get('/hk-extract/status', (c) => {
  return c.json({
    status: 'healthy',
    service: 'hk-extract',
    description: 'Hong Kong passenger statistics extractor',
    endpoints: {
      'POST /hk-extract': 'Extract and download Excel file with JSON body: { "date": "YYYYMMDD", "filename"?: "optional.xlsx", "headless"?: true }'
    },
    example: {
      url: 'POST /hk-extract',
      body: {
        date: '20250118',
        filename: 'my_stats.xlsx',
        headless: true
      }
    }
  });
});

export { extractRoute };
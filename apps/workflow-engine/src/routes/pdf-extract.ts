import { Hono } from 'hono';
import { z } from 'zod';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { LargePDFExtractor } from '../services/pdf/pdfExtractor.js';

const pdfExtractRoute = new Hono();

// Request schema validation for PDF extraction
const pdfExtractRequestSchema = z.object({
  chunkSize: z.number().min(1).max(100).optional().default(25),
  fileName: z.string().optional()
});

/**
 * POST /pdf-extract
 * Extract text and tables from uploaded PDF file
 */
pdfExtractRoute.post('/pdf-extract', async (c) => {
  let tempFilePath: string | null = null;
  
  try {
    console.log('📄 PDF extraction request received');

    // Check if request is multipart/form-data (file upload)
    const contentType = c.req.header('content-type') || '';
    
    if (!contentType.includes('multipart/form-data')) {
      return c.json({ error: 'PDF file upload required' }, 400);
    }

    const formData = await c.req.formData();
    
    // Extract configuration
    let config: any = {};
    try {
      const configStr = formData.get('config') as string;
      if (configStr) {
        config = JSON.parse(configStr);
      }
    } catch (error) {
      console.warn('⚠️ Invalid config JSON, using defaults');
      config = {};
    }
    
    const { chunkSize, fileName } = pdfExtractRequestSchema.parse(config);
    
    // Get the uploaded PDF file
    const file = formData.get('file') as File;
    
    if (!file) {
      return c.json({ error: 'No PDF file provided' }, 400);
    }

    // Validate file type
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      return c.json({ error: 'Only PDF files are supported' }, 400);
    }

    console.log(`📄 Processing PDF: ${file.name} (${file.size} bytes)`);
    
    // Save uploaded file to temp directory
    const tempFileName = `pdf_extract_${Date.now()}_${file.name}`;
    tempFilePath = join(tmpdir(), tempFileName);
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(tempFilePath, buffer);
    
    console.log(`💾 Saved PDF to temp file: ${tempFilePath}`);

    // Create PDF extractor instance
    const extractor = new LargePDFExtractor(chunkSize);
    
    // Extract PDF content
    console.log('🚀 Starting PDF extraction...');
    const startTime = Date.now();
    const result = await extractor.extractLargePDF(tempFilePath);
    const endTime = Date.now();
    
    console.log(`✅ PDF extraction completed in ${(endTime - startTime) / 1000}s`);
    console.log(`📊 Found ${result.tables.length} tables (${result.tables.filter(t => t.tableType === 'financial').length} financial)`);

    // Clean up temp file
    if (tempFilePath) {
      await unlink(tempFilePath);
      console.log('🗑️ Cleaned up temp file');
    }

    // Return extraction results
    return c.json({
      success: true,
      result: {
        fileName: result.fileName,
        totalPages: result.totalPages,
        processedPages: result.processedPages,
        extractionTime: result.extractionTime,
        text: result.text,
        tables: result.tables,
        metadata: result.metadata
      },
      processingTime: (endTime - startTime) / 1000
    });

  } catch (error) {
    console.error('❌ PDF extraction failed:', error);
    
    // Clean up temp file on error
    if (tempFilePath) {
      try {
        await unlink(tempFilePath);
        console.log('🗑️ Cleaned up temp file after error');
      } catch (cleanupError) {
        console.warn('⚠️ Failed to cleanup temp file:', cleanupError);
      }
    }
    
    return c.json({ 
      error: 'PDF extraction failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * GET /pdf-extract/health
 * Health check for PDF extraction service
 */
pdfExtractRoute.get('/pdf-extract/health', (c) => {
  return c.json({ 
    status: 'healthy', 
    service: 'pdf-extraction',
    supportedFormats: ['pdf'],
    maxFileSize: '50MB',
    defaultChunkSize: 25
  });
});

export { pdfExtractRoute };

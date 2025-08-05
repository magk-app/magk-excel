import { Hono } from 'hono';
import { z } from 'zod';
import { HKTableExtractService } from '../services/hk-table-extract.js';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';

const demoRoute = new Hono();

/**
 * GET /demo
 * Demo landing page with available demonstrations
 */
demoRoute.get('/demo', (c) => {
  const baseUrl = c.req.url.replace('/demo', '');
  
  return c.json({
    status: 'success',
    title: 'MAGK Excel - Data Extraction Demos',
    description: 'Interactive demonstrations of data extraction capabilities',
    demos: {
      'hk-passenger-stats': {
        title: 'Hong Kong Passenger Statistics Extraction',
        description: 'Extract passenger statistics from Hong Kong Immigration Department website into Excel',
        endpoint: `GET ${baseUrl}/demo/hk-passenger-stats`,
        testEndpoint: `POST ${baseUrl}/demo/hk-passenger-stats/extract`,
        example: {
          date: '20250118',
          filename: 'passenger_stats.xlsx'
        }
      },
      'pdf-table-extraction': {
        title: 'PDF Table Extraction (Google 10-Q Example)',
        description: 'Extract specific tables from PDF documents using AI',
        endpoint: `GET ${baseUrl}/demo/pdf-extraction`,
        testEndpoint: `POST ${baseUrl}/demo/pdf-extraction/extract`,
        example: {
          pdf_source: 'https://abc.xyz/assets/51/e1/bf43f01041f6a8882a29d7e89cae/goog-10-q-q1-2025.pdf',
          prompt: 'Consolidated balance sheets'
        }
      }
    },
    quickStart: [
      '1. Choose a demo from the list above',
      '2. Visit the demo endpoint to see the interface',
      '3. Use the test endpoint to try the extraction',
      '4. Download the generated Excel file or view JSON results'
    ]
  });
});

/**
 * GET /demo/hk-passenger-stats
 * Demo page for HK passenger statistics extraction
 */
demoRoute.get('/demo/hk-passenger-stats', (c) => {
  const baseUrl = c.req.url.replace('/demo/hk-passenger-stats', '');
  
  return c.json({
    demo: 'Hong Kong Passenger Statistics Extraction',
    description: 'This demo extracts passenger arrival/departure statistics from the Hong Kong Immigration Department website and converts them into a properly formatted Excel file.',
    howItWorks: [
      '1. Navigates to the IMMD passenger statistics page for the specified date',
      '2. Locates and extracts the passenger statistics table',
      '3. Processes the table structure to handle complex headers',
      '4. Generates a clean Excel file with formatted data',
      '5. Returns the Excel file for download'
    ],
    dataSource: 'https://www.immd.gov.hk/eng/facts/passenger-statistics.html',
    sampleData: {
      headers: ['Control Point', 'Hong Kong Residents Arrival', 'Mainland Visitors Arrival', 'Other Visitors Arrival', 'Total Arrival'],
      sampleRows: [
        ['Airport', '15,234', '8,976', '12,567', '36,777'],
        ['Lo Wu', '45,123', '23,456', '1,234', '69,813'],
        ['Lok Ma Chau', '12,345', '34,567', '2,345', '49,257']
      ]
    },
    usage: {
      endpoint: `POST ${baseUrl}/demo/hk-passenger-stats/extract`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        date: 'YYYYMMDD (e.g., 20250118)',
        filename: 'optional_filename.xlsx',
        headless: true
      },
      response: 'Excel file download with processed passenger statistics'
    },
    testCurl: `curl -X POST "${baseUrl}/demo/hk-passenger-stats/extract" \\
  -H "Content-Type: application/json" \\
  -d '{"date":"20250118","filename":"test_stats.xlsx"}' \\
  --output passenger_stats.xlsx`
  });
});

/**
 * POST /demo/hk-passenger-stats/extract
 * Execute HK passenger statistics extraction
 */
demoRoute.post('/demo/hk-passenger-stats/extract', async (c) => {
  const requestSchema = z.object({
    date: z.string()
      .min(8, 'Date must be at least 8 characters (YYYYMMDD)')
      .max(8, 'Date must be exactly 8 characters (YYYYMMDD)')
      .regex(/^\d{8}$/, 'Date must be in YYYYMMDD format'),
    filename: z.string().optional(),
    headless: z.boolean().optional().default(true)
  });

  try {
    const body = await c.req.json();
    const { date, filename, headless } = requestSchema.parse(body);

    console.log(`🎯 DEMO: HK Extract request for date: ${date}`);

    const extractService = new HKTableExtractService({
      headless: headless ?? true,
      outputDir: './demo-output',
      timeout: 30000
    });

    console.log('🚀 DEMO: Starting extraction process...');
    const startTime = Date.now();
    const filePath = await extractService.scrapeAndExport(date, filename);
    const endTime = Date.now();
    const processingTime = (endTime - startTime) / 1000;

    console.log(`✅ DEMO: Extraction completed in ${processingTime}s`);

    // Get file stats
    const fileStats = await stat(filePath);
    const finalFilename = filename || `passenger_stats_${date}.xlsx`;

    // Set headers for Excel file download
    c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    c.header('Content-Disposition', `attachment; filename="${finalFilename}"`);
    c.header('Content-Length', fileStats.size.toString());
    c.header('X-Processing-Time', `${processingTime}s`);
    c.header('X-Demo', 'hk-passenger-stats');
    c.header('X-Source-URL', `https://www.immd.gov.hk/eng/facts/passenger-statistics.html?d=${date}`);

    console.log(`📥 DEMO: Streaming file: ${finalFilename} (${fileStats.size} bytes)`);

    // Stream the Excel file
    const stream = createReadStream(filePath);
    return c.body(stream as any);

  } catch (error) {
    console.error('❌ DEMO: HK Extract error:', error);
    
    if (error instanceof z.ZodError) {
      return c.json({
        status: 'error',
        demo: 'hk-passenger-stats',
        message: 'Invalid request format',
        error: error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', '),
        expectedFormat: {
          date: 'YYYYMMDD (e.g., 20250118)',
          filename: 'optional_filename.xlsx (optional)',
          headless: 'true/false (optional, default: true)'
        }
      }, 400);
    }

    return c.json({
      status: 'error',
      demo: 'hk-passenger-stats',
      message: 'Failed to extract Hong Kong passenger statistics',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      troubleshooting: [
        'Ensure the date is in YYYYMMDD format',
        'Check that the date corresponds to a valid statistics page',
        'Verify network connectivity to immd.gov.hk'
      ]
    }, 500);
  }
});

/**
 * GET /demo/pdf-extraction
 * Demo page for PDF table extraction
 */
demoRoute.get('/demo/pdf-extraction', (c) => {
  const baseUrl = c.req.url.replace('/demo/pdf-extraction', '');
  
  return c.json({
    demo: 'PDF Table Extraction',
    description: 'This demo uses AI to extract specific tables and data from PDF documents, showcasing the consolidated balance sheets extraction from Google\'s 10-Q filing.',
    howItWorks: [
      '1. Sends PDF URL and extraction prompt to Modal API',
      '2. AI analyzes the PDF content to locate relevant tables',
      '3. Extracts the requested data using intelligent parsing',
      '4. Returns structured JSON data for further processing',
      '5. Can be integrated with Excel generation for complete workflows'
    ],
    exampleDocument: 'Google 10-Q Q1 2025 Filing (Consolidated Balance Sheets)',
    apiEndpoints: {
      extractAll: 'https://jandhyala-karthik-r--magk-excel-api-extract-tables.modal.run',
      extractSpecific: 'https://jandhyala-karthik-r--magk-excel-api-extract-specific-table.modal.run'
    },
    samplePrompts: [
      'Consolidated balance sheets',
      'Revenue table',
      'Cash flow statement',
      'Assets and liabilities',
      'Financial summary'
    ],
    usage: {
      endpoint: `POST ${baseUrl}/demo/pdf-extraction/extract`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        pdf_source: 'URL to PDF document',
        prompt: 'Description of what to extract (optional for extract-all)',
        extract_all: 'boolean - true for all tables, false for specific extraction'
      },
      response: 'JSON with extracted table data'
    },
    testCurl: `curl -X POST "${baseUrl}/demo/pdf-extraction/extract" \\
  -H "Content-Type: application/json" \\
  -d '{
    "pdf_source": "https://abc.xyz/assets/51/e1/bf43f01041f6a8882a29d7e89cae/goog-10-q-q1-2025.pdf",
    "prompt": "Consolidated balance sheets",
    "extract_all": false
  }' | jq`
  });
});

/**
 * POST /demo/pdf-extraction/extract
 * Execute PDF table extraction
 */
demoRoute.post('/demo/pdf-extraction/extract', async (c) => {
  const requestSchema = z.object({
    pdf_source: z.string().url('Must be a valid PDF URL'),
    prompt: z.string().optional(),
    extract_all: z.boolean().optional().default(false)
  });

  try {
    const body = await c.req.json();
    const { pdf_source, prompt, extract_all } = requestSchema.parse(body);

    console.log(`🎯 DEMO: PDF extraction request for: ${pdf_source}`);
    console.log(`🎯 DEMO: Extract all: ${extract_all}, Prompt: ${prompt || 'none'}`);

    const startTime = Date.now();
    let result;
    let apiEndpoint;

    if (extract_all) {
      // Extract all tables
      apiEndpoint = 'https://jandhyala-karthik-r--magk-excel-api-extract-tables.modal.run';
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pdf_source })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} - ${response.statusText}`);
      }

      result = await response.json();
    } else {
      // Extract specific table
      if (!prompt) {
        return c.json({
          status: 'error',
          demo: 'pdf-extraction',
          message: 'Prompt is required for specific extraction',
          suggestion: 'Either set extract_all to true or provide a prompt describing what to extract'
        }, 400);
      }

      apiEndpoint = 'https://jandhyala-karthik-r--magk-excel-api-extract-specific-table.modal.run';
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pdf_source, prompt })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} - ${response.statusText}`);
      }

      result = await response.json();
    }

    const endTime = Date.now();
    const processingTime = (endTime - startTime) / 1000;

    console.log(`✅ DEMO: PDF extraction completed in ${processingTime}s`);

    // Add demo metadata to response
    c.header('X-Processing-Time', `${processingTime}s`);
    c.header('X-Demo', 'pdf-extraction');
    c.header('X-API-Endpoint', apiEndpoint);

    return c.json({
      status: 'success',
      demo: 'pdf-extraction',
      processingTime: `${processingTime}s`,
      metadata: {
        pdf_source,
        prompt: prompt || null,
        extract_all,
        apiEndpoint
      },
      data: result,
      nextSteps: [
        'Use this JSON data to populate Excel templates',
        'Integrate with workflow automation',
        'Apply data transformation rules',
        'Generate formatted reports'
      ]
    });

  } catch (error) {
    console.error('❌ DEMO: PDF extraction error:', error);
    
    if (error instanceof z.ZodError) {
      return c.json({
        status: 'error',
        demo: 'pdf-extraction',
        message: 'Invalid request format',
        error: error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', '),
        expectedFormat: {
          pdf_source: 'Valid PDF URL',
          prompt: 'Description of what to extract (optional)',
          extract_all: 'true/false (optional, default: false)'
        }
      }, 400);
    }

    return c.json({
      status: 'error',
      demo: 'pdf-extraction',
      message: 'Failed to extract data from PDF',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      troubleshooting: [
        'Verify the PDF URL is accessible',
        'Check that the PDF contains extractable tables',
        'Ensure the prompt describes the desired data clearly',
        'Try setting extract_all to true to see all available data'
      ]
    }, 500);
  }
});

/**
 * GET /demo/health
 * Health check for all demo services
 */
demoRoute.get('/demo/health', async (c) => {
  const results = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      'hk-extraction': {
        status: 'healthy',
        description: 'Hong Kong passenger statistics extraction service'
      },
      'pdf-extraction-api': {
        status: 'checking',
        description: 'PDF table extraction API endpoints'
      }
    }
  };

  // Test PDF extraction API health
  try {
    const healthResponse = await fetch('https://jandhyala-karthik-r--magk-excel-api-health.modal.run', {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    results.services['pdf-extraction-api'].status = healthResponse.ok ? 'healthy' : 'unhealthy';
    (results.services['pdf-extraction-api'] as any).statusCode = healthResponse.status;
  } catch (error) {
    results.services['pdf-extraction-api'].status = 'error';
    (results.services['pdf-extraction-api'] as any).error = error instanceof Error ? error.message : 'Unknown error';
  }

  const allHealthy = Object.values(results.services).every(service => service.status === 'healthy');
  results.status = allHealthy ? 'healthy' : 'partial';

  return c.json(results, allHealthy ? 200 : 206);
});

export { demoRoute };
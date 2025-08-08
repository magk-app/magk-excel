/**
 * Workflow Templates - Pre-built workflows for common tasks
 */

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'web-scraping' | 'pdf' | 'api' | 'cloud' | 'test' | 'data';
  icon: string;
  nodes: any[];
  edges: any[];
  tags: string[];
  estimatedTime: string;
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  // Web Crawling Template
  {
    id: 'web-crawling-template',
    name: 'Web Crawling & Data Extraction',
    description: 'Crawl websites, extract structured data, and export to Excel',
    category: 'web-scraping',
    icon: '🌐',
    tags: ['web', 'scraping', 'extraction', 'excel'],
    estimatedTime: '2-5 min',
    nodes: [
      {
        id: 'crawl-1',
        type: 'web-scraping',
        position: { x: 100, y: 100 },
        data: {
          type: 'web-scraping',
          config: {
            id: 'crawl-config-1',
            name: 'Web Crawler',
            description: 'Crawl website and extract links',
            url: 'https://example.com',
            selector: 'a[href]',
            maxPages: 10,
            followLinks: true
          },
          status: 'pending'
        }
      },
      {
        id: 'extract-1',
        type: 'data-transform',
        position: { x: 350, y: 100 },
        data: {
          type: 'data-transform',
          config: {
            id: 'extract-config-1',
            name: 'Extract Data',
            description: 'Extract structured data from pages',
            transformations: ['extract_text', 'extract_tables', 'extract_metadata'],
            filters: ['remove_duplicates', 'clean_data']
          },
          status: 'pending'
        }
      },
      {
        id: 'export-1',
        type: 'excel-export',
        position: { x: 600, y: 100 },
        data: {
          type: 'excel-export',
          config: {
            id: 'export-config-1',
            name: 'Export to Excel',
            description: 'Save extracted data to Excel file',
            format: 'xlsx',
            includeHeaders: true,
            autoFormat: true,
            fileName: 'web_crawl_data.xlsx'
          },
          status: 'pending'
        }
      }
    ],
    edges: [
      {
        id: 'e1-2',
        source: 'crawl-1',
        target: 'extract-1',
        type: 'smoothstep',
        animated: true
      },
      {
        id: 'e2-3',
        source: 'extract-1',
        target: 'export-1',
        type: 'smoothstep',
        animated: true
      }
    ]
  },

  // PDF Processing Template
  {
    id: 'pdf-processing-template',
    name: 'PDF Table Extraction',
    description: 'Extract tables and data from PDF documents and convert to Excel',
    category: 'pdf',
    icon: '📄',
    tags: ['pdf', 'tables', 'extraction', 'excel'],
    estimatedTime: '1-3 min',
    nodes: [
      {
        id: 'pdf-1',
        type: 'pdf-extract',
        position: { x: 100, y: 100 },
        data: {
          type: 'pdf-extract',
          config: {
            id: 'pdf-config-1',
            name: 'PDF Reader',
            description: 'Read and parse PDF document',
            source: 'upload',
            extractTables: true,
            extractText: true,
            extractImages: false,
            pageRange: 'all'
          },
          status: 'pending'
        }
      },
      {
        id: 'process-1',
        type: 'data-transform',
        position: { x: 350, y: 100 },
        data: {
          type: 'data-transform',
          config: {
            id: 'process-config-1',
            name: 'Process Tables',
            description: 'Clean and structure table data',
            transformations: ['normalize_headers', 'merge_cells', 'clean_values'],
            filters: ['remove_empty_rows', 'validate_data']
          },
          status: 'pending'
        }
      },
      {
        id: 'excel-1',
        type: 'excel-export',
        position: { x: 600, y: 100 },
        data: {
          type: 'excel-export',
          config: {
            id: 'excel-config-1',
            name: 'Excel Export',
            description: 'Create Excel file with extracted tables',
            format: 'xlsx',
            createSheets: true,
            preserveFormatting: true,
            fileName: 'pdf_tables.xlsx'
          },
          status: 'pending'
        }
      }
    ],
    edges: [
      {
        id: 'pdf-e1-2',
        source: 'pdf-1',
        target: 'process-1',
        type: 'smoothstep',
        animated: true
      },
      {
        id: 'pdf-e2-3',
        source: 'process-1',
        target: 'excel-1',
        type: 'smoothstep',
        animated: true
      }
    ]
  },

  // Web Scraping Template
  {
    id: 'web-scraping-template',
    name: 'Single Page Data Scraping',
    description: 'Extract specific data from a single webpage',
    category: 'web-scraping',
    icon: '🔍',
    tags: ['scraping', 'single-page', 'data', 'excel'],
    estimatedTime: '1-2 min',
    nodes: [
      {
        id: 'scrape-1',
        type: 'web-scraping',
        position: { x: 100, y: 100 },
        data: {
          type: 'web-scraping',
          config: {
            id: 'scrape-config-1',
            name: 'Web Scraper',
            description: 'Extract data from webpage',
            url: 'https://example.com/data',
            selectors: {
              title: 'h1',
              price: '.price',
              description: '.description',
              table: 'table.data-table'
            },
            waitForSelector: 'table'
          },
          status: 'pending'
        }
      },
      {
        id: 'transform-1',
        type: 'data-transform',
        position: { x: 350, y: 100 },
        data: {
          type: 'data-transform',
          config: {
            id: 'transform-config-1',
            name: 'Transform Data',
            description: 'Structure scraped data',
            transformations: ['parse_numbers', 'clean_text', 'format_dates'],
            outputFormat: 'table'
          },
          status: 'pending'
        }
      },
      {
        id: 'save-1',
        type: 'excel-export',
        position: { x: 600, y: 100 },
        data: {
          type: 'excel-export',
          config: {
            id: 'save-config-1',
            name: 'Save to Excel',
            description: 'Export scraped data',
            format: 'xlsx',
            fileName: 'scraped_data.xlsx'
          },
          status: 'pending'
        }
      }
    ],
    edges: [
      {
        id: 'scrape-e1-2',
        source: 'scrape-1',
        target: 'transform-1',
        type: 'smoothstep',
        animated: true
      },
      {
        id: 'scrape-e2-3',
        source: 'transform-1',
        target: 'save-1',
        type: 'smoothstep',
        animated: true
      }
    ]
  },

  // Cloud API Template
  {
    id: 'cloud-api-template',
    name: 'Cloud API Integration',
    description: 'Fetch data from cloud APIs and process it',
    category: 'cloud',
    icon: '☁️',
    tags: ['api', 'cloud', 'integration', 'rest'],
    estimatedTime: '2-4 min',
    nodes: [
      {
        id: 'auth-1',
        type: 'api-call',
        position: { x: 100, y: 100 },
        data: {
          type: 'api-call',
          config: {
            id: 'auth-config-1',
            name: 'API Authentication',
            description: 'Authenticate with API',
            method: 'POST',
            url: 'https://api.example.com/auth',
            headers: {
              'Content-Type': 'application/json'
            },
            body: {
              apiKey: '${API_KEY}'
            }
          },
          status: 'pending'
        }
      },
      {
        id: 'fetch-1',
        type: 'api-call',
        position: { x: 350, y: 100 },
        data: {
          type: 'api-call',
          config: {
            id: 'fetch-config-1',
            name: 'Fetch Data',
            description: 'Get data from API endpoint',
            method: 'GET',
            url: 'https://api.example.com/data',
            headers: {
              'Authorization': 'Bearer ${token}'
            },
            pagination: true,
            maxPages: 10
          },
          status: 'pending'
        }
      },
      {
        id: 'process-api-1',
        type: 'data-transform',
        position: { x: 600, y: 100 },
        data: {
          type: 'data-transform',
          config: {
            id: 'process-api-config-1',
            name: 'Process API Data',
            description: 'Transform API response',
            transformations: ['flatten_json', 'extract_fields', 'aggregate_data'],
            outputFormat: 'table'
          },
          status: 'pending'
        }
      },
      {
        id: 'store-1',
        type: 'excel-export',
        position: { x: 850, y: 100 },
        data: {
          type: 'excel-export',
          config: {
            id: 'store-config-1',
            name: 'Store Results',
            description: 'Save API data to Excel',
            format: 'xlsx',
            fileName: 'api_data.xlsx',
            appendMode: false
          },
          status: 'pending'
        }
      }
    ],
    edges: [
      {
        id: 'api-e1-2',
        source: 'auth-1',
        target: 'fetch-1',
        type: 'smoothstep',
        animated: true,
        label: 'Token'
      },
      {
        id: 'api-e2-3',
        source: 'fetch-1',
        target: 'process-api-1',
        type: 'smoothstep',
        animated: true
      },
      {
        id: 'api-e3-4',
        source: 'process-api-1',
        target: 'store-1',
        type: 'smoothstep',
        animated: true
      }
    ]
  },

  // Test Case Workflow Template
  {
    id: 'test-case-template',
    name: 'Automated Test Workflow',
    description: 'Run test cases and generate reports',
    category: 'test',
    icon: '🧪',
    tags: ['testing', 'automation', 'validation', 'reports'],
    estimatedTime: '3-5 min',
    nodes: [
      {
        id: 'setup-1',
        type: 'api-call',
        position: { x: 100, y: 100 },
        data: {
          type: 'api-call',
          config: {
            id: 'setup-config-1',
            name: 'Test Setup',
            description: 'Initialize test environment',
            method: 'POST',
            url: 'https://b1fcb47dfd4d.ngrok-free.app/test/setup',
            body: {
              environment: 'test',
              config: {}
            }
          },
          status: 'pending'
        }
      },
      {
        id: 'test-web-1',
        type: 'web-scraping',
        position: { x: 350, y: 50 },
        data: {
          type: 'web-scraping',
          config: {
            id: 'test-web-config-1',
            name: 'Test Web Scraping',
            description: 'Validate web scraping functionality',
            url: 'https://example.com/test',
            selector: 'body',
            expectedContent: 'Test Page'
          },
          status: 'pending'
        }
      },
      {
        id: 'test-pdf-1',
        type: 'pdf-extract',
        position: { x: 350, y: 150 },
        data: {
          type: 'pdf-extract',
          config: {
            id: 'test-pdf-config-1',
            name: 'Test PDF Extraction',
            description: 'Validate PDF processing',
            source: 'test-file.pdf',
            validateOutput: true
          },
          status: 'pending'
        }
      },
      {
        id: 'test-api-1',
        type: 'api-call',
        position: { x: 350, y: 250 },
        data: {
          type: 'api-call',
          config: {
            id: 'test-api-config-1',
            name: 'Test API Calls',
            description: 'Validate API functionality',
            method: 'GET',
            url: 'https://b1fcb47dfd4d.ngrok-free.app/test/api',
            expectedStatus: 200
          },
          status: 'pending'
        }
      },
      {
        id: 'collect-1',
        type: 'data-transform',
        position: { x: 600, y: 150 },
        data: {
          type: 'data-transform',
          config: {
            id: 'collect-config-1',
            name: 'Collect Results',
            description: 'Aggregate test results',
            transformations: ['collect_results', 'calculate_metrics', 'generate_summary']
          },
          status: 'pending'
        }
      },
      {
        id: 'report-1',
        type: 'excel-export',
        position: { x: 850, y: 150 },
        data: {
          type: 'excel-export',
          config: {
            id: 'report-config-1',
            name: 'Test Report',
            description: 'Generate test report in Excel',
            format: 'xlsx',
            fileName: 'test_report.xlsx',
            sheets: ['Summary', 'Details', 'Metrics'],
            includeCharts: true
          },
          status: 'pending'
        }
      }
    ],
    edges: [
      {
        id: 'test-e1-2',
        source: 'setup-1',
        target: 'test-web-1',
        type: 'smoothstep',
        animated: true
      },
      {
        id: 'test-e1-3',
        source: 'setup-1',
        target: 'test-pdf-1',
        type: 'smoothstep',
        animated: true
      },
      {
        id: 'test-e1-4',
        source: 'setup-1',
        target: 'test-api-1',
        type: 'smoothstep',
        animated: true
      },
      {
        id: 'test-e2-5',
        source: 'test-web-1',
        target: 'collect-1',
        type: 'smoothstep',
        animated: true
      },
      {
        id: 'test-e3-5',
        source: 'test-pdf-1',
        target: 'collect-1',
        type: 'smoothstep',
        animated: true
      },
      {
        id: 'test-e4-5',
        source: 'test-api-1',
        target: 'collect-1',
        type: 'smoothstep',
        animated: true
      },
      {
        id: 'test-e5-6',
        source: 'collect-1',
        target: 'report-1',
        type: 'smoothstep',
        animated: true
      }
    ]
  }
];

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): WorkflowTemplate[] {
  return WORKFLOW_TEMPLATES.filter(t => t.category === category);
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): WorkflowTemplate | undefined {
  return WORKFLOW_TEMPLATES.find(t => t.id === id);
}

/**
 * Search templates by keyword
 */
export function searchTemplates(keyword: string): WorkflowTemplate[] {
  const lowerKeyword = keyword.toLowerCase();
  return WORKFLOW_TEMPLATES.filter(t => 
    t.name.toLowerCase().includes(lowerKeyword) ||
    t.description.toLowerCase().includes(lowerKeyword) ||
    t.tags.some(tag => tag.toLowerCase().includes(lowerKeyword))
  );
}

/**
 * Create workflow from template
 */
export function createWorkflowFromTemplate(template: WorkflowTemplate): any {
  const timestamp = Date.now();
  return {
    id: `workflow-${timestamp}`,
    name: `${template.name} (${new Date().toLocaleDateString()})`,
    description: template.description,
    nodes: template.nodes.map(node => ({
      ...node,
      id: `${node.id}-${timestamp}` // Make IDs unique
    })),
    edges: template.edges.map(edge => ({
      ...edge,
      id: `${edge.id}-${timestamp}`,
      source: `${edge.source}-${timestamp}`,
      target: `${edge.target}-${timestamp}`
    })),
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      generatedFrom: 'template',
      templateId: template.id
    }
  };
}
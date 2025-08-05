/**
 * Workflow Demo - Showcase Excel workflow nodes with sample data
 * Demonstrates real-time status updates and progress indicators
 */

import React, { useState } from 'react';
import WorkflowCanvas from './WorkflowCanvas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  WorkflowNode, 
  WorkflowEdge, 
  NodeStatus,
  NodeProgress,
  WebScrapingConfig,
  ExcelExportConfig,
  TransformConfig
} from '@/types/workflow';

// Sample workflow nodes for demonstration
const createSampleNodes = (): WorkflowNode[] => [
  {
    id: 'web-scraping-1',
    type: 'web-scraping',
    position: { x: 150, y: 150 },
    data: {
      type: 'web-scraping',
      status: 'pending',
      config: {
        id: 'web-scraping-1',
        name: 'Extract Product Data',
        description: 'Scrape product listings from e-commerce site',
        url: 'https://example-store.com/products',
        extractFormat: 'table',
        useFirecrawl: true,
        selector: '.product-grid',
        timeout: 30
      } as WebScrapingConfig,
      metadata: {
        lastExecuted: new Date(Date.now() - 3600000) // 1 hour ago
      }
    }
  },
  {
    id: 'transform-1',
    type: 'transform',
    position: { x: 550, y: 150 },
    data: {
      type: 'transform',
      status: 'pending',
      config: {
        id: 'transform-1',
        name: 'Clean & Format Data',
        description: 'Remove duplicates, format prices, standardize names',
        operations: [
          { type: 'filter', field: 'price', expression: 'price > 0' },
          { type: 'map', field: 'name', newField: 'product_name', expression: 'trim(name)' },
          { type: 'sort', field: 'price' }
        ]
      } as TransformConfig
    }
  },
  {
    id: 'excel-export-1',
    type: 'excel-export',
    position: { x: 950, y: 150 },
    data: {
      type: 'excel-export',
      status: 'pending',
      config: {
        id: 'excel-export-1',
        name: 'Export to Excel',
        description: 'Create formatted Excel report with product data',
        outputPath: '/reports/product-analysis.xlsx',
        sheetName: 'Products',
        formatting: {
          headerStyle: { bold: true, backgroundColor: '#4472C4' },
          autoWidth: true,
          freeze: 'A2'
        }
      } as ExcelExportConfig
    }
  },
  // Additional nodes for variety
  {
    id: 'pdf-extraction-1',
    type: 'pdf-extraction',
    position: { x: 150, y: 450 },
    data: {
      type: 'pdf-extraction',
      status: 'completed',
      config: {
        id: 'pdf-extraction-1',
        name: 'Extract Financial Data',
        description: 'Extract tables from quarterly report PDF',
        filePath: '/documents/Q4-report.pdf',
        pages: [2, 3, 4],
        tableDetection: 'auto',
        extractFormat: 'table'
      },
      metadata: {
        executionTime: 2300,
        rowsProcessed: 156,
        lastExecuted: new Date(Date.now() - 1800000) // 30 minutes ago
      }
    }
  },
  {
    id: 'api-fetch-1',
    type: 'api-fetch',
    position: { x: 150, y: 750 },
    data: {
      type: 'api-fetch',
      status: 'error',
      config: {
        id: 'api-fetch-1',
        name: 'Fetch Market Data',
        description: 'Get latest stock prices from API',
        url: 'https://api.example.com/stocks',
        method: 'GET',
        responseFormat: 'json'
      },
      error: {
        message: 'API rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED'
      }
    }
  }
];

// Sample edges connecting the nodes
const createSampleEdges = (): WorkflowEdge[] => [
  {
    id: 'web-scraping-1-transform-1',
    source: 'web-scraping-1',
    target: 'transform-1',
    type: 'smoothstep',
    data: {
      dataSchema: {
        columns: ['name', 'price', 'category', 'availability'],
        rowCount: 247
      }
    }
  },
  {
    id: 'transform-1-excel-export-1',
    source: 'transform-1',
    target: 'excel-export-1',
    type: 'smoothstep',
    data: {
      dataSchema: {
        columns: ['product_name', 'price', 'category'],
        rowCount: 189
      },
      sampleData: { hasData: true } // Indicates data is flowing through
    }
  }
];

// Simulate workflow execution
const simulateExecution = (
  _nodes: WorkflowNode[],
  setNodes: React.Dispatch<React.SetStateAction<WorkflowNode[]>>
) => {
  const updateNodeStatus = (nodeId: string, status: NodeStatus, progress?: NodeProgress, metadata?: Record<string, unknown>) => {
    setNodes(currentNodes => 
      currentNodes.map(node => 
        node.id === nodeId 
          ? { 
              ...node, 
              data: { 
                ...node.data, 
                status, 
                progress,
                metadata: { ...node.data.metadata, ...metadata }
              }
            }
          : node
      )
    );
  };

  // Start web scraping
  setTimeout(() => {
    updateNodeStatus('web-scraping-1', 'running', {
      current: 0,
      total: 100,
      message: 'Connecting to website...',
      startTime: new Date()
    });
  }, 1000);

  // Update progress
  setTimeout(() => {
    updateNodeStatus('web-scraping-1', 'running', {
      current: 35,
      total: 100,
      message: 'Extracting product data...',
      startTime: new Date(Date.now() - 2000)
    });
  }, 3000);

  // Complete web scraping
  setTimeout(() => {
    updateNodeStatus('web-scraping-1', 'completed', undefined, {
      executionTime: 4500,
      rowsProcessed: 247,
      lastExecuted: new Date()
    });
  }, 5000);

  // Start transformation
  setTimeout(() => {
    updateNodeStatus('transform-1', 'running', {
      current: 15,
      total: 247,
      message: 'Filtering data...',
      startTime: new Date()
    });
  }, 5500);

  // Update transformation progress
  setTimeout(() => {
    updateNodeStatus('transform-1', 'running', {
      current: 150,
      total: 247,
      message: 'Mapping fields...',
      startTime: new Date(Date.now() - 2000)
    });
  }, 7000);

  // Complete transformation
  setTimeout(() => {
    updateNodeStatus('transform-1', 'completed', undefined, {
      executionTime: 3200,
      rowsProcessed: 189,
      lastExecuted: new Date()
    });
  }, 8500);

  // Start Excel export
  setTimeout(() => {
    updateNodeStatus('excel-export-1', 'running', {
      current: 50,
      total: 189,
      message: 'Writing to Excel file...',
      startTime: new Date()
    });
  }, 9000);

  // Complete Excel export
  setTimeout(() => {
    updateNodeStatus('excel-export-1', 'completed', undefined, {
      executionTime: 1800,
      rowsProcessed: 189,
      lastExecuted: new Date()
    });
  }, 11000);
};

export const WorkflowDemo: React.FC = () => {
  const [nodes, setNodes] = useState<WorkflowNode[]>(createSampleNodes());
  const [edges] = useState<WorkflowEdge[]>(createSampleEdges());
  const [isRunning, setIsRunning] = useState(false);

  const handleRunWorkflow = () => {
    if (isRunning) return;
    
    setIsRunning(true);
    
    // Reset all nodes to pending
    setNodes(currentNodes =>
      currentNodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          status: 'pending',
          progress: undefined,
          error: undefined
        }
      }))
    );

    // Start simulation
    simulateExecution(nodes, setNodes);
    
    // Reset running state after completion
    setTimeout(() => setIsRunning(false), 12000);
  };

  const getWorkflowStatus = () => {
    const statuses = nodes.map(node => node.data.status);
    if (statuses.includes('running')) return 'running';
    if (statuses.includes('error')) return 'error';
    if (statuses.every(status => status === 'completed')) return 'completed';
    return 'ready';
  };

  const workflowStatus = getWorkflowStatus();

  return (
    <div className="h-full flex flex-col">
      {/* Demo Controls */}
      <Card className="m-4 mb-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Excel Workflow Demo</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Sample workflow showing web scraping → data transformation → Excel export
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge 
                variant={workflowStatus === 'completed' ? 'default' : 'secondary'}
                className="capitalize"
              >
                {workflowStatus}
              </Badge>
              <Button
                onClick={handleRunWorkflow}
                disabled={isRunning}
                size="sm"
              >
                {isRunning ? 'Running...' : 'Run Workflow'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Workflow Canvas */}
      <div className="flex-1 m-4 mt-2 border border-border rounded-lg overflow-hidden">
        <WorkflowCanvas
          nodes={nodes}
          edges={edges}
          onNodeClick={(_event, node) => {
            console.log('Node clicked:', node);
          }}
          onNodeDoubleClick={(_event, node) => {
            console.log('Node double-clicked:', node);
          }}
        />
      </div>

      {/* Legend */}
      <Card className="m-4 mt-0">
        <CardContent className="pt-3">
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-gray-400"></div>
              <span>Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-500"></div>
              <span>Running</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-500"></div>
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-500"></div>
              <span>Error</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-yellow-500"></div>
              <span>Paused</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkflowDemo;
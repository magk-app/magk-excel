/**
 * WorkflowCanvas Usage Example
 * Demonstrates how to use the enhanced WorkflowCanvas with all features
 */

import React, { useState, useCallback } from 'react';
import { OnNodesChange, OnEdgesChange, OnConnect, Node } from 'reactflow';
import { WorkflowCanvas } from './WorkflowCanvas';
import { WorkflowNode, WorkflowEdge, NodeStatus } from '@/types/workflow';
import { createWorkflowNode } from './NodeRegistry';

// Sample workflow data for demonstration
const createSampleWorkflow = (): { nodes: WorkflowNode[]; edges: WorkflowEdge[] } => {
  const nodes: WorkflowNode[] = [
    {
      ...createWorkflowNode('web-scraping', { x: 100, y: 100 }, {
        url: 'https://example.com/data',
        extractFormat: 'table',
        useFirecrawl: true,
        description: 'Extract product data from e-commerce site'
      }),
      data: {
        type: 'web-scraping',
        status: 'completed' as NodeStatus,
        config: {
          id: 'web-scraping-1',
          name: 'Product Data Scraper',
          description: 'Extract product data from e-commerce site',
          url: 'https://example.com/data',
          extractFormat: 'table' as const,
          useFirecrawl: true
        },
        result: {
          rowCount: 1250,
          columnCount: 8,
          data: {}
        },
        metadata: {
          executionTime: 3450,
          rowsProcessed: 1250,
          memoryUsage: 15728640,
          lastExecuted: new Date(Date.now() - 300000) // 5 minutes ago
        }
      }
    },
    {
      ...createWorkflowNode('filter', { x: 400, y: 100 }, {
        description: 'Filter products by price range and availability'
      }),
      data: {
        type: 'filter',
        status: 'running' as NodeStatus,
        config: {
          id: 'filter-1',
          name: 'Price Filter',
          description: 'Filter products by price range and availability',
          conditions: [
            { field: 'price', operator: 'greater_than' as const, value: 10 },
            { field: 'in_stock', operator: 'equals' as const, value: true }
          ],
          operator: 'AND' as const
        },
        progress: {
          current: 800,
          total: 1250,
          percentage: 64,
          message: 'Applying price and stock filters...',
          startTime: new Date(Date.now() - 30000),
          estimatedTimeRemaining: 15,
          throughputRate: 26.7,
          stages: [
            { name: 'Parse conditions', status: 'completed', progress: 100 },
            { name: 'Apply filters', status: 'running', progress: 64, message: 'Processing rows...' },
            { name: 'Validate results', status: 'pending' }
          ]
        }
      }
    },
    {
      ...createWorkflowNode('transform', { x: 700, y: 100 }, {
        description: 'Clean and normalize product data'
      }),
      data: {
        type: 'transform',
        status: 'pending' as NodeStatus,
        config: {
          id: 'transform-1',
          name: 'Data Cleaner',
          description: 'Clean and normalize product data',
          operations: [
            { type: 'map' as const, field: 'name', expression: 'trim(name)' },
            { type: 'calculate' as const, field: 'discount_percent', expression: '(original_price - sale_price) / original_price * 100' }
          ]
        }
      }
    },
    {
      ...createWorkflowNode('excel-export', { x: 1000, y: 100 }, {
        description: 'Export filtered data to Excel with formatting'
      }),
      data: {
        type: 'excel-export',
        status: 'pending' as NodeStatus,
        config: {
          id: 'excel-export-1',
          name: 'Product Export',
          description: 'Export filtered data to Excel with formatting',
          outputPath: '/Users/user/Documents/products.xlsx',
          sheetName: 'Filtered Products',
          formatting: {
            headerStyle: { bold: true, backgroundColor: '#4f46e5' },
            autoWidth: true,
            freeze: 'A1'
          }
        }
      }
    },
    {
      ...createWorkflowNode('validation', { x: 400, y: 300 }, {
        description: 'Validate data quality and completeness'
      }),
      data: {
        type: 'validation',
        status: 'error' as NodeStatus,
        config: {
          id: 'validation-1',
          name: 'Data Validator',
          description: 'Validate data quality and completeness',
          rules: [
            { field: 'price', type: 'required' as const, severity: 'error' as const },
            { field: 'name', type: 'required' as const, severity: 'error' as const }
          ],
          onError: 'stop' as const
        },
        error: {
          message: 'Validation failed: Missing required fields',
          code: 'DATA_VALIDATION_FAILED',
          timestamp: new Date(),
          recoverable: true,
          suggestions: [
            'Check that all required fields are present in the source data',
            'Review the data mapping configuration',
            'Consider adding data cleaning steps before validation'
          ],
          details: {
            missingFields: ['price', 'name'],
            affectedRows: 23,
            totalRows: 1250
          }
        }
      }
    }
  ];

  const edges: WorkflowEdge[] = [
    {
      id: 'edge-1',
      source: nodes[0].id,
      target: nodes[1].id,
      data: {
        dataSchema: { fields: ['name', 'price', 'in_stock', 'category'] },
        sampleData: { name: 'Product A', price: 29.99, in_stock: true }
      }
    },
    {
      id: 'edge-2',
      source: nodes[1].id,
      target: nodes[2].id,
      data: {
        dataSchema: { fields: ['name', 'price', 'category'] },
        sampleData: undefined // No data flowing yet
      }
    },
    {
      id: 'edge-3',
      source: nodes[2].id,
      target: nodes[3].id,
      data: {
        dataSchema: { fields: ['name', 'price', 'category', 'discount_percent'] },
        sampleData: undefined
      }
    },
    {
      id: 'edge-validation',
      source: nodes[0].id,
      target: nodes[4].id,
      data: {
        dataSchema: { fields: ['name', 'price', 'in_stock', 'category'] },
        sampleData: { name: 'Product A', price: 29.99, in_stock: true }
      }
    }
  ];

  return { nodes, edges };
};

export const WorkflowCanvasExample: React.FC = () => {
  const [workflowData, setWorkflowData] = useState(createSampleWorkflow());
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionStatus, setExecutionStatus] = useState<'idle' | 'running' | 'paused' | 'completed' | 'error'>('idle');

  // Handle node changes
  const handleNodesChange = useCallback<OnNodesChange>((changes) => {
    setWorkflowData(prev => ({
      ...prev,
      nodes: prev.nodes.map(node => {
        const change = changes.find(c => 'id' in c && c.id === node.id);
        if (change && change.type === 'position' && 'position' in change) {
          return { ...node, position: change.position || node.position };
        }
        return node;
      })
    }));
  }, []);

  // Handle edge changes
  const handleEdgesChange = useCallback<OnEdgesChange>((changes) => {
    setWorkflowData(prev => ({
      ...prev,
      edges: prev.edges.filter(edge => {
        const change = changes.find(c => 'id' in c && c.id === edge.id);
        return !(change && change.type === 'remove');
      })
    }));
  }, []);

  // Handle new connections
  const handleConnect = useCallback<OnConnect>((connection) => {
    const newEdge: WorkflowEdge = {
      id: `edge-${connection.source}-${connection.target}-${Date.now()}`,
      source: connection.source!,
      target: connection.target!,
      data: {
        dataSchema: {},
        sampleData: undefined
      }
    };

    setWorkflowData(prev => ({
      ...prev,
      edges: [...prev.edges, newEdge]
    }));
  }, []);

  // Workflow execution handlers
  const handleExecute = useCallback(() => {
    setIsExecuting(true);
    setExecutionStatus('running');

    // Simulate workflow execution
    console.log('Starting workflow execution...');
    
    // Update node statuses progressively
    setTimeout(() => {
      setWorkflowData(prev => ({
        ...prev,
        nodes: prev.nodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            status: node.data.status === 'pending' ? 'running' : node.data.status
          }
        }))
      }));
    }, 1000);

    // Complete after 10 seconds
    setTimeout(() => {
      setIsExecuting(false);
      setExecutionStatus('completed');
      setWorkflowData(prev => ({
        ...prev,
        nodes: prev.nodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            status: node.data.status !== 'error' ? 'completed' : 'error',
            progress: undefined
          }
        }))
      }));
    }, 10000);
  }, []);

  const handlePause = useCallback(() => {
    setIsExecuting(false);
    setExecutionStatus('paused');
    console.log('Workflow paused');
  }, []);

  const handleStop = useCallback(() => {
    setIsExecuting(false);
    setExecutionStatus('idle');
    setWorkflowData(prev => ({
      ...prev,
      nodes: prev.nodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          status: 'pending',
          progress: undefined
        }
      }))
    }));
    console.log('Workflow stopped and reset');
  }, []);

  const handleReset = useCallback(() => {
    setIsExecuting(false);
    setExecutionStatus('idle');
    setWorkflowData(createSampleWorkflow());
    console.log('Workflow reset to initial state');
  }, []);

  // Node interaction handlers
  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    console.log('Node clicked:', node.id, node.data);
  }, []);

  const handleNodeDoubleClick = useCallback((_event: React.MouseEvent, node: Node) => {
    console.log('Node double-clicked:', node.id, node.data);
    // Could open a configuration dialog here
  }, []);

  return (
    <div className="w-full h-screen">
      <WorkflowCanvas
        nodes={workflowData.nodes}
        edges={workflowData.edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        onWorkflowExecute={handleExecute}
        onWorkflowPause={handlePause}
        onWorkflowStop={handleStop}
        onWorkflowReset={handleReset}
        isExecuting={isExecuting}
        executionStatus={executionStatus}
        showGrid={true}
        showMiniMap={true}
        showStatusPanel={true}
        isReadOnly={false}
        className="border border-gray-200 rounded-lg shadow-lg"
      />
    </div>
  );
};

export default WorkflowCanvasExample;
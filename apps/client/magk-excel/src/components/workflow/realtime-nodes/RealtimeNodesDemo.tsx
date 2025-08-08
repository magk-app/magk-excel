/**
 * Real-time Specialized Nodes Demonstration
 * 
 * This component demonstrates the specialized real-time node components
 * in action, showing their enhanced features and real-time capabilities.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  Square, 
  RefreshCw,
  Globe,
  FileSpreadsheet,
  Cog,
  Send,
  Activity
} from 'lucide-react';

import { 
  WebScrapingRealtimeNode,
  ExcelExportRealtimeNode,
  TransformRealtimeNode,
  ApiRealtimeNode,
  getRealtimeNodeComponent,
  hasSpecializedRealtimeComponent
} from './index';

import { 
  WorkflowNodeData, 
  WebScrapingConfig,
  ExcelExportConfig,
  TransformConfig,
  ApiFetchConfig,
  NODE_THEMES
} from '@/types/workflow';

interface DemoNodeState {
  id: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: {
    current: number;
    total: number;
    percentage: number;
    message?: string;
  };
  metadata?: Record<string, unknown>;
}

// Sample node configurations for demonstration
const DEMO_NODES: WorkflowNodeData[] = [
  {
    type: 'web-scraping',
    config: {
      id: 'scrape-1',
      name: 'Scrape Product Data',
      url: 'https://example-ecommerce.com/products',
      selector: '.product-card',
      extractFormat: 'table',
      useFirecrawl: true,
    } as WebScrapingConfig,
    status: 'pending',
    progress: { current: 0, total: 100 },
  },
  {
    type: 'transform',
    config: {
      id: 'transform-1',
      name: 'Clean Product Data',
      operations: [
        { type: 'filter', field: 'price', condition: 'price > 0' },
        { type: 'map', field: 'name', newField: 'product_name' },
        { type: 'calculate', field: 'discount', expression: '(original_price - sale_price) / original_price * 100' }
      ]
    } as TransformConfig,
    status: 'pending',
    progress: { current: 0, total: 500 },
  },
  {
    type: 'api-fetch',
    config: {
      id: 'api-1',
      name: 'Fetch Stock Data',
      url: 'https://api.inventory.com/stock',
      method: 'GET',
      responseFormat: 'json',
      authentication: {
        type: 'bearer',
        credentials: { token: 'demo-token' }
      },
      rateLimit: {
        requestsPerSecond: 10,
        burstLimit: 50
      }
    } as ApiFetchConfig,
    status: 'pending',
    progress: { current: 0, total: 250 },
  },
  {
    type: 'excel-export',
    config: {
      id: 'export-1',
      name: 'Export Final Report',
      outputPath: '/outputs/product-analysis.xlsx',
      sheetName: 'Product Analysis',
      formatting: {
        headerStyle: { fontWeight: 'bold', backgroundColor: '#4472C4' },
        autoWidth: true,
        freeze: 'A1'
      },
      append: false
    } as ExcelExportConfig,
    status: 'pending',
    progress: { current: 0, total: 750 },
  }
];

export const RealtimeNodesDemo: React.FC = () => {
  const [demoStates, setDemoStates] = useState<DemoNodeState[]>(
    DEMO_NODES.map(node => ({
      id: node.config.id,
      type: node.type,
      status: 'pending' as const,
      progress: {
        current: 0,
        total: node.progress?.total || 100,
        percentage: 0
      }
    }))
  );

  const [isRunning, setIsRunning] = useState(false);
  const [currentNodeIndex, setCurrentNodeIndex] = useState(0);

  // Simulate workflow execution
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setDemoStates(prevStates => {
        const newStates = [...prevStates];
        const currentNode = newStates[currentNodeIndex];
        
        if (currentNode && currentNode.status === 'running') {
          // Update progress
          currentNode.progress.current = Math.min(
            currentNode.progress.current + Math.random() * 10,
            currentNode.progress.total
          );
          currentNode.progress.percentage = 
            (currentNode.progress.current / currentNode.progress.total) * 100;

          // Add node-specific metadata
          if (currentNode.type === 'web-scraping') {
            currentNode.metadata = {
              ...currentNode.metadata,
              scrapingStages: [
                { name: 'connecting', status: 'completed' },
                { name: 'loading-page', status: 'completed' },
                { name: 'finding-selectors', status: 'running' },
                { name: 'extracting-data', status: 'pending' }
              ],
              scrapingMetrics: {
                elementsFound: Math.floor(currentNode.progress.current / 2),
                responseTime: 1200 + Math.random() * 300,
                contentSize: 125000 + Math.random() * 50000
              },
              urlStatus: { status: 'loaded', statusCode: 200 },
              selectorInfo: { elementsFound: Math.floor(currentNode.progress.current / 2) }
            };
          } else if (currentNode.type === 'transform') {
            currentNode.metadata = {
              ...currentNode.metadata,
              transformStages: [
                { operationIndex: 0, operation: { type: 'filter', field: 'price' }, status: 'completed' },
                { operationIndex: 1, operation: { type: 'map', field: 'name' }, status: 'running' },
                { operationIndex: 2, operation: { type: 'calculate', field: 'discount' }, status: 'pending' }
              ],
              transformMetrics: {
                recordsProcessed: currentNode.progress.current,
                recordsTransformed: Math.floor(currentNode.progress.current * 0.85),
                operationsCompleted: 1,
                processingSpeed: 25.5,
                dataQualityScore: 92.5
              }
            };
          } else if (currentNode.type === 'api-fetch') {
            currentNode.metadata = {
              ...currentNode.metadata,
              apiStages: [
                { name: 'authentication', status: 'completed', responseStatus: 200 },
                { name: 'rate-limit-check', status: 'completed' },
                { name: 'sending-request', status: 'running', responseTime: 450 }
              ],
              apiMetrics: {
                requestsSent: Math.floor(currentNode.progress.current / 10),
                responsesReceived: Math.floor(currentNode.progress.current / 10),
                averageResponseTime: 380,
                dataReceived: currentNode.progress.current * 1024,
                successRate: 98.5,
                authenticationStatus: 'valid'
              },
              connectionStatus: 'connected'
            };
          } else if (currentNode.type === 'excel-export') {
            currentNode.metadata = {
              ...currentNode.metadata,
              exportStages: [
                { name: 'creating-workbook', status: 'completed' },
                { name: 'creating-sheet', status: 'completed' },
                { name: 'writing-data', status: 'running', progress: currentNode.progress.percentage },
                { name: 'applying-formatting', status: 'pending' }
              ],
              exportMetrics: {
                rowsWritten: currentNode.progress.current,
                fileSizeBytes: currentNode.progress.current * 150,
                writeSpeed: 45.2,
                formattingProgress: Math.max(0, currentNode.progress.percentage - 70)
              }
            };
          }

          // Check if node is complete
          if (currentNode.progress.current >= currentNode.progress.total) {
            currentNode.status = 'completed';
            currentNode.progress.percentage = 100;
            
            // Move to next node
            if (currentNodeIndex < newStates.length - 1) {
              setCurrentNodeIndex(prev => prev + 1);
              newStates[currentNodeIndex + 1].status = 'running';
            } else {
              setIsRunning(false);
            }
          }
        }

        return newStates;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [isRunning, currentNodeIndex]);

  const startDemo = () => {
    setIsRunning(true);
    setCurrentNodeIndex(0);
    setDemoStates(prevStates => {
      const newStates = prevStates.map(state => ({
        ...state,
        status: 'pending' as const,
        progress: { ...state.progress, current: 0, percentage: 0 },
        metadata: {}
      }));
      newStates[0].status = 'running';
      return newStates;
    });
  };

  const pauseDemo = () => {
    setIsRunning(false);
  };

  const resetDemo = () => {
    setIsRunning(false);
    setCurrentNodeIndex(0);
    setDemoStates(prevStates =>
      prevStates.map(state => ({
        ...state,
        status: 'pending' as const,
        progress: { ...state.progress, current: 0, percentage: 0 },
        metadata: {}
      }))
    );
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'web-scraping': return <Globe className="h-4 w-4" />;
      case 'transform': return <Cog className="h-4 w-4" />;
      case 'api-fetch': return <Send className="h-4 w-4" />;
      case 'excel-export': return <FileSpreadsheet className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-300';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Real-time Specialized Nodes Demo
          </CardTitle>
          <CardDescription>
            Watch specialized real-time workflow nodes in action with live progress updates,
            node-specific metrics, and enhanced visualizations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <Button onClick={startDemo} disabled={isRunning} className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Start Demo
            </Button>
            <Button onClick={pauseDemo} disabled={!isRunning} variant="outline" className="flex items-center gap-2">
              <Pause className="h-4 w-4" />
              Pause
            </Button>
            <Button onClick={resetDemo} variant="outline" className="flex items-center gap-2">
              <Square className="h-4 w-4" />
              Reset
            </Button>
            
            <div className="flex-1" />
            
            <Badge variant="secondary" className="flex items-center gap-1">
              <RefreshCw className="h-3 w-3" />
              Real-time Updates
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {DEMO_NODES.map((node, index) => {
              const demoState = demoStates[index];
              const NodeComponent = getRealtimeNodeComponent(node.type as any);
              const hasSpecialized = hasSpecializedRealtimeComponent(node.type as any);
              
              return (
                <motion.div
                  key={node.config.id}
                  className={cn(
                    'p-4 border rounded-lg relative',
                    demoState.status === 'running' && 'ring-2 ring-blue-500'
                  )}
                  animate={demoState.status === 'running' ? { scale: [1, 1.02, 1] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={cn('p-2 rounded-full text-white', getStatusColor(demoState.status))}>
                      {getNodeIcon(node.type)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{node.config.name}</h3>
                      <p className="text-sm text-muted-foreground capitalize">
                        {node.type.replace('-', ' ')} Node
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasSpecialized && (
                        <Badge variant="outline" className="text-xs">
                          Specialized
                        </Badge>
                      )}
                      <Badge 
                        variant={demoState.status === 'running' ? 'default' : 'secondary'}
                        className="capitalize"
                      >
                        {demoState.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progress</span>
                      <span>{demoState.progress.percentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={demoState.progress.percentage} className="h-2" />
                    <div className="text-xs text-muted-foreground">
                      {demoState.progress.current.toLocaleString()} / {demoState.progress.total.toLocaleString()}
                    </div>
                  </div>

                  {/* Node-specific information */}
                  {demoState.status === 'running' && demoState.metadata && (
                    <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                      <h4 className="text-sm font-medium mb-2">Real-time Data</h4>
                      {node.type === 'web-scraping' && demoState.metadata.scrapingMetrics && (
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>Elements: {(demoState.metadata.scrapingMetrics as any).elementsFound}</div>
                          <div>Response: {(demoState.metadata.scrapingMetrics as any).responseTime}ms</div>
                        </div>
                      )}
                      {node.type === 'transform' && demoState.metadata.transformMetrics && (
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>Speed: {(demoState.metadata.transformMetrics as any).processingSpeed}/sec</div>
                          <div>Quality: {(demoState.metadata.transformMetrics as any).dataQualityScore}%</div>
                        </div>
                      )}
                      {node.type === 'api-fetch' && demoState.metadata.apiMetrics && (
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>Requests: {(demoState.metadata.apiMetrics as any).requestsSent}</div>
                          <div>Success: {(demoState.metadata.apiMetrics as any).successRate}%</div>
                        </div>
                      )}
                      {node.type === 'excel-export' && demoState.metadata.exportMetrics && (
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>Rows: {(demoState.metadata.exportMetrics as any).rowsWritten}</div>
                          <div>Speed: {(demoState.metadata.exportMetrics as any).writeSpeed}/sec</div>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Demo Features</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Live progress tracking with node-specific metrics</li>
              <li>• Real-time status updates and error handling</li>
              <li>• Specialized visualizations for each node type</li>
              <li>• Performance monitoring and optimization indicators</li>
              <li>• Seamless integration with the nodeExecutionStore</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealtimeNodesDemo;
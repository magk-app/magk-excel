/**
 * Demo component showcasing the specialized workflow nodes
 * Demonstrates real-time progress updates and Excel workflow features
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  WebScrapingNode, 
  ExcelExportNode, 
  TransformNode 
} from '@/components/workflow';
import { 
  WorkflowNodeData, 
  WebScrapingConfig, 
  ExcelExportConfig, 
  TransformConfig,
  NodeStatus,
  NodeProgress 
} from '@/types/workflow';
import { PlayCircle, Square, RotateCcw } from 'lucide-react';

const SpecializedNodesDemo: React.FC = () => {
  const [demoStatus, setDemoStatus] = useState<NodeStatus>('pending');
  const [progress, setProgress] = useState<NodeProgress | undefined>();

  // Sample configurations for each node type
  const webScrapingData: WorkflowNodeData = {
    type: 'web-scraping',
    status: demoStatus,
    progress: progress,
    config: {
      id: 'web-scraper-1',
      name: 'Extract Product Data',
      description: 'Scrape product listings from e-commerce site',
      url: 'https://example-ecommerce.com/products',
      selector: 'table.product-listings',
      extractFormat: 'table',
      useFirecrawl: true,
      timeout: 30
    } as WebScrapingConfig
  };

  const transformData: WorkflowNodeData = {
    type: 'transform',
    status: demoStatus,
    progress: progress,
    config: {
      id: 'transform-1',
      name: 'Clean Product Data',
      description: 'Apply data transformation and cleaning operations',
      operations: [
        { type: 'filter', field: 'price', condition: 'price > 0' },
        { type: 'map', field: 'name', expression: 'TRIM(UPPER(name))' },
        { type: 'calculate', field: 'discount', newField: 'savings', expression: 'price * discount' },
        { type: 'sort', field: 'price' },
        { type: 'group', field: 'category' }
      ]
    } as TransformConfig
  };

  const excelExportData: WorkflowNodeData = {
    type: 'excel-export',
    status: demoStatus,
    progress: progress,
    config: {
      id: 'excel-export-1',
      name: 'Export to Excel',
      description: 'Export cleaned data to formatted Excel file',
      outputPath: '/exports/products_cleaned.xlsx',
      sheetName: 'Product Catalog',
      append: false,
      formatting: {
        headerStyle: { bold: true, backgroundColor: '#4F46E5' },
        cellStyle: { borders: true },
        autoWidth: true,
        freeze: 'A2'
      }
    } as ExcelExportConfig
  };

  // Demo progress simulation
  const simulateProgress = () => {
    setDemoStatus('running');
    setProgress({
      current: 0,
      total: 1000,
      message: 'Initializing...',
      startTime: new Date(),
      stages: [
        { name: 'Loading page', status: 'running', progress: 0 },
        { name: 'Extracting data', status: 'pending', progress: 0 },
        { name: 'Writing data', status: 'pending', progress: 0 },
        { name: 'Applying formatting', status: 'pending', progress: 0 }
      ]
    });

    // Simulate different stages of progress
    const progressSteps = [
      { current: 200, message: 'Loading page...', stageIndex: 0 },
      { current: 400, message: 'Extracting table data...', stageIndex: 1 },
      { current: 600, message: 'Transforming records...', stageIndex: 1 },
      { current: 800, message: 'Writing to Excel...', stageIndex: 2 },
      { current: 950, message: 'Applying formatting...', stageIndex: 3 },
      { current: 1000, message: 'Complete!', stageIndex: 3 }
    ];

    progressSteps.forEach((step, index) => {
      setTimeout(() => {
        setProgress(prev => {
          if (!prev) return prev;
          
          const newStages = prev.stages?.map((stage, stageIndex) => {
            if (stageIndex < step.stageIndex) {
              return { ...stage, status: 'completed' as const };
            } else if (stageIndex === step.stageIndex) {
              return { ...stage, status: 'running' as const, progress: 75 };
            }
            return stage;
          });

          return {
            ...prev,
            current: step.current,
            message: step.message,
            throughputRate: step.current / ((Date.now() - prev.startTime!.getTime()) / 1000),
            estimatedTimeRemaining: Math.max(0, ((1000 - step.current) / 50)),
            stages: newStages
          };
        });

        if (index === progressSteps.length - 1) {
          setTimeout(() => {
            setDemoStatus('completed');
            setProgress(prev => prev ? {
              ...prev,
              stages: prev.stages?.map(stage => ({ ...stage, status: 'completed' as const }))
            } : prev);
          }, 500);
        }
      }, (index + 1) * 2000);
    });
  };

  const resetDemo = () => {
    setDemoStatus('pending');
    setProgress(undefined);
  };

  const stopDemo = () => {
    setDemoStatus('paused');
  };

  return (
    <div className="space-y-8 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🚀 Specialized Workflow Nodes Demo
            <Badge variant="outline">Enhanced Excel Integration</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Demonstration of specialized workflow nodes with real-time progress tracking, 
              Excel-specific features, and professional visual indicators.
            </p>
            
            <div className="flex gap-2">
              <Button 
                onClick={simulateProgress} 
                disabled={demoStatus === 'running'}
                className="flex items-center gap-2"
              >
                <PlayCircle className="h-4 w-4" />
                Start Demo
              </Button>
              
              <Button 
                onClick={stopDemo} 
                disabled={demoStatus !== 'running'}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Square className="h-4 w-4" />
                Pause
              </Button>
              
              <Button 
                onClick={resetDemo} 
                variant="outline"
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Web Scraping Node</CardTitle>
            <p className="text-sm text-muted-foreground">
              Extract data from websites with Firecrawl integration, format indicators, and real-time page loading progress.
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center p-4">
              <WebScrapingNode 
                id="demo-webscraping"
                data={webScrapingData as any}
                selected={false}
                type="web-scraping"
                position={{ x: 0, y: 0 }}
                zIndex={1}
                isConnectable={true}
                dragHandle=".drag-handle"
              />
            </div>
            
            <div className="mt-4 space-y-2">
              <h4 className="font-medium text-sm">Features:</h4>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Firecrawl integration badge</li>
                <li>Extract format indicators (table, list, text, structured)</li>
                <li>URL hostname display</li>
                <li>CSS selector indicators</li>
                <li>Real-time page loading and data extraction progress</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Transform Node</CardTitle>
            <p className="text-sm text-muted-foreground">
              Data transformation with operation type badges, field mapping indicators, and transformation progress tracking.
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center p-4">
              <TransformNode 
                id="demo-transform"
                data={transformData as any}
                selected={false}
                type="transform"
                position={{ x: 0, y: 0 }}
                zIndex={1}
                isConnectable={true}
                dragHandle=".drag-handle"
              />
            </div>
            
            <div className="mt-4 space-y-2">
              <h4 className="font-medium text-sm">Features:</h4>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Operation type badges (map, filter, sort, group, aggregate)</li>
                <li>Multiple operation summaries with overflow indicators</li>
                <li>Field mapping indicators for new field creation</li>
                <li>Real-time operation progress with current step display</li>
                <li>Data preview capabilities</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Excel Export Node</CardTitle>
            <p className="text-sm text-muted-foreground">
              Excel file export with formatting features, append mode indicators, and real-time row/sheet progress.
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center p-4">
              <ExcelExportNode 
                id="demo-excel-export"
                data={excelExportData as any}
                selected={false}
                type="excel-export"
                position={{ x: 0, y: 0 }}
                zIndex={1}
                isConnectable={true}
                dragHandle=".drag-handle"
              />
            </div>
            
            <div className="mt-4 space-y-2">
              <h4 className="font-medium text-sm">Features:</h4>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Append mode indicators</li>
                <li>Formatting feature badges with styling indicators</li>
                <li>Sheet name display with file path</li>
                <li>Advanced Excel features (freeze panes, auto-width)</li>
                <li>Real-time export progress with row counts</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-lg">Integration Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">BaseWorkflowNode Integration</h4>
              <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                <li>All nodes extend BaseWorkflowNode</li>
                <li>Comprehensive progress tracking</li>
                <li>Enhanced error handling</li>
                <li>Professional animations</li>
                <li>Consistent Shadcn UI styling</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">TypeScript Integration</h4>
              <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                <li>Full TypeScript type safety</li>
                <li>Comprehensive workflow types</li>
                <li>Real-time updates support</li>
                <li>Excel-specific configurations</li>
                <li>Progress stage definitions</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SpecializedNodesDemo;
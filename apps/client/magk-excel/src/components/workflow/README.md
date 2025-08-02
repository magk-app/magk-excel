# WorkflowCanvas Component

A comprehensive React Flow-based workflow visualization component designed for Excel data processing workflows. This component provides professional-grade workflow management with real-time status updates, execution controls, and an intuitive user interface.

## Features

### Core Functionality
- **React Flow Integration**: Built on top of React Flow with custom node types
- **15 Node Types**: Supports all workflow node types (web scraping, Excel I/O, data transformation, etc.)
- **Custom Edge Styling**: Data flow visualization with status indicators
- **Real-time Updates**: Live status updates during workflow execution
- **TypeScript Safety**: Full TypeScript integration with workflow types

### Visual Features
- **Enhanced MiniMap**: Shows node status colors and provides navigation
- **Interactive Controls**: Zoom, pan, fit view, grid toggle, and execution controls
- **Status Panels**: Real-time workflow progress and node status breakdown
- **Professional Styling**: Excel-themed design with smooth animations
- **Responsive Design**: Works across different screen sizes

### Workflow Management
- **Execution Controls**: Start, pause, stop, and reset workflow execution
- **Node Management**: Create, delete, and connect workflow nodes
- **Selection Handling**: Multi-select nodes and edges with keyboard shortcuts
- **Progress Tracking**: Detailed progress information with ETAs and throughput

## Basic Usage

```tsx
import React, { useState } from 'react';
import { WorkflowCanvas } from '@/components/workflow';
import { WorkflowNode, WorkflowEdge } from '@/types/workflow';

export const MyWorkflowEditor: React.FC = () => {
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [edges, setEdges] = useState<WorkflowEdge[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);

  return (
    <div className="w-full h-screen">
      <WorkflowCanvas
        nodes={nodes}
        edges={edges}
        onNodesChange={(changes) => {
          // Handle node changes
        }}
        onEdgesChange={(changes) => {
          // Handle edge changes
        }}
        onConnect={(connection) => {
          // Handle new connections
        }}
        onWorkflowExecute={() => {
          setIsExecuting(true);
          // Start workflow execution
        }}
        isExecuting={isExecuting}
        executionStatus="running"
      />
    </div>
  );
};
```

## Props Interface

```tsx
interface WorkflowCanvasProps {
  // Core data
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  
  // Event handlers
  onNodesChange?: OnNodesChange;
  onEdgesChange?: OnEdgesChange;
  onConnect?: OnConnect;
  onNodeClick?: (event: React.MouseEvent, node: Node) => void;
  onNodeDoubleClick?: (event: React.MouseEvent, node: Node) => void;
  onNodesDelete?: OnNodesDelete;
  onEdgesDelete?: OnEdgesDelete;
  
  // Workflow execution
  onWorkflowExecute?: () => void;
  onWorkflowPause?: () => void;
  onWorkflowStop?: () => void;
  onWorkflowReset?: () => void;
  isExecuting?: boolean;
  executionStatus?: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  
  // UI configuration
  isReadOnly?: boolean;
  showGrid?: boolean;
  showMiniMap?: boolean;
  showStatusPanel?: boolean;
  className?: string;
}
```

## Advanced Usage

### Creating Workflow Nodes

```tsx
import { createWorkflowNode, nodeTypeMetadata } from '@/components/workflow';

// Create a web scraping node
const webScrapingNode = createWorkflowNode('web-scraping', 
  { x: 100, y: 100 }, 
  {
    url: 'https://example.com/data',
    extractFormat: 'table',
    useFirecrawl: true,
    description: 'Extract product data'
  }
);

// Create an Excel export node
const excelExportNode = createWorkflowNode('excel-export',
  { x: 400, y: 100 },
  {
    outputPath: '/path/to/output.xlsx',
    sheetName: 'Products',
    formatting: {
      headerStyle: { bold: true },
      autoWidth: true
    }
  }
);
```

### Handling Real-time Updates

```tsx
const [workflowData, setWorkflowData] = useState({ nodes, edges });

// Update node status during execution
const updateNodeStatus = (nodeId: string, status: NodeStatus, progress?: NodeProgress) => {
  setWorkflowData(prev => ({
    ...prev,
    nodes: prev.nodes.map(node => 
      node.id === nodeId 
        ? { 
            ...node, 
            data: { 
              ...node.data, 
              status,
              progress,
              metadata: {
                ...node.data.metadata,
                lastExecuted: new Date()
              }
            }
          }
        : node
    )
  }));
};

// Example: Update progress for a running node
updateNodeStatus('web-scraping-1', 'running', {
  current: 750,
  total: 1000,
  percentage: 75,
  message: 'Extracting product data...',
  throughputRate: 25.5,
  estimatedTimeRemaining: 10
});
```

### Custom Edge Styling

```tsx
// Edges with data flow indicators
const edgesWithData: WorkflowEdge[] = [
  {
    id: 'edge-1',
    source: 'node-1',
    target: 'node-2',
    data: {
      dataSchema: {
        fields: ['name', 'price', 'category']
      },
      sampleData: {
        name: 'Product A',
        price: 29.99,
        category: 'Electronics'
      }
    }
  }
];
```

## Node Types

The WorkflowCanvas supports 15 different node types organized into categories:

### Data Source Nodes
- **web-scraping**: Extract data from websites using Firecrawl
- **pdf-extraction**: Extract tables from PDF documents
- **excel-input**: Read data from existing Excel files
- **api-fetch**: Fetch data from REST APIs
- **file-watcher**: Monitor file system changes

### Data Transformation Nodes
- **filter**: Apply filters to data rows
- **transform**: Map, clean, and restructure data
- **merge**: Combine multiple data sources
- **validation**: Validate data quality and format
- **data-cleaner**: Clean and standardize data
- **conditional**: Conditional logic branching
- **scheduler**: Schedule workflow execution

### Output Nodes
- **excel-export**: Export data to Excel files with formatting
- **preview**: Preview data before export
- **email-sender**: Send emails with attachments

## Styling and Theming

The component uses a professional Excel-themed design with:

- **Node Colors**: Each node type has a unique color scheme
- **Status Indicators**: Visual feedback for node execution status
- **Smooth Animations**: Framer Motion animations for state changes
- **Responsive Layout**: Adapts to different screen sizes
- **Professional Typography**: Clear, readable fonts and spacing

## Accessibility

- **Keyboard Navigation**: Full keyboard support for navigation
- **ARIA Labels**: Proper accessibility labels for screen readers
- **Color Contrast**: High contrast colors for better visibility
- **Focus Indicators**: Clear focus states for interactive elements

## Performance Considerations

- **Memoization**: Optimized re-rendering with React.memo and useMemo
- **Virtual Scrolling**: Efficient handling of large workflows
- **Lazy Loading**: Components load only when needed
- **Optimized Updates**: Minimal re-renders during real-time updates

## Browser Support

- Chrome 80+
- Firefox 74+
- Safari 13+
- Edge 80+

## Dependencies

- React 18+
- React Flow 11+
- Framer Motion 10+
- Lucide React 0.200+
- Tailwind CSS 3+

## Example Implementation

See `WorkflowCanvasExample.tsx` for a complete implementation example with:
- Sample workflow data
- Execution simulation
- Event handling
- Progress tracking
- Error handling

## Best Practices

1. **State Management**: Use proper state management for complex workflows
2. **Error Handling**: Implement comprehensive error handling and recovery
3. **Performance**: Monitor performance with large workflows (100+ nodes)
4. **User Experience**: Provide clear feedback during long-running operations
5. **Accessibility**: Test with screen readers and keyboard navigation

## Contributing

When extending the WorkflowCanvas:

1. Follow the existing TypeScript patterns
2. Add proper error handling
3. Include accessibility features
4. Update documentation
5. Add unit tests for new features
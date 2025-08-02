# Enhanced BaseWorkflowNode Component Usage

## Overview

The enhanced `BaseWorkflowNode` component provides a comprehensive, professional-looking workflow visualization with real-time status updates, progress tracking, and smooth animations. It's designed specifically for Excel workflow automation.

## Key Features

### 1. Real-time Status Updates
- 5 status states: `pending`, `running`, `completed`, `error`, `paused`
- Animated status icons with visual feedback
- Color-coded borders and backgrounds
- Smooth transitions between states

### 2. Progress Visualization
- Animated progress bars with percentage display
- ETA calculations with time remaining
- Throughput rates (items/second)
- Multi-stage progress tracking
- Visual progress stages with status indicators

### 3. Comprehensive Error Handling
- Detailed error messages with error codes
- Recovery suggestions
- Technical details in expandable sections
- Recoverable error indicators
- Timestamp tracking

### 4. Performance Metadata
- Execution time tracking
- Rows processed counter
- Memory usage monitoring
- CPU usage metrics
- Cache hit rates
- Network/Disk I/O statistics

### 5. Enhanced Animations
- Framer Motion powered smooth transitions
- Pulsing effects for running states
- Subtle hover animations
- Status-based visual feedback
- Icon animations for active nodes

### 6. React Flow Integration
- Source/target handles for workflow connections
- Status-colored connection points
- Hover effects on handles
- Responsive handle sizing

## Basic Usage

```tsx
import { BaseWorkflowNode } from '@/components/workflow';
import { WorkflowNodeData, NodeType } from '@/types/workflow';

// Example node data
const nodeData: WorkflowNodeData = {
  type: 'excel-export',
  config: {
    id: 'node-1',
    name: 'Export to Excel',
    description: 'Export processed data to Excel file with formatting',
    timeout: 300
  },
  status: 'running',
  progress: {
    current: 750,
    total: 1000,
    percentage: 75,
    message: 'Writing data to Excel sheet...',
    estimatedTimeRemaining: 45,
    throughputRate: 25.5,
    stages: [
      { name: 'Data preparation', status: 'completed' },
      { name: 'Excel formatting', status: 'running', progress: 80 },
      { name: 'File writing', status: 'pending' }
    ]
  },
  metadata: {
    executionTime: 12500,
    rowsProcessed: 750,
    memoryUsage: 25600000,
    performance: {
      cpuUsage: 35.2,
      memoryPeak: 32000000,
      cacheHitRate: 89.5
    }
  }
};

// Use in React Flow
<BaseWorkflowNode 
  id="node-1"
  data={nodeData}
  position={{ x: 100, y: 100 }}
  selected={false}
/>
```

## Error State Example

```tsx
const errorNodeData: WorkflowNodeData = {
  type: 'web-scraping',
  config: {
    id: 'node-2',
    name: 'Scrape Product Data',
    description: 'Extract product information from e-commerce site'
  },
  status: 'error',
  error: {
    message: 'Failed to connect to target website',
    code: 'NETWORK_ERROR',
    timestamp: new Date(),
    recoverable: true,
    suggestions: [
      'Check your internet connection',
      'Verify the target URL is accessible',
      'Try again in a few minutes'
    ],
    details: {
      url: 'https://example.com/products',
      httpStatus: 503,
      retryAttempt: 2
    }
  }
};
```

## Completed State Example

```tsx
const completedNodeData: WorkflowNodeData = {
  type: 'data-cleaner',
  config: {
    id: 'node-3',
    name: 'Clean Customer Data',
    description: 'Remove duplicates and standardize format'
  },
  status: 'completed',
  result: {
    rowCount: 15420,
    columnCount: 8,
    statistics: {
      totalRows: 15420,
      totalColumns: 8,
      duplicateRows: 325,
      nullValues: 42
    }
  },
  metadata: {
    executionTime: 8750,
    rowsProcessed: 15420,
    memoryUsage: 18500000,
    lastExecuted: new Date(),
    performance: {
      cpuUsage: 28.1,
      memoryPeak: 22000000,
      cacheHitRate: 94.2
    }
  }
};
```

## Node Type Icons

The component automatically selects appropriate icons for each node type:

- **web-scraping**: Activity icon
- **pdf-extraction**: FileSpreadsheet icon  
- **excel-input/excel-export**: FileSpreadsheet icon
- **api-fetch**: Zap icon
- **filter**: Settings icon
- **transform**: TrendingUp icon
- **merge**: Database icon
- **validation**: CheckCircle icon
- **preview**: Eye icon
- **data-cleaner**: Cpu icon
- **conditional**: AlertTriangle icon
- **scheduler**: Timer icon
- **email-sender**: Info icon
- **file-watcher**: Activity icon

## Styling Customization

Node themes are automatically applied based on the `NODE_THEMES` configuration in the workflow types. Each node type has its own color scheme and visual identity.

## Responsive Design

- Minimum width: 300px
- Maximum width: 420px  
- Responsive text and spacing
- Mobile-friendly touch targets
- Professional Excel-like styling

## Performance Considerations

- Uses React.memo patterns for optimal re-rendering
- Efficient animation handling with Framer Motion
- Conditional rendering of progress and error states
- Tooltip content is lazily loaded
- Optimized for large workflow canvases

## Integration with React Flow

The component is fully compatible with React Flow and includes:
- Proper handle positioning
- Status-based handle styling
- Connection point animations
- Selection state handling
- Drag and drop support

This enhanced BaseWorkflowNode provides a professional, feature-rich foundation for building sophisticated Excel workflow automation interfaces.
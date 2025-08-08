# Real-time Specialized Workflow Nodes

This directory contains specialized real-time node components for the MAGK Excel application. Each component extends the base `RealtimeWorkflowNode` with node-type-specific functionality, enhanced visualizations, and real-time data monitoring.

## Architecture

The specialized nodes build on top of the real-time infrastructure:

```
RealtimeWorkflowNode (base)
├── WebScrapingRealtimeNode
├── ExcelExportRealtimeNode
├── TransformRealtimeNode
└── ApiRealtimeNode
```

## Components

### WebScrapingRealtimeNode

**Features:**
- URL status and connection monitoring
- Element selector validation and discovery
- Page load progress tracking
- DOM traversal visualization
- Real-time element counting
- Firecrawl integration indicators

**Real-time Metrics:**
```typescript
interface ScrapingMetrics {
  pageLoadTime?: number;
  elementsFound?: number;
  selectorsMatched?: number;
  dataExtracted?: number;
  responseTime?: number;
  contentSize?: number;
  domDepth?: number;
}
```

**Stages:**
1. Connecting to URL
2. Loading page content
3. Waiting for elements
4. Finding CSS selectors
5. Extracting data
6. Validating extracted data

### ExcelExportRealtimeNode

**Features:**
- Sheet creation and formatting progress
- Row-by-row writing tracking
- File size monitoring in real-time
- Excel feature application status
- Write speed optimization
- Memory usage tracking

**Real-time Metrics:**
```typescript
interface ExcelExportMetrics {
  rowsWritten?: number;
  columnsWritten?: number;
  fileSizeBytes?: number;
  writeSpeed?: number; // rows per second
  formattingProgress?: number;
  sheetsCreated?: number;
  cellsFormatted?: number;
}
```

**Stages:**
1. Creating workbook
2. Creating sheet
3. Writing headers
4. Writing data rows
5. Applying formatting
6. Setting auto-width
7. Applying freeze panes
8. Saving file

### TransformRealtimeNode

**Features:**
- Operation-by-operation progress tracking
- Data validation status monitoring
- Field mapping visualization
- Data quality scoring
- Performance metrics
- Transformation pipeline overview

**Real-time Metrics:**
```typescript
interface TransformMetrics {
  recordsProcessed?: number;
  recordsFiltered?: number;
  recordsTransformed?: number;
  newFieldsCreated?: number;
  operationsCompleted?: number;
  processingSpeed?: number;
  dataQualityScore?: number;
  validationErrors?: number;
}
```

**Pipeline Stages:**
- Individual transformation operations
- Data validation steps
- Quality checks
- Performance optimization

### ApiRealtimeNode

**Features:**
- Request/response status monitoring
- Authentication status tracking
- Rate limiting indicators
- Response time measurements
- Error retry mechanisms
- Data format validation

**Real-time Metrics:**
```typescript
interface ApiMetrics {
  requestsSent?: number;
  responsesReceived?: number;
  averageResponseTime?: number;
  dataReceived?: number;
  rateLimitRemaining?: number;
  successRate?: number;
  authenticationStatus?: 'valid' | 'expired' | 'invalid';
}
```

**Stages:**
1. Authentication
2. Rate limit check
3. Sending request
4. Waiting for response
5. Receiving data
6. Parsing response
7. Validating data

## Usage

### Basic Usage

```typescript
import { WebScrapingRealtimeNode } from '@/components/workflow/realtime-nodes';

// In your workflow canvas
<WebScrapingRealtimeNode
  data={nodeData}
  workflowId={workflowId}
  selected={isSelected}
  // ... other NodeProps
/>
```

### Dynamic Component Selection

```typescript
import { getRealtimeNodeComponent } from '@/components/workflow/realtime-nodes';

const NodeComponent = getRealtimeNodeComponent(nodeType);

<NodeComponent
  data={nodeData}
  workflowId={workflowId}
  // ... other props
/>
```

### Check for Specialized Components

```typescript
import { hasSpecializedRealtimeComponent } from '@/components/workflow/realtime-nodes';

if (hasSpecializedRealtimeComponent(nodeType)) {
  // Use specialized component
} else {
  // Fall back to base realtime node
}
```

## Integration with nodeExecutionStore

All specialized nodes integrate seamlessly with the `nodeExecutionStore`:

```typescript
// Store structure for specialized data
interface NodeExecutionState {
  nodeId: string;
  workflowId: string;
  status: NodeStatus;
  progress?: NodeProgress;
  metadata?: {
    // Node-specific real-time data
    scrapingStages?: ScrapingStage[];
    scrapingMetrics?: ScrapingMetrics;
    exportStages?: ExcelExportStage[];
    exportMetrics?: ExcelExportMetrics;
    transformStages?: TransformStage[];
    transformMetrics?: TransformMetrics;
    apiStages?: ApiStage[];
    apiMetrics?: ApiMetrics;
    // ... other specialized data
  };
}
```

## Styling and Themes

Each specialized node uses the appropriate theme from `NODE_THEMES`:

```typescript
// Example: Web scraping node styling
style={{ 
  backgroundColor: NODE_THEMES['web-scraping'].backgroundColor,
  color: NODE_THEMES['web-scraping'].textColor,
  borderColor: NODE_THEMES['web-scraping'].borderColor
}}
```

## Animations

All nodes include specialized animations:

- **Pulse effects** for active operations
- **Progress animations** for data flow
- **Status transitions** with smooth scaling
- **Real-time indicators** with periodic updates
- **Error state animations** for problem visualization

## Error Handling and Recovery

Each specialized node provides:

- **Node-specific error messages** with context
- **Recovery suggestions** based on operation type
- **Retry mechanisms** with exponential backoff
- **Graceful degradation** when real-time data is unavailable
- **Offline mode support** with update queuing

## Performance Considerations

- **Efficient re-renders** using React.memo and useMemo
- **Optimized animations** with framer-motion
- **Selective subscriptions** to nodeExecutionStore
- **Lazy loading** of complex visualizations
- **Memory management** for large datasets

## Testing

Each component includes comprehensive testing:

```bash
# Run tests for specialized nodes
npm test -- --testPathPattern=realtime-nodes

# Run specific node tests
npm test WebScrapingRealtimeNode.test.tsx
npm test ExcelExportRealtimeNode.test.tsx
npm test TransformRealtimeNode.test.tsx
npm test ApiRealtimeNode.test.tsx
```

## Demo

See `RealtimeNodesDemo.tsx` for a complete demonstration of all specialized nodes in action.

## Future Enhancements

Planned improvements:
- Additional specialized nodes (PDF extraction, validation, etc.)
- Enhanced performance monitoring
- Advanced error recovery mechanisms
- More granular progress tracking
- Custom animation sequences
- Integration with workflow analytics
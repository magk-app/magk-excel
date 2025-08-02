/**
 * Transform Node - Map, clean, and restructure data
 * Essential data transformation for Excel workflows
 */

import React from 'react';
import { NodeProps } from 'reactflow';
import { 
  Filter, 
  ArrowUpDown, 
  Group, 
  Calculator, 
  MapPin,
  Shuffle,
  Activity,
  Eye,
  Cog
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TransformConfig, WorkflowNodeData } from '@/types/workflow';
import { BaseWorkflowNode } from '../BaseWorkflowNode';

interface TransformNodeData extends WorkflowNodeData {
  config: TransformConfig;
}

interface TransformNodeProps extends NodeProps {
  data: TransformNodeData;
}

// Operation type icons
const OperationIcon: React.FC<{ type: TransformConfig['operations'][0]['type'] }> = ({ type }) => {
  const iconProps = { className: 'h-3 w-3' };
  
  switch (type) {
    case 'map':
      return <MapPin {...iconProps} />;
    case 'filter':
      return <Filter {...iconProps} />;
    case 'sort':
      return <ArrowUpDown {...iconProps} />;
    case 'group':
      return <Group {...iconProps} />;
    case 'aggregate':
      return <Calculator {...iconProps} />;
    default:
      return <Shuffle {...iconProps} />;
  }
};

export const TransformNode: React.FC<TransformNodeProps> = (props) => {
  const { data } = props;
  const config = data.config as TransformConfig;

  // Generate description based on operations
  const operationSummary = config.operations.length === 1 
    ? `${config.operations[0].type} operation`
    : `${config.operations.length} operations`;

  // Enhanced data with transform specific information
  const enhancedData: TransformNodeData = {
    ...data,
    config: {
      ...config,
      description: config.description || `Apply ${operationSummary} to transform data`
    }
  };

  // Transform-specific progress tracking
  const getTransformProgress = () => {
    if (data.status === 'running' && data.progress) {
      const stages = data.progress.stages || [];
      const currentOperation = stages.find(s => s.status === 'running');
      
      return {
        currentOperation: currentOperation?.name,
        operationIndex: stages.findIndex(s => s.status === 'running'),
        totalOperations: config.operations.length,
        progress: data.progress,
        recordsProcessed: data.progress.current,
        totalRecords: data.progress.total
      };
    }
    return null;
  };

  const transformProgress = getTransformProgress();

  return (
    <div className="relative">
      <BaseWorkflowNode {...props} data={enhancedData} />
      
      {/* Operation indicators */}
      <div className="absolute -top-2 -right-2 flex gap-1 flex-wrap max-w-[120px]">
        {config.operations.slice(0, 3).map((operation, index) => (
          <Badge 
            key={index}
            variant="outline" 
            className="text-xs px-1.5 py-0.5 flex items-center gap-1"
            title={`${operation.type}${operation.field ? ` on ${operation.field}` : ''}`}
          >
            <OperationIcon type={operation.type} />
            {operation.type}
          </Badge>
        ))}
        
        {config.operations.length > 3 && (
          <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
            +{config.operations.length - 3} more
          </Badge>
        )}
      </div>

      {/* Operation details at bottom */}
      <div className="absolute -bottom-8 left-0 right-0 text-xs text-muted-foreground">
        <div className="flex flex-wrap gap-1 justify-center">
          {config.operations.slice(0, 2).map((operation, index) => (
            <span key={index} className="bg-purple-100 text-purple-800 px-1 py-0.5 rounded text-xs">
              {operation.field && `${operation.field}: `}
              {operation.type}
            </span>
          ))}
          {config.operations.length > 2 && (
            <span className="text-muted-foreground">
              +{config.operations.length - 2} more
            </span>
          )}
        </div>
      </div>

      {/* Field mapping indicator */}
      {config.operations.some(op => op.newField) && (
        <div className="absolute top-2 left-2">
          <Badge variant="outline" className="text-xs px-1 py-0.5" title="Creates new fields">
            🔄 Mapping
          </Badge>
        </div>
      )}

      {/* Real-time transformation progress overlay */}
      {transformProgress && (
        <div className="absolute top-8 left-2 right-2 bg-background/95 backdrop-blur-sm border rounded-lg p-2 shadow-lg">
          <div className="space-y-2">
            {/* Current operation indicator */}
            <div className="flex items-center gap-2 text-xs text-blue-600">
              <Cog className="h-3 w-3 animate-spin" />
              <span>Operation {transformProgress.operationIndex + 1}/{transformProgress.totalOperations}</span>
              <Badge variant="outline" className="text-xs px-1 py-0.5">
                {transformProgress.currentOperation || 'Processing'}
              </Badge>
            </div>
            
            {/* Records processed */}
            <div className="flex items-center gap-2 text-xs text-green-600">
              <Activity className="h-3 w-3 animate-pulse" />
              <span>Records processed</span>
              <Badge variant="outline" className="text-xs px-1 py-0.5">
                {transformProgress.recordsProcessed.toLocaleString()}/{transformProgress.totalRecords.toLocaleString()}
              </Badge>
            </div>
            
            {/* Data preview indicator */}
            <div className="flex items-center gap-2 text-xs text-purple-600">
              <Eye className="h-3 w-3" />
              <span>Preview available</span>
            </div>
            
            {/* Mini progress bar */}
            <Progress 
              value={(transformProgress.recordsProcessed / transformProgress.totalRecords) * 100} 
              className="h-1" 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TransformNode;
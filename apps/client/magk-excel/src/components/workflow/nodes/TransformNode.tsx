/**
 * Transform Node - Map, clean, and restructure data
 * Essential data transformation for Excel workflows
 */

import React from 'react';
import { NodeProps } from 'reactflow';
import { 
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
      


      {/* Operation details at bottom */}
      <div className="absolute -bottom-9 left-0 right-0 text-xs text-muted-foreground">
        <div className="flex flex-wrap gap-2 justify-center">
          {config.operations.slice(0, 2).map((operation, index) => (
            <span key={index} className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">
              {operation.field && `${operation.field}: `}
              {operation.type}
            </span>
          ))}
          {config.operations.length > 2 && (
            <span className="text-muted-foreground px-1">
              +{config.operations.length - 2} more
            </span>
          )}
        </div>
      </div>



      {/* Transform progress overlay completely removed - handled by base node */}
    </div>
  );
};

export default TransformNode;
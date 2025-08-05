/**
 * Transform Real-time Node Component
 * Extends RealtimeWorkflowNode with data transformation specific real-time information
 * 
 * Features:
 * - Operation-by-operation progress tracking
 * - Data validation status
 * - Field mapping visualization
 * - Record processing metrics
 * - Transformation pipeline progress
 * - Data quality indicators
 */

import React, { useMemo, useCallback } from 'react';
import { NodeProps } from 'reactflow';
import { motion } from 'framer-motion';
import { 
  Filter, 
  ArrowUpDown, 
  Group, 
  Calculator, 
  MapPin,
  Shuffle,
  Activity,
  Eye,
  Cog,
  CheckCircle2,
  AlertTriangle,
  Database,
  BarChart3,
  Hash,
  Zap,
  TrendingUp,
  RefreshCw,
  Target,
  Layers,
  GitBranch
} from 'lucide-react';

import { RealtimeWorkflowNode } from '../RealtimeWorkflowNode';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { useNodeState } from '@/stores/nodeExecutionStore';
import { WorkflowNodeData, TransformConfig, TransformOperation, NODE_THEMES } from '@/types/workflow';
import { cn } from '@/lib/utils';

export interface TransformRealtimeNodeProps extends NodeProps {
  data: WorkflowNodeData & { config: TransformConfig };
  workflowId: string;
}

interface TransformMetrics {
  recordsProcessed?: number;
  recordsFiltered?: number;
  recordsTransformed?: number;
  newFieldsCreated?: number;
  operationsCompleted?: number;
  processingSpeed?: number; // records per second
  memoryUsage?: number;
  dataQualityScore?: number; // 0-100
  validationErrors?: number;
  duplicatesRemoved?: number;
}

interface TransformStage {
  operationIndex: number;
  operation: TransformOperation;
  status: 'pending' | 'running' | 'completed' | 'error';
  startTime?: Date;
  endTime?: Date;
  progress?: number; // 0-100
  recordsProcessed?: number;
  recordsAffected?: number;
  metrics?: Partial<TransformMetrics>;
  validationResult?: {
    passed: number;
    failed: number;
    warnings: number;
  };
  details?: string;
}

const OperationIcon: React.FC<{ type: TransformOperation['type']; className?: string }> = ({ 
  type, 
  className = 'h-3 w-3' 
}) => {
  const iconProps = { className };
  
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
    case 'rename':
      return <GitBranch {...iconProps} />;
    case 'calculate':
      return <BarChart3 {...iconProps} />;
    default:
      return <Shuffle {...iconProps} />;
  }
};

const TransformStageIndicator: React.FC<{ 
  stage: TransformStage; 
  isActive: boolean;
  totalStages: number;
}> = ({ stage, isActive, totalStages }) => {
  const getStageColor = () => {
    if (stage.status === 'error') return 'text-red-500';
    if (stage.status === 'completed') return 'text-green-500';
    if (isActive) return 'text-purple-500';
    return 'text-gray-400';
  };

  const getOperationDisplayName = (operation: TransformOperation) => {
    const baseName = operation.type.charAt(0).toUpperCase() + operation.type.slice(1);
    if (operation.field) {
      return `${baseName} ${operation.field}`;
    }
    if (operation.newField) {
      return `${baseName} → ${operation.newField}`;
    }
    return baseName;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            className={cn(
              'flex items-center gap-2 text-xs py-1.5 px-2 rounded-md border',
              isActive && 'bg-purple-50 border-purple-200',
              stage.status === 'completed' && 'bg-green-50 border-green-200',
              stage.status === 'error' && 'bg-red-50 border-red-200'
            )}
            animate={isActive ? { scale: [1, 1.02, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-xs px-1 py-0 min-w-[20px] justify-center">
                {stage.operationIndex + 1}
              </Badge>
              <motion.div
                animate={isActive ? { rotate: 360 } : {}}
                transition={isActive ? { duration: 3, repeat: Infinity, ease: 'linear' } : {}}
                className={getStageColor()}
              >
                <OperationIcon type={stage.operation.type} />
              </motion.div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className={cn('font-medium truncate', getStageColor())}>
                {getOperationDisplayName(stage.operation)}
              </div>
              
              {stage.recordsProcessed !== undefined && (
                <div className="text-muted-foreground text-xs">
                  {stage.recordsProcessed.toLocaleString()} records
                </div>
              )}
            </div>

            {stage.progress !== undefined && stage.progress > 0 && (
              <Badge variant="outline" className="text-xs px-1 py-0">
                {Math.round(stage.progress)}%
              </Badge>
            )}

            {stage.status === 'completed' && (
              <CheckCircle2 className="h-3 w-3 text-green-500" />
            )}
            
            {stage.status === 'error' && (
              <AlertTriangle className="h-3 w-3 text-red-500" />
            )}
          </motion.div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1 text-xs max-w-xs">
            <div className="font-medium">
              {getOperationDisplayName(stage.operation)}
            </div>
            <div>Status: {stage.status}</div>
            
            {stage.operation.expression && (
              <div className="font-mono text-xs bg-gray-100 p-1 rounded">
                {stage.operation.expression}
              </div>
            )}
            
            {stage.recordsProcessed !== undefined && (
              <div>Records processed: {stage.recordsProcessed.toLocaleString()}</div>
            )}
            
            {stage.recordsAffected !== undefined && (
              <div>Records affected: {stage.recordsAffected.toLocaleString()}</div>
            )}
            
            {stage.validationResult && (
              <div className="pt-1 border-t">
                <div>Validation:</div>
                <div className="ml-2">
                  ✓ Passed: {stage.validationResult.passed.toLocaleString()}<br/>
                  ✗ Failed: {stage.validationResult.failed.toLocaleString()}<br/>
                  ⚠ Warnings: {stage.validationResult.warnings.toLocaleString()}
                </div>
              </div>
            )}
            
            {stage.details && (
              <div className="pt-1 border-t text-muted-foreground">
                {stage.details}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const DataQualityIndicator: React.FC<{
  score?: number;
  validationErrors?: number;
  duplicatesRemoved?: number;
  isActive?: boolean;
}> = ({ score, validationErrors, duplicatesRemoved, isActive }) => {
  const getScoreColor = (score?: number) => {
    if (!score) return 'text-gray-400';
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
        <Target className="h-3 w-3" />
        Data Quality
      </div>
      
      <div className="grid grid-cols-1 gap-2">
        {score !== undefined && (
          <div className="flex items-center gap-2 text-xs p-2 rounded-md bg-gray-50 border">
            <BarChart3 className={cn('h-3 w-3', getScoreColor(score))} />
            <span className="font-medium">Quality Score</span>
            <div className="flex-1" />
            <Badge 
              variant="outline" 
              className={cn(
                'text-xs px-1 py-0',
                score >= 90 ? 'bg-green-100 text-green-800' :
                score >= 70 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
              )}
            >
              {score.toFixed(1)}%
            </Badge>
          </div>
        )}
        
        {validationErrors !== undefined && (
          <div className="flex items-center gap-2 text-xs p-2 rounded-md bg-gray-50 border">
            <AlertTriangle className={cn(
              'h-3 w-3',
              validationErrors > 0 ? 'text-red-500' : 'text-green-500'
            )} />
            <span>Validation Errors</span>
            <div className="flex-1" />
            <Badge 
              variant="outline" 
              className={cn(
                'text-xs px-1 py-0',
                validationErrors > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
              )}
            >
              {validationErrors}
            </Badge>
          </div>
        )}
        
        {duplicatesRemoved !== undefined && duplicatesRemoved > 0 && (
          <div className="flex items-center gap-2 text-xs p-2 rounded-md bg-gray-50 border">
            <RefreshCw className="h-3 w-3 text-blue-500" />
            <span>Duplicates Removed</span>
            <div className="flex-1" />
            <Badge variant="outline" className="text-xs px-1 py-0 bg-blue-100 text-blue-800">
              {duplicatesRemoved.toLocaleString()}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
};

const TransformProgressSummary: React.FC<{
  metrics: TransformMetrics;
  totalOperations: number;
  activeOperation?: string;
}> = ({ metrics, totalOperations, activeOperation }) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">Transform Progress</span>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs px-1 py-0">
            <Layers className="h-2 w-2 mr-1" />
            {metrics.operationsCompleted || 0}/{totalOperations}
          </Badge>
          <Badge variant="outline" className="text-xs px-1 py-0">
            <Database className="h-2 w-2 mr-1" />
            {(metrics.recordsProcessed || 0).toLocaleString()}
          </Badge>
        </div>
      </div>
      
      {/* Progress bar removed - handled by base node */}
      
      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Zap className="h-3 w-3" />
          Speed: {(metrics.processingSpeed || 0).toFixed(1)}/sec
        </div>
        <div className="flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          Transformed: {(metrics.recordsTransformed || 0).toLocaleString()}
        </div>
      </div>
      
      {activeOperation && (
        <div className="text-xs text-purple-600 font-medium">
          Currently: {activeOperation}
        </div>
      )}
    </div>
  );
};

export const TransformRealtimeNode: React.FC<TransformRealtimeNodeProps> = ({
  data,
  workflowId,
  ...nodeProps
}) => {
  const nodeId = data.config.id;
  const config = data.config as TransformConfig;
  const realtimeNodeState = useNodeState(nodeId);

  // Parse real-time transform data
  const transformData = useMemo(() => {
    if (!realtimeNodeState?.metadata) return null;

    const metadata = realtimeNodeState.metadata;
    return {
      stages: metadata.transformStages as TransformStage[] || [],
      metrics: metadata.transformMetrics as TransformMetrics || {},
      pipeline: {
        currentStage: metadata.currentTransformStage as number,
        stagesCompleted: metadata.stagesCompleted as number,
      }
    };
  }, [realtimeNodeState?.metadata]);

  // Determine current active stage
  const activeStage = useMemo(() => {
    if (!transformData?.stages) return null;
    return transformData.stages.find(stage => stage.status === 'running');
  }, [transformData?.stages]);

  // Enhanced transform progress calculation
  const transformProgress = useMemo(() => {
    if (data.status !== 'running' || !data.progress) return null;
    
    const baseProgress = data.progress;
    const metrics = transformData?.metrics || {};
    
    return {
      ...baseProgress,
      recordsProcessed: metrics.recordsProcessed || baseProgress.current,
      totalRecords: baseProgress.total,
      processingSpeed: metrics.processingSpeed || baseProgress.throughputRate || 0,
      operationsCompleted: metrics.operationsCompleted || 0,
      totalOperations: config.operations.length,
      dataQualityScore: metrics.dataQualityScore,
      validationErrors: metrics.validationErrors || 0,
    };
  }, [data.status, data.progress, transformData?.metrics, config.operations.length]);

  return (
    <div className="relative">
      {/* Base realtime node */}
      <RealtimeWorkflowNode
        {...nodeProps}
        data={data}
        workflowId={workflowId}
      />

      {/* Transform specific overlays */}
      {data.status === 'running' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-24 left-2 right-2 bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg z-10"
        >
          <div className="space-y-3">
            {/* Transform Progress Summary */}
            {transformProgress && (
              <TransformProgressSummary
                metrics={transformData?.metrics || {}}
                totalOperations={transformProgress.totalOperations}
                activeOperation={activeStage?.operation.type}
              />
            )}

            {/* Transform Stages Pipeline */}
            {transformData?.stages && transformData.stages.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">Transform Pipeline</div>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {transformData.stages.map((stage, index) => (
                    <TransformStageIndicator
                      key={`${stage.operation.type}-${stage.operationIndex}`}
                      stage={stage}
                      isActive={stage.status === 'running'}
                      totalStages={config.operations.length}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Data Quality Metrics */}
            <DataQualityIndicator
              score={transformData?.metrics.dataQualityScore}
              validationErrors={transformData?.metrics.validationErrors}
              duplicatesRemoved={transformData?.metrics.duplicatesRemoved}
              isActive={!!activeStage}
            />

            {/* Performance Metrics */}
            {transformData?.metrics && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                {transformData.metrics.newFieldsCreated && (
                  <div className="flex items-center gap-1">
                    <GitBranch className="h-3 w-3 text-blue-500" />
                    <span>New fields: {transformData.metrics.newFieldsCreated}</span>
                  </div>
                )}
                {transformData.metrics.recordsFiltered !== undefined && (
                  <div className="flex items-center gap-1">
                    <Filter className="h-3 w-3 text-orange-500" />
                    <span>Filtered: {transformData.metrics.recordsFiltered.toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}



      {/* Live transformation pulse animation */}
      {data.status === 'running' && activeStage && (
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none"
          animate={{
            boxShadow: [
              '0 0 0 0 rgba(168, 85, 247, 0.7)',
              '0 0 0 6px rgba(168, 85, 247, 0)',
              '0 0 0 0 rgba(168, 85, 247, 0)'
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </div>
  );
};

export default TransformRealtimeNode;
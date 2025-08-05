/**
 * Enhanced Base Workflow Node Component
 * Professional Excel workflow visualization with real-time status updates,
 * comprehensive metadata display, and smooth animations
 */

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  Clock, 
  Play, 
  AlertCircle, 
  Pause,
  MoreVertical,
  Activity,
  Timer,
  Database,
  MemoryStick,
  Cpu,
  Zap,
  TrendingUp,
  AlertTriangle,
  Info,
  FileSpreadsheet,
  Eye,
  Settings
} from 'lucide-react';
import { WorkflowNodeData, NodeStatus, NODE_THEMES, NodeType } from '@/types/workflow';
import { STATUS_COLORS } from './animations/nodeAnimations';
import { ProgressAnimation } from './animations/ProgressAnimation';
import { cn } from '@/lib/utils';

interface BaseWorkflowNodeProps extends NodeProps {
  data: WorkflowNodeData;
}

// Node type icon mapping for enhanced visual identification
const getNodeTypeIcon = (nodeType: NodeType): React.ComponentType<{ className?: string }> => {
  switch (nodeType) {
    case 'web-scraping': return Activity;
    case 'pdf-extraction': return FileSpreadsheet;
    case 'excel-input': case 'excel-export': return FileSpreadsheet;
    case 'api-fetch': return Zap;
    case 'filter': return Settings;
    case 'transform': return TrendingUp;
    case 'merge': return Database;
    case 'validation': return CheckCircle;
    case 'preview': return Eye;
    case 'data-cleaner': return Cpu;
    case 'conditional': return AlertTriangle;
    case 'scheduler': return Timer;
    case 'email-sender': return Info;
    case 'file-watcher': return Activity;
    default: return Settings;
  }
};

// Enhanced status icon with animations
const StatusIcon: React.FC<{ status: NodeStatus; nodeType: NodeType; className?: string }> = ({ 
  status, 
  nodeType, 
  className 
}) => {
  const iconProps = { className: cn('h-4 w-4', className) };
  const NodeTypeIcon = getNodeTypeIcon(nodeType);
  
  switch (status) {
    case 'pending':
      return (
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Clock {...iconProps} />
        </motion.div>
      );
    case 'running':
      return (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Play {...iconProps} />
        </motion.div>
      );
    case 'completed':
      return (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', bounce: 0.5 }}
        >
          <CheckCircle {...iconProps} />
        </motion.div>
      );
    case 'error':
      return (
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          <AlertCircle {...iconProps} />
        </motion.div>
      );
    case 'paused':
      return <Pause {...iconProps} />;
    default:
      return <NodeTypeIcon {...iconProps} />;
  }
};

// Unified progress indicator using ProgressAnimation with node-optimized variant
const NodeProgress: React.FC<{ 
  progress?: WorkflowNodeData['progress']; 
  status: NodeStatus;
}> = ({ progress, status }) => {
  // Show progress only for running nodes with progress data
  if (!progress || status !== 'running') return null;
  
  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="bg-muted/30 rounded-lg p-3"
      >
        <ProgressAnimation
          progress={progress}
          variant="node-compact"
          size="sm"
          showPercentage={true}
          showEta={true}
          showThroughput={true}
          animated={true}
          className="space-y-1"
        />
      </motion.div>
    </AnimatePresence>
  );
};

// Enhanced error display with suggestions and recovery options
const NodeError: React.FC<{ error?: WorkflowNodeData['error'] }> = ({ error }) => {
  if (!error) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="space-y-2"
      >
        <Alert variant="destructive" className="border-red-200 bg-red-50/50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs space-y-2">
            <div className="font-medium">{error.message}</div>
            
            {error.code && (
              <div className="flex items-center gap-2 text-xs">
                <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                  {error.code}
                </Badge>
                {error.recoverable && (
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300">
                    Recoverable
                  </Badge>
                )}
              </div>
            )}

            {error.details && Object.keys(error.details).length > 0 && (
              <details className="text-xs">
                <summary className="cursor-pointer hover:text-red-700">
                  View technical details
                </summary>
                <div className="mt-1 p-2 bg-red-100 rounded text-red-800 font-mono text-xs">
                  {JSON.stringify(error.details, null, 2)}
                </div>
              </details>
            )}

            {error.suggestions && error.suggestions.length > 0 && (
              <div className="space-y-1">
                <div className="font-medium text-xs">Suggestions:</div>
                <ul className="list-disc list-inside text-xs space-y-1 text-red-700">
                  {error.suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}

            {error.timestamp && (
              <div className="text-xs text-red-600 opacity-75">
                Error occurred: {error.timestamp.toLocaleString()}
              </div>
            )}
          </AlertDescription>
        </Alert>
      </motion.div>
    </AnimatePresence>
  );
};

// Enhanced metadata display with performance metrics
const NodeMetadata: React.FC<{ 
  metadata?: WorkflowNodeData['metadata'];
  status: NodeStatus;
}> = ({ metadata, status }) => {
  if (!metadata || status === 'pending') return null;

  const formatBytes = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) {
      return `${(bytes / 1024 / 1024 / 1024).toFixed(1)}GB`;
    } else if (bytes >= 1024 * 1024) {
      return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
    } else if (bytes >= 1024) {
      return `${(bytes / 1024).toFixed(1)}KB`;
    }
    return `${bytes}B`;
  };

  const formatDuration = (ms: number) => {
    if (ms >= 60000) {
      return `${(ms / 60000).toFixed(1)}m`;
    } else if (ms >= 1000) {
      return `${(ms / 1000).toFixed(1)}s`;
    }
    return `${ms}ms`;
  };

  return (
    <div className="space-y-2">
      {/* Primary metrics */}
      <div className="flex flex-wrap gap-1.5">
        {metadata.executionTime && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <Timer className="h-3 w-3" />
                  {formatDuration(metadata.executionTime)}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs">
                  <div className="font-medium">Execution Time</div>
                  <div>{metadata.executionTime.toLocaleString()}ms</div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        {metadata.rowsProcessed && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <Database className="h-3 w-3" />
                  {metadata.rowsProcessed.toLocaleString()}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Rows processed</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        {metadata.memoryUsage && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <MemoryStick className="h-3 w-3" />
                  {formatBytes(metadata.memoryUsage)}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs">
                  <div className="font-medium">Memory Usage</div>
                  <div>{formatBytes(metadata.memoryUsage)}</div>
                  {metadata.performance?.memoryPeak && (
                    <div className="text-muted-foreground">
                      Peak: {formatBytes(metadata.performance.memoryPeak)}
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Performance metrics (if available) */}
      {metadata.performance && (
        <div className="flex flex-wrap gap-1.5">
          {metadata.performance.cpuUsage && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="secondary" className="text-xs flex items-center gap-1">
                    <Cpu className="h-3 w-3" />
                    {metadata.performance.cpuUsage.toFixed(1)}%
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>CPU Usage</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {metadata.performance.cacheHitRate && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="secondary" className="text-xs flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    {metadata.performance.cacheHitRate.toFixed(1)}%
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Cache Hit Rate</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {(metadata.performance.networkIO || metadata.performance.diskIO) && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="secondary" className="text-xs flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    I/O
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-xs space-y-1">
                    {metadata.performance.diskIO && (
                      <div>Disk: {formatBytes(metadata.performance.diskIO)}</div>
                    )}
                    {metadata.performance.networkIO && (
                      <div>Network: {formatBytes(metadata.performance.networkIO)}</div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )}

      {/* Last executed timestamp */}
      {metadata.lastExecuted && status === 'completed' && (
        <div className="text-xs text-muted-foreground">
          Last executed: {metadata.lastExecuted.toLocaleString()}
        </div>
      )}
    </div>
  );
};

// Main enhanced workflow node component
export const BaseWorkflowNode: React.FC<BaseWorkflowNodeProps> = ({ 
  data, 
  selected
}) => {
  const theme = NODE_THEMES[data.type];
  const statusColor = STATUS_COLORS[data.status];
  const NodeTypeIcon = getNodeTypeIcon(data.type);
  
  // Enhanced animation variants for status changes with better visual feedback
  const nodeVariants = {
    pending: { 
      scale: 1, 
      opacity: 0.85,
      filter: 'grayscale(0.2)'
    },
    running: { 
      scale: 1.02, 
      opacity: 1,
      filter: 'grayscale(0)',
      boxShadow: `0 0 20px ${STATUS_COLORS.running}30`
    },
    completed: { 
      scale: 1, 
      opacity: 1,
      filter: 'grayscale(0)',
      boxShadow: `0 0 15px ${STATUS_COLORS.completed}30`
    },
    error: { 
      scale: 1, 
      opacity: 1,
      filter: 'grayscale(0)',
      boxShadow: `0 0 20px ${STATUS_COLORS.error}30`
    },
    paused: { 
      scale: 1, 
      opacity: 0.6,
      filter: 'grayscale(0.5)'
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            variants={nodeVariants}
            animate={data.status}
            whileHover={{ scale: 1.01 }}
            className={cn(
              'min-w-[300px] max-w-[420px] cursor-pointer',
              selected && 'ring-2 ring-blue-500 ring-offset-2 ring-offset-background'
            )}
          >
            <Card 
              className={cn(
                'border-2 border-gray-800 shadow-lg hover:shadow-xl transition-all duration-300',
                'backdrop-blur-sm bg-background/95'
              )}
              style={{ 
                backgroundColor: `${theme.backgroundColor}08` // 3% opacity for subtle background
              }}
            >
              {/* Node Header */}
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {/* Node Type Icon with status overlay */}
                    <div className="relative">
                      <motion.div 
                        className="p-2 rounded-lg flex items-center justify-center shadow-sm"
                        style={{ backgroundColor: theme.backgroundColor }}
                        animate={data.status === 'running' ? { rotate: [0, 5, -5, 0] } : { rotate: 0 }}
                        transition={data.status === 'running' ? { repeat: Infinity, duration: 2 } : {}}
                      >
                        <NodeTypeIcon className="h-4 w-4 text-white" />
                      </motion.div>
                      {/* Status indicator overlay */}
                      <div className="absolute -top-1 -right-1 bg-background rounded-full">
                        <StatusIcon 
                          status={data.status} 
                          nodeType={data.type}
                          className="h-3 w-3 text-foreground" 
                        />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm leading-tight truncate">
                        {data.config.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {data.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                      {data.config.timeout && (
                        <p className="text-xs text-muted-foreground opacity-70">
                          Timeout: {data.config.timeout}s
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge 
                      variant={data.status === 'completed' ? 'default' : 'secondary'}
                      className={cn(
                        'text-xs font-medium transition-colors',
                        data.status === 'running' && 'animate-pulse'
                      )}
                      style={{ 
                        backgroundColor: statusColor,
                        color: 'white',
                        borderColor: statusColor
                      }}
                    >
                      {data.status.toUpperCase()}
                    </Badge>
                    <MoreVertical className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
                  </div>
                </div>
              </CardHeader>

              {/* Node Content */}
              <CardContent className="pt-0 space-y-4">
                {/* Description */}
                {data.config.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {data.config.description}
                  </p>
                )}

                {/* Progress indicator */}
                <NodeProgress progress={data.progress} status={data.status} />

                {/* Error display */}
                <NodeError error={data.error} />

                {/* Metadata */}
                <NodeMetadata metadata={data.metadata} status={data.status} />

                {/* Real-time activity indicator removed - now handled by NodeProgress component */}

                {/* Success indicator for completed nodes */}
                {data.status === 'completed' && data.result && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200"
                  >
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-green-700 font-medium">
                      {data.result.rowCount ? `Processed ${data.result.rowCount.toLocaleString()} rows` : 'Completed successfully'}
                    </span>
                  </motion.div>
                )}
              </CardContent>
            </Card>

            {/* Enhanced React Flow Handles */}
            <Handle
              type="target"
              position={Position.Left}
              className={cn(
                'w-3 h-3 border-2 border-white shadow-md transition-all',
                'hover:w-4 hover:h-4 hover:border-blue-400',
                data.status === 'running' && 'bg-blue-500 animate-pulse',
                data.status === 'completed' && 'bg-emerald-500',
                data.status === 'error' && 'bg-red-500',
                data.status === 'pending' && 'bg-slate-400',
                data.status === 'paused' && 'bg-amber-500'
              )}
            />
            <Handle
              type="source"
              position={Position.Right}
              className={cn(
                'w-3 h-3 border-2 border-white shadow-md transition-all',
                'hover:w-4 hover:h-4 hover:border-blue-400',
                data.status === 'running' && 'bg-blue-500 animate-pulse',
                data.status === 'completed' && 'bg-emerald-500',
                data.status === 'error' && 'bg-red-500',
                data.status === 'pending' && 'bg-slate-400',
                data.status === 'paused' && 'bg-amber-500'
              )}
            />
          </motion.div>
        </TooltipTrigger>
        
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <NodeTypeIcon className="h-4 w-4" />
              <p className="font-semibold">{data.config.name}</p>
            </div>
            <p className="text-xs leading-relaxed">
              {data.config.description || 'No description available'}
            </p>
            
            {/* Tooltip metadata */}
            <div className="space-y-1 text-xs text-muted-foreground border-t pt-2">
              <div>Type: {data.type.replace('-', ' ')}</div>
              <div>Status: {data.status}</div>
              {data.metadata?.lastExecuted && (
                <div>Last run: {data.metadata.lastExecuted.toLocaleString()}</div>
              )}
              {data.metadata?.executionTime && (
                <div>Duration: {data.metadata.executionTime}ms</div>
              )}
              {data.result?.rowCount && (
                <div>Rows: {data.result.rowCount.toLocaleString()}</div>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default BaseWorkflowNode;
/**
 * Excel Export Real-time Node Component
 * Extends RealtimeWorkflowNode with Excel export specific real-time information
 * 
 * Features:
 * - Sheet creation and formatting progress
 * - Row-by-row writing progress
 * - File size monitoring
 * - Column formatting status
 * - Excel feature application (freeze panes, auto-width, etc.)
 * - Write speed and performance metrics
 */

import React, { useMemo } from 'react';
import { NodeProps } from 'reactflow';
import { motion } from 'framer-motion';
import { 
  FileSpreadsheet, 
  Palette, 
  Download,
  Save,
  Columns,
  BarChart3,
  CheckCircle2,
  HardDrive,
  Gauge,
  Clock,
  Hash,
  Lock,
  Settings
} from 'lucide-react';

import { RealtimeWorkflowNode } from '../RealtimeWorkflowNode';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { useNodeState } from '@/stores/nodeExecutionStore';
import { WorkflowNodeData, ExcelExportConfig } from '@/types/workflow';
import { cn } from '@/lib/utils';

export interface ExcelExportRealtimeNodeProps extends NodeProps {
  data: WorkflowNodeData & { config: ExcelExportConfig };
  workflowId: string;
}

interface ExcelExportMetrics {
  rowsWritten?: number;
  columnsWritten?: number;
  fileSizeBytes?: number;
  writeSpeed?: number; // rows per second
  formattingProgress?: number; // 0-100
  sheetsCreated?: number;
  cellsFormatted?: number;
  autoWidthApplied?: boolean;
  freezePanesApplied?: boolean;
  headerStyleApplied?: boolean;
  memoryUsage?: number;
}

interface ExcelExportStage {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  startTime?: Date;
  endTime?: Date;
  progress?: number; // 0-100
  metrics?: Partial<ExcelExportMetrics>;
  details?: string;
}

const ExcelStageIndicator: React.FC<{ 
  stage: ExcelExportStage; 
  isActive: boolean;
  config: ExcelExportConfig;
}> = ({ stage, isActive, config: _config }) => {
  const getStageIcon = () => {
    switch (stage.name) {
      case 'creating-workbook':
        return <FileSpreadsheet className="h-3 w-3" />;
      case 'creating-sheet':
        return <Columns className="h-3 w-3" />;
      case 'writing-headers':
        return <BarChart3 className="h-3 w-3" />;
      case 'writing-data':
        return <Download className="h-3 w-3" />;
      case 'applying-formatting':
        return <Palette className="h-3 w-3" />;
      case 'setting-auto-width':
        return <Settings className="h-3 w-3" />;
      case 'applying-freeze-panes':
        return <Lock className="h-3 w-3" />;
      case 'saving-file':
        return <Save className="h-3 w-3" />;
      default:
        return <FileSpreadsheet className="h-3 w-3" />;
    }
  };

  const getStageColor = () => {
    if (stage.status === 'error') return 'text-red-500';
    if (stage.status === 'completed') return 'text-green-500';
    if (isActive) return 'text-blue-500';
    return 'text-gray-400';
  };

  const getStageDisplayName = () => {
    switch (stage.name) {
      case 'creating-workbook': return 'Creating Workbook';
      case 'creating-sheet': return 'Creating Sheet';
      case 'writing-headers': return 'Writing Headers';
      case 'writing-data': return 'Writing Data';
      case 'applying-formatting': return 'Applying Formatting';
      case 'setting-auto-width': return 'Auto-sizing Columns';
      case 'applying-freeze-panes': return 'Freeze Panes';
      case 'saving-file': return 'Saving File';
      default: return stage.name.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            className={cn(
              'flex items-center gap-2 text-xs py-1 px-2.5 rounded-md',
              isActive && 'bg-blue-50 border border-blue-200',
              stage.status === 'completed' && 'bg-green-50 border border-green-200',
              stage.status === 'error' && 'bg-red-50 border border-red-200'
            )}
            animate={isActive ? { scale: [1, 1.02, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.div
              animate={isActive ? { rotate: stage.name === 'saving-file' ? 0 : 360 } : {}}
              transition={isActive ? { duration: 2, repeat: Infinity, ease: 'linear' } : {}}
              className={getStageColor()}
            >
              {getStageIcon()}
            </motion.div>
            <span className={getStageColor()}>
              {getStageDisplayName()}
            </span>
            {stage.progress !== undefined && stage.progress > 0 && (
              <Badge variant="outline" className="text-xs px-1 py-0">
                {Math.round(stage.progress)}%
              </Badge>
            )}
            {stage.metrics?.rowsWritten !== undefined && (
              <Badge variant="outline" className="text-xs px-1 py-0">
                {stage.metrics.rowsWritten.toLocaleString()}
              </Badge>
            )}
          </motion.div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1 text-xs">
            <div className="font-medium">{getStageDisplayName()}</div>
            <div>Status: {stage.status}</div>
            {stage.details && <div>Details: {stage.details}</div>}
            {stage.progress !== undefined && (
              <div>Progress: {Math.round(stage.progress)}%</div>
            )}
            {stage.metrics && (
              <div className="space-y-1 pt-1 border-t">
                {stage.metrics.rowsWritten !== undefined && (
                  <div>Rows written: {stage.metrics.rowsWritten.toLocaleString()}</div>
                )}
                {stage.metrics.columnsWritten !== undefined && (
                  <div>Columns: {stage.metrics.columnsWritten}</div>
                )}
                {stage.metrics.fileSizeBytes !== undefined && (
                  <div>File size: {(stage.metrics.fileSizeBytes / 1024).toFixed(1)}KB</div>
                )}
                {stage.metrics.writeSpeed !== undefined && (
                  <div>Speed: {stage.metrics.writeSpeed.toFixed(1)} rows/sec</div>
                )}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const FileProgressIndicator: React.FC<{
  filePath: string;
  sizeBytes?: number;
  rowsWritten?: number;
  totalRows?: number;
  writeSpeed?: number;
}> = ({ filePath, sizeBytes, rowsWritten, totalRows, writeSpeed }) => {
  const fileName = filePath.split('/').pop() || 'export.xlsx';
  const sizeDisplay = sizeBytes ? `${(sizeBytes / 1024).toFixed(1)}KB` : '--';

  return (
    <div className="flex items-center gap-2 text-xs">
      <div className="text-green-500">
        <FileSpreadsheet className="h-3 w-3" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{fileName}</div>
        <div className="text-muted-foreground flex items-center gap-2">
          <Badge variant="outline" className="text-xs px-1 py-0">
            <HardDrive className="h-2 w-2 mr-1" />
            {sizeDisplay}
          </Badge>
          {rowsWritten !== undefined && totalRows !== undefined && (
            <Badge variant="outline" className="text-xs px-1 py-0">
              <Hash className="h-2 w-2 mr-1" />
              {rowsWritten.toLocaleString()}/{totalRows.toLocaleString()}
            </Badge>
          )}
          {writeSpeed !== undefined && writeSpeed > 0 && (
            <Badge variant="outline" className="text-xs px-1 py-0">
              <Gauge className="h-2 w-2 mr-1" />
              {writeSpeed.toFixed(1)}/s
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};

const FormattingProgress: React.FC<{
  config: ExcelExportConfig;
  metrics?: ExcelExportMetrics;
  isActive?: boolean;
}> = ({ config, metrics, isActive }) => {
  if (!config.formatting) return null;

  const features = [];
  
  if (config.formatting.headerStyle) {
    features.push({
      name: 'Header Style',
      icon: <BarChart3 className="h-3 w-3" />,
      applied: metrics?.headerStyleApplied ?? false
    });
  }
  
  if (config.formatting.autoWidth) {
    features.push({
      name: 'Auto Width',
      icon: <Columns className="h-3 w-3" />,
      applied: metrics?.autoWidthApplied ?? false
    });
  }
  
  if (config.formatting.freeze) {
    features.push({
      name: `Freeze ${config.formatting.freeze}`,
      icon: <Lock className="h-3 w-3" />,
      applied: metrics?.freezePanesApplied ?? false
    });
  }

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
        <Palette className="h-3 w-3" />
        Formatting Features
      </div>
      <div className="grid grid-cols-1 gap-1">
        {features.map((feature, index) => (
          <div
            key={index}
            className={cn(
              'flex items-center gap-2 text-xs py-1 px-2.5 rounded-md border',
              feature.applied ? 'bg-green-50 border-green-200 text-green-700' : 
              isActive ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-200'
            )}
          >
            <motion.div
              animate={isActive && !feature.applied ? { rotate: 360 } : {}}
              transition={isActive ? { duration: 2, repeat: Infinity, ease: 'linear' } : {}}
            >
              {feature.applied ? <CheckCircle2 className="h-3 w-3" /> : feature.icon}
            </motion.div>
            <span>{feature.name}</span>
            {feature.applied && (
              <Badge variant="outline" className="text-xs px-1 py-0">
                ✓
              </Badge>
            )}
          </div>
        ))}
      </div>
      
      {metrics?.cellsFormatted !== undefined && (
        <div className="text-xs text-muted-foreground">
          Cells formatted: {metrics.cellsFormatted.toLocaleString()}
        </div>
      )}
    </div>
  );
};

export const ExcelExportRealtimeNode: React.FC<ExcelExportRealtimeNodeProps> = ({
  data,
  workflowId,
  ...nodeProps
}) => {
  const nodeId = data.config.id;
  const config = data.config as ExcelExportConfig;
  const realtimeNodeState = useNodeState(nodeId);

  // Parse real-time Excel export data
  const exportData = useMemo(() => {
    if (!realtimeNodeState?.metadata) return null;

    const metadata = realtimeNodeState.metadata as any;
    return {
      stages: (metadata?.exportStages as ExcelExportStage[]) || [],
      metrics: (metadata?.exportMetrics as ExcelExportMetrics) || {},
      fileInfo: {
        sizeBytes: metadata?.fileSizeBytes as number,
        lastModified: metadata?.lastModified as Date,
      }
    };
  }, [realtimeNodeState?.metadata]);

  // Determine current active stage
  const activeStage = useMemo(() => {
    if (!exportData?.stages) return null;
    return exportData.stages.find(stage => stage.status === 'running');
  }, [exportData?.stages]);

  // Enhanced export progress calculation
  const exportProgress = useMemo(() => {
    if (data.status !== 'running' || !data.progress) return null;
    
    const baseProgress = data.progress;
    const metrics = exportData?.metrics || {};
    
    return {
      ...baseProgress,
      rowsWritten: metrics.rowsWritten || baseProgress.current,
      totalRows: baseProgress.total,
      fileSizeBytes: metrics.fileSizeBytes || 0,
      writeSpeed: metrics.writeSpeed || baseProgress.throughputRate || 0,
      formattingProgress: metrics.formattingProgress || 0,
      memoryUsage: metrics.memoryUsage || 0,
    };
  }, [data.status, data.progress, exportData?.metrics]);

  // Calculate estimated completion time
  const estimatedCompletion = useMemo(() => {
    if (!exportProgress || exportProgress.writeSpeed === 0) return null;
    
    const remainingRows = exportProgress.totalRows - exportProgress.rowsWritten;
    const remainingSeconds = remainingRows / exportProgress.writeSpeed;
    
    return new Date(Date.now() + remainingSeconds * 1000);
  }, [exportProgress]);

  return (
    <div className="relative">
      {/* Base realtime node */}
      <RealtimeWorkflowNode
        {...nodeProps}
        data={data}
        workflowId={workflowId}
      />

      {/* Excel export specific overlays */}
      {data.status === 'running' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-10 left-1.5 right-1.5 bg-background/95 backdrop-blur-sm border rounded-lg p-2.5 shadow-lg z-10"
        >
          <div className="space-y-2.5">
            {/* File Progress */}
            {exportProgress && (
              <FileProgressIndicator
                filePath={config.outputPath}
                sizeBytes={exportProgress.fileSizeBytes}
                rowsWritten={exportProgress.rowsWritten}
                totalRows={exportProgress.totalRows}
                writeSpeed={exportProgress.writeSpeed}
              />
            )}

            {/* Export Stages */}
            {exportData?.stages && exportData.stages.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">Export Progress</div>
                <div className="grid grid-cols-1 gap-1">
                  {exportData.stages.map((stage, index) => (
                    <ExcelStageIndicator
                      key={`${stage.name}-${index}`}
                      stage={stage}
                      isActive={stage.status === 'running'}
                      config={config}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Data Writing Progress */}
            {exportProgress && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">Data Export</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      <Download className="h-2 w-2 mr-1" />
                      {((exportProgress.rowsWritten / exportProgress.totalRows) * 100).toFixed(1)}%
                    </Badge>
                    {estimatedCompletion && (
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        <Clock className="h-2 w-2 mr-1" />
                        ETA {estimatedCompletion.toLocaleTimeString()}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <Progress 
                  value={(exportProgress.rowsWritten / exportProgress.totalRows) * 100} 
                  className="h-1.5" 
                />
                
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>Rows: {exportProgress.rowsWritten.toLocaleString()}/{exportProgress.totalRows.toLocaleString()}</div>
                  <div>Speed: {exportProgress.writeSpeed.toFixed(1)}/sec</div>
                </div>
              </div>
            )}

            {/* Formatting Progress */}
            <FormattingProgress
              config={config}
              metrics={exportData?.metrics}
              isActive={activeStage?.name === 'applying-formatting'}
            />

            {/* Performance Metrics */}
            {exportData?.metrics && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                {exportData.metrics.memoryUsage && (
                  <div className="flex items-center gap-1">
                    <HardDrive className="h-3 w-3 text-purple-500" />
                    <span>Memory: {(exportData.metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB</span>
                  </div>
                )}
                {exportData.metrics.sheetsCreated && (
                  <div className="flex items-center gap-1">
                    <FileSpreadsheet className="h-3 w-3 text-green-500" />
                    <span>Sheets: {exportData.metrics.sheetsCreated}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}



      {/* Live export pulse animation */}
      {data.status === 'running' && activeStage && (
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none"
          animate={{
            boxShadow: [
              '0 0 0 0 rgba(34, 197, 94, 0.7)',
              '0 0 0 6px rgba(34, 197, 94, 0)',
              '0 0 0 0 rgba(34, 197, 94, 0)'
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </div>
  );
};

export default ExcelExportRealtimeNode;
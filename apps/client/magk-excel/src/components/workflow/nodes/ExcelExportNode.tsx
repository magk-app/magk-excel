/**
 * Excel Export Node - Write data to Excel files with formatting
 * Core output node for MAGK Excel workflows
 */

import React from 'react';
import { NodeProps } from 'reactflow';
import { FileSpreadsheet, FileCheck, Download, Palette } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ExcelExportConfig, WorkflowNodeData } from '@/types/workflow';
import { BaseWorkflowNode } from '../BaseWorkflowNode';
import { cn } from '@/lib/utils';

interface ExcelExportNodeData extends WorkflowNodeData {
  config: ExcelExportConfig;
}

interface ExcelExportNodeProps extends NodeProps {
  data: ExcelExportNodeData;
}

export const ExcelExportNode: React.FC<ExcelExportNodeProps> = (props) => {
  const { data } = props;
  const config = data.config as ExcelExportConfig;

  // Enhanced data with Excel export specific information
  const enhancedData: ExcelExportNodeData = {
    ...data,
    config: {
      ...config,
      description: config.description || `Export to ${config.sheetName} in ${config.outputPath.split('/').pop()}`
    }
  };

  // Excel export specific progress tracking
  const getExportProgress = () => {
    if (data.status === 'running' && data.progress) {
      const stages = data.progress.stages || [];
      const writingStage = stages.find(s => s.name === 'Writing data');
      const formattingStage = stages.find(s => s.name === 'Applying formatting');
      
      return {
        writing: writingStage?.status === 'running',
        formatting: formattingStage?.status === 'running',
        progress: data.progress,
        rowsWritten: data.progress.current,
        totalRows: data.progress.total
      };
    }
    return null;
  };

  const exportProgress = getExportProgress();

  return (
    <div className="relative">
      <BaseWorkflowNode {...props} data={enhancedData} />
      


      {/* File path display at bottom */}
      <div className="absolute -bottom-6 left-0 right-0 text-xs text-muted-foreground text-center truncate">
        <FileSpreadsheet className="inline h-3 w-3 mr-1" />
        {config.outputPath.split('/').pop()}
      </div>





      {/* Real-time export progress overlay */}
      {exportProgress && (
        <div className="absolute top-8 left-2 right-2 bg-background/95 backdrop-blur-sm border rounded-lg p-2 shadow-lg">
          <div className="space-y-2">
            {/* Writing progress */}
            <div className={cn(
              "flex items-center gap-2 text-xs",
              exportProgress.writing ? "text-blue-600" : "text-muted-foreground"
            )}>
              <Download className={cn(
                "h-3 w-3",
                exportProgress.writing && "animate-bounce"
              )} />
              <span>Writing rows</span>
              <Badge variant="outline" className="text-xs px-1 py-0.5">
                {exportProgress.rowsWritten.toLocaleString()}/{exportProgress.totalRows.toLocaleString()}
              </Badge>
            </div>
            
            {/* Formatting progress */}
            {config.formatting && (
              <div className={cn(
                "flex items-center gap-2 text-xs",
                exportProgress.formatting ? "text-green-600" : "text-muted-foreground"
              )}>
                <Palette className={cn(
                  "h-3 w-3",
                  exportProgress.formatting && "animate-pulse"
                )} />
                <span>Applying formatting</span>
                {exportProgress.formatting && (
                  <FileCheck className="h-3 w-3 animate-pulse" />
                )}
              </div>
            )}
            
            {/* Mini progress bar */}
            <Progress 
              value={(exportProgress.rowsWritten / exportProgress.totalRows) * 100} 
              className="h-1" 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ExcelExportNode;
/**
 * Web Scraping Real-time Node Component
 * Extends RealtimeWorkflowNode with web scraping specific real-time information
 * 
 * Features:
 * - URL status and connection monitoring
 * - Element selector validation
 * - Page load progress tracking
 * - Data extraction metrics
 * - Element discovery counters
 * - DOM traversal visualization
 */

import React, { useMemo, useCallback } from 'react';
import { NodeProps } from 'reactflow';
import { motion } from 'framer-motion';
import { 
  Globe, 
  Search, 
  Target, 
  Loader2, 
  CheckCircle2,
  AlertTriangle,
  Clock,
  Wifi,
  MousePointer,
  Database,
  Activity,
  Eye,
  Hash
} from 'lucide-react';

import { RealtimeWorkflowNode } from '../RealtimeWorkflowNode';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { useNodeState } from '@/stores/nodeExecutionStore';
import { WorkflowNodeData, WebScrapingConfig, NODE_THEMES } from '@/types/workflow';
import { cn } from '@/lib/utils';

export interface WebScrapingRealtimeNodeProps extends NodeProps {
  data: WorkflowNodeData & { config: WebScrapingConfig };
  workflowId: string;
}

interface ScrapingMetrics {
  pageLoadTime?: number;
  elementsFound?: number;
  selectorsMatched?: number;
  dataExtracted?: number;
  responseTime?: number;
  contentSize?: number;
  domDepth?: number;
  javascriptErrors?: number;
}

interface ScrapingStage {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  startTime?: Date;
  endTime?: Date;
  metrics?: Partial<ScrapingMetrics>;
  details?: string;
}

const ScrapingStageIndicator: React.FC<{ stage: ScrapingStage; isActive: boolean }> = ({ 
  stage, 
  isActive 
}) => {
  const getStageIcon = () => {
    switch (stage.name) {
      case 'connecting':
        return <Wifi className="h-3 w-3" />;
      case 'loading-page':
        return <Globe className="h-3 w-3" />;
      case 'waiting-for-elements':
        return <Clock className="h-3 w-3" />;
      case 'finding-selectors':
        return <Target className="h-3 w-3" />;
      case 'extracting-data':
        return <Database className="h-3 w-3" />;
      case 'validating-data':
        return <CheckCircle2 className="h-3 w-3" />;
      default:
        return <Activity className="h-3 w-3" />;
    }
  };

  const getStageColor = () => {
    if (stage.status === 'error') return 'text-red-500';
    if (stage.status === 'completed') return 'text-green-500';
    if (isActive) return 'text-blue-500';
    return 'text-gray-400';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            className={cn(
              'flex items-center gap-2 text-xs py-1 px-2 rounded-md',
              isActive && 'bg-blue-50 border border-blue-200',
              stage.status === 'completed' && 'bg-green-50 border border-green-200',
              stage.status === 'error' && 'bg-red-50 border border-red-200'
            )}
            animate={isActive ? { scale: [1, 1.02, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.div
              animate={isActive ? { rotate: 360 } : {}}
              transition={isActive ? { duration: 2, repeat: Infinity, ease: 'linear' } : {}}
              className={getStageColor()}
            >
              {getStageIcon()}
            </motion.div>
            <span className={getStageColor()}>
              {stage.name.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
            {stage.metrics?.elementsFound !== undefined && (
              <Badge variant="outline" className="text-xs px-1 py-0">
                {stage.metrics.elementsFound}
              </Badge>
            )}
          </motion.div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1 text-xs">
            <div className="font-medium">{stage.name.replace('-', ' ')}</div>
            <div>Status: {stage.status}</div>
            {stage.details && <div>Details: {stage.details}</div>}
            {stage.metrics && (
              <div className="space-y-1 pt-1 border-t">
                {stage.metrics.elementsFound !== undefined && (
                  <div>Elements found: {stage.metrics.elementsFound}</div>
                )}
                {stage.metrics.selectorsMatched !== undefined && (
                  <div>Selectors matched: {stage.metrics.selectorsMatched}</div>
                )}
                {stage.metrics.dataExtracted !== undefined && (
                  <div>Data extracted: {stage.metrics.dataExtracted} items</div>
                )}
                {stage.metrics.responseTime !== undefined && (
                  <div>Response time: {stage.metrics.responseTime}ms</div>
                )}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const URLStatusIndicator: React.FC<{ 
  url: string; 
  status: 'pending' | 'connecting' | 'loaded' | 'error';
  responseTime?: number;
  statusCode?: number;
}> = ({ url, status, responseTime, statusCode }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'loaded': return 'text-green-500';
      case 'connecting': return 'text-yellow-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'loaded': return <CheckCircle2 className="h-3 w-3" />;
      case 'connecting': return <Loader2 className="h-3 w-3 animate-spin" />;
      case 'error': return <AlertTriangle className="h-3 w-3" />;
      default: return <Globe className="h-3 w-3" />;
    }
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      <div className={getStatusColor()}>
        {getStatusIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{new URL(url).hostname}</div>
        <div className="text-muted-foreground flex items-center gap-2">
          {statusCode && (
            <Badge variant={statusCode === 200 ? "default" : "destructive"} className="text-xs px-1 py-0">
              {statusCode}
            </Badge>
          )}
          {responseTime && (
            <span>{responseTime}ms</span>
          )}
        </div>
      </div>
    </div>
  );
};

const SelectorInfo: React.FC<{ 
  selector?: string; 
  elementsFound?: number;
  isMatching?: boolean;
}> = ({ selector, elementsFound, isMatching }) => {
  if (!selector) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            'flex items-center gap-2 text-xs p-2 rounded-md border',
            isMatching ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200'
          )}>
            <Target className={cn(
              'h-3 w-3',
              isMatching && 'animate-pulse'
            )} />
            <code className="font-mono text-xs truncate max-w-[100px]">
              {selector}
            </code>
            {elementsFound !== undefined && (
              <Badge variant="outline" className="text-xs px-1 py-0">
                <Hash className="h-2 w-2 mr-1" />
                {elementsFound}
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1 text-xs">
            <div className="font-medium">CSS Selector</div>
            <code className="block bg-gray-100 p-1 rounded text-xs">{selector}</code>
            {elementsFound !== undefined && (
              <div>Elements found: {elementsFound}</div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const WebScrapingRealtimeNode: React.FC<WebScrapingRealtimeNodeProps> = ({
  data,
  workflowId,
  ...nodeProps
}) => {
  const nodeId = data.config.id;
  const config = data.config as WebScrapingConfig;
  const realtimeNodeState = useNodeState(nodeId);

  // Parse real-time scraping data
  const scrapingData = useMemo(() => {
    if (!realtimeNodeState?.metadata) return null;

    const metadata = realtimeNodeState.metadata;
    return {
      stages: metadata.scrapingStages as ScrapingStage[] || [],
      metrics: metadata.scrapingMetrics as ScrapingMetrics || {},
      urlStatus: {
        status: metadata.urlStatus as 'pending' | 'connecting' | 'loaded' | 'error' || 'pending',
        responseTime: metadata.responseTime as number,
        statusCode: metadata.statusCode as number,
      },
      selectorInfo: {
        elementsFound: metadata.elementsFound as number,
        selectorsMatched: metadata.selectorsMatched as number,
        isMatching: metadata.isMatching as boolean,
      }
    };
  }, [realtimeNodeState?.metadata]);

  // Determine current active stage
  const activeStage = useMemo(() => {
    if (!scrapingData?.stages) return null;
    return scrapingData.stages.find(stage => stage.status === 'running');
  }, [scrapingData?.stages]);

  // Enhanced data extraction progress
  const extractionProgress = useMemo(() => {
    if (data.status !== 'running' || !data.progress) return null;
    
    const baseProgress = data.progress;
    const metrics = scrapingData?.metrics || {};
    
    return {
      ...baseProgress,
      elementsFound: metrics.elementsFound || 0,
      dataExtracted: metrics.dataExtracted || baseProgress.current,
      pageLoadProgress: metrics.pageLoadTime ? Math.min(100, (metrics.pageLoadTime / 5000) * 100) : 0,
      throughputRate: baseProgress.throughputRate || 0,
    };
  }, [data.status, data.progress, scrapingData?.metrics]);

  return (
    <div className="relative">
      {/* Base realtime node */}
      <RealtimeWorkflowNode
        {...nodeProps}
        data={data}
        workflowId={workflowId}
      />

      {/* Web scraping specific overlays */}
      {data.status === 'running' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-24 left-2 right-2 bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg z-10"
        >
          <div className="space-y-3">
            {/* URL Status */}
            {scrapingData?.urlStatus && (
              <URLStatusIndicator
                url={config.url}
                status={scrapingData.urlStatus.status}
                responseTime={scrapingData.urlStatus.responseTime}
                statusCode={scrapingData.urlStatus.statusCode}
              />
            )}

            {/* Selector Information */}
            {config.selector && (
              <SelectorInfo
                selector={config.selector}
                elementsFound={scrapingData?.selectorInfo.elementsFound}
                isMatching={scrapingData?.selectorInfo.isMatching}
              />
            )}

            {/* Scraping stages completely removed */}

            {/* Extraction Status (no duplicate progress bar) */}
            {extractionProgress && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">Data Extraction</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      <Database className="h-2 w-2 mr-1" />
                      {extractionProgress.dataExtracted.toLocaleString()}
                    </Badge>
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      <MousePointer className="h-2 w-2 mr-1" />
                      {extractionProgress.elementsFound}
                    </Badge>
                  </div>
                </div>
                
                {extractionProgress.throughputRate > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Rate: {extractionProgress.throughputRate.toFixed(1)} items/sec
                  </div>
                )}
              </div>
            )}

            {/* Real-time Metrics */}
            {scrapingData?.metrics && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                {scrapingData.metrics.contentSize && (
                  <div className="flex items-center gap-1">
                    <Activity className="h-3 w-3 text-blue-500" />
                    <span>Size: {(scrapingData.metrics.contentSize / 1024).toFixed(1)}KB</span>
                  </div>
                )}
                {scrapingData.metrics.domDepth && (
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3 text-green-500" />
                    <span>DOM: {scrapingData.metrics.domDepth} levels</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}



      {/* Live activity pulse for active scraping */}
      {data.status === 'running' && activeStage && (
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none"
          animate={{
            boxShadow: [
              '0 0 0 0 rgba(59, 130, 246, 0.7)',
              '0 0 0 6px rgba(59, 130, 246, 0)',
              '0 0 0 0 rgba(59, 130, 246, 0)'
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </div>
  );
};

export default WebScrapingRealtimeNode;
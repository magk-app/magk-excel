/**
 * API Real-time Node Component
 * Extends RealtimeWorkflowNode with API call specific real-time information
 * 
 * Features:
 * - Request/response status monitoring
 * - Rate limiting indicators
 * - Response time tracking
 * - Authentication status
 * - Error retry mechanisms
 * - Data format validation
 */

import React, { useMemo, useCallback } from 'react';
import { NodeProps } from 'reactflow';
import { motion } from 'framer-motion';
import { 
  Globe, 
  Send, 
  Download,
  Clock,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Zap,
  BarChart3,
  Key,
  Timer,
  Gauge,
  Network,
  Database,
  FileJson,
  FileText,
  Code,
  Activity,
  Hash,
  TrendingUp,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';

import { RealtimeWorkflowNode } from '../RealtimeWorkflowNode';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { useNodeState } from '@/stores/nodeExecutionStore';
import { WorkflowNodeData, ApiFetchConfig, NODE_THEMES } from '@/types/workflow';
import { cn } from '@/lib/utils';

export interface ApiRealtimeNodeProps extends NodeProps {
  data: WorkflowNodeData & { config: ApiFetchConfig };
  workflowId: string;
}

interface ApiMetrics {
  requestsSent?: number;
  responsesReceived?: number;
  averageResponseTime?: number;
  currentResponseTime?: number;
  dataReceived?: number; // bytes
  recordsExtracted?: number;
  rateLimitRemaining?: number;
  rateLimitReset?: Date;
  retryAttempts?: number;
  successRate?: number; // 0-100
  lastResponseTime?: Date;
  authenticationStatus?: 'valid' | 'expired' | 'invalid' | 'pending';
}

interface ApiStage {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  startTime?: Date;
  endTime?: Date;
  requestId?: string;
  responseStatus?: number;
  responseTime?: number;
  dataSize?: number;
  errorMessage?: string;
  retryCount?: number;
}

const ApiStageIndicator: React.FC<{ 
  stage: ApiStage; 
  isActive: boolean;
  config: ApiFetchConfig;
}> = ({ stage, isActive, config }) => {
  const getStageIcon = () => {
    switch (stage.name) {
      case 'authentication':
        return <Shield className="h-3 w-3" />;
      case 'rate-limit-check':
        return <Timer className="h-3 w-3" />;
      case 'sending-request':
        return <Send className="h-3 w-3" />;
      case 'waiting-response':
        return <Loader2 className="h-3 w-3" />;
      case 'receiving-data':
        return <Download className="h-3 w-3" />;
      case 'parsing-response':
        return <Code className="h-3 w-3" />;
      case 'validating-data':
        return <CheckCircle2 className="h-3 w-3" />;
      default:
        return <Network className="h-3 w-3" />;
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
      case 'authentication': return 'Authentication';
      case 'rate-limit-check': return 'Rate Limit Check';
      case 'sending-request': return 'Sending Request';
      case 'waiting-response': return 'Waiting Response';
      case 'receiving-data': return 'Receiving Data';
      case 'parsing-response': return 'Parsing Response';
      case 'validating-data': return 'Validating Data';
      default: return stage.name.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getResponseStatusColor = (status?: number) => {
    if (!status) return 'text-gray-400';
    if (status >= 200 && status < 300) return 'text-green-500';
    if (status >= 300 && status < 400) return 'text-yellow-500';
    if (status >= 400 && status < 500) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            className={cn(
              'flex items-center gap-2 text-xs py-1.5 px-2 rounded-md border',
              isActive && 'bg-blue-50 border-blue-200',
              stage.status === 'completed' && 'bg-green-50 border-green-200',
              stage.status === 'error' && 'bg-red-50 border-red-200'
            )}
            animate={isActive ? { scale: [1, 1.02, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.div
              animate={isActive && stage.name === 'waiting-response' ? { rotate: 360 } : {}}
              transition={isActive ? { duration: 2, repeat: Infinity, ease: 'linear' } : {}}
              className={getStageColor()}
            >
              {getStageIcon()}
            </motion.div>
            
            <div className="flex-1 min-w-0">
              <div className={cn('font-medium truncate', getStageColor())}>
                {getStageDisplayName()}
              </div>
              
              {stage.responseTime && (
                <div className="text-muted-foreground text-xs">
                  {stage.responseTime}ms
                </div>
              )}
            </div>

            {stage.responseStatus && (
              <Badge 
                variant="outline" 
                className={cn(
                  'text-xs px-1 py-0',
                  getResponseStatusColor(stage.responseStatus)
                )}
              >
                {stage.responseStatus}
              </Badge>
            )}

            {stage.dataSize && (
              <Badge variant="outline" className="text-xs px-1 py-0">
                {(stage.dataSize / 1024).toFixed(1)}KB
              </Badge>
            )}

            {stage.retryCount && stage.retryCount > 0 && (
              <Badge variant="outline" className="text-xs px-1 py-0 bg-yellow-100 text-yellow-800">
                Retry {stage.retryCount}
              </Badge>
            )}
          </motion.div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1 text-xs max-w-xs">
            <div className="font-medium">{getStageDisplayName()}</div>
            <div>Status: {stage.status}</div>
            
            {stage.requestId && (
              <div className="font-mono text-xs bg-gray-100 p-1 rounded">
                Request ID: {stage.requestId}
              </div>
            )}
            
            {stage.responseStatus && (
              <div>HTTP Status: {stage.responseStatus}</div>
            )}
            
            {stage.responseTime && (
              <div>Response Time: {stage.responseTime}ms</div>
            )}
            
            {stage.dataSize && (
              <div>Data Size: {(stage.dataSize / 1024).toFixed(1)}KB</div>
            )}
            
            {stage.errorMessage && (
              <div className="pt-1 border-t text-red-600">
                Error: {stage.errorMessage}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const AuthenticationStatus: React.FC<{
  config: ApiFetchConfig;
  status?: 'valid' | 'expired' | 'invalid' | 'pending';
  isActive?: boolean;
}> = ({ config, status, isActive }) => {
  if (!config.authentication || config.authentication.type === 'none') return null;

  const getStatusColor = () => {
    switch (status) {
      case 'valid': return 'text-green-500';
      case 'expired': return 'text-yellow-500';
      case 'invalid': return 'text-red-500';
      case 'pending': return 'text-blue-500';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'valid': return <CheckCircle2 className="h-3 w-3" />;
      case 'expired': return <Clock className="h-3 w-3" />;
      case 'invalid': return <AlertTriangle className="h-3 w-3" />;
      case 'pending': return <Loader2 className="h-3 w-3 animate-spin" />;
      default: return <Shield className="h-3 w-3" />;
    }
  };

  const getAuthTypeDisplayName = () => {
    switch (config.authentication.type) {
      case 'basic': return 'Basic Auth';
      case 'bearer': return 'Bearer Token';
      case 'api-key': return 'API Key';
      default: return 'Authentication';
    }
  };

  return (
    <div className="flex items-center gap-2 text-xs p-2 rounded-md bg-gray-50 border">
      <motion.div
        animate={isActive ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
        className={getStatusColor()}
      >
        {getStatusIcon()}
      </motion.div>
      <span className="font-medium">{getAuthTypeDisplayName()}</span>
      <div className="flex-1" />
      <Badge 
        variant="outline" 
        className={cn(
          'text-xs px-1 py-0',
          status === 'valid' ? 'bg-green-100 text-green-800' :
          status === 'expired' ? 'bg-yellow-100 text-yellow-800' :
          status === 'invalid' ? 'bg-red-100 text-red-800' :
          'bg-blue-100 text-blue-800'
        )}
      >
        {status || 'unknown'}
      </Badge>
    </div>
  );
};

const RateLimitIndicator: React.FC<{
  remaining?: number;
  resetTime?: Date;
  requestsPerSecond?: number;
  isThrottled?: boolean;
}> = ({ remaining, resetTime, requestsPerSecond, isThrottled }) => {
  const getThrottleColor = () => {
    if (isThrottled) return 'text-red-500';
    if (remaining !== undefined && remaining < 10) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
        <Timer className="h-3 w-3" />
        Rate Limiting
      </div>
      
      <div className="grid grid-cols-1 gap-2">
        {remaining !== undefined && (
          <div className="flex items-center gap-2 text-xs p-2 rounded-md bg-gray-50 border">
            <Gauge className={cn('h-3 w-3', getThrottleColor())} />
            <span>Requests Remaining</span>
            <div className="flex-1" />
            <Badge 
              variant="outline" 
              className={cn(
                'text-xs px-1 py-0',
                remaining < 10 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
              )}
            >
              {remaining.toLocaleString()}
            </Badge>
          </div>
        )}
        
        {resetTime && (
          <div className="flex items-center gap-2 text-xs p-2 rounded-md bg-gray-50 border">
            <Clock className="h-3 w-3 text-blue-500" />
            <span>Reset Time</span>
            <div className="flex-1" />
            <Badge variant="outline" className="text-xs px-1 py-0">
              {resetTime.toLocaleTimeString()}
            </Badge>
          </div>
        )}
        
        {requestsPerSecond !== undefined && requestsPerSecond > 0 && (
          <div className="flex items-center gap-2 text-xs p-2 rounded-md bg-gray-50 border">
            <TrendingUp className="h-3 w-3 text-purple-500" />
            <span>Current Rate</span>
            <div className="flex-1" />
            <Badge variant="outline" className="text-xs px-1 py-0">
              {requestsPerSecond.toFixed(1)}/sec
            </Badge>
          </div>
        )}
        
        {isThrottled && (
          <div className="text-xs text-red-600 font-medium flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Rate limit exceeded - throttling requests
          </div>
        )}
      </div>
    </div>
  );
};

const ResponseFormatIndicator: React.FC<{
  format: ApiFetchConfig['responseFormat'];
  dataReceived?: number;
  recordsExtracted?: number;
}> = ({ format, dataReceived, recordsExtracted }) => {
  const getFormatIcon = () => {
    switch (format) {
      case 'json': return <FileJson className="h-3 w-3" />;
      case 'xml': return <Code className="h-3 w-3" />;
      case 'csv': return <BarChart3 className="h-3 w-3" />;
      case 'text': return <FileText className="h-3 w-3" />;
      default: return <Database className="h-3 w-3" />;
    }
  };

  return (
    <div className="flex items-center gap-2 text-xs p-2 rounded-md bg-gray-50 border">
      <div className="text-blue-500">
        {getFormatIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium">{format.toUpperCase()} Response</div>
        <div className="text-muted-foreground flex items-center gap-2">
          {dataReceived && (
            <span>{(dataReceived / 1024).toFixed(1)}KB received</span>
          )}
          {recordsExtracted !== undefined && (
            <span>{recordsExtracted.toLocaleString()} records</span>
          )}
        </div>
      </div>
    </div>
  );
};

export const ApiRealtimeNode: React.FC<ApiRealtimeNodeProps> = ({
  data,
  workflowId,
  ...nodeProps
}) => {
  const nodeId = data.config.id;
  const config = data.config as ApiFetchConfig;
  const realtimeNodeState = useNodeState(nodeId);

  // Parse real-time API data
  const apiData = useMemo(() => {
    if (!realtimeNodeState?.metadata) return null;

    const metadata = realtimeNodeState.metadata;
    return {
      stages: metadata.apiStages as ApiStage[] || [],
      metrics: metadata.apiMetrics as ApiMetrics || {},
      connectionStatus: metadata.connectionStatus as 'connected' | 'disconnected' | 'error',
      rateLimitInfo: {
        remaining: metadata.rateLimitRemaining as number,
        resetTime: metadata.rateLimitReset ? new Date(metadata.rateLimitReset as string) : undefined,
        isThrottled: metadata.isThrottled as boolean,
      }
    };
  }, [realtimeNodeState?.metadata]);

  // Determine current active stage
  const activeStage = useMemo(() => {
    if (!apiData?.stages) return null;
    return apiData.stages.find(stage => stage.status === 'running');
  }, [apiData?.stages]);

  // Enhanced API progress calculation
  const apiProgress = useMemo(() => {
    if (data.status !== 'running' || !data.progress) return null;
    
    const baseProgress = data.progress;
    const metrics = apiData?.metrics || {};
    
    return {
      ...baseProgress,
      requestsSent: metrics.requestsSent || 0,
      responsesReceived: metrics.responsesReceived || 0,
      averageResponseTime: metrics.averageResponseTime || 0,
      dataReceived: metrics.dataReceived || 0,
      recordsExtracted: metrics.recordsExtracted || baseProgress.current,
      successRate: metrics.successRate || 100,
    };
  }, [data.status, data.progress, apiData?.metrics]);

  return (
    <div className="relative">
      {/* Base realtime node */}
      <RealtimeWorkflowNode
        {...nodeProps}
        data={data}
        workflowId={workflowId}
      />

      {/* API specific overlays */}
      {data.status === 'running' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-12 left-2 right-2 bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg z-10"
        >
          <div className="space-y-3">
            {/* Connection Status */}
            <div className="flex items-center gap-2 text-xs">
              <div className={cn(
                apiData?.connectionStatus === 'connected' ? 'text-green-500' :
                apiData?.connectionStatus === 'error' ? 'text-red-500' : 'text-yellow-500'
              )}>
                {apiData?.connectionStatus === 'connected' ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              </div>
              <span className="font-medium">
                API Connection: {apiData?.connectionStatus || 'unknown'}
              </span>
            </div>

            {/* Authentication Status */}
            <AuthenticationStatus
              config={config}
              status={apiData?.metrics.authenticationStatus}
              isActive={activeStage?.name === 'authentication'}
            />

            {/* API Request Stages */}
            {apiData?.stages && apiData.stages.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground">API Request Pipeline</div>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {apiData.stages.map((stage, index) => (
                    <ApiStageIndicator
                      key={`${stage.name}-${index}`}
                      stage={stage}
                      isActive={stage.status === 'running'}
                      config={config}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Request Progress Summary */}
            {apiProgress && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">Request Progress</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      <Send className="h-2 w-2 mr-1" />
                      {apiProgress.requestsSent}/{apiProgress.responsesReceived}
                    </Badge>
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      <CheckCircle2 className="h-2 w-2 mr-1" />
                      {apiProgress.successRate.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
                
                <Progress 
                  value={(apiProgress.recordsExtracted / apiProgress.total) * 100} 
                  className="h-1.5" 
                />
                
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>Avg response: {apiProgress.averageResponseTime.toFixed(0)}ms</div>
                  <div>Data: {(apiProgress.dataReceived / 1024).toFixed(1)}KB</div>
                </div>
              </div>
            )}

            {/* Response Format Info */}
            <ResponseFormatIndicator
              format={config.responseFormat}
              dataReceived={apiData?.metrics.dataReceived}
              recordsExtracted={apiData?.metrics.recordsExtracted}
            />

            {/* Rate Limiting */}
            {(config.rateLimit || apiData?.rateLimitInfo.remaining !== undefined) && (
              <RateLimitIndicator
                remaining={apiData?.rateLimitInfo.remaining}
                resetTime={apiData?.rateLimitInfo.resetTime}
                requestsPerSecond={config.rateLimit?.requestsPerSecond}
                isThrottled={apiData?.rateLimitInfo.isThrottled}
              />
            )}

            {/* Performance Metrics */}
            {apiData?.metrics && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                {apiData.metrics.retryAttempts && apiData.metrics.retryAttempts > 0 && (
                  <div className="flex items-center gap-1">
                    <RefreshCw className="h-3 w-3 text-orange-500" />
                    <span>Retries: {apiData.metrics.retryAttempts}</span>
                  </div>
                )}
                {apiData.metrics.currentResponseTime && (
                  <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-blue-500" />
                    <span>Last: {apiData.metrics.currentResponseTime}ms</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Enhanced status indicators */}
      <div className="absolute -top-1 -right-1 flex gap-1">
        {/* HTTP Method indicator */}
        <Badge 
          variant="outline" 
          className="text-xs px-1.5 py-0.5"
          style={{ 
            backgroundColor: NODE_THEMES['api-fetch'].backgroundColor,
            color: NODE_THEMES['api-fetch'].textColor,
            borderColor: NODE_THEMES['api-fetch'].borderColor
          }}
        >
          {config.method}
          {apiProgress && (
            <span className="ml-1">({apiProgress.recordsExtracted})</span>
          )}
        </Badge>
        
        {/* Response format with real-time data size */}
        {data.status === 'running' && apiData?.metrics.dataReceived && (
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-green-100 text-green-800">
              {config.responseFormat.toUpperCase()} ({(apiData.metrics.dataReceived / 1024).toFixed(1)}KB)
            </Badge>
          </motion.div>
        )}
      </div>

      {/* Live API activity pulse animation */}
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

export default ApiRealtimeNode;
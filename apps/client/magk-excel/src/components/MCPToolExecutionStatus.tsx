import React, { memo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';

interface MCPToolCall {
  server: string;
  tool: string;
  args: any;
  result?: any;
  error?: string;
  duration?: number;
  status?: 'pending' | 'running' | 'completed' | 'error';
}

interface MCPToolExecutionStatusProps {
  toolCalls: MCPToolCall[];
  isVisible: boolean;
  onClose?: () => void;
  onRetry?: (toolCall: MCPToolCall) => void;
}

const getStatusColor = (status: string = 'pending') => {
  switch (status) {
    case 'running': return 'bg-blue-500';
    case 'completed': return 'bg-green-500';
    case 'error': return 'bg-red-500';
    default: return 'bg-gray-400';
  }
};

const getStatusIcon = (status: string = 'pending') => {
  switch (status) {
    case 'running':
      return (
        <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
      );
    case 'completed':
      return (
        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    case 'error':
      return (
        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    default:
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
};

const formatDuration = (ms?: number) => {
  if (!ms) return 'N/A';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
};

const formatArgs = (args: any) => {
  if (!args) return 'No arguments';
  
  const formatted = Object.entries(args)
    .map(([key, value]) => {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      return `${key}: ${stringValue.length > 50 ? stringValue.slice(0, 50) + '...' : stringValue}`;
    })
    .join(', ');
    
  return formatted || 'Empty arguments';
};

const ToolCallCard = memo(({ toolCall, onRetry }: { toolCall: MCPToolCall; onRetry?: (toolCall: MCPToolCall) => void }) => {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <Card className={`mb-3 border-l-4 rounded-lg ${getStatusColor(toolCall.status)} transition-all duration-200 hover:shadow-md bg-white dark:bg-gray-800`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon(toolCall.status)}
            <div>
              <CardTitle className="text-sm font-medium">
                {toolCall.tool}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Server: {toolCall.server}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant={
              toolCall.status === 'completed' ? 'default' :
              toolCall.status === 'running' ? 'secondary' :
              toolCall.status === 'error' ? 'destructive' : 'outline'
            } className="text-xs">
              {toolCall.status || 'pending'}
            </Badge>
            
            {toolCall.duration && (
              <Badge variant="outline" className="text-xs">
                {formatDuration(toolCall.duration)}
              </Badge>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="h-6 w-6 p-0"
            >
              <svg 
                className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </Button>
          </div>
        </div>
        
        {toolCall.status === 'running' && (
          <Progress value={undefined} className="w-full h-1 mt-2" />
        )}
      </CardHeader>
      
      {expanded && (
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-1">Arguments:</h4>
              <div className="bg-muted p-2 rounded text-xs font-mono">
                {formatArgs(toolCall.args)}
              </div>
            </div>
            
            {toolCall.result && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-1">Result:</h4>
                <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded text-xs font-mono max-h-32 overflow-y-auto">
                  {typeof toolCall.result === 'string' 
                    ? toolCall.result 
                    : JSON.stringify(toolCall.result, null, 2)
                  }
                </div>
              </div>
            )}
            
            {toolCall.error && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-1">Error:</h4>
                <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded text-xs">
                  {toolCall.error}
                </div>
                {onRetry && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRetry(toolCall)}
                    className="mt-2 h-6 text-xs"
                  >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Retry
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
});

const MCPToolExecutionStatus = memo(({ 
  toolCalls = [], 
  isVisible, 
  onClose, 
  onRetry 
}: MCPToolExecutionStatusProps) => {
  const [autoScroll, setAutoScroll] = useState(true);
  
  // Statistics
  const stats = {
    total: toolCalls.length,
    running: toolCalls.filter(t => t.status === 'running').length,
    completed: toolCalls.filter(t => t.status === 'completed').length,
    error: toolCalls.filter(t => t.status === 'error').length,
    pending: toolCalls.filter(t => !t.status || t.status === 'pending').length
  };
  
  const progressPercentage = stats.total > 0 
    ? Math.round((stats.completed / stats.total) * 100) 
    : 0;
  
  // Auto scroll to bottom when new tools are added
  useEffect(() => {
    if (autoScroll) {
      const container = document.getElementById('mcp-tool-status-container');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [toolCalls.length, autoScroll]);
  
  if (!isVisible) return null;
  
  return (
    <Card className="w-96 max-h-96 flex flex-col border border-gray-200 dark:border-gray-700 shadow-xl bg-white dark:bg-gray-900 rounded-xl">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            MCP Tools ({stats.total})
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAutoScroll(!autoScroll)}
              className={`h-6 w-6 p-0 ${autoScroll ? 'text-blue-500' : 'text-muted-foreground'}`}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </Button>
            
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            )}
          </div>
        </div>
        
        {/* Progress Overview */}
        <div className="mt-3 space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress: {progressPercentage}%</span>
            <span>{stats.completed}/{stats.total} completed</span>
          </div>
          <Progress value={progressPercentage} className="w-full h-2" />
          
          <div className="flex space-x-4 text-xs">
            {stats.running > 0 && (
              <span className="text-blue-600">Running: {stats.running}</span>
            )}
            {stats.error > 0 && (
              <span className="text-red-600">Errors: {stats.error}</span>
            )}
            {stats.pending > 0 && (
              <span className="text-gray-600">Pending: {stats.pending}</span>
            )}
          </div>
        </div>
      </CardHeader>
      
      <Separator />
      
      <CardContent className="flex-1 overflow-hidden p-0">
        <div 
          id="mcp-tool-status-container"
          className="h-full overflow-y-auto p-4 space-y-2"
        >
          {toolCalls.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              </svg>
              <p className="text-sm">No MCP tools running</p>
              <p className="text-xs">Tool executions will appear here</p>
            </div>
          ) : (
            toolCalls.map((toolCall, index) => (
              <ToolCallCard
                key={`${toolCall.server}-${toolCall.tool}-${index}`}
                toolCall={toolCall}
                onRetry={onRetry}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
});

MCPToolExecutionStatus.displayName = 'MCPToolExecutionStatus';

export { MCPToolExecutionStatus, type MCPToolCall };
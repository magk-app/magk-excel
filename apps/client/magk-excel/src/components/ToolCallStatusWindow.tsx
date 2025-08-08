import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

interface ToolCall {
  id: string;
  server: string;
  tool: string;
  args: any;
  status: 'pending' | 'running' | 'completed' | 'error';
  result?: any;
  error?: string;
  duration?: number;
  startTime: number;
  endTime?: number;
}

interface ToolCallStatusWindowProps {
  toolCalls: ToolCall[];
  isOpen: boolean;
  onClose: () => void;
}

export function ToolCallStatusWindow({ toolCalls, isOpen, onClose }: ToolCallStatusWindowProps) {
  const [expandedCall, setExpandedCall] = useState<string | null>(null);

  const getStatusIcon = (status: ToolCall['status']) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'running': return '⚡';
      case 'completed': return '✅';
      case 'error': return '❌';
      default: return '🔧';
    }
  };

  const getStatusColor = (status: ToolCall['status']) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'running': return 'default';
      case 'completed': return 'secondary';
      case 'error': return 'destructive';
      default: return 'outline';
    }
  };

  const formatDuration = (startTime: number, endTime?: number) => {
    const duration = endTime ? endTime - startTime : Date.now() - startTime;
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(1)}s`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🔧 MCP Tool Execution Monitor
            <Badge variant="outline" className="ml-auto">
              {toolCalls.length} call{toolCalls.length !== 1 ? 's' : ''}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3">
          {toolCalls.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-4xl mb-2">🔧</div>
              <p>No tool calls yet</p>
              <p className="text-sm">MCP tool executions will appear here</p>
            </div>
          ) : (
            toolCalls.map((toolCall) => (
              <Card 
                key={toolCall.id} 
                className={`transition-all ${
                  toolCall.status === 'running' ? 'ring-2 ring-blue-200 dark:ring-blue-800' :
                  toolCall.status === 'error' ? 'ring-2 ring-red-200 dark:ring-red-800' :
                  toolCall.status === 'completed' ? 'ring-1 ring-green-200 dark:ring-green-800' : ''
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <span className="text-lg">{getStatusIcon(toolCall.status)}</span>
                        <span>{toolCall.tool}</span>
                        <Badge variant="outline" className="text-xs">
                          {toolCall.server}
                        </Badge>
                        <Badge 
                          variant={getStatusColor(toolCall.status)} 
                          className="text-xs capitalize"
                        >
                          {toolCall.status}
                        </Badge>
                      </CardTitle>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span>Started: {formatTimestamp(toolCall.startTime)}</span>
                        <span>Duration: {formatDuration(toolCall.startTime, toolCall.endTime)}</span>
                        {toolCall.endTime && (
                          <span>Finished: {formatTimestamp(toolCall.endTime)}</span>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedCall(
                        expandedCall === toolCall.id ? null : toolCall.id
                      )}
                      className="ml-2"
                    >
                      {expandedCall === toolCall.id ? '▼' : '▶'}
                    </Button>
                  </div>
                </CardHeader>

                {expandedCall === toolCall.id && (
                  <CardContent className="pt-0 space-y-4">
                    {/* Arguments */}
                    <div>
                      <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                        📝 Arguments
                      </h4>
                      <div className="bg-muted p-3 rounded-md">
                        <pre className="text-xs overflow-x-auto">
                          {JSON.stringify(toolCall.args, null, 2)}
                        </pre>
                      </div>
                    </div>

                    {/* Result or Error */}
                    {toolCall.status === 'completed' && toolCall.result && (
                      <div>
                        <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                          ✅ Result
                        </h4>
                        <div className="bg-green-50 dark:bg-green-950 p-3 rounded-md border border-green-200 dark:border-green-800">
                          <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                            {typeof toolCall.result === 'string' 
                              ? toolCall.result 
                              : JSON.stringify(toolCall.result, null, 2)
                            }
                          </pre>
                        </div>
                      </div>
                    )}

                    {toolCall.status === 'error' && toolCall.error && (
                      <div>
                        <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                          ❌ Error
                        </h4>
                        <div className="bg-red-50 dark:bg-red-950 p-3 rounded-md border border-red-200 dark:border-red-800">
                          <pre className="text-xs overflow-x-auto text-red-700 dark:text-red-300">
                            {toolCall.error}
                          </pre>
                        </div>
                      </div>
                    )}

                    {toolCall.status === 'running' && (
                      <div>
                        <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                          ⚡ Status
                        </h4>
                        <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center gap-2 text-sm">
                            <div className="animate-spin h-4 w-4 rounded-full border-2 border-current border-t-transparent"></div>
                            <span>Executing tool...</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Copy buttons */}
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(toolCall.args, null, 2));
                        }}
                        className="text-xs"
                      >
                        📋 Copy Args
                      </Button>
                      
                      {toolCall.result && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const resultText = typeof toolCall.result === 'string' 
                              ? toolCall.result 
                              : JSON.stringify(toolCall.result, null, 2);
                            navigator.clipboard.writeText(resultText);
                          }}
                          className="text-xs"
                        >
                          📋 Copy Result
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const fullLog = {
                            id: toolCall.id,
                            server: toolCall.server,
                            tool: toolCall.tool,
                            status: toolCall.status,
                            args: toolCall.args,
                            result: toolCall.result,
                            error: toolCall.error,
                            duration: toolCall.duration,
                            startTime: toolCall.startTime,
                            endTime: toolCall.endTime
                          };
                          navigator.clipboard.writeText(JSON.stringify(fullLog, null, 2));
                        }}
                        className="text-xs"
                      >
                        📋 Copy Full Log
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>

        {/* Summary Footer */}
        {toolCalls.length > 0 && (
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex gap-4">
                <span>
                  ✅ {toolCalls.filter(tc => tc.status === 'completed').length} completed
                </span>
                <span>
                  ⚡ {toolCalls.filter(tc => tc.status === 'running').length} running
                </span>
                <span>
                  ❌ {toolCalls.filter(tc => tc.status === 'error').length} failed
                </span>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const allLogs = toolCalls.map(tc => ({
                      id: tc.id,
                      server: tc.server,
                      tool: tc.tool,
                      status: tc.status,
                      args: tc.args,
                      result: tc.result,
                      error: tc.error,
                      duration: tc.duration,
                      startTime: tc.startTime,
                      endTime: tc.endTime
                    }));
                    navigator.clipboard.writeText(JSON.stringify(allLogs, null, 2));
                  }}
                  className="text-xs"
                >
                  📋 Export All
                </Button>
                
                <Button variant="outline" size="sm" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Hook for managing tool call state
export function useToolCallMonitor() {
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [isWindowOpen, setIsWindowOpen] = useState(false);

  const addToolCall = (server: string, tool: string, args: any) => {
    const id = `tool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newToolCall: ToolCall = {
      id,
      server,
      tool,
      args,
      status: 'pending',
      startTime: Date.now()
    };

    setToolCalls(prev => [...prev, newToolCall]);
    return id;
  };

  const updateToolCall = (id: string, updates: Partial<ToolCall>) => {
    setToolCalls(prev => prev.map(tc => 
      tc.id === id 
        ? { 
            ...tc, 
            ...updates,
            endTime: updates.status === 'completed' || updates.status === 'error' 
              ? Date.now() 
              : tc.endTime
          }
        : tc
    ));
  };

  const clearToolCalls = () => {
    setToolCalls([]);
  };

  const openWindow = () => setIsWindowOpen(true);
  const closeWindow = () => setIsWindowOpen(false);

  return {
    toolCalls,
    isWindowOpen,
    addToolCall,
    updateToolCall,
    clearToolCalls,
    openWindow,
    closeWindow
  };
}
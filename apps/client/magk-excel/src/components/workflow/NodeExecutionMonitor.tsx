/**
 * Example component demonstrating real-time node execution monitoring
 * using the NodeExecutionStore
 */

import React, { useEffect, useState } from 'react';
import { 
  useNodeExecutionStore, 
  useConnectionState, 
  useWorkflowNodes,
  NodeExecutionState 
} from '../../stores';
import { NodeStatus } from '../../types/workflow';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { AlertCircle, CheckCircle, Clock, Play, Wifi, WifiOff } from 'lucide-react';

interface NodeExecutionMonitorProps {
  workflowId: string;
  showConnectionStatus?: boolean;
  showLogs?: boolean;
}

export const NodeExecutionMonitor: React.FC<NodeExecutionMonitorProps> = ({
  workflowId,
  showConnectionStatus = true,
  showLogs = false,
}) => {
  const { connectionState, isConnected, reconnectAttempts } = useConnectionState();
  const workflowNodes = useWorkflowNodes(workflowId);
  const { connect, disconnect, getConnectionHealth } = useNodeExecutionStore(
    (state) => state.actions
  );

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Auto-connect on mount
  useEffect(() => {
    if (connectionState === 'disconnected') {
      connect();
    }
  }, [connectionState, connect]);

  const getStatusIcon = (status: NodeStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Play className="h-4 w-4 text-blue-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-500" />;
      case 'paused':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: NodeStatus) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'error':
        return 'destructive';
      case 'running':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'paused':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const selectedNode = selectedNodeId ? workflowNodes.find(n => n.nodeId === selectedNodeId) : null;

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      {showConnectionStatus && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Badge variant={isConnected ? 'default' : 'destructive'}>
                  {connectionState}
                </Badge>
                {reconnectAttempts > 0 && (
                  <span className="ml-2 text-sm text-muted-foreground">
                    Retry attempts: {reconnectAttempts}
                  </span>
                )}
              </div>
              <div className="space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => connect()}
                  disabled={isConnected}
                >
                  Connect
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={disconnect}
                  disabled={!isConnected}
                >
                  Disconnect
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Nodes Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow Nodes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {workflowNodes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No nodes found for this workflow</p>
            ) : (
              workflowNodes.map((node) => (
                <div
                  key={node.nodeId}
                  className={`flex items-center justify-between p-3 border rounded cursor-pointer hover:bg-accent ${
                    selectedNodeId === node.nodeId ? 'bg-accent' : ''
                  }`}
                  onClick={() => setSelectedNodeId(node.nodeId)}
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(node.status)}
                    <div>
                      <p className="font-medium">{node.nodeId}</p>
                      <p className="text-sm text-muted-foreground">
                        Last updated: {node.lastUpdated.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusBadgeVariant(node.status)}>
                      {node.status}
                    </Badge>
                    {node.progress && (
                      <div className="w-24">
                        <Progress 
                          value={node.progress.percentage || 0} 
                          className="h-2"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Selected Node Details */}
      {selectedNode && (
        <Card>
          <CardHeader>
            <CardTitle>Node Details: {selectedNode.nodeId}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress */}
            {selectedNode.progress && (
              <div>
                <h4 className="font-medium mb-2">Progress</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{selectedNode.progress.message || 'Processing...'}</span>
                    <span>{selectedNode.progress.current} / {selectedNode.progress.total}</span>
                  </div>
                  <Progress value={selectedNode.progress.percentage || 0} />
                  {selectedNode.progress.estimatedTimeRemaining && (
                    <p className="text-sm text-muted-foreground">
                      Estimated time remaining: {formatDuration(selectedNode.progress.estimatedTimeRemaining * 1000)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Error */}
            {selectedNode.error && (
              <div>
                <h4 className="font-medium mb-2 text-red-600">Error</h4>
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <p className="text-sm text-red-800">{selectedNode.error.message}</p>
                  {selectedNode.error.suggestions && selectedNode.error.suggestions.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-red-700">Suggestions:</p>
                      <ul className="text-xs text-red-600 list-disc list-inside">
                        {selectedNode.error.suggestions.map((suggestion, index) => (
                          <li key={index}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Metadata */}
            {selectedNode.metadata && (
              <div>
                <h4 className="font-medium mb-2">Metadata</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {selectedNode.metadata.executionTime && (
                    <div>
                      <span className="text-muted-foreground">Execution Time:</span>
                      <span className="ml-2">{formatDuration(selectedNode.metadata.executionTime)}</span>
                    </div>
                  )}
                  {selectedNode.metadata.rowsProcessed && (
                    <div>
                      <span className="text-muted-foreground">Rows Processed:</span>
                      <span className="ml-2">{selectedNode.metadata.rowsProcessed.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedNode.metadata.memoryUsage && (
                    <div>
                      <span className="text-muted-foreground">Memory Usage:</span>
                      <span className="ml-2">{(selectedNode.metadata.memoryUsage / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Result */}
            {selectedNode.result && (
              <div>
                <h4 className="font-medium mb-2">Result</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {selectedNode.result.rowCount && (
                    <div>
                      <span className="text-muted-foreground">Rows:</span>
                      <span className="ml-2">{selectedNode.result.rowCount.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedNode.result.columnCount && (
                    <div>
                      <span className="text-muted-foreground">Columns:</span>
                      <span className="ml-2">{selectedNode.result.columnCount}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Logs */}
            {showLogs && selectedNode.logs.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Logs</h4>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {selectedNode.logs.slice(-10).map((log, index) => (
                    <div key={index} className="text-xs p-2 bg-muted rounded">
                      <div className="flex justify-between">
                        <span className={`font-medium ${
                          log.level === 'error' ? 'text-red-600' :
                          log.level === 'warn' ? 'text-yellow-600' :
                          log.level === 'info' ? 'text-blue-600' :
                          'text-gray-600'
                        }`}>
                          {log.level.toUpperCase()}
                        </span>
                        <span className="text-muted-foreground">
                          {log.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <p>{log.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NodeExecutionMonitor;
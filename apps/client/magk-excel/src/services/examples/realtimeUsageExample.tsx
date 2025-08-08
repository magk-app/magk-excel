/**
 * Example usage of the real-time connection services
 * Demonstrates how to integrate RealtimeService and RealtimeAdapter with React components
 */

import React, { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { 
  useRealtimeIntegration,
  useWorkflowRealtime,
  useNodeRealtime,
  createRealtimeAdapter,
  RealtimeAdapter,
  WorkflowController
} from '../index';
import { useNodeExecutionStore } from '../../stores/nodeExecutionStore';
import type { WorkflowEvent, NodeStatus } from '../../types/workflow';

/**
 * Example component demonstrating basic real-time integration
 */
export function BasicRealtimeExample() {
  const integration = useRealtimeIntegration({
    backendBaseUrl: 'http://localhost:8000',
    enableAutoReconnect: true,
    enableDebugLogging: true,
  });

  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');

  useEffect(() => {
    const updateStatus = () => {
      const status = integration.getStatus();
      setConnectionStatus(status.isConnected ? 'connected' : 'disconnected');
    };

    updateStatus();
    const interval = setInterval(updateStatus, 1000);

    return () => clearInterval(interval);
  }, [integration]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Real-time Connection</CardTitle>
        <CardDescription>Basic connection status and controls</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span>Status:</span>
          <Badge variant={connectionStatus === 'connected' ? 'default' : 'destructive'}>
            {connectionStatus}
          </Badge>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={integration.connect}
            disabled={connectionStatus === 'connected'}
            size="sm"
          >
            Connect
          </Button>
          <Button 
            onClick={integration.disconnect}
            disabled={connectionStatus === 'disconnected'}
            variant="outline"
            size="sm"
          >
            Disconnect
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Example component for workflow-specific real-time monitoring
 */
export function WorkflowMonitorExample({ workflowId }: { workflowId: string }) {
  const workflowRealtime = useWorkflowRealtime(workflowId, {
    enableDebugLogging: true,
  });
  
  const workflowNodes = useNodeExecutionStore(state => 
    Array.from(state.nodeStates.values()).filter(node => node.workflowId === workflowId)
  );
  
  const [events, setEvents] = useState<WorkflowEvent[]>([]);

  useEffect(() => {
    if (workflowRealtime.adapter) {
      const subscriptionId = workflowRealtime.adapter.subscribeToWorkflow(
        workflowId,
        (event: WorkflowEvent) => {
          setEvents(prev => [event, ...prev].slice(0, 10)); // Keep last 10 events
        }
      );

      return () => {
        if (subscriptionId) {
          workflowRealtime.unsubscribe(subscriptionId);
        }
      };
    }
  }, [workflowRealtime.adapter, workflowId]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Workflow Monitor: {workflowId}</CardTitle>
          <CardDescription>
            Real-time workflow execution monitoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <span className="text-sm text-muted-foreground">Connection:</span>
              <Badge variant={workflowRealtime.getStatus().isConnected ? 'default' : 'destructive'}>
                {workflowRealtime.getStatus().isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Nodes:</span>
              <span className="ml-2">{workflowNodes.length}</span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Nodes Status:</h4>
            {workflowNodes.map(node => (
              <NodeStatusDisplay key={node.nodeId} node={node} />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {events.map((event, index) => (
              <div key={index} className="text-sm p-2 bg-muted rounded">
                <div className="flex justify-between">
                  <span className="font-medium">{event.type}</span>
                  <span className="text-muted-foreground">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                {event.nodeId && (
                  <div className="text-muted-foreground">Node: {event.nodeId}</div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Component for displaying node status with real-time updates
 */
function NodeStatusDisplay({ node }: { node: any }) {
  const getStatusColor = (status: NodeStatus) => {
    switch (status) {
      case 'running': return 'default';
      case 'completed': return 'default';
      case 'error': return 'destructive';
      case 'pending': return 'secondary';
      case 'paused': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div className="flex items-center justify-between p-2 border rounded">
      <div>
        <div className="font-medium text-sm">{node.nodeId}</div>
        <div className="text-xs text-muted-foreground">
          Updated: {new Date(node.lastUpdated).toLocaleTimeString()}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {node.progress && (
          <div className="text-xs">
            {node.progress.percentage?.toFixed(0)}%
          </div>
        )}
        <Badge variant={getStatusColor(node.status)}>
          {node.status}
        </Badge>
      </div>
    </div>
  );
}

/**
 * Example component for workflow control operations
 */
export function WorkflowControlExample({ workflowId }: { workflowId: string }) {
  const [adapter, setAdapter] = useState<RealtimeAdapter | null>(null);
  const [controller, setController] = useState<WorkflowController | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<string>('');

  useEffect(() => {
    const initAdapter = async () => {
      const newAdapter = createRealtimeAdapter({
        backendBaseUrl: 'http://localhost:8000',
        enableHealthCheck: true,
      });
      
      await newAdapter.connect();
      setAdapter(newAdapter);
      setController(new WorkflowController(newAdapter, workflowId));
    };

    initAdapter();

    return () => {
      if (adapter) {
        adapter.disconnect();
      }
    };
  }, [workflowId]);

  const executeCommand = async (commandName: string, commandFn: () => Promise<any>) => {
    if (!controller) return;
    
    setIsLoading(true);
    try {
      const response = await commandFn();
      setLastResponse(`${commandName}: ${response.success ? 'Success' : 'Failed'}`);
    } catch (error) {
      setLastResponse(`${commandName}: Error - ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workflow Control</CardTitle>
        <CardDescription>Send commands to workflow execution</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Button 
            onClick={() => executeCommand('Start', () => controller!.start())}
            disabled={!controller || isLoading}
            size="sm"
          >
            Start
          </Button>
          <Button 
            onClick={() => executeCommand('Stop', () => controller!.stop())}
            disabled={!controller || isLoading}
            variant="destructive"
            size="sm"
          >
            Stop
          </Button>
          <Button 
            onClick={() => executeCommand('Pause', () => controller!.pause())}
            disabled={!controller || isLoading}
            variant="outline"
            size="sm"
          >
            Pause
          </Button>
          <Button 
            onClick={() => executeCommand('Resume', () => controller!.resume())}
            disabled={!controller || isLoading}
            variant="outline"
            size="sm"
          >
            Resume
          </Button>
        </div>

        {lastResponse && (
          <div className="text-sm p-2 bg-muted rounded">
            <strong>Last Response:</strong> {lastResponse}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Example component for node-specific monitoring
 */
export function NodeMonitorExample({ 
  nodeId, 
  workflowId 
}: { 
  nodeId: string; 
  workflowId: string; 
}) {
  const nodeRealtime = useNodeRealtime(nodeId, workflowId);
  const nodeState = useNodeExecutionStore(state => state.nodeStates.get(nodeId));
  
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    if (nodeRealtime.adapter) {
      const subscriptionId = nodeRealtime.adapter.subscribeToNode(
        nodeId,
        workflowId,
        (event) => {
          if (event.logs) {
            const newLogs = event.logs.map((log: any) => 
              `${new Date(log.timestamp).toLocaleTimeString()}: ${log.message}`
            );
            setLogs(prev => [...prev, ...newLogs].slice(-20)); // Keep last 20 logs
          }
        }
      );

      return () => {
        if (subscriptionId) {
          nodeRealtime.unsubscribe(subscriptionId);
        }
      };
    }
  }, [nodeRealtime.adapter, nodeId, workflowId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Node Monitor: {nodeId}</CardTitle>
        <CardDescription>Real-time node execution details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {nodeState && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">Status:</span>
              <Badge className="ml-2">{nodeState.status}</Badge>
            </div>
            {nodeState.progress && (
              <div>
                <span className="text-sm text-muted-foreground">Progress:</span>
                <span className="ml-2">{nodeState.progress.percentage?.toFixed(0)}%</span>
              </div>
            )}
          </div>
        )}

        <div>
          <h4 className="text-sm font-medium mb-2">Recent Logs:</h4>
          <div className="bg-muted p-2 rounded text-xs max-h-32 overflow-y-auto">
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <div key={index}>{log}</div>
              ))
            ) : (
              <div className="text-muted-foreground">No logs available</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Main demo component showcasing all examples
 */
export function RealtimeServiceDemo() {
  const [selectedWorkflowId] = useState('demo-workflow-1');
  const [selectedNodeId] = useState('demo-node-1');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Real-time Service Demo</h1>
        <p className="text-muted-foreground mt-2">
          Demonstration of real-time WebSocket and EventSource integration
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BasicRealtimeExample />
        <WorkflowControlExample workflowId={selectedWorkflowId} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WorkflowMonitorExample workflowId={selectedWorkflowId} />
        <NodeMonitorExample 
          nodeId={selectedNodeId} 
          workflowId={selectedWorkflowId} 
        />
      </div>
    </div>
  );
}

export default RealtimeServiceDemo;
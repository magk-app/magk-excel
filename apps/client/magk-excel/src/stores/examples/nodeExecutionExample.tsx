/**
 * Example usage of NodeExecutionStore in a React component
 * This demonstrates the most common patterns for using the store
 */

import React, { useEffect, useState } from 'react';
import { 
  useNodeExecutionStore, 
  useNodeState, 
  useConnectionState, 
  useWorkflowNodes 
} from '../index';
import { NodeStatus } from '../../types/workflow';

// Example 1: Basic node status monitoring
export const BasicNodeMonitor: React.FC<{ nodeId: string }> = ({ nodeId }) => {
  const nodeState = useNodeState(nodeId);
  
  if (!nodeState) {
    return <div>Node not found or not started</div>;
  }

  return (
    <div className="p-4 border rounded">
      <h3>Node: {nodeState.nodeId}</h3>
      <p>Status: <span className={`badge ${nodeState.status}`}>{nodeState.status}</span></p>
      <p>Last Updated: {nodeState.lastUpdated.toLocaleTimeString()}</p>
      
      {nodeState.progress && (
        <div>
          <p>Progress: {nodeState.progress.percentage}%</p>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${nodeState.progress.percentage}%` }}
            />
          </div>
          {nodeState.progress.message && <p>{nodeState.progress.message}</p>}
        </div>
      )}
      
      {nodeState.error && (
        <div className="error">
          <p>Error: {nodeState.error.message}</p>
          {nodeState.error.suggestions && (
            <ul>
              {nodeState.error.suggestions.map((suggestion, i) => (
                <li key={i}>{suggestion}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

// Example 2: Workflow execution dashboard
export const WorkflowDashboard: React.FC<{ workflowId: string }> = ({ workflowId }) => {
  const { isConnected, connectionState } = useConnectionState();
  const workflowNodes = useWorkflowNodes(workflowId);
  const { connect, disconnect } = useNodeExecutionStore(state => state.actions);
  
  // Auto-connect on mount
  useEffect(() => {
    if (!isConnected) {
      connect();
    }
  }, [isConnected, connect]);

  const getStatusCounts = () => {
    const counts: Record<NodeStatus, number> = {
      pending: 0,
      running: 0,
      completed: 0,
      error: 0,
      paused: 0,
    };
    
    workflowNodes.forEach(node => {
      counts[node.status]++;
    });
    
    return counts;
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="dashboard">
      <div className="header">
        <h2>Workflow: {workflowId}</h2>
        <div className="connection-status">
          <span className={`status-indicator ${connectionState}`}>
            {connectionState}
          </span>
          <button onClick={() => isConnected ? disconnect() : connect()}>
            {isConnected ? 'Disconnect' : 'Connect'}
          </button>
        </div>
      </div>
      
      <div className="status-summary">
        <div className="status-card">
          <h4>Pending</h4>
          <span className="count">{statusCounts.pending}</span>
        </div>
        <div className="status-card">
          <h4>Running</h4>
          <span className="count">{statusCounts.running}</span>
        </div>
        <div className="status-card">
          <h4>Completed</h4>
          <span className="count">{statusCounts.completed}</span>
        </div>
        <div className="status-card error">
          <h4>Error</h4>
          <span className="count">{statusCounts.error}</span>
        </div>
      </div>
      
      <div className="nodes-list">
        {workflowNodes.map(node => (
          <BasicNodeMonitor key={node.nodeId} nodeId={node.nodeId} />
        ))}
      </div>
    </div>
  );
};

// Example 3: Real-time subscription to specific node updates
export const NodeSubscriptionExample: React.FC<{ nodeId: string }> = ({ nodeId }) => {
  const [updates, setUpdates] = useState<string[]>([]);
  const { subscribe, unsubscribe } = useNodeExecutionStore(state => state.actions);
  
  useEffect(() => {
    // Subscribe to all updates for this node
    const subscriptionId = subscribe(
      nodeId,
      (nodeState) => {
        const updateMessage = `${new Date().toLocaleTimeString()}: ${nodeState.status}`;
        setUpdates(prev => [...prev.slice(-9), updateMessage]); // Keep last 10 updates
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe(subscriptionId);
  }, [nodeId, subscribe, unsubscribe]);

  return (
    <div className="subscription-example">
      <h3>Real-time Updates for {nodeId}</h3>
      <div className="updates-log">
        {updates.length === 0 ? (
          <p>No updates yet...</p>
        ) : (
          <ul>
            {updates.map((update, index) => (
              <li key={index}>{update}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

// Example 4: Manual node control
export const NodeController: React.FC<{ nodeId: string; workflowId: string }> = ({ 
  nodeId, 
  workflowId 
}) => {
  const nodeState = useNodeState(nodeId);
  const { 
    updateNodeStatus, 
    updateNodeProgress, 
    updateNodeError,
    addNodeLog 
  } = useNodeExecutionStore(state => state.actions);

  const handleStartNode = () => {
    updateNodeStatus(nodeId, workflowId, 'running');
    addNodeLog(nodeId, workflowId, {
      timestamp: new Date(),
      level: 'info',
      message: 'Node started manually',
      category: 'manual',
    });
  };

  const handleUpdateProgress = () => {
    const current = (nodeState?.progress?.current || 0) + 10;
    const total = 100;
    updateNodeProgress(nodeId, workflowId, {
      current,
      total,
      percentage: (current / total) * 100,
      message: `Processing step ${current}/${total}`,
    });
  };

  const handleCompleteNode = () => {
    updateNodeStatus(nodeId, workflowId, 'completed');
    addNodeLog(nodeId, workflowId, {
      timestamp: new Date(),
      level: 'info',
      message: 'Node completed successfully',
      category: 'manual',
    });
  };

  const handleErrorNode = () => {
    updateNodeError(nodeId, workflowId, {
      message: 'Simulated error for testing',
      code: 'TEST_ERROR',
      recoverable: true,
      suggestions: ['This is a test error', 'Try restarting the node'],
      timestamp: new Date(),
    });
  };

  return (
    <div className="node-controller">
      <h3>Manual Control for {nodeId}</h3>
      <p>Current Status: {nodeState?.status || 'Not initialized'}</p>
      
      <div className="controls">
        <button onClick={handleStartNode} disabled={nodeState?.status === 'running'}>
          Start Node
        </button>
        <button onClick={handleUpdateProgress} disabled={nodeState?.status !== 'running'}>
          Update Progress
        </button>
        <button onClick={handleCompleteNode} disabled={nodeState?.status !== 'running'}>
          Complete Node
        </button>
        <button onClick={handleErrorNode}>
          Simulate Error
        </button>
      </div>
      
      {nodeState?.progress && (
        <div className="progress-display">
          <p>Progress: {nodeState.progress.current}/{nodeState.progress.total}</p>
          <progress value={nodeState.progress.current} max={nodeState.progress.total} />
        </div>
      )}
    </div>
  );
};

// Example 5: Connection health monitor
export const ConnectionHealthMonitor: React.FC = () => {
  const { connectionState, reconnectAttempts } = useConnectionState();
  const { getConnectionHealth } = useNodeExecutionStore(state => state.actions);
  const [health, setHealth] = useState(getConnectionHealth());

  useEffect(() => {
    const interval = setInterval(() => {
      setHealth(getConnectionHealth());
    }, 1000);

    return () => clearInterval(interval);
  }, [getConnectionHealth]);

  return (
    <div className="connection-health">
      <h3>Connection Health</h3>
      <div className={`health-indicator ${health.isHealthy ? 'healthy' : 'unhealthy'}`}>
        <p>Status: {health.isHealthy ? 'Healthy' : 'Issues Detected'}</p>
        <p>Connection: {connectionState}</p>
        {reconnectAttempts > 0 && <p>Reconnect Attempts: {reconnectAttempts}</p>}
      </div>
      
      {health.issues.length > 0 && (
        <div className="issues">
          <h4>Issues:</h4>
          <ul>
            {health.issues.map((issue, index) => (
              <li key={index}>{issue}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// Example 6: Complete application example
export const NodeExecutionApp: React.FC = () => {
  const [selectedWorkflow, setSelectedWorkflow] = useState('workflow-1');
  const [selectedNode, setSelectedNode] = useState('node-1');

  return (
    <div className="node-execution-app">
      <div className="app-header">
        <h1>MAGK Excel Node Execution Monitor</h1>
        <ConnectionHealthMonitor />
      </div>
      
      <div className="main-content">
        <div className="sidebar">
          <div className="workflow-selector">
            <label>Workflow:</label>
            <select 
              value={selectedWorkflow} 
              onChange={(e) => setSelectedWorkflow(e.target.value)}
            >
              <option value="workflow-1">Workflow 1</option>
              <option value="workflow-2">Workflow 2</option>
            </select>
          </div>
          
          <div className="node-selector">
            <label>Node:</label>
            <select 
              value={selectedNode} 
              onChange={(e) => setSelectedNode(e.target.value)}
            >
              <option value="node-1">Node 1</option>
              <option value="node-2">Node 2</option>
              <option value="node-3">Node 3</option>
            </select>
          </div>
        </div>
        
        <div className="content">
          <WorkflowDashboard workflowId={selectedWorkflow} />
          <div className="node-details">
            <BasicNodeMonitor nodeId={selectedNode} />
            <NodeController nodeId={selectedNode} workflowId={selectedWorkflow} />
            <NodeSubscriptionExample nodeId={selectedNode} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NodeExecutionApp;
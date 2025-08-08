/**
 * Workflow Store Editor - Integrates WorkflowDemo with workflow store
 * This component bridges the gap between the store and the demo visualization
 */

import React, { useState, useEffect } from 'react';
import WorkflowCanvas from './WorkflowCanvas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  WorkflowNode, 
  WorkflowEdge, 
  NodeStatus,
  NodeProgress,
  WebScrapingConfig,
  ExcelExportConfig,
  TransformConfig
} from '@/types/workflow';
import { useWorkflowStore } from '@/stores/workflowStore';
import { Plus, Save, Play, Pause, Settings, Edit2, Check, X } from 'lucide-react';

export const WorkflowStoreEditor: React.FC = () => {
  const { 
    activeWorkflow,
    addNode,
    updateNode,
    deleteNode,
    addEdge: addEdgeToStore,
    saveWorkflow,
    isDirty,
    setDirty
  } = useWorkflowStore();

  // Local state only for UI
  const [isRunning, setIsRunning] = useState(false);
  const [editingWorkflowName, setEditingWorkflowName] = useState(false);
  const [workflowNameInput, setWorkflowNameInput] = useState('');

  // Get nodes and edges directly from activeWorkflow
  const nodes = activeWorkflow?.nodes || [];
  const edges = activeWorkflow?.edges || [];
  
  // Debug logging for nodes and edges
  useEffect(() => {
    console.log('📊 WorkflowStoreEditor - Nodes/Edges State:', {
      workflowId: activeWorkflow?.id,
      workflowName: activeWorkflow?.name,
      nodesCount: nodes.length,
      edgesCount: edges.length,
      nodes: nodes,
      edges: edges
    });
  }, [nodes, edges, activeWorkflow]);

  // Initialize with default nodes if empty
  useEffect(() => {
    console.log('🔄 WorkflowStoreEditor: activeWorkflow changed', activeWorkflow);
    
    if (activeWorkflow && (!activeWorkflow.nodes || activeWorkflow.nodes.length === 0)) {
      // Create default starter nodes for new workflow
      const starterNodes: WorkflowNode[] = [
          {
            id: 'web-scraping-1',
            type: 'web-scraping',
            position: { x: 150, y: 150 },
            data: {
              type: 'web-scraping',
              status: 'pending',
              config: {
                id: 'web-scraping-1',
                name: 'Extract Data',
                description: 'Configure your data source',
                url: 'https://example.com',
                extractFormat: 'table',
                useFirecrawl: true
              } as WebScrapingConfig
            }
          },
          {
            id: 'transform-1',
            type: 'transform',
            position: { x: 450, y: 150 },
            data: {
              type: 'transform',
              status: 'pending',
              config: {
                id: 'transform-1',
                name: 'Process Data',
                description: 'Transform and clean your data',
                operations: []
              } as TransformConfig
            }
          },
          {
            id: 'excel-export-1',
            type: 'excel-export',
            position: { x: 750, y: 150 },
            data: {
              type: 'excel-export',
              status: 'pending',
              config: {
                id: 'excel-export-1',
                name: 'Export to Excel',
                description: 'Save processed data to Excel',
                outputPath: '/output.xlsx',
                sheetName: 'Sheet1'
              } as ExcelExportConfig
            }
          }
        ];

        const starterEdges: WorkflowEdge[] = [
          {
            id: 'edge-1',
            source: 'web-scraping-1',
            target: 'transform-1',
            type: 'smoothstep'
          },
          {
            id: 'edge-2',
            source: 'transform-1',
            target: 'excel-export-1',
            type: 'smoothstep'
          }
        ];

        // Update the store with these nodes
        starterNodes.forEach(node => addNode(node));
        starterEdges.forEach(edge => addEdgeToStore(edge));
        setDirty(true);
      }
  }, [activeWorkflow?.id, addNode, addEdgeToStore, setDirty]); // Only re-run when workflow ID changes

  // Handle node click
  const handleNodeClick = (_event: React.MouseEvent, node: any) => {
    console.log('Node clicked:', node);
  };

  // Handle node double-click
  const handleNodeDoubleClick = (_event: React.MouseEvent, node: any) => {
    console.log('Node double-clicked:', node);
    // Could open a properties panel here
  };

  // Handle save
  const handleSave = () => {
    if (activeWorkflow) {
      saveWorkflow(activeWorkflow.id);
      console.log('✅ Workflow saved:', activeWorkflow.name);
    }
  };

  // Handle run workflow
  const handleRunWorkflow = () => {
    if (isRunning) return;
    
    setIsRunning(true);
    console.log('▶️ Running workflow:', activeWorkflow?.name);
    
    // Simulate execution
    setTimeout(() => {
      setIsRunning(false);
      console.log('✅ Workflow completed');
    }, 3000);
  };

  // Handle workflow name edit
  const handleEditWorkflowName = () => {
    if (activeWorkflow) {
      setWorkflowNameInput(activeWorkflow.name);
      setEditingWorkflowName(true);
    }
  };

  const handleSaveWorkflowName = () => {
    if (activeWorkflow && workflowNameInput) {
      activeWorkflow.name = workflowNameInput;
      setDirty(true);
      setEditingWorkflowName(false);
    }
  };

  // Add a new node
  const handleAddNode = () => {
    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      type: 'transform',
      position: { x: Math.random() * 400 + 200, y: Math.random() * 300 + 100 },
      data: {
        type: 'transform',
        status: 'pending',
        config: {
          id: `config-${Date.now()}`,
          name: 'New Node',
          description: 'Configure this node',
          operations: []
        } as TransformConfig
      }
    };
    
    addNode(newNode);
    setDirty(true);
  };

  if (!activeWorkflow) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <CardTitle>No Active Workflow</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-muted-foreground">
            Create a new workflow or select one from the library to get started.
          </CardContent>
        </Card>
      </div>
    );
  }

  const getWorkflowStatus = () => {
    const statuses = nodes.map(node => node.data.status);
    if (statuses.includes('running')) return 'running';
    if (statuses.includes('error')) return 'error';
    if (statuses.every(status => status === 'completed')) return 'completed';
    return 'ready';
  };

  const workflowStatus = getWorkflowStatus();

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <Card className="m-4 mb-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {editingWorkflowName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={workflowNameInput}
                    onChange={(e) => setWorkflowNameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveWorkflowName();
                      if (e.key === 'Escape') setEditingWorkflowName(false);
                    }}
                    className="h-8 w-64"
                    autoFocus
                  />
                  <Button size="sm" variant="ghost" onClick={handleSaveWorkflowName}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingWorkflowName(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">{activeWorkflow.name}</CardTitle>
                  <Button size="sm" variant="ghost" onClick={handleEditWorkflowName}>
                    <Edit2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
              <Badge variant="outline" className="ml-2">
                {activeWorkflow.type}
              </Badge>
              {isDirty && (
                <Badge variant="secondary">Unsaved</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant={workflowStatus === 'completed' ? 'default' : 'secondary'}
                className="capitalize"
              >
                {workflowStatus}
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddNode}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Node
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleSave}
                disabled={!isDirty}
              >
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
              <Button
                onClick={handleRunWorkflow}
                disabled={isRunning}
                size="sm"
              >
                {isRunning ? (
                  <>
                    <Pause className="h-4 w-4 mr-1" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-1" />
                    Run
                  </>
                )}
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {activeWorkflow.description || `Workflow ID: ${activeWorkflow.id}`}
          </p>
        </CardHeader>
      </Card>

      {/* Workflow Canvas */}
      <div className="flex-1 m-4 mt-2 border border-border rounded-lg overflow-hidden bg-background">
        <WorkflowCanvas
          nodes={nodes}
          edges={edges}
          onNodeClick={handleNodeClick}
          onNodeDoubleClick={handleNodeDoubleClick}
        />
      </div>

      {/* Status Bar */}
      <Card className="m-4 mt-0">
        <CardContent className="pt-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gray-400"></div>
                <span>Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-500"></div>
                <span>Running</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-500"></div>
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-red-500"></div>
                <span>Error</span>
              </div>
            </div>
            <div className="text-muted-foreground">
              {nodes.length} nodes • {edges.length} connections
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkflowStoreEditor;
/**
 * WorkflowBuilder - Complete workflow building interface with React Flow
 * Supports drag-and-drop, execution, and real-time status updates
 */

import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  Connection,
  Edge,
  Node,
  NodeTypes,
  MarkerType,
  Panel,
  useKeyPress,
  useOnSelectionChange,
  getRectOfNodes,
  getTransformForBounds,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { 
  Play, 
  Pause, 
  Square, 
  Save, 
  Download, 
  Upload,
  Trash2,
  Copy,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid3x3,
  Eye,
  EyeOff,
  Settings,
  Code,
  FileText,
  Database,
  Globe,
  FileJson,
  Terminal,
  Sparkles,
  ChevronLeft,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Import custom node types
import { WorkflowNodeTypes, nodeTypes } from './WorkflowNodeTypes';
import { WorkflowBlockLibrary } from './WorkflowBlockLibrary';
import { WorkflowExecutionEngine } from '../../services/workflow/WorkflowExecutionEngine';
import { useWorkflowStore } from '@/stores/workflowStore';

// Types
interface WorkflowBuilderProps {
  initialWorkflow?: any;
  onSave?: (workflow: any) => void;
  onExecute?: (workflow: any) => void;
  mode?: 'create' | 'edit' | 'view';
}

interface ExecutionStatus {
  nodeId: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  output?: any;
  error?: string;
  startTime?: Date;
  endTime?: Date;
}

const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({
  initialWorkflow,
  onSave,
  onExecute,
  mode = 'create'
}) => {
  // React Flow setup
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialWorkflow?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialWorkflow?.edges || []);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  
  // UI state
  const [showBlockLibrary, setShowBlockLibrary] = useState(true);
  const [showMinimap, setShowMinimap] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);
  const [selectedEdges, setSelectedEdges] = useState<Edge[]>([]);
  
  // Execution state
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionStatus, setExecutionStatus] = useState<Map<string, ExecutionStatus>>(new Map());
  const [executionEngine] = useState(() => new WorkflowExecutionEngine());
  
  // Workflow metadata
  const [workflowName, setWorkflowName] = useState(initialWorkflow?.name || 'Untitled Workflow');
  const [workflowDescription, setWorkflowDescription] = useState(initialWorkflow?.description || '');
  
  // Toast for notifications
  const { toast } = useToast();
  
  // History for undo/redo
  const [history, setHistory] = useState<{ nodes: Node[], edges: Edge[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Keyboard shortcuts
  const deletePressed = useKeyPress('Delete');
  const ctrlZ = useKeyPress(['Control+z', 'Meta+z']);
  const ctrlY = useKeyPress(['Control+y', 'Meta+y']);
  const ctrlS = useKeyPress(['Control+s', 'Meta+s']);
  const ctrlC = useKeyPress(['Control+c', 'Meta+c']);
  const ctrlV = useKeyPress(['Control+v', 'Meta+v']);
  
  // Handle node/edge selection
  useOnSelectionChange({
    onChange: ({ nodes, edges }) => {
      setSelectedNodes(nodes);
      setSelectedEdges(edges);
    },
  });
  
  // Connection validation
  const isValidConnection = useCallback((connection: Connection) => {
    // Add custom validation logic here
    // For example, check if connection types are compatible
    return true;
  }, []);
  
  // Handle connections
  const onConnect = useCallback((params: Connection | Edge) => {
    setEdges((eds) => addEdge({
      ...params,
      type: 'smoothstep',
      animated: true,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
      },
    }, eds));
    saveToHistory();
  }, [setEdges]);
  
  // Save to history for undo/redo
  const saveToHistory = useCallback(() => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ nodes: [...nodes], edges: [...edges] });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [nodes, edges, history, historyIndex]);
  
  // Undo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setNodes(prevState.nodes);
      setEdges(prevState.edges);
      setHistoryIndex(historyIndex - 1);
    }
  }, [history, historyIndex, setNodes, setEdges]);
  
  // Redo
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      setHistoryIndex(historyIndex + 1);
    }
  }, [history, historyIndex, setNodes, setEdges]);
  
  // Delete selected nodes/edges
  const handleDelete = useCallback(() => {
    if (selectedNodes.length > 0) {
      setNodes((nds) => nds.filter((node) => !selectedNodes.find((n) => n.id === node.id)));
    }
    if (selectedEdges.length > 0) {
      setEdges((eds) => eds.filter((edge) => !selectedEdges.find((e) => e.id === edge.id)));
    }
    saveToHistory();
  }, [selectedNodes, selectedEdges, setNodes, setEdges, saveToHistory]);
  
  // Duplicate selected nodes
  const handleDuplicate = useCallback(() => {
    if (selectedNodes.length > 0) {
      const newNodes = selectedNodes.map((node) => ({
        ...node,
        id: `${node.id}_copy_${Date.now()}`,
        position: {
          x: node.position.x + 50,
          y: node.position.y + 50,
        },
        selected: false,
      }));
      setNodes((nds) => [...nds, ...newNodes]);
      saveToHistory();
    }
  }, [selectedNodes, setNodes, saveToHistory]);
  
  // Handle drag over
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);
  
  // Handle drop
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      
      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const blockData = event.dataTransfer.getData('application/reactflow');
      
      if (!blockData || !reactFlowBounds || !reactFlowInstance) return;
      
      const block = JSON.parse(blockData);
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });
      
      const newNode: Node = {
        id: `${block.type}_${Date.now()}`,
        type: block.type,
        position,
        data: {
          ...block.data,
          label: block.label,
          status: 'pending',
        },
      };
      
      setNodes((nds) => nds.concat(newNode));
      saveToHistory();
      
      toast({
        title: 'Block Added',
        description: `Added ${block.label} to workflow`,
      });
    },
    [reactFlowInstance, setNodes, saveToHistory, toast]
  );
  
  // Execute workflow
  const handleExecute = useCallback(async () => {
    if (nodes.length === 0) {
      toast({
        title: 'No nodes to execute',
        description: 'Add some nodes to your workflow first',
        variant: 'destructive',
      });
      return;
    }
    
    setIsExecuting(true);
    const statusMap = new Map<string, ExecutionStatus>();
    
    // Initialize all nodes as pending
    nodes.forEach((node) => {
      statusMap.set(node.id, {
        nodeId: node.id,
        status: 'pending',
      });
    });
    setExecutionStatus(statusMap);
    
    try {
      // Execute workflow using the execution engine
      await executionEngine.execute(
        { nodes, edges },
        (nodeId, status, output, error) => {
          // Update execution status in real-time
          setExecutionStatus((prevStatus) => {
            const newStatus = new Map(prevStatus);
            const nodeStatus = newStatus.get(nodeId) || { nodeId, status: 'pending' };
            
            newStatus.set(nodeId, {
              ...nodeStatus,
              status,
              output,
              error,
              endTime: status === 'completed' || status === 'error' ? new Date() : undefined,
            });
            
            // Update node data with status
            setNodes((nds) =>
              nds.map((node) =>
                node.id === nodeId
                  ? { ...node, data: { ...node.data, status, output, error } }
                  : node
              )
            );
            
            return newStatus;
          });
        }
      );
      
      toast({
        title: 'Workflow Executed',
        description: 'All nodes have been processed successfully',
      });
      
      if (onExecute) {
        onExecute({ nodes, edges, executionStatus: statusMap });
      }
    } catch (error) {
      console.error('Workflow execution failed:', error);
      toast({
        title: 'Execution Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsExecuting(false);
    }
  }, [nodes, edges, executionEngine, toast, onExecute, setNodes]);
  
  // Save workflow
  const handleSave = useCallback(() => {
    const workflow = {
      id: initialWorkflow?.id || `workflow_${Date.now()}`,
      name: workflowName,
      description: workflowDescription,
      nodes,
      edges,
      metadata: {
        createdAt: initialWorkflow?.metadata?.createdAt || new Date(),
        updatedAt: new Date(),
        version: (initialWorkflow?.metadata?.version || 0) + 1,
      },
    };
    
    if (onSave) {
      onSave(workflow);
    }
    
    // Save to local storage
    localStorage.setItem(`workflow_${workflow.id}`, JSON.stringify(workflow));
    
    toast({
      title: 'Workflow Saved',
      description: `${workflowName} has been saved successfully`,
    });
  }, [workflowName, workflowDescription, nodes, edges, initialWorkflow, onSave, toast]);
  
  // Export workflow as JSON
  const handleExport = useCallback(() => {
    const workflow = {
      name: workflowName,
      description: workflowDescription,
      nodes,
      edges,
    };
    
    const dataStr = JSON.stringify(workflow, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${workflowName.replace(/\s+/g, '_')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, [workflowName, workflowDescription, nodes, edges]);
  
  // Import workflow from JSON
  const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workflow = JSON.parse(e.target?.result as string);
        setWorkflowName(workflow.name || 'Imported Workflow');
        setWorkflowDescription(workflow.description || '');
        setNodes(workflow.nodes || []);
        setEdges(workflow.edges || []);
        saveToHistory();
        
        toast({
          title: 'Workflow Imported',
          description: `Successfully imported ${workflow.name}`,
        });
      } catch (error) {
        toast({
          title: 'Import Failed',
          description: 'Invalid workflow file',
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);
  }, [setNodes, setEdges, saveToHistory, toast]);
  
  // Keyboard shortcuts
  useEffect(() => {
    if (deletePressed) handleDelete();
  }, [deletePressed, handleDelete]);
  
  useEffect(() => {
    if (ctrlZ) handleUndo();
  }, [ctrlZ, handleUndo]);
  
  useEffect(() => {
    if (ctrlY) handleRedo();
  }, [ctrlY, handleRedo]);
  
  useEffect(() => {
    if (ctrlS) handleSave();
  }, [ctrlS, handleSave]);
  
  useEffect(() => {
    if (ctrlC && selectedNodes.length > 0) {
      // Copy to clipboard
      navigator.clipboard.writeText(JSON.stringify(selectedNodes));
    }
  }, [ctrlC, selectedNodes]);
  
  useEffect(() => {
    if (ctrlV) {
      // Paste from clipboard
      navigator.clipboard.readText().then((text) => {
        try {
          const pastedNodes = JSON.parse(text);
          if (Array.isArray(pastedNodes)) {
            handleDuplicate();
          }
        } catch (e) {
          // Not valid JSON, ignore
        }
      });
    }
  }, [ctrlV, handleDuplicate]);
  
  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b px-4 py-2 flex items-center justify-between bg-card">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowBlockLibrary(!showBlockLibrary)}
          >
            {showBlockLibrary ? <ChevronLeft className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
          
          <div className="flex flex-col">
            <Input
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="font-semibold text-lg border-0 p-0 h-auto focus-visible:ring-0"
              placeholder="Workflow Name"
            />
            <Input
              value={workflowDescription}
              onChange={(e) => setWorkflowDescription(e.target.value)}
              className="text-sm text-muted-foreground border-0 p-0 h-auto focus-visible:ring-0"
              placeholder="Add a description..."
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Execution controls */}
          <div className="flex items-center gap-1 border rounded-md p-1">
            <Button
              size="sm"
              variant={isExecuting ? 'destructive' : 'default'}
              onClick={isExecuting ? () => setIsExecuting(false) : handleExecute}
              disabled={nodes.length === 0}
            >
              {isExecuting ? (
                <>
                  <Square className="h-4 w-4 mr-1" />
                  Stop
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-1" />
                  Execute
                </>
              )}
            </Button>
          </div>
          
          <Separator orientation="vertical" className="h-6" />
          
          {/* File operations */}
          <Button size="sm" variant="outline" onClick={handleSave}>
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
          <Button size="sm" variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <label>
            <Button size="sm" variant="outline" asChild>
              <span>
                <Upload className="h-4 w-4 mr-1" />
                Import
              </span>
            </Button>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
          
          <Separator orientation="vertical" className="h-6" />
          
          {/* Edit operations */}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
          >
            <Redo className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6" />
          
          {/* View options */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowMinimap(!showMinimap)}
            className={cn(showMinimap && 'bg-accent')}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowGrid(!showGrid)}
            className={cn(showGrid && 'bg-accent')}
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Block Library Sidebar */}
        <AnimatePresence>
          {showBlockLibrary && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-r bg-card overflow-hidden"
            >
              <WorkflowBlockLibrary />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* React Flow Canvas */}
        <div className="flex-1" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            isValidConnection={isValidConnection}
            fitView
            attributionPosition="bottom-left"
            deleteKeyCode={null} // We handle delete manually
          >
            <Controls />
            {showMinimap && (
              <MiniMap
                nodeStrokeColor={(n) => {
                  const status = n.data?.status;
                  if (status === 'completed') return '#10b981';
                  if (status === 'running') return '#3b82f6';
                  if (status === 'error') return '#ef4444';
                  return '#6b7280';
                }}
                nodeColor={(n) => {
                  const status = n.data?.status;
                  if (status === 'completed') return '#10b98120';
                  if (status === 'running') return '#3b82f620';
                  if (status === 'error') return '#ef444420';
                  return '#6b728020';
                }}
                nodeBorderRadius={8}
              />
            )}
            {showGrid && (
              <Background
                variant={BackgroundVariant.Dots}
                gap={12}
                size={1}
                color="#e5e7eb"
              />
            )}
            
            {/* Status Panel */}
            {isExecuting && (
              <Panel position="bottom-center" className="bg-card p-4 rounded-lg shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                  <span className="text-sm font-medium">Executing workflow...</span>
                  <Badge variant="secondary">
                    {Array.from(executionStatus.values()).filter(s => s.status === 'completed').length}/{nodes.length} nodes
                  </Badge>
                </div>
              </Panel>
            )}
            
            {/* Selection info */}
            {(selectedNodes.length > 0 || selectedEdges.length > 0) && (
              <Panel position="top-center" className="bg-card p-2 rounded-lg shadow-lg">
                <div className="flex items-center gap-3 text-sm">
                  {selectedNodes.length > 0 && (
                    <Badge variant="outline">{selectedNodes.length} nodes selected</Badge>
                  )}
                  {selectedEdges.length > 0 && (
                    <Badge variant="outline">{selectedEdges.length} edges selected</Badge>
                  )}
                  <Button size="sm" variant="ghost" onClick={handleDuplicate}>
                    <Copy className="h-3 w-3 mr-1" />
                    Duplicate
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleDelete}>
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </Panel>
            )}
          </ReactFlow>
        </div>
      </div>
    </div>
  );
};

// Wrap with ReactFlowProvider
const WorkflowBuilderWrapper: React.FC<WorkflowBuilderProps> = (props) => {
  return (
    <ReactFlowProvider>
      <WorkflowBuilder {...props} />
    </ReactFlowProvider>
  );
};

export default WorkflowBuilderWrapper;
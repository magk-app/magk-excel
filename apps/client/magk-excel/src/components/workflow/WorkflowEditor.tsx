/**
 * Enhanced Workflow Editor Component
 * Full-featured workflow editor with drag-and-drop, block library, and real-time editing
 */

import React, { useState, useCallback, useRef, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  Panel,
  useReactFlow,
  ReactFlowProvider,
  Connection,
  ConnectionMode,
  MarkerType,
  NodeDragHandler,
  OnSelectionChangeParams
} from 'reactflow';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Save,
  Play,
  Pause,
  Square,
  RotateCcw,
  Download,
  Upload,
  Settings,
  Layers,
  Grid3x3,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Copy,
  Edit2,
  Check,
  X,
  AlertCircle,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import 'reactflow/dist/style.css';

import { WorkflowNode, WorkflowEdge, NodeType } from '@/types/workflow';
import { nodeTypes } from './NodeRegistry';
import WorkflowBlockLibrary, { WorkflowBlock } from './WorkflowBlockLibrary';
import { useWorkflowStore, WorkflowType } from '@/stores/workflowStore';

interface WorkflowEditorProps {
  workflowId?: string;
  onSave?: () => void;
  onExecute?: () => void;
  className?: string;
}

// Custom node component for drag handle
const CustomNodeWrapper: React.FC<{ data: any; children: React.ReactNode }> = ({ data, children }) => {
  return (
    <div className="custom-node-wrapper">
      {children}
    </div>
  );
};

const WorkflowEditorContent: React.FC<WorkflowEditorProps> = ({
  workflowId,
  onSave,
  onExecute,
  className
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { 
    activeWorkflow,
    addNode,
    updateNode,
    deleteNode,
    addEdge: addEdgeToStore,
    updateEdge,
    deleteEdge,
    saveWorkflow,
    isDirty,
    setDirty,
    selectedNodeId,
    selectNode
  } = useWorkflowStore();

  const [nodes, setNodes, onNodesChange] = useNodesState(activeWorkflow?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(activeWorkflow?.edges || []);
  const [showBlockLibrary, setShowBlockLibrary] = useState(true);
  const [showProperties, setShowProperties] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);
  const [selectedElements, setSelectedElements] = useState<OnSelectionChangeParams>({ nodes: [], edges: [] });
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [nodeNameInput, setNodeNameInput] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [nodesToDelete, setNodesToDelete] = useState<string[]>([]);

  const { project, getNodes, getEdges, setViewport } = useReactFlow();

  // Handle connection between nodes
  const onConnect = useCallback((params: Connection) => {
    if (!params.source || !params.target) return;

    const newEdge: WorkflowEdge = {
      id: `edge-${params.source}-${params.target}-${Date.now()}`,
      source: params.source,
      target: params.target,
      type: 'smoothstep',
      data: {}
    };

    setEdges((eds) => addEdge(newEdge, eds));
    addEdgeToStore(newEdge);
    setDirty(true);
  }, [setEdges, addEdgeToStore, setDirty]);

  // Handle node selection
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    selectNode(node.id);
    setEditingNodeId(null);
  }, [selectNode]);

  // Handle node double-click for editing
  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    setEditingNodeId(node.id);
    setNodeNameInput(node.data?.config?.name || '');
  }, []);

  // Handle selection change
  const onSelectionChange = useCallback((params: OnSelectionChangeParams) => {
    setSelectedElements(params);
  }, []);

  // Handle node deletion
  const onNodesDelete = useCallback((nodesToDelete: Node[]) => {
    setNodesToDelete(nodesToDelete.map(n => n.id));
    setShowDeleteConfirm(true);
  }, []);

  const confirmNodeDeletion = useCallback(() => {
    nodesToDelete.forEach(nodeId => {
      deleteNode(nodeId);
    });
    setShowDeleteConfirm(false);
    setNodesToDelete([]);
    setDirty(true);
  }, [nodesToDelete, deleteNode, setDirty]);

  // Handle edge deletion
  const onEdgesDelete = useCallback((edgesToDelete: Edge[]) => {
    edgesToDelete.forEach(edge => {
      deleteEdge(edge.id);
    });
    setDirty(true);
  }, [deleteEdge, setDirty]);

  // Handle drag over
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle drop from block library
  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
    const blockData = event.dataTransfer.getData('application/reactflow');

    if (!blockData || !reactFlowBounds) return;

    const block = JSON.parse(blockData) as WorkflowBlock;

    const position = project({
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    });

    const newNode: WorkflowNode = {
      id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: block.type as NodeType,
      position,
      data: {
        type: block.type as NodeType,
        config: {
          id: `config-${Date.now()}`,
          name: block.name,
          description: block.description
        },
        status: 'pending'
      }
    };

    setNodes((nds) => nds.concat(newNode));
    addNode(newNode);
    setDirty(true);
  }, [project, setNodes, addNode, setDirty]);

  // Handle block add from library
  const handleBlockAdd = useCallback((block: WorkflowBlock) => {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    const position = project({
      x: centerX,
      y: centerY,
    });

    const newNode: WorkflowNode = {
      id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: block.type as NodeType,
      position,
      data: {
        type: block.type as NodeType,
        config: {
          id: `config-${Date.now()}`,
          name: block.name,
          description: block.description
        },
        status: 'pending'
      }
    };

    setNodes((nds) => nds.concat(newNode));
    addNode(newNode);
    setDirty(true);
    
    // Auto-select the new node
    selectNode(newNode.id);
  }, [project, setNodes, addNode, setDirty, selectNode]);

  // Handle node name edit
  const handleNodeNameSave = useCallback(() => {
    if (editingNodeId && nodeNameInput) {
      const node = nodes.find(n => n.id === editingNodeId);
      if (node && node.data?.config) {
        const updatedNode = {
          ...node,
          data: {
            ...node.data,
            config: {
              ...node.data.config,
              name: nodeNameInput
            }
          }
        };
        updateNode(editingNodeId, updatedNode);
        setNodes((nds) => nds.map(n => n.id === editingNodeId ? updatedNode : n));
        setDirty(true);
      }
    }
    setEditingNodeId(null);
    setNodeNameInput('');
  }, [editingNodeId, nodeNameInput, nodes, updateNode, setNodes, setDirty]);

  // Handle workflow save
  const handleSave = useCallback(() => {
    if (activeWorkflow) {
      saveWorkflow(activeWorkflow.id);
      onSave?.();
    }
  }, [activeWorkflow, saveWorkflow, onSave]);

  // Handle workflow execution
  const handleExecute = useCallback(() => {
    setIsExecuting(true);
    onExecute?.();
    // Simulate execution completion
    setTimeout(() => {
      setIsExecuting(false);
    }, 3000);
  }, [onExecute]);

  // Duplicate selected nodes
  const duplicateSelectedNodes = useCallback(() => {
    const nodesToDuplicate = selectedElements.nodes;
    const newNodes: WorkflowNode[] = [];
    const nodeIdMap = new Map<string, string>();

    nodesToDuplicate.forEach(node => {
      const newId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      nodeIdMap.set(node.id, newId);
      
      const newNode: WorkflowNode = {
        ...node,
        id: newId,
        position: {
          x: node.position.x + 50,
          y: node.position.y + 50
        }
      };
      newNodes.push(newNode);
      addNode(newNode);
    });

    // Duplicate edges between selected nodes
    const edgesToDuplicate = edges.filter(edge => 
      nodeIdMap.has(edge.source) && nodeIdMap.has(edge.target)
    );

    edgesToDuplicate.forEach(edge => {
      const newEdge: WorkflowEdge = {
        ...edge,
        id: `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        source: nodeIdMap.get(edge.source)!,
        target: nodeIdMap.get(edge.target)!
      };
      setEdges((eds) => [...eds, newEdge]);
      addEdgeToStore(newEdge);
    });

    setNodes((nds) => [...nds, ...newNodes]);
    setDirty(true);
  }, [selectedElements.nodes, edges, setNodes, setEdges, addNode, addEdgeToStore, setDirty]);

  // Export workflow
  const handleExport = useCallback(() => {
    const flowData = {
      nodes: getNodes(),
      edges: getEdges(),
      viewport: { x: 0, y: 0, zoom: 1 }
    };

    const dataStr = JSON.stringify(flowData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `workflow-${Date.now()}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, [getNodes, getEdges]);

  // Import workflow
  const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const flowData = JSON.parse(e.target?.result as string);
        setNodes(flowData.nodes || []);
        setEdges(flowData.edges || []);
        if (flowData.viewport) {
          setViewport(flowData.viewport);
        }
        setDirty(true);
      } catch (error) {
        console.error('Failed to import workflow:', error);
      }
    };
    reader.readAsText(file);
  }, [setNodes, setEdges, setViewport, setDirty]);

  // Get selected node for properties panel
  const selectedNode = useMemo(() => {
    if (selectedNodeId) {
      return nodes.find(n => n.id === selectedNodeId);
    }
    return null;
  }, [selectedNodeId, nodes]);

  return (
    <div className={cn('flex h-full', className)}>
      {/* Sidebar - Block Library */}
      <AnimatePresence>
        {showBlockLibrary && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-r bg-background overflow-hidden"
          >
            <WorkflowBlockLibrary
              onBlockAdd={handleBlockAdd}
              viewMode="list"
              className="h-full"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Block Library Button */}
      <div className="relative">
        <Button
          size="sm"
          variant="ghost"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-16 w-6 rounded-r-md rounded-l-none"
          onClick={() => setShowBlockLibrary(!showBlockLibrary)}
        >
          {showBlockLibrary ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onNodeDoubleClick={onNodeDoubleClick}
          onSelectionChange={onSelectionChange}
          onNodesDelete={onNodesDelete}
          onEdgesDelete={onEdgesDelete}
          onDragOver={onDragOver}
          onDrop={onDrop}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
          fitViewOptions={{
            padding: 0.2,
            includeHiddenNodes: false
          }}
          defaultEdgeOptions={{
            type: 'smoothstep',
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 20,
              height: 20,
            },
            style: {
              strokeWidth: 2,
              stroke: '#64748b',
            }
          }}
          deleteKeyCode={['Backspace', 'Delete']}
          multiSelectionKeyCode={['Meta', 'Ctrl']}
          selectionKeyCode='Shift'
        >
          <Background 
            variant={showGrid ? BackgroundVariant.Dots : BackgroundVariant.Lines}
            gap={showGrid ? 20 : 40}
            size={showGrid ? 1 : 0.5}
            color={showGrid ? '#e2e8f0' : '#f1f5f9'}
          />
          
          <Controls position="bottom-right" />
          
          {showMiniMap && (
            <MiniMap
              position="bottom-left"
              nodeStrokeWidth={3}
              pannable
              zoomable
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid #e5e7eb',
              }}
            />
          )}

          {/* Top Toolbar */}
          <Panel position="top-center">
            <Card className="shadow-lg">
              <CardContent className="p-2">
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant={isDirty ? 'default' : 'outline'}
                          onClick={handleSave}
                          disabled={!isDirty}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Save Workflow</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <Separator orientation="vertical" className="h-6" />

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant={isExecuting ? 'secondary' : 'outline'}
                          onClick={handleExecute}
                          disabled={isExecuting}
                        >
                          {isExecuting ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{isExecuting ? 'Pause' : 'Execute'} Workflow</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsExecuting(false)}
                          disabled={!isExecuting}
                        >
                          <Square className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Stop Execution</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <Separator orientation="vertical" className="h-6" />

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={duplicateSelectedNodes}
                          disabled={selectedElements.nodes.length === 0}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Duplicate Selected</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setNodesToDelete(selectedElements.nodes.map(n => n.id));
                            setShowDeleteConfirm(true);
                          }}
                          disabled={selectedElements.nodes.length === 0}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete Selected</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <Separator orientation="vertical" className="h-6" />

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant={showGrid ? 'default' : 'outline'}
                          onClick={() => setShowGrid(!showGrid)}
                        >
                          <Grid3x3 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Toggle Grid</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant={showMiniMap ? 'default' : 'outline'}
                          onClick={() => setShowMiniMap(!showMiniMap)}
                        >
                          <Layers className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Toggle MiniMap</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <Separator orientation="vertical" className="h-6" />

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="sm" variant="outline" onClick={handleExport}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Export Workflow</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="sm" variant="outline" asChild>
                          <label>
                            <Upload className="h-4 w-4" />
                            <input
                              type="file"
                              accept=".json"
                              onChange={handleImport}
                              className="hidden"
                            />
                          </label>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Import Workflow</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardContent>
            </Card>
          </Panel>

          {/* Status Bar */}
          <Panel position="top-left">
            <Card>
              <CardContent className="p-2">
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{nodes.length} nodes</Badge>
                    <Badge variant="outline">{edges.length} edges</Badge>
                  </div>
                  {isDirty && (
                    <Badge variant="secondary">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Unsaved changes
                    </Badge>
                  )}
                  {isExecuting && (
                    <Badge className="bg-blue-500">
                      <div className="h-2 w-2 rounded-full bg-white animate-pulse mr-1" />
                      Executing
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </Panel>

          {/* Node Edit Inline */}
          {editingNodeId && (
            <Panel position="top-center">
              <Card className="shadow-xl">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Input
                      value={nodeNameInput}
                      onChange={(e) => setNodeNameInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleNodeNameSave();
                        if (e.key === 'Escape') setEditingNodeId(null);
                      }}
                      className="w-64"
                      autoFocus
                    />
                    <Button size="sm" onClick={handleNodeNameSave}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingNodeId(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Panel>
          )}
        </ReactFlow>
      </div>

      {/* Properties Panel */}
      <AnimatePresence>
        {showProperties && selectedNode && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-l bg-background overflow-hidden"
          >
            <Card className="h-full rounded-none border-0">
              <CardHeader>
                <CardTitle className="text-sm">Node Properties</CardTitle>
                <CardDescription className="text-xs">
                  {selectedNode.data?.config?.name || 'Unnamed Node'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="config" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="config">Config</TabsTrigger>
                    <TabsTrigger value="data">Data</TabsTrigger>
                  </TabsList>
                  <TabsContent value="config" className="space-y-4">
                    <div>
                      <label className="text-xs font-medium">Node ID</label>
                      <p className="text-xs text-muted-foreground font-mono">{selectedNode.id}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium">Type</label>
                      <Badge variant="outline">{selectedNode.type}</Badge>
                    </div>
                    <div>
                      <label className="text-xs font-medium">Status</label>
                      <Badge variant="secondary">{selectedNode.data?.status || 'pending'}</Badge>
                    </div>
                    <div>
                      <label className="text-xs font-medium">Position</label>
                      <p className="text-xs text-muted-foreground">
                        X: {Math.round(selectedNode.position.x)}, Y: {Math.round(selectedNode.position.y)}
                      </p>
                    </div>
                  </TabsContent>
                  <TabsContent value="data" className="space-y-4">
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle className="text-xs">Node Data</AlertTitle>
                      <AlertDescription className="text-xs">
                        Configure node-specific parameters here
                      </AlertDescription>
                    </Alert>
                    <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-64">
                      {JSON.stringify(selectedNode.data, null, 2)}
                    </pre>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Properties Button */}
      <div className="relative">
        <Button
          size="sm"
          variant="ghost"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-16 w-6 rounded-l-md rounded-r-none"
          onClick={() => setShowProperties(!showProperties)}
        >
          {showProperties ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Nodes</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {nodesToDelete.length} node{nodesToDelete.length > 1 ? 's' : ''}? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmNodeDeletion}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Wrapper with ReactFlowProvider
export const WorkflowEditor: React.FC<WorkflowEditorProps> = (props) => {
  return (
    <ReactFlowProvider>
      <WorkflowEditorContent {...props} />
    </ReactFlowProvider>
  );
};

export default WorkflowEditor;
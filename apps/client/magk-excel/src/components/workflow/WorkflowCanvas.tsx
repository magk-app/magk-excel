/**
 * Enhanced Workflow Canvas - Professional Excel workflow visualization
 * React Flow integration with comprehensive features for real-time workflow management
 */

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  OnConnect,
  OnNodesChange,
  OnEdgesChange,
  OnNodesDelete,
  OnEdgesDelete,
  MarkerType,
  SelectionMode,
  useReactFlow,
  ReactFlowProvider,
  Panel,
  useOnSelectionChange
} from 'reactflow';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Maximize2, 
  ZoomIn, 
  ZoomOut,
  Grid3x3,
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import 'reactflow/dist/style.css';

import { WorkflowNode, WorkflowEdge, NodeStatus, NODE_THEMES } from '@/types/workflow';
import { nodeTypes } from './NodeRegistry';
import { STATUS_COLORS } from './animations/nodeAnimations';

interface WorkflowCanvasProps {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  onNodesChange?: OnNodesChange;
  onEdgesChange?: OnEdgesChange;
  onConnect?: OnConnect;
  onNodeClick?: (event: React.MouseEvent, node: Node) => void;
  onNodeDoubleClick?: (event: React.MouseEvent, node: Node) => void;
  onNodesDelete?: OnNodesDelete;
  onEdgesDelete?: OnEdgesDelete;
  onNodeAdd?: (type: string, position: { x: number; y: number }) => void;
  onWorkflowExecute?: () => void;
  onWorkflowPause?: () => void;
  onWorkflowStop?: () => void;
  onWorkflowReset?: () => void;
  isExecuting?: boolean;
  executionStatus?: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  isReadOnly?: boolean;
  showGrid?: boolean;
  showMiniMap?: boolean;
  showStatusPanel?: boolean;
  className?: string;
}

// Enhanced edge styles with better data flow visualization
const getEnhancedEdgeStyle = (edge: WorkflowEdge, isExecuting: boolean = false) => {
  const hasData = edge.data?.sampleData;
  const baseStyle = {
    stroke: hasData ? STATUS_COLORS.completed : STATUS_COLORS.pending,
    strokeWidth: hasData ? 3 : 2,
    strokeDasharray: hasData ? undefined : '8,4',
    filter: hasData ? `drop-shadow(0 0 6px ${STATUS_COLORS.completed}30)` : undefined,
  };

  if (isExecuting && hasData) {
    return {
      ...baseStyle,
      stroke: STATUS_COLORS.running,
      strokeWidth: 4,
      filter: `drop-shadow(0 0 8px ${STATUS_COLORS.running}40)`,
    };
  }

  return baseStyle;
};

// Enhanced MiniMap node colors with better status indication
const getEnhancedMinimapNodeColor = (node: Node): string => {
  const nodeData = node.data as WorkflowNode['data'];
  const status = nodeData?.status || 'pending';
  const nodeType = nodeData?.type;
  
  if (nodeType && NODE_THEMES[nodeType]) {
    const theme = NODE_THEMES[nodeType];
    return theme.statusColors[status] || theme.backgroundColor;
  }
  
  // Fallback colors using centralized STATUS_COLORS
  return STATUS_COLORS[status] || STATUS_COLORS.pending;
};

// Workflow execution status panel
const WorkflowStatusPanel: React.FC<{
  nodes: WorkflowNode[];
  executionStatus?: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  isExecuting?: boolean;
}> = ({ nodes, executionStatus = 'idle', isExecuting = false }) => {
  const statusCounts = useMemo(() => {
    const counts: Record<NodeStatus, number> = {
      pending: 0,
      running: 0,
      completed: 0,
      error: 0,
      paused: 0
    };

    nodes.forEach(node => {
      if (node.data?.status) {
        counts[node.data.status]++;
      }
    });

    return counts;
  }, [nodes]);

  const getStatusIcon = (status: typeof executionStatus) => {
    switch (status) {
      case 'running': return <Activity className="h-4 w-4 animate-pulse text-blue-500" />;
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'paused': return <Pause className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const totalNodes = nodes.length;
  const completedNodes = statusCounts.completed;
  const progressPercentage = totalNodes > 0 ? Math.round((completedNodes / totalNodes) * 100) : 0;

  return (
    <Card className="bg-white/95 backdrop-blur-sm border-gray-200 shadow-lg">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          {getStatusIcon(executionStatus)}
          <span className="font-medium text-sm capitalize">
            {isExecuting ? 'Executing Workflow' : `Workflow ${executionStatus}`}
          </span>
        </div>

        {/* Progress indicator */}
        {isExecuting && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Progress</span>
              <span>{progressPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-blue-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
        )}

        {/* Status breakdown */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-600">Node Status</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Running: {statusCounts.running}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Done: {statusCounts.completed}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-gray-400" />
              <span>Pending: {statusCounts.pending}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span>Error: {statusCounts.error}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Enhanced Controls Panel
const WorkflowControlsPanel: React.FC<{
  onExecute?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onReset?: () => void;
  isExecuting?: boolean;
  executionStatus?: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  showGrid?: boolean;
  onToggleGrid?: () => void;
  showMiniMap?: boolean;
  onToggleMiniMap?: () => void;
}> = ({
  onExecute,
  onPause,
  onStop,
  onReset,
  isExecuting = false,
  executionStatus = 'idle',
  showGrid = true,
  onToggleGrid,
  showMiniMap = true,
  onToggleMiniMap
}) => {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <Card className="bg-white/95 backdrop-blur-sm border-gray-200 shadow-lg">
      <CardContent className="p-3">
        <div className="flex flex-col gap-2">
          {/* Execution Controls */}
          <div className="flex gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant={isExecuting ? "secondary" : "default"}
                    onClick={onExecute}
                    disabled={isExecuting && executionStatus === 'running'}
                    className="h-8 px-2"
                  >
                    <Play className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Execute Workflow</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onPause}
                    disabled={!isExecuting || executionStatus !== 'running'}
                    className="h-8 px-2"
                  >
                    <Pause className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Pause Workflow</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onStop}
                    disabled={!isExecuting}
                    className="h-8 px-2"
                  >
                    <Square className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Stop Workflow</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onReset}
                    className="h-8 px-2"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reset Workflow</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <Separator />

          {/* View Controls */}
          <div className="flex gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => zoomIn()}
                    className="h-8 px-2"
                  >
                    <ZoomIn className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom In</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => zoomOut()}
                    className="h-8 px-2"
                  >
                    <ZoomOut className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom Out</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fitView({ padding: 0.1 })}
                    className="h-8 px-2"
                  >
                    <Maximize2 className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Fit View</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <Separator />

          {/* Display Controls */}
          <div className="flex gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant={showGrid ? "default" : "outline"}
                    onClick={onToggleGrid}
                    className="h-8 px-2"
                  >
                    <Grid3x3 className="h-3 w-3" />
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
                    variant={showMiniMap ? "default" : "outline"}
                    onClick={onToggleMiniMap}
                    className="h-8 px-2"
                  >
                    <Layers className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Toggle MiniMap</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Main Workflow Canvas Component
const WorkflowCanvasContent: React.FC<WorkflowCanvasProps> = ({
  nodes: initialNodes,
  edges: initialEdges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onNodeDoubleClick,
  onNodesDelete,
  onEdgesDelete,
  onWorkflowExecute,
  onWorkflowPause,
  onWorkflowStop,
  onWorkflowReset,
  isExecuting = false,
  executionStatus = 'idle',
  isReadOnly = false,
  showGrid: initialShowGrid = true,
  showMiniMap: initialShowMiniMap = true,
  showStatusPanel = true,
  className = ''
}) => {
  const [nodes, setNodes, onNodesChangeInternal] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState(initialEdges);
  const [showGrid, setShowGrid] = useState(initialShowGrid);
  const [showMiniMap, setShowMiniMap] = useState(initialShowMiniMap);
  const [selectedElements, setSelectedElements] = useState<{ nodes: Node[]; edges: Edge[] }>({ nodes: [], edges: [] });

  // Update internal state when props change
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  // Selection change handler
  useOnSelectionChange({
    onChange: ({ nodes, edges }) => {
      setSelectedElements({ nodes, edges });
    },
  });

  // Enhanced node change handler with real-time updates
  const handleNodesChange = useCallback<OnNodesChange>((changes) => {
    onNodesChangeInternal(changes);
    onNodesChange?.(changes);
  }, [onNodesChangeInternal, onNodesChange]);

  // Enhanced edge change handler
  const handleEdgesChange = useCallback<OnEdgesChange>((changes) => {
    onEdgesChangeInternal(changes);
    onEdgesChange?.(changes);
  }, [onEdgesChangeInternal, onEdgesChange]);

  // Enhanced connection handler with validation
  const handleConnect = useCallback<OnConnect>((connection) => {
    if (isReadOnly) return;
    
    const newEdge: WorkflowEdge = {
      id: `edge-${connection.source}-${connection.target}-${Date.now()}`,
      source: connection.source!,
      target: connection.target!,
      type: 'smoothstep',
      data: {
        dataSchema: {},
        sampleData: undefined
      }
    };
    
    setEdges((eds) => addEdge(newEdge, eds));
    onConnect?.(connection);
  }, [isReadOnly, setEdges, onConnect]);

  // Enhanced edge styles with execution state
  const styledEdges = useMemo(() => 
    edges.map(edge => ({
      ...edge,
      style: getEnhancedEdgeStyle(edge, isExecuting),
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 22,
        height: 22,
        color: edge.data?.sampleData ? STATUS_COLORS.completed : STATUS_COLORS.pending,
      },
      animated: isExecuting && Boolean(edge.data?.sampleData),
      labelStyle: {
        fontSize: '12px',
        fontWeight: 500,
        fill: '#374151'
      }
    })),
    [edges, isExecuting]
  );

  // React Flow configuration with enhanced features
  const reactFlowProps = {
    nodes,
    edges: styledEdges,
    nodeTypes,
    onNodesChange: handleNodesChange,
    onEdgesChange: handleEdgesChange,
    onConnect: handleConnect,
    onNodeClick,
    onNodeDoubleClick,
    onNodesDelete,
    onEdgesDelete,
    connectionMode: ConnectionMode.Loose,
    fitView: true,
    fitViewOptions: {
      padding: 0.2,
      includeHiddenNodes: false,
      maxZoom: 1.0,
      minZoom: 0.2
    },
    defaultEdgeOptions: {
      type: 'smoothstep',
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 22,
        height: 22,
        color: '#64748b',
      },
      style: {
        strokeWidth: 2,
        stroke: '#64748b',
      }
    },
    deleteKeyCode: isReadOnly ? null : ['Backspace', 'Delete'],
    multiSelectionKeyCode: ['Meta', 'Ctrl'],
    selectionKeyCode: 'Shift',
    panOnDrag: true,
    selectionOnDrag: !isReadOnly,
    selectionMode: SelectionMode.Partial,
    nodesConnectable: !isReadOnly,
    nodesDraggable: !isReadOnly,
    elementsSelectable: true,
    minZoom: 0.1,
    maxZoom: 4,
    zoomOnScroll: true,
    zoomOnPinch: true,
    panOnScroll: false,
    preventScrolling: true,
    nodeExtent: [[-5000, -5000], [5000, 5000]] as [[number, number], [number, number]],
    translateExtent: [[-5000, -5000], [5000, 5000]] as [[number, number], [number, number]],
  };

  return (
    <div className={cn('relative w-full h-full bg-gradient-to-br from-slate-50 to-gray-100', className)}>
      <ReactFlow {...reactFlowProps}>
        {/* Enhanced Background */}
        <Background 
          variant={showGrid ? BackgroundVariant.Dots : BackgroundVariant.Lines}
          gap={showGrid ? 24 : 48}
          size={showGrid ? 1 : 0.5}
          color={showGrid ? '#e2e8f0' : '#f1f5f9'}
          style={{
            backgroundColor: 'transparent'
          }}
        />
        
        {/* Enhanced Controls */}
        <Controls 
          position="bottom-right"
          showZoom={false}
          showFitView={false}
          showInteractive={false}
          style={{
            display: 'none' // Using custom controls instead
          }}
        />
        
        {/* Enhanced MiniMap */}
        {showMiniMap && (
          <MiniMap
            position="bottom-left"
            nodeColor={getEnhancedMinimapNodeColor}
            nodeStrokeWidth={3}
            nodeBorderRadius={12}
            maskColor="rgba(255, 255, 255, 0.15)"
            pannable
            zoomable
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              backdropFilter: 'blur(8px)',
              width: 240,
              height: 160
            }}
          />
        )}

        {/* Custom Controls Panel */}
        <Panel position="top-left" className="m-4">
          <WorkflowControlsPanel
            onExecute={onWorkflowExecute}
            onPause={onWorkflowPause}
            onStop={onWorkflowStop}
            onReset={onWorkflowReset}
            isExecuting={isExecuting}
            executionStatus={executionStatus}
            showGrid={showGrid}
            onToggleGrid={() => setShowGrid(!showGrid)}
            showMiniMap={showMiniMap}
            onToggleMiniMap={() => setShowMiniMap(!showMiniMap)}
          />
        </Panel>

        {/* Workflow Status Panel */}
        {showStatusPanel && (
          <Panel position="top-right" className="m-4">
            <WorkflowStatusPanel
              nodes={nodes as WorkflowNode[]}
              executionStatus={executionStatus}
              isExecuting={isExecuting}
            />
          </Panel>
        )}

        {/* Selection Info Panel */}
        {selectedElements.nodes.length > 0 && (
          <Panel position="bottom-center" className="mx-4 mb-4">
            <Card className="bg-white/95 backdrop-blur-sm border-gray-200 shadow-lg">
              <CardContent className="px-4 py-2">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{selectedElements.nodes.length} nodes selected</Badge>
                    {selectedElements.edges.length > 0 && (
                      <Badge variant="outline">{selectedElements.edges.length} edges selected</Badge>
                    )}
                  </div>
                  <Separator orientation="vertical" className="h-4" />
                  <div className="text-xs text-muted-foreground">
                    Press Delete to remove selected elements
                  </div>
                </div>
              </CardContent>
            </Card>
          </Panel>
        )}

        {/* Execution Progress Overlay */}
        <AnimatePresence>
          {isExecuting && executionStatus === 'running' && (
            <Panel position="top-center" className="m-4">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="bg-blue-50 border-blue-200 shadow-lg">
                  <CardContent className="px-4 py-2">
                    <div className="flex items-center gap-3">
                      <Activity className="h-4 w-4 animate-pulse text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">
                        Workflow Executing...
                      </span>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {nodes.filter(n => n.data?.status === 'completed').length} / {nodes.length} completed
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </Panel>
          )}
        </AnimatePresence>
      </ReactFlow>
    </div>
  );
};

// Wrapper component with ReactFlowProvider
export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = (props) => {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasContent {...props} />
    </ReactFlowProvider>
  );
};

export default WorkflowCanvas;
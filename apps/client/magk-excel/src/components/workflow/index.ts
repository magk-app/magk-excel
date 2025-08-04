/**
 * Workflow Components Index
 * Centralized exports for all workflow-related components
 */

// Core components
export { default as WorkflowCanvas } from './WorkflowCanvas';
export { default as BaseWorkflowNode } from './BaseWorkflowNode';
export { default as RealtimeWorkflowNode } from './RealtimeWorkflowNode';

// Node types
export { default as WebScrapingNode } from './nodes/WebScrapingNode';
export { default as ExcelExportNode } from './nodes/ExcelExportNode';
export { default as TransformNode } from './nodes/TransformNode';

// Registry and utilities
export { 
  nodeTypes, 
  nodeTypeMetadata, 
  createWorkflowNode, 
  getNodesByCategory 
} from './NodeRegistry';

// Demo components
export { default as WorkflowDemo } from './WorkflowDemo';
export { default as WorkflowCanvasExample } from './WorkflowCanvasExample';
export { default as SpecializedNodesDemo } from './SpecializedNodesDemo';

// Re-export types for convenience
export type {
  WorkflowNode,
  WorkflowEdge,
  NodeStatus,
  NodeType,
  NodeConfig,
  WorkflowNodeData,
  NodeProgress,
  WebScrapingConfig,
  ExcelExportConfig,
  TransformConfig,
  Workflow
} from '@/types/workflow';
/**
 * Real-time Specialized Node Components Export
 * 
 * This module exports all specialized real-time node components that extend
 * the base RealtimeWorkflowNode with node-type-specific functionality and
 * real-time data visualization.
 * 
 * Each specialized node provides:
 * - Node-type-specific real-time metrics
 * - Custom progress indicators and animations
 * - Specialized error handling and recovery
 * - Live data visualization relevant to the operation
 * - Performance monitoring and optimization indicators
 */

// Specialized real-time node components
export { WebScrapingRealtimeNode } from './WebScrapingRealtimeNode';
export { ExcelExportRealtimeNode } from './ExcelExportRealtimeNode';
export { TransformRealtimeNode } from './TransformRealtimeNode';
export { ApiRealtimeNode } from './ApiRealtimeNode';

// Type exports for external usage
export type { WebScrapingRealtimeNodeProps } from './WebScrapingRealtimeNode';
export type { ExcelExportRealtimeNodeProps } from './ExcelExportRealtimeNode';
export type { TransformRealtimeNodeProps } from './TransformRealtimeNode';
export type { ApiRealtimeNodeProps } from './ApiRealtimeNode';

// Re-export base realtime node for convenience
export { RealtimeWorkflowNode } from '../RealtimeWorkflowNode';

/**
 * Node Type to Component Mapping
 * 
 * This mapping helps determine which specialized component to use
 * for each node type in the workflow canvas.
 */
import { NodeType } from '@/types/workflow';
import { WebScrapingRealtimeNode } from './WebScrapingRealtimeNode';
import { ExcelExportRealtimeNode } from './ExcelExportRealtimeNode';
import { TransformRealtimeNode } from './TransformRealtimeNode';
import { ApiRealtimeNode } from './ApiRealtimeNode';
import { RealtimeWorkflowNode } from '../RealtimeWorkflowNode';

export const REALTIME_NODE_COMPONENTS = {
  'web-scraping': WebScrapingRealtimeNode,
  'excel-export': ExcelExportRealtimeNode,
  'transform': TransformRealtimeNode,
  'api-fetch': ApiRealtimeNode,
  
  // For other node types, fall back to the base realtime node
  'pdf-extraction': RealtimeWorkflowNode,
  'excel-input': RealtimeWorkflowNode,
  'filter': RealtimeWorkflowNode,
  'merge': RealtimeWorkflowNode,
  'validation': RealtimeWorkflowNode,
  'preview': RealtimeWorkflowNode,
  'data-cleaner': RealtimeWorkflowNode,
  'conditional': RealtimeWorkflowNode,
  'scheduler': RealtimeWorkflowNode,
  'email-sender': RealtimeWorkflowNode,
  'file-watcher': RealtimeWorkflowNode,
} as const;

/**
 * Get the appropriate real-time component for a given node type
 * 
 * @param nodeType - The type of workflow node
 * @returns The corresponding real-time React component
 */
export const getRealtimeNodeComponent = (nodeType: NodeType) => {
  return REALTIME_NODE_COMPONENTS[nodeType] || RealtimeWorkflowNode;
};

/**
 * Check if a node type has a specialized real-time component
 * 
 * @param nodeType - The type of workflow node
 * @returns True if the node type has a specialized component
 */
export const hasSpecializedRealtimeComponent = (nodeType: NodeType): boolean => {
  return [
    'web-scraping',
    'excel-export', 
    'transform',
    'api-fetch'
  ].includes(nodeType);
};

/**
 * Default export - mapping object for easy integration
 */
export default REALTIME_NODE_COMPONENTS;
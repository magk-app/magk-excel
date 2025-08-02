/**
 * Frontend Integration Types
 * Using frontend workflow types directly for seamless integration
 */

// Import frontend types directly (when integrated)
// For now, we'll define the essential interfaces we need

export interface WorkflowNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: {
    type: NodeType;
    config: NodeConfig;
    status: NodeStatus;
    progress?: NodeProgress;
    result?: any;
    error?: any;
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  data?: {
    dataSchema?: any;
    sampleData?: any;
  };
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  status: 'draft' | 'ready' | 'running' | 'completed' | 'error';
  metadata: {
    created: Date;
    modified: Date;
    author?: string;
    tags: string[];
    category: string;
    estimatedDuration?: number;
  };
}

export type NodeStatus = 'pending' | 'running' | 'completed' | 'error' | 'paused';

export type NodeType = 
  | 'web-scraping' 
  | 'pdf-extraction' 
  | 'excel-input' 
  | 'api-fetch' 
  | 'filter' 
  | 'transform' 
  | 'merge' 
  | 'validation' 
  | 'excel-export' 
  | 'preview' 
  | 'data-cleaner' 
  | 'conditional' 
  | 'scheduler' 
  | 'email-sender' 
  | 'file-watcher';

export interface NodeProgress {
  current: number;
  total: number;
  percentage?: number;
  message?: string;
  startTime?: Date;
  estimatedCompletion?: Date;
}

export interface NodeConfig {
  id: string;
  name: string;
  description?: string;
  timeout?: number;
  retryAttempts?: number;
  [key: string]: any; // Allow for node-specific config properties
}

// Legacy backend compatibility
export interface WorkflowConfig {
  sourceType: 'web' | 'pdf' | 'excel';
  sourceUri: string;
  dataIdentifier: string;
}

// Conversion helper for legacy backend
export function convertToLegacyConfig(workflow: Workflow): WorkflowConfig | null {
  const sourceNode = workflow.nodes.find(n => 
    ['web-scraping', 'pdf-extraction', 'excel-input'].includes(n.type)
  );
  
  if (!sourceNode) return null;
  
  const config = sourceNode.data.config;
  
  return {
    sourceType: sourceNode.type === 'web-scraping' ? 'web' : 
                sourceNode.type === 'pdf-extraction' ? 'pdf' : 'excel',
    sourceUri: (config as any).url || (config as any).filePath || '',
    dataIdentifier: (config as any).selector || (config as any).range || ''
  };
}
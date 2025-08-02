/**
 * Node Registry - Manages all workflow node types for React Flow
 * Provides central registration and factory for Excel workflow nodes
 */

import { NodeTypes } from 'reactflow';
import { NodeType } from '@/types/workflow';

// Import all node components
import BaseWorkflowNode from './BaseWorkflowNode';
import WebScrapingNode from './nodes/WebScrapingNode';
import ExcelExportNode from './nodes/ExcelExportNode';
import TransformNode from './nodes/TransformNode';

// Additional nodes (create these as needed)
import React from 'react';
import { NodeProps } from 'reactflow';
import { 
  FileText, 
  FileSpreadsheet, 
  Globe, 
  Database,
  Filter,
  Eye,
  GitMerge,
  CheckCircle,
  Sparkles,
  Split,
  Clock,
  Mail,
  FolderOpen
} from 'lucide-react';

// Simple wrapper nodes for node types not yet implemented
const createSimpleNode = (nodeType: NodeType, _icon: React.ReactNode, _color: string) => {
  return (props: NodeProps) => (
    <BaseWorkflowNode 
      {...props} 
      data={{
        ...props.data,
        type: nodeType
      }}
    />
  );
};

// Node type definitions for React Flow
export const nodeTypes: NodeTypes = {
  // Data Source Nodes
  'web-scraping': WebScrapingNode,
  'pdf-extraction': createSimpleNode('pdf-extraction', <FileText />, '#ef4444'),
  'excel-input': createSimpleNode('excel-input', <FileSpreadsheet />, '#22c55e'),
  'api-fetch': createSimpleNode('api-fetch', <Database />, '#3b82f6'),
  
  // Data Transformation Nodes
  'filter': createSimpleNode('filter', <Filter />, '#f59e0b'),
  'transform': TransformNode,
  'merge': createSimpleNode('merge', <GitMerge />, '#ea580c'),
  'validation': createSimpleNode('validation', <CheckCircle />, '#22c55e'),
  
  // Output Nodes
  'excel-export': ExcelExportNode,
  'preview': createSimpleNode('preview', <Eye />, '#6b7280'),
  
  // Additional Nodes
  'data-cleaner': createSimpleNode('data-cleaner', <Sparkles />, '#38bdf8'),
  'conditional': createSimpleNode('conditional', <Split />, '#facc15'),
  'scheduler': createSimpleNode('scheduler', <Clock />, '#a855f7'),
  'email-sender': createSimpleNode('email-sender', <Mail />, '#dc2626'),
  'file-watcher': createSimpleNode('file-watcher', <FolderOpen />, '#059669'),
};

// Node type metadata for UI
export const nodeTypeMetadata: Record<NodeType, {
  label: string;
  description: string;
  icon: React.ReactNode;
  category: 'source' | 'transform' | 'output';
  color: string;
}> = {
  // Data Source Nodes
  'web-scraping': {
    label: 'Web Scraping',
    description: 'Extract data from websites using Firecrawl MCP',
    icon: <Globe className="h-4 w-4" />,
    category: 'source',
    color: '#3b82f6'
  },
  'pdf-extraction': {
    label: 'PDF Extraction',
    description: 'Extract tables and text from PDF documents',
    icon: <FileText className="h-4 w-4" />,
    category: 'source',
    color: '#ef4444'
  },
  'excel-input': {
    label: 'Excel Input',
    description: 'Read data from existing Excel files',
    icon: <FileSpreadsheet className="h-4 w-4" />,
    category: 'source',
    color: '#22c55e'
  },
  'api-fetch': {
    label: 'API Fetch',
    description: 'Fetch data from REST APIs',
    icon: <Database className="h-4 w-4" />,
    category: 'source',
    color: '#3b82f6'
  },

  // Data Transformation Nodes
  'filter': {
    label: 'Filter',
    description: 'Apply filters to data rows',
    icon: <Filter className="h-4 w-4" />,
    category: 'transform',
    color: '#f59e0b'
  },
  'transform': {
    label: 'Transform',
    description: 'Map, clean, and restructure data',
    icon: <></>,
    category: 'transform',
    color: '#8b5cf6'
  },
  'merge': {
    label: 'Merge',
    description: 'Combine multiple data sources',
    icon: <GitMerge className="h-4 w-4" />,
    category: 'transform',
    color: '#ea580c'
  },
  'validation': {
    label: 'Validation',
    description: 'Validate data quality and format',
    icon: <CheckCircle className="h-4 w-4" />,
    category: 'transform',
    color: '#22c55e'
  },

  // Output Nodes
  'excel-export': {
    label: 'Excel Export',
    description: 'Export data to Excel files with formatting',
    icon: <FileSpreadsheet className="h-4 w-4" />,
    category: 'output',
    color: '#22c55e'
  },
  'preview': {
    label: 'Preview',
    description: 'Preview data before export',
    icon: <Eye className="h-4 w-4" />,
    category: 'output',
    color: '#6b7280'
  },

  // Additional Nodes
  'data-cleaner': {
    label: 'Data Cleaner',
    description: 'Clean and standardize data',
    icon: <Sparkles className="h-4 w-4" />,
    category: 'transform',
    color: '#38bdf8'
  },
  'conditional': {
    label: 'Conditional',
    description: 'Conditional logic branching',
    icon: <Split className="h-4 w-4" />,
    category: 'transform',
    color: '#facc15'
  },
  'scheduler': {
    label: 'Scheduler',
    description: 'Schedule workflow execution',
    icon: <Clock className="h-4 w-4" />,
    category: 'transform',
    color: '#a855f7'
  },
  'email-sender': {
    label: 'Email Sender',
    description: 'Send emails with attachments',
    icon: <Mail className="h-4 w-4" />,
    category: 'output',
    color: '#dc2626'
  },
  'file-watcher': {
    label: 'File Watcher',
    description: 'Monitor file system changes',
    icon: <FolderOpen className="h-4 w-4" />,
    category: 'source',
    color: '#059669'
  }
};

// Factory function to create new nodes
export const createWorkflowNode = (
  type: NodeType,
  position: { x: number; y: number },
  config: Record<string, unknown>
) => {
  const metadata = nodeTypeMetadata[type];
  
  return {
    id: `${type}-${Date.now()}`,
    type,
    position,
    data: {
      type,
      status: 'pending' as const,
      config: {
        id: `${type}-${Date.now()}`,
        name: metadata.label,
        description: metadata.description,
        ...config
      }
    }
  };
};

// Get nodes by category for UI grouping
export const getNodesByCategory = (category: 'source' | 'transform' | 'output') => {
  return Object.entries(nodeTypeMetadata)
    .filter(([_, meta]) => meta.category === category)
    .map(([type, meta]) => ({
      type: type as NodeType,
      ...meta
    }));
};

export default nodeTypes;
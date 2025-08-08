/**
 * Workflow Block Library Component
 * Comprehensive library system for workflow blocks including MCP, API, LLM, and File blocks
 */

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe,
  FileText,
  Table,
  Database,
  Bot,
  Cloud,
  Filter,
  GitMerge,
  CheckCircle,
  FileOutput,
  Eye,
  Sparkles,
  GitBranch,
  Clock,
  Mail,
  FolderOpen,
  Search,
  Plus,
  ChevronRight,
  Grid,
  List,
  Star,
  Tag,
  Package,
  Cpu,
  HardDrive,
  Network,
  Terminal,
  Code,
  Layers,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// Block category types
export type BlockCategory = 'mcp' | 'api' | 'llm' | 'file' | 'data' | 'logic' | 'output' | 'all';

// Block type definition
export interface WorkflowBlock {
  id: string;
  category: BlockCategory;
  type: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  tags: string[];
  parameters: BlockParameter[];
  outputs: BlockOutput[];
  isNew?: boolean;
  isPremium?: boolean;
  usage?: number;
}

export interface BlockParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'object' | 'array';
  required: boolean;
  description: string;
  default?: any;
  options?: string[];
}

export interface BlockOutput {
  name: string;
  type: string;
  description: string;
}

// Comprehensive block library
const WORKFLOW_BLOCKS: WorkflowBlock[] = [
  // MCP Blocks
  {
    id: 'mcp-firecrawl',
    category: 'mcp',
    type: 'mcp',
    name: 'Firecrawl Web Scraper',
    description: 'Extract structured data from websites using Firecrawl MCP',
    icon: <Globe className="h-4 w-4" />,
    color: 'bg-orange-500',
    tags: ['web', 'scraping', 'extraction'],
    parameters: [
      { name: 'url', type: 'string', required: true, description: 'Target URL to scrape' },
      { name: 'selector', type: 'string', required: false, description: 'CSS selector for extraction' },
      { name: 'format', type: 'select', required: true, description: 'Output format', options: ['table', 'list', 'json'] }
    ],
    outputs: [
      { name: 'data', type: 'array', description: 'Extracted data' },
      { name: 'metadata', type: 'object', description: 'Extraction metadata' }
    ],
    usage: 156
  },
  {
    id: 'mcp-excel',
    category: 'mcp',
    type: 'mcp',
    name: 'Excel MCP Operations',
    description: 'Read, write, and manipulate Excel files via MCP',
    icon: <Table className="h-4 w-4" />,
    color: 'bg-green-600',
    tags: ['excel', 'spreadsheet', 'data'],
    parameters: [
      { name: 'operation', type: 'select', required: true, description: 'Operation type', options: ['read', 'write', 'append', 'update'] },
      { name: 'filePath', type: 'string', required: true, description: 'Excel file path' },
      { name: 'sheet', type: 'string', required: false, description: 'Sheet name' }
    ],
    outputs: [
      { name: 'data', type: 'array', description: 'Excel data' },
      { name: 'status', type: 'object', description: 'Operation status' }
    ],
    usage: 203
  },
  {
    id: 'mcp-pdf',
    category: 'mcp',
    type: 'mcp',
    name: 'PDF Extractor MCP',
    description: 'Extract tables and text from PDF documents',
    icon: <FileText className="h-4 w-4" />,
    color: 'bg-red-500',
    tags: ['pdf', 'extraction', 'document'],
    parameters: [
      { name: 'filePath', type: 'string', required: true, description: 'PDF file path' },
      { name: 'pages', type: 'array', required: false, description: 'Page numbers to extract' },
      { name: 'extractType', type: 'select', required: true, description: 'Extraction type', options: ['tables', 'text', 'both'] }
    ],
    outputs: [
      { name: 'content', type: 'object', description: 'Extracted content' },
      { name: 'pages', type: 'number', description: 'Total pages processed' }
    ],
    isNew: true,
    usage: 89
  },
  {
    id: 'mcp-browser',
    category: 'mcp',
    type: 'mcp',
    name: 'Puppeteer Browser',
    description: 'Automate browser interactions with Puppeteer MCP',
    icon: <Network className="h-4 w-4" />,
    color: 'bg-purple-500',
    tags: ['browser', 'automation', 'puppeteer'],
    parameters: [
      { name: 'url', type: 'string', required: true, description: 'Starting URL' },
      { name: 'actions', type: 'array', required: true, description: 'Browser actions sequence' },
      { name: 'screenshot', type: 'boolean', required: false, description: 'Take screenshot', default: false }
    ],
    outputs: [
      { name: 'result', type: 'object', description: 'Action results' },
      { name: 'screenshot', type: 'string', description: 'Screenshot path if taken' }
    ],
    usage: 67
  },
  {
    id: 'mcp-filesystem',
    category: 'mcp',
    type: 'mcp',
    name: 'File System MCP',
    description: 'Perform file system operations via MCP',
    icon: <HardDrive className="h-4 w-4" />,
    color: 'bg-gray-600',
    tags: ['file', 'system', 'io'],
    parameters: [
      { name: 'operation', type: 'select', required: true, description: 'File operation', options: ['read', 'write', 'copy', 'move', 'delete'] },
      { name: 'path', type: 'string', required: true, description: 'File or directory path' }
    ],
    outputs: [
      { name: 'result', type: 'object', description: 'Operation result' }
    ],
    usage: 134
  },

  // API Blocks
  {
    id: 'api-rest',
    category: 'api',
    type: 'api',
    name: 'REST API Call',
    description: 'Make HTTP requests to REST APIs',
    icon: <Cloud className="h-4 w-4" />,
    color: 'bg-blue-500',
    tags: ['api', 'rest', 'http'],
    parameters: [
      { name: 'url', type: 'string', required: true, description: 'API endpoint URL' },
      { name: 'method', type: 'select', required: true, description: 'HTTP method', options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] },
      { name: 'headers', type: 'object', required: false, description: 'Request headers' },
      { name: 'body', type: 'object', required: false, description: 'Request body' }
    ],
    outputs: [
      { name: 'response', type: 'object', description: 'API response' },
      { name: 'status', type: 'number', description: 'HTTP status code' }
    ],
    usage: 289
  },
  {
    id: 'api-graphql',
    category: 'api',
    type: 'api',
    name: 'GraphQL Query',
    description: 'Execute GraphQL queries and mutations',
    icon: <Database className="h-4 w-4" />,
    color: 'bg-pink-500',
    tags: ['api', 'graphql', 'query'],
    parameters: [
      { name: 'endpoint', type: 'string', required: true, description: 'GraphQL endpoint' },
      { name: 'query', type: 'string', required: true, description: 'GraphQL query or mutation' },
      { name: 'variables', type: 'object', required: false, description: 'Query variables' }
    ],
    outputs: [
      { name: 'data', type: 'object', description: 'Query result' },
      { name: 'errors', type: 'array', description: 'GraphQL errors if any' }
    ],
    isPremium: true,
    usage: 45
  },
  {
    id: 'api-webhook',
    category: 'api',
    type: 'api',
    name: 'Webhook Receiver',
    description: 'Receive and process webhook events',
    icon: <Zap className="h-4 w-4" />,
    color: 'bg-yellow-500',
    tags: ['api', 'webhook', 'events'],
    parameters: [
      { name: 'endpoint', type: 'string', required: true, description: 'Webhook endpoint' },
      { name: 'secret', type: 'string', required: false, description: 'Webhook secret for validation' }
    ],
    outputs: [
      { name: 'payload', type: 'object', description: 'Webhook payload' },
      { name: 'headers', type: 'object', description: 'Request headers' }
    ],
    isNew: true,
    usage: 23
  },

  // LLM Blocks
  {
    id: 'llm-claude',
    category: 'llm',
    type: 'llm',
    name: 'Claude AI Analysis',
    description: 'Process data with Claude AI for insights and analysis',
    icon: <Bot className="h-4 w-4" />,
    color: 'bg-indigo-500',
    tags: ['ai', 'llm', 'claude', 'analysis'],
    parameters: [
      { name: 'prompt', type: 'string', required: true, description: 'Analysis prompt' },
      { name: 'data', type: 'object', required: true, description: 'Data to analyze' },
      { name: 'model', type: 'select', required: false, description: 'Claude model', options: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'], default: 'claude-3-sonnet' }
    ],
    outputs: [
      { name: 'analysis', type: 'string', description: 'AI analysis result' },
      { name: 'structured', type: 'object', description: 'Structured output if requested' }
    ],
    usage: 178
  },
  {
    id: 'llm-extraction',
    category: 'llm',
    type: 'llm',
    name: 'LLM Data Extraction',
    description: 'Extract structured data from unstructured text using LLMs',
    icon: <Sparkles className="h-4 w-4" />,
    color: 'bg-purple-600',
    tags: ['ai', 'extraction', 'nlp'],
    parameters: [
      { name: 'text', type: 'string', required: true, description: 'Input text' },
      { name: 'schema', type: 'object', required: true, description: 'Expected output schema' },
      { name: 'examples', type: 'array', required: false, description: 'Few-shot examples' }
    ],
    outputs: [
      { name: 'extracted', type: 'object', description: 'Extracted structured data' },
      { name: 'confidence', type: 'number', description: 'Extraction confidence score' }
    ],
    isPremium: true,
    usage: 92
  },
  {
    id: 'llm-validation',
    category: 'llm',
    type: 'llm',
    name: 'AI Data Validation',
    description: 'Validate and correct data using AI',
    icon: <CheckCircle className="h-4 w-4" />,
    color: 'bg-green-500',
    tags: ['ai', 'validation', 'quality'],
    parameters: [
      { name: 'data', type: 'array', required: true, description: 'Data to validate' },
      { name: 'rules', type: 'array', required: true, description: 'Validation rules' },
      { name: 'autoCorrect', type: 'boolean', required: false, description: 'Auto-correct errors', default: false }
    ],
    outputs: [
      { name: 'validated', type: 'array', description: 'Validated data' },
      { name: 'errors', type: 'array', description: 'Validation errors' },
      { name: 'corrections', type: 'array', description: 'Applied corrections' }
    ],
    isNew: true,
    usage: 56
  },

  // File Blocks
  {
    id: 'file-csv',
    category: 'file',
    type: 'file',
    name: 'CSV Operations',
    description: 'Read, write, and process CSV files',
    icon: <FileText className="h-4 w-4" />,
    color: 'bg-teal-500',
    tags: ['file', 'csv', 'data'],
    parameters: [
      { name: 'operation', type: 'select', required: true, description: 'CSV operation', options: ['read', 'write', 'append'] },
      { name: 'filePath', type: 'string', required: true, description: 'CSV file path' },
      { name: 'delimiter', type: 'string', required: false, description: 'CSV delimiter', default: ',' }
    ],
    outputs: [
      { name: 'data', type: 'array', description: 'CSV data' },
      { name: 'columns', type: 'array', description: 'Column names' }
    ],
    usage: 234
  },
  {
    id: 'file-json',
    category: 'file',
    type: 'file',
    name: 'JSON File Handler',
    description: 'Read, write, and manipulate JSON files',
    icon: <Code className="h-4 w-4" />,
    color: 'bg-yellow-600',
    tags: ['file', 'json', 'data'],
    parameters: [
      { name: 'operation', type: 'select', required: true, description: 'JSON operation', options: ['read', 'write', 'merge', 'patch'] },
      { name: 'filePath', type: 'string', required: true, description: 'JSON file path' },
      { name: 'data', type: 'object', required: false, description: 'Data for write operations' }
    ],
    outputs: [
      { name: 'data', type: 'object', description: 'JSON data' }
    ],
    usage: 189
  },
  {
    id: 'file-watcher',
    category: 'file',
    type: 'file',
    name: 'File System Watcher',
    description: 'Monitor file system changes and trigger workflows',
    icon: <FolderOpen className="h-4 w-4" />,
    color: 'bg-cyan-600',
    tags: ['file', 'monitor', 'automation'],
    parameters: [
      { name: 'path', type: 'string', required: true, description: 'Path to watch' },
      { name: 'pattern', type: 'string', required: false, description: 'File pattern to match' },
      { name: 'events', type: 'array', required: true, description: 'Events to watch', default: ['create', 'modify', 'delete'] }
    ],
    outputs: [
      { name: 'event', type: 'object', description: 'File system event' },
      { name: 'filePath', type: 'string', description: 'Affected file path' }
    ],
    usage: 78
  },

  // Data Processing Blocks
  {
    id: 'data-transform',
    category: 'data',
    type: 'transform',
    name: 'Data Transformer',
    description: 'Transform and reshape data structures',
    icon: <GitMerge className="h-4 w-4" />,
    color: 'bg-purple-500',
    tags: ['data', 'transform', 'processing'],
    parameters: [
      { name: 'input', type: 'array', required: true, description: 'Input data' },
      { name: 'operations', type: 'array', required: true, description: 'Transform operations' }
    ],
    outputs: [
      { name: 'transformed', type: 'array', description: 'Transformed data' }
    ],
    usage: 312
  },
  {
    id: 'data-filter',
    category: 'data',
    type: 'filter',
    name: 'Data Filter',
    description: 'Filter data based on conditions',
    icon: <Filter className="h-4 w-4" />,
    color: 'bg-amber-500',
    tags: ['data', 'filter', 'processing'],
    parameters: [
      { name: 'input', type: 'array', required: true, description: 'Input data' },
      { name: 'conditions', type: 'array', required: true, description: 'Filter conditions' },
      { name: 'operator', type: 'select', required: false, description: 'Condition operator', options: ['AND', 'OR'], default: 'AND' }
    ],
    outputs: [
      { name: 'filtered', type: 'array', description: 'Filtered data' },
      { name: 'excluded', type: 'array', description: 'Excluded records' }
    ],
    usage: 267
  },
  {
    id: 'data-merge',
    category: 'data',
    type: 'merge',
    name: 'Data Merger',
    description: 'Merge multiple data sources',
    icon: <Layers className="h-4 w-4" />,
    color: 'bg-orange-600',
    tags: ['data', 'merge', 'join'],
    parameters: [
      { name: 'sources', type: 'array', required: true, description: 'Data sources to merge' },
      { name: 'strategy', type: 'select', required: true, description: 'Merge strategy', options: ['inner', 'left', 'right', 'outer', 'union'] },
      { name: 'keys', type: 'array', required: false, description: 'Join keys' }
    ],
    outputs: [
      { name: 'merged', type: 'array', description: 'Merged data' }
    ],
    usage: 198
  },

  // Logic Blocks
  {
    id: 'logic-conditional',
    category: 'logic',
    type: 'conditional',
    name: 'Conditional Branch',
    description: 'Execute different paths based on conditions',
    icon: <GitBranch className="h-4 w-4" />,
    color: 'bg-yellow-500',
    tags: ['logic', 'conditional', 'flow'],
    parameters: [
      { name: 'condition', type: 'string', required: true, description: 'Condition expression' },
      { name: 'input', type: 'object', required: true, description: 'Input data for evaluation' }
    ],
    outputs: [
      { name: 'truePath', type: 'object', description: 'Data if condition is true' },
      { name: 'falsePath', type: 'object', description: 'Data if condition is false' }
    ],
    usage: 145
  },
  {
    id: 'logic-scheduler',
    category: 'logic',
    type: 'scheduler',
    name: 'Task Scheduler',
    description: 'Schedule workflow execution',
    icon: <Clock className="h-4 w-4" />,
    color: 'bg-violet-500',
    tags: ['logic', 'schedule', 'automation'],
    parameters: [
      { name: 'schedule', type: 'string', required: true, description: 'Cron expression or interval' },
      { name: 'timezone', type: 'string', required: false, description: 'Timezone', default: 'UTC' }
    ],
    outputs: [
      { name: 'trigger', type: 'object', description: 'Schedule trigger event' }
    ],
    usage: 89
  },

  // Output Blocks
  {
    id: 'output-excel',
    category: 'output',
    type: 'excel-export',
    name: 'Excel Exporter',
    description: 'Export data to formatted Excel files',
    icon: <FileOutput className="h-4 w-4" />,
    color: 'bg-green-600',
    tags: ['output', 'excel', 'export'],
    parameters: [
      { name: 'data', type: 'array', required: true, description: 'Data to export' },
      { name: 'filePath', type: 'string', required: true, description: 'Output file path' },
      { name: 'formatting', type: 'object', required: false, description: 'Excel formatting options' }
    ],
    outputs: [
      { name: 'filePath', type: 'string', description: 'Created file path' },
      { name: 'status', type: 'object', description: 'Export status' }
    ],
    usage: 423
  },
  {
    id: 'output-email',
    category: 'output',
    type: 'email-sender',
    name: 'Email Sender',
    description: 'Send emails with attachments',
    icon: <Mail className="h-4 w-4" />,
    color: 'bg-red-600',
    tags: ['output', 'email', 'notification'],
    parameters: [
      { name: 'to', type: 'array', required: true, description: 'Recipients' },
      { name: 'subject', type: 'string', required: true, description: 'Email subject' },
      { name: 'body', type: 'string', required: true, description: 'Email body' },
      { name: 'attachments', type: 'array', required: false, description: 'File attachments' }
    ],
    outputs: [
      { name: 'sent', type: 'boolean', description: 'Send status' },
      { name: 'messageId', type: 'string', description: 'Email message ID' }
    ],
    usage: 156
  },
  {
    id: 'output-preview',
    category: 'output',
    type: 'preview',
    name: 'Data Preview',
    description: 'Preview data in workflow',
    icon: <Eye className="h-4 w-4" />,
    color: 'bg-gray-500',
    tags: ['output', 'preview', 'debug'],
    parameters: [
      { name: 'data', type: 'object', required: true, description: 'Data to preview' },
      { name: 'maxRows', type: 'number', required: false, description: 'Maximum rows to show', default: 100 }
    ],
    outputs: [
      { name: 'preview', type: 'object', description: 'Preview data' }
    ],
    usage: 534
  }
];

interface WorkflowBlockLibraryProps {
  onBlockSelect?: (block: WorkflowBlock) => void;
  onBlockAdd?: (block: WorkflowBlock) => void;
  selectedCategory?: BlockCategory;
  viewMode?: 'grid' | 'list';
  className?: string;
}

export const WorkflowBlockLibrary: React.FC<WorkflowBlockLibraryProps> = ({
  onBlockSelect,
  onBlockAdd,
  selectedCategory: initialCategory = 'all',
  viewMode: initialViewMode = 'grid',
  className
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BlockCategory>(initialCategory);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(initialViewMode);
  const [selectedBlock, setSelectedBlock] = useState<WorkflowBlock | null>(null);

  // Filter blocks based on search and category
  const filteredBlocks = useMemo(() => {
    return WORKFLOW_BLOCKS.filter(block => {
      const matchesSearch = searchQuery === '' || 
        block.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        block.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        block.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || block.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);



  // Get category stats
  const categoryStats = useMemo(() => {
    const stats: Record<BlockCategory, number> = {
      all: WORKFLOW_BLOCKS.length,
      mcp: WORKFLOW_BLOCKS.filter(b => b.category === 'mcp').length,
      api: WORKFLOW_BLOCKS.filter(b => b.category === 'api').length,
      llm: WORKFLOW_BLOCKS.filter(b => b.category === 'llm').length,
      file: WORKFLOW_BLOCKS.filter(b => b.category === 'file').length,
      data: WORKFLOW_BLOCKS.filter(b => b.category === 'data').length,
      logic: WORKFLOW_BLOCKS.filter(b => b.category === 'logic').length,
      output: WORKFLOW_BLOCKS.filter(b => b.category === 'output').length
    };
    return stats;
  }, []);

  const handleBlockClick = useCallback((block: WorkflowBlock) => {
    setSelectedBlock(block);
    onBlockSelect?.(block);
  }, [onBlockSelect]);

  const handleAddBlock = useCallback((block: WorkflowBlock, e: React.MouseEvent) => {
    e.stopPropagation();
    onBlockAdd?.(block);
  }, [onBlockAdd]);

  const getCategoryIcon = (category: BlockCategory) => {
    switch (category) {
      case 'mcp': return <Terminal className="h-4 w-4" />;
      case 'api': return <Cloud className="h-4 w-4" />;
      case 'llm': return <Bot className="h-4 w-4" />;
      case 'file': return <HardDrive className="h-4 w-4" />;
      case 'data': return <Database className="h-4 w-4" />;
      case 'logic': return <Cpu className="h-4 w-4" />;
      case 'output': return <Package className="h-4 w-4" />;
      default: return <Grid className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: BlockCategory) => {
    switch (category) {
      case 'mcp': return 'text-orange-600';
      case 'api': return 'text-blue-600';
      case 'llm': return 'text-purple-600';
      case 'file': return 'text-teal-600';
      case 'data': return 'text-yellow-600';
      case 'logic': return 'text-pink-600';
      case 'output': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const renderBlockCard = (block: WorkflowBlock) => (
    <motion.div
      key={block.id}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          'relative cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]',
          selectedBlock?.id === block.id && 'ring-2 ring-primary',
          'group'
        )}
        onClick={() => handleBlockClick(block)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className={cn('p-2 rounded-lg', block.color)}>
              {block.icon}
            </div>
            <div className="flex gap-1">
              {block.isNew && (
                <Badge variant="secondary" className="text-xs">New</Badge>
              )}
              {block.isPremium && (
                <Badge variant="outline" className="text-xs">
                  <Star className="h-3 w-3 mr-1" />
                  Premium
                </Badge>
              )}
            </div>
          </div>
          <CardTitle className="text-sm mt-2">{block.name}</CardTitle>
          <CardDescription className="text-xs line-clamp-2">
            {block.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-1 mb-3">
            {block.tags.slice(0, 3).map((tag, idx) => (
              <Badge key={idx} variant="outline" className="text-xs py-0">
                <Tag className="h-2 w-2 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {block.usage} uses
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleAddBlock(block, e)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add to workflow</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderBlockList = (block: WorkflowBlock) => (
    <motion.div
      key={block.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className={cn(
          'flex items-center gap-4 p-4 rounded-lg border hover:bg-accent/50 cursor-pointer transition-all',
          selectedBlock?.id === block.id && 'bg-accent border-primary',
          'group'
        )}
        onClick={() => handleBlockClick(block)}
      >
        <div className={cn('p-2 rounded-lg shrink-0', block.color)}>
          {block.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm truncate">{block.name}</h4>
            {block.isNew && <Badge variant="secondary" className="text-xs">New</Badge>}
            {block.isPremium && (
              <Badge variant="outline" className="text-xs">
                <Star className="h-3 w-3 mr-1" />
                Premium
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">{block.description}</p>
          <div className="flex gap-1 mt-2">
            {block.tags.slice(0, 3).map((tag, idx) => (
              <Badge key={idx} variant="outline" className="text-xs py-0">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-muted-foreground">{block.usage} uses</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-3 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => handleAddBlock(block, e)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add to workflow</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Workflow Block Library</h2>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              onClick={() => setViewMode('grid')}
              className="h-8 px-2"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'list' ? 'default' : 'outline'}
              onClick={() => setViewMode('list')}
              className="h-8 px-2"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search blocks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as BlockCategory)} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="grid grid-cols-8 w-full rounded-none border-b h-auto p-0">
          {(['all', 'mcp', 'api', 'llm', 'file', 'data', 'logic', 'output'] as BlockCategory[]).map(category => (
            <TabsTrigger
              key={category}
              value={category}
              className="rounded-none border-r last:border-r-0 data-[state=active]:bg-accent flex flex-col gap-1 py-3"
            >
              <div className={cn('flex items-center gap-1', getCategoryColor(category))}>
                {getCategoryIcon(category)}
                <span className="text-xs font-medium capitalize">{category === 'all' ? 'All' : category.toUpperCase()}</span>
              </div>
              <Badge variant="outline" className="text-xs h-5">
                {categoryStats[category]}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="flex-1 mt-0 overflow-hidden">
          <ScrollArea className="h-full w-full">
            <div className="p-4 min-h-0">
              {filteredBlocks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">No blocks found</p>
                  <p className="text-xs mt-1">Try adjusting your search or category filter</p>
                </div>
              ) : (
                <div className={cn(
                  viewMode === 'grid' 
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                    : 'space-y-2'
                )}>
                  {filteredBlocks.map(block => 
                    viewMode === 'grid' ? renderBlockCard(block) : renderBlockList(block)
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Selected Block Details */}
      <AnimatePresence>
        {selectedBlock && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t bg-accent/50"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-sm">{selectedBlock.name}</h3>
                <Button
                  size="sm"
                  onClick={() => onBlockAdd?.(selectedBlock)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add to Workflow
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{selectedBlock.description}</p>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-medium">Parameters:</span>
                  <ul className="mt-1 space-y-1">
                    {selectedBlock.parameters.slice(0, 3).map((param, idx) => (
                      <li key={idx} className="flex items-center gap-1">
                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                        <span>{param.name}</span>
                        {param.required && <Badge variant="outline" className="text-xs h-4 px-1">Required</Badge>}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="font-medium">Outputs:</span>
                  <ul className="mt-1 space-y-1">
                    {selectedBlock.outputs.map((output, idx) => (
                      <li key={idx} className="flex items-center gap-1">
                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                        <span>{output.name} ({output.type})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorkflowBlockLibrary;
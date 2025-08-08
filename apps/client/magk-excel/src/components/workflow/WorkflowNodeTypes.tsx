/**
 * WorkflowNodeTypes - Custom React Flow node types for workflow builder
 * Each node type represents an executable block (code, prompt, transform, etc.)
 */

import { useState, useCallback, memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Code, 
  FileText, 
  Database, 
  Globe, 
  FileJson,
  Terminal,
  Sparkles,
  Settings,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Edit2,
  Save,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Node data types
interface BaseNodeData {
  label: string;
  status?: 'pending' | 'running' | 'completed' | 'error';
  output?: any;
  error?: string;
  config?: any;
}

interface CodeNodeData extends BaseNodeData {
  code?: string;
  language?: 'javascript' | 'typescript' | 'python';
}

interface PromptNodeData extends BaseNodeData {
  prompt?: string;
  model?: string;
  temperature?: number;
}

interface WebScrapingNodeData extends BaseNodeData {
  url?: string;
  selector?: string;
  waitForSelector?: string;
}

interface DataTransformNodeData extends BaseNodeData {
  transformations?: string[];
  filters?: string[];
}

interface ExcelNodeData extends BaseNodeData {
  fileName?: string;
  sheetName?: string;
  format?: 'xlsx' | 'csv';
}

interface PdfNodeData extends BaseNodeData {
  source?: 'upload' | 'url';
  extractTables?: boolean;
  extractText?: boolean;
}

interface ApiNodeData extends BaseNodeData {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url?: string;
  headers?: Record<string, string>;
  body?: any;
}

// Status colors and icons
const getStatusColor = (status?: string) => {
  switch (status) {
    case 'running': return 'border-blue-500 bg-blue-50';
    case 'completed': return 'border-green-500 bg-green-50';
    case 'error': return 'border-red-500 bg-red-50';
    default: return 'border-gray-300 bg-white';
  }
};

const getStatusIcon = (status?: string) => {
  switch (status) {
    case 'running': return <Clock className="h-4 w-4 animate-spin text-blue-500" />;
    case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
    default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
  }
};

const getStatusBadge = (status?: string) => {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    running: 'default',
    completed: 'secondary',
    error: 'destructive',
    pending: 'outline'
  };
  
  return (
    <Badge variant={variants[status || 'pending'] || 'outline'} className="text-xs">
      {status || 'pending'}
    </Badge>
  );
};

// Base node component
const BaseNode: React.FC<{
  data: BaseNodeData;
  icon: React.ReactNode;
  color: string;
  children?: React.ReactNode;
  inputs?: number;
  outputs?: number;
}> = ({ data, icon, color, children, inputs = 1, outputs = 1 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  return (
    <Card className={cn(
      "min-w-[250px] transition-all duration-200 shadow-lg",
      getStatusColor(data.status),
      data.status === 'running' && 'animate-pulse'
    )}>
      {/* Input handles */}
      {inputs > 0 && (
        <Handle
          type="target"
          position={Position.Left}
          className="!bg-primary !w-3 !h-3"
          style={{ left: -6 }}
        />
      )}
      
      {/* Output handles */}
      {outputs > 0 && (
        <Handle
          type="source"
          position={Position.Right}
          className="!bg-primary !w-3 !h-3"
          style={{ right: -6 }}
        />
      )}
      
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("p-1.5 rounded-md", color)}>
              {icon}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">{data.label}</span>
              {data.status && getStatusBadge(data.status)}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {getStatusIcon(data.status)}
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="p-3 pt-0">
              {children}
              
              {/* Output display */}
              {data.output && (
                <div className="mt-2 p-2 bg-muted rounded-md">
                  <Label className="text-xs">Output:</Label>
                  <pre className="text-xs mt-1 overflow-auto max-h-32">
                    {JSON.stringify(data.output, null, 2)}
                  </pre>
                </div>
              )}
              
              {/* Error display */}
              {data.error && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                  <Label className="text-xs text-red-600">Error:</Label>
                  <p className="text-xs mt-1 text-red-600">{data.error}</p>
                </div>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

// Code Execution Node
export const CodeNode = memo(({ data, isConnectable }: NodeProps<CodeNodeData>) => {
  const [code, setCode] = useState(data.code || '// Write your code here\nreturn { result: "Hello World" };');
  const [language, setLanguage] = useState(data.language || 'javascript');
  
  return (
    <BaseNode
      data={data}
      icon={<Code className="h-4 w-4 text-blue-600" />}
      color="bg-blue-100"
    >
      <div className="space-y-2">
        <div>
          <Label className="text-xs">Language:</Label>
          <select
            className="w-full text-xs border rounded px-2 py-1 mt-1"
            value={language}
            onChange={(e) => setLanguage(e.target.value as any)}
          >
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
          </select>
        </div>
        <div>
          <Label className="text-xs">Code:</Label>
          <Textarea
            className="font-mono text-xs mt-1"
            rows={4}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Write your code here..."
          />
        </div>
      </div>
    </BaseNode>
  );
});

CodeNode.displayName = 'CodeNode';

// LLM Prompt Node
export const PromptNode = memo(({ data, isConnectable }: NodeProps<PromptNodeData>) => {
  const [prompt, setPrompt] = useState(data.prompt || '');
  const [model, setModel] = useState(data.model || 'gpt-4');
  const [temperature, setTemperature] = useState(data.temperature || 0.7);
  
  return (
    <BaseNode
      data={data}
      icon={<Sparkles className="h-4 w-4 text-purple-600" />}
      color="bg-purple-100"
    >
      <div className="space-y-2">
        <div>
          <Label className="text-xs">Model:</Label>
          <select
            className="w-full text-xs border rounded px-2 py-1 mt-1"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            <option value="gpt-4">GPT-4</option>
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            <option value="claude-3">Claude 3</option>
          </select>
        </div>
        <div>
          <Label className="text-xs">Temperature: {temperature}</Label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            className="w-full mt-1"
          />
        </div>
        <div>
          <Label className="text-xs">Prompt:</Label>
          <Textarea
            className="text-xs mt-1"
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your prompt..."
          />
        </div>
      </div>
    </BaseNode>
  );
});

PromptNode.displayName = 'PromptNode';

// Web Scraping Node
export const WebScrapingNode = memo(({ data, isConnectable }: NodeProps<WebScrapingNodeData>) => {
  const [url, setUrl] = useState(data.url || '');
  const [selector, setSelector] = useState(data.selector || '');
  
  return (
    <BaseNode
      data={data}
      icon={<Globe className="h-4 w-4 text-green-600" />}
      color="bg-green-100"
      inputs={0}
    >
      <div className="space-y-2">
        <div>
          <Label className="text-xs">URL:</Label>
          <Input
            className="text-xs mt-1"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
          />
        </div>
        <div>
          <Label className="text-xs">CSS Selector:</Label>
          <Input
            className="text-xs mt-1"
            value={selector}
            onChange={(e) => setSelector(e.target.value)}
            placeholder=".content, table, h1"
          />
        </div>
      </div>
    </BaseNode>
  );
});

WebScrapingNode.displayName = 'WebScrapingNode';

// Data Transform Node
export const DataTransformNode = memo(({ data, isConnectable }: NodeProps<DataTransformNodeData>) => {
  const [transformations, setTransformations] = useState(
    data.transformations?.join('\n') || 'filter\nmap\nreduce'
  );
  
  return (
    <BaseNode
      data={data}
      icon={<Database className="h-4 w-4 text-orange-600" />}
      color="bg-orange-100"
    >
      <div className="space-y-2">
        <div>
          <Label className="text-xs">Transformations:</Label>
          <Textarea
            className="text-xs mt-1"
            rows={3}
            value={transformations}
            onChange={(e) => setTransformations(e.target.value)}
            placeholder="Enter transformations (one per line)"
          />
        </div>
      </div>
    </BaseNode>
  );
});

DataTransformNode.displayName = 'DataTransformNode';

// Excel Export Node
export const ExcelExportNode = memo(({ data, isConnectable }: NodeProps<ExcelNodeData>) => {
  const [fileName, setFileName] = useState(data.fileName || 'output.xlsx');
  
  return (
    <BaseNode
      data={data}
      icon={<FileJson className="h-4 w-4 text-emerald-600" />}
      color="bg-emerald-100"
      outputs={0}
    >
      <div className="space-y-2">
        <div>
          <Label className="text-xs">File Name:</Label>
          <Input
            className="text-xs mt-1"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="output.xlsx"
          />
        </div>
      </div>
    </BaseNode>
  );
});

ExcelExportNode.displayName = 'ExcelExportNode';

// PDF Extract Node
export const PdfExtractNode = memo(({ data, isConnectable }: NodeProps<PdfNodeData>) => {
  const [extractTables, setExtractTables] = useState(data.extractTables ?? true);
  const [extractText, setExtractText] = useState(data.extractText ?? true);
  
  return (
    <BaseNode
      data={data}
      icon={<FileText className="h-4 w-4 text-red-600" />}
      color="bg-red-100"
      inputs={0}
    >
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="extractTables"
            checked={extractTables}
            onChange={(e) => setExtractTables(e.target.checked)}
          />
          <Label htmlFor="extractTables" className="text-xs">Extract Tables</Label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="extractText"
            checked={extractText}
            onChange={(e) => setExtractText(e.target.checked)}
          />
          <Label htmlFor="extractText" className="text-xs">Extract Text</Label>
        </div>
      </div>
    </BaseNode>
  );
});

PdfExtractNode.displayName = 'PdfExtractNode';

// API Call Node
export const ApiCallNode = memo(({ data, isConnectable }: NodeProps<ApiNodeData>) => {
  const [method, setMethod] = useState(data.method || 'GET');
  const [url, setUrl] = useState(data.url || '');
  
  return (
    <BaseNode
      data={data}
      icon={<Terminal className="h-4 w-4 text-indigo-600" />}
      color="bg-indigo-100"
    >
      <div className="space-y-2">
        <div className="flex gap-2">
          <select
            className="text-xs border rounded px-2 py-1"
            value={method}
            onChange={(e) => setMethod(e.target.value as any)}
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
          </select>
          <Input
            className="text-xs flex-1"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://api.example.com"
          />
        </div>
      </div>
    </BaseNode>
  );
});

ApiCallNode.displayName = 'ApiCallNode';

// Export node types for React Flow
export const nodeTypes = {
  code: CodeNode,
  prompt: PromptNode,
  'web-scraping': WebScrapingNode,
  'data-transform': DataTransformNode,
  'excel-export': ExcelExportNode,
  'pdf-extract': PdfExtractNode,
  'api-call': ApiCallNode,
};

export const WorkflowNodeTypes = nodeTypes;
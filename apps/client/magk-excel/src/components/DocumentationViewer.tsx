/**
 * Documentation Viewer Component
 * Displays markdown documentation with table of contents and search
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import {
  BookOpen,
  Search,
  Menu,
  X,
  ChevronRight,
  ExternalLink,
  Download,
  Share2,
  Copy,
  CheckCircle,
  Users,
  Code,
  Zap,
  Settings,
  FileText,
  HelpCircle,
  Lightbulb
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

// Documentation sections
const DOCUMENTATION_SECTIONS = [
  {
    id: 'user-guide',
    title: 'User Guide',
    description: 'Complete guide for using MAGK Excel',
    icon: <Users className="h-4 w-4" />,
    color: 'text-blue-600',
    content: 'USER_GUIDE_COMPLETE.md'
  },
  {
    id: 'developer-guide',
    title: 'Developer Guide',
    description: 'Technical documentation for developers',
    icon: <Code className="h-4 w-4" />,
    color: 'text-green-600',
    content: 'DEVELOPER_GUIDE.md'
  },
  {
    id: 'research-findings',
    title: 'Research Findings',
    description: 'Comprehensive application analysis',
    icon: <Zap className="h-4 w-4" />,
    color: 'text-purple-600',
    content: 'WORKFLOW_EXCEL_RESEARCH_FINDINGS.md'
  },
  {
    id: 'api-reference',
    title: 'API Reference',
    description: 'Complete API documentation',
    icon: <Settings className="h-4 w-4" />,
    color: 'text-orange-600',
    content: null // Will be generated dynamically
  }
];

// Quick start cards
const QUICK_START_CARDS = [
  {
    title: 'First Workflow',
    description: 'Create your first automation workflow in 5 minutes',
    icon: <Zap className="h-5 w-5" />,
    action: 'Start Tutorial',
    link: '#quick-start'
  },
  {
    title: 'Excel Processing',
    description: 'Learn to process and generate Excel files',
    icon: <FileText className="h-5 w-5" />,
    action: 'Learn Excel',
    link: '#excel-processing'
  },
  {
    title: 'Chat Integration',
    description: 'Use AI chat to build workflows naturally',
    icon: <HelpCircle className="h-5 w-5" />,
    action: 'Try Chat',
    link: '#chat-integration'
  },
  {
    title: 'Best Practices',
    description: 'Tips and tricks for optimal workflow design',
    icon: <Lightbulb className="h-5 w-5" />,
    action: 'View Tips',
    link: '#best-practices'
  }
];

interface DocumentationViewerProps {
  className?: string;
}

interface TOCItem {
  id: string;
  title: string;
  level: number;
  children?: TOCItem[];
}

export const DocumentationViewer: React.FC<DocumentationViewerProps> = ({
  className
}) => {
  const [activeSection, setActiveSection] = useState('user-guide');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [tableOfContents, setTableOfContents] = useState<TOCItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Load markdown content
  useEffect(() => {
    const loadContent = async () => {
      setIsLoading(true);
      try {
        const section = DOCUMENTATION_SECTIONS.find(s => s.id === activeSection);
        if (section?.content) {
          // In a real implementation, you would fetch from the docs folder
          // For now, we'll use placeholder content
          const content = await getMarkdownContent(section.content);
          setMarkdownContent(content);
          generateTableOfContents(content);
        }
      } catch (error) {
        console.error('Failed to load documentation:', error);
        setMarkdownContent('# Documentation Error\n\nFailed to load documentation content.');
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, [activeSection]);

  // Generate table of contents from markdown headers
  const generateTableOfContents = (content: string) => {
    const headers = content.match(/^#{1,6}\s+.+$/gm) || [];
    const toc: TOCItem[] = [];

    headers.forEach(header => {
      const level = header.match(/^#+/)?.[0].length || 1;
      const title = header.replace(/^#+\s+/, '').replace(/[#`*]/g, '');
      const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      toc.push({ id, title, level });
    });

    setTableOfContents(toc);
  };

  // Mock function to get markdown content
  const getMarkdownContent = async (filename: string): Promise<string> => {
    // In production, this would fetch from the actual markdown files
    // For demo purposes, we'll return sample content based on the filename
    switch (filename) {
      case 'USER_GUIDE_COMPLETE.md':
        return `# MAGK Excel User Guide 📖

Welcome to **MAGK Excel** - the intelligent workflow automation platform that combines AI chat, visual workflow building, and powerful Excel processing capabilities.

## 🚀 Quick Start Guide

### Getting Started
1. Launch the application
2. Choose your working mode from the 9 available tabs
3. Start with the Chat tab for AI assistance

### Application Modes
The application offers multiple working modes:

- **Chat**: AI-powered conversations for help and guidance
- **Chat+Workflow**: Combined chat and workflow creation
- **Builder**: Visual workflow creation with drag-and-drop
- **Editor**: Advanced workflow editing and refinement
- **Library**: Browse and manage workflow templates
- **Blocks**: Explore available workflow components
- **Files**: Comprehensive file management system
- **MCP Settings**: Configure processing servers
- **Debug**: Advanced troubleshooting tools

## 💬 Using the Chat Interface

The Chat interface provides intelligent assistance for all your automation needs:

### Key Features
- Natural language processing for workflow creation
- Contextual suggestions based on your needs
- Integration with workflow building
- File processing guidance

## 🎨 Visual Workflow Builder

Create powerful automation workflows with our intuitive visual builder:

### Building Workflows
1. **Add Nodes**: Drag components from the library
2. **Configure**: Set up each node's parameters
3. **Connect**: Link nodes to create data flow
4. **Execute**: Run your workflow and see results

### Available Node Types
- **Web Scraping**: Extract data from websites
- **Transform**: Clean and process data
- **Excel Export**: Generate formatted spreadsheets
- **API Integration**: Connect to external services

## 📊 Excel Processing

Advanced Excel processing capabilities:

### Features
- Multi-sheet workbook creation
- Advanced formatting and styling
- Formula and calculation support
- Template-based generation
- Batch processing capabilities

## 🔧 Advanced Features

### MCP Server Integration
Extend capabilities with Model Context Protocol servers:
- Excel processing server
- Workflow execution engine
- File system operations
- Third-party integrations

### Real-time Execution
- Live progress monitoring
- Node-level status tracking
- Error handling and recovery
- Performance metrics

This is a comprehensive platform designed to make workflow automation accessible to everyone while providing advanced capabilities for power users.`;

      case 'DEVELOPER_GUIDE.md':
        return `# MAGK Excel Developer Guide 🛠️

Complete developer documentation for extending and contributing to the MAGK Excel platform.

## 🏗️ Architecture Overview

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **State Management**: Zustand with persistence
- **UI Components**: Tailwind CSS + Radix UI
- **Real-time**: WebSocket + Server-Sent Events
- **Backend**: Node.js + Python services

### Project Structure
\`\`\`
magk-excel/
├── apps/
│   ├── client/magk-excel/     # Main React app
│   ├── workflow-engine/       # Node.js backend
│   └── server/                # Python services
├── docs/                      # Documentation
└── package.json               # Workspace config
\`\`\`

## 🚀 Development Setup

### Prerequisites
- Node.js 18+
- Python 3.9+
- npm or yarn

### Installation
\`\`\`bash
git clone https://github.com/your-org/magk-excel
cd magk-excel
npm install
npm run dev
\`\`\`

## 🧩 Core Components

### Workflow Store
Zustand store managing all workflow state:

\`\`\`typescript
interface WorkflowStore {
  temporaryWorkflows: Map<string, ExtendedWorkflow>
  permanentWorkflows: Map<string, ExtendedWorkflow>
  activeWorkflow: ExtendedWorkflow | null
  
  createWorkflow: (name: string, type: WorkflowType) => string
  loadWorkflow: (id: string) => void
  saveWorkflow: (id: string) => void
  // ... more actions
}
\`\`\`

### MCP Integration
Model Context Protocol for extensible processing:

\`\`\`typescript
interface MCPService {
  initialize(): Promise<void>
  toggleServer(name: string, enabled: boolean): Promise<void>
  callTool(server: string, tool: string, args: any): Promise<any>
}
\`\`\`

## 🔧 Creating Extensions

### Custom Workflow Nodes
Extend functionality by creating new node types:

\`\`\`typescript
interface CustomNodeData extends NodeData {
  type: 'custom-processor'
  config: {
    inputFormat: string
    outputFormat: string
    options: Record<string, any>
  }
}

const CustomNode: React.FC<NodeProps<CustomNodeData>> = ({ data }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{data.config.name}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Node implementation */}
      </CardContent>
    </Card>
  )
}
\`\`\`

### MCP Server Development
Create custom processing servers:

\`\`\`typescript
class CustomMCPServer {
  private server: Server

  constructor() {
    this.server = new Server('custom-server', '1.0.0')
    this.setupTools()
  }

  private setupTools() {
    this.server.setRequestHandler('tools/list', async () => ({
      tools: [
        {
          name: 'process-data',
          description: 'Process custom data format',
          inputSchema: {
            type: 'object',
            properties: {
              data: { type: 'string' },
              format: { type: 'string' }
            }
          }
        }
      ]
    }))
  }
}
\`\`\`

## 🧪 Testing

### Unit Testing
\`\`\`typescript
describe('CustomComponent', () => {
  it('renders correctly', () => {
    render(<CustomComponent />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })
})
\`\`\`

### Integration Testing
Test complete workflow execution and real-time features.

## 📦 Building and Deployment

### Development Build
\`\`\`bash
npm run build
npm run electron:build
\`\`\`

### Docker Deployment
\`\`\`dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm ci --only=production
CMD ["node", "dist/index.js"]
\`\`\`

This guide provides everything needed to extend and contribute to the MAGK Excel platform.`;

      case 'WORKFLOW_EXCEL_RESEARCH_FINDINGS.md':
        return `# MAGK Excel Research Findings 🔍

**Comprehensive Analysis of Workflow Creation and Excel Processing Capabilities**

*Research Date: January 2025*
*Generated by: Claude Code Research Agent*

## Executive Summary

The MAGK Excel application is a sophisticated Electron-based tool that combines workflow automation with Excel processing capabilities. The application features a modular architecture with real-time execution, comprehensive file handling, and advanced workflow management systems.

### Key Capabilities Discovered:
- **Multi-tab Workflow Interface** with 9 distinct operational modes
- **Real-time Workflow Execution** with WebSocket integration 
- **Advanced Excel Processing** through MCP (Model Context Protocol) servers
- **Bidirectional Chat-Workflow Integration** for AI-powered automation
- **Comprehensive File Management** with upload/download capabilities
- **Template-based Workflow Creation** with visual node editor

## 1. Application Architecture Overview

### 1.1 Main Application Structure
The application implements a sophisticated tab-based interface with multiple operational modes including chat, workflow building, file management, and system configuration.

### 1.2 Core Technology Stack
- **Frontend:** React 18 + TypeScript + Vite
- **State Management:** Zustand with persistence middleware
- **UI Framework:** Tailwind CSS + Radix UI components
- **Real-time:** WebSocket + Server-Sent Events
- **Backend Integration:** MCP (Model Context Protocol) servers

## 2. Workflow Creation System

### 2.1 Visual Workflow Builder
The application features a comprehensive visual workflow builder with drag-and-drop interface, real-time preview, template system, and extensive validation.

### 2.2 Node Types Available
- **Web Scraping Node** - Extract data from websites
- **Transform Node** - Data processing and transformation
- **Excel Export Node** - Generate Excel files with formatting
- **API Node** - HTTP requests and API integration
- **File Processing Node** - Handle various file formats

## 3. Excel Processing Capabilities

### 3.1 Advanced Excel Features
- File generation with formatting control
- Multi-sheet workbook support
- Template-based creation
- Data validation and Excel formula support
- MCP server integration for scalable processing

### 3.2 File Processing Pipeline
Upload → Validation → Processing → Storage → Download with comprehensive format support and error handling.

## 4. Real-time Features

### 4.1 WebSocket Integration
- Dual-protocol support (WebSocket + Server-Sent Events)
- Automatic reconnection with exponential backoff
- Offline queue for disconnection handling
- Health monitoring with heartbeat system

### 4.2 Node Execution Tracking
Real-time progress tracking, status updates, performance metrics, and multi-client synchronization.

## 5. AI-Powered Integration

### 5.1 Chat-Workflow Integration
- Natural language to workflow conversion
- Contextual workflow suggestions
- Embedded workflow execution
- Session persistence

## Conclusions

The MAGK Excel application represents a state-of-the-art workflow automation platform that successfully combines visual workflow creation, real-time execution, AI-powered chat integration, and enterprise-grade file handling capabilities.

**Key Strengths:**
- Comprehensive workflow management system
- Real-time execution with WebSocket integration
- Advanced Excel processing capabilities
- AI-powered workflow generation
- Extensive file format support
- Robust error handling and debugging tools

The application successfully bridges the gap between simple Excel processing and complex workflow automation, providing users with a powerful yet intuitive platform for data manipulation and processing tasks.`;

      default:
        return `# Documentation

Welcome to the MAGK Excel documentation. Please select a section from the sidebar to view detailed information.`;
    }
  };

  // Filter content based on search query
  const filteredContent = useMemo(() => {
    if (!searchQuery.trim()) return markdownContent;
    
    const lines = markdownContent.split('\n');
    const filteredLines = lines.filter(line => 
      line.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return filteredLines.join('\n');
  }, [markdownContent, searchQuery]);

  // Copy link to clipboard
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  return (
    <div className={cn('flex h-full bg-background', className)}>
      {/* Sidebar */}
      <div className={cn(
        'border-r bg-muted/30 transition-all duration-300',
        showSidebar ? 'w-80' : 'w-0'
      )}>
        {showSidebar && (
          <div className="flex flex-col h-full">
            {/* Sidebar Header */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold">Documentation</h2>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowSidebar(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documentation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Navigation */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground mb-2">
                  SECTIONS
                </h3>
                {DOCUMENTATION_SECTIONS.map(section => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors',
                      activeSection === section.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent'
                    )}
                  >
                    <span className={section.color}>{section.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{section.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {section.description}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ))}
              </div>

              {/* Table of Contents */}
              {tableOfContents.length > 0 && (
                <div className="p-4 border-t">
                  <h3 className="text-xs font-semibold text-muted-foreground mb-2">
                    TABLE OF CONTENTS
                  </h3>
                  <div className="space-y-1">
                    {tableOfContents.map(item => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className={cn(
                          'block px-2 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors',
                          item.level > 1 && `ml-${(item.level - 1) * 4}`
                        )}
                        style={{ marginLeft: `${(item.level - 1) * 16}px` }}
                      >
                        {item.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              {!showSidebar && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowSidebar(true)}
                >
                  <Menu className="h-4 w-4" />
                </Button>
              )}
              <div>
                <h1 className="font-semibold">
                  {DOCUMENTATION_SECTIONS.find(s => s.id === activeSection)?.title}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {DOCUMENTATION_SECTIONS.find(s => s.id === activeSection)?.description}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={copyLink}>
                {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>
              <Button size="sm" variant="outline">
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeSection === 'user-guide' && !searchQuery && (
            <div className="p-6 space-y-6">
              {/* Quick Start Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {QUICK_START_CARDS.map(card => (
                  <Card key={card.title} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-md bg-primary/10 text-primary">
                          {card.icon}
                        </div>
                        <CardTitle className="text-sm">{card.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs text-muted-foreground mb-3">
                        {card.description}
                      </p>
                      <Button size="sm" variant="outline" className="w-full">
                        {card.action}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Getting Started Alert */}
              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertTitle>New to MAGK Excel?</AlertTitle>
                <AlertDescription>
                  Start with the Chat tab to get AI-powered guidance, then explore the Visual Workflow Builder to create your first automation.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <ScrollArea className="flex-1">
            <div className="max-w-4xl mx-auto p-6">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading documentation...</p>
                  </div>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="prose prose-slate dark:prose-invert max-w-none">
                    <ReactMarkdown
                      components={{
                      h1: ({ children }) => (
                        <h1 className="text-3xl font-bold mb-6 text-foreground border-b pb-2">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-2xl font-semibold mt-8 mb-4 text-foreground">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">
                          {children}
                        </h3>
                      ),
                      code: ({ inline, children }) => (
                        inline ? (
                          <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
                            {children}
                          </code>
                        ) : (
                          <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                            <code className="text-sm font-mono">{children}</code>
                          </pre>
                        )
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-primary pl-4 my-4 italic text-muted-foreground">
                          {children}
                        </blockquote>
                      ),
                      table: ({ children }) => (
                        <div className="overflow-x-auto my-4">
                          <table className="w-full border-collapse border border-border">
                            {children}
                          </table>
                        </div>
                      ),
                      th: ({ children }) => (
                        <th className="border border-border bg-muted px-4 py-2 text-left font-semibold">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="border border-border px-4 py-2">
                          {children}
                        </td>
                      ),
                    }}
                  >
                    {filteredContent}
                    </ReactMarkdown>
                  </div>
                </motion.div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default DocumentationViewer;
# MAGK Excel Developer Guide 🛠️

Complete developer documentation for extending and contributing to the MAGK Excel platform.

---

## 🏗️ Architecture Overview

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **State Management**: Zustand with persistence middleware  
- **UI Components**: Tailwind CSS + Radix UI
- **Real-time**: WebSocket + Server-Sent Events
- **Backend**: Node.js workflow engine + Python extraction server
- **Desktop**: Electron for cross-platform deployment

### Project Structure
```
magk-excel/
├── apps/
│   ├── client/magk-excel/          # Main Electron React app
│   ├── workflow-engine/            # Node.js workflow execution
│   └── server/                     # Python extraction server
├── docs/                           # Documentation
└── package.json                    # Workspace configuration
```

---

## 🚀 Development Setup

### Prerequisites
```bash
# Required software
Node.js 18+
Python 3.9+
npm or yarn
```

### Installation
```bash
# Clone the repository
git clone https://github.com/your-org/magk-excel
cd magk-excel

# Install dependencies for all workspaces
npm install

# Start the development servers
npm run dev:client      # React app (port 5173)
npm run dev:engine      # Workflow engine (port 8000)  
npm run dev:server      # Python server (port 8080)
```

### Development Commands
```bash
# Frontend development
cd apps/client/magk-excel
npm run dev             # Start Vite dev server
npm run build           # Build for production
npm run electron        # Run as Electron app
npm run test            # Run tests

# Backend development
cd apps/workflow-engine
npm run dev             # Start with hot reload
npm run build           # Build TypeScript
npm run test            # Run test suite

# Python server
cd apps/server
python -m chalice local # Start local development
pytest                  # Run tests
```

---

## 🧩 Core Components

### 1. Application Shell (`src/App.tsx`)
Main application component with tab-based navigation:

```typescript
function App() {
  const [activeTab, setActiveTab] = useState<TabType>('chat')
  const { initialize, tools } = useMCPStore()
  const { createWorkflow, activeWorkflow } = useWorkflowStore()
  
  // Tab configuration
  const tabs = [
    'chat', 'chat-workflow', 'builder', 'editor', 
    'library', 'blocks', 'files', 'mcp', 'debug'
  ]
  
  return (
    <div className="h-screen w-screen flex flex-col">
      <Header />
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {/* Tab content */}
      </Tabs>
    </div>
  )
}
```

### 2. Workflow Store (`src/stores/workflowStore.ts`)
Zustand store managing workflow state:

```typescript
interface WorkflowStoreState {
  // Workflow collections
  temporaryWorkflows: Map<string, ExtendedWorkflow>
  permanentWorkflows: Map<string, ExtendedWorkflow>
  templates: Map<string, ExtendedWorkflow>
  
  // Active workflow
  activeWorkflow: ExtendedWorkflow | null
  
  // Management actions
  createWorkflow: (name: string, type: WorkflowType) => string
  loadWorkflow: (id: string) => void
  saveWorkflow: (id: string) => void
  // ... more actions
}

export const useWorkflowStore = create<WorkflowStoreState>()(
  immer((set, get) => ({
    // Implementation
  }))
)
```

### 3. MCP Service Integration (`src/services/mcpService.ts`)
Manages Model Context Protocol servers:

```typescript
interface MCPState {
  availableServers: string[]
  enabledServers: string[]
  tools: MCPTool[]
  
  // Actions
  initialize: () => Promise<void>
  toggleServer: (name: string, enabled: boolean) => Promise<void>
  callTool: (server: string, tool: string, args: any) => Promise<any>
}
```

---

## 🔧 Creating Custom Components

### Workflow Nodes
Create custom workflow nodes by extending the base node interface:

```typescript
// 1. Define node data interface
interface CustomNodeData extends NodeData {
  type: 'custom-processor'
  config: {
    inputFormat: string
    outputFormat: string
    processingOptions: Record<string, any>
  }
}

// 2. Create node component
const CustomProcessorNode: React.FC<NodeComponentProps<CustomNodeData>> = ({
  data,
  onUpdate
}) => {
  return (
    <Card className="min-w-[200px]">
      <CardHeader>
        <CardTitle>{data.config.name}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Node UI */}
        <Button onClick={() => onUpdate({ status: 'running' })}>
          Process Data
        </Button>
      </CardContent>
    </Card>
  )
}

// 3. Register node type
import { NodeRegistry } from '@/components/workflow/NodeRegistry'
NodeRegistry.register('custom-processor', CustomProcessorNode)
```

### MCP Tools
Create custom MCP tools for extending processing capabilities:

```typescript
// tools/custom-tool.ts
import { MCPTool } from '@/types/mcp'

export class CustomMCPTool implements MCPTool {
  name = 'custom-data-processor'
  description = 'Process custom data formats'
  
  async execute(args: {
    inputData: any
    options: ProcessingOptions
  }): Promise<ProcessingResult> {
    // Custom processing logic
    return {
      success: true,
      data: processedData,
      metadata: { processedAt: new Date() }
    }
  }
}
```

### UI Components
Follow the established patterns for consistency:

```typescript
// components/CustomComponent.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CustomComponentProps {
  title: string
  data: any[]
  onAction: (action: string) => void
  className?: string
}

export const CustomComponent: React.FC<CustomComponentProps> = ({
  title,
  data,
  onAction,
  className
}) => {
  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Component content */}
        <Button onClick={() => onAction('process')}>
          Process Data
        </Button>
      </CardContent>
    </Card>
  )
}
```

---

## 🔌 MCP Server Development

### Creating MCP Servers
MCP servers extend the application's processing capabilities:

```typescript
// mcp-servers/custom-server.ts
import { Server } from '@modelcontextprotocol/sdk/server'

class CustomMCPServer {
  private server: Server

  constructor() {
    this.server = new Server('custom-server', '1.0.0')
    this.setupTools()
  }

  private setupTools() {
    // Define available tools
    this.server.setRequestHandler('tools/list', async () => ({
      tools: [
        {
          name: 'process-custom-data',
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

    // Handle tool execution
    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params
      
      switch (name) {
        case 'process-custom-data':
          return await this.processCustomData(args)
        default:
          throw new Error(`Unknown tool: ${name}`)
      }
    })
  }

  private async processCustomData(args: any) {
    // Custom processing logic
    return {
      content: [
        {
          type: 'text',
          text: `Processed ${args.data} in ${args.format} format`
        }
      ]
    }
  }
}
```

### Server Registration
Register your MCP server in the configuration:

```json
// mcp-config.json
{
  "servers": {
    "custom-server": {
      "command": "node",
      "args": ["mcp-servers/custom-server.js"],
      "type": "stdio"
    }
  }
}
```

---

## 📊 State Management Patterns

### Zustand Store Creation
```typescript
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { persist } from 'zustand/middleware'

interface CustomState {
  data: CustomData[]
  isLoading: boolean
  
  actions: {
    loadData: () => Promise<void>
    updateData: (id: string, updates: Partial<CustomData>) => void
    clearData: () => void
  }
}

export const useCustomStore = create<CustomState>()(
  persist(
    immer((set, get) => ({
      data: [],
      isLoading: false,
      
      actions: {
        loadData: async () => {
          set((state) => { state.isLoading = true })
          
          try {
            const data = await fetchCustomData()
            set((state) => { 
              state.data = data
              state.isLoading = false
            })
          } catch (error) {
            set((state) => { state.isLoading = false })
            throw error
          }
        },
        
        updateData: (id, updates) => {
          set((state) => {
            const item = state.data.find(d => d.id === id)
            if (item) Object.assign(item, updates)
          })
        },
        
        clearData: () => {
          set((state) => { state.data = [] })
        }
      }
    })),
    {
      name: 'custom-storage',
      partialize: (state) => ({ data: state.data })
    }
  )
)
```

### Real-time Integration
```typescript
import { useNodeExecutionStore } from '@/stores/nodeExecutionStore'

function CustomRealtimeComponent({ workflowId }: { workflowId: string }) {
  const { actions, connectionState } = useNodeExecutionStore()
  
  useEffect(() => {
    // Subscribe to workflow updates
    const subscription = actions.subscribeToWorkflow(
      workflowId,
      (event) => {
        console.log('Workflow event:', event)
        // Handle real-time updates
      }
    )
    
    return () => actions.unsubscribe(subscription)
  }, [workflowId])
  
  return (
    <div>
      Connection: {connectionState}
      {/* Component content */}
    </div>
  )
}
```

---

## 🧪 Testing

### Unit Tests
```typescript
// __tests__/CustomComponent.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { CustomComponent } from '@/components/CustomComponent'

describe('CustomComponent', () => {
  it('renders with title', () => {
    render(
      <CustomComponent 
        title="Test Component"
        data={[]}
        onAction={jest.fn()}
      />
    )
    
    expect(screen.getByText('Test Component')).toBeInTheDocument()
  })
  
  it('calls onAction when button clicked', () => {
    const mockAction = jest.fn()
    
    render(
      <CustomComponent
        title="Test"
        data={[]}
        onAction={mockAction}
      />
    )
    
    fireEvent.click(screen.getByText('Process Data'))
    expect(mockAction).toHaveBeenCalledWith('process')
  })
})
```

### Integration Tests
```typescript
// __tests__/workflow-integration.test.ts
import { useWorkflowStore } from '@/stores/workflowStore'
import { renderHook, act } from '@testing-library/react'

describe('Workflow Integration', () => {
  it('creates and manages workflows', async () => {
    const { result } = renderHook(() => useWorkflowStore())
    
    act(() => {
      const workflowId = result.current.createWorkflow(
        'Test Workflow',
        'temporary'
      )
      expect(workflowId).toBeTruthy()
    })
    
    expect(result.current.temporaryWorkflows.size).toBe(1)
  })
})
```

---

## 📦 Building and Deployment

### Development Build
```bash
# Frontend
npm run build

# Backend services
npm run build:engine
npm run build:server
```

### Electron Distribution
```bash
# Build for all platforms
npm run electron:build

# Platform-specific builds
npm run electron:build:win
npm run electron:build:mac  
npm run electron:build:linux
```

### Docker Deployment
```dockerfile
# Dockerfile for workflow engine
FROM node:18-alpine

WORKDIR /app
COPY apps/workflow-engine/package*.json ./
RUN npm ci --only=production

COPY apps/workflow-engine/dist ./dist
EXPOSE 8000

CMD ["node", "dist/index.js"]
```

---

## 🐛 Debugging

### Development Tools
1. **Browser DevTools** - Standard web debugging
2. **React DevTools** - Component inspection
3. **Zustand DevTools** - State management debugging
4. **Network Monitor** - WebSocket/API monitoring

### Built-in Debug Features
```typescript
// Enable debug logging
localStorage.setItem('debug', 'magk:*')

// Access stores from console
window.__MAGK_STORES__ = {
  workflow: useWorkflowStore,
  mcp: useMCPStore,
  execution: useNodeExecutionStore
}
```

### Common Issues and Solutions

**MCP Server Connection Issues:**
```bash
# Check server status
npm run mcp:status

# Restart servers
npm run mcp:restart

# Clear server cache
npm run mcp:clear-cache
```

**Workflow Execution Problems:**
1. Check MCP server availability in settings
2. Verify node connections in workflow editor
3. Monitor real-time execution in debug tab
4. Check browser console for detailed errors

---

## 🤝 Contributing

### Code Style
- **TypeScript** for all new code
- **Functional components** with hooks
- **Consistent naming** (camelCase for variables, PascalCase for components)
- **Comprehensive error handling** with proper logging

### Commit Guidelines
```bash
# Commit message format
type(scope): description

# Examples
feat(workflow): add custom node type support
fix(excel): resolve formatting issues with large datasets
docs(api): update MCP server documentation
```

### Pull Request Process
1. **Fork** the repository
2. **Create feature branch** from `main`
3. **Write tests** for new functionality
4. **Update documentation** as needed
5. **Submit pull request** with detailed description

---

## 📚 API Reference

### Workflow Store API
```typescript
interface WorkflowStore {
  // State
  temporaryWorkflows: Map<string, ExtendedWorkflow>
  permanentWorkflows: Map<string, ExtendedWorkflow>
  activeWorkflow: ExtendedWorkflow | null
  
  // Actions
  createWorkflow(name: string, type: WorkflowType, chatSessionId?: string): string
  loadWorkflow(id: string): void
  saveWorkflow(id: string): void
  deleteWorkflow(id: string): void
  duplicateWorkflow(id: string): string
  
  // Node management
  addNode(node: WorkflowNode): void
  updateNode(nodeId: string, updates: Partial<WorkflowNode>): void
  deleteNode(nodeId: string): void
  
  // Execution
  startExecution(workflowId: string): void
  pauseExecution(workflowId: string): void
  stopExecution(workflowId: string): void
}
```

### MCP Service API
```typescript
interface MCPService {
  // Server management
  initialize(): Promise<void>
  toggleServer(serverName: string, enabled: boolean): Promise<void>
  
  // Tool execution
  callTool(serverName: string, toolName: string, args: any): Promise<any>
  readResource(serverName: string, uri: string): Promise<any>
  
  // Smithery integration
  searchSmitheryServers(query: string): Promise<void>
  installSmitheryServer(qualifiedName: string, config?: Record<string, any>): Promise<void>
}
```

---

## 🔍 Performance Optimization

### Best Practices
1. **Lazy load** large components and data sets
2. **Memoize** expensive computations with `useMemo`
3. **Debounce** user input for search and filtering
4. **Virtualize** large lists with react-window
5. **Optimize** bundle size with code splitting

### Monitoring
```typescript
// Performance monitoring hook
export const usePerformanceMonitor = (operationName: string) => {
  const startTime = useRef<number>()
  
  const start = () => {
    startTime.current = performance.now()
  }
  
  const end = () => {
    const duration = performance.now() - (startTime.current || 0)
    console.log(`${operationName}: ${duration.toFixed(2)}ms`)
    return duration
  }
  
  return { start, end }
}
```

---

## 📞 Support and Resources

### Getting Help
1. **Documentation** - Check this developer guide
2. **Issues** - GitHub issues for bugs and features
3. **Discussions** - Community Q&A and feature discussions
4. **Discord** - Real-time community chat

### Useful Links
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [Zustand Guide](https://github.com/pmndrs/zustand)
- [Electron Documentation](https://www.electronjs.org/docs)
- [MCP Specification](https://spec.modelcontextprotocol.org/)

---

*Happy coding! 🚀 Join our community of developers building the future of workflow automation.*
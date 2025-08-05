import { useState, useEffect } from 'react'
import { ChatInterface } from './components/ChatInterface'
import { WorkflowDemo } from './components/workflow'
import { MCPServerToggle } from './components/MCPServerToggle'
import { Button } from './components/ui/button'
import { useMCPStore } from './services/mcpService'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'workflow' | 'mcp'>('workflow')
  const { initialize, tools, enabledServers } = useMCPStore()
  
  // Initialize MCP on app startup
  useEffect(() => {
    console.log('🚀 App: Initializing MCP store on startup...')
    initialize().then(async () => {
      console.log('✅ App: MCP initialized with', tools.length, 'tools from', enabledServers.length, 'servers')
      
      // Auto-enable Excel server if not already enabled
      if (!enabledServers.includes('excel')) {
        console.log('🔧 App: Auto-enabling Excel MCP server...')
        const { toggleServer } = useMCPStore.getState()
        await toggleServer('excel', true)
      }
    }).catch((error) => {
      console.error('❌ App: MCP initialization failed:', error)
    })
  }, [])

  return (
    <div className="h-screen w-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-foreground">MAGK Excel</h1>
          <span className="text-sm text-muted-foreground">Workflow Builder</span>
          {tools.length > 0 && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
              {tools.length} MCP tools
            </span>
          )}
        </div>
        
        {/* Tab Navigation */}
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'chat' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('chat')}
          >
            💬 Chat
          </Button>
          <Button
            variant={activeTab === 'workflow' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('workflow')}
          >
            🔄 Workflow Demo
          </Button>
          <Button
            variant={activeTab === 'mcp' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('mcp')}
          >
            🔧 MCP Servers
          </Button>
        </div>
        
        <div className="text-sm text-muted-foreground">
          v0.1.1
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'chat' ? (
          <ChatInterface />
        ) : activeTab === 'mcp' ? (
          <div className="p-6">
            <MCPServerToggle />
          </div>
        ) : (
          <WorkflowDemo />
        )}
      </main>
    </div>
  )
}

export default App

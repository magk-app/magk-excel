import { useState } from 'react'
import { ChatInterface } from './components/ChatInterface'
import { WorkflowDemo } from './components/workflow'
import { MCPServerToggle } from './components/MCPServerToggle'
import { Button } from './components/ui/button'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'workflow' | 'mcp'>('workflow')

  return (
    <div className="h-screen w-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-foreground">MAGK Excel</h1>
          <span className="text-sm text-muted-foreground">Workflow Builder</span>
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

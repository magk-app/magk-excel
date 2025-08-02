import { ChatInterface } from './components/ChatInterface'
import './App.css'

function App() {
  return (
    <div className="h-screen w-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-foreground">MAGK Excel</h1>
          <span className="text-sm text-muted-foreground">Workflow Builder</span>
        </div>
        <div className="text-sm text-muted-foreground">
          v0.1.1
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Chat Panel */}
        <div className="flex-1 min-w-0">
          <ChatInterface />
        </div>
        
        {/* Future: Workflow Visualization Panel */}
        {/* <div className="w-1/2 border-l border-border">
          <WorkflowCanvas />
        </div> */}
      </main>
    </div>
  )
}

export default App

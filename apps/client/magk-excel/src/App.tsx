import React, { useState, useEffect } from 'react'
import { ChatInterface } from './components/ChatInterface'
import { WorkflowDemo } from './components/workflow'
import { MCPServerToggle } from './components/MCPServerToggle'
import WorkflowStoreEditor from './components/workflow/WorkflowStoreEditor'

import TestWorkflowStore from './components/workflow/TestWorkflowStore'
import WorkflowBlockLibrary from './components/workflow/WorkflowBlockLibrary'
import ChatWorkflowIntegration from './components/ChatWorkflowIntegration'
import { PDFExtractorPanel } from './components/PDFExtractorPanel'
import { Button } from './components/ui/button'
import { Badge } from './components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'
import { ScrollArea } from './components/ui/scroll-area'
import { cn } from './lib/utils'
import { useMCPStore } from './services/mcpService'
import { useWorkflowStore, WorkflowType } from './stores/workflowStore'
import { 
  MessageSquare, 
  Settings, 
  Plus,
  FolderOpen,
  Workflow,
  FileText
} from 'lucide-react'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'workflow' | 'demo' | 'mcp' | 'debug' | 'pdf'>('chat')
  const { initialize, tools, enabledServers } = useMCPStore()
  const { 
    createWorkflow, 
    activeWorkflow,
    temporaryWorkflows,
    permanentWorkflows,
    loadWorkflow
  } = useWorkflowStore()
  
  // Debug: Log store state changes
  React.useEffect(() => {
    console.log('🔍 Store state changed:', {
      temporaryWorkflows: temporaryWorkflows.size,
      permanentWorkflows: permanentWorkflows.size,
      activeWorkflow: activeWorkflow?.name
    });
  }, [temporaryWorkflows, permanentWorkflows, activeWorkflow])
  
  // Initialize MCP on app startup - ONLY ONCE
  useEffect(() => {
    console.log('🚀 App: Initializing MCP store on startup...')
    initialize().then(async () => {
      const state = useMCPStore.getState()
      console.log('✅ App: MCP initialized with', state.tools.length, 'tools from', state.enabledServers.length, 'servers')
      
      // Auto-enable Excel server if not already enabled
      if (!state.enabledServers.includes('excel')) {
        console.log('🔧 App: Auto-enabling Excel MCP server...')
        await state.toggleServer('excel', true)
      }
      
      // Auto-enable PDF server if not already enabled
      if (!state.enabledServers.includes('pdf')) {
        console.log('🔧 App: Auto-enabling PDF MCP server...')
        await state.toggleServer('pdf', true)
      }
    }).catch((error) => {
      console.error('❌ App: MCP initialization failed:', error)
    })
  }, []) // Empty dependency array - run only once on mount

  // Handle creating a new workflow with dedicated chat session (1:1 relationship)
  const handleCreateWorkflow = () => {
    console.log('🚀 handleCreateWorkflow called');
    console.log('Store functions available:', {
      createWorkflow: typeof createWorkflow,
      loadWorkflow: typeof loadWorkflow,
      temporaryWorkflows: temporaryWorkflows?.size,
      permanentWorkflows: permanentWorkflows?.size
    });
    
    try {
      // Each workflow gets its own unique chat session ID for 1:1 relationship
      const uniqueChatSessionId = `workflow-chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const workflowName = `Workflow ${new Date().toLocaleTimeString()}`
      
      console.log('🔧 About to create workflow:', {
        name: workflowName,
        type: WorkflowType.TEMPORARY,
        chatSessionId: uniqueChatSessionId
      });
      
      const workflowId = createWorkflow(
        workflowName,
        WorkflowType.TEMPORARY,
        uniqueChatSessionId
      )
      
      console.log('📝 Created workflow ID:', workflowId);
      
      if (workflowId) {
        console.log('🔄 Loading workflow...');
        loadWorkflow(workflowId);
        
        // Force a state check immediately
        const currentState = useWorkflowStore.getState();
        console.log('📊 Current store state:', {
          activeWorkflow: currentState.activeWorkflow?.name,
          temporaryWorkflows: currentState.temporaryWorkflows.size,
          permanentWorkflows: currentState.permanentWorkflows.size
        });
        
        console.log('✅ Workflow creation completed successfully');
      } else {
        console.error('❌ Failed to create workflow - no ID returned');
      }
    } catch (error) {
      console.error('💥 Error in handleCreateWorkflow:', error);
    }
  }

  // Handle selecting a workflow from library
  const handleWorkflowSelect = (workflow: any) => {
    loadWorkflow(workflow.id)
    setActiveTab('workflow')
  }

  // Get workflow counts
  const workflowStats = {
    temporary: temporaryWorkflows.size,
    permanent: permanentWorkflows.size,
    total: temporaryWorkflows.size + permanentWorkflows.size
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-background">
      {/* Enhanced Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Workflow className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold text-foreground">MAGK Excel</h1>
            <Badge variant="outline" className="ml-2">v0.1.2</Badge>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            {tools.length > 0 && (
              <Badge variant="secondary">
                {tools.length} MCP tools
              </Badge>
            )}
            {workflowStats.total > 0 && (
              <Badge variant="default">
                {workflowStats.total} workflows
              </Badge>
            )}
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => {
              console.log('🧪 Test button clicked');
              alert('Test button works!');
            }}
            variant="outline"
            className="gap-1"
          >
            Test
          </Button>
          <Button
            size="sm"
            onClick={handleCreateWorkflow}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            New Workflow
          </Button>
        </div>
      </header>

      {/* Main Content with Tabs */}
      <main className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="h-full flex flex-col">
          <div className="border-b px-6 py-2 bg-muted/30">
            <TabsList className="bg-transparent">
              <TabsTrigger value="chat" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="workflow" className="gap-2">
                <Workflow className="h-4 w-4" />
                Workflow
              </TabsTrigger>
              
              <TabsTrigger value="demo" className="gap-2">
                <FolderOpen className="h-4 w-4" />
                Demo
              </TabsTrigger>
              <TabsTrigger value="mcp" className="gap-2">
                <Settings className="h-4 w-4" />
                MCP Settings
              </TabsTrigger>
              <TabsTrigger value="debug" className="gap-2">
                <Settings className="h-4 w-4" />
                Debug Store
              </TabsTrigger>
              <TabsTrigger value="pdf" className="gap-2">
                <FileText className="h-4 w-4" />
                PDF Extractor
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Quick Chat */}
          <TabsContent value="chat" className="flex-1 mt-0 overflow-hidden">
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="px-4 py-2 border-b bg-muted/30 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Quick Chat</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // Create workflow with dedicated chat session (1:1 relationship)
                      const uniqueChatSessionId = `workflow-chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                      const workflowId = createWorkflow(
                        `Workflow ${new Date().toLocaleTimeString()}`,
                        WorkflowType.TEMPORARY,
                        uniqueChatSessionId
                      )
                      if (workflowId) {
                        loadWorkflow(workflowId)
                        setActiveTab('workflow')
                      }
                    }}
                    className="gap-2"
                  >
                    <Workflow className="h-4 w-4" />
                    Create Workflow
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  For complex tasks, create a workflow to organize your work
                </p>
              </div>
              
              {/* Simple Chat Interface */}
              <div className="flex-1 min-h-0 overflow-hidden">
                <ChatInterface />
              </div>
            </div>
          </TabsContent>

          {/* Unified Workflow Tab */}
          <TabsContent value="workflow" className="flex-1 mt-0 overflow-hidden">
            <div className="h-full flex">
              {/* Simplified Workflow Library Sidebar */}
              <div className="w-80 border-r bg-muted/30 flex flex-col">
                {/* Header */}
                <div className="p-4 border-b bg-background/50">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold text-lg">Workflows</h2>
                    <Button 
                      onClick={(e) => {
                        console.log('🎯 Button clicked!', e);
                        handleCreateWorkflow();
                      }} 
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      New ({temporaryWorkflows.size + permanentWorkflows.size})
                    </Button>
                  </div>
                </div>
                
                {/* Workflow List */}
                <ScrollArea className="flex-1">
                  <div className="p-2 space-y-2">
                    {Array.from(temporaryWorkflows.values()).concat(Array.from(permanentWorkflows.values())).map((workflow) => (
                      <Card
                        key={workflow.id}
                        className={cn(
                          'cursor-pointer transition-all hover:shadow-md',
                          activeWorkflow?.id === workflow.id 
                            ? 'ring-2 ring-primary bg-primary/5' 
                            : 'hover:bg-muted/50'
                        )}
                        onClick={() => handleWorkflowSelect(workflow)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-sm truncate" title={workflow.name}>
                                {workflow.name}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                {new Date(workflow.metadata.modified).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge variant={workflow.type === WorkflowType.TEMPORARY ? 'secondary' : 'default'} className="text-xs">
                              {workflow.type === WorkflowType.TEMPORARY ? 'Live Chat' : 'Saved'}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {workflow.nodes.length} blocks
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {workflow.status}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    {temporaryWorkflows.size === 0 && permanentWorkflows.size === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <div className="text-4xl mb-2">🔧</div>
                        <p className="text-sm">No workflows yet</p>
                        <p className="text-xs">Create one to get started</p>
                        <div className="mt-4 text-xs">
                          <p>Debug: T:{temporaryWorkflows.size} P:{permanentWorkflows.size}</p>
                          <p>Active: {activeWorkflow?.name || 'none'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
              
              {/* Main Workflow Area */}
              <div className="flex-1 flex flex-col">
                {activeWorkflow ? (
                  <div className="h-full flex">
                    {/* Workflow Editor */}
                    <div className="flex-1 min-w-0">
                      <WorkflowStoreEditor />
                    </div>
                    
                    {/* Integrated Block Library */}
                    <div className="w-80 border-l bg-muted/30 flex flex-col">
                      <div className="p-4 border-b bg-background/50">
                        <h3 className="font-semibold text-sm">Block Library</h3>
                        <p className="text-xs text-muted-foreground">
                          Drag blocks to build your workflow
                        </p>
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <WorkflowBlockLibrary
                          isOpen={true}
                          onToggle={() => {}} // Always open when integrated
                          onBlockSelect={(block) => {
                            console.log('Block selected:', block)
                          }}
                          onBlockAdd={(block) => {
                            console.log('Adding block to workflow:', block)
                            // Add block to current active workflow
                          }}
                          viewMode="grid"
                          className="h-full border-none bg-transparent [&>div:first-child]:hidden" // Hide the header
                        />
                      </div>
                    </div>
                    
                    {/* Workflow Chat - Bottom Panel */}
                    <div className="absolute bottom-4 right-4 w-96 h-64 bg-background border border-border rounded-lg shadow-lg z-10 flex flex-col">
                      <div className="p-3 border-b bg-background/50 flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-xs">Workflow Chat</h3>
                          <p className="text-xs text-muted-foreground">
                            Discuss and refine this workflow
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => {
                            // Toggle chat panel
                          }}
                        >
                          ×
                        </Button>
                      </div>
                      <div className="flex-1 min-h-0 p-2">
                        <ChatWorkflowIntegration
                          chatSessionId={activeWorkflow.chatSessionId!}
                          onWorkflowGenerate={(prompt) => {
                            console.log('Updating workflow from chat:', prompt)
                          }}
                          onWorkflowExecute={(workflowId) => {
                            console.log('Executing workflow from chat:', workflowId)
                          }}
                          className="h-full"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <Card className="max-w-md">
                      <CardHeader className="text-center">
                        <CardTitle>Welcome to Workflows</CardTitle>
                        <CardDescription>
                          Build workflows using blocks from the integrated library
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex gap-2 justify-center">
                        <Button onClick={handleCreateWorkflow}>
                          <Plus className="h-4 w-4 mr-1" />
                          Create Your First Workflow
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>



          {/* Original Demo */}
          <TabsContent value="demo" className="flex-1 mt-0 overflow-hidden">
            <WorkflowDemo />
          </TabsContent>

          {/* MCP Settings */}
          <TabsContent value="mcp" className="flex-1 mt-0 overflow-hidden">
            <div className="p-6">
              <MCPServerToggle />
            </div>
          </TabsContent>

          {/* Debug Store */}
          <TabsContent value="debug" className="flex-1 mt-0 overflow-hidden">
            <TestWorkflowStore />
          </TabsContent>

          {/* PDF Extractor */}
          <TabsContent value="pdf" className="flex-1 mt-0 overflow-hidden">
            <div className="h-full p-6 overflow-auto">
              <PDFExtractorPanel 
                onExtractedContent={(content, result) => {
                  console.log('PDF content extracted:', { content: content.substring(0, 100) + '...', result });
                }}
                onSendToChat={(content, result) => {
                  console.log('Sending PDF content to chat:', { fileName: result.fileName, pages: result.totalPages, tables: result.tables.length });
                  // Switch to chat tab so user can interact with extracted content
                  setActiveTab('chat');
                  // TODO: Pre-populate chat with extracted content
                }}
              />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Status Bar */}
      <footer className="flex items-center justify-between px-6 py-2 border-t border-border bg-muted/30 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>Ready</span>
          {activeWorkflow && (
            <>
              <span>•</span>
              <span>Active: {activeWorkflow.name}</span>
              <span>({activeWorkflow.type === WorkflowType.TEMPORARY ? 'Temporary' : 'Permanent'})</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span>{workflowStats.temporary} temporary</span>
          <span>•</span>
          <span>{workflowStats.permanent} permanent</span>
          <span>•</span>
          <span>{enabledServers.length} MCP servers</span>
        </div>
      </footer>
    </div>
  )
}

export default App
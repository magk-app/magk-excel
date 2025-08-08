import { useState, useEffect } from 'react'
import { ChatInterface } from './components/ChatInterface'
import { WorkflowDemo } from './components/workflow'
import { MCPServerToggle } from './components/MCPServerToggle'
import WorkflowEditor from './components/workflow/WorkflowEditor'
import WorkflowStoreEditor from './components/workflow/WorkflowStoreEditor'
import WorkflowLibraryInterface from './components/workflow/WorkflowLibraryInterface'
import TestWorkflowStore from './components/workflow/TestWorkflowStore'
import WorkflowBlockLibrary from './components/workflow/WorkflowBlockLibrary'
import ChatWorkflowIntegration from './components/ChatWorkflowIntegration'
import WorkflowBuilder from './components/workflow/WorkflowBuilder'
import { CreateWorkflowDialog } from './components/workflow/CreateWorkflowDialog'
import FileManager from './components/FileManager'
import DocumentationViewer from './components/DocumentationViewer'
import { DeveloperTestPanel } from './components/DeveloperTestPanel'
import { Button } from './components/ui/button'
import { Badge } from './components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'
import { useMCPStore } from './services/mcpService'
import { useWorkflowStore, WorkflowType } from './stores/workflowStore'
import { initializeApiKeyStorage } from './utils/apiKeyStorage'
import { storageIntegrationService } from './services/persistence/StorageIntegrationService'
import { 
  MessageSquare, 
  GitBranch, 
  Library, 
  Blocks, 
  Settings, 
  Plus,
  FolderOpen,
  Sparkles,
  Workflow,
  Eye,
  EyeOff,
  Files,
  HardDrive,
  BookOpen,
  FlaskConical
} from 'lucide-react'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'chat-workflow' | 'builder' | 'editor' | 'library' | 'blocks' | 'demo' | 'mcp' | 'debug' | 'files' | 'docs' | 'devtest'>('chat')
  const [chatSessionId] = useState(`session-${Date.now()}`)
  const [showWorkflowInChat, setShowWorkflowInChat] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [currentBuilderWorkflow, setCurrentBuilderWorkflow] = useState<any>(null)
  const [isDevelopmentMode, setIsDevelopmentMode] = useState(() => {
    // Check if we're in development mode
    const isDevEnv = import.meta.env.DEV
    const storedPref = localStorage.getItem('magk-dev-mode')
    return isDevEnv || storedPref === 'true'
  })
  const { initialize, tools, enabledServers } = useMCPStore()
  const { 
    createWorkflow, 
    activeWorkflow,
    temporaryWorkflows,
    permanentWorkflows,
    loadWorkflow
  } = useWorkflowStore()
  
  // Initialize API keys, MCP, and Storage Integration on app startup - ONLY ONCE
  useEffect(() => {
    // Initialize API key storage with migration
    console.log('🔑 App: Initializing API key storage...')
    const keys = initializeApiKeyStorage()
    console.log('✅ App: API keys loaded/migrated:', Object.keys(keys))
    
    // Initialize storage integration service
    console.log('💾 App: Initializing storage integration...')
    try {
      // Storage integration service is already initialized as a singleton
      const status = storageIntegrationService.getIntegrationStatus()
      console.log('✅ App: Storage integration ready with', status.integrationPoints.length, 'integration points')
    } catch (error) {
      console.error('❌ App: Storage integration failed:', error)
    }
    
    console.log('🚀 App: Initializing MCP store on startup...')
    initialize().then(async () => {
      const state = useMCPStore.getState()
      console.log('✅ App: MCP initialized with', state.tools.length, 'tools from', state.enabledServers.length, 'servers')
      
      // Auto-enable Excel server if not already enabled
      if (!state.enabledServers.includes('excel')) {
        console.log('🔧 App: Auto-enabling Excel MCP server...')
        await state.toggleServer('excel', true)
      }
    }).catch((error) => {
      console.error('❌ App: MCP initialization failed:', error)
    })
  }, []) // Empty dependency array - run only once on mount

  // Handle creating a new workflow (opens dialog)
  const handleCreateWorkflow = () => {
    console.log('🚀 Opening Create Workflow Dialog');
    setShowCreateDialog(true);
  };
  
  // Handle creating a workflow in editor (old flow)
  const handleCreateWorkflowInEditor = () => {
    console.log('🚀 handleCreateWorkflow called');
    console.log('Current state before creation:', {
      temporaryWorkflows: temporaryWorkflows.size,
      permanentWorkflows: permanentWorkflows.size,
      activeWorkflow: activeWorkflow?.name,
      activeTab: activeTab
    });
    
    const workflowId = createWorkflow(
      `New Workflow ${new Date().toLocaleTimeString()}`,
      WorkflowType.TEMPORARY,
      chatSessionId
    )
    
    console.log('📝 Created workflow ID:', workflowId);
    
    if (workflowId) {
      console.log('🔄 Loading workflow...');
      loadWorkflow(workflowId);
      
      // Add a small delay to ensure state updates propagate
      setTimeout(() => {
        console.log('📍 Switching to editor tab');
        setActiveTab('editor');
        console.log('State after tab switch:', {
          activeTab: 'editor',
          activeWorkflow: useWorkflowStore.getState().activeWorkflow?.name,
          temporaryWorkflows: useWorkflowStore.getState().temporaryWorkflows.size
        });
      }, 100);
      
      console.log('✅ Workflow creation initiated');
    } else {
      console.error('❌ Failed to create workflow - no ID returned');
    }
  }

  // Handle selecting a workflow from library
  const handleWorkflowSelect = (workflow: any) => {
    loadWorkflow(workflow.id)
    setActiveTab('editor')
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
              <TabsTrigger value="chat-workflow" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Chat + Workflow
              </TabsTrigger>
              <TabsTrigger value="builder" className="gap-2">
                <Plus className="h-4 w-4" />
                Workflow Builder
              </TabsTrigger>
              <TabsTrigger value="editor" className="gap-2">
                <GitBranch className="h-4 w-4" />
                Workflow Editor
              </TabsTrigger>
              <TabsTrigger value="library" className="gap-2">
                <Library className="h-4 w-4" />
                Workflow Library
              </TabsTrigger>
              <TabsTrigger value="blocks" className="gap-2">
                <Blocks className="h-4 w-4" />
                Block Library
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
              <TabsTrigger value="files" className="gap-2">
                <Files className="h-4 w-4" />
                File Manager
              </TabsTrigger>
              <TabsTrigger value="docs" className="gap-2">
                <BookOpen className="h-4 w-4" />
                Documentation
              </TabsTrigger>
              {isDevelopmentMode && (
                <TabsTrigger value="devtest" className="gap-2">
                  <FlaskConical className="h-4 w-4" />
                  Dev Tests
                  <Badge variant="secondary" className="ml-2 text-xs">DEV</Badge>
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          {/* Standalone Chat (NEW!) */}
          <TabsContent value="chat" className="flex-1 mt-0 overflow-hidden">
            <ChatInterface />
          </TabsContent>

          {/* Workflow Builder (NEW!) */}
          <TabsContent value="builder" className="flex-1 mt-0 overflow-hidden">
            <WorkflowBuilder
              mode="create"
              initialWorkflow={currentBuilderWorkflow}
              onSave={(workflow) => {
                console.log('Workflow saved from builder:', workflow);
                // Create the workflow in store
                const workflowId = createWorkflow(
                  workflow.name || 'New Workflow',
                  WorkflowType.PERMANENT,
                  chatSessionId
                );
                
                if (workflowId) {
                  // Save workflow data
                  const workflowStore = useWorkflowStore.getState();
                  workflowStore.saveWorkflow(workflowId, {
                    nodes: workflow.nodes || [],
                    edges: workflow.edges || []
                  });
                  
                  // Switch to editor to view/edit the saved workflow
                  loadWorkflow(workflowId);
                  setActiveTab('editor');
                  setCurrentBuilderWorkflow(null); // Clear the builder workflow
                }
              }}
              onExecute={(workflow) => {
                console.log('Executing workflow from builder:', workflow);
              }}
            />
          </TabsContent>

          {/* Chat + Workflow Integration */}
          <TabsContent value="chat-workflow" className="flex-1 mt-0 overflow-hidden">
            <div className="h-full flex flex-col">
              {/* Toggle Bar */}
              <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
                <span className="text-sm font-medium">Chat with Workflow Integration</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowWorkflowInChat(!showWorkflowInChat)}
                  className="gap-2"
                >
                  {showWorkflowInChat ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showWorkflowInChat ? 'Hide' : 'Show'} Workflow
                </Button>
              </div>
              
              <div className="flex-1 flex overflow-hidden">
                {/* Chat Interface */}
                <div className={showWorkflowInChat ? "w-1/2 border-r" : "w-full"}>
                  <ChatInterface />
                </div>
                
                {/* Workflow Integration */}
                {showWorkflowInChat && (
                  <div className="w-1/2">
                    <ChatWorkflowIntegration
                      chatSessionId={chatSessionId}
                      onWorkflowGenerate={(prompt) => {
                        console.log('Generating workflow from:', prompt)
                        // Create a new workflow based on prompt
                        const workflowId = createWorkflow(
                          `Generated: ${prompt.substring(0, 50)}...`,
                          WorkflowType.TEMPORARY,
                          chatSessionId
                        )
                        if (workflowId) {
                          loadWorkflow(workflowId)
                        }
                      }}
                      onWorkflowExecute={(workflowId) => {
                        console.log('Executing workflow:', workflowId)
                      }}
                      className="h-full"
                    />
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Workflow Editor - Store-integrated version */}
          <TabsContent value="editor" className="flex-1 mt-0 overflow-hidden">
            {activeWorkflow ? (
              <WorkflowStoreEditor />
            ) : (
              <div className="h-full flex items-center justify-center">
                <Card className="max-w-md">
                  <CardHeader className="text-center">
                    <CardTitle>No Active Workflow</CardTitle>
                    <CardDescription>
                      Create a new workflow or select one from the library to get started
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex gap-2 justify-center">
                    <Button onClick={handleCreateWorkflow}>
                      <Plus className="h-4 w-4 mr-1" />
                      Create New
                    </Button>
                    <Button variant="outline" onClick={() => setActiveTab('library')}>
                      <Library className="h-4 w-4 mr-1" />
                      Browse Library
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Workflow Library */}
          <TabsContent value="library" className="flex-1 mt-0 overflow-hidden">
            <WorkflowLibraryInterface
              onWorkflowSelect={handleWorkflowSelect}
              onWorkflowCreate={handleCreateWorkflow}
              onWorkflowExecute={(workflowId) => {
                console.log('Executing workflow:', workflowId)
              }}
              selectedWorkflowId={activeWorkflow?.id}
              className="h-full"
            />
          </TabsContent>

          {/* Block Library */}
          <TabsContent value="blocks" className="flex-1 mt-0 overflow-hidden">
            <div className="h-full flex flex-col">
              <WorkflowBlockLibrary
                onBlockSelect={(block) => {
                  console.log('Block selected:', block)
                }}
                onBlockAdd={(block) => {
                  console.log('Adding block to workflow:', block)
                  // If there's an active workflow, switch to editor
                  if (activeWorkflow) {
                    setActiveTab('editor')
                  } else {
                    // Create a new workflow first
                    handleCreateWorkflow()
                  }
                }}
                viewMode="grid"
                className="h-full"
              />
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

          {/* File Manager */}
          <TabsContent value="files" className="flex-1 mt-0 overflow-hidden">
            <div className="p-6 h-full overflow-auto">
              <FileManager sessionId={chatSessionId} />
            </div>
          </TabsContent>

          {/* Documentation */}
          <TabsContent value="docs" className="flex-1 mt-0 overflow-hidden">
            <DocumentationViewer />
          </TabsContent>

          {/* Developer Tests */}
          {isDevelopmentMode && (
            <TabsContent value="devtest" className="flex-1 mt-0 overflow-hidden">
              <div className="p-6 h-full overflow-auto">
                <DeveloperTestPanel />
              </div>
            </TabsContent>
          )}
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
      
      {/* Create Workflow Dialog */}
      <CreateWorkflowDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreate={(data) => {
          console.log('Creating workflow with:', data);
          
          // Set up initial workflow based on type
          if (data.type === 'blank') {
            setCurrentBuilderWorkflow({
              name: data.name,
              description: data.description,
              nodes: [],
              edges: []
            });
          } else if (data.type === 'template') {
            // Load template (you can expand this)
            setCurrentBuilderWorkflow({
              name: data.name,
              description: data.description,
              nodes: [
                {
                  id: 'node-1',
                  type: data.template === 'web-scrape' ? 'web-scraping' : 'code',
                  position: { x: 100, y: 100 },
                  data: { label: 'Start Node' }
                }
              ],
              edges: []
            });
          }
          
          // Switch to builder tab
          setActiveTab('builder');
          setShowCreateDialog(false);
        }}
      />
    </div>
  )
}

export default App
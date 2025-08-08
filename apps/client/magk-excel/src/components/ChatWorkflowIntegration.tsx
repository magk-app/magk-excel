/**
 * Chat-Workflow Integration Component
 * Bidirectional integration between chat sessions and workflows
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Workflow,
  GitBranch,
  Play,
  Save,
  Eye,
  EyeOff,
  Link,
  Unlink,
  ArrowRight,
  Plus,
  Maximize2,
  Minimize2,
  ChevronUp,
  ChevronDown,
  Zap,
  Bot,
  FileText,
  Settings,
  Info,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import WorkflowCanvas from './workflow/WorkflowCanvas';
import WorkflowBuilder from './workflow/WorkflowBuilder';
import WorkflowEditor from './workflow/WorkflowEditor';
import { useWorkflowStore, WorkflowType, ExtendedWorkflow } from '@/stores/workflowStore';
import { WorkflowNode, WorkflowEdge } from '@/types/workflow';

interface ChatWorkflowIntegrationProps {
  chatSessionId: string;
  messages?: ChatMessage[];
  onWorkflowGenerate?: (prompt: string) => void;
  onWorkflowExecute?: (workflowId: string) => void;
  className?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  workflowId?: string;
  workflowGenerated?: boolean;
}

interface WorkflowPrompt {
  id: string;
  prompt: string;
  workflowId?: string;
  status: 'pending' | 'generating' | 'generated' | 'error';
  error?: string;
}

export const ChatWorkflowIntegration: React.FC<ChatWorkflowIntegrationProps> = ({
  chatSessionId,
  messages = [],
  onWorkflowGenerate,
  onWorkflowExecute,
  className
}) => {
  const {
    createWorkflow,
    getWorkflowsByChatSession,
    loadWorkflow,
    saveWorkflow,
    convertToPermament,
    startExecution,
    activeWorkflow
  } = useWorkflowStore();

  const [showWorkflow, setShowWorkflow] = useState(false);
  const [workflowViewMode, setWorkflowViewMode] = useState<'view' | 'edit'>('view');
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [workflowPrompts, setWorkflowPrompts] = useState<WorkflowPrompt[]>([]);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [generatingWorkflow, setGeneratingWorkflow] = useState(false);
  const [showWorkflowBuilder, setShowWorkflowBuilder] = useState(false);

  // Get workflows associated with this chat session
  const sessionWorkflows = useMemo(() => {
    return getWorkflowsByChatSession(chatSessionId);
  }, [chatSessionId, getWorkflowsByChatSession]);

  // Check if there's an active workflow for this chat
  const hasActiveWorkflow = useMemo(() => {
    return sessionWorkflows.length > 0 || selectedWorkflowId !== null;
  }, [sessionWorkflows, selectedWorkflowId]);

  // Extract workflow generation prompts from chat messages
  useEffect(() => {
    const prompts: WorkflowPrompt[] = [];
    messages.forEach(msg => {
      if (msg.role === 'user' && msg.content.toLowerCase().includes('workflow')) {
        prompts.push({
          id: `prompt-${msg.id}`,
          prompt: msg.content,
          workflowId: msg.workflowId,
          status: msg.workflowGenerated ? 'generated' : 'pending'
        });
      }
    });
    setWorkflowPrompts(prompts);
  }, [messages]);

  // Generate workflow from chat prompt
  const handleGenerateWorkflow = useCallback(async (prompt: string) => {
    setGeneratingWorkflow(true);
    
    try {
      // Create a temporary workflow for this chat session
      const workflowId = createWorkflow(
        `Workflow from: ${prompt.substring(0, 50)}...`,
        WorkflowType.TEMPORARY,
        chatSessionId
      );

      // Simulate workflow generation from prompt
      // In production, this would call an AI service to generate the workflow
      setTimeout(() => {
        // Mock workflow nodes based on prompt
        const nodes: WorkflowNode[] = [
          {
            id: 'node-1',
            type: 'web-scraping',
            position: { x: 100, y: 100 },
            data: {
              type: 'web-scraping',
              config: {
                id: 'config-1',
                name: 'Extract Data',
                description: 'Extract data from website'
              },
              status: 'pending'
            }
          },
          {
            id: 'node-2',
            type: 'transform',
            position: { x: 300, y: 100 },
            data: {
              type: 'transform',
              config: {
                id: 'config-2',
                name: 'Process Data',
                description: 'Transform and clean data'
              },
              status: 'pending'
            }
          },
          {
            id: 'node-3',
            type: 'excel-export',
            position: { x: 500, y: 100 },
            data: {
              type: 'excel-export',
              config: {
                id: 'config-3',
                name: 'Export to Excel',
                description: 'Save data to Excel file'
              },
              status: 'pending'
            }
          }
        ];

        const edges: WorkflowEdge[] = [
          {
            id: 'edge-1',
            source: 'node-1',
            target: 'node-2',
            type: 'smoothstep'
          },
          {
            id: 'edge-2',
            source: 'node-2',
            target: 'node-3',
            type: 'smoothstep'
          }
        ];

        // Load and update the workflow
        loadWorkflow(workflowId);
        // In production, you would update the workflow with generated nodes and edges
        
        setSelectedWorkflowId(workflowId);
        setShowWorkflow(true);
        setGeneratingWorkflow(false);
        setShowGenerateDialog(false);
        
        onWorkflowGenerate?.(prompt);
      }, 2000);
    } catch (error) {
      console.error('Failed to generate workflow:', error);
      setGeneratingWorkflow(false);
    }
  }, [chatSessionId, createWorkflow, loadWorkflow, onWorkflowGenerate]);

  // Execute workflow
  const handleExecuteWorkflow = useCallback((workflowId: string) => {
    startExecution(workflowId);
    onWorkflowExecute?.(workflowId);
  }, [startExecution, onWorkflowExecute]);

  // Convert temporary workflow to permanent
  const handleConvertToPermanent = useCallback(() => {
    if (selectedWorkflowId) {
      const newId = convertToPermament(selectedWorkflowId);
      setSelectedWorkflowId(newId);
    }
  }, [selectedWorkflowId, convertToPermament]);

  // Toggle workflow view
  const toggleWorkflowView = useCallback(() => {
    setShowWorkflow(!showWorkflow);
    if (!showWorkflow && sessionWorkflows.length > 0 && !selectedWorkflowId) {
      setSelectedWorkflowId(sessionWorkflows[0].id);
      loadWorkflow(sessionWorkflows[0].id);
    }
  }, [showWorkflow, sessionWorkflows, selectedWorkflowId, loadWorkflow]);

  // Get current workflow
  const currentWorkflow = useMemo(() => {
    if (selectedWorkflowId) {
      return sessionWorkflows.find(w => w.id === selectedWorkflowId) || activeWorkflow;
    }
    return sessionWorkflows[0] || activeWorkflow;
  }, [selectedWorkflowId, sessionWorkflows, activeWorkflow]);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header Bar */}
      <Card className="rounded-none border-x-0 border-t-0">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {hasActiveWorkflow && (
                <Badge variant="default" className="gap-1">
                  <GitBranch className="h-3 w-3" />
                  Workflow Active
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Workflow Actions */}
              {hasActiveWorkflow ? (
                <>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={toggleWorkflowView}
                        >
                          {showWorkflow ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{showWorkflow ? 'Hide' : 'Show'} Workflow</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => currentWorkflow && handleExecuteWorkflow(currentWorkflow.id)}
                          disabled={!currentWorkflow}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Execute Workflow</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {currentWorkflow?.type === WorkflowType.TEMPORARY && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleConvertToPermanent}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Save as Permanent Workflow</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={() => {
                    setShowWorkflowBuilder(true);
                    setIsExpanded(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Create Workflow
                </Button>
              )}

              {/* View Mode Toggle */}
              {showWorkflow && (
                <div className="flex gap-1 border rounded-md">
                  <Button
                    size="sm"
                    variant={workflowViewMode === 'view' ? 'default' : 'ghost'}
                    onClick={() => setWorkflowViewMode('view')}
                    className="h-8 px-2 rounded-r-none"
                  >
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant={workflowViewMode === 'edit' ? 'default' : 'ghost'}
                    onClick={() => setWorkflowViewMode('edit')}
                    className="h-8 px-2 rounded-l-none"
                  >
                    Edit
                  </Button>
                </div>
              )}

              {/* Expand/Collapse */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsExpanded(!isExpanded)}
                    >
                      {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{isExpanded ? 'Minimize' : 'Maximize'}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Workflow Selector */}
          {sessionWorkflows.length > 1 && (
            <div className="mt-2 pt-2 border-t">
              <ScrollArea className="w-full" orientation="horizontal">
                <div className="flex gap-2">
                  {sessionWorkflows.map(workflow => (
                    <Button
                      key={workflow.id}
                      size="sm"
                      variant={selectedWorkflowId === workflow.id ? 'default' : 'outline'}
                      onClick={() => {
                        setSelectedWorkflowId(workflow.id);
                        loadWorkflow(workflow.id);
                      }}
                      className="shrink-0"
                    >
                      <GitBranch className="h-3 w-3 mr-1" />
                      {workflow.name.substring(0, 20)}...
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content Area - Fix Issue #9: Proper navigation when collapsed */}
      <div className={cn('flex-1 overflow-hidden position-relative')}>
        {/* Only expand to fullscreen if explicitly expanded, not just showing */}
        {isExpanded && (
          <div className="fixed inset-0 z-50 bg-background">
            <div className="absolute top-4 right-4 z-10">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsExpanded(false);
                }}
                className="bg-background"
              >
                <X className="h-4 w-4 mr-1" />
                Close Fullscreen
              </Button>
            </div>
            <div className="h-full p-4">
              {currentWorkflow && workflowViewMode === 'view' ? (
                <WorkflowCanvas
                  nodes={currentWorkflow.nodes || []}
                  edges={currentWorkflow.edges || []}
                  isReadOnly={true}
                  showStatusPanel={true}
                  onWorkflowExecute={() => handleExecuteWorkflow(currentWorkflow.id)}
                  className="h-full"
                />
              ) : currentWorkflow && workflowViewMode === 'edit' ? (
                <WorkflowEditor
                  workflowId={currentWorkflow.id}
                  onSave={() => saveWorkflow(currentWorkflow.id)}
                  onExecute={() => handleExecuteWorkflow(currentWorkflow.id)}
                  className="h-full"
                />
              ) : null}
            </div>
          </div>
        )}
        <AnimatePresence mode="wait">
          {showWorkflowBuilder ? (
            <motion.div
              key="builder"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <WorkflowBuilder
                mode="create"
                onSave={(workflow) => {
                  console.log('Workflow saved:', workflow);
                  // Save workflow to store
                  const workflowId = createWorkflow(
                    workflow.name || 'New Workflow',
                    workflow.description || 'Created from chat'
                  );
                  // Save the workflow nodes and edges
                  if (workflowId && workflow.nodes) {
                    saveWorkflow(workflowId, {
                      nodes: workflow.nodes,
                      edges: workflow.edges || []
                    });
                  }
                  // Association happens automatically in createWorkflow when chatSessionId is provided
                  setShowWorkflowBuilder(false);
                  setShowWorkflow(true);
                  setSelectedWorkflowId(workflowId);
                  loadWorkflow(workflowId);
                }}
                onExecute={(workflow) => {
                  console.log('Executing workflow:', workflow);
                  if (selectedWorkflowId && onWorkflowExecute) {
                    onWorkflowExecute(selectedWorkflowId);
                  }
                }}
              />
            </motion.div>
          ) : showWorkflow && currentWorkflow ? (
            <motion.div
              key="workflow"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {workflowViewMode === 'view' ? (
                <WorkflowCanvas
                  nodes={currentWorkflow.nodes || []}
                  edges={currentWorkflow.edges || []}
                  isReadOnly={true}
                  showStatusPanel={true}
                  onWorkflowExecute={() => handleExecuteWorkflow(currentWorkflow.id)}
                  className="h-full"
                />
              ) : (
                <WorkflowEditor
                  workflowId={currentWorkflow.id}
                  onSave={() => saveWorkflow(currentWorkflow.id)}
                  onExecute={() => handleExecuteWorkflow(currentWorkflow.id)}
                  className="h-full"
                />
              )}
            </motion.div>
          ) : (
            <motion.div
              key="prompts"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full p-4"
            >
              {/* Workflow Prompts from Chat */}
              {workflowPrompts.length > 0 ? (
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Workflow Opportunities</CardTitle>
                    <CardDescription>
                      We detected these workflow opportunities from your chat
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[calc(100%-120px)]">
                      <div className="space-y-3">
                        {workflowPrompts.map(prompt => (
                          <Card key={prompt.id} className="p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <p className="text-sm line-clamp-2">{prompt.prompt}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  {prompt.status === 'generated' ? (
                                    <Badge variant="default" className="text-xs">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Generated
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="text-xs">
                                      <Zap className="h-3 w-3 mr-1" />
                                      Ready to Generate
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleGenerateWorkflow(prompt.prompt)}
                                disabled={prompt.status === 'generated'}
                              >
                                {prompt.status === 'generated' ? (
                                  <>
                                    <Eye className="h-4 w-4 mr-1" />
                                    View
                                  </>
                                ) : (
                                  <>
                                    <Bot className="h-4 w-4 mr-1" />
                                    Generate
                                  </>
                                )}
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Card className="max-w-md">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                          <GitBranch className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No Workflow Yet</h3>
                        <p className="text-sm text-muted-foreground">
                          Start a conversation about data extraction or processing, and we'll help you create a workflow
                        </p>
                        <Button onClick={() => {
                          setShowWorkflowBuilder(true);
                          setIsExpanded(true);
                        }}>
                          <Plus className="h-4 w-4 mr-1" />
                          Create Workflow
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Workflow Info Bar */}
      {showWorkflow && currentWorkflow && (
        <Card className="rounded-none border-x-0 border-b-0">
          <CardContent className="p-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Info className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Workflow:</span>
                  <span className="font-medium">{currentWorkflow.name}</span>
                </div>
                <Badge variant="outline">
                  {currentWorkflow.nodes?.length || 0} nodes
                </Badge>
                <Badge variant="outline">
                  {currentWorkflow.type === WorkflowType.TEMPORARY ? 'Temporary' : 'Permanent'}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">
                  Last modified: {new Date(currentWorkflow.metadata.modified).toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generate Workflow Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Workflow from Chat</DialogTitle>
            <DialogDescription>
              Describe what you want to automate and we'll create a workflow for you
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert>
              <Bot className="h-4 w-4" />
              <AlertTitle>AI-Powered Generation</AlertTitle>
              <AlertDescription>
                Our AI will analyze your request and create an optimal workflow with the right blocks and connections
              </AlertDescription>
            </Alert>
            <div className="mt-4">
              <textarea
                className="w-full p-3 border rounded-md resize-none"
                rows={4}
                placeholder="E.g., Extract product data from this website and save it to Excel..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    handleGenerateWorkflow(e.currentTarget.value);
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                const textarea = document.querySelector('textarea');
                if (textarea?.value) {
                  handleGenerateWorkflow(textarea.value);
                }
              }}
              disabled={generatingWorkflow}
            >
              {generatingWorkflow ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-1" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-1" />
                  Generate Workflow
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatWorkflowIntegration;
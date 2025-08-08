import { useState, useEffect, useCallback, useMemo } from 'react';
import { ModelConfig } from './ModelSelector';

import { ChatSessionsSidebar } from './ChatSessionsSidebar';
import { ToolCallStatusWindow, useToolCallMonitor } from './ToolCallStatusWindow';
import { useChatHistory } from '../services/chatHistoryService';
import { ClientExcelService } from '../services/pdfExtractionService';

// Import optimized components and hooks
import { ChatHeader } from './ChatHeader';
import { ChatMessageList } from './ChatMessageList';
import { ChatInputArea } from './ChatInputArea';
import { PDFExtractionPanel } from './PDFExtractionPanel';
import { DemoControls } from './DemoControls';
import { useFileUpload } from '../hooks/useFileUpload';
import { usePDFExtraction } from '../hooks/usePDFExtraction';
import { useMCPTools } from '../hooks/useMCPTools';
import { useDemoFunctions } from '../hooks/useDemoFunctions';
import { useChatAdapter } from '../hooks/useChatAdapter';
import { MCPToolExecutionStatus, MCPToolCall } from './MCPToolExecutionStatus';
import { ApiKeyManager, useApiKeys } from './ApiKeyManager';
import { FilePersistenceManager } from './FilePersistenceManager';
import { ExcelDownloadHandler } from './ExcelDownloadHandler';
import { ModelCompatibilityCheck } from './ModelCompatibilityCheck';
import { WorkflowGeneratedNotification } from './workflow/WorkflowGeneratedNotification';
// TODO: Remove this import after testing
// import { ThinkingTokensTest } from './ThinkingTokensTest';

export function ChatInterface() {
  // Core state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [nluxKey, setNluxKey] = useState(0); // Force NLUX re-render when switching sessions
  const [modelConfig, setModelConfig] = useState<ModelConfig>({
    provider: 'anthropic',
    model: 'claude-opus-4-1-20250805',
    displayName: 'Claude Opus 4.1',
    enableThinking: true
  });

  // MCP tool execution tracking
  const [mcpToolCalls, setMcpToolCalls] = useState<MCPToolCall[]>([]);
  const [mcpStatusVisible, setMcpStatusVisible] = useState(false);
  
  // Claude API file upload state
  const [useDirectClaudeApi, setUseDirectClaudeApi] = useState(false);
  const [fileUploadProgress, setFileUploadProgress] = useState<Record<string, any>>({});
  
  // API Key management
  const { checkRequiredKeys, updateApiKeys } = useApiKeys();
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [hasShownApiKeyDialog, setHasShownApiKeyDialog] = useState(() => {
    // Check if we've already shown the dialog in this session
    return sessionStorage.getItem('hasShownApiKeyDialog') === 'true';
  });
  
  // File persistence management
  const [showFilePersistenceDialog, setShowFilePersistenceDialog] = useState(false);
  
  // Excel download management
  const [excelDownloadInfo, setExcelDownloadInfo] = useState<any>(null);
  const [forceExecutor, setForceExecutor] = useState<boolean>(false);

  // Custom hooks for state management
  const {
    attachments,
    handleFilesChange,
    clearAttachments,
    hasExcelFiles
  } = useFileUpload({
    maxFiles: 5,
    maxFileSize: 50 * 1024 * 1024 // 50MB
  });

  const pdfExtraction = usePDFExtraction();
  const { tools, enabledServers, mcpServers, serverStatus } = useMCPTools();
  
  // Tool call monitoring
  const {
    toolCalls,
    isWindowOpen,
    openWindow,
    closeWindow
  } = useToolCallMonitor();
  
  // Chat history management - subscribe to all changes
  const sessions = useChatHistory(state => state.sessions);
  const activeSessionId = useChatHistory(state => state.activeSessionId);
  const createSession = useChatHistory(state => state.createSession);
  const addMessage = useChatHistory(state => state.addMessage);
  const updateMessage = useChatHistory(state => state.updateMessage);
  const updateSessionTitle = useChatHistory(state => state.updateSessionTitle);
  const getActiveSession = useChatHistory(state => state.getActiveSession);

  // Get current session directly from store - this will be reactive
  const currentSession = sessions.find(s => s.id === activeSessionId);
  
  // Demo functions
  const { runHKPassengerDemo, runPDFBalanceSheetDemo } = useDemoFunctions({
    activeSessionId: activeSessionId || undefined,
    addMessage,
    updateMessage,
    getActiveSession
  });

  // Direct addMessage without wrapper since we have proper reactivity now
  const addMessageWithUpdate = addMessage;
  
  // Workflow integration state
  const [generatedWorkflow, setGeneratedWorkflow] = useState<any>(null);
  const [showWorkflowNotification, setShowWorkflowNotification] = useState(false);

  // Chat adapter with memoization
  // @ts-expect- error: extending adapter options to include forceExecutor flag (there is an extra space hereA)
  const { streamText } = useChatAdapter({
    activeSessionId: activeSessionId || undefined,
    attachments,
    clearAttachments,
    modelConfig,
    tools,
    mcpServers,
    addMessage: addMessageWithUpdate,
    updateMessage,
    getActiveSession,
    updateSessionTitle,
    currentSession,
    forceExecutor,
    useDirectClaudeApi,
    onFileUploadProgress: (fileId: string, progress: any) => {
      setFileUploadProgress(prev => ({ ...prev, [fileId]: progress }));
    },
    onToolCallStart: (toolCall) => {
      console.log('🔧 Tool call started:', toolCall);
      handleToolCallStart(toolCall);
    },
    onToolCallComplete: (toolCall) => {
      console.log('✅ Tool call completed:', toolCall);
      handleToolCallComplete(toolCall);
    },
    onToolCallError: (toolCall) => {
      console.log('❌ Tool call error:', toolCall);
      handleToolCallError(toolCall);
    },
    onWorkflowGenerated: (workflow) => {
      console.log('🎯 Workflow generated from chat:', workflow);
      setGeneratedWorkflow(workflow);
      setShowWorkflowNotification(true);
      // Auto-open workflow builder after 2 seconds
      setTimeout(() => {
        // You can trigger workflow builder opening here
        // For now, just show notification
      }, 2000);
    }
  });

  // Initialize with a default session if none exists
  useEffect(() => {
    if (sessions.length === 0) {
      createSession('Welcome Chat');
    }
  }, [sessions.length, createSession]);

  // Store required keys in state so we can pass them to the dialog
  const [requiredApiKeys, setRequiredApiKeys] = useState<string[]>([]);

  // Check for required API keys on mount and when model changes
  useEffect(() => {
    const requiredKeys = [];
    const optionalKeys = [];
    
    // Check which API keys are needed based on model
    if (modelConfig.provider === 'anthropic') {
      requiredKeys.push('anthropic');
      optionalKeys.push('openai'); // OpenAI is optional when using Anthropic
    } else if (modelConfig.provider === 'openai') {
      requiredKeys.push('openai');
      optionalKeys.push('anthropic'); // Anthropic is optional when using OpenAI
    }
    
    // MCP server keys are always optional  
    optionalKeys.push('firecrawl');
    
    setRequiredApiKeys(requiredKeys);
    
    const missing = checkRequiredKeys(requiredKeys);
    // Only show the dialog once per session, not every time the effect runs
    if (missing.length > 0 && !hasShownApiKeyDialog) {
      console.warn('⚠️ Missing API keys:', missing);
      setShowApiKeyDialog(true);
      setHasShownApiKeyDialog(true);
      sessionStorage.setItem('hasShownApiKeyDialog', 'true');
    }
  }, [modelConfig.provider, checkRequiredKeys, hasShownApiKeyDialog]);

  // Force NLUX to re-render when active session changes
  useEffect(() => {
    console.log('🔄 Active session changed to:', activeSessionId);
    setNluxKey(prev => prev + 1);
  }, [activeSessionId]);

  // Memoized callbacks
  const handleSidebarToggle = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const handleModelChange = useCallback((config: ModelConfig) => {
    setModelConfig(config);
  }, []);

  const handleExportToExcel = useCallback(async () => {
    try {
      const currentSession = getActiveSession();
      if (!currentSession || currentSession.messages.length === 0) {
        alert('No chat messages to export. Start a conversation first.');
        return;
      }
      
      await ClientExcelService.generateExcelFromChat(
        currentSession.messages.map((msg: any) => ({ role: msg.role, content: msg.content })),
        `chat_export_${new Date().toISOString().slice(0,10)}.xlsx`
      );
      console.log('📄 Excel export completed');
    } catch (error) {
      console.error('❌ Excel export failed:', error);
      alert('Failed to export chat to Excel. Please try again.');
    }
  }, [getActiveSession]);

  // MCP tool execution handlers
  const handleToolCallStart = useCallback((toolCall: MCPToolCall) => {
    setMcpToolCalls(prev => [...prev, { ...toolCall, status: 'running' }]);
    setMcpStatusVisible(true);
  }, []);

  const handleToolCallComplete = useCallback((toolCall: MCPToolCall) => {
    setMcpToolCalls(prev => 
      prev.map(t => 
        t.server === toolCall.server && t.tool === toolCall.tool 
          ? { ...t, ...toolCall, status: 'completed' }
          : t
      )
    );
    
    // Check if this is an Excel creation tool with download info
    if (toolCall.server === 'excel' && 
        (toolCall.tool === 'excel_create' || 
         toolCall.tool === 'excel_write' || 
         toolCall.tool === 'excel_write_to_sheet')) {
      // Extract download info from response if available
      const responseAny: any = (toolCall as unknown as any).response || (toolCall as unknown as any).result;
      if (responseAny?.downloadInfo) {
        setExcelDownloadInfo({
          ...responseAny.downloadInfo,
          timestamp: Date.now()
        });
      }
    }
  }, []);

  const handleToolCallError = useCallback((toolCall: MCPToolCall) => {
    setMcpToolCalls(prev => 
      prev.map(t => 
        t.server === toolCall.server && t.tool === toolCall.tool 
          ? { ...t, ...toolCall, status: 'error' }
          : t
      )
    );
  }, []);

  const handleRetryTool = useCallback((toolCall: MCPToolCall) => {
    handleToolCallStart(toolCall);
    // Here you would typically re-execute the tool call
    console.log('Retrying tool call:', toolCall);
  }, [handleToolCallStart]);

  const handlePDFExtraction = useCallback((extractAll: boolean = false) => {
    const onStatusUpdate = (messageId: string, content: string) => {
      if (activeSessionId) {
        updateMessage(activeSessionId, messageId, {
          role: 'assistant',
          content
        });
      }
    };

    const onComplete = (success: boolean) => {
      if (success) {
        console.log('PDF extraction completed successfully');
      }
    };

    pdfExtraction.handleExtraction(extractAll, onStatusUpdate, onComplete);
  }, [pdfExtraction, activeSessionId, updateMessage]);

  // Memoized adapter
  const mcpEnhancedAdapter = useMemo(() => ({
    streamText
  }), [streamText]);
  
  // Session info derived from currentSession
  const sessionTitle = currentSession?.title || 'New Chat';
  const messageCount = currentSession?.messages?.length || 0;
  const messages = currentSession?.messages || [];

  return (
    <div className="h-full w-full flex">
      {/* Chat Sessions Sidebar */}
      <ChatSessionsSidebar 
        isOpen={sidebarOpen} 
        onToggle={handleSidebarToggle} 
      />
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header with Demo Controls */}
        <ChatHeader
          sessionTitle={sessionTitle}
          messageCount={messageCount}
          enabledServersCount={serverStatus.enabledCount}
          modelConfig={modelConfig}
          onModelChange={handleModelChange}
          hasExcelFiles={hasExcelFiles}
          toolCallsCount={toolCalls.length}
          onOpenToolMonitor={openWindow}
          onOpenApiKeys={() => setShowApiKeyDialog(true)}
          onExportToExcel={handleExportToExcel}
          onTogglePDFPanel={pdfExtraction.togglePanel}
          mcpToolCallsCount={mcpToolCalls.length}
          onToggleMCPStatus={() => setMcpStatusVisible(!mcpStatusVisible)}
          onOpenFilePersistence={() => setShowFilePersistenceDialog(true)}
          onToggleForceExecutor={() => setForceExecutor((v) => !v)}
          forceExecutorEnabled={forceExecutor}
        >
          <DemoControls
            onRunHKDemo={runHKPassengerDemo}
            onRunPDFDemo={runPDFBalanceSheetDemo}
            disabled={!activeSessionId}
          />
        </ChatHeader>

        {/* Model Compatibility Check */}
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
          <ModelCompatibilityCheck 
            modelConfig={modelConfig}
            onModelFallback={(fallbackModel: string) => {
              setModelConfig(prev => ({ 
                ...prev, 
                model: fallbackModel,
                enableThinking: fallbackModel.includes('claude-4') || fallbackModel.includes('claude-3-7')
              }));
            }}
          />
        </div>

        {/* PDF Extraction Panel */}
        {pdfExtraction.showPanel && (
          <PDFExtractionPanel
            isVisible={pdfExtraction.showPanel}
            pdfUrl={pdfExtraction.pdfUrl}
            extractionPrompt={pdfExtraction.extractionPrompt}
            isExtracting={pdfExtraction.isExtracting}
            onPdfUrlChange={pdfExtraction.setPdfUrl}
            onPromptChange={pdfExtraction.setExtractionPrompt}
            onExtractAll={() => handlePDFExtraction(true)}
            onExtractSpecific={() => handlePDFExtraction(false)}
            onCancel={pdfExtraction.hidePanel}
            canExtractAll={pdfExtraction.canExtractAll}
            canExtractSpecific={pdfExtraction.canExtractSpecific}
          />
        )}
        
        {/* Chat Message List */}
        <ChatMessageList
          adapter={mcpEnhancedAdapter}
          messages={messages}
          nluxKey={nluxKey}
          attachments={attachments}
        />

        {/* Chat Input Area - Fixed at bottom */}
        <ChatInputArea
          attachments={attachments}
          onAttachmentsChange={handleFilesChange}
          onSendMessage={streamText}
          maxFiles={5}
          maxFileSize={50 * 1024 * 1024} // 50MB
          useDirectClaudeApi={useDirectClaudeApi}
          onDirectClaudeApiChange={setUseDirectClaudeApi}
          onFileUploadProgress={(fileId: string, progress: any) => {
            setFileUploadProgress(prev => ({ ...prev, [fileId]: progress }));
          }}
        />
      </div>
      
      {/* Tool Call Status Window */}
      <ToolCallStatusWindow
        toolCalls={toolCalls}
        isOpen={isWindowOpen}
        onClose={closeWindow}
      />
      
      {/* MCP Tool Execution Status - Floating Panel */}
      {mcpStatusVisible && (
        <div className="fixed top-4 right-4 z-50">
          <MCPToolExecutionStatus
            toolCalls={mcpToolCalls}
            isVisible={mcpStatusVisible}
            onClose={() => setMcpStatusVisible(false)}
            onRetry={handleRetryTool}
          />
        </div>
      )}
      
      {/* API Key Manager Dialog */}
      <ApiKeyManager
        isOpen={showApiKeyDialog}
        onClose={() => setShowApiKeyDialog(false)}
        requiredKeys={requiredApiKeys}
        optionalKeys={['firecrawl', modelConfig.provider === 'anthropic' ? 'openai' : 'anthropic']}
        onKeysSet={(keys) => {
          updateApiKeys(keys);
          setShowApiKeyDialog(false);
          setHasShownApiKeyDialog(false); // Reset so it can check again
        }}
      />
      
      {/* File Persistence Manager Dialog */}
      <FilePersistenceManager
        isOpen={showFilePersistenceDialog}
        onClose={() => setShowFilePersistenceDialog(false)}
        sessionId={activeSessionId || 'default'}
        currentAttachments={attachments}
      />
      
      {/* Excel Download Handler */}
      {excelDownloadInfo && (
        <ExcelDownloadHandler
          downloadInfo={excelDownloadInfo}
          onClose={() => setExcelDownloadInfo(null)}
        />
      )}
      
      {/* Workflow Generated Notification */}
      <WorkflowGeneratedNotification
        workflow={generatedWorkflow}
        isVisible={showWorkflowNotification}
        onView={() => {
          // Open workflow builder or viewer
          console.log('Opening workflow:', generatedWorkflow);
          setShowWorkflowNotification(false);
          // You can integrate with workflow store or navigation here
        }}
        onDismiss={() => setShowWorkflowNotification(false)}
      />
    </div>
  );
}
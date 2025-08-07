import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ModelConfig } from './ModelSelector';
import { FileAttachment } from './FileUploadArea';
import { ChatSessionsSidebar } from './ChatSessionsSidebar';
import { ToolCallStatusWindow, useToolCallMonitor } from './ToolCallStatusWindow';
import { useChatHistory, chatHistoryHelpers } from '../services/chatHistoryService';
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

export function ChatInterface() {
  // Core state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [nluxKey, setNluxKey] = useState(0); // Force NLUX re-render when switching sessions
  const [modelConfig, setModelConfig] = useState<ModelConfig>({
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    displayName: 'Eliza 4.0',
    enableThinking: false
  });

  // MCP tool execution tracking
  const [mcpToolCalls, setMcpToolCalls] = useState<MCPToolCall[]>([]);
  const [mcpStatusVisible, setMcpStatusVisible] = useState(false);
  
  // API Key management
  const { apiKeys, missingKeys, checkRequiredKeys, updateApiKeys } = useApiKeys();
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);

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

  // Chat history management
  const {
    sessions,
    activeSessionId,
    createSession,
    addMessage,
    updateMessage,
    updateSessionTitle,
    getActiveSession
  } = useChatHistory();

  // Demo functions
  const { runHKPassengerDemo, runPDFBalanceSheetDemo } = useDemoFunctions({
    activeSessionId: activeSessionId || undefined,
    addMessage,
    updateMessage,
    getActiveSession
  });

  // Chat adapter with memoization
  const { streamText } = useChatAdapter({
    activeSessionId: activeSessionId || undefined,
    attachments,
    clearAttachments,
    modelConfig,
    tools,
    mcpServers,
    addMessage,
    updateMessage,
    getActiveSession,
    updateSessionTitle,
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
    }
  });

  // Initialize with a default session if none exists
  useEffect(() => {
    if (sessions.length === 0) {
      createSession('Welcome Chat');
    }
  }, [sessions.length, createSession]);

  // Check for required API keys on mount and when model changes
  useEffect(() => {
    const requiredKeys = [];
    
    // Check which API keys are needed based on model
    if (modelConfig.provider === 'anthropic') {
      requiredKeys.push('anthropic');
    } else if (modelConfig.provider === 'openai') {
      requiredKeys.push('openai');
    }
    
    // Check for MCP server keys
    if (enabledServers.includes('firecrawl')) {
      requiredKeys.push('firecrawl');
    }
    
    const missing = checkRequiredKeys(requiredKeys);
    if (missing.length > 0) {
      console.warn('⚠️ Missing API keys:', missing);
      setShowApiKeyDialog(true);
    }
  }, [modelConfig.provider, enabledServers]);

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

  // Session info for display
  const currentSession = useMemo(() => getActiveSession(), [getActiveSession, activeSessionId]);
  const sessionTitle = currentSession?.title || 'New Chat';
  const messageCount = currentSession?.messages.length || 0;

  // Debug logging
  console.log('🔍 ChatInterface: Current enabled servers:', enabledServers);
  console.log('🛠️ ChatInterface: Available tools:', tools.length);

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
          sidebarOpen={sidebarOpen}
          onToggleSidebar={handleSidebarToggle}
          sessionTitle={sessionTitle}
          messageCount={messageCount}
          enabledServersCount={serverStatus.enabledCount}
          modelConfig={modelConfig}
          onModelChange={handleModelChange}
          hasExcelFiles={hasExcelFiles}
          toolCallsCount={toolCalls.length}
          onOpenToolMonitor={openWindow}
          onExportToExcel={handleExportToExcel}
          onTogglePDFPanel={pdfExtraction.togglePanel}
          mcpToolCallsCount={mcpToolCalls.length}
          onToggleMCPStatus={() => setMcpStatusVisible(!mcpStatusVisible)}
        >
          <DemoControls
            onRunHKDemo={runHKPassengerDemo}
            onRunPDFDemo={runPDFBalanceSheetDemo}
            disabled={!activeSessionId}
          />
        </ChatHeader>

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
          messages={currentSession?.messages || []}
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
        requiredKeys={missingKeys}
        onKeysSet={(keys) => {
          updateApiKeys(keys);
          setShowApiKeyDialog(false);
        }}
      />
    </div>
  );
}
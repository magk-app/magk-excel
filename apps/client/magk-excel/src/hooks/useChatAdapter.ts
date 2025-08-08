import { useCallback } from 'react';
import { FileAttachment } from './useFileUpload';
import { ModelConfig } from '../components/ModelSelector';
import { useMCPChat } from './useMCPChat';
import { fileAccessService } from '../services/fileAccessService';
import { useFilePersistenceStore } from '../stores/filePersistenceStore';
import { claudeFilesService, FileContent } from '../services/claude/ClaudeFilesService';

interface ChatAdapterOptions {
  activeSessionId?: string;
  attachments: FileAttachment[];
  clearAttachments: () => void;
  modelConfig: ModelConfig;
  tools: any[];
  mcpServers: Record<string, any>;
  addMessage: (sessionId: string, message: any) => void;
  updateMessage: (sessionId: string, messageId: string, updates: any) => void;
  getActiveSession: () => any;
  updateSessionTitle: (sessionId: string, title: string) => void;
  onToolCallStart?: (toolCall: any) => void;
  onToolCallComplete?: (toolCall: any) => void;
  onToolCallError?: (toolCall: any) => void;
  onWorkflowGenerated?: (workflow: any) => void; // Add workflow generation callback
  currentSession?: any; // Add current session for direct access
  forceExecutor?: boolean; // When true, force selection of executor/run_ts on backend
  onFileUploadProgress?: (fileId: string, progress: { progress: number; status: string; error?: string }) => void;
  useDirectClaudeApi?: boolean; // When true, send files directly to Claude API
}

// Helper function to read file as base64
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix to get just base64
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
}

// Helper function to format Claude API file attachments
function formatClaudeAttachments(fileContents: FileContent[]): any[] {
  return fileContents.map(content => {
    if (content.type === 'base64') {
      return {
        type: 'image',
        source: content.source
      };
    } else {
      return {
        type: 'document',
        source: content.source
      };
    }
  });
}

// Helper function to read text files
async function fileToText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

export function useChatAdapter({
  activeSessionId,
  attachments,
  clearAttachments,
  modelConfig,
  tools,
  mcpServers,
  addMessage,
  updateMessage,
  getActiveSession,
  updateSessionTitle,
  onToolCallStart,
  onToolCallComplete,
  onToolCallError,
  onWorkflowGenerated,
  currentSession,
  // optional flag to force executor tool selection on backend
  forceExecutor,
  onFileUploadProgress,
  useDirectClaudeApi = false
}: ChatAdapterOptions) {
  const { executeToolCalls, formatToolResults } = useMCPChat();
  
  const streamText = useCallback(async (message: string) => {
    console.log('🚀 streamText called with:', message);
    console.log('📍 Active Session ID:', activeSessionId);
    console.log('🤖 Model Config:', modelConfig);
    
    if (!activeSessionId) {
      console.error('❌ No active session ID');
      alert('No active session! Please refresh the page.');
      return;
    }

    // IMMEDIATELY add user message
    console.log('📝 Adding user message to session:', activeSessionId);
    addMessage(activeSessionId, {
      role: 'user',
      content: message,
      isComplete: true
    });
    
    // Small delay to ensure UI updates
    await new Promise(resolve => setTimeout(resolve, 10));

    // Add assistant message placeholder
    const assistantMessageId = `assistant_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    console.log('🤖 Adding assistant placeholder:', assistantMessageId);
    
    addMessage(activeSessionId, {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      isStreaming: true,
      isThinking: modelConfig.enableThinking
    });

    // Get persistent files context
    let fileContext = '';
    if (activeSessionId) {
      const accessibleFiles = await fileAccessService.getAccessibleFiles(activeSessionId);
      if (accessibleFiles.success && accessibleFiles.files && accessibleFiles.files.length > 0) {
        fileContext = '\n\n' + fileAccessService.formatFileListForChat(activeSessionId);
        console.log('📁 File context added to message:', fileContext);
      }
    }

    // Try the new streaming API
    const WORKFLOW_API = 'https://b1fcb47dfd4d.ngrok-free.app'; // Production ngrok URL
    
    try {
      console.log('📡 Calling streaming API...');
      
      // Process attachments for Claude API or legacy processing
      let processedAttachments: any[] = [];
      let claudeAttachments: any[] = [];
      
      if (useDirectClaudeApi && claudeFilesService.getApiKey()) {
        // Process files for direct Claude API usage
        try {
          console.log('🔄 Processing files for Claude API...');
          const claudeFiles = attachments.filter(a => claudeFilesService.isFileSupported(a.file));
          
          if (claudeFiles.length > 0) {
            const fileContents = await claudeFilesService.processFiles(
              claudeFiles.map(a => a.file),
              onFileUploadProgress
            );
            
            claudeAttachments = formatClaudeAttachments(fileContents);
            console.log('✅ Claude API attachments ready:', claudeAttachments.length);
          }
          
          // Also create processed attachments for legacy support
          processedAttachments = attachments.map(a => ({
            name: a.file.name,
            type: a.file.type,
            size: a.file.size
          }));
        } catch (error) {
          console.error('❌ Claude API file processing failed, falling back:', error);
          useDirectClaudeApi = false;
        }
      }
      
      if (!useDirectClaudeApi || !claudeFilesService.getApiKey()) {
        // Legacy file processing for backend
        processedAttachments = await Promise.all(attachments.map(async (a) => {
          const isPDF = a.file.type === 'application/pdf' || a.file.name.endsWith('.pdf');
          const isExcel = a.file.type.includes('excel') || a.file.type.includes('spreadsheet') || 
                         a.file.name.endsWith('.xlsx') || a.file.name.endsWith('.xls');
          const isCSV = a.file.type === 'text/csv' || a.file.name.endsWith('.csv');
          
          let content = undefined;
          
          // For PDFs and Excel files, we'll send base64 content
          if (isPDF || isExcel) {
            console.log(`📄 Reading ${isPDF ? 'PDF' : 'Excel'} file: ${a.file.name}`);
            content = await fileToBase64(a.file);
          } else if (isCSV) {
            console.log(`📊 Reading CSV file: ${a.file.name}`);
            content = await fileToText(a.file);
          }
          
          return {
            name: a.file.name,
            type: a.file.type,
            size: a.file.size,
            content: content // Include content for processing
          };
        }));
      }
      
      // Add file context to the message if available
      const enhancedMessage = fileContext ? message + fileContext : message;
      
      // Use EventSource for SSE streaming
      const response = await fetch(`${WORKFLOW_API}/api/v2/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: enhancedMessage,
          modelConfig: {
            provider: modelConfig.provider || 'anthropic',
            model: modelConfig.model || 'claude-3-5-sonnet-20241022',
            displayName: modelConfig.displayName,
            enableThinking: modelConfig.enableThinking || false,
            temperature: modelConfig.temperature,
            maxTokens: modelConfig.maxTokens
          },
          history: (currentSession || getActiveSession())?.messages?.filter((m: any) => 
            m.role !== 'system' && m.content && m.content.trim() !== ''
          ).map((m: any) => ({
            role: m.role,
            content: m.content
          })) || [],
          attachments: processedAttachments,
          claudeAttachments: claudeAttachments, // Direct Claude API attachments
          useDirectClaudeApi: useDirectClaudeApi,
          mcpTools: tools || [],
          mcpServers: mcpServers || {},
          forceExecutor: !!forceExecutor
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      // Read the SSE stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let mcpToolCalls: any[] = [];
      let toolResultsText = '';
      let thinkingHistory: any[] = [];
      
      if (reader) {
        let buffer = '';
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                console.log('📥 SSE event:', data.type);
                
                if (data.type === 'thinking_start') {
                  // Start thinking mode with empty thinking content
                  updateMessage(activeSessionId, assistantMessageId, {
                    content: '',
                    isThinking: false,
                    isStreaming: false,
                    thinking: {
                      content: '',
                      tokenCount: 0,
                      isStreaming: true,
                      isComplete: false
                    }
                  });
                } else if (data.type === 'thinking_delta') {
                  // Stream thinking content incrementally
                  updateMessage(activeSessionId, assistantMessageId, {
                    thinking: {
                      content: data.thinking || '',
                      tokenCount: data.tokenCount || 0,
                      isStreaming: true,
                      isComplete: false
                    }
                  });
                } else if (data.type === 'thinking_complete') {
                  // Complete thinking and save to history
                  const completedThinking = {
                    content: data.thinking || '',
                    tokenCount: data.tokenCount || 0,
                    timestamp: Date.now()
                  };
                  
                  thinkingHistory.push(completedThinking);
                  
                  updateMessage(activeSessionId, assistantMessageId, {
                    thinking: {
                      content: data.thinking || '',
                      tokenCount: data.tokenCount || 0,
                      isStreaming: false,
                      isComplete: true
                    },
                    thinkingHistory: [...thinkingHistory]
                  });
                } else if (data.type === 'thinking') {
                  // Legacy thinking support
                  updateMessage(activeSessionId, assistantMessageId, {
                    content: '',
                    isThinking: true,
                    isStreaming: false
                  });
                } else if (data.type === 'content') {
                  updateMessage(activeSessionId, assistantMessageId, {
                    content: data.content,
                    isThinking: false,
                    isStreaming: data.isStreaming
                  });
                } else if (data.type === 'toolCalls') {
                  console.log('🔧 Tool calls received:', data.toolCalls);
                  mcpToolCalls = data.toolCalls;
                  const savedFilesMap: Record<string, string> = data.savedFiles || {};
                  
                  // Execute the tool calls on the client side
                  if (mcpToolCalls.length > 0) {
                    try {
                      // Notify about tool execution starting
                      if (onToolCallStart) {
                        mcpToolCalls.forEach(tc => onToolCallStart(tc));
                      }
                      
                      // If executor/run_ts present and backend provided saved temp paths,
                      // enrich the call with readPaths for Excel/PDF reading
                      const enrichedCalls = mcpToolCalls.map((tc: any) => {
                        if (tc.server === 'executor' && tc.tool === 'run_ts') {
                          const readPaths = new Set<string>(tc.args?.readPaths || []);
                          Object.values(savedFilesMap).forEach((p: any) => {
                            if (typeof p === 'string') readPaths.add(p);
                          });
                          return { ...tc, args: { ...(tc.args || {}), readPaths: Array.from(readPaths) } };
                        }
                          // Map friendly filenames to temp file paths for Excel tools
                        if (tc.server === 'excel' && tc.args) {
                          const originalArgs = { ...tc.args };
                          let pathMapped = false;
                          
                          // Check all possible path parameters
                          const pathParams = ['filePath', 'file_path', 'file', 'name', 'filename'];
                          
                          for (const param of pathParams) {
                            const nameCandidate = originalArgs[param];
                            if (typeof nameCandidate === 'string') {
                              // First try exact match
                              if (savedFilesMap[nameCandidate]) {
                                originalArgs.filePath = savedFilesMap[nameCandidate];
                                originalArgs.file_path = savedFilesMap[nameCandidate];
                                pathMapped = true;
                                console.log(`📁 Mapped Excel file path: ${nameCandidate} → ${savedFilesMap[nameCandidate]}`);
                                break;
                              }
                              
                              // Try partial match for files with similar names
                              for (const [friendlyName, tempPath] of Object.entries(savedFilesMap)) {
                                if (friendlyName.includes(nameCandidate) || nameCandidate.includes(friendlyName)) {
                                  originalArgs.filePath = tempPath;
                                  originalArgs.file_path = tempPath;
                                  pathMapped = true;
                                  console.log(`📁 Fuzzy matched Excel file path: ${nameCandidate} → ${tempPath}`);
                                  break;
                                }
                              }
                              
                              if (pathMapped) break;
                            }
                          }
                          
                          if (pathMapped) {
                            return { ...tc, args: originalArgs };
                          }
                        }
                        
                        // Enhanced path mapping for other tool servers
                        if (tc.args && Object.keys(savedFilesMap).length > 0) {
                          const enhancedArgs = { ...tc.args };
                          let anyPathMapped = false;
                          
                          // Add savedFilesMap as a context for tools that might need it
                          enhancedArgs._filePathMap = savedFilesMap;
                          
                          // Map any string arguments that might be filenames
                          for (const [key, value] of Object.entries(enhancedArgs)) {
                            if (typeof value === 'string' && savedFilesMap[value]) {
                              enhancedArgs[key] = savedFilesMap[value];
                              anyPathMapped = true;
                              console.log(`📁 Mapped ${tc.server}/${tc.tool} path: ${key}: ${value} → ${savedFilesMap[value]}`);
                            }
                          }
                          
                          if (anyPathMapped) {
                            return { ...tc, args: enhancedArgs };
                          }
                        }
                        return tc;
                      });
                      const results = await executeToolCalls(enrichedCalls);
                      toolResultsText = formatToolResults(results);
                      console.log('✅ Tool execution results:', toolResultsText);
                      
                      // Notify about tool execution complete
                      if (onToolCallComplete) {
                        results.forEach(r => onToolCallComplete(r));
                      }
                    } catch (error) {
                      console.error('❌ Tool execution failed:', error);
                      toolResultsText = `Tool execution failed: ${error}`;
                      
                      // Notify about tool execution error
                      if (onToolCallError) {
                        onToolCallError({ error });
                      }
                    }
                  }
                } else if (data.type === 'complete') {
                  let finalContent = data.content;
                  
                  // Check if workflow was generated
                  if (data.workflowGenerated && onWorkflowGenerated) {
                    console.log('🎯 Workflow generated:', data.workflowGenerated);
                    onWorkflowGenerated(data.workflowGenerated);
                    
                    // Add workflow info to message
                    finalContent += `\n\n🎯 **Workflow Created**: ${data.workflowGenerated.name}\n`;
                    finalContent += `📝 *${data.workflowGenerated.description}*\n`;
                    finalContent += `\nThe workflow has been created with ${data.workflowGenerated.nodes?.length || 0} nodes. You can view and execute it in the workflow builder.`;
                  }
                  
                  // Execute any tool calls that came with the complete message
                  if (data.mcpToolCalls && data.mcpToolCalls.length > 0 && !mcpToolCalls.length) {
                    mcpToolCalls = data.mcpToolCalls;
                    console.log('🔧 Tool calls from complete:', mcpToolCalls);
                    
                    try {
                      // Notify about tool execution starting
                      if (onToolCallStart) {
                        mcpToolCalls.forEach(tc => onToolCallStart(tc));
                      }
                      
                      const results = await executeToolCalls(mcpToolCalls);
                      toolResultsText = formatToolResults(results);
                      console.log('✅ Tool execution results:', toolResultsText);
                      
                      // Notify about tool execution complete
                      if (onToolCallComplete) {
                        results.forEach(r => onToolCallComplete(r));
                      }
                    } catch (error) {
                      console.error('❌ Tool execution failed:', error);
                      toolResultsText = `Tool execution failed: ${error}`;
                      
                      // Notify about tool execution error
                      if (onToolCallError) {
                        onToolCallError({ error });
                      }
                    }
                  }
                  
                  // Append tool results to the final content
                  if (toolResultsText) {
                    finalContent += `\n\n## MCP Tool Results:\n${toolResultsText}`;
                  }
                  
                  updateMessage(activeSessionId, assistantMessageId, {
                    content: finalContent,
                    isThinking: false,
                    isStreaming: false,
                    isComplete: true,
                    // Tag message if backend responded with mock
                    isMock: !!data.isMock,
                    thinking: data.thinking ? {
                      content: data.thinking,
                      tokenCount: data.thinkingTokenCount || 0,
                      isStreaming: false,
                      isComplete: true
                    } : undefined,
                    thinkingHistory: thinkingHistory.length > 0 ? thinkingHistory : undefined,
                    toolCalls: mcpToolCalls.length > 0 ? mcpToolCalls : undefined
                  });
                } else if (data.type === 'error') {
                  throw new Error(data.error);
                }
              } catch (e) {
                console.error('Failed to parse SSE data:', e);
              }
            }
          }
        }
      }
      
      console.log('✅ Streaming completed');
      
    } catch (error) {
      console.error('❌ API Error:', error);
      
      // Fallback to non-streaming endpoint
      try {
        console.log('📡 Trying non-streaming API...');
        const response = await fetch(`${WORKFLOW_API}/api/v2/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            modelConfig,
            history: (currentSession || getActiveSession())?.messages?.filter((m: any) => 
              m.role !== 'system' && m.content && m.content.trim() !== ''
            ) || [],
            attachments: attachments.map(a => ({
              name: a.file.name,
              type: a.file.type,
              size: a.file.size
            }))
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Non-streaming response:', data);
          
          // Simulate streaming
          const words = data.response.split(' ');
          let accumulatedText = '';
          
          for (let i = 0; i < words.length; i++) {
            accumulatedText += (i > 0 ? ' ' : '') + words[i];
            updateMessage(activeSessionId, assistantMessageId, {
              content: accumulatedText,
              isStreaming: true
            });
            await new Promise(resolve => setTimeout(resolve, 10)); // Faster typing
          }
          
          updateMessage(activeSessionId, assistantMessageId, {
            content: accumulatedText,
            isStreaming: false,
            isComplete: true,
            isMock: !!data.isMock,
            thinking: data.thinking ? {
              content: data.thinking,
              tokenCount: data.thinkingTokenCount || 0,
              isStreaming: false,
              isComplete: true
            } : undefined
          });
        } else {
          throw new Error('Non-streaming API also failed');
        }
      } catch (fallbackError) {
        console.error('❌ Fallback failed:', fallbackError);
        
        // Use mock response as last resort
        const mockResponse = generateMockResponse(message, attachments, tools);
        let currentContent = '';
        const words = mockResponse.split(' ');
        
        for (let i = 0; i < words.length; i++) {
          currentContent += (i > 0 ? ' ' : '') + words[i];
          updateMessage(activeSessionId, assistantMessageId, {
            content: currentContent,
            isStreaming: true
          });
          await new Promise(resolve => setTimeout(resolve, 30));
        }
        
        updateMessage(activeSessionId, assistantMessageId, {
          content: currentContent,
          isStreaming: false,
          isComplete: true
        });
      }
    }
    
    // Don't clear attachments immediately - they're now in persistence store
    // User can manually clear them or they'll persist for the session
    // Only clear after a delay to ensure they're available for follow-up messages
    if (attachments.length > 0) {
      setTimeout(() => {
        clearAttachments();
      }, 5000); // Clear after 5 seconds
    }
    
  }, [activeSessionId, attachments, clearAttachments, tools, mcpServers, modelConfig, addMessage, updateMessage, getActiveSession, currentSession, executeToolCalls, formatToolResults, onToolCallStart, onToolCallComplete, onToolCallError]);

  return { streamText };
}

function generateMockResponse(message: string, attachments: FileAttachment[], tools: any[]): string {
  const lowerMessage = message.toLowerCase();
  
  if (attachments.length > 0) {
    const fileList = attachments.map(a => a.file.name).join(', ');
    return `I've received your files: ${fileList}. I'm MAGK (Multi-Agent Generative Kit), and I can help you process this data, create Excel files, extract information, or perform analysis. What would you like me to do?`;
  }
  
  if (lowerMessage.includes('excel') || lowerMessage.includes('spreadsheet')) {
    return `I'll help you create an Excel spreadsheet! As MAGK, I have ${tools.length} tools available including Excel writing, PDF extraction, and web scraping capabilities. What data would you like to work with?`;
  }
  
  if (lowerMessage.includes('pdf')) {
    return `As MAGK, I can extract data from PDF documents including tables, text, and structured information. You can either upload a PDF file or provide a URL to a PDF document. What information do you need extracted?`;
  }
  
  if (lowerMessage.includes('scrape') || lowerMessage.includes('website')) {
    return `MAGK can scrape data from websites and convert it into structured Excel files. I support both static and dynamic websites. Please provide the URL and describe what data you'd like to extract.`;
  }
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return `Hello! I'm MAGK (Multi-Agent Generative Kit), your AI assistant for Excel automation, PDF extraction, and web scraping. I can help you:\n\n• Create and manipulate Excel files\n• Extract data from PDFs\n• Scrape websites for data\n• Process and transform data\n\nWhat would you like to work on today?`;
  }
  
  return `I'm MAGK (Multi-Agent Generative Kit), ready to help you with data processing and automation. I can work with Excel files, extract data from PDFs, scrape websites, and more. With ${tools.length} specialized tools available, I can handle complex data workflows. What task can I assist you with?`;
}
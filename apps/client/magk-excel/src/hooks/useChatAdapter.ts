import { useCallback } from 'react';
import { FileAttachment } from './useFileUpload';
import { ModelConfig } from '../components/ModelSelector';
import { useMCPChat } from './useMCPChat';
import { fileAccessService } from '../services/fileAccessService';

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
  currentSession?: any; // Add current session for direct access
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
  currentSession
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
    const WORKFLOW_API = 'http://localhost:3000'; // Using port 3000
    
    try {
      console.log('📡 Calling streaming API...');
      
      // Process attachments - read file contents for PDFs and Excel files
      const processedAttachments = await Promise.all(attachments.map(async (a) => {
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
          mcpTools: tools || [],
          mcpServers: mcpServers || {}
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
                
                if (data.type === 'thinking') {
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
                  
                  // Execute the tool calls on the client side
                  if (mcpToolCalls.length > 0) {
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
                } else if (data.type === 'complete') {
                  let finalContent = data.content;
                  
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
                    thinking: data.thinking,
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
            thinking: data.thinking
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
    
    // Clear attachments after processing
    if (attachments.length > 0) {
      clearAttachments();
    }
    
  }, [activeSessionId, attachments, clearAttachments, tools, mcpServers, modelConfig, addMessage, updateMessage, getActiveSession, currentSession, executeToolCalls, formatToolResults, onToolCallStart, onToolCallComplete, onToolCallError]);

  return { streamText };
}

function generateMockResponse(message: string, attachments: FileAttachment[], tools: any[]): string {
  const lowerMessage = message.toLowerCase();
  
  if (attachments.length > 0) {
    const fileList = attachments.map(a => a.file.name).join(', ');
    return `I've received your files: ${fileList}. I can help you process this data and create Excel files, extract information, or perform analysis. What would you like me to do?`;
  }
  
  if (lowerMessage.includes('excel') || lowerMessage.includes('spreadsheet')) {
    return `I'll help you create an Excel spreadsheet! I have ${tools.length} tools available including Excel writing, PDF extraction, and web scraping capabilities. What data would you like to work with?`;
  }
  
  if (lowerMessage.includes('pdf')) {
    return `I can extract data from PDF documents including tables, text, and structured information. You can either upload a PDF file or provide a URL to a PDF document. What information do you need extracted?`;
  }
  
  if (lowerMessage.includes('scrape') || lowerMessage.includes('website')) {
    return `I can scrape data from websites and convert it into structured Excel files. I support both static and dynamic websites. Please provide the URL and describe what data you'd like to extract.`;
  }
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return `Hello! I'm MAGK Excel, your AI assistant for Excel automation, PDF extraction, and web scraping. I can help you:\n\n• Create and manipulate Excel files\n• Extract data from PDFs\n• Scrape websites for data\n• Process and transform data\n\nWhat would you like to work on today?`;
  }
  
  return `I'm MAGK Excel, ready to help you with data processing and automation. I can work with Excel files, extract data from PDFs, scrape websites, and more. With ${tools.length} specialized tools available, I can handle complex data workflows. What task can I assist you with?`;
}
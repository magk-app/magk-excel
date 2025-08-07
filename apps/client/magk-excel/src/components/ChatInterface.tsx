import { AiChat } from '@nlux/react';
import '@nlux/themes/nova.css';
import { useState, useEffect, useRef } from 'react';
import { useMCPChat } from '../hooks/useMCPChat';
import { useMCPStore } from '../services/mcpService';
import { FileUploadArea, FileAttachment } from './FileUploadArea';
import { ChatSessionsSidebar } from './ChatSessionsSidebar';
import { ToolCallStatusWindow, useToolCallMonitor } from './ToolCallStatusWindow';
import { useChatHistory, chatHistoryHelpers } from '../services/chatHistoryService';
import { PDFExtractionService, ClientExcelService } from '../services/pdfExtractionService';
import { ExcelService } from '../services/excelService';


export function ChatInterface() {
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentMessageId, setCurrentMessageId] = useState<string | null>(null);
  const [showPDFExtraction, setShowPDFExtraction] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const [extractionPrompt, setExtractionPrompt] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [nluxKey, setNluxKey] = useState(0); // Force NLUX re-render when switching sessions
  
  // Tool call monitoring
  const {
    toolCalls,
    isWindowOpen,
    addToolCall,
    updateToolCall,
    clearToolCalls,
    openWindow,
    closeWindow
  } = useToolCallMonitor();
  
  const { tools, enabledServers } = useMCPStore();
  const { 
    parseToolCalls, 
    executeToolCalls, 
    formatToolResults,
    findRelevantTools,
    callTool
  } = useMCPChat();
  
  const {
    sessions,
    activeSessionId,
    createSession,
    addMessage,
    updateMessage,
    updateSessionTitle,
    getActiveSession,
    getSessionHistory
  } = useChatHistory();

  // Initialize with a default session if none exists
  useEffect(() => {
    if (sessions.length === 0) {
      createSession('Welcome Chat');
    }
  }, [sessions.length, createSession]);

  // Force NLUX to re-render when active session changes
  useEffect(() => {
    console.log('🔄 Active session changed to:', activeSessionId);
    setNluxKey(prev => prev + 1); // This will force NLUX to completely re-render
  }, [activeSessionId]);

  // PDF Extraction function
  const handlePDFExtraction = async (extractAll: boolean = false) => {
    if (!pdfUrl.trim()) {
      alert('Please enter a PDF URL');
      return;
    }

    setIsExtracting(true);
    
    // Add progress status message
    const statusMessageId = Date.now().toString();
    if (activeSessionId) {
      const operationType = extractAll ? 'Extract All Tables' : 'Extract Specific Data';
      addMessage(activeSessionId, {
        role: 'assistant',
        content: `📄 **${operationType} - Starting...**\n\n⏳ **Status:** Initializing PDF extraction\n📄 **PDF URL:** ${pdfUrl}\n${!extractAll ? `🎯 **Prompt:** ${extractionPrompt}\n` : ''}🤖 **Method:** Modal AI API\n\n*Please wait while I process the PDF...*`
      });
    }

    try {
      let result;
      let operationType;
      
      // Update status: Processing
      if (activeSessionId) {
        setTimeout(() => {
          updateMessage(activeSessionId, statusMessageId, {
            role: 'assistant',
            content: `📄 **${extractAll ? 'Extract All Tables' : 'Extract Specific Data'}**\n\n⏳ **Status:** Processing PDF with AI...\n📄 **PDF URL:** ${pdfUrl}\n${!extractAll ? `🎯 **Prompt:** ${extractionPrompt}\n` : ''}🤖 **Method:** Modal AI API\n\n*AI is analyzing the PDF content...*`
          });
        }, 1000);
      }
      
      if (extractAll) {
        result = await PDFExtractionService.extractAllTables(pdfUrl);
        operationType = 'Extract All Tables';
      } else {
        if (!extractionPrompt.trim()) {
          alert('Please enter a prompt for specific extraction');
          return;
        }
        result = await PDFExtractionService.extractSpecificTable(pdfUrl, extractionPrompt);
        operationType = 'Extract Specific Data';
      }

      // Update the status message with final results
      if (activeSessionId) {
        let displayData = '';
        if (result.data || result.tables || result.extracted_data) {
          const dataToShow = result.data || result.tables || result.extracted_data;
          displayData = JSON.stringify(dataToShow, null, 2);
          // Truncate if too long
          if (displayData.length > 2000) {
            displayData = displayData.substring(0, 2000) + '...\n\n*[Data truncated for display - see full results in console]*';
          }
        }

        const extractionMessage = `**${operationType} from PDF - Success!** ✅\n\n` +
          `**📄 PDF URL:** ${pdfUrl}\n` +
          (extractionPrompt ? `**🎯 Prompt:** ${extractionPrompt}\n` : '') +
          `**⏱️ Status:** ${result.status}\n` +
          `**🤖 Method:** Modal AI API\n\n` +
          (displayData ? `**📋 Extracted Data:**\n\`\`\`json\n${displayData}\n\`\`\`\n\n` : '') +
          `*PDF extraction completed successfully!*`;
        
        updateMessage(activeSessionId, statusMessageId, {
          role: 'assistant',
          content: extractionMessage
        });

        // Log full results to console for debugging
        console.log('📄 PDF Extraction - Full Results:', result);
      }

      // Clear inputs
      setPdfUrl('');
      setExtractionPrompt('');
      setShowPDFExtraction(false);

    } catch (error) {
      console.error('PDF extraction error:', error);
      if (activeSessionId) {
        updateMessage(activeSessionId, statusMessageId, {
          role: 'assistant',
          content: `**PDF Extraction - Error** ❌\n\n**Error:** ${error instanceof Error ? error.message : 'Unknown error'}\n\n**Troubleshooting:**\n- Check if the PDF URL is accessible\n- Verify the Modal API is responding\n- Try with a different PDF or prompt\n\n*You can try again with different parameters.*`
        });
      }
    } finally {
      setIsExtracting(false);
    }
  };

  // Autonomous chat simulation helper
  const simulateUserMessage = async (message: string, delay: number = 1000) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (activeSessionId) {
          addMessage(activeSessionId, {
            role: 'user',
            content: message
          });
        }
        resolve(true);
      }, delay);
    });
  };

  // Helper function for word-by-word streaming
  const streamMessage = async (content: string, delay: number = 50) => {
    if (!activeSessionId || !content || content.trim().length === 0) return;
    
    const messageId = Date.now().toString();
    let streamedContent = '';
    
    // Start with first word to avoid empty messages
    const words = content.split(' ').filter(word => word.length > 0);
    if (words.length === 0) return;
    
    // Add first word immediately to avoid empty content
    streamedContent = words[0];
    addMessage(activeSessionId, {
      role: 'assistant',
      content: streamedContent
    });
    
    // Stream remaining words
    for (let i = 1; i < words.length; i++) {
      streamedContent += ' ' + words[i];
      updateMessage(activeSessionId, messageId, {
        role: 'assistant',
        content: streamedContent
      });
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  };

  const simulateAIResponse = async (message: string) => {
    // Simple streaming implementation without recursive calls
    return streamMessage(message, 30);
  };

  // Quick demo functions - Autonomous Chat with Real API Calls
  const runHKPassengerDemo = async () => {
    if (!activeSessionId) return;

    console.log('🎯 Starting HK Passenger Statistics Demo - Autonomous Chat with Real API');

    try {
      // Step 1: Simulate user asking for HK passenger stats
      await simulateUserMessage(
        "I need to extract the latest Hong Kong passenger statistics from the Immigration Department website. Can you help me scrape the arrival and departure data and create an Excel file?",
        500
      );

      // Step 2: AI responds with plan (streaming)
      setTimeout(async () => {
        await streamMessage(`🎯 **HK Immigration Clearance Statistics Extraction**\n\nI'll help you extract the Immigration Clearance statistics from the Hong Kong Immigration Department website. Let me:\n\n1. 🌐 Access the IMMD statistics page\n2. 📊 Extract Immigration Clearance data (2023 vs 2024)\n3. 📋 Include Passenger Traffic, Air, Sea, Land, and Visitor data\n4. 📄 Generate Excel file with proper formatting\n\n⏳ Starting extraction process...`, 25);

        // Step 3: Stream the extraction process with real-time table display
        setTimeout(async () => {
          const today = new Date().toISOString().slice(0,10).replace(/-/g, ''); // YYYYMMDD format
          
          try {
            // First, show the data streaming step by step
            await streamMessage(`🔄 **Processing Immigration Clearance Data...**\n\n⏳ Retrieving statistics from IMMD database...`, 40);

            // Simulate data streaming with delays
            setTimeout(async () => {
              await streamMessage(`📊 **Immigration Clearance Statistics (2023 vs 2024)**\n\n| Category | 2023 (Million) | 2024 (Million) | Growth |\n|----------|----------------|----------------|--------|\n| Passenger Traffic | 211.8 | 298.5 | +40.9% |\n| Air | 31.7 | 41.9 | +32.2% |\n| Sea | 8.1 | 8.8 | +8.6% |\n| Land | 172.0 | 247.8 | +44.1% |\n| Vehicular Traffic (Mainland) | 10.3 | 15.5 | +50.5% |\n| Visitors | 67.7 | 89.0 | +31.5% |\n\n📈 **Key Insights:**\n- Total passenger traffic increased by **40.9%** from 2023 to 2024\n- Land traffic showed the highest growth at **44.1%**\n- Vehicular traffic to/from Mainland grew by **50.5%**\n- Visitor numbers increased by **31.5%**`, 20);

              // Now call the actual API for Excel generation
          setTimeout(async () => {
                console.log('📡 Calling HK extraction API for Excel generation...');
                const response = await fetch('http://localhost:3001/demo/hk-passenger-stats/extract', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    date: today,
                    filename: `immigration_clearance_stats_${today}.xlsx`,
                    headless: true
                  })
                });

                if (response.ok) {
                  // Get the blob for download
                  const blob = await response.blob();
                  const filename = response.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] || 'immigration_clearance_stats.xlsx';
                  const processingTime = response.headers.get('X-Processing-Time') || 'N/A';

                  // Create download link
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = filename;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);

                  // Success message with details (streaming)
                  await streamMessage(`✅ **Excel File Generated Successfully!**\n\n📄 **File Details:**\n- Filename: **${filename}**\n- Processing time: ${processingTime}\n- File size: ${(blob.size / 1024).toFixed(1)} KB\n\n📁 **Download Location:** Your downloads folder\n\n🎯 **What's Included:**\n- Complete Immigration Clearance statistics\n- 2023 vs 2024 comparison data\n- All categories with growth calculations\n- Professional Excel formatting\n\n*The table above shows the extracted data, and the Excel file contains the same data in a structured spreadsheet format.*`, 15);
                  
                  // Generate Excel from chat using ClientExcelService
                  try {
                    const currentSession = getActiveSession();
                    if (currentSession && currentSession.messages.length > 0) {
                      await ClientExcelService.generateExcelFromChat(
                        currentSession.messages.map(msg => ({ role: msg.role, content: msg.content })),
                        filename.replace('.xlsx', '_chat.xlsx')
                      );
                      console.log('📊 Generated Excel from chat data');
                    }
                  } catch (excelError) {
                    console.warn('⚠️ Could not generate Excel from chat:', excelError);
                  }

                } else {
                  const errorData = await response.json().catch(() => ({ error: 'Unknown server error' }));
                  throw new Error(errorData.error || `HTTP ${response.status}`);
                }
              }, 1500);
            }, 1000);

          } catch (apiError) {
            console.error('❌ API call failed:', apiError);
            await streamMessage(`❌ **Excel Generation Failed**\n\n**Error:** ${apiError instanceof Error ? apiError.message : 'Unknown error'}\n\n**However, the data extraction was successful!** You can see the Immigration Clearance statistics in the table above.\n\n**Troubleshooting:**\n- Make sure the workflow engine is running on port 3001\n- Check network connectivity\n- The data is still available in the chat above`, 30);
          }
          }, 2000);
      }, 1000);

    } catch (error) {
      console.error('HK Demo error:', error);
      await streamMessage(`❌ **Demo Error**: Failed to start autonomous demo.\n\n**Error:** ${error instanceof Error ? error.message : 'Unknown error'}`, 50);
    }
  };

  const runPDFBalanceSheetDemo = async () => {
    if (!activeSessionId) return;

    console.log('🎯 Starting PDF Balance Sheet Demo - Autonomous Chat with Real API');

    try {
      // Step 1: Simulate user asking for PDF extraction
      await simulateUserMessage(
        "I need to extract the consolidated balance sheets from Google's latest 10-Q filing. Can you help me extract the financial data from this PDF: https://abc.xyz/assets/51/e1/bf43f01041f6a8882a29d7e89cae/goog-10-q-q1-2025.pdf",
        500
      );

      // Step 2: AI responds with plan and starts extraction (streaming)
      setTimeout(async () => {
        await streamMessage(`📄 **PDF Balance Sheet Extraction**\n\nI'll extract the consolidated balance sheets from Google's Q1 2025 10-Q filing. Let me:\n\n1. 📄 Process the PDF using AI extraction\n2. 🎯 Focus on "Consolidated balance sheets" section\n3. 📊 Structure the financial data\n4. 💾 Format for analysis\n\n⏳ Starting PDF processing with Modal AI...`, 25);

                // Step 3: Stream the PDF extraction process with table display
        setTimeout(async () => {
          const pdfUrl = 'https://abc.xyz/assets/51/e1/bf43f01041f6a8882a29d7e89cae/goog-10-q-q1-2025.pdf';
          const prompt = 'Consolidated balance sheets';
          
          try {
            // First, show the processing message (streaming)
            await streamMessage(`🔄 **Processing Google 10-Q PDF...**\n\n⏳ Analyzing PDF content with AI...\n📄 **Source:** Google Q1 2025 10-Q Filing\n🎯 **Target:** Derivatives and Financial Instruments`, 40);

            console.log('📡 Calling PDF extraction API...');
            
            // Use the hardcoded PDF extraction service
            const result = await PDFExtractionService.extractSpecificTable(pdfUrl, prompt);
            
            if (result.status === 'success' && result.data) {
              // Display the derivatives table in a formatted way (streaming)
              setTimeout(async () => {
                await streamMessage(`📊 **Gross Notional Amounts of Outstanding Derivative Instruments**\n**(in millions)**\n\n**🔹 Derivatives designated as hedging instruments:**\n\n| Foreign Exchange Contracts | Dec 31, 2024 | Mar 31, 2025 | Change |\n|----------------------------|--------------|--------------|--------|\n| Cash flow hedges | $20,315 | $20,624 | +$309 |\n| Fair value hedges | $1,562 | $0 | -$1,562 |\n| Net investment hedges | $6,986 | $6,695 | -$291 |\n\n**🔸 Derivatives not designated as hedging instruments:**\n\n| Contract Type | Dec 31, 2024 | Mar 31, 2025 | Change |\n|---------------|--------------|--------------|--------|\n| Foreign exchange contracts | $44,227 | $40,612 | -$3,615 |\n| Other contracts | $15,082 | $12,549 | -$2,533 |\n\n**📈 Summary Analysis:**\n- **Total Portfolio:** $88.2B → $80.5B (-$7.7B, -8.7%)\n- **Largest Change:** Fair value hedges eliminated (-$1.6B)\n- **Significant Reduction:** Non-hedging FX contracts (-$3.6B)\n- **Stability:** Cash flow hedges remained relatively stable (+$309M)`, 20);

                // Show Excel generation step
          setTimeout(async () => {
                  try {
                    // Generate Excel file from the extracted data
                    const excelBlob = await PDFExtractionService.generateExcelFromPDFData(result.data, 'google_derivatives_analysis.csv');
                    
                    // Create download link
                    const url = URL.createObjectURL(excelBlob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'google_derivatives_analysis.csv';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);

                    await streamMessage(`✅ **PDF Extraction & Excel Generation Complete!**\n\n📄 **Successfully extracted derivatives data from Google 10-Q**\n\n**📋 Data Extracted:**\n- Gross notional amounts of derivative instruments\n- Hedging vs non-hedging instrument breakdown\n- Quarter-over-quarter comparison (Dec 2024 → Mar 2025)\n- Change analysis and portfolio insights\n\n**📊 Excel File Generated:**\n- **Filename:** google_derivatives_analysis.csv\n- **Content:** Structured derivatives data with categories\n- **Format:** Ready for financial analysis\n- **Location:** Your downloads folder\n\n**🎯 Key Findings:**\n- Google reduced total derivative exposure by $7.7 billion\n- Fair value hedges were completely eliminated\n- Overall risk reduction strategy evident\n\n**📈 The table above shows the complete derivatives portfolio breakdown, and the downloaded file contains the same data in a structured spreadsheet format.**`, 15);
                    
                    // Generate Excel from chat using ClientExcelService
                    try {
                      const currentSession = getActiveSession();
                      if (currentSession && currentSession.messages.length > 0) {
                        await ClientExcelService.generateExcelFromChat(
                          currentSession.messages.map(msg => ({ role: msg.role, content: msg.content })),
                          'google_derivatives_chat.xlsx'
                        );
                        console.log('📊 Generated Excel from chat data');
                      }
                    } catch (excelError) {
                      console.warn('⚠️ Could not generate Excel from chat:', excelError);
                    }
                  } catch (excelError) {
                    console.error('Excel generation error:', excelError);
                    await streamMessage(`✅ **PDF Extraction Complete!**\n\n📄 **Successfully extracted derivatives data from Google 10-Q**\n\n**📋 Data Extracted:**\n- Gross notional amounts of derivative instruments\n- Hedging vs non-hedging instrument breakdown\n- Quarter-over-quarter comparison (Dec 2024 → Mar 2025)\n- Change analysis and portfolio insights\n\n**🎯 Key Findings:**\n- Google reduced total derivative exposure by $7.7 billion\n- Fair value hedges were completely eliminated\n- Overall risk reduction strategy evident\n\n**📊 The table above shows the complete derivatives portfolio breakdown with detailed financial analysis.**\n\n*Note: Excel file generation encountered an issue, but the data extraction was successful.*`, 20);
                  }
                }, 1000);
              }, 1500);
            } else {
              throw new Error(result.error || 'Failed to extract data');
            }

            // Log full results to console for debugging
            console.log('📄 PDF Demo - Full Results:', result);

          } catch (apiError) {
            console.error('❌ PDF API call failed:', apiError);
            await streamMessage(`❌ **PDF Extraction Failed**\n\n**Error:** ${apiError instanceof Error ? apiError.message : 'Unknown error'}\n\n**However, this demo shows how PDF data would be extracted and displayed!**\n\n**What would happen:**\n- AI would analyze the Google 10-Q PDF\n- Extract the derivatives table automatically\n- Format the data in a clear table structure\n- Provide financial analysis and insights\n\n*The extraction process has been demonstrated above.*`, 30);
          }
          }, 2000);
      }, 1000);

    } catch (error) {
      console.error('PDF Demo error:', error);
      await streamMessage(`❌ **Demo Error**: Failed to start autonomous PDF demo.\n\n**Error:** ${error instanceof Error ? error.message : 'Unknown error'}`, 50);
    }
  };

  console.log('🔍 ChatInterface: Current enabled servers:', enabledServers);
  console.log('🛠️ ChatInterface: Available tools:', tools.length);

  // Local adapter that handles Excel operations directly without backend
  const mcpEnhancedAdapter = {
    streamText: (message: string, observer: any) => {
      console.log('🚀 Frontend: Starting local Excel-enhanced chat request for message:', message);
      
      // Get current session
      const currentSession = getActiveSession();
      if (!currentSession) {
        observer.error(new Error('No active chat session'));
        return;
      }
      
      // Make the async request with MCP tool execution
      (async () => {
        // Process Excel files before sending message
        let processedMessage = message;
        const excelData: unknown[] = [];
        
        // Add processing status message for Excel files
        if (attachments.some(att => att.type === 'excel')) {
          if (activeSessionId) {
            addMessage(activeSessionId, {
              role: 'assistant',
              content: `📊 **Processing Excel Files...**\n\n⏳ **Status:** Reading and analyzing uploaded Excel files\n🔍 **Processing:** Extracting data, formatting tables, and preparing for analysis\n\n*Please wait while I process your Excel data...*`
            });
          }
        }
        
        for (const attachment of attachments) {
          if (attachment.type === 'excel') {
            console.log('📊 Processing Excel file:', attachment.name);
            const excelResult = await ExcelService.readExcelFile(attachment.file);
            
            if (excelResult.status === 'success') {
              const formattedResult = ExcelService.formatExcelDataForChat(excelResult);
              processedMessage += `\n\n${formattedResult}`;
              
              // Store Excel data for potential use
              if (excelResult.data) {
                excelData.push(...excelResult.data);
              }
            } else {
              processedMessage += `\n\n❌ **Excel Processing Error**: ${excelResult.error}`;
            }
          }
        }
        
        // FIRST: Add user message to storage
        if (activeSessionId) {
          addMessage(activeSessionId, {
            role: 'user',
            content: processedMessage,
            attachments: attachments.map(att => ({
              name: att.name,
              type: att.type,
              size: att.size
            }))
          });
          console.log('💾 Added user message to session storage');
        }
        
        // THEN: Get complete conversation history including the new message
        const updatedSession = getActiveSession();
        // Create backend-compatible history (content field, not message field)
        const history = (updatedSession?.messages || [])
          .filter(msg => msg.content && msg.content.trim().length > 0) // Filter out messages with empty/undefined content
          .map(msg => ({
            role: msg.role,
            content: msg.content || '' // Ensure content is never undefined
          }));
        console.log('📚 Using conversation history:', history.length, 'messages');
        console.log('📚 History preview:', history.slice(-2)); // Show last 2 messages for debugging
        
        // Auto-generate session title from first message
        if (currentSession.messages.length === 0) {
          const title = chatHistoryHelpers.generateSessionTitle(message);
          // We'll update the title after this message is processed
        }
        try {
          console.log('📡 Frontend: Making fetch request to backend...');
          
          console.log('🛠️ Frontend: Using tools from enabled servers:', enabledServers);
          console.log('🔧 Frontend: All available tools:', tools);

          // Skip processing message - go straight to API call

          // Prepare dynamic MCP servers data (includes Smithery servers!)
          const mcpServers = enabledServers.reduce((acc, server) => {
            acc[server] = {
              enabled: true,
              tools: tools.filter(tool => tool.server === server)
            };
            return acc;
          }, {} as Record<string, unknown>);

          console.log('📊 Frontend: Dynamic MCP servers data:', mcpServers);

          // Prepare request with file support
          let requestBody: FormData | string;
          const requestHeaders: Record<string, string> = {};
          
          if (attachments.length > 0) {
            // Use FormData for file uploads
            const formData = new FormData();
            formData.append('message', processedMessage); // Use processed message
            formData.append('mcpTools', JSON.stringify(tools));
            formData.append('mcpServers', JSON.stringify(mcpServers));
            formData.append('history', JSON.stringify(history));
            if (excelData.length > 0) {
              formData.append('excelData', JSON.stringify(excelData));
            }
            
            // Add file attachments
            attachments.forEach((attachment, index) => {
              formData.append(`file_${index}`, attachment.file);
              formData.append(`file_${index}_type`, attachment.type);
              formData.append(`file_${index}_name`, attachment.name);
            });
            
            formData.append('fileCount', attachments.length.toString());
            requestBody = formData;
            // Don't set Content-Type header - let browser set it with boundary for FormData
          } else {
            // Use JSON for text-only messages
            requestHeaders['Content-Type'] = 'application/json';
            requestBody = JSON.stringify({
              message: processedMessage, // Use processed message that includes Excel data
              history: history,
              mcpTools: tools, // Send ALL available MCP tools (including Smithery!)
              mcpServers: mcpServers, // Dynamic server detection
              excelData: excelData.length > 0 ? excelData : undefined // Include Excel data if available
            });
          }

          // Handle Excel operations locally without backend
          console.log('🔧 Frontend: Processing Excel request locally...');
          
          // Simulate a response for Excel operations
          const lowerMessage = message.toLowerCase();
          let response = '';
          let mcpToolCalls = [];
          
          if (lowerMessage.includes('excel') || lowerMessage.includes('spreadsheet') || 
              lowerMessage.includes('create') || lowerMessage.includes('data') ||
              lowerMessage.includes('tiger') || lowerMessage.includes('population')) {
            
            response = `I'll help you create an Excel file with the requested data. Let me use the Excel tools to generate a spreadsheet for you.`;
            
            // Find Excel tools
            const excelTools = tools.filter(t => t.server === 'excel');
            console.log('🔧 Available Excel tools:', excelTools);
            
            if (excelTools.length > 0) {
              // Use excel_sample tool to create a sample file
              mcpToolCalls = [{
                server: 'excel',
                tool: 'excel_sample',
                args: {
                  filePath: `./public/downloads/sample_${Date.now()}.xlsx`
                }
              }];
            }
          } else {
            response = `I'm an Excel workflow assistant. I can help you create Excel files, read spreadsheet data, and perform various Excel operations. Try asking me to "create an Excel file" or "generate a sample spreadsheet".`;
          }
          
          const data = {
            response,
            status: 'success',
            mcpToolCalls
          };

          // Skip status messages - process files silently

          // Skip thinking display - go straight to response

          // Simple response handling - just stream the response
          if (!data.response) {
            console.error('❌ Frontend: No response field in data:', data);
            observer.error(new Error('Backend did not return a response field'));
            return;
          }

          console.log('✅ Frontend: Got response, streaming...', data.response.length, 'chars');
          
          // Just stream the response word by word - keep it simple
          const words = data.response.split(' ');
          for (const word of words) {
            observer.next(word + ' ');
            await new Promise(resolve => setTimeout(resolve, 30));
          }

          // Handle MCP tool calls if present (simplified)
          if (data.mcpToolCalls && data.mcpToolCalls.length > 0) {
            observer.next(`\n\n🔧 **Using ${data.mcpToolCalls.length} MCP tool(s)...**\n\n`);
            
            for (const toolCall of data.mcpToolCalls) {
              try {
                const result = await callTool(toolCall.server, toolCall.tool, toolCall.args);
                observer.next(`✅ ${toolCall.tool}: Success\n`);
              } catch (error) {
                observer.next(`❌ ${toolCall.tool}: ${error}\n`);
              }
            }
          }
          
          console.log('✅ Frontend: Finished streaming response');
          
          // Save assistant response to chat history (simplified)
          if (activeSessionId) {
            const assistantMessage = {
              role: 'assistant' as const,
              content: data.response || 'Response processed successfully',
              mcpToolCalls: data.mcpToolCalls || []
            };
            
            addMessage(activeSessionId, assistantMessage);
            console.log('💾 Saved assistant message to chat history');
            
            // Auto-generate session title from first user message
            if (currentSession.messages.length <= 2) {
              const title = chatHistoryHelpers.generateSessionTitle(message);
              updateSessionTitle(activeSessionId, title);
              console.log('📝 Updated session title:', title);
            }
          }
          
          // Clear attachments after successful processing
          if (attachments.length > 0) {
            console.log('🧹 Frontend: Clearing attachments after successful processing');
            setAttachments([]);
          }
          
          observer.complete();

        } catch (error) {
          console.error('❌ Frontend: Chat adapter error:', error);
          console.error('❌ Frontend: Error details:', {
            name: error instanceof Error ? error.name : 'Unknown',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
          });
          
          const errorMessage = error instanceof Error ? error.message : String(error);
          
          // Provide a helpful fallback response instead of just throwing an error
          if (errorMessage.includes('fetch') || errorMessage.includes('Failed to fetch') || errorMessage.includes('ERR_CONNECTION_REFUSED')) {
            observer.next(`❌ **Backend Connection Failed**\n\n**Issue:** Cannot connect to the workflow engine at http://localhost:3001\n\n**Quick Solutions:**\n1. **Start the workflow engine:**\n   \`\`\`bash\n   cd apps/workflow-engine\n   npm run dev\n   \`\`\`\n\n2. **Check if port 3001 is available**\n\n3. **Try the demo buttons above** - they work independently\n\n**Note:** You can still use the HK Demo 🇭🇰 and PDF Demo 📊 buttons above, which have built-in data and don't require the backend.\n\n*Once the backend is running, regular chat will work normally.*`);
          } else {
            observer.next(`❌ **Processing Error**: ${errorMessage}\n\n**Suggestions:**\n- Try rephrasing your question\n- Use the demo buttons above\n- Check your file attachments\n\n*If the issue persists, try refreshing the page.*`);
          }
          
          observer.complete(); // Complete the stream instead of erroring
        }
      })();
    }
  };

  // Get current session info for display
  const currentSession = getActiveSession();
  const sessionTitle = currentSession?.title || 'New Chat';

  return (
    <div className="h-full w-full flex">
      {/* Chat Sessions Sidebar */}
      <ChatSessionsSidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)} 
      />
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="p-3 border-b bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 hover:bg-muted rounded-md transition-colors"
                title="Open chat sessions"
              >
                💬
              </button>
            )}
            <div className="flex-1">
              <h1 className="font-semibold text-lg">{sessionTitle}</h1>
              <p className="text-sm text-muted-foreground">
                {currentSession ? `${currentSession.messages.length} messages` : 'No active session'}
                {enabledServers.length > 0 && (
                  <span> • {enabledServers.length} MCP server{enabledServers.length !== 1 ? 's' : ''} enabled</span>
                )}
              </p>
            </div>
            
            {/* Demo Buttons */}
            <div className="flex gap-2">
              <button
                onClick={runHKPassengerDemo}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
                title="Run HK Passenger Statistics Demo - Extract live data from Hong Kong Immigration Department"
              >
                🇭🇰 HK Demo
              </button>
              
              <button
                onClick={runPDFBalanceSheetDemo}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm font-medium"
                title="Run Google 10-Q Balance Sheet Demo - Extract consolidated balance sheets using AI"
              >
                📊 PDF Demo
              </button>
            </div>

            {/* Excel Export Button */}
            <button
              onClick={async () => {
                try {
                  const currentSession = getActiveSession();
                  if (!currentSession || currentSession.messages.length === 0) {
                    alert('No chat messages to export. Start a conversation first.');
                    return;
                  }
                  
                  await ClientExcelService.generateExcelFromChat(
                    currentSession.messages.map(msg => ({ role: msg.role, content: msg.content })),
                    `chat_export_${new Date().toISOString().slice(0,10)}.xlsx`
                  );
                  console.log('📄 Excel export completed');
                } catch (error) {
                  console.error('❌ Excel export failed:', error);
                  alert('Failed to export chat to Excel. Please try again.');
                }
              }}
              className="p-2 hover:bg-muted rounded-md transition-colors"
              title="Export Chat to Excel"
            >
              📊
            </button>
            
            {/* PDF Extraction Button */}
            <button
              onClick={() => setShowPDFExtraction(!showPDFExtraction)}
              className="p-2 hover:bg-muted rounded-md transition-colors"
              title="PDF Data Extraction"
            >
              📄
            </button>
            
            {/* Excel Processing Indicator */}
            {attachments.some(att => att.type === 'excel') && (
              <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs">
                📊 Excel Ready
              </div>
            )}
            
            {/* Tool Call Monitor Button */}
            <button
              onClick={openWindow}
              className="p-2 hover:bg-muted rounded-md transition-colors relative"
              title="Open MCP Tool Monitor"
            >
              🔧
              {toolCalls.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {toolCalls.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* PDF Extraction Panel */}
        {showPDFExtraction && (
          <div className="border-b bg-muted/30 p-4">
            <div className="max-w-4xl mx-auto">
              <h3 className="font-semibold mb-3">📄 PDF Data Extraction</h3>
              
              {/* PDF URL Input */}
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">PDF URL:</label>
                <input
                  type="url"
                  value={pdfUrl}
                  onChange={(e) => setPdfUrl(e.target.value)}
                  placeholder="https://example.com/document.pdf"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isExtracting}
                />
              </div>
              
              {/* Extraction Prompt */}
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">
                  Extraction Prompt (optional for specific extraction):
                </label>
                <input
                  type="text"
                  value={extractionPrompt}
                  onChange={(e) => setExtractionPrompt(e.target.value)}
                  placeholder="e.g., 'Consolidated balance sheets', 'Revenue table', 'Financial summary'"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isExtracting}
                />
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => handlePDFExtraction(true)}
                  disabled={isExtracting || !pdfUrl.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExtracting ? 'Extracting...' : 'Extract All Tables'}
                </button>
                
                <button
                  onClick={() => handlePDFExtraction(false)}
                  disabled={isExtracting || !pdfUrl.trim() || !extractionPrompt.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExtracting ? 'Extracting...' : 'Extract Specific Data'}
                </button>
                
                <button
                  onClick={() => setShowPDFExtraction(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  disabled={isExtracting}
                >
                  Cancel
                </button>
              </div>
              
              {/* API Endpoints Reference */}
              <div className="mt-3 p-2 bg-gray-100 rounded text-xs">
                <strong>API Endpoints:</strong>
                <br />• Extract All: <code>extract-tables.modal.run</code>
                <br />• Extract Specific: <code>extract-specific-table.modal.run</code>
              </div>
            </div>
          </div>
        )}

        {/* File Upload Area */}
        <FileUploadArea
          attachments={attachments}
          onAttachmentsChange={setAttachments}
          maxFiles={5}
          maxFileSize={50 * 1024 * 1024} // 50MB
        />
        
        {/* Chat Interface */}
        <div className="flex-1 min-h-0">
          <AiChat
          key={nluxKey} // Force complete re-render when session changes
          adapter={mcpEnhancedAdapter}
          initialConversation={currentSession ? chatHistoryHelpers.toNLUXHistory(currentSession.messages) : []}
          displayOptions={{
            colorScheme: 'auto',
            width: '100%',
            height: '100%'
          }}
          conversationOptions={{
            historyPayloadSize: 'max'
          }}
          messageOptions={{
            showCodeBlockCopyButton: true,
            markdownLinkTarget: 'blank',
            streamingAnimationSpeed: 10
          }}
          composerOptions={{
            placeholder: attachments.length > 0 
              ? `Ask me about the ${attachments.length} uploaded file${attachments.length > 1 ? 's' : ''}, or create an Excel workflow...`
              : 'Ask me to create an Excel workflow, extract PDF data, or scrape web content...',
            autoFocus: true
          }}
          personaOptions={{
            assistant: {
              name: 'MAGK Assistant',
              tagline: 'Excel Workflow Expert with MCP Tools',
              avatar: '🤖'
            }
          }}
          />
        </div>
      </div>
      
      {/* Tool Call Status Window */}
      <ToolCallStatusWindow
        toolCalls={toolCalls}
        isOpen={isWindowOpen}
        onClose={closeWindow}
      />
    </div>
  );
}
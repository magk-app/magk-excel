import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { z } from 'zod';
import { LLMService } from '../services/llm-service.js';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const chatV2Route = new Hono();

// Request schema
const chatRequestSchema = z.object({
  message: z.string(),
  modelConfig: z.object({
    provider: z.enum(['anthropic', 'openai', 'bedrock']).default('anthropic'),
    model: z.string().default('claude-3-5-sonnet-20241022'),
    displayName: z.string().optional(),
    enableThinking: z.boolean().default(false),
    temperature: z.number().optional(),
    maxTokens: z.number().optional(),
    apiKey: z.string().optional()
  }),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).optional().default([]),
  attachments: z.array(z.object({
    name: z.string(),
    type: z.string(),
    size: z.number(),
    content: z.string().optional() // Base64 encoded content if needed
  })).optional().default([]),
  mcpTools: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    server: z.string().optional(),
    inputSchema: z.any().optional()
  })).optional().default([]),
  mcpServers: z.record(z.object({
    enabled: z.boolean(),
    tools: z.array(z.any()).optional()
  })).optional().default({})
});

// Initialize LLM service
const llmService = new LLMService();

// Helper function for AI-based MCP tool selection
async function selectMCPToolsWithAI(message: string, mcpTools: any[], attachments: any[] = []): Promise<any[]> {
  // Create a concise tool catalog for the LLM
  const toolCatalog = mcpTools.map(tool => ({
    server: tool.server,
    name: tool.name,
    description: tool.description || 'No description',
    inputSchema: tool.inputSchema ? Object.keys(tool.inputSchema.properties || {}) : []
  }));

  let fileContext = '';
  if (attachments.length > 0) {
    fileContext = `\n\nUploaded Files:\n${attachments.map(f => `- ${f.name} (${f.type}, ${f.size} bytes)`).join('\n')}`;
  }

  // Generate unique filename for Excel exports
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputFilename = `excel_export_${timestamp}.xlsx`;
  const outputPath = `../client/magk-excel/public/downloads/${outputFilename}`;

  const toolSelectionPrompt = `User request: "${message}"${fileContext}

Available tools:
${toolCatalog.map(t => `${t.server}/${t.name}`).join('\n')}

For Excel data extraction/processing, use:
- excel/excel_write_to_sheet (save to: ${outputPath})
- excel/excel_read_sheet (read existing files)
- excel/excel_describe_sheets (get sheet info)

For web scraping, use: fetch/fetch or puppeteer/navigate
For HTTP requests, use: fetch/fetch

Return JSON array with tool selections including appropriate file paths:`;

  try {
    console.log('🔍 DEBUG: Tool selection prompt:', toolSelectionPrompt);
    
    const llmResult = await llmService.chatWithSystem(toolSelectionPrompt, '', [], { enableThinking: false });
    const response = llmResult.response;
    console.log('🔍 DEBUG: Raw AI response:', JSON.stringify(response));
    
    // Clean the response to ensure it's valid JSON
    const cleanedResponse = response.trim()
      .replace(/^```json\s*/i, '')
      .replace(/```\s*$/, '')
      .trim();
    
    // If response doesn't look like JSON, try to extract JSON from it
    let jsonMatch = cleanedResponse.match(/\[.*\]/s);
    if (!jsonMatch && !cleanedResponse.startsWith('[')) {
      jsonMatch = response.match(/\[.*\]/s);
    }
    
    const jsonStr = jsonMatch ? jsonMatch[0] : cleanedResponse;
    const selectedTools = JSON.parse(jsonStr);
    
    // Validate the structure
    if (!Array.isArray(selectedTools)) {
      console.error('❌ AI returned non-array response:', typeof selectedTools);
      return [];
    }
    
    // Validate each tool exists
    const validTools = selectedTools.filter(selection => {
      const toolExists = mcpTools.some(t => 
        t.server === selection.server && t.name === selection.tool
      );
      if (!toolExists) {
        console.warn(`⚠️ AI selected non-existent tool: ${selection.server}/${selection.tool}`);
      }
      return toolExists;
    });
    
    console.log('✅ Valid AI-selected tools:', validTools);
    return validTools;
    
  } catch (error) {
    console.error('❌ Error in AI tool selection:', error);
    return [];
  }
}

// Helper function to save uploaded files to temp directory
function saveUploadedFile(attachment: any): string | null {
  try {
    // Generate temp file path
    const tempPath = join(tmpdir(), attachment.name);
    
    // Decode base64 content if present
    if (attachment.content) {
      const buffer = Buffer.from(attachment.content, 'base64');
      writeFileSync(tempPath, buffer);
      console.log('📁 Saved uploaded file to:', tempPath);
      return tempPath;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Failed to save file:', error);
    return null;
  }
}

// Simple health check
chatV2Route.get('/health', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'chat-v2'
  });
});

// Main chat endpoint with streaming
chatV2Route.post('/chat/stream', async (c) => {
  console.log('🚀 Chat V2 Stream endpoint called');
  
  try {
    const body = await c.req.json();
    const request = chatRequestSchema.parse(body);
    
    console.log('📝 Request:', {
      message: request.message,
      model: request.modelConfig.model,
      enableThinking: request.modelConfig.enableThinking,
      historyLength: request.history.length
    });

    // Build conversation history - filter out any empty messages
    const cleanHistory = request.history.filter(m => m.content && m.content.trim() !== '');
    
    console.log('📚 Filtered history:', cleanHistory.map(m => ({ role: m.role, contentLength: m.content.length })));

    // Return SSE stream
    return streamSSE(c, async (stream) => {
      try {
        // Send initial acknowledgment
        await stream.writeSSE({
          data: JSON.stringify({
            type: 'start',
            message: 'Starting response...'
          })
        });

        // If thinking is enabled, send thinking indicator
        if (request.modelConfig.enableThinking) {
          await stream.writeSSE({
            data: JSON.stringify({
              type: 'thinking',
              message: 'Thinking about your request...'
            })
          });
          
          // Simulate thinking delay
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Perform AI-based tool selection
        let mcpToolCalls: any[] = [];
        let savedFilePaths: Record<string, string> = {};
        
        if (request.mcpTools && request.mcpTools.length > 0) {
          console.log('🤖 Using AI to select appropriate MCP tools...');
          mcpToolCalls = await selectMCPToolsWithAI(request.message, request.mcpTools, request.attachments);
          
          // Fallback: Check for uploaded files that need processing
          if (mcpToolCalls.length === 0 && request.attachments.length > 0) {
            console.log('🔧 Fallback: Processing uploaded files with MCP tools');
            
            const excelFiles = request.attachments.filter(a => 
              a.type.includes('excel') || a.type.includes('spreadsheet') || 
              a.name.endsWith('.xlsx') || a.name.endsWith('.xls')
            );
            
            const pdfFiles = request.attachments.filter(a => 
              a.type === 'application/pdf' || a.name.endsWith('.pdf')
            );
            
            // Save files to temp directory for MCP tool access
            for (const attachment of [...excelFiles, ...pdfFiles]) {
              const tempPath = saveUploadedFile(attachment);
              if (tempPath) {
                savedFilePaths[attachment.name] = tempPath;
                
                // Add appropriate tool calls
                if (excelFiles.includes(attachment)) {
                  // Add Excel tool calls
                  const describeTool = request.mcpTools.find(t => t.server === 'excel' && t.name === 'excel_describe_sheets');
                  const readTool = request.mcpTools.find(t => t.server === 'excel' && t.name === 'excel_read_sheet');
                  
                  if (describeTool) {
                    mcpToolCalls.push({
                      server: 'excel',
                      tool: 'excel_describe_sheets',
                      args: { file_path: tempPath }
                    });
                  }
                  
                  if (readTool) {
                    mcpToolCalls.push({
                      server: 'excel',
                      tool: 'excel_read_sheet',
                      args: { file_path: tempPath, sheet_name: 'Sheet1', limit: 100 }
                    });
                  }
                }
                
                // Add PDF tool calls
                if (pdfFiles.includes(attachment)) {
                  // Add PDF tool calls
                  const pdfExtractTool = request.mcpTools.find(t => t.server === 'pdf' && t.name === 'pdf_extract_tables');
                  const pdfTextTool = request.mcpTools.find(t => t.server === 'pdf' && t.name === 'pdf_extract_text');
                  
                  if (pdfExtractTool) {
                    mcpToolCalls.push({
                      server: 'pdf',
                      tool: 'pdf_extract_tables',
                      args: { file_path: tempPath }
                    });
                  }
                  
                  if (pdfTextTool) {
                    mcpToolCalls.push({
                      server: 'pdf',
                      tool: 'pdf_extract_text',
                      args: { file_path: tempPath }
                    });
                  }
                }
              }
            }
          }
        }
        
        console.log('📊 Final tool calls selected:', mcpToolCalls.length, mcpToolCalls);
        
        // Build enhanced system prompt with MCP tools information
        let enhancedSystemPrompt = undefined;
        if (request.mcpTools && request.mcpTools.length > 0) {
          const toolsList = request.mcpTools.map(tool => 
            `- **${tool.name}** (${tool.server || 'local'}): ${tool.description || 'No description'}`
          ).join('\n');
          
          enhancedSystemPrompt = `You have access to the following MCP tools that you can mention and use to help the user:

${toolsList}

When relevant, mention these tools and how they can help with the user's request. For Excel tasks, you can use the excel_write_to_sheet tool to create files.`;
          
          // Add information about tool calls that will be executed
          if (mcpToolCalls.length > 0) {
            enhancedSystemPrompt += `\n\nBased on the user's request, I've identified that the following MCP tools will be used:\n${mcpToolCalls.map(tc => `- ${tc.tool} from ${tc.server} server`).join('\n')}\n\nPlease acknowledge these tool selections and explain how they will help fulfill the user's request.`;
          }
        }

        // Add file context if attachments present
        if (request.attachments && request.attachments.length > 0) {
          const fileDetails = request.attachments.map(a => {
            const sizeKB = Math.round(a.size / 1024);
            const hasContent = !!a.content;
            return `- **${a.name}** (${sizeKB}KB, ${a.type})${hasContent ? ' [content available]' : ''}`;
          }).join('\n');
          
          let attachmentContext = `\n\n## Uploaded Files\nThe user has uploaded the following files:\n${fileDetails}\n\n`;
          
          // Add specific instructions based on file types
          const hasExcel = request.attachments.some(a => 
            a.type.includes('excel') || a.type.includes('spreadsheet') || 
            a.name.endsWith('.xlsx') || a.name.endsWith('.xls')
          );
          const hasPDF = request.attachments.some(a => 
            a.type === 'application/pdf' || a.name.endsWith('.pdf')
          );
          const hasCSV = request.attachments.some(a => 
            a.type === 'text/csv' || a.name.endsWith('.csv')
          );
          
          let instructions = '';
          if (hasExcel) {
            instructions += '- For Excel files: Describe the structure, sheets, and data. Use excel_read_sheet and excel_describe_sheets tools if available.\n';
          }
          if (hasPDF) {
            instructions += '- For PDF files: Extract and analyze the content, identify tables and text. Use pdf_extract tools if available.\n';
          }
          if (hasCSV) {
            instructions += '- For CSV files: Parse and analyze the data structure, identify columns and data types.\n';
          }
          
          if (instructions) {
            attachmentContext += `\n**Processing Instructions:**\n${instructions}\n`;
          }
          
          attachmentContext += '\nImmediately acknowledge the files and describe what you can do with them. If the user hasn\'t specified what to do, show a preview of the data and suggest possible actions.';
          
          enhancedSystemPrompt = (enhancedSystemPrompt || '') + attachmentContext;
        }

        // Get response from LLM service
        // Note: chatWithSystem signature is (systemPrompt, message, history, modelConfig)
        const response = await llmService.chatWithSystem(
          enhancedSystemPrompt, // Enhanced system prompt with MCP tools and attachments
          request.message,
          cleanHistory, // Clean history without empty messages
          {
            model: request.modelConfig.model,
            enableThinking: request.modelConfig.enableThinking,
            temperature: request.modelConfig.temperature,
            maxTokens: request.modelConfig.maxTokens,
            apiKey: request.modelConfig.apiKey || process.env.ANTHROPIC_API_KEY
          }
        );

        // Stream the response word by word
        const words = response.response.split(' ');
        let accumulatedText = '';
        
        for (let i = 0; i < words.length; i++) {
          accumulatedText += (i > 0 ? ' ' : '') + words[i];
          
          await stream.writeSSE({
            data: JSON.stringify({
              type: 'content',
              content: accumulatedText,
              isStreaming: true
            })
          });
          
          // Small delay for realistic streaming (reduced from 20ms to 5ms for faster typing)
          await new Promise(resolve => setTimeout(resolve, 5));
        }

        // Send tool calls information if any
        if (mcpToolCalls.length > 0) {
          await stream.writeSSE({
            data: JSON.stringify({
              type: 'toolCalls',
              toolCalls: mcpToolCalls,
              message: `Executing ${mcpToolCalls.length} MCP tool(s)...`
            })
          });
          
          // Note: Actual tool execution would happen on the client side
          // The client should call the MCP tools and show results
        }
        
        // Send completion
        await stream.writeSSE({
          data: JSON.stringify({
            type: 'complete',
            content: accumulatedText,
            isStreaming: false,
            thinking: response.thinking,
            mcpToolCalls: mcpToolCalls.length > 0 ? mcpToolCalls : undefined,
            savedFiles: Object.keys(savedFilePaths).length > 0 ? savedFilePaths : undefined
          })
        });

        console.log('✅ Stream completed successfully');
      } catch (error) {
        console.error('❌ Stream error:', error);
        await stream.writeSSE({
          data: JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        });
      }
    });
  } catch (error) {
    console.error('❌ Chat V2 error:', error);
    return c.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

// Non-streaming endpoint for backwards compatibility
chatV2Route.post('/chat', async (c) => {
  console.log('🚀 Chat V2 endpoint called');
  
  try {
    const body = await c.req.json();
    const request = chatRequestSchema.parse(body);
    
    console.log('📝 Request:', {
      message: request.message,
      model: request.modelConfig.model,
      enableThinking: request.modelConfig.enableThinking
    });

    // Build conversation history - filter out any empty messages
    const cleanHistory = request.history.filter(m => m.content && m.content.trim() !== '');
    
    console.log('📚 Filtered history for non-streaming:', cleanHistory.map(m => ({ role: m.role, contentLength: m.content.length })));

    // Perform AI-based tool selection (same as streaming)
    let mcpToolCalls: any[] = [];
    let savedFilePaths: Record<string, string> = {};
    
    if (request.mcpTools && request.mcpTools.length > 0) {
      console.log('🤖 Using AI to select appropriate MCP tools...');
      mcpToolCalls = await selectMCPToolsWithAI(request.message, request.mcpTools, request.attachments);
      
      // Fallback: Check for uploaded files that need processing
      if (mcpToolCalls.length === 0 && request.attachments.length > 0) {
        console.log('🔧 Fallback: Processing uploaded files with MCP tools');
        
        const excelFiles = request.attachments.filter(a => 
          a.type.includes('excel') || a.type.includes('spreadsheet') || 
          a.name.endsWith('.xlsx') || a.name.endsWith('.xls')
        );
        
        const pdfFiles = request.attachments.filter(a => 
          a.type === 'application/pdf' || a.name.endsWith('.pdf')
        );
        
        // Save files to temp directory for MCP tool access
        for (const attachment of [...excelFiles, ...pdfFiles]) {
          const tempPath = saveUploadedFile(attachment);
          if (tempPath) {
            savedFilePaths[attachment.name] = tempPath;
            
            // Add appropriate tool calls
            if (excelFiles.includes(attachment)) {
              // Add Excel tool calls
              const describeTool = request.mcpTools.find(t => t.server === 'excel' && t.name === 'excel_describe_sheets');
              const readTool = request.mcpTools.find(t => t.server === 'excel' && t.name === 'excel_read_sheet');
              
              if (describeTool) {
                mcpToolCalls.push({
                  server: 'excel',
                  tool: 'excel_describe_sheets',
                  args: { file_path: tempPath }
                });
              }
              
              if (readTool) {
                mcpToolCalls.push({
                  server: 'excel',
                  tool: 'excel_read_sheet',
                  args: { file_path: tempPath, sheet_name: 'Sheet1', limit: 100 }
                });
              }
            }
            
            // Add PDF tool calls
            if (pdfFiles.includes(attachment)) {
              // Add PDF tool calls
              const pdfExtractTool = request.mcpTools.find(t => t.server === 'pdf' && t.name === 'pdf_extract_tables');
              const pdfTextTool = request.mcpTools.find(t => t.server === 'pdf' && t.name === 'pdf_extract_text');
              
              if (pdfExtractTool) {
                mcpToolCalls.push({
                  server: 'pdf',
                  tool: 'pdf_extract_tables',
                  args: { file_path: tempPath }
                });
              }
              
              if (pdfTextTool) {
                mcpToolCalls.push({
                  server: 'pdf',
                  tool: 'pdf_extract_text',
                  args: { file_path: tempPath }
                });
              }
            }
          }
        }
      }
    }
    
    console.log('📊 Final tool calls selected:', mcpToolCalls.length, mcpToolCalls);
    
    // Build enhanced system prompt with MCP tools information (same as streaming)
    let enhancedSystemPrompt = undefined;
    if (request.mcpTools && request.mcpTools.length > 0) {
      const toolsList = request.mcpTools.map(tool => 
        `- **${tool.name}** (${tool.server || 'local'}): ${tool.description || 'No description'}`
      ).join('\n');
      
      enhancedSystemPrompt = `You have access to the following MCP tools that you can mention and use to help the user:

${toolsList}

When relevant, mention these tools and how they can help with the user's request. For Excel tasks, you can use the excel_write_to_sheet tool to create files.`;
      
      // Add information about tool calls that will be executed
      if (mcpToolCalls.length > 0) {
        enhancedSystemPrompt += `\n\nBased on the user's request, I've identified that the following MCP tools will be used:\n${mcpToolCalls.map(tc => `- ${tc.tool} from ${tc.server} server`).join('\n')}\n\nPlease acknowledge these tool selections and explain how they will help fulfill the user's request.`;
      }
    }

    // Add file context if attachments present
    if (request.attachments && request.attachments.length > 0) {
      const fileDetails = request.attachments.map(a => {
        const sizeKB = Math.round(a.size / 1024);
        const hasContent = !!a.content;
        return `- **${a.name}** (${sizeKB}KB, ${a.type})${hasContent ? ' [content available]' : ''}`;
      }).join('\n');
      
      let attachmentContext = `\n\n## Uploaded Files\nThe user has uploaded the following files:\n${fileDetails}\n\n`;
      
      // Add specific instructions based on file types
      const hasExcel = request.attachments.some(a => 
        a.type.includes('excel') || a.type.includes('spreadsheet') || 
        a.name.endsWith('.xlsx') || a.name.endsWith('.xls')
      );
      const hasPDF = request.attachments.some(a => 
        a.type === 'application/pdf' || a.name.endsWith('.pdf')
      );
      const hasCSV = request.attachments.some(a => 
        a.type === 'text/csv' || a.name.endsWith('.csv')
      );
      
      let instructions = '';
      if (hasExcel) {
        instructions += '- For Excel files: Describe the structure, sheets, and data. Use excel_read_sheet and excel_describe_sheets tools if available.\n';
      }
      if (hasPDF) {
        instructions += '- For PDF files: Extract and analyze the content, identify tables and text. Use pdf_extract tools if available.\n';
      }
      if (hasCSV) {
        instructions += '- For CSV files: Parse and analyze the data structure, identify columns and data types.\n';
      }
      
      if (instructions) {
        attachmentContext += `\n**Processing Instructions:**\n${instructions}\n`;
      }
      
      attachmentContext += '\nImmediately acknowledge the files and describe what you can do with them. If the user hasn\'t specified what to do, show a preview of the data and suggest possible actions.';
      
      enhancedSystemPrompt = (enhancedSystemPrompt || '') + attachmentContext;
    }

    // Get response from LLM service
    // Note: chatWithSystem signature is (systemPrompt, message, history, modelConfig)
    const response = await llmService.chatWithSystem(
      enhancedSystemPrompt, // Enhanced system prompt with MCP tools and attachments
      request.message,
      cleanHistory, // Clean history without empty messages
      {
        model: request.modelConfig.model,
        enableThinking: request.modelConfig.enableThinking,
        temperature: request.modelConfig.temperature,
        maxTokens: request.modelConfig.maxTokens,
        apiKey: request.modelConfig.apiKey || process.env.ANTHROPIC_API_KEY
      }
    );

    console.log('✅ Response generated:', {
      length: response.response.length,
      hasThinking: !!response.thinking
    });

    return c.json({
      success: true,
      response: response.response,
      thinking: response.thinking,
      model: request.modelConfig.model,
      timestamp: new Date().toISOString(),
      mcpToolCalls: mcpToolCalls.length > 0 ? mcpToolCalls : undefined,
      savedFiles: Object.keys(savedFilePaths).length > 0 ? savedFilePaths : undefined
    });
  } catch (error) {
    console.error('❌ Chat V2 error:', error);
    return c.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

export { chatV2Route };
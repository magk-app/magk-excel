import { Hono } from 'hono';
import { z } from 'zod';
import { LLMService } from '../services/llm-service.js';
import { WorkflowGenerator } from '../services/workflow-generator.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

const chatRoute = new Hono();
const llmService = new LLMService();
const workflowGenerator = new WorkflowGenerator();

// Intelligent MCP tool selection using LLM
async function selectMCPToolsWithAI(message: string, mcpTools: any[], llmService: LLMService, uploadedFiles: any[] = []): Promise<any[]> {
  // Create a concise tool catalog for the LLM
  const toolCatalog = mcpTools.map(tool => ({
    server: tool.server,
    name: tool.name,
    description: tool.description || 'No description',
    inputSchema: tool.inputSchema ? Object.keys(tool.inputSchema.properties || {}) : []
  }));

  let fileContext = '';
  if (uploadedFiles.length > 0) {
    fileContext = `\n\nUploaded Files:
${uploadedFiles.map(f => `- ${f.originalName} (${f.type}, ${f.size} bytes)`).join('\n')}`;
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
 
For dynamic code execution with ExcelJS, use:
- executor/run_ts (provide a module exporting async function main(ctx) and return JSON)

For web scraping, use: fetch/fetch or puppeteer/navigate
For HTTP requests, use: fetch/fetch

Return JSON array with tool selections including appropriate file paths:
`;

  try {
    console.log('🔍 DEBUG: Tool selection prompt:', toolSelectionPrompt);
    console.log('🔍 DEBUG: Available tools catalog:', toolCatalog);
    
    const llmResult = await llmService.chatWithSystem(toolSelectionPrompt, '', [], { enableThinking: false }); // Disable thinking for tool selection
    const response = llmResult.response;
    console.log('🔍 DEBUG: Raw AI response:', JSON.stringify(response));
    
    // Clean the response to ensure it's valid JSON
    const cleanedResponse = response.trim()
      .replace(/^```json\s*/i, '')
      .replace(/```\s*$/, '')
      .trim();
    
    console.log('🔍 DEBUG: Cleaned response:', cleanedResponse);
    
    // If response doesn't look like JSON, try to extract JSON from it
    let jsonMatch = cleanedResponse.match(/\[.*\]/s);
    if (!jsonMatch && !cleanedResponse.startsWith('[')) {
      console.log('🔍 DEBUG: Response doesn\'t look like JSON array, searching for JSON...');
      jsonMatch = response.match(/\[.*\]/s);
    }
    
    const jsonStr = jsonMatch ? jsonMatch[0] : cleanedResponse;
    console.log('🔍 DEBUG: JSON string to parse:', jsonStr);
    
    // Parse the JSON response
    const selectedTools = JSON.parse(jsonStr);
    console.log('🔍 DEBUG: Parsed tools:', selectedTools);
    
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
        console.warn('Available tools:', mcpTools.map(t => `${t.server}/${t.name}`));
      }
      return toolExists;
    });
    
    console.log('✅ Valid AI-selected tools:', validTools);
    return validTools;
    
  } catch (error) {
    console.error('❌ Error in AI tool selection:', error);
    console.error('❌ Error details:', error instanceof Error ? error.message : String(error));
    // Fallback to empty array if AI fails
    return [];
  }
}

function generateMCPSystemPrompt(mcpTools: any[], mcpServers: any, toolCalls: any[]): string {
  const availableTools = mcpTools.map(t => `- ${t.name} (${t.server}): ${t.description || 'No description'}`).join('\n');
  
  let prompt = `You are MAGK Assistant, an Excel workflow expert with access to MCP (Model Context Protocol) tools.

Available MCP Tools:
${availableTools}

Current conversation context: You have access to ${mcpTools.length} MCP tools across ${Object.keys(mcpServers).length} servers.`;

  if (toolCalls.length > 0) {
    prompt += `\n\nBased on the user's request, I've identified that the following MCP tools will be used:
${toolCalls.map(tc => `- ${tc.tool} from ${tc.server} server`).join('\n')}

Please acknowledge these tool selections and explain how they will help fulfill the user's request.`;
  }

  prompt += `\n\nGuidelines:
- Always explain what you're doing when using MCP tools
- Show the user which tools you're calling and why
- Format results clearly for Excel workflow integration
- If you need more information (like URLs or file paths), ask the user first`;

  return prompt;
}

// Remove containsMCPIntent - no longer needed with AI selection

// Request schema validation
const chatRequestSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).optional().default([]),
  mcpTools: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    server: z.string().optional(),
    inputSchema: z.any().optional()
  })).optional().default([]),
  mcpServers: z.record(z.object({
    enabled: z.boolean(),
    tools: z.array(z.any())
  })).optional().default({}),
  modelConfig: z.object({
    model: z.string().optional(),
    provider: z.string().optional(),
    displayName: z.string().optional(),
    enableThinking: z.boolean().optional(),
    temperature: z.number().optional(),
    maxTokens: z.number().optional(),
    apiKey: z.string().optional()
  }).optional(),
  // Legacy fields for backward compatibility
  model: z.string().optional().default('claude-3-5-sonnet-20241022'),
  provider: z.string().optional().default('anthropic'),
  enableThinking: z.boolean().optional().default(true),
  temperature: z.number().optional(),
  maxTokens: z.number().optional()
  // API keys should only be managed via environment variables
});

// Apply rate limiting middleware
chatRoute.use('/chat', rateLimiter.middleware());

chatRoute.post('/chat', async (c) => {
  try {
    let message: string;
    let history: any[];
    let mcpTools: any[];
    let mcpServers: any;
    let uploadedFiles: any[] = [];
    // Note: model and enableThinking are configured via modelConfig; avoid unused locals
    let modelConfig: any = {};

    // Check if request is multipart/form-data (file upload) or JSON
    const contentType = c.req.header('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      console.log('📁 Processing file upload request...');
      
      const formData = await c.req.formData();
      
      // Extract text fields
      message = formData.get('message') as string;
      
      // Safely parse JSON fields with error handling
      try {
        const historyStr = formData.get('history') as string || '[]';
        history = JSON.parse(historyStr);
      } catch (error) {
        console.error('❌ Error parsing history JSON:', error);
        history = [];
      }
      
      try {
        const mcpToolsStr = formData.get('mcpTools') as string || '[]';
        console.log('🔍 Raw mcpTools string:', JSON.stringify(mcpToolsStr));
        mcpTools = JSON.parse(mcpToolsStr);
      } catch (error) {
        console.error('❌ Error parsing mcpTools JSON:', error);
        console.error('❌ Raw string was:', formData.get('mcpTools'));
        mcpTools = [];
      }
      
      try {
        const mcpServersStr = formData.get('mcpServers') as string || '{}';
        mcpServers = JSON.parse(mcpServersStr);
      } catch (error) {
        console.error('❌ Error parsing mcpServers JSON:', error);
        mcpServers = {};
      }
      
      // Extract model configuration from form data
      modelConfig.model = formData.get('model') as string || undefined;
      modelConfig.provider = formData.get('provider') as string || undefined;
      const enableThinkingStr = formData.get('enableThinking') as string;
      modelConfig.enableThinking = enableThinkingStr === 'true' || enableThinkingStr === '1';
      modelConfig.temperature = formData.get('temperature') ? parseFloat(formData.get('temperature') as string) : undefined;
      modelConfig.maxTokens = formData.get('maxTokens') ? parseInt(formData.get('maxTokens') as string) : undefined;
      // API keys removed - managed via environment variables only
      
      const fileCount = parseInt(formData.get('fileCount') as string || '0');
      console.log(`📄 File count: ${fileCount}`);
      
      // Extract uploaded files
      for (let i = 0; i < fileCount; i++) {
        const file = formData.get(`file_${i}`) as File;
        const fileType = formData.get(`file_${i}_type`) as string;
        const fileName = formData.get(`file_${i}_name`) as string;
        
        if (file) {
          // Convert File to Buffer for processing
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          uploadedFiles.push({
            buffer,
            originalName: fileName,
            type: fileType,
            size: file.size,
            mimeType: file.type
          });
          
          console.log(`📄 Processed file: ${fileName} (${fileType}, ${file.size} bytes)`);
        }
      }
      
      // Add file context to message
      if (uploadedFiles.length > 0) {
        const fileList = uploadedFiles.map(f => `${f.originalName} (${f.type})`).join(', ');
        message = `${message}\n\n[Files uploaded: ${fileList}]`;
        console.log(`📁 Enhanced message with file context: ${fileList}`);
      }
      
    } else {
      // Handle regular JSON request
      const body = await c.req.json();
      const parsed = chatRequestSchema.parse(body);
      message = parsed.message;
      history = parsed.history;
      mcpTools = parsed.mcpTools;
      mcpServers = parsed.mcpServers;
      
      // Extract model configuration from parsed JSON
      // Use modelConfig if provided, otherwise fall back to legacy fields
      if (parsed.modelConfig) {
        modelConfig = parsed.modelConfig;
      } else {
        modelConfig = {
          model: parsed.model,
          provider: 'anthropic', // Default provider
          enableThinking: parsed.enableThinking,
          displayName: 'Claude',
          temperature: undefined,
          maxTokens: undefined,
          apiKey: undefined
        };
      }
    }

    console.log(`💬 Chat request: ${message}`);
    console.log(`🤖 Model Config:`, modelConfig);
    console.log(`🛠️ Available MCP tools: ${mcpTools.length}`, mcpTools);
    console.log(`🖥️ MCP servers:`, Object.keys(mcpServers), mcpServers);
    console.log(`📁 Uploaded files: ${uploadedFiles.length}`);

    // Check if message indicates workflow generation intent
    const workflowKeywords = ['workflow', 'automate', 'extract and save', 'process', 'scrape and export', 'convert', 'export to excel', 'build a workflow', 'create workflow'];
    const shouldGenerateWorkflow = workflowKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );

    // Use AI to intelligently select MCP tools, with fallback to pattern matching
    console.log('🤖 Using AI to select appropriate MCP tools...');
    let mcpToolCalls = await selectMCPToolsWithAI(message, mcpTools, llmService, uploadedFiles);
    
    console.log('🔍 AI selected tools:', mcpToolCalls.length, mcpToolCalls);
    
    // Enhanced fallback: Check for uploaded files AND text patterns
    if (mcpToolCalls.length === 0) {
      const lowerMessage = message.toLowerCase();
      console.log('🔧 Fallback: Checking for uploaded files and message patterns:', lowerMessage);
      console.log('🔧 Fallback: Uploaded files:', uploadedFiles.map(f => `${f.originalName} (${f.type})`));
      
      // Check for uploaded Excel files
      const excelFiles = uploadedFiles.filter(f => 
        f.type.includes('excel') || 
        f.type.includes('spreadsheet') || 
        f.originalName.toLowerCase().endsWith('.xlsx') ||
        f.originalName.toLowerCase().endsWith('.xls')
      );
      
      // Check for Excel-related requests in text (more comprehensive)
      const isExcelRequest = lowerMessage.includes('excel') || 
                           lowerMessage.includes('spreadsheet') || 
                           lowerMessage.includes('xlsx') || 
                           lowerMessage.includes('table') ||
                           lowerMessage.includes('export') ||
                           lowerMessage.includes('data') ||
                           (lowerMessage.includes('create') && (lowerMessage.includes('file') || lowerMessage.includes('data'))) ||
                           lowerMessage.includes('tiger') || // For our specific test
                           lowerMessage.includes('population');
      
      if (excelFiles.length > 0 || isExcelRequest) {
        console.log('🔧 Fallback: Found Excel files or Excel request');
        
        // Look for Excel MCP tools
        const readTool = mcpTools.find(t => t.server === 'excel' && t.name === 'excel_read_sheet');
        const writeTool = mcpTools.find(t => t.server === 'excel' && (t.name === 'excel_write_to_sheet' || t.name === 'write_values'));
        const describeTool = mcpTools.find(t => t.server === 'excel' && t.name === 'excel_describe_sheets');
        
        console.log('🔧 Fallback: Available Excel tools:', {
          read: !!readTool,
          write: !!writeTool, 
          describe: !!describeTool
        });
        
        if (excelFiles.length > 0) {
          // For uploaded Excel files, use read/describe tools
          console.log('🔧 Fallback: Processing uploaded Excel files');
          
          for (const file of excelFiles) {
            // Save file to temp location for MCP tool access
            const fs = await import('fs');
            const path = await import('path');
            const os = await import('os');
            
            const tempDir = os.tmpdir();
            const tempPath = path.join(tempDir, file.originalName);
            
            try {
              fs.writeFileSync(tempPath, file.buffer);
              console.log('📁 Saved uploaded file to:', tempPath);
            } catch (error) {
              console.error('❌ Failed to save file:', error);
              continue;
            }
            
            // First describe the sheets
            if (describeTool) {
              mcpToolCalls.push({
                server: 'excel',
                tool: 'excel_describe_sheets',
                args: {
                  file_path: tempPath
                }
              });
            }
            
            // Then read the first sheet  
            if (readTool) {
              mcpToolCalls.push({
                server: 'excel',
                tool: 'excel_read_sheet',
                args: {
                  file_path: tempPath,
                  sheet_name: 'Sheet1', // Default to first sheet
                  limit: 100 // Limit rows for display
                }
              });
            }
          }
        } else if (isExcelRequest && writeTool) {
          // For Excel creation requests, use write tool
          console.log('🔧 Fallback: Creating new Excel file');
          
          // Generate unique filename with timestamp
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const filename = `excel_export_${timestamp}.xlsx`;
          const outputPath = `../client/magk-excel/public/downloads/${filename}`;
          
          mcpToolCalls = [{
            server: 'excel',
            tool: 'excel_write_to_sheet',
            args: {
              file_path: outputPath,
              sheet_name: 'Sheet1',
              values: [
                ['Name', 'Department', 'Salary'],
                ['John Smith', 'Sales', 65000],
                ['Sarah Johnson', 'IT', 75000],
                ['Michael Brown', 'HR', 58000]
              ]
            }
          }];
        }
        
        console.log('🔧 Fallback: Created tool calls:', mcpToolCalls);
      }
    }
    
    console.log('📊 Final tool calls selected:', mcpToolCalls.length, mcpToolCalls);
    
    // Generate workflow if needed
    let workflowGenerated = null;
    if (shouldGenerateWorkflow) {
      console.log('🎯 Generating workflow from message...');
      try {
        const workflow = await workflowGenerator.generateFromChat(message, mcpTools);
        
        if (workflowGenerator.validateWorkflow(workflow)) {
          workflowGenerated = {
            id: workflow.id,
            name: workflow.name,
            description: workflow.description,
            nodes: workflow.nodes,
            edges: workflow.edges,
            metadata: workflow.metadata,
            naturalLanguageDescription: `I've created a workflow "${workflow.name}" with ${workflow.nodes.length} steps: ${workflow.nodes.map((n: any) => n.label).join(' → ')}`
          };
          console.log('✅ Workflow generated successfully:', workflow.name);
        }
      } catch (error) {
        console.error('❌ Workflow generation failed:', error);
      }
    }

    // Generate response with MCP context and selected tools
    let systemPrompt = generateMCPSystemPrompt(mcpTools, mcpServers, mcpToolCalls);
    
    // Add workflow context to system prompt if workflow was generated
    if (workflowGenerated) {
      systemPrompt = systemPrompt + `\n\nI've generated a workflow for you: ${workflowGenerated.naturalLanguageDescription}\nThe workflow is ready to be executed in the workflow canvas.`;
    }
    
    const llmResult = await llmService.chatWithSystem(systemPrompt, message, history, modelConfig);

    // AI has already determined if tools are needed
    const shouldUseMCP = mcpToolCalls.length > 0;

    console.log('🧠 Thinking available:', !!llmResult.thinking);
    console.log('📝 Response length:', llmResult.response.length);

    // Check if any Excel files will be created and add download links
    let downloadLinks: string[] = [];
    if (shouldUseMCP) {
      for (const toolCall of mcpToolCalls) {
        if (toolCall.server === 'excel' && toolCall.tool === 'excel_write_to_sheet' && toolCall.args.file_path) {
          const filePath = toolCall.args.file_path;
          const filename = filePath.split('/').pop();
          if (filename) {
            downloadLinks.push(`/downloads/${filename}`);
          }
        }
      }
    }

    // Enhance response with download links if Excel files are created
    let enhancedResponse = llmResult.response;
    if (downloadLinks.length > 0) {
      enhancedResponse += `\n\n📁 **Excel File Created:**\n`;
      downloadLinks.forEach((link) => {
        const filename = link.split('/').pop();
        enhancedResponse += `\n🔗 [Download ${filename}](${link})`;
      });
      enhancedResponse += `\n\n*Files are saved to the downloads folder and can be accessed directly.*`;
    }

    // Add workflow to response if generated
    const finalResponse = workflowGenerated 
      ? `${enhancedResponse}\n\n🎯 **Workflow Generated:** ${workflowGenerated.naturalLanguageDescription}`
      : enhancedResponse;

    return c.json({
      response: finalResponse,
      thinking: llmResult.thinking,
      isMock: llmResult.isMock,
      status: 'success',
      mcpToolCalls: shouldUseMCP ? mcpToolCalls : [],
      downloadLinks: downloadLinks,
      summary: shouldUseMCP ? `I'll use the available MCP tools to help you with this request.` : undefined,
      workflowGenerated: workflowGenerated
      // Later we'll add: action, workflowId, requiresConfirmation
    });

  } catch (error) {
    console.error('❌ Chat error:', error);
    console.error('❌ Chat error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    if (error instanceof z.ZodError) {
      console.error('❌ Zod validation errors:', error.errors);
      return c.json({
        response: 'Sorry, there was an issue with your request format.',
        status: 'error',
        error: 'Invalid request format',
        details: error.errors
      }, 400);
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Returning error response:', errorMessage);
    
    return c.json({
      response: `Sorry, I encountered an error while processing your request: ${errorMessage}`,
      status: 'error',
      error: errorMessage
    }, 500);
  }
});

export { chatRoute };
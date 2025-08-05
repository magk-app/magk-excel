import { Hono } from 'hono';
import { z } from 'zod';
import { LLMService } from '../services/llm-service.js';
// import { ChatRouter } from '../services/chat-router.js'; // We'll enable this later

const chatRoute = new Hono();
const llmService = new LLMService();
// const chatRouter = new ChatRouter(); // We'll enable this later

// Helper functions for MCP tool analysis
function analyzeMCPToolNeeds(message: string, mcpTools: any[]): any[] {
  const lowerMessage = message.toLowerCase();
  const toolCalls = [];

  // Web scraping patterns
  if (lowerMessage.includes('scrape') || lowerMessage.includes('extract from url') || lowerMessage.includes('web content')) {
    const firecrawlTool = mcpTools.find(t => t.server === 'firecrawl');
    if (firecrawlTool) {
      // Try to extract URL from message
      const urlMatch = message.match(/https?:\/\/[^\s]+/);
      toolCalls.push({
        server: 'firecrawl',
        tool: 'scrape_url',
        args: {
          url: urlMatch ? urlMatch[0] : 'https://example.com',
          formats: ['markdown', 'html']
        }
      });
    }
  }

  // PDF processing patterns
  if (lowerMessage.includes('pdf') || lowerMessage.includes('extract from pdf')) {
    const puppeteerTool = mcpTools.find(t => t.server === 'puppeteer');
    if (puppeteerTool) {
      toolCalls.push({
        server: 'puppeteer',
        tool: 'extract_pdf_text',
        args: {
          url: 'example.pdf' // This would need to be provided by user
        }
      });
    }
  }

  // API call patterns
  if (lowerMessage.includes('api call') || lowerMessage.includes('fetch from') || lowerMessage.includes('http request')) {
    const fetchTool = mcpTools.find(t => t.server === 'fetch');
    if (fetchTool) {
      toolCalls.push({
        server: 'fetch',
        tool: 'fetch',
        args: {
          url: 'https://api.example.com',
          method: 'GET'
        }
      });
    }
  }

  return toolCalls;
}

function generateMCPSystemPrompt(mcpTools: any[], mcpServers: any): string {
  const availableTools = mcpTools.map(t => `- ${t.name} (${t.server}): ${t.description || 'No description'}`).join('\n');
  
  return `You are MAGK Assistant, an Excel workflow expert with access to MCP (Model Context Protocol) tools.

Available MCP Tools:
${availableTools}

When users request data extraction, web scraping, PDF processing, or API calls, you can use these tools.

Guidelines:
- Always explain what you're doing when using MCP tools
- Show the user which tools you're calling and why
- Format results clearly for Excel workflow integration
- If you need more information (like URLs or file paths), ask the user first

Current conversation context: You have access to ${mcpTools.length} MCP tools across ${Object.keys(mcpServers).length} servers.`;
}

function containsMCPIntent(response: string): boolean {
  const mcpKeywords = ['scrape', 'extract', 'fetch', 'api', 'pdf', 'data', 'workflow'];
  return mcpKeywords.some(keyword => response.toLowerCase().includes(keyword));
}

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
  })).optional().default({})
});

chatRoute.post('/chat', async (c) => {
  try {
    const body = await c.req.json();
    const { message, history, mcpTools, mcpServers } = chatRequestSchema.parse(body);

    console.log(`💬 Chat request: ${message}`);
    console.log(`🛠️ Available MCP tools: ${mcpTools.length}`);
    console.log(`🖥️ MCP servers:`, Object.keys(mcpServers));

    // Analyze message for MCP tool requirements
    const mcpToolCalls = analyzeMCPToolNeeds(message, mcpTools);
    
    // Generate response with MCP context
    const systemPrompt = generateMCPSystemPrompt(mcpTools, mcpServers);
    const response = await llmService.chatWithSystem(systemPrompt, message, history);

    // Check if response indicates tool usage should happen
    const shouldUseMCP = mcpToolCalls.length > 0 || containsMCPIntent(response);

    return c.json({
      response,
      status: 'success',
      mcpToolCalls: shouldUseMCP ? mcpToolCalls : [],
      summary: shouldUseMCP ? `I'll use the available MCP tools to help you with this request.` : undefined
      // Later we'll add: action, workflowId, requiresConfirmation
    });

  } catch (error) {
    console.error('❌ Chat error:', error);
    
    if (error instanceof z.ZodError) {
      return c.json({
        response: 'Sorry, there was an issue with your request format.',
        status: 'error',
        error: 'Invalid request format'
      }, 400);
    }

    return c.json({
      response: 'Sorry, I encountered an error while processing your request. Please try again.',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export { chatRoute };
import Anthropic from '@anthropic-ai/sdk';
import { ChatService } from './chat-service.js';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ModelConfig {
  provider: string;
  model: string;
  enableThinking?: boolean;
  temperature?: number;
  maxTokens?: number;
  // API keys should only be managed via environment variables
}

// Note: Model validation handled via ChatService.getValidModel

export class LLMService {
  private anthropic: Anthropic | null = null;
  private defaultProvider: string;
  private defaultModel: string;

  constructor() {
    // Set defaults from environment
    this.defaultProvider = process.env.DEFAULT_AI_PROVIDER || 'anthropic';
    this.defaultModel = process.env.DEFAULT_AI_MODEL || 'claude-3-5-sonnet-20241022';
    
    // Initialize Anthropic if API key is available
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (anthropicKey && anthropicKey !== '' && anthropicKey !== 'your_anthropic_api_key_here') {
      this.anthropic = new Anthropic({
        apiKey: anthropicKey,
      });
    }
  }

  async chat(message: string, history: ChatMessage[] = [], modelConfig?: Partial<ModelConfig>): Promise<string> {
    const result = await this.chatWithSystem(undefined, message, history, modelConfig);
    return result.response;
  }

  async chatWithSystem(
    systemPrompt: string | undefined, 
    message: string, 
    history: ChatMessage[] = [], 
    modelConfig?: Partial<ModelConfig>
  ): Promise<{ response: string, thinking?: string, isMock: boolean }> {
    // Merge with defaults
    const config: ModelConfig = {
      provider: modelConfig?.provider || this.defaultProvider,
      model: modelConfig?.model || this.defaultModel,
      enableThinking: modelConfig?.enableThinking ?? true,
      temperature: modelConfig?.temperature ?? 0.7,
      maxTokens: modelConfig?.maxTokens ?? 4096
    };
    
    // Apply model fallback for unsupported models
    const originalModel = config.model;
    config.model = ChatService.getValidModel(config.model);
    if (originalModel !== config.model) {
      console.log(`📝 Model fallback: ${originalModel} -> ${config.model}`);
    }
    
    // Get MAGK system prompt if not provided
    if (!systemPrompt) {
      systemPrompt = ChatService.getSystemPrompt();
    }
    
    try {
      // Only use environment API key - never accept from frontend
      let apiClient: Anthropic | null = this.anthropic;
      
      if (config.provider === 'anthropic') {
        if (!this.anthropic) {
          // No API key available
          console.log('⚠️ No Anthropic API key configured, using mock response...');
          return { response: this.generateMockWorkflowResponse(message), thinking: undefined, isMock: true };
        }
      } else {
        // Other providers not yet implemented
        console.log(`⚠️ Provider ${config.provider} not yet implemented, using mock response...`);
        return { response: this.generateMockWorkflowResponse(message), thinking: undefined, isMock: true };
      }

      if (!apiClient) {
        console.log('⚠️ No API client available, using mock response...');
        return { response: this.generateMockWorkflowResponse(message), thinking: undefined, isMock: true };
      }

      console.log(`🤖 Sending request to ${config.provider} (${config.model})...`);
      console.log(`🧠 Thinking mode: ${config.enableThinking ? 'enabled' : 'disabled'}`);

      // Use thinking model variant if enabled
      let actualModel = config.model;
      if (config.enableThinking && config.provider === 'anthropic') {
        // Map to thinking variants for Claude models
        const thinkingModels: Record<string, string> = {
          // Claude 4 models already support thinking natively
          'claude-opus-4-1-20250805': 'claude-opus-4-1-20250805',
          'claude-opus-4-20250514': 'claude-opus-4-20250514',
          'claude-sonnet-4-20250514': 'claude-sonnet-4-20250514',
          'claude-3-7-sonnet-20250219': 'claude-3-7-sonnet-20250219',
          
          // Claude 3.5 models need v2:0 suffix for thinking
          'claude-3-5-sonnet-20241022': 'claude-3-5-sonnet-20241022-v2:0',
          'claude-3-5-sonnet-latest': 'claude-3-5-sonnet-20241022-v2:0',
          'claude-3-opus-20240229': 'claude-3-opus-20240229-v2:0'
        };
        
        if (thinkingModels[config.model]) {
          actualModel = thinkingModels[config.model];
          console.log(`🧠 Using thinking variant: ${actualModel}`);
        }
      }

      // Convert history to Anthropic format
      const messages: Anthropic.Messages.MessageParam[] = [
        ...history.map(msg => ({
          role: msg.role,
          content: msg.content
        } as Anthropic.Messages.MessageParam)),
        {
          role: 'user' as const,
          content: message
        }
      ];

      const defaultSystemPrompt = systemPrompt || `You are MAGK (Multi-Agent Generative Kit), an advanced AI assistant specializing in data processing, Excel automation, and intelligent workflow creation.

IMPORTANT RULES:
- DO NOT ask unnecessary clarifying questions if the request is clear
- When users provide explicit instructions (like "output 10 rows"), follow them exactly
- Only ask questions when there are genuine ambiguities or missing required information
- Be direct and action-oriented - assume reasonable defaults when possible
- If the user uploads Excel files, focus on processing them immediately
- ALWAYS format your responses using Markdown for better readability
- Use **bold** for emphasis, \`code\` for technical terms, and proper headings
- When creating tables, use markdown table syntax
- When mentioning files, format them as links or use backticks

You help users:
- Extract data from websites, PDFs, APIs, and other sources
- Create automated workflows for repetitive data tasks  
- Export results to Excel with custom formatting
- Build data processing pipelines
- Process uploaded Excel files immediately without asking for details

${config.enableThinking ? `

When thinking through complex requests, use <thinking> tags to reason through your approach:

<thinking>
Let me analyze what the user is asking for...
- Consider the data sources they mention
- Think about the best workflow approach
- Consider any potential challenges
- Plan the steps needed
</thinking>

Then provide your helpful response.` : ''}

Be conversational and helpful, but prioritize action over questions. If the user uploads an Excel file, immediately show them what's in it and what you can do with it.`;

      const response = await apiClient.messages.create({
        model: actualModel,
        max_tokens: config.maxTokens || 4096,
        temperature: config.temperature || 0.7,
        system: systemPrompt || defaultSystemPrompt,
        messages: messages
      });

      let responseText = '';
      let thinking = '';

      if (response.content[0]?.type === 'text') {
        const fullText = response.content[0].text;
        
        // Extract thinking content if present
        const thinkingMatch = fullText.match(/<thinking>(.*?)<\/thinking>/s);
        if (thinkingMatch && config.enableThinking) {
          thinking = thinkingMatch[1].trim();
          responseText = fullText.replace(/<thinking>.*?<\/thinking>/s, '').trim();
          console.log('🧠 Thinking extracted:', thinking.substring(0, 100) + '...');
        } else {
          responseText = fullText;
        }
      } else {
        responseText = 'Sorry, I had trouble generating a response.';
      }

      console.log('✅ Claude response received');
      console.log('📝 Response length:', responseText.length);
      console.log('🧠 Thinking length:', thinking.length);
      
      return { response: responseText, thinking: thinking || undefined, isMock: false };

    } catch (error) {
      console.error('❌ LLM Service error:', error);
      console.error('❌ Error details:', {
        provider: config.provider,
        model: config.model,
        hasEnvKey: !!process.env.ANTHROPIC_API_KEY
      });
      
      if (error instanceof Error) {
        if (error.message.includes('api_key')) {
          return { response: 'I\'m having trouble connecting to my AI service. Please check that the API key is configured correctly.', thinking: undefined, isMock: false };
        }
        // Return more specific error message
        return { response: `Error: ${error.message}. Please try again or check your configuration.`, thinking: undefined, isMock: false };
      }
      
      // Consistent error response format
      return { 
        response: 'Sorry, I encountered an error while processing your request. Please try again.',
        thinking: undefined,
        isMock: false
      };
    }
  }

  // Backwards compatibility method
  async chatWithSystemOld(systemPrompt: string | undefined, message: string, history: ChatMessage[] = []): Promise<string> {
    const result = await this.chatWithSystem(systemPrompt, message, history, { enableThinking: false });
    return result.response;
  }

  private generateMockWorkflowResponse(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    // Generate contextual mock responses based on the user's request
    if (lowerMessage.includes('random') || lowerMessage.includes('number')) {
      return `I'll help you create a workflow to generate random numbers! Here's what I can build for you:

**Random Number Generator Workflow:**

1. **Input Configuration**
   - Specify range (min/max values)
   - Choose quantity of numbers to generate
   - Select distribution type (uniform, normal, etc.)

2. **Processing Steps**
   - Generate random numbers using your specified parameters
   - Apply any formatting or rounding rules
   - Add optional seed for reproducible results

3. **Excel Export**
   - Create formatted Excel spreadsheet
   - Include headers and metadata
   - Add charts/visualizations if needed

Would you like me to create this workflow for you? I can customize it based on:
- What range of numbers do you need?
- How many numbers should I generate?
- Do you need them in any specific format?

Just let me know your preferences and I'll build the complete automation!`;
    }
    
    if (lowerMessage.includes('excel') || lowerMessage.includes('spreadsheet')) {
      return `I can help you create Excel automation workflows! Here are some popular options:

**Excel Workflow Options:**
1. **Data Import & Processing** - Extract data from websites, APIs, or files
2. **Report Generation** - Create formatted reports with charts and pivot tables  
3. **Data Transformation** - Clean, merge, and restructure data
4. **Automated Calculations** - Build complex formulas and calculations

What type of Excel workflow would you like to create? For example:
- "Import sales data from a website and create monthly reports"
- "Process customer data and generate invoices"
- "Extract financial data and create dashboard"

Tell me more about your specific needs and I'll design the perfect workflow for you!`;
    }
    
    if (lowerMessage.includes('website') || lowerMessage.includes('scrape') || lowerMessage.includes('web')) {
      return `Perfect! I can create a web scraping workflow for you. Here's what I can build:

**Web Data Extraction Workflow:**

1. **Website Analysis**
   - Identify target websites and data sources
   - Handle authentication if needed
   - Respect robots.txt and rate limits

2. **Data Extraction**
   - Scrape specific data fields (prices, text, images, etc.)
   - Handle dynamic content and JavaScript
   - Process multiple pages automatically

3. **Data Processing**
   - Clean and validate extracted data
   - Apply filters and transformations
   - Handle errors and missing data

4. **Excel Export**
   - Organize data in structured spreadsheet
   - Add timestamps and source tracking
   - Create summary reports and charts

Which websites would you like to extract data from? What specific information are you looking for?`;
    }
    
    // Default response for general requests
    return `Hi! I'm your MAGK Excel workflow assistant. I can help you create automated workflows for:

**🔄 Data Processing Workflows:**
- Extract data from websites, APIs, PDFs, and databases
- Clean and transform data automatically  
- Generate Excel reports with custom formatting
- Create automated data pipelines

**🎯 Popular Workflow Types:**
1. **Web Scraping** → Extract data from websites to Excel
2. **API Integration** → Pull data from services and APIs
3. **PDF Processing** → Extract tables and text from PDFs
4. **Report Generation** → Create formatted Excel reports
5. **Data Transformation** → Clean and restructure data

What type of workflow would you like to create? Just describe what data you want to work with and where it comes from, and I'll build the automation for you!

Example: "Extract product prices from Amazon and create a comparison spreadsheet"`;
  }
}
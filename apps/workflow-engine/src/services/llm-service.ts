import Anthropic from '@anthropic-ai/sdk';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export class LLMService {
  private anthropic: Anthropic;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }
    
    this.anthropic = new Anthropic({
      apiKey: apiKey,
    });
  }

  async chat(message: string, history: ChatMessage[] = []): Promise<string> {
    return this.chatWithSystem(undefined, message, history);
  }

  async chatWithSystem(systemPrompt: string | undefined, message: string, history: ChatMessage[] = []): Promise<string> {
    try {
      console.log('🤖 Sending request to Claude...');

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

      const defaultSystemPrompt = `You are MAGK Excel Assistant, an expert at helping users create Excel workflows for data extraction, transformation, and export.

You help users:
- Extract data from websites, PDFs, APIs, and other sources
- Create automated workflows for repetitive data tasks  
- Export results to Excel with custom formatting
- Build data processing pipelines

Be conversational, helpful, and focus on understanding what data they want to work with and where it comes from. Ask clarifying questions when needed.`;

      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        system: systemPrompt || defaultSystemPrompt,
        messages: messages
      });

      const responseText = response.content[0]?.type === 'text' 
        ? response.content[0].text 
        : 'Sorry, I had trouble generating a response.';

      console.log('✅ Claude response received');
      return responseText;

    } catch (error) {
      console.error('❌ LLM Service error:', error);
      
      if (error instanceof Error && error.message.includes('api_key')) {
        return 'I\'m having trouble connecting to my AI service. Please check that the API key is configured correctly.';
      }
      
      return 'Sorry, I encountered an error while processing your request. Please try again.';
    }
  }
}
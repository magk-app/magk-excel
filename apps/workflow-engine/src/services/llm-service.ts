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

  async chatWithSystem(systemPrompt: string | undefined, message: string, history: ChatMessage[] = [], enableThinking: boolean = true): Promise<{ response: string, thinking?: string }> {
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

${enableThinking ? `

When thinking through complex requests, use <thinking> tags to reason through your approach:

<thinking>
Let me analyze what the user is asking for...
- Consider the data sources they mention
- Think about the best workflow approach
- Consider any potential challenges
- Plan the steps needed
</thinking>

Then provide your helpful response.` : ''}

Be conversational, helpful, and focus on understanding what data they want to work with and where it comes from. Ask clarifying questions when needed.`;

      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000, // Increased for thinking mode
        system: systemPrompt || defaultSystemPrompt,
        messages: messages
      });

      let responseText = '';
      let thinking = '';

      if (response.content[0]?.type === 'text') {
        const fullText = response.content[0].text;
        
        // Extract thinking content if present
        const thinkingMatch = fullText.match(/<thinking>(.*?)<\/thinking>/s);
        if (thinkingMatch && enableThinking) {
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
      
      return { response: responseText, thinking: thinking || undefined };

    } catch (error) {
      console.error('❌ LLM Service error:', error);
      
      if (error instanceof Error && error.message.includes('api_key')) {
        return { response: 'I\'m having trouble connecting to my AI service. Please check that the API key is configured correctly.' };
      }
      
      return { response: 'Sorry, I encountered an error while processing your request. Please try again.' };
    }
  }

  // Backwards compatibility method
  async chatWithSystemOld(systemPrompt: string | undefined, message: string, history: ChatMessage[] = []): Promise<string> {
    const result = await this.chatWithSystem(systemPrompt, message, history, false);
    return result.response;
  }
}
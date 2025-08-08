/**
 * Chat Service with MAGK System Prompt Integration
 */

import { getSystemPrompt, MAGK_SYSTEM_PROMPT } from '../utils/systemPrompt';

// Map of unsupported models to valid fallbacks (empty now - Claude 4 is supported)
export const MODEL_FALLBACK_MAP: Record<string, string> = {
  // Legacy aliases can still map to actual model names
  'claude-opus-4-1': 'claude-opus-4-1-20250805',
  'claude-opus-4-0': 'claude-opus-4-20250514',
  'claude-sonnet-4-0': 'claude-sonnet-4-20250514',
  'claude-sonnet-3-7': 'claude-3-7-sonnet-20250219',
};

// Valid models list - including Claude 4 models
export const VALID_MODELS = [
  // Claude 4 models (latest)
  'claude-opus-4-1-20250805',
  'claude-opus-4-20250514',
  'claude-sonnet-4-20250514',
  'claude-3-7-sonnet-20250219',
  
  // Claude 3.5 models (current)
  'claude-3-5-sonnet-20241022',
  'claude-3-5-sonnet-latest',
  'claude-3-5-haiku-20241022',
  
  // Claude 3 models (legacy)
  'claude-3-opus-20240229',
  'claude-3-sonnet-20240229'
];

export interface ChatConfig {
  model: string;
  provider: string;
  enableThinking?: boolean;
  temperature?: number;
  maxTokens?: number;
  enabledTools?: string[];
}

export class ChatService {
  /**
   * Get the appropriate model to use
   */
  static getValidModel(requestedModel: string): string {
    // Check if the model is valid
    if (VALID_MODELS.includes(requestedModel)) {
      return requestedModel;
    }
    
    // Check for a fallback
    const fallback = MODEL_FALLBACK_MAP[requestedModel];
    if (fallback) {
      console.log(`📝 Model fallback: ${requestedModel} -> ${fallback}`);
      return fallback;
    }
    
    // Default to Claude 3.5 Sonnet
    console.log(`⚠️ Unknown model ${requestedModel}, using default`);
    return 'claude-3-5-sonnet-20241022';
  }
  
  /**
   * Get the system prompt for the chat
   */
  static getSystemPrompt(config?: {
    enabledTools?: string[];
    sessionFiles?: string[];
  }): string {
    return getSystemPrompt({
      currentDate: new Date(),
      enabledTools: config?.enabledTools,
      sessionFiles: config?.sessionFiles
    });
  }
  
  /**
   * Format messages with MAGK identity
   */
  static formatMessage(content: string): string {
    // Ensure MAGK identity in responses
    if (content.includes('Claude') || content.includes('Anthropic')) {
      content = content
        .replace(/Claude/g, 'MAGK')
        .replace(/Anthropic/g, 'MAGK Organization')
        .replace(/I am Claude/gi, 'I am MAGK')
        .replace(/I'm Claude/gi, "I'm MAGK");
    }
    return content;
  }
  
  /**
   * Validate date for document processing
   */
  static isValidDocumentDate(date: Date | string): boolean {
    // Always accept any valid date, including future dates
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return !isNaN(dateObj.getTime());
  }
}

export default ChatService;
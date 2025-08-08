/**
 * Type definitions for Claude API integration
 */

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string | ClaudeContent[];
}

export type ClaudeContent = 
  | { type: 'text'; text: string }
  | { type: 'image'; source: ClaudeImageSource }
  | { type: 'document'; source: ClaudeDocumentSource };

export interface ClaudeImageSource {
  type: 'base64';
  media_type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
  data: string;
}

export interface ClaudeDocumentSource {
  type: 'file';
  file_id: string;
}

export interface ClaudeApiRequest {
  model: string;
  max_tokens: number;
  messages: ClaudeMessage[];
  temperature?: number;
  system?: string;
  stream?: boolean;
}

export interface ClaudeApiResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: Array<{
    type: 'text';
    text: string;
  }>;
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface ClaudeStreamChunk {
  type: 'message_start' | 'content_block_start' | 'content_block_delta' | 'content_block_stop' | 'message_delta' | 'message_stop';
  message?: Partial<ClaudeApiResponse>;
  content_block?: {
    type: 'text';
    text?: string;
  };
  delta?: {
    text?: string;
    stop_reason?: string;
  };
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
}

// Extended message type for internal use
export interface EnhancedMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  isComplete?: boolean;
  isStreaming?: boolean;
  isThinking?: boolean;
  thinking?: {
    content: string;
    tokenCount: number;
    isStreaming: boolean;
    isComplete: boolean;
  };
  thinkingHistory?: Array<{
    content: string;
    tokenCount: number;
    timestamp: number;
  }>;
  toolCalls?: any[];
  attachments?: {
    type: 'image' | 'document';
    name: string;
    size: number;
    fileId?: string;
  }[];
  timestamp?: number;
}
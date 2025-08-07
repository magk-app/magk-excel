import React, { memo } from 'react';
import { FileAttachment } from '../hooks/useFileUpload';
import { ChatMessage } from '../services/chatHistoryService';
import { MessageRenderer } from './MessageRenderer';
import { ThinkingIndicator } from './ThinkingIndicator';

interface ChatMessageListProps {
  adapter: any;
  messages: ChatMessage[];
  nluxKey: number;
  attachments: FileAttachment[];
}

export const ChatMessageList = memo(function ChatMessageList({
  adapter,
  messages = [],
  nluxKey,
  attachments = []
}: ChatMessageListProps) {
  // Debug: Log whenever messages change
  React.useEffect(() => {
    console.log('🔄 ChatMessageList - Messages updated:', {
      count: messages.length,
      messages: messages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content?.substring(0, 30) + '...'
      }))
    });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <div className="text-center max-w-md">
            <h3 className="text-xl font-medium mb-4">Welcome to MAGK Excel! ✨</h3>
            <p className="text-sm mb-4">
              I'm your AI assistant for Excel automation, PDF extraction, and web scraping.
            </p>
            <div className="text-sm text-left space-y-2 mb-4">
              <p><strong>💡 Try asking me:</strong></p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>"Create an Excel file with sample sales data"</li>
                <li>"Extract data from a PDF balance sheet"</li>
                <li>"Scrape product information from a website"</li>
              </ul>
            </div>
            {attachments.length > 0 && (
              <div className="mt-4 p-2 bg-muted rounded-md">
                <p className="text-sm font-medium">Files ready to process:</p>
                <p className="text-xs">{attachments.map(a => a.file.name).join(', ')}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4 pb-4">
          {messages.map((message, index) => (
            <div
              key={`${nluxKey}-${message.id}-${index}`}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-4 py-3 shadow-sm transition-all duration-200 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white ml-12'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mr-12'
                }`}
              >
                {/* Show thinking indicator for assistant messages in thinking state */}
                {message.role === 'assistant' && message.isThinking && (
                  <ThinkingIndicator 
                    isVisible={true} 
                    allowInteraction={true}
                    thoughts={message.thoughts || []}
                  />
                )}
                
                {/* Render message content with rich formatting */}
                {!message.isThinking && (
                  <MessageRenderer
                    content={message.content}
                    isThinking={message.isThinking}
                    isStreaming={message.isStreaming}
                    isError={message.isError}
                    role={message.role}
                    mcpToolCalls={message.mcpToolCalls}
                  />
                )}
                <div className={`text-xs mt-2 opacity-70 ${
                  message.role === 'user' ? 'text-right' : 'text-left'
                }`}>
                  {message.timestamp ? new Date(message.timestamp).toLocaleTimeString() : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
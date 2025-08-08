import React, { memo, useState } from 'react';
import { Button } from './ui/button';
import { Send, Paperclip, X } from 'lucide-react';
import { FileAttachment } from '../hooks/useFileUpload';
import { FileUploadArea } from './FileUploadArea';

interface ChatInputAreaProps {
  attachments: FileAttachment[];
  onAttachmentsChange: (attachments: FileAttachment[] | File[]) => void;
  onSendMessage?: (message: string) => void;
  maxFiles?: number;
  maxFileSize?: number;
  disabled?: boolean;
  useDirectClaudeApi?: boolean;
  onDirectClaudeApiChange?: (enabled: boolean) => void;
  onFileUploadProgress?: (fileId: string, progress: any) => void;
}

export const ChatInputArea = memo(function ChatInputArea({
  attachments,
  onAttachmentsChange,
  onSendMessage,
  maxFiles = 5,
  maxFileSize = 50 * 1024 * 1024,
  disabled = false,
  useDirectClaudeApi = false,
  onDirectClaudeApiChange,
  onFileUploadProgress
}: ChatInputAreaProps) {
  const [message, setMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    onAttachmentsChange(files);
  };

  const handleSend = () => {
    if (message.trim() && onSendMessage) {
      console.log('📤 Sending message:', message.trim());
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const removeAttachment = (index: number) => {
    const newAttachments = attachments.filter((_, i) => i !== index);
    // Pass the FileAttachment array to maintain IDs
    onAttachmentsChange(newAttachments);
  };

  return (
    <div className="border-t bg-background">
      {/* File Upload Area - Integrated */}
      <FileUploadArea
        attachments={attachments}
        onAttachmentsChange={onAttachmentsChange}
        maxFiles={maxFiles}
        maxFileSize={maxFileSize}
        useDirectClaudeApi={useDirectClaudeApi}
        onDirectClaudeApiChange={onDirectClaudeApiChange}
        onFileUploadProgress={onFileUploadProgress}
      />
      
      {/* Message Input Area */}
      <div className="p-4">
        <div className="flex gap-2">
          {/* Text Input */}
          <div className="flex-1">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask me to create Excel files, extract data from PDFs, or scrape websites..."
              className="w-full min-h-[40px] max-h-32 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={disabled}
              rows={1}
            />
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={disabled || !message.trim()}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
});
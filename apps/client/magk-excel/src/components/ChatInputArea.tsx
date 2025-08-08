import React, { memo, useState } from 'react';
import { Button } from './ui/button';
import { Send, Paperclip, X } from 'lucide-react';
import { FileAttachment } from '../hooks/useFileUpload';

interface ChatInputAreaProps {
  attachments: FileAttachment[];
  onAttachmentsChange: (attachments: FileAttachment[] | File[]) => void;
  onSendMessage?: (message: string) => void;
  maxFiles?: number;
  maxFileSize?: number;
  disabled?: boolean;
}

export const ChatInputArea = memo(function ChatInputArea({
  attachments,
  onAttachmentsChange,
  onSendMessage,
  maxFiles = 5,
  maxFileSize = 50 * 1024 * 1024,
  disabled = false
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
    <div className="border-t p-4 bg-background">
      {/* Attachments Display */}
      {attachments.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachments.map((attachment, index) => (
            <div
              key={attachment.id}
              className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-sm"
            >
              <Paperclip className="h-3 w-3" />
              <span className="truncate max-w-32">{attachment.name || attachment.file?.name || 'Unknown file'}</span>
              <Button
                size="sm"
                variant="ghost"
                className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => removeAttachment(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="flex gap-2">
        {/* File Upload Button */}
        <div className="relative">
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
            accept=".xlsx,.xls,.pdf,.csv,.txt"
            disabled={attachments.length >= maxFiles}
          />
          <label htmlFor="file-upload">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled || attachments.length >= maxFiles}
              className="cursor-pointer"
              asChild
            >
              <div>
                <Paperclip className="h-4 w-4" />
              </div>
            </Button>
          </label>
        </div>

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
  );
});
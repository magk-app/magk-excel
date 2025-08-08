import React, { memo, useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface ThinkingTokensDisplayProps {
  thinking?: {
    content: string;
    tokenCount?: number;
    isStreaming?: boolean;
    isComplete?: boolean;
  };
  thinkingHistory?: {
    content: string;
    tokenCount?: number;
    timestamp: number;
  }[];
  isVisible: boolean;
  allowToggle?: boolean;
}

interface StreamingDotProps {
  delay?: number;
}

const StreamingDot = memo(({ delay = 0 }: StreamingDotProps) => (
  <div 
    className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"
    style={{ animationDelay: `${delay}s` }}
  />
));

StreamingDot.displayName = 'StreamingDot';

const ThinkingContent = memo(({ content, tokenCount, isStreaming = false }: {
  content: string;
  tokenCount?: number;
  isStreaming?: boolean;
}) => {
  const [displayContent, setDisplayContent] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (isStreaming && content && currentIndex < content.length) {
      const timer = setTimeout(() => {
        setDisplayContent(content.slice(0, currentIndex + 1));
        setCurrentIndex(prev => prev + 1);
      }, 8); // Very fast streaming for thinking tokens to feel responsive

      return () => clearTimeout(timer);
    } else if (!isStreaming) {
      setDisplayContent(content);
      setCurrentIndex(content.length);
    }
  }, [content, isStreaming, currentIndex]);
  
  // Reset when content changes significantly (new thinking block)
  useEffect(() => {
    if (content !== displayContent && !isStreaming) {
      setDisplayContent(content);
      setCurrentIndex(content.length);
    }
  }, [content, displayContent, isStreaming]);

  return (
    <div className="relative">
      <pre className="text-xs text-gray-700 dark:text-gray-300 font-mono whitespace-pre-wrap break-words leading-relaxed bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
        {displayContent}
        {isStreaming && (
          <span className="inline-block w-2 h-4 bg-amber-500 animate-pulse ml-1 align-middle"></span>
        )}
      </pre>
      
      {tokenCount && (
        <div className="flex justify-end mt-2">
          <Badge variant="secondary" className="text-xs">
            {tokenCount.toLocaleString()} thinking tokens
          </Badge>
        </div>
      )}
    </div>
  );
});

ThinkingContent.displayName = 'ThinkingContent';

const ThinkingHistoryItem = memo(({ item, index }: {
  item: { content: string; tokenCount?: number; timestamp: number };
  index: number;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const preview = item.content.slice(0, 100);
  const hasMore = item.content.length > 100;

  return (
    <div className="border-l-2 border-amber-200 dark:border-amber-800 pl-3 py-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Step {index + 1} - {new Date(item.timestamp).toLocaleTimeString()}
        </span>
        {item.tokenCount && (
          <Badge variant="outline" className="text-xs">
            {item.tokenCount.toLocaleString()}
          </Badge>
        )}
      </div>
      
      <div className="text-xs text-gray-600 dark:text-gray-400 font-mono bg-gray-50 dark:bg-gray-800 p-2 rounded border">
        <div className="whitespace-pre-wrap break-words">
          {isExpanded ? item.content : preview}
          {hasMore && !isExpanded && <span className="text-amber-600">...</span>}
        </div>
        
        {hasMore && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 text-xs text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200 underline"
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>
    </div>
  );
});

ThinkingHistoryItem.displayName = 'ThinkingHistoryItem';

export const ThinkingTokensDisplay = memo(({
  thinking,
  thinkingHistory = [],
  isVisible,
  allowToggle = true
}: ThinkingTokensDisplayProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  if (!isVisible || (!thinking && thinkingHistory.length === 0)) {
    return null;
  }

  const hasActiveThinking = thinking && (thinking.isStreaming || thinking.content);
  const totalTokens = (thinking?.tokenCount || 0) + 
    thinkingHistory.reduce((sum, item) => sum + (item.tokenCount || 0), 0);

  return (
    <Card className="mb-4 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/10 dark:to-yellow-900/10 border border-amber-200 dark:border-amber-700 rounded-xl shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-amber-200 dark:border-amber-700">
        <div className="flex items-center space-x-3">
          {hasActiveThinking && thinking?.isStreaming ? (
            <div className="flex space-x-1">
              <StreamingDot delay={0} />
              <StreamingDot delay={0.1} />
              <StreamingDot delay={0.2} />
            </div>
          ) : (
            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-amber-900 dark:text-amber-100">
              {hasActiveThinking && thinking?.isStreaming ? 'Claude is thinking...' : 'Thinking Process'}
            </span>
            
            {totalTokens > 0 && (
              <Badge variant="secondary" className="bg-amber-100 dark:bg-amber-800 text-amber-800 dark:text-amber-200">
                {totalTokens.toLocaleString()} tokens
              </Badge>
            )}
          </div>
        </div>

        {allowToggle && (
          <div className="flex items-center space-x-2">
            {thinkingHistory.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
                className="text-xs text-amber-700 dark:text-amber-300 h-6"
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                History ({thinkingHistory.length})
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-xs text-amber-700 dark:text-amber-300 h-6"
            >
              <svg 
                className={`w-3 h-3 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="p-3">
          {/* Current Thinking */}
          {hasActiveThinking && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  Current Thoughts:
                </h4>
                {thinking?.isStreaming && (
                  <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 dark:border-amber-600 dark:text-amber-300">
                    Streaming
                  </Badge>
                )}
              </div>
              
              <ThinkingContent
                content={thinking.content}
                tokenCount={thinking.tokenCount}
                isStreaming={thinking.isStreaming}
              />
            </div>
          )}

          {/* Thinking History */}
          {showHistory && thinkingHistory.length > 0 && (
            <div className="border-t border-amber-200 dark:border-amber-700 pt-4">
              <h4 className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-3">
                Thinking History:
              </h4>
              
              <div className="max-h-64 overflow-y-auto space-y-3">
                {thinkingHistory.map((item, index) => (
                  <ThinkingHistoryItem key={index} item={item} index={index} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
});

ThinkingTokensDisplay.displayName = 'ThinkingTokensDisplay';
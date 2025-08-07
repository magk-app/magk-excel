import React, { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import 'highlight.js/styles/github-dark.css';
import { ToolCallDisplay } from './ToolCallDisplay';

interface MessageRendererProps {
  content: string;
  isThinking?: boolean;
  isStreaming?: boolean;
  isError?: boolean;
  role: 'user' | 'assistant';
  mcpToolCalls?: Array<{
    server: string;
    tool: string;
    args?: any;
    result?: any;
    status?: 'pending' | 'running' | 'completed' | 'error';
    duration?: number;
  }>;
}

interface ThinkingIndicatorProps {
  isVisible: boolean;
}

const ThinkingIndicator = memo(({ isVisible }: ThinkingIndicatorProps) => {
  if (!isVisible) return null;

  return (
    <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 py-3">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
      <span className="text-sm font-medium">Thinking...</span>
    </div>
  );
});

const StreamingIndicator = memo(() => (
  <span className="inline-block w-2 h-5 bg-blue-500 animate-pulse ml-1"></span>
));

const getFileIcon = (href: string) => {
  const lowerHref = href.toLowerCase();
  
  if (lowerHref.endsWith('.pdf')) {
    return (
      <svg className="w-4 h-4 mr-2 text-red-500" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18.5,9H13V3.5L18.5,9M6,20V4H11V10H18V20H6Z" />
        <path d="M10,14V16H14V14H10Z" />
      </svg>
    );
  } else if (lowerHref.endsWith('.xlsx') || lowerHref.endsWith('.xls') || lowerHref.endsWith('.csv')) {
    return (
      <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18.5,9H13V3.5L18.5,9M6,20V4H11V10H18V20H6M8,12H16V14H8V12M8,16H16V18H8V16Z" />
      </svg>
    );
  } else if (lowerHref.endsWith('.png') || lowerHref.endsWith('.jpg') || lowerHref.endsWith('.jpeg') || lowerHref.endsWith('.gif') || lowerHref.endsWith('.svg')) {
    return (
      <svg className="w-4 h-4 mr-2 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
        <path d="M8.5,13.5L11,16.5L14.5,12L19,18H5M21,19V5C21,3.89 20.1,3 19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19Z" />
      </svg>
    );
  } else if (lowerHref.endsWith('.doc') || lowerHref.endsWith('.docx')) {
    return (
      <svg className="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18.5,9H13V3.5L18.5,9M6,20V4H11V10H18V20H6M8,12H16V14H8V12M8,16H13V18H8V16Z" />
      </svg>
    );
  } else {
    return (
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  }
};

const getFileLabel = (href: string) => {
  const filename = href.split('/').pop() || href;
  const lowerHref = href.toLowerCase();
  
  if (lowerHref.endsWith('.pdf')) return `PDF: ${filename}`;
  if (lowerHref.endsWith('.xlsx') || lowerHref.endsWith('.xls')) return `Excel: ${filename}`;
  if (lowerHref.endsWith('.csv')) return `CSV: ${filename}`;
  if (lowerHref.endsWith('.png') || lowerHref.endsWith('.jpg') || lowerHref.endsWith('.jpeg')) return `Image: ${filename}`;
  if (lowerHref.endsWith('.doc') || lowerHref.endsWith('.docx')) return `Document: ${filename}`;
  
  return filename;
};

const DownloadLink = memo(({ href, children }: { href: string, children: React.ReactNode }) => (
  <div className="my-2">
    <a
      href={href}
      className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 transition-all duration-200 shadow-sm hover:shadow-md border border-blue-200 dark:border-blue-800"
      target="_blank"
      rel="noopener noreferrer"
      download
    >
      {getFileIcon(href)}
      <span className="font-medium">{getFileLabel(href)}</span>
    </a>
  </div>
));

const ToolCallIndicator = memo(({ toolName }: { toolName: string }) => (
  <div className="inline-flex items-center px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-md text-xs font-medium mb-2">
    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
    {toolName}
  </div>
));

const MessageRenderer = memo(({ content, isThinking, isStreaming, isError, role, mcpToolCalls }: MessageRendererProps) => {
  // Show thinking indicator for assistant messages
  if (isThinking && role === 'assistant') {
    return <ThinkingIndicator isVisible={true} />;
  }

  // Handle error states
  if (isError) {
    return (
      <div className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
        <div className="flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          Error
        </div>
        <p className="mt-1">{content}</p>
      </div>
    );
  }

  // Enhanced content processing for tool calls and downloads
  const processContent = (text: string) => {
    // Detect tool calls (e.g., "🛠️ Using Excel Tool")
    const toolCallRegex = /🛠️\s*Using\s+([^:]+)/gi;
    
    return text.replace(toolCallRegex, (match, toolName) => 
      `<div class="tool-call-indicator">${toolName.trim()}</div>${match}`
    );
  };

  const processedContent = processContent(content);

  return (
    <div className={`message-content ${role === 'user' ? 'user-message' : 'assistant-message'}`}>
      {/* Display tool calls if present */}
      {mcpToolCalls && mcpToolCalls.length > 0 && (
        <div className="mb-3">
          {mcpToolCalls.map((toolCall, index) => (
            <ToolCallDisplay
              key={`${toolCall.server}-${toolCall.tool}-${index}`}
              toolName={toolCall.tool}
              server={toolCall.server}
              args={toolCall.args}
              result={toolCall.result}
              status={toolCall.status}
              duration={toolCall.duration}
            />
          ))}
        </div>
      )}
      
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={{
          // Enhanced code block rendering
          code({ node, className, children, ...props }) {
            const inline = !(props as any).inline;
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            
            if (!inline) {
              return (
                <div className="relative">
                  <div className="flex items-center justify-between bg-gray-800 text-gray-200 px-4 py-2 rounded-t-lg text-sm">
                    <span>{language || 'code'}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(String(children).replace(/\n$/, ''))}
                      className="text-gray-400 hover:text-gray-200 transition-colors"
                      title="Copy to clipboard"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-b-lg overflow-x-auto">
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                </div>
              );
            }
            
            return (
              <code className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-1 py-0.5 rounded text-sm" {...props}>
                {children}
              </code>
            );
          },
          
          // Enhanced link rendering with automatic file detection
          a({ href, children, ...props }) {
            if (!href) return <a {...props}>{children}</a>;
            
            // Check if it's a file link by extension
            const fileExtensions = ['.pdf', '.xlsx', '.xls', '.csv', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.zip', '.rar', '.txt', '.json', '.xml'];
            const isFileLink = fileExtensions.some(ext => href.toLowerCase().endsWith(ext)) || href.includes('download');
            const isExternal = href.startsWith('http') && !href.includes(window.location.hostname);
            
            if (isFileLink) {
              return <DownloadLink href={href}>{children}</DownloadLink>;
            }
            
            return (
              <a
                href={href}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 underline decoration-dotted underline-offset-2 transition-colors duration-200"
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                {...props}
              >
                {children}
                {isExternal && (
                  <svg className="inline w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                )}
              </a>
            );
          },
          
          // Enhanced table rendering with modern design
          table({ children, ...props }) {
            return (
              <div className="overflow-x-auto my-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" {...props}>
                  {children}
                </table>
              </div>
            );
          },
          
          thead({ children, ...props }) {
            return (
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-750" {...props}>
                {children}
              </thead>
            );
          },
          
          th({ children, ...props }) {
            return (
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider border-b-2 border-gray-200 dark:border-gray-600" {...props}>
                {children}
              </th>
            );
          },
          
          tbody({ children, ...props }) {
            return (
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800" {...props}>
                {children}
              </tbody>
            );
          },
          
          tr({ children, ...props }) {
            return (
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150" {...props}>
                {children}
              </tr>
            );
          },
          
          td({ children, ...props }) {
            return (
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100" {...props}>
                {children}
              </td>
            );
          },

          // Tool call indicator processing
          div({ className, children, ...props }) {
            if (className === 'tool-call-indicator') {
              return <ToolCallIndicator toolName={String(children)} />;
            }
            return <div className={className} {...props}>{children}</div>;
          }
        }}
      >
        {processedContent}
      </ReactMarkdown>
      
      {/* Streaming indicator */}
      {isStreaming && <StreamingIndicator />}
    </div>
  );
});

MessageRenderer.displayName = 'MessageRenderer';

export { MessageRenderer };
import React, { memo, useState } from 'react';
import { ChevronDown, ChevronUp, Wrench, CheckCircle, XCircle, Clock, Code } from 'lucide-react';

interface ToolCallDisplayProps {
  toolName: string;
  server?: string;
  args?: any;
  result?: any;
  status?: 'pending' | 'running' | 'completed' | 'error';
  duration?: number;
}

const getStatusIcon = (status?: string) => {
  switch (status) {
    case 'running':
      return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
    case 'completed':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'error':
      return <XCircle className="w-4 h-4 text-red-500" />;
    default:
      return <Wrench className="w-4 h-4 text-gray-500" />;
  }
};

const getStatusText = (status?: string) => {
  switch (status) {
    case 'running':
      return 'Executing...';
    case 'completed':
      return 'Completed';
    case 'error':
      return 'Failed';
    default:
      return 'Pending';
  }
};

export const ToolCallDisplay = memo(({ 
  toolName, 
  server = 'local', 
  args, 
  result, 
  status = 'pending',
  duration 
}: ToolCallDisplayProps) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="my-3 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Header with gradient background */}
      <div 
        className={`px-4 py-3 bg-gradient-to-r cursor-pointer transition-all duration-200 ${
          status === 'running' 
            ? 'from-blue-500 to-indigo-600' 
            : status === 'completed'
            ? 'from-green-500 to-emerald-600'
            : status === 'error'
            ? 'from-red-500 to-pink-600'
            : 'from-gray-500 to-gray-600'
        }`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center space-x-3">
            {getStatusIcon(status)}
            <div>
              <h4 className="font-semibold text-sm">
                Calling: {toolName}
              </h4>
              <p className="text-xs opacity-90">
                Server: {server} • {getStatusText(status)}
                {duration && ` • ${(duration / 1000).toFixed(1)}s`}
              </p>
            </div>
          </div>
          <button 
            className="p-1 hover:bg-white/10 rounded transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Expandable content */}
      {expanded && (
        <div className="bg-white dark:bg-gray-800 p-4 space-y-3">
          {/* Parameters */}
          {args && (
            <div>
              <h5 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 flex items-center">
                <Code className="w-3 h-3 mr-1" />
                Parameters
              </h5>
              <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 text-xs font-mono overflow-x-auto">
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(args, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div>
              <h5 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                Result
              </h5>
              <div className="bg-green-50 dark:bg-green-900/20 rounded p-3 text-xs overflow-x-auto">
                {typeof result === 'string' ? (
                  <p>{result}</p>
                ) : (
                  <pre className="whitespace-pre-wrap font-mono">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          )}

          {/* Progress bar for running status */}
          {status === 'running' && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
              <div className="bg-blue-600 h-1.5 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

ToolCallDisplay.displayName = 'ToolCallDisplay';
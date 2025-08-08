import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Input } from '../ui/input';
import { 
  Terminal, 
  Copy, 
  Trash2, 
  Search, 
  Filter,
  Download,
  Pause,
  Play,
  Settings,
  Eye,
  EyeOff,
  ChevronDown
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface ConsoleMessage {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug' | 'log';
  message: string;
  source?: string;
  count?: number;
}

interface TestConsoleOutputProps {
  output?: string[];
  messages?: ConsoleMessage[];
  isActive?: boolean;
  autoScroll?: boolean;
  maxMessages?: number;
  height?: string;
  showTimestamps?: boolean;
  showControls?: boolean;
  allowFiltering?: boolean;
  onClear?: () => void;
  onExport?: (output: string[]) => void;
}

export const TestConsoleOutput: React.FC<TestConsoleOutputProps> = ({
  output = [],
  messages = [],
  isActive = false,
  autoScroll = true,
  maxMessages = 1000,
  height = "300px",
  showTimestamps = true,
  showControls = true,
  allowFiltering = true,
  onClear,
  onExport
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevels, setSelectedLevels] = useState<Set<string>>(
    new Set(['info', 'warn', 'error', 'debug', 'log'])
  );
  const [isPaused, setIsPaused] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const lastMessageCount = useRef(0);

  // Convert output array to ConsoleMessage format if messages not provided
  const consoleMessages: ConsoleMessage[] = messages.length > 0 
    ? messages 
    : output.map((line, index) => {
        // Parse log level and message from formatted output
        const match = line.match(/^\[([^\]]+)\] (\w+): (.+)$/);
        if (match) {
          const [, timestamp, level, message] = match;
          return {
            id: `${index}`,
            timestamp: new Date(timestamp),
            level: level.toLowerCase() as ConsoleMessage['level'],
            message,
            source: 'test'
          };
        }
        
        return {
          id: `${index}`,
          timestamp: new Date(),
          level: 'log' as const,
          message: line,
          source: 'test'
        };
      });

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && !isPaused && endRef.current && consoleMessages.length > lastMessageCount.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    lastMessageCount.current = consoleMessages.length;
  }, [consoleMessages, autoScroll, isPaused]);

  // Filter messages
  const filteredMessages = consoleMessages.filter(message => {
    const matchesLevel = selectedLevels.has(message.level);
    const matchesSearch = !searchTerm || 
      message.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (message.source && message.source.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesLevel && matchesSearch;
  }).slice(-maxMessages);

  // Toggle level filter
  const toggleLevel = (level: string) => {
    setSelectedLevels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(level)) {
        newSet.delete(level);
      } else {
        newSet.add(level);
      }
      return newSet;
    });
  };

  // Clear console
  const handleClear = () => {
    onClear?.();
  };

  // Copy all output
  const copyOutput = () => {
    const textOutput = filteredMessages
      .map(msg => `[${msg.timestamp.toLocaleTimeString()}] ${msg.level.toUpperCase()}: ${msg.message}`)
      .join('\n');
    
    navigator.clipboard.writeText(textOutput);
  };

  // Export output
  const exportOutput = () => {
    const textOutput = filteredMessages
      .map(msg => `[${msg.timestamp.toLocaleTimeString()}] ${msg.level.toUpperCase()}: ${msg.message}`)
      .join('\n');
    
    const blob = new Blob([textOutput], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `console-output-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    
    onExport?.(output);
  };

  // Get message level styling
  const getLevelStyle = (level: ConsoleMessage['level']) => {
    const styles = {
      info: 'text-blue-600 bg-blue-50 border-blue-200',
      warn: 'text-yellow-700 bg-yellow-50 border-yellow-200',
      error: 'text-red-700 bg-red-50 border-red-200',
      debug: 'text-gray-600 bg-gray-50 border-gray-200',
      log: 'text-gray-700 bg-gray-50 border-gray-200'
    };
    return styles[level] || styles.log;
  };

  const getLevelBadgeVariant = (level: ConsoleMessage['level']) => {
    const variants = {
      info: 'default',
      warn: 'secondary',
      error: 'destructive',
      debug: 'outline',
      log: 'outline'
    } as const;
    return variants[level] || 'outline';
  };

  // Count messages by level
  const messageCounts = consoleMessages.reduce((counts, msg) => {
    counts[msg.level] = (counts[msg.level] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);

  return (
    <Card className="w-full">
      <CardHeader className={cn("pb-3", !showControls && "hidden")}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Terminal className="w-5 h-5" />
            <div>
              <CardTitle className="text-lg">Console Output</CardTitle>
              <CardDescription>
                {filteredMessages.length} messages
                {isActive && <Badge className="ml-2 animate-pulse">Live</Badge>}
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {allowFiltering && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSearch(!showSearch)}
                className={cn(showSearch && "bg-accent")}
              >
                <Search className="w-4 h-4" />
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPaused(!isPaused)}
              title={isPaused ? "Resume auto-scroll" : "Pause auto-scroll"}
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={copyOutput}
              disabled={filteredMessages.length === 0}
            >
              <Copy className="w-4 h-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={exportOutput}
              disabled={filteredMessages.length === 0}
            >
              <Download className="w-4 h-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              disabled={consoleMessages.length === 0}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        {showSearch && allowFiltering && (
          <div className="space-y-3 pt-3 border-t">
            <Input
              placeholder="Search console output..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-sm"
            />
            
            <div className="flex flex-wrap gap-2">
              {(['info', 'warn', 'error', 'debug', 'log'] as const).map(level => (
                <Button
                  key={level}
                  variant={selectedLevels.has(level) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleLevel(level)}
                  className="text-xs"
                >
                  <Badge variant={getLevelBadgeVariant(level)} className="mr-1 text-xs">
                    {level.toUpperCase()}
                  </Badge>
                  ({messageCounts[level] || 0})
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <div className="border-t">
          <ScrollArea style={{ height }} ref={scrollRef}>
            <div className="p-4 space-y-1 font-mono text-xs">
              {filteredMessages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Terminal className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No console output</p>
                  <p className="text-xs mt-1">
                    {consoleMessages.length === 0 
                      ? "Console output will appear here when tests run"
                      : "Try adjusting your filters to see messages"
                    }
                  </p>
                </div>
              ) : (
                <>
                  {filteredMessages.map((message, index) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-3 p-2 rounded border-l-2 text-xs",
                        getLevelStyle(message.level),
                        "hover:bg-opacity-80 transition-colors"
                      )}
                    >
                      {showTimestamps && (
                        <span className="text-muted-foreground whitespace-nowrap flex-shrink-0">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                      )}
                      
                      <Badge 
                        variant={getLevelBadgeVariant(message.level)}
                        className="text-xs font-mono flex-shrink-0"
                      >
                        {message.level.toUpperCase()}
                      </Badge>
                      
                      <span className="flex-1 break-all">
                        {message.message}
                      </span>
                      
                      {message.source && (
                        <span className="text-muted-foreground text-xs flex-shrink-0">
                          [{message.source}]
                        </span>
                      )}
                      
                      {message.count && message.count > 1 && (
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          {message.count}x
                        </Badge>
                      )}
                    </div>
                  ))}
                  
                  {/* Auto-scroll anchor */}
                  <div ref={endRef} />
                </>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Status Bar */}
        <div className="border-t bg-muted/30 px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>
              {filteredMessages.length} of {consoleMessages.length} messages
            </span>
            {isPaused && (
              <Badge variant="outline" className="text-xs">
                Paused
              </Badge>
            )}
            {searchTerm && (
              <Badge variant="outline" className="text-xs">
                Filtered: "{searchTerm}"
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {autoScroll && !isPaused && isActive && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>Auto-scroll</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TestConsoleOutput;
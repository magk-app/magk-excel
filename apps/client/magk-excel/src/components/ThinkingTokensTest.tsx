import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { ThinkingTokensDisplay } from './ThinkingTokensDisplay';

// Test component to demonstrate thinking tokens functionality
export const ThinkingTokensTest: React.FC = () => {
  const [thinking, setThinking] = useState<{
    content: string;
    tokenCount?: number;
    isStreaming?: boolean;
    isComplete?: boolean;
  } | undefined>();

  const [thinkingHistory, setThinkingHistory] = useState<{
    content: string;
    tokenCount?: number;
    timestamp: number;
  }[]>([]);

  const simulateThinking = async () => {
    const thinkingContent = `Let me analyze this request step by step:

1. First, I need to understand what the user is asking for
2. The request involves creating an Excel file with sales data
3. I should structure this data logically with headers and proper formatting
4. I'll need to use the Excel tools to create the file
5. The data should be realistic and useful for business analysis

This is a straightforward task that I can accomplish using the excel_create tool. I'll create a comprehensive sales report with multiple sheets if needed.`;

    // Start streaming thinking
    setThinking({
      content: '',
      tokenCount: 0,
      isStreaming: true,
      isComplete: false
    });

    // Simulate streaming character by character
    for (let i = 0; i <= thinkingContent.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 20));
      setThinking({
        content: thinkingContent.slice(0, i),
        tokenCount: Math.floor(i / 4), // Rough token estimation
        isStreaming: i < thinkingContent.length,
        isComplete: i === thinkingContent.length
      });
    }

    // Add to history after completion
    setTimeout(() => {
      setThinkingHistory(prev => [...prev, {
        content: thinkingContent,
        tokenCount: Math.floor(thinkingContent.length / 4),
        timestamp: Date.now()
      }]);

      // Clear current thinking
      setThinking(undefined);
    }, 1000);
  };

  const addToHistory = () => {
    const sampleThinking = `Additional analysis: The user seems to want a comprehensive solution. I should consider:
- Data validation
- Chart generation
- Summary statistics
- Export options`;

    setThinkingHistory(prev => [...prev, {
      content: sampleThinking,
      tokenCount: Math.floor(sampleThinking.length / 4),
      timestamp: Date.now()
    }]);
  };

  const clearAll = () => {
    setThinking(undefined);
    setThinkingHistory([]);
  };

  return (
    <Card className="p-4 max-w-4xl mx-auto">
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Thinking Tokens Test</h2>
        <p className="text-sm text-muted-foreground mb-4">
          This component demonstrates the thinking tokens display with real-time streaming
        </p>
        
        <div className="flex gap-2 mb-4">
          <Button 
            onClick={simulateThinking} 
            disabled={thinking?.isStreaming}
            size="sm"
          >
            {thinking?.isStreaming ? 'Streaming...' : 'Simulate Thinking'}
          </Button>
          <Button onClick={addToHistory} size="sm" variant="outline">
            Add to History
          </Button>
          <Button onClick={clearAll} size="sm" variant="destructive">
            Clear All
          </Button>
        </div>
      </div>

      <ThinkingTokensDisplay
        thinking={thinking}
        thinkingHistory={thinkingHistory}
        isVisible={true}
        allowToggle={true}
      />

      <div className="mt-4 p-3 bg-muted rounded-lg">
        <h3 className="text-sm font-medium mb-2">Test Status:</h3>
        <ul className="text-xs space-y-1">
          <li>• Current thinking: {thinking ? 'Active' : 'None'}</li>
          <li>• Streaming: {thinking?.isStreaming ? 'Yes' : 'No'}</li>
          <li>• Token count: {thinking?.tokenCount || 0}</li>
          <li>• History entries: {thinkingHistory.length}</li>
        </ul>
      </div>
    </Card>
  );
};
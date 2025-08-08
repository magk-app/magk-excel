import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Copy,
  Download,
  Eye,
  ChevronDown,
  ChevronRight,
  FileText,
  Activity,
  Timer
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface TestResult {
  testId: string;
  status: 'success' | 'error' | 'timeout' | 'cancelled';
  duration: number;
  startTime: Date;
  endTime: Date;
  output?: string;
  error?: string;
  screenshot?: string;
  logs: Array<{
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    timestamp: Date;
    source?: string;
  }>;
  assertions?: Array<{
    description: string;
    passed: boolean;
    expected?: any;
    actual?: any;
  }>;
}

interface TestResultsDisplayProps {
  result: TestResult;
  showDetails?: boolean;
  onExport?: (result: TestResult) => void;
  onScreenshotView?: (screenshot: string) => void;
}

export const TestResultsDisplay: React.FC<TestResultsDisplayProps> = ({
  result,
  showDetails = true,
  onExport,
  onScreenshotView
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary']));

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'timeout':
        return <Clock className="w-5 h-5 text-orange-500" />;
      case 'cancelled':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants = {
      success: 'default',
      error: 'destructive',
      timeout: 'secondary',
      cancelled: 'outline'
    } as const;
    
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const exportResult = () => {
    const exportData = {
      ...result,
      exportTime: new Date(),
      summary: {
        testId: result.testId,
        status: result.status,
        duration: result.duration,
        passedAssertions: result.assertions?.filter(a => a.passed).length || 0,
        totalAssertions: result.assertions?.length || 0
      }
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `test-result-${result.testId}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    onExport?.(result);
  };

  const passedAssertions = result.assertions?.filter(a => a.passed).length || 0;
  const totalAssertions = result.assertions?.length || 0;

  const Section: React.FC<{ 
    id: string; 
    title: string; 
    icon: React.ReactNode; 
    badge?: React.ReactNode;
    children: React.ReactNode;
  }> = ({ id, title, icon, badge, children }) => {
    const isExpanded = expandedSections.has(id);
    
    return (
      <div className="border rounded-lg overflow-hidden">
        <Button
          variant="ghost"
          className="w-full justify-between p-4 h-auto font-medium hover:bg-muted/50"
          onClick={() => toggleSection(id)}
        >
          <div className="flex items-center gap-3">
            {icon}
            <span>{title}</span>
            {badge}
          </div>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </Button>
        
        {isExpanded && (
          <div className="border-t bg-muted/10 p-4">
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon(result.status)}
            <div>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>
                Executed on {result.startTime.toLocaleString()}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(result.status)}
            <Button
              variant="outline"
              size="sm"
              onClick={exportResult}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary Section */}
        <Section
          id="summary"
          title="Summary"
          icon={<Activity className="w-4 h-4" />}
          badge={
            <Badge variant="outline">
              {passedAssertions}/{totalAssertions} passed
            </Badge>
          }
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="space-y-1">
              <div className="text-muted-foreground">Test ID</div>
              <div className="font-mono text-xs bg-muted px-2 py-1 rounded">
                {result.testId}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground">Duration</div>
              <div className="font-semibold flex items-center gap-1">
                <Timer className="w-4 h-4" />
                {formatDuration(result.duration)}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground">Start Time</div>
              <div className="font-mono text-xs">
                {result.startTime.toLocaleTimeString()}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground">End Time</div>
              <div className="font-mono text-xs">
                {result.endTime.toLocaleTimeString()}
              </div>
            </div>
          </div>
        </Section>

        {/* Assertions Section */}
        {result.assertions && result.assertions.length > 0 && (
          <Section
            id="assertions"
            title="Assertions"
            icon={<CheckCircle className="w-4 h-4" />}
            badge={
              <Badge variant={passedAssertions === totalAssertions ? 'default' : 'destructive'}>
                {passedAssertions}/{totalAssertions}
              </Badge>
            }
          >
            <div className="space-y-2">
              {result.assertions.map((assertion, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border",
                    assertion.passed ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                  )}
                >
                  {assertion.passed ? (
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">
                      {assertion.description}
                    </div>
                    {!assertion.passed && (assertion.expected || assertion.actual) && (
                      <div className="mt-2 text-xs space-y-1">
                        {assertion.expected && (
                          <div>
                            <span className="text-muted-foreground">Expected:</span>{' '}
                            <code className="bg-white px-1 rounded">
                              {JSON.stringify(assertion.expected)}
                            </code>
                          </div>
                        )}
                        {assertion.actual && (
                          <div>
                            <span className="text-muted-foreground">Actual:</span>{' '}
                            <code className="bg-white px-1 rounded">
                              {JSON.stringify(assertion.actual)}
                            </code>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Error Section */}
        {result.error && (
          <Section
            id="error"
            title="Error Details"
            icon={<AlertTriangle className="w-4 h-4 text-red-500" />}
          >
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start justify-between gap-2">
                <pre className="text-sm text-red-800 whitespace-pre-wrap overflow-auto">
                  {result.error}
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(result.error!)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Section>
        )}

        {/* Logs Section */}
        {result.logs.length > 0 && (
          <Section
            id="logs"
            title="Execution Logs"
            icon={<FileText className="w-4 h-4" />}
            badge={<Badge variant="outline">{result.logs.length} entries</Badge>}
          >
            <ScrollArea className="max-h-64">
              <div className="space-y-1">
                {result.logs.map((log, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-start gap-3 p-2 rounded text-xs font-mono",
                      log.level === 'error' && "bg-red-50 text-red-800",
                      log.level === 'warn' && "bg-yellow-50 text-yellow-800",
                      log.level === 'info' && "bg-blue-50 text-blue-800",
                      log.level === 'debug' && "bg-gray-50 text-gray-800"
                    )}
                  >
                    <span className="text-muted-foreground whitespace-nowrap">
                      {log.timestamp.toLocaleTimeString()}
                    </span>
                    <span className={cn(
                      "font-medium uppercase text-xs min-w-[50px]",
                      log.level === 'error' && "text-red-600",
                      log.level === 'warn' && "text-yellow-600",
                      log.level === 'info' && "text-blue-600",
                      log.level === 'debug' && "text-gray-600"
                    )}>
                      {log.level}
                    </span>
                    <span className="flex-1">{log.message}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Section>
        )}

        {/* Output Section */}
        {result.output && (
          <Section
            id="output"
            title="Test Output"
            icon={<FileText className="w-4 h-4" />}
          >
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2 z-10"
                onClick={() => copyToClipboard(result.output!)}
              >
                <Copy className="w-4 h-4" />
              </Button>
              <ScrollArea className="max-h-64">
                <pre className="text-xs font-mono bg-muted p-4 rounded-lg overflow-auto">
                  {result.output}
                </pre>
              </ScrollArea>
            </div>
          </Section>
        )}

        {/* Screenshot Section */}
        {result.screenshot && (
          <Section
            id="screenshot"
            title="Screenshot"
            icon={<Eye className="w-4 h-4" />}
          >
            <div className="space-y-3">
              <div className="border rounded-lg overflow-hidden bg-gray-50">
                <img
                  src={result.screenshot}
                  alt="Test Screenshot"
                  className="w-full h-auto max-h-64 object-contain cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => onScreenshotView?.(result.screenshot!)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onScreenshotView?.(result.screenshot!)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Full Size
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = result.screenshot!;
                    link.download = `test-screenshot-${result.testId}.png`;
                    link.click();
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </Section>
        )}
      </CardContent>
    </Card>
  );
};

export default TestResultsDisplay;
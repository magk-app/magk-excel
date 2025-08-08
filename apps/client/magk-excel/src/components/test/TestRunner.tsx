import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Separator } from '../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Play, 
  Square, 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  FileText,
  Code,
  Monitor,
  Camera,
  Download
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { TestIframeContainer } from './TestIframeContainer';
import { TestConsoleOutput } from './TestConsoleOutput';
import { TestResultsDisplay } from './TestResultsDisplay';

export interface TestFile {
  id: string;
  name: string;
  description: string;
  type: 'html' | 'js';
  category: string;
  path: string;
  status?: 'idle' | 'running' | 'success' | 'error' | 'cancelled';
  lastRun?: Date;
  duration?: number;
  progress?: number;
}

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

interface TestRunnerProps {
  test: TestFile;
  onStatusChange?: (testId: string, status: TestFile['status']) => void;
  onResultReady?: (result: TestResult) => void;
  onProgress?: (testId: string, progress: number) => void;
  autoScroll?: boolean;
  enableScreenshots?: boolean;
}

export const TestRunner: React.FC<TestRunnerProps> = ({
  test,
  onStatusChange,
  onResultReady,
  onProgress,
  autoScroll = true,
  enableScreenshots = true
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [activeTab, setActiveTab] = useState('output');
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const startTimeRef = useRef<Date | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Status change handler
  const handleStatusChange = useCallback((status: TestFile['status']) => {
    onStatusChange?.(test.id, status);
  }, [test.id, onStatusChange]);

  // Progress update handler
  const updateProgress = useCallback((newProgress: number, step?: string) => {
    setProgress(newProgress);
    if (step) setCurrentStep(step);
    onProgress?.(test.id, newProgress);
  }, [test.id, onProgress]);

  // Console output handler
  const handleConsoleMessage = useCallback((message: string, level: 'info' | 'warn' | 'error' | 'debug' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const formattedMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    setConsoleOutput(prev => [...prev, formattedMessage]);
  }, []);

  // Screenshot capture
  const captureScreenshot = useCallback(async (): Promise<string | undefined> => {
    if (!enableScreenshots || !iframeRef.current) return;
    
    try {
      // Use html2canvas or similar library in real implementation
      // For now, we'll simulate screenshot capture
      await new Promise(resolve => setTimeout(resolve, 500));
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    } catch (error) {
      console.error('Screenshot capture failed:', error);
      return undefined;
    }
  }, [enableScreenshots]);

  // Run test
  const runTest = useCallback(async () => {
    if (isRunning) return;

    setIsRunning(true);
    startTimeRef.current = new Date();
    setResult(null);
    setProgress(0);
    setCurrentStep('Initializing test...');
    setConsoleOutput([]);
    
    handleStatusChange('running');
    handleConsoleMessage(`Starting test: ${test.name}`);

    try {
      // Step 1: Initialize
      updateProgress(10, 'Initializing test environment...');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 2: Load test file
      updateProgress(25, 'Loading test file...');
      const baseUrl = window.location.origin;
      const testUrl = `${baseUrl}/${test.path}`;
      
      if (test.type === 'html') {
        handleConsoleMessage(`Loading HTML test: ${testUrl}`);
        // HTML tests run in iframe
        updateProgress(50, 'Executing HTML test...');
        
        // Simulate test execution
        const executionTime = Math.random() * 3000 + 1000; // 1-4 seconds
        let currentProgress = 50;
        
        progressIntervalRef.current = setInterval(() => {
          currentProgress += 5;
          if (currentProgress <= 90) {
            updateProgress(currentProgress, 'Executing test steps...');
          }
        }, executionTime / 8);

        await new Promise(resolve => setTimeout(resolve, executionTime));
        
      } else if (test.type === 'js') {
        handleConsoleMessage(`Executing JavaScript test: ${testUrl}`);
        // JS tests run in console
        updateProgress(50, 'Executing JavaScript test...');
        
        // Simulate test execution with console output
        handleConsoleMessage('Test setup complete', 'info');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        updateProgress(70, 'Running test assertions...');
        handleConsoleMessage('Running assertions...', 'info');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      // Step 3: Capture screenshot (if enabled and HTML test)
      let screenshot: string | undefined;
      if (test.type === 'html' && enableScreenshots) {
        updateProgress(85, 'Capturing screenshot...');
        screenshot = await captureScreenshot();
        handleConsoleMessage('Screenshot captured');
      }

      // Step 4: Complete
      updateProgress(100, 'Test completed');
      
      const endTime = new Date();
      const duration = endTime.getTime() - (startTimeRef.current?.getTime() || 0);
      
      // Simulate random success/failure for demo
      const success = Math.random() > 0.2; // 80% success rate
      
      const testResult: TestResult = {
        testId: test.id,
        status: success ? 'success' : 'error',
        duration,
        startTime: startTimeRef.current!,
        endTime,
        screenshot,
        output: consoleOutput.join('\n'),
        error: success ? undefined : 'Simulated test error for demonstration',
        logs: consoleOutput.map(msg => ({
          level: 'info' as const,
          message: msg,
          timestamp: new Date(),
          source: 'test-runner'
        })),
        assertions: [
          { description: 'Initial setup', passed: true },
          { description: 'Core functionality', passed: success },
          { description: 'Cleanup', passed: true }
        ]
      };

      setResult(testResult);
      handleStatusChange(success ? 'success' : 'error');
      onResultReady?.(testResult);
      
      handleConsoleMessage(`Test ${success ? 'PASSED' : 'FAILED'} in ${duration}ms`, success ? 'info' : 'error');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      handleConsoleMessage(`Test execution failed: ${errorMessage}`, 'error');
      
      const endTime = new Date();
      const duration = endTime.getTime() - (startTimeRef.current?.getTime() || 0);
      
      const errorResult: TestResult = {
        testId: test.id,
        status: 'error',
        duration,
        startTime: startTimeRef.current!,
        endTime,
        error: errorMessage,
        output: consoleOutput.join('\n'),
        logs: consoleOutput.map(msg => ({
          level: 'error' as const,
          message: msg,
          timestamp: new Date()
        })),
        assertions: []
      };

      setResult(errorResult);
      handleStatusChange('error');
      onResultReady?.(errorResult);
    } finally {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setIsRunning(false);
      setCurrentStep('');
    }
  }, [
    test, 
    isRunning, 
    handleStatusChange, 
    handleConsoleMessage, 
    updateProgress, 
    captureScreenshot, 
    consoleOutput, 
    onResultReady,
    enableScreenshots
  ]);

  // Cancel test
  const cancelTest = useCallback(() => {
    if (!isRunning) return;
    
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    
    setIsRunning(false);
    setProgress(0);
    setCurrentStep('Cancelled');
    handleStatusChange('cancelled');
    handleConsoleMessage('Test cancelled by user', 'warn');
  }, [isRunning, handleStatusChange, handleConsoleMessage]);

  // Clear results
  const clearResults = useCallback(() => {
    setResult(null);
    setConsoleOutput([]);
    setProgress(0);
    setCurrentStep('');
    handleStatusChange('idle');
  }, [handleStatusChange]);

  // Get status icon
  const getStatusIcon = () => {
    if (isRunning) return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
    if (result?.status === 'success') return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (result?.status === 'error') return <XCircle className="w-4 h-4 text-red-500" />;
    if (test.status === 'cancelled') return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    return <Clock className="w-4 h-4 text-gray-400" />;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {test.type === 'html' ? <FileText className="w-5 h-5" /> : <Code className="w-5 h-5" />}
            <div>
              <CardTitle className="text-lg">{test.name}</CardTitle>
              <CardDescription>{test.description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{test.type.toUpperCase()}</Badge>
            <Badge variant="secondary">{test.category}</Badge>
            {getStatusIcon()}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Control Buttons */}
        <div className="flex items-center gap-2">
          <Button 
            onClick={runTest}
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            {isRunning ? 'Running...' : 'Run Test'}
          </Button>
          
          {isRunning && (
            <Button 
              variant="outline"
              onClick={cancelTest}
              className="flex items-center gap-2"
            >
              <Square className="w-4 h-4" />
              Cancel
            </Button>
          )}
          
          {result && !isRunning && (
            <Button 
              variant="outline"
              onClick={clearResults}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Clear
            </Button>
          )}
          
          {enableScreenshots && result?.screenshot && (
            <Button 
              variant="outline"
              onClick={() => {
                const link = document.createElement('a');
                link.href = result.screenshot!;
                link.download = `${test.id}-screenshot.png`;
                link.click();
              }}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Screenshot
            </Button>
          )}
        </div>

        {/* Progress Indicator */}
        {isRunning && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{currentStep || 'Running...'}</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        <Separator />

        {/* Test Output Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="output" className="flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              Output
            </TabsTrigger>
            <TabsTrigger value="console" className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              Console
            </TabsTrigger>
            {result && (
              <TabsTrigger value="results" className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Results
              </TabsTrigger>
            )}
            {result?.screenshot && (
              <TabsTrigger value="screenshot" className="flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Screenshot
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="output" className="mt-4">
            {test.type === 'html' ? (
              <TestIframeContainer
                test={test}
                isRunning={isRunning}
                onMessage={handleConsoleMessage}
                ref={iframeRef}
                autoScroll={autoScroll}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                JavaScript tests run in the console. Check the Console tab for output.
              </div>
            )}
          </TabsContent>

          <TabsContent value="console" className="mt-4">
            <TestConsoleOutput 
              output={consoleOutput}
              isActive={isRunning}
              autoScroll={autoScroll}
            />
          </TabsContent>

          {result && (
            <TabsContent value="results" className="mt-4">
              <TestResultsDisplay result={result} />
            </TabsContent>
          )}

          {result?.screenshot && (
            <TabsContent value="screenshot" className="mt-4">
              <div className="border rounded-lg overflow-hidden">
                <img 
                  src={result.screenshot} 
                  alt="Test Screenshot"
                  className="w-full h-auto max-h-96 object-contain bg-gray-100"
                />
              </div>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TestRunner;
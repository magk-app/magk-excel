import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Separator } from '../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { Switch } from '../ui/switch';
import { Input } from '../ui/input';
import { 
  Play, 
  Square, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock,
  Settings,
  BarChart3,
  FileText,
  Download,
  Pause,
  SkipForward
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { TestRunner, TestFile, TestResult } from './TestRunner';
import { TestExecutionMonitor } from './TestExecutionMonitor';
import { TestResultsDisplay } from './TestResultsDisplay';

interface BatchTestExecution {
  id: string;
  tests: TestFile[];
  status: 'idle' | 'running' | 'completed' | 'error' | 'cancelled' | 'paused';
  progress: number;
  currentTestIndex: number;
  results: TestResult[];
  startTime?: Date;
  endTime?: Date;
  totalDuration?: number;
  failedTests: string[];
  skippedTests: string[];
}

interface BatchTestRunnerProps {
  tests: TestFile[];
  onComplete?: (execution: BatchTestExecution) => void;
  onProgress?: (execution: BatchTestExecution) => void;
  maxConcurrency?: number;
  defaultTimeout?: number;
  enableScreenshots?: boolean;
}

export const BatchTestRunner: React.FC<BatchTestRunnerProps> = ({
  tests = [],
  onComplete,
  onProgress,
  maxConcurrency = 1,
  defaultTimeout = 30000,
  enableScreenshots = true
}) => {
  const [execution, setExecution] = useState<BatchTestExecution | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [settings, setSettings] = useState({
    parallelExecution: false,
    continueOnFailure: true,
    enableScreenshots: enableScreenshots,
    timeout: defaultTimeout,
    retryCount: 0
  });
  
  const executionRef = useRef<BatchTestExecution | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize execution
  const initializeExecution = useCallback((): BatchTestExecution => {
    const id = `batch-${Date.now()}`;
    return {
      id,
      tests: [...tests],
      status: 'idle',
      progress: 0,
      currentTestIndex: 0,
      results: [],
      failedTests: [],
      skippedTests: [],
      startTime: undefined,
      endTime: undefined,
      totalDuration: undefined
    };
  }, [tests]);

  // Start batch execution
  const startExecution = useCallback(async () => {
    if (tests.length === 0) return;

    const newExecution = initializeExecution();
    newExecution.status = 'running';
    newExecution.startTime = new Date();
    
    setExecution(newExecution);
    executionRef.current = newExecution;
    
    abortControllerRef.current = new AbortController();

    try {
      if (settings.parallelExecution) {
        await executeTestsInParallel(newExecution);
      } else {
        await executeTestsSequentially(newExecution);
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        newExecution.status = 'error';
      } else {
        newExecution.status = 'cancelled';
      }
    } finally {
      completeExecution(newExecution);
    }
  }, [tests, settings, initializeExecution]);

  // Execute tests sequentially
  const executeTestsSequentially = async (exec: BatchTestExecution) => {
    for (let i = 0; i < exec.tests.length; i++) {
      if (abortControllerRef.current?.signal.aborted) {
        exec.status = 'cancelled';
        break;
      }

      const test = exec.tests[i];
      exec.currentTestIndex = i;
      exec.progress = (i / exec.tests.length) * 100;

      updateExecution(exec);

      try {
        const result = await executeTest(test, exec);
        exec.results.push(result);

        if (result.status === 'error' && !settings.continueOnFailure) {
          exec.status = 'error';
          break;
        }
      } catch (error) {
        const errorResult: TestResult = {
          testId: test.id,
          status: 'error',
          duration: 0,
          startTime: new Date(),
          endTime: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error',
          logs: [],
          assertions: []
        };
        exec.results.push(errorResult);
        exec.failedTests.push(test.id);

        if (!settings.continueOnFailure) {
          exec.status = 'error';
          break;
        }
      }
    }
  };

  // Execute tests in parallel
  const executeTestsInParallel = async (exec: BatchTestExecution) => {
    const promises: Promise<TestResult>[] = [];
    const concurrency = Math.min(maxConcurrency, exec.tests.length);
    
    for (let i = 0; i < concurrency; i++) {
      if (i < exec.tests.length) {
        promises.push(executeTest(exec.tests[i], exec));
      }
    }

    const results = await Promise.allSettled(promises);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        exec.results.push(result.value);
        if (result.value.status === 'error') {
          exec.failedTests.push(exec.tests[index].id);
        }
      } else {
        const errorResult: TestResult = {
          testId: exec.tests[index].id,
          status: 'error',
          duration: 0,
          startTime: new Date(),
          endTime: new Date(),
          error: result.reason?.message || 'Unknown error',
          logs: [],
          assertions: []
        };
        exec.results.push(errorResult);
        exec.failedTests.push(exec.tests[index].id);
      }
    });

    exec.progress = 100;
    updateExecution(exec);
  };

  // Execute single test
  const executeTest = async (test: TestFile, exec: BatchTestExecution): Promise<TestResult> => {
    return new Promise((resolve, reject) => {
      const startTime = new Date();
      const timeout = setTimeout(() => {
        reject(new Error(`Test ${test.id} timed out after ${settings.timeout}ms`));
      }, settings.timeout);

      // Simulate test execution
      const simulateExecution = async () => {
        try {
          // Random execution time between 500ms and 3s
          const duration = Math.random() * 2500 + 500;
          await new Promise(res => setTimeout(res, duration));

          // Simulate success/failure (80% success rate)
          const success = Math.random() > 0.2;

          const result: TestResult = {
            testId: test.id,
            status: success ? 'success' : 'error',
            duration: Date.now() - startTime.getTime(),
            startTime,
            endTime: new Date(),
            error: success ? undefined : `Simulated error in test ${test.id}`,
            logs: [
              {
                level: 'info',
                message: `Test ${test.id} started`,
                timestamp: startTime
              },
              {
                level: success ? 'info' : 'error',
                message: success ? `Test ${test.id} completed successfully` : `Test ${test.id} failed`,
                timestamp: new Date()
              }
            ],
            assertions: [
              { description: 'Test initialization', passed: true },
              { description: 'Main test logic', passed: success },
              { description: 'Cleanup', passed: true }
            ]
          };

          clearTimeout(timeout);
          resolve(result);
        } catch (error) {
          clearTimeout(timeout);
          reject(error);
        }
      };

      simulateExecution();
    });
  };

  // Update execution state
  const updateExecution = (exec: BatchTestExecution) => {
    setExecution({ ...exec });
    executionRef.current = exec;
    onProgress?.(exec);
  };

  // Complete execution
  const completeExecution = (exec: BatchTestExecution) => {
    exec.endTime = new Date();
    exec.totalDuration = exec.endTime.getTime() - (exec.startTime?.getTime() || 0);
    exec.progress = 100;
    
    if (exec.status === 'running') {
      exec.status = 'completed';
    }

    updateExecution(exec);
    onComplete?.(exec);
  };

  // Cancel execution
  const cancelExecution = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    if (executionRef.current) {
      executionRef.current.status = 'cancelled';
      completeExecution(executionRef.current);
    }
  };

  // Pause execution
  const pauseExecution = () => {
    if (executionRef.current) {
      executionRef.current.status = 'paused';
      updateExecution(executionRef.current);
    }
  };

  // Resume execution
  const resumeExecution = () => {
    if (executionRef.current) {
      executionRef.current.status = 'running';
      updateExecution(executionRef.current);
    }
  };

  // Reset execution
  const resetExecution = () => {
    setExecution(null);
    executionRef.current = null;
  };

  // Export results
  const exportResults = () => {
    if (!execution) return;

    const report = {
      executionId: execution.id,
      timestamp: new Date(),
      summary: {
        totalTests: execution.tests.length,
        completedTests: execution.results.length,
        passedTests: execution.results.filter(r => r.status === 'success').length,
        failedTests: execution.failedTests.length,
        skippedTests: execution.skippedTests.length,
        duration: execution.totalDuration
      },
      results: execution.results,
      settings
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `batch-test-results-${execution.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Calculate statistics
  const stats = execution ? {
    total: execution.tests.length,
    completed: execution.results.length,
    passed: execution.results.filter(r => r.status === 'success').length,
    failed: execution.failedTests.length,
    skipped: execution.skippedTests.length,
    successRate: execution.results.length > 0 
      ? (execution.results.filter(r => r.status === 'success').length / execution.results.length) * 100 
      : 0
  } : null;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Batch Test Runner
            </CardTitle>
            <CardDescription>
              Execute multiple tests with configurable options
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {execution && (
              <Badge variant={
                execution.status === 'completed' ? 'default' :
                execution.status === 'error' ? 'destructive' :
                execution.status === 'cancelled' ? 'secondary' :
                execution.status === 'running' ? 'default' : 'outline'
              }>
                {execution.status}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Control Panel */}
        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-muted-foreground">Tests:</span>
              <span className="ml-2 font-semibold">{tests.length}</span>
            </div>
            {stats && (
              <>
                <Separator orientation="vertical" className="h-6" />
                <div className="text-sm">
                  <span className="text-muted-foreground">Completed:</span>
                  <span className="ml-2 font-semibold">{stats.completed}/{stats.total}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Success Rate:</span>
                  <span className="ml-2 font-semibold">{stats.successRate.toFixed(1)}%</span>
                </div>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {!execution && (
              <Button 
                onClick={startExecution}
                disabled={tests.length === 0}
                className="flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Start Batch
              </Button>
            )}
            
            {execution?.status === 'running' && (
              <>
                <Button 
                  variant="outline"
                  onClick={pauseExecution}
                  className="flex items-center gap-2"
                >
                  <Pause className="w-4 h-4" />
                  Pause
                </Button>
                <Button 
                  variant="outline"
                  onClick={cancelExecution}
                  className="flex items-center gap-2"
                >
                  <Square className="w-4 h-4" />
                  Cancel
                </Button>
              </>
            )}
            
            {execution?.status === 'paused' && (
              <Button 
                onClick={resumeExecution}
                className="flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Resume
              </Button>
            )}
            
            {execution && ['completed', 'error', 'cancelled'].includes(execution.status) && (
              <>
                <Button 
                  variant="outline"
                  onClick={exportResults}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export
                </Button>
                <Button 
                  variant="outline"
                  onClick={resetExecution}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reset
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Progress Indicator */}
        {execution && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                {execution.status === 'running' ? 'Executing...' : 
                 execution.status === 'paused' ? 'Paused' :
                 execution.status === 'completed' ? 'Completed' :
                 execution.status === 'error' ? 'Failed' : 'Cancelled'}
              </span>
              <span>{execution.progress.toFixed(0)}%</span>
            </div>
            <Progress value={execution.progress} className="w-full" />
            {execution.totalDuration && (
              <div className="text-xs text-muted-foreground text-right">
                Duration: {(execution.totalDuration / 1000).toFixed(2)}s
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            {execution && <TabsTrigger value="results">Results</TabsTrigger>}
            {execution && <TabsTrigger value="monitor">Monitor</TabsTrigger>}
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold">{tests.length}</div>
                <div className="text-sm text-muted-foreground">Total Tests</div>
              </div>
              {stats && (
                <>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{stats.passed}</div>
                    <div className="text-sm text-green-600">Passed</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                    <div className="text-sm text-red-600">Failed</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-gray-600">{stats.skipped}</div>
                    <div className="text-sm text-gray-600">Skipped</div>
                  </div>
                </>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Test List</h3>
              <ScrollArea className="h-64 border rounded-lg p-4">
                {tests.map((test, index) => (
                  <div key={test.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">{index + 1}.</span>
                      <div>
                        <div className="font-medium text-sm">{test.name}</div>
                        <div className="text-xs text-muted-foreground">{test.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{test.type}</Badge>
                      {execution?.results.find(r => r.testId === test.id) && (
                        execution.results.find(r => r.testId === test.id)?.status === 'success' ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )
                      )}
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-4 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Parallel Execution</div>
                  <div className="text-sm text-muted-foreground">
                    Run tests concurrently (experimental)
                  </div>
                </div>
                <Switch
                  checked={settings.parallelExecution}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, parallelExecution: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Continue on Failure</div>
                  <div className="text-sm text-muted-foreground">
                    Continue executing remaining tests after a failure
                  </div>
                </div>
                <Switch
                  checked={settings.continueOnFailure}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, continueOnFailure: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Enable Screenshots</div>
                  <div className="text-sm text-muted-foreground">
                    Capture screenshots during test execution
                  </div>
                </div>
                <Switch
                  checked={settings.enableScreenshots}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, enableScreenshots: checked }))
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="font-medium">Timeout (ms)</label>
                <Input
                  type="number"
                  value={settings.timeout}
                  onChange={(e) => 
                    setSettings(prev => ({ ...prev, timeout: parseInt(e.target.value) || defaultTimeout }))
                  }
                  min="1000"
                  max="300000"
                />
                <div className="text-xs text-muted-foreground">
                  Maximum time to wait for each test to complete
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-medium">Retry Count</label>
                <Input
                  type="number"
                  value={settings.retryCount}
                  onChange={(e) => 
                    setSettings(prev => ({ ...prev, retryCount: parseInt(e.target.value) || 0 }))
                  }
                  min="0"
                  max="5"
                />
                <div className="text-xs text-muted-foreground">
                  Number of times to retry failed tests
                </div>
              </div>
            </div>
          </TabsContent>

          {execution && (
            <TabsContent value="results" className="space-y-4">
              {execution.results.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No results available yet</p>
                </div>
              ) : (
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {execution.results.map(result => (
                      <TestResultsDisplay
                        key={result.testId}
                        result={result}
                        showDetails={false}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          )}

          {execution && (
            <TabsContent value="monitor" className="space-y-4">
              <TestExecutionMonitor
                executions={[{
                  testId: execution.id,
                  testName: 'Batch Execution',
                  status: execution.status as any,
                  progress: execution.progress,
                  currentStep: execution.status === 'running' ? 
                    `Executing test ${execution.currentTestIndex + 1} of ${execution.tests.length}` : 
                    execution.status,
                  steps: execution.tests.map((test, index) => ({
                    id: test.id,
                    name: test.name,
                    status: index < execution.currentTestIndex ? 'completed' :
                            index === execution.currentTestIndex ? 'running' : 'pending',
                    progress: index < execution.currentTestIndex ? 100 :
                             index === execution.currentTestIndex ? 50 : 0
                  })),
                  startTime: execution.startTime,
                  endTime: execution.endTime
                }]}
                showDetails={true}
                showMetrics={false}
              />
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default BatchTestRunner;
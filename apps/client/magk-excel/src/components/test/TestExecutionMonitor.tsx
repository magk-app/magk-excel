import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { 
  Play, 
  Pause, 
  Square, 
  RefreshCw,
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Clock,
  Activity,
  Zap,
  Eye,
  EyeOff,
  Settings,
  BarChart3
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface TestExecutionStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'error' | 'skipped';
  progress: number;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  error?: string;
  details?: string;
}

interface TestExecution {
  testId: string;
  testName: string;
  status: 'idle' | 'running' | 'completed' | 'error' | 'cancelled' | 'paused';
  progress: number;
  currentStep: string;
  steps: TestExecutionStep[];
  startTime?: Date;
  endTime?: Date;
  totalDuration?: number;
  estimatedCompletion?: Date;
}

interface TestExecutionMonitorProps {
  executions: TestExecution[];
  showDetails?: boolean;
  maxHeight?: string;
  onPause?: (testId: string) => void;
  onResume?: (testId: string) => void;
  onCancel?: (testId: string) => void;
  onRetry?: (testId: string) => void;
  showMetrics?: boolean;
  autoScroll?: boolean;
}

export const TestExecutionMonitor: React.FC<TestExecutionMonitorProps> = ({
  executions,
  showDetails = true,
  maxHeight = "400px",
  onPause,
  onResume,
  onCancel,
  onRetry,
  showMetrics = true,
  autoScroll = true
}) => {
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const [showCompletedTests, setShowCompletedTests] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastExecutionsLength = useRef(executions.length);

  // Auto-scroll to bottom when new executions are added
  useEffect(() => {
    if (autoScroll && scrollRef.current && executions.length > lastExecutionsLength.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    lastExecutionsLength.current = executions.length;
  }, [executions, autoScroll]);

  const getStatusIcon = (status: TestExecution['status']) => {
    switch (status) {
      case 'running':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'cancelled':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'paused':
        return <Pause className="w-4 h-4 text-orange-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStepStatusIcon = (status: TestExecutionStep['status']) => {
    switch (status) {
      case 'running':
        return <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'error':
        return <XCircle className="w-3 h-3 text-red-500" />;
      case 'skipped':
        return <AlertTriangle className="w-3 h-3 text-gray-500" />;
      default:
        return <Clock className="w-3 h-3 text-gray-400" />;
    }
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const getEstimatedCompletion = (execution: TestExecution): string => {
    if (!execution.estimatedCompletion) return 'Unknown';
    const now = new Date();
    const diff = execution.estimatedCompletion.getTime() - now.getTime();
    if (diff <= 0) return 'Soon';
    return formatDuration(diff) + ' remaining';
  };

  // Filter executions based on visibility settings
  const filteredExecutions = executions.filter(execution => {
    if (showCompletedTests) return true;
    return execution.status !== 'completed';
  });

  // Calculate metrics
  const metrics = {
    total: executions.length,
    running: executions.filter(e => e.status === 'running').length,
    completed: executions.filter(e => e.status === 'completed').length,
    failed: executions.filter(e => e.status === 'error').length,
    paused: executions.filter(e => e.status === 'paused').length
  };

  const selectedExecution = selectedTest ? executions.find(e => e.testId === selectedTest) : null;

  return (
    <div className="space-y-4">
      {/* Metrics Header */}
      {showMetrics && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Execution Metrics
              </CardTitle>
              <div className="flex items-center gap-2 text-xs">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCompletedTests(!showCompletedTests)}
                  className="h-7 px-2"
                >
                  {showCompletedTests ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {showCompletedTests ? 'Hide' : 'Show'} Completed
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={cn("h-7 px-2", autoRefresh && "bg-accent")}
                >
                  <Zap className="w-3 h-3" />
                  Auto Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{metrics.total}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{metrics.running}</div>
                <div className="text-xs text-blue-600">Running</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{metrics.completed}</div>
                <div className="text-xs text-green-600">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{metrics.failed}</div>
                <div className="text-xs text-red-600">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{metrics.paused}</div>
                <div className="text-xs text-orange-600">Paused</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Execution List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Test Executions
            {filteredExecutions.length > 0 && (
              <Badge variant="outline">{filteredExecutions.length} active</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea 
            className="w-full"
            style={{ height: maxHeight }}
            ref={scrollRef}
          >
            <div className="space-y-3">
              {filteredExecutions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No active test executions</p>
                  <p className="text-xs mt-1">Test executions will appear here when running</p>
                </div>
              ) : (
                filteredExecutions.map((execution) => (
                  <div
                    key={execution.testId}
                    className={cn(
                      "border rounded-lg p-4 transition-all cursor-pointer hover:shadow-md",
                      selectedTest === execution.testId && "ring-2 ring-primary bg-accent/50"
                    )}
                    onClick={() => setSelectedTest(
                      selectedTest === execution.testId ? null : execution.testId
                    )}
                  >
                    {/* Execution Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {getStatusIcon(execution.status)}
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">{execution.testName}</div>
                          <div className="text-xs text-muted-foreground">
                            {execution.currentStep || 'Waiting...'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {execution.progress}%
                        </Badge>
                        {execution.status === 'running' && onPause && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onPause(execution.testId);
                            }}
                            className="h-7 w-7 p-0"
                          >
                            <Pause className="w-3 h-3" />
                          </Button>
                        )}
                        {execution.status === 'paused' && onResume && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onResume(execution.testId);
                            }}
                            className="h-7 w-7 p-0"
                          >
                            <Play className="w-3 h-3" />
                          </Button>
                        )}
                        {(execution.status === 'running' || execution.status === 'paused') && onCancel && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onCancel(execution.testId);
                            }}
                            className="h-7 w-7 p-0"
                          >
                            <Square className="w-3 h-3" />
                          </Button>
                        )}
                        {execution.status === 'error' && onRetry && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRetry(execution.testId);
                            }}
                            className="h-7 w-7 p-0"
                          >
                            <RefreshCw className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <Progress value={execution.progress} className="mb-3" />

                    {/* Execution Details */}
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div className="flex justify-between">
                        <span>Status: {execution.status}</span>
                        {execution.totalDuration && (
                          <span>Duration: {formatDuration(execution.totalDuration)}</span>
                        )}
                      </div>
                      {execution.status === 'running' && execution.estimatedCompletion && (
                        <div className="flex justify-between">
                          <span>ETA: {getEstimatedCompletion(execution)}</span>
                        </div>
                      )}
                    </div>

                    {/* Step Details (when expanded) */}
                    {showDetails && selectedTest === execution.testId && execution.steps.length > 0 && (
                      <>
                        <Separator className="my-3" />
                        <div className="space-y-2">
                          <div className="font-medium text-sm">Execution Steps</div>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {execution.steps.map((step, index) => (
                              <div
                                key={step.id}
                                className={cn(
                                  "flex items-center gap-3 p-2 rounded text-xs",
                                  step.status === 'completed' && "bg-green-50",
                                  step.status === 'error' && "bg-red-50",
                                  step.status === 'running' && "bg-blue-50",
                                  step.status === 'skipped' && "bg-gray-50"
                                )}
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  {getStepStatusIcon(step.status)}
                                  <span className="font-medium">{index + 1}.</span>
                                  <span className="truncate">{step.name}</span>
                                </div>
                                <div className="text-right">
                                  {step.progress > 0 && (
                                    <span className="text-xs">{step.progress}%</span>
                                  )}
                                  {step.duration && (
                                    <span className="text-xs ml-2">
                                      {formatDuration(step.duration)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Error Details */}
                    {execution.status === 'error' && selectedTest === execution.testId && (
                      <>
                        <Separator className="my-3" />
                        <div className="bg-red-50 border border-red-200 rounded p-3">
                          <div className="font-medium text-sm text-red-800 mb-1">Error Details</div>
                          <div className="text-xs text-red-700">
                            {execution.steps.find(s => s.error)?.error || 'Unknown error occurred'}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Selected Test Details */}
      {selectedExecution && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Execution Details: {selectedExecution.testName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Test ID:</span>
                <span className="ml-2 font-mono text-xs">{selectedExecution.testId}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Current Step:</span>
                <span className="ml-2">{selectedExecution.currentStep || 'N/A'}</span>
              </div>
              {selectedExecution.startTime && (
                <div>
                  <span className="text-muted-foreground">Started:</span>
                  <span className="ml-2">{selectedExecution.startTime.toLocaleTimeString()}</span>
                </div>
              )}
              {selectedExecution.endTime && (
                <div>
                  <span className="text-muted-foreground">Ended:</span>
                  <span className="ml-2">{selectedExecution.endTime.toLocaleTimeString()}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TestExecutionMonitor;
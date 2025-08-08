// Test runner components exports
export { TestRunner } from './TestRunner';
export type { TestFile, TestResult } from './TestRunner';

export { TestResultsDisplay } from './TestResultsDisplay';
export type { TestResult as TestResultDisplayProps } from './TestResultsDisplay';

export { TestExecutionMonitor } from './TestExecutionMonitor';
export type { 
  TestExecutionStep,
  TestExecution
} from './TestExecutionMonitor';

export { TestIframeContainer } from './TestIframeContainer';
export type { 
  TestIframeContainerRef,
  TestFile as TestIframeFile
} from './TestIframeContainer';

export { TestConsoleOutput } from './TestConsoleOutput';
export type { 
  ConsoleMessage
} from './TestConsoleOutput';

export { BatchTestRunner } from './BatchTestRunner';

// Batch test execution interface
export interface BatchTestExecution {
  id: string;
  tests: TestFile[];
  status: 'idle' | 'running' | 'completed' | 'error' | 'cancelled';
  progress: number;
  currentTestIndex: number;
  results: TestResult[];
  startTime?: Date;
  endTime?: Date;
  totalDuration?: number;
}

// Test suite configuration
export interface TestSuiteConfig {
  id: string;
  name: string;
  description: string;
  tests: TestFile[];
  parallelExecution?: boolean;
  maxConcurrency?: number;
  timeout?: number;
  retryCount?: number;
  continueOnFailure?: boolean;
  enableScreenshots?: boolean;
  outputFormat?: 'json' | 'xml' | 'html';
}

// Test execution options
export interface TestExecutionOptions {
  timeout?: number;
  retries?: number;
  screenshots?: boolean;
  verbose?: boolean;
  continueOnError?: boolean;
  parallelism?: number;
  outputPath?: string;
  reportFormat?: 'json' | 'junit' | 'html';
}

// Test reporting
export interface TestReport {
  suiteId: string;
  suiteName: string;
  executionId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  results: TestResult[];
  summary: {
    successRate: number;
    averageDuration: number;
    slowestTest?: TestResult;
    fastestTest?: TestResult;
  };
}

// Utility functions for test management
export const testUtils = {
  // Create a test result
  createTestResult: (
    testId: string,
    status: 'success' | 'error' | 'timeout' | 'cancelled',
    duration: number,
    startTime: Date = new Date(),
    endTime: Date = new Date()
  ): TestResult => ({
    testId,
    status,
    duration,
    startTime,
    endTime,
    logs: [],
    assertions: []
  }),

  // Calculate test suite statistics
  calculateSuiteStats: (results: TestResult[]) => ({
    total: results.length,
    passed: results.filter(r => r.status === 'success').length,
    failed: results.filter(r => r.status === 'error').length,
    cancelled: results.filter(r => r.status === 'cancelled').length,
    timeout: results.filter(r => r.status === 'timeout').length,
    averageDuration: results.reduce((acc, r) => acc + r.duration, 0) / results.length || 0,
    totalDuration: results.reduce((acc, r) => acc + r.duration, 0)
  }),

  // Format duration
  formatDuration: (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
  },

  // Generate test report
  generateReport: (
    execution: BatchTestExecution,
    config: TestSuiteConfig
  ): TestReport => {
    const stats = testUtils.calculateSuiteStats(execution.results);
    const sortedResults = [...execution.results].sort((a, b) => a.duration - b.duration);
    
    return {
      suiteId: config.id,
      suiteName: config.name,
      executionId: execution.id,
      startTime: execution.startTime || new Date(),
      endTime: execution.endTime || new Date(),
      duration: execution.totalDuration || 0,
      totalTests: stats.total,
      passedTests: stats.passed,
      failedTests: stats.failed,
      skippedTests: 0, // TODO: Add skip support
      results: execution.results,
      summary: {
        successRate: stats.total > 0 ? (stats.passed / stats.total) * 100 : 0,
        averageDuration: stats.averageDuration,
        slowestTest: sortedResults[sortedResults.length - 1],
        fastestTest: sortedResults[0]
      }
    };
  }
};
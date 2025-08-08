/**
 * Test Executor Service
 * Provides comprehensive test execution capabilities for HTML and JavaScript test files
 * Includes real-time status updates, artifact collection, and proper error handling
 */

import { EventEmitter } from 'events';
import { testDiscoveryService, TestFileInfo } from './testDiscoveryService';
import { fileAccessService } from './fileAccessService';

// Core interfaces
export interface TestExecutionOptions {
  testId: string;
  timeout?: number;
  collectArtifacts?: boolean;
  environment?: 'browser' | 'node' | 'hybrid';
  viewport?: { width: number; height: number };
  headless?: boolean;
  debugMode?: boolean;
}

export interface TestExecutionResult {
  testId: string;
  status: 'passed' | 'failed' | 'timeout' | 'error';
  startTime: Date;
  endTime: Date;
  duration: number;
  output: string;
  errors: TestError[];
  artifacts: TestArtifact[];
  metrics: TestMetrics;
}

export interface TestError {
  type: 'runtime' | 'assertion' | 'timeout' | 'security';
  message: string;
  stack?: string;
  line?: number;
  column?: number;
  timestamp: Date;
}

export interface TestArtifact {
  type: 'screenshot' | 'log' | 'network' | 'console' | 'coverage';
  name: string;
  path?: string;
  content?: string;
  mimeType: string;
  size: number;
  timestamp: Date;
}

export interface TestMetrics {
  memoryUsage: number;
  executionTime: number;
  networkRequests: number;
  consoleMessages: number;
  domNodes?: number;
  jsErrors: number;
}

export interface TestExecutionStatus {
  testId: string;
  status: 'idle' | 'initializing' | 'running' | 'cleanup' | 'completed' | 'failed';
  progress: number;
  currentStep?: string;
  message?: string;
  artifacts?: TestArtifact[];
}

// Execution strategy interface
export interface TestExecutionStrategy {
  readonly name: string;
  readonly supportedTypes: string[];
  canExecute(testInfo: TestFileInfo): boolean;
  execute(testInfo: TestFileInfo, options: TestExecutionOptions): Promise<TestExecutionResult>;
  cleanup(): Promise<void>;
}

/**
 * HTML Test Execution Strategy
 * Handles execution of HTML-based test files using iframe sandboxing
 */
export class HTMLTestExecutionStrategy implements TestExecutionStrategy {
  readonly name = 'HTMLTestExecutionStrategy';
  readonly supportedTypes = ['html'];

  private activeIframes: Map<string, HTMLIFrameElement> = new Map();
  private executionTimeouts: Map<string, NodeJS.Timeout> = new Map();

  canExecute(testInfo: TestFileInfo): boolean {
    return testInfo.type === 'html' && testInfo.content != null;
  }

  async execute(testInfo: TestFileInfo, options: TestExecutionOptions): Promise<TestExecutionResult> {
    const startTime = new Date();
    const artifacts: TestArtifact[] = [];
    const errors: TestError[] = [];
    const metrics: TestMetrics = {
      memoryUsage: 0,
      executionTime: 0,
      networkRequests: 0,
      consoleMessages: 0,
      jsErrors: 0
    };

    try {
      // Create sandboxed iframe for test execution
      const iframe = await this.createSandboxedIframe(testInfo, options);
      this.activeIframes.set(options.testId, iframe);

      // Set up monitoring and artifact collection
      const result = await this.executeInIframe(iframe, testInfo, options, artifacts, errors, metrics);
      
      const endTime = new Date();
      metrics.executionTime = endTime.getTime() - startTime.getTime();

      return {
        testId: options.testId,
        status: errors.length > 0 ? 'failed' : 'passed',
        startTime,
        endTime,
        duration: metrics.executionTime,
        output: result.output,
        errors,
        artifacts,
        metrics
      };

    } catch (error) {
      const endTime = new Date();
      errors.push({
        type: 'runtime',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date()
      });

      return {
        testId: options.testId,
        status: 'error',
        startTime,
        endTime,
        duration: endTime.getTime() - startTime.getTime(),
        output: '',
        errors,
        artifacts,
        metrics
      };
    } finally {
      // Cleanup
      await this.cleanupTest(options.testId);
    }
  }

  private async createSandboxedIframe(testInfo: TestFileInfo, options: TestExecutionOptions): Promise<HTMLIFrameElement> {
    const iframe = document.createElement('iframe');
    
    // Security sandbox attributes
    iframe.sandbox.add(
      'allow-scripts',
      'allow-same-origin',
      'allow-forms',
      'allow-modals'
    );

    // Styling for test environment
    iframe.style.cssText = `
      position: fixed;
      top: -9999px;
      left: -9999px;
      width: ${options.viewport?.width || 1024}px;
      height: ${options.viewport?.height || 768}px;
      border: none;
      background: white;
      z-index: -1;
    `;

    if (options.debugMode) {
      // Make visible for debugging
      iframe.style.cssText = `
        position: fixed;
        top: 50px;
        right: 50px;
        width: ${options.viewport?.width || 800}px;
        height: ${options.viewport?.height || 600}px;
        border: 2px solid #ff6b6b;
        background: white;
        z-index: 10000;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      `;
    }

    // Create test content with enhanced HTML wrapper
    const testContent = this.wrapTestContent(testInfo.content || '', options);
    
    document.body.appendChild(iframe);
    
    // Write content to iframe
    await new Promise<void>((resolve, reject) => {
      iframe.onload = () => resolve();
      iframe.onerror = (error) => reject(new Error('Failed to load test iframe'));
      
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) {
        reject(new Error('Cannot access iframe document'));
        return;
      }
      
      doc.open();
      doc.write(testContent);
      doc.close();
    });

    return iframe;
  }

  private wrapTestContent(originalContent: string, options: TestExecutionOptions): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>MAGK Test Execution - ${options.testId}</title>
    <style>
        body { 
            font-family: system-ui, -apple-system, sans-serif; 
            margin: 20px;
            background: #f8f9fa;
        }
        .test-header {
            background: #007bff;
            color: white;
            padding: 10px;
            margin: -20px -20px 20px;
            font-size: 14px;
        }
        .test-output {
            background: white;
            border: 1px solid #ddd;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            font-family: 'Monaco', 'Consolas', monospace;
            font-size: 12px;
        }
        .error { color: #dc3545; }
        .success { color: #28a745; }
        .warning { color: #ffc107; }
    </style>
    <script>
        // Test execution framework
        window.TestRunner = {
            results: [],
            errors: [],
            logs: [],
            
            log: function(message, type = 'info') {
                const entry = { 
                    message: String(message), 
                    type: type, 
                    timestamp: new Date().toISOString() 
                };
                this.logs.push(entry);
                console.log('[TEST]', message);
                this.updateOutput();
            },
            
            assert: function(condition, message = 'Assertion failed') {
                if (condition) {
                    this.results.push({ type: 'pass', message: message });
                    this.log('✅ ' + message, 'success');
                } else {
                    this.results.push({ type: 'fail', message: message });
                    this.errors.push({ message: message, type: 'assertion' });
                    this.log('❌ ' + message, 'error');
                }
            },
            
            assertEquals: function(actual, expected, message) {
                const condition = actual === expected;
                const msg = message || \`Expected \${expected}, got \${actual}\`;
                this.assert(condition, msg);
            },
            
            updateOutput: function() {
                const output = document.getElementById('test-output');
                if (output) {
                    output.innerHTML = this.logs.map(log => 
                        \`<div class="\${log.type}">\${log.message}</div>\`
                    ).join('');
                }
            },
            
            getResults: function() {
                return {
                    results: this.results,
                    errors: this.errors,
                    logs: this.logs,
                    summary: {
                        total: this.results.length,
                        passed: this.results.filter(r => r.type === 'pass').length,
                        failed: this.results.filter(r => r.type === 'fail').length
                    }
                };
            }
        };
        
        // Override console methods to capture output
        const originalConsole = { ...console };
        ['log', 'error', 'warn', 'info'].forEach(method => {
            console[method] = function(...args) {
                TestRunner.log(args.join(' '), method === 'error' ? 'error' : method === 'warn' ? 'warning' : 'info');
                originalConsole[method].apply(console, args);
            };
        });
        
        // Global error handling
        window.onerror = function(message, source, lineno, colno, error) {
            TestRunner.errors.push({
                type: 'runtime',
                message: message,
                source: source,
                line: lineno,
                column: colno,
                stack: error ? error.stack : null
            });
            TestRunner.log('💥 Runtime Error: ' + message, 'error');
            return false;
        };
        
        window.onunhandledrejection = function(event) {
            TestRunner.errors.push({
                type: 'promise',
                message: event.reason,
                timestamp: new Date()
            });
            TestRunner.log('💥 Unhandled Promise Rejection: ' + event.reason, 'error');
        };
    </script>
</head>
<body>
    <div class="test-header">🧪 Test Execution Environment - ${options.testId}</div>
    <div id="test-output" class="test-output">
        <div>Test initialized...</div>
    </div>
    
    ${originalContent}
    
    <script>
        // Initialize test execution
        TestRunner.log('Test environment ready', 'info');
        if (typeof window.runTests === 'function') {
            setTimeout(() => {
                try {
                    TestRunner.log('Starting tests...', 'info');
                    window.runTests();
                } catch (error) {
                    TestRunner.log('Test execution failed: ' + error.message, 'error');
                }
            }, 100);
        }
    </script>
</body>
</html>
    `;
  }

  private async executeInIframe(
    iframe: HTMLIFrameElement, 
    testInfo: TestFileInfo, 
    options: TestExecutionOptions,
    artifacts: TestArtifact[],
    errors: TestError[],
    metrics: TestMetrics
  ): Promise<{ output: string }> {
    
    return new Promise((resolve, reject) => {
      const timeout = options.timeout || 30000;
      let isCompleted = false;

      // Set up timeout
      const timeoutId = setTimeout(() => {
        if (!isCompleted) {
          isCompleted = true;
          errors.push({
            type: 'timeout',
            message: `Test execution timed out after ${timeout}ms`,
            timestamp: new Date()
          });
          resolve({ output: 'Test execution timed out' });
        }
      }, timeout);

      this.executionTimeouts.set(options.testId, timeoutId);

      // Monitor iframe execution
      const checkExecution = () => {
        try {
          const iframeWindow = iframe.contentWindow;
          const testRunner = iframeWindow?.['TestRunner'];
          
          if (testRunner) {
            // Collect metrics
            metrics.consoleMessages = testRunner.logs.length;
            metrics.jsErrors = testRunner.errors.length;
            
            // Check if test execution is complete
            const results = testRunner.getResults();
            
            if (options.collectArtifacts) {
              this.collectArtifacts(iframe, testInfo, artifacts);
            }
            
            // Copy errors from test runner
            testRunner.errors.forEach((error: any) => {
              errors.push({
                type: error.type || 'runtime',
                message: error.message,
                stack: error.stack,
                line: error.line,
                column: error.column,
                timestamp: new Date()
              });
            });

            if (!isCompleted) {
              isCompleted = true;
              clearTimeout(timeoutId);
              
              const output = testRunner.logs.map((log: any) => 
                `[${log.timestamp}] ${log.message}`
              ).join('\n');
              
              resolve({ output });
            }
          } else {
            // Fallback for non-TestRunner tests
            setTimeout(checkExecution, 500);
          }
        } catch (error) {
          if (!isCompleted) {
            isCompleted = true;
            clearTimeout(timeoutId);
            reject(error);
          }
        }
      };

      // Start monitoring after a short delay
      setTimeout(checkExecution, 1000);
    });
  }

  private collectArtifacts(iframe: HTMLIFrameElement, testInfo: TestFileInfo, artifacts: TestArtifact[]): void {
    try {
      const iframeDocument = iframe.contentDocument;
      if (!iframeDocument) return;

      // Collect screenshot (canvas representation)
      this.collectScreenshot(iframe, artifacts);
      
      // Collect HTML snapshot
      artifacts.push({
        type: 'log',
        name: `${testInfo.filename}-dom-snapshot.html`,
        content: iframeDocument.documentElement.outerHTML,
        mimeType: 'text/html',
        size: iframeDocument.documentElement.outerHTML.length,
        timestamp: new Date()
      });

      // Collect console logs
      const testRunner = iframe.contentWindow?.['TestRunner'];
      if (testRunner && testRunner.logs) {
        artifacts.push({
          type: 'log',
          name: `${testInfo.filename}-console.json`,
          content: JSON.stringify(testRunner.logs, null, 2),
          mimeType: 'application/json',
          size: JSON.stringify(testRunner.logs).length,
          timestamp: new Date()
        });
      }

    } catch (error) {
      console.warn('Failed to collect test artifacts:', error);
    }
  }

  private collectScreenshot(iframe: HTMLIFrameElement, artifacts: TestArtifact[]): void {
    try {
      // Create canvas to capture iframe content
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = iframe.offsetWidth;
      canvas.height = iframe.offsetHeight;

      // This is a simplified screenshot - in real implementation
      // you'd use html2canvas or similar library
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#333';
      ctx.font = '16px system-ui';
      ctx.fillText('Test Screenshot Placeholder', 50, 50);

      const dataUrl = canvas.toDataURL('image/png');
      
      artifacts.push({
        type: 'screenshot',
        name: `screenshot-${Date.now()}.png`,
        content: dataUrl,
        mimeType: 'image/png',
        size: dataUrl.length,
        timestamp: new Date()
      });

    } catch (error) {
      console.warn('Failed to capture screenshot:', error);
    }
  }

  private async cleanupTest(testId: string): Promise<void> {
    // Clear timeout
    const timeout = this.executionTimeouts.get(testId);
    if (timeout) {
      clearTimeout(timeout);
      this.executionTimeouts.delete(testId);
    }

    // Remove iframe
    const iframe = this.activeIframes.get(testId);
    if (iframe && iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
      this.activeIframes.delete(testId);
    }
  }

  async cleanup(): Promise<void> {
    // Cleanup all active iframes
    for (const [testId] of this.activeIframes) {
      await this.cleanupTest(testId);
    }
  }
}

/**
 * JavaScript Test Execution Strategy
 * Handles execution of pure JavaScript test files using controlled environment
 */
export class JavaScriptTestExecutionStrategy implements TestExecutionStrategy {
  readonly name = 'JavaScriptTestExecutionStrategy';
  readonly supportedTypes = ['js'];

  private activeWorkers: Map<string, Worker> = new Map();
  private executionTimeouts: Map<string, NodeJS.Timeout> = new Map();

  canExecute(testInfo: TestFileInfo): boolean {
    return testInfo.type === 'js' && testInfo.content != null;
  }

  async execute(testInfo: TestFileInfo, options: TestExecutionOptions): Promise<TestExecutionResult> {
    const startTime = new Date();
    const artifacts: TestArtifact[] = [];
    const errors: TestError[] = [];
    const metrics: TestMetrics = {
      memoryUsage: 0,
      executionTime: 0,
      networkRequests: 0,
      consoleMessages: 0,
      jsErrors: 0
    };

    try {
      // Create worker for isolated execution
      const result = await this.executeInWorker(testInfo, options, artifacts, errors, metrics);
      
      const endTime = new Date();
      metrics.executionTime = endTime.getTime() - startTime.getTime();

      return {
        testId: options.testId,
        status: errors.length > 0 ? 'failed' : 'passed',
        startTime,
        endTime,
        duration: metrics.executionTime,
        output: result.output,
        errors,
        artifacts,
        metrics
      };

    } catch (error) {
      const endTime = new Date();
      errors.push({
        type: 'runtime',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date()
      });

      return {
        testId: options.testId,
        status: 'error',
        startTime,
        endTime,
        duration: endTime.getTime() - startTime.getTime(),
        output: '',
        errors,
        artifacts,
        metrics
      };
    } finally {
      // Cleanup
      await this.cleanupTest(options.testId);
    }
  }

  private async executeInWorker(
    testInfo: TestFileInfo,
    options: TestExecutionOptions,
    artifacts: TestArtifact[],
    errors: TestError[],
    metrics: TestMetrics
  ): Promise<{ output: string }> {
    
    return new Promise((resolve, reject) => {
      const timeout = options.timeout || 30000;
      let isCompleted = false;
      let output = '';

      // Create worker with test code
      const workerCode = this.createWorkerCode(testInfo.content || '');
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const worker = new Worker(URL.createObjectURL(blob));
      
      this.activeWorkers.set(options.testId, worker);

      // Set up timeout
      const timeoutId = setTimeout(() => {
        if (!isCompleted) {
          isCompleted = true;
          worker.terminate();
          errors.push({
            type: 'timeout',
            message: `Test execution timed out after ${timeout}ms`,
            timestamp: new Date()
          });
          resolve({ output: 'Test execution timed out' });
        }
      }, timeout);

      this.executionTimeouts.set(options.testId, timeoutId);

      // Handle worker messages
      worker.onmessage = (event) => {
        const { type, data } = event.data;
        
        switch (type) {
          case 'log':
            output += `[${new Date().toISOString()}] ${data.message}\n`;
            metrics.consoleMessages++;
            break;
            
          case 'error':
            errors.push({
              type: 'runtime',
              message: data.message,
              stack: data.stack,
              line: data.line,
              column: data.column,
              timestamp: new Date()
            });
            metrics.jsErrors++;
            break;
            
          case 'complete':
            if (!isCompleted) {
              isCompleted = true;
              clearTimeout(timeoutId);
              worker.terminate();
              
              if (options.collectArtifacts) {
                this.collectWorkerArtifacts(testInfo, data, artifacts);
              }
              
              resolve({ output });
            }
            break;
        }
      };

      // Handle worker errors
      worker.onerror = (error) => {
        if (!isCompleted) {
          isCompleted = true;
          clearTimeout(timeoutId);
          worker.terminate();
          reject(new Error(`Worker error: ${error.message}`));
        }
      };

      // Start execution
      worker.postMessage({ type: 'start', options });
    });
  }

  private createWorkerCode(testCode: string): string {
    return `
// Test execution environment for Web Workers
let testResults = [];
let testErrors = [];
let testLogs = [];

// Mock console for worker environment
const console = {
    log: (...args) => {
        const message = args.join(' ');
        testLogs.push({ type: 'log', message, timestamp: Date.now() });
        self.postMessage({ type: 'log', data: { message } });
    },
    error: (...args) => {
        const message = args.join(' ');
        testLogs.push({ type: 'error', message, timestamp: Date.now() });
        self.postMessage({ type: 'log', data: { message } });
    },
    warn: (...args) => {
        const message = args.join(' ');
        testLogs.push({ type: 'warn', message, timestamp: Date.now() });
        self.postMessage({ type: 'log', data: { message } });
    },
    info: (...args) => {
        const message = args.join(' ');
        testLogs.push({ type: 'info', message, timestamp: Date.now() });
        self.postMessage({ type: 'log', data: { message } });
    }
};

// Test framework
const TestRunner = {
    assert: (condition, message = 'Assertion failed') => {
        testResults.push({
            type: condition ? 'pass' : 'fail',
            message,
            timestamp: Date.now()
        });
        
        if (condition) {
            console.log('✅ ' + message);
        } else {
            console.error('❌ ' + message);
            testErrors.push({ message, type: 'assertion' });
        }
    },
    
    assertEquals: (actual, expected, message) => {
        const condition = actual === expected;
        const msg = message || \`Expected \${expected}, got \${actual}\`;
        TestRunner.assert(condition, msg);
    },
    
    assertTrue: (condition, message) => {
        TestRunner.assert(condition === true, message || 'Expected true');
    },
    
    assertFalse: (condition, message) => {
        TestRunner.assert(condition === false, message || 'Expected false');
    }
};

// Global error handling
self.onerror = (error, filename, lineno, colno) => {
    testErrors.push({
        type: 'runtime',
        message: error,
        filename,
        line: lineno,
        column: colno
    });
    self.postMessage({ 
        type: 'error', 
        data: { 
            message: error, 
            stack: null, 
            line: lineno, 
            column: colno 
        } 
    });
};

// Message handler
self.onmessage = async (event) => {
    if (event.data.type === 'start') {
        try {
            console.log('Starting JavaScript test execution...');
            
            // Execute test code
            ${testCode}
            
            // Run tests if runTests function exists
            if (typeof runTests === 'function') {
                await runTests();
            }
            
            console.log('Test execution completed');
            
            // Send completion message
            self.postMessage({
                type: 'complete',
                data: {
                    results: testResults,
                    errors: testErrors,
                    logs: testLogs,
                    summary: {
                        total: testResults.length,
                        passed: testResults.filter(r => r.type === 'pass').length,
                        failed: testResults.filter(r => r.type === 'fail').length
                    }
                }
            });
            
        } catch (error) {
            self.postMessage({
                type: 'error',
                data: {
                    message: error.message || 'Unknown error',
                    stack: error.stack
                }
            });
        }
    }
};
    `;
  }

  private collectWorkerArtifacts(testInfo: TestFileInfo, workerData: any, artifacts: TestArtifact[]): void {
    try {
      // Collect test results
      if (workerData.results) {
        artifacts.push({
          type: 'log',
          name: `${testInfo.filename}-results.json`,
          content: JSON.stringify(workerData.results, null, 2),
          mimeType: 'application/json',
          size: JSON.stringify(workerData.results).length,
          timestamp: new Date()
        });
      }

      // Collect console logs
      if (workerData.logs) {
        artifacts.push({
          type: 'console',
          name: `${testInfo.filename}-console.json`,
          content: JSON.stringify(workerData.logs, null, 2),
          mimeType: 'application/json',
          size: JSON.stringify(workerData.logs).length,
          timestamp: new Date()
        });
      }

    } catch (error) {
      console.warn('Failed to collect worker artifacts:', error);
    }
  }

  private async cleanupTest(testId: string): Promise<void> {
    // Clear timeout
    const timeout = this.executionTimeouts.get(testId);
    if (timeout) {
      clearTimeout(timeout);
      this.executionTimeouts.delete(testId);
    }

    // Terminate worker
    const worker = this.activeWorkers.get(testId);
    if (worker) {
      worker.terminate();
      this.activeWorkers.delete(testId);
    }
  }

  async cleanup(): Promise<void> {
    // Cleanup all active workers
    for (const [testId] of this.activeWorkers) {
      await this.cleanupTest(testId);
    }
  }
}

/**
 * Test Status Broadcaster
 * Provides real-time status updates during test execution
 */
export class TestStatusBroadcaster extends EventEmitter {
  private statusMap: Map<string, TestExecutionStatus> = new Map();
  private broadcastInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.startBroadcasting();
  }

  updateStatus(testId: string, status: Partial<TestExecutionStatus>): void {
    const currentStatus = this.statusMap.get(testId) || {
      testId,
      status: 'idle',
      progress: 0
    };

    const updatedStatus = { ...currentStatus, ...status };
    this.statusMap.set(testId, updatedStatus);

    // Emit status update
    this.emit('statusUpdate', updatedStatus);
    this.emit(`status:${testId}`, updatedStatus);
  }

  getStatus(testId: string): TestExecutionStatus | undefined {
    return this.statusMap.get(testId);
  }

  getAllStatuses(): TestExecutionStatus[] {
    return Array.from(this.statusMap.values());
  }

  clearStatus(testId: string): void {
    this.statusMap.delete(testId);
    this.emit('statusCleared', testId);
  }

  private startBroadcasting(): void {
    // Broadcast status updates every 500ms
    this.broadcastInterval = setInterval(() => {
      const statuses = this.getAllStatuses();
      if (statuses.length > 0) {
        this.emit('broadcast', statuses);
      }
    }, 500);
  }

  destroy(): void {
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
      this.broadcastInterval = null;
    }
    this.removeAllListeners();
    this.statusMap.clear();
  }
}

/**
 * Test Artifact Manager
 * Handles collection, storage, and retrieval of test artifacts
 */
export class TestArtifactManager {
  private artifacts: Map<string, TestArtifact[]> = new Map();
  private maxArtifactsPerTest = 50;
  private maxTotalSize = 100 * 1024 * 1024; // 100MB

  addArtifact(testId: string, artifact: TestArtifact): void {
    if (!this.artifacts.has(testId)) {
      this.artifacts.set(testId, []);
    }

    const testArtifacts = this.artifacts.get(testId)!;
    
    // Check size limits
    if (testArtifacts.length >= this.maxArtifactsPerTest) {
      // Remove oldest artifact
      testArtifacts.shift();
    }

    testArtifacts.push(artifact);
    this.enforceStorageLimit();
  }

  getArtifacts(testId: string): TestArtifact[] {
    return this.artifacts.get(testId) || [];
  }

  getAllArtifacts(): Map<string, TestArtifact[]> {
    return new Map(this.artifacts);
  }

  clearArtifacts(testId: string): void {
    this.artifacts.delete(testId);
  }

  clearAllArtifacts(): void {
    this.artifacts.clear();
  }

  async saveArtifact(testId: string, artifact: TestArtifact): Promise<string | null> {
    try {
      // Use integrated file access service for artifact saving
      if (artifact.content) {
        const savedPath = await fileAccessService.saveTestArtifact(
          testId, 
          artifact.name, 
          artifact.content, 
          artifact.type
        );
        
        if (savedPath) {
          artifact.path = savedPath;
          this.addArtifact(testId, artifact);
          console.log(`💾 Test artifact saved via file access service: ${savedPath}`);
          return savedPath;
        } else {
          console.warn('Failed to save test artifact via file access service');
        }
      }
      
      // Fallback: store in memory
      this.addArtifact(testId, artifact);
      return null;
      
    } catch (error) {
      console.error('Failed to save test artifact:', error);
      return null;
    }
  }

  private enforceStorageLimit(): void {
    let totalSize = 0;
    const allArtifacts: Array<{ testId: string; artifact: TestArtifact; index: number }> = [];

    // Calculate total size and collect all artifacts
    for (const [testId, artifacts] of this.artifacts) {
      artifacts.forEach((artifact, index) => {
        totalSize += artifact.size;
        allArtifacts.push({ testId, artifact, index });
      });
    }

    // Remove oldest artifacts if over limit
    if (totalSize > this.maxTotalSize) {
      allArtifacts.sort((a, b) => 
        a.artifact.timestamp.getTime() - b.artifact.timestamp.getTime()
      );

      while (totalSize > this.maxTotalSize && allArtifacts.length > 0) {
        const oldest = allArtifacts.shift()!;
        const testArtifacts = this.artifacts.get(oldest.testId);
        if (testArtifacts) {
          const removed = testArtifacts.splice(oldest.index, 1)[0];
          totalSize -= removed.size;
        }
      }
    }
  }

  getStorageStats(): {
    totalArtifacts: number;
    totalSize: number;
    byTest: Record<string, { count: number; size: number }>;
  } {
    let totalArtifacts = 0;
    let totalSize = 0;
    const byTest: Record<string, { count: number; size: number }> = {};

    for (const [testId, artifacts] of this.artifacts) {
      let testSize = 0;
      artifacts.forEach(artifact => {
        testSize += artifact.size;
        totalSize += artifact.size;
        totalArtifacts++;
      });
      
      byTest[testId] = {
        count: artifacts.length,
        size: testSize
      };
    }

    return { totalArtifacts, totalSize, byTest };
  }
}

/**
 * Main Test Executor Service
 * Orchestrates test execution using appropriate strategies
 */
export class TestExecutorService extends EventEmitter {
  private strategies: Map<string, TestExecutionStrategy> = new Map();
  private statusBroadcaster: TestStatusBroadcaster;
  private artifactManager: TestArtifactManager;
  private activeExecutions: Map<string, Promise<TestExecutionResult>> = new Map();

  constructor() {
    super();
    
    // Initialize components
    this.statusBroadcaster = new TestStatusBroadcaster();
    this.artifactManager = new TestArtifactManager();

    // Register execution strategies
    this.registerStrategy(new HTMLTestExecutionStrategy());
    this.registerStrategy(new JavaScriptTestExecutionStrategy());

    // Forward status updates
    this.statusBroadcaster.on('statusUpdate', (status) => {
      this.emit('statusUpdate', status);
    });
  }

  registerStrategy(strategy: TestExecutionStrategy): void {
    strategy.supportedTypes.forEach(type => {
      this.strategies.set(type, strategy);
    });
  }

  async executeTest(options: TestExecutionOptions): Promise<TestExecutionResult> {
    const { testId } = options;

    // Check if test is already running
    if (this.activeExecutions.has(testId)) {
      throw new Error(`Test ${testId} is already running`);
    }

    // Get test information
    const testInfo = await testDiscoveryService.getTestDetails(testId);
    if (!testInfo) {
      throw new Error(`Test ${testId} not found`);
    }

    // Find appropriate strategy
    const strategy = this.strategies.get(testInfo.type);
    if (!strategy) {
      throw new Error(`No execution strategy found for test type: ${testInfo.type}`);
    }

    if (!strategy.canExecute(testInfo)) {
      throw new Error(`Strategy ${strategy.name} cannot execute test ${testId}`);
    }

    // Update initial status
    this.statusBroadcaster.updateStatus(testId, {
      status: 'initializing',
      progress: 0,
      currentStep: 'Preparing test environment',
      message: `Starting execution of ${testInfo.name}`
    });

    // Create execution promise
    const executionPromise = this.executeWithMonitoring(strategy, testInfo, options);
    this.activeExecutions.set(testId, executionPromise);

    try {
      const result = await executionPromise;
      
      // Update final status
      this.statusBroadcaster.updateStatus(testId, {
        status: 'completed',
        progress: 100,
        currentStep: 'Completed',
        message: `Test ${result.status === 'passed' ? 'passed' : 'failed'}`,
        artifacts: result.artifacts
      });

      return result;

    } catch (error) {
      // Update error status
      this.statusBroadcaster.updateStatus(testId, {
        status: 'failed',
        progress: 100,
        currentStep: 'Failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });

      throw error;
    } finally {
      this.activeExecutions.delete(testId);
    }
  }

  private async executeWithMonitoring(
    strategy: TestExecutionStrategy,
    testInfo: TestFileInfo,
    options: TestExecutionOptions
  ): Promise<TestExecutionResult> {
    const { testId } = options;

    try {
      // Update status: running
      this.statusBroadcaster.updateStatus(testId, {
        status: 'running',
        progress: 25,
        currentStep: 'Executing test',
        message: 'Test execution in progress'
      });

      // Execute test
      const result = await strategy.execute(testInfo, options);

      // Store artifacts
      if (result.artifacts.length > 0) {
        this.statusBroadcaster.updateStatus(testId, {
          progress: 80,
          currentStep: 'Collecting artifacts',
          message: 'Saving test artifacts'
        });

        for (const artifact of result.artifacts) {
          await this.artifactManager.saveArtifact(testId, artifact);
        }
      }

      // Emit completion event
      this.emit('testCompleted', result);

      return result;

    } catch (error) {
      this.emit('testError', { testId, error });
      throw error;
    }
  }

  async stopTest(testId: string): Promise<void> {
    const execution = this.activeExecutions.get(testId);
    if (!execution) {
      throw new Error(`No active execution found for test ${testId}`);
    }

    // Update status
    this.statusBroadcaster.updateStatus(testId, {
      status: 'cleanup',
      progress: 90,
      currentStep: 'Stopping test',
      message: 'Stopping test execution'
    });

    // Cleanup strategies
    await Promise.all(Array.from(this.strategies.values()).map(s => s.cleanup()));

    // Remove from active executions
    this.activeExecutions.delete(testId);

    // Clear status
    this.statusBroadcaster.clearStatus(testId);

    this.emit('testStopped', testId);
  }

  getTestStatus(testId: string): TestExecutionStatus | undefined {
    return this.statusBroadcaster.getStatus(testId);
  }

  getAllTestStatuses(): TestExecutionStatus[] {
    return this.statusBroadcaster.getAllStatuses();
  }

  getTestArtifacts(testId: string): TestArtifact[] {
    return this.artifactManager.getArtifacts(testId);
  }

  clearTestArtifacts(testId: string): void {
    this.artifactManager.clearArtifacts(testId);
  }

  getStorageStats(): ReturnType<TestArtifactManager['getStorageStats']> {
    return this.artifactManager.getStorageStats();
  }

  async cleanup(): Promise<void> {
    try {
      // Stop all active executions
      const activeTests = Array.from(this.activeExecutions.keys());
      await Promise.all(activeTests.map(testId => this.stopTest(testId).catch(console.error)));

      // Cleanup strategies
      await Promise.all(Array.from(this.strategies.values()).map(s => s.cleanup()));

      // Cleanup components
      this.statusBroadcaster.destroy();
      this.artifactManager.clearAllArtifacts();

      // Clear all listeners
      this.removeAllListeners();
      
      console.log('🧹 Test executor service cleaned up');
    } catch (error) {
      console.error('Error during test executor cleanup:', error);
    }
  }

  /**
   * Get environment information for test execution context
   */
  async getEnvironmentInfo(): Promise<any> {
    try {
      return await fileAccessService.getTestEnvironmentInfo();
    } catch (error) {
      console.warn('Could not get environment info for test execution:', error);
      return {
        platform: navigator.platform,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        executorVersion: '1.0.0'
      };
    }
  }

  /**
   * List artifacts for a test using integrated file access service
   */
  async listTestArtifacts(testId: string): Promise<any[]> {
    try {
      const fileServiceArtifacts = await fileAccessService.listTestArtifacts(testId);
      const memoryArtifacts = this.artifactManager.getArtifacts(testId);
      
      // Combine artifacts from both sources, avoiding duplicates
      const combinedArtifacts = [...fileServiceArtifacts];
      memoryArtifacts.forEach(memArtifact => {
        const exists = fileServiceArtifacts.some(fileArtifact => 
          fileArtifact.name === memArtifact.name && 
          fileArtifact.timestamp === memArtifact.timestamp.toISOString()
        );
        if (!exists) {
          combinedArtifacts.push({
            ...memArtifact,
            timestamp: memArtifact.timestamp.toISOString(),
            source: 'memory'
          });
        }
      });
      
      return combinedArtifacts;
    } catch (error) {
      console.error('Error listing test artifacts:', error);
      return this.artifactManager.getArtifacts(testId);
    }
  }

  // Statistics and monitoring
  getExecutionStats(): {
    activeExecutions: number;
    totalArtifacts: number;
    storageUsed: number;
    availableStrategies: string[];
  } {
    const storageStats = this.artifactManager.getStorageStats();
    
    return {
      activeExecutions: this.activeExecutions.size,
      totalArtifacts: storageStats.totalArtifacts,
      storageUsed: storageStats.totalSize,
      availableStrategies: Array.from(this.strategies.keys())
    };
  }
}

// Export singleton instance
export const testExecutorService = new TestExecutorService();

// Export hook for React components
export function useTestExecutor() {
  return {
    executeTest: (options: TestExecutionOptions) => testExecutorService.executeTest(options),
    stopTest: (testId: string) => testExecutorService.stopTest(testId),
    getTestStatus: (testId: string) => testExecutorService.getTestStatus(testId),
    getAllTestStatuses: () => testExecutorService.getAllTestStatuses(),
    getTestArtifacts: (testId: string) => testExecutorService.getTestArtifacts(testId),
    listTestArtifacts: (testId: string) => testExecutorService.listTestArtifacts(testId),
    clearTestArtifacts: (testId: string) => testExecutorService.clearTestArtifacts(testId),
    getStorageStats: () => testExecutorService.getStorageStats(),
    getExecutionStats: () => testExecutorService.getExecutionStats(),
    getEnvironmentInfo: () => testExecutorService.getEnvironmentInfo(),
    
    // Event subscriptions
    onStatusUpdate: (callback: (status: TestExecutionStatus) => void) => {
      testExecutorService.on('statusUpdate', callback);
      return () => testExecutorService.off('statusUpdate', callback);
    },
    
    onTestCompleted: (callback: (result: TestExecutionResult) => void) => {
      testExecutorService.on('testCompleted', callback);
      return () => testExecutorService.off('testCompleted', callback);
    },
    
    onTestError: (callback: (error: { testId: string; error: any }) => void) => {
      testExecutorService.on('testError', callback);
      return () => testExecutorService.off('testError', callback);
    }
  };
}
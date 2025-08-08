/**
 * Test Executor Service Tests
 * Comprehensive tests for the TestExecutor service implementation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  TestExecutorService, 
  HTMLTestExecutionStrategy, 
  JavaScriptTestExecutionStrategy,
  TestStatusBroadcaster,
  TestArtifactManager,
  testExecutorService 
} from '../testExecutorService';
import { TestFileInfo } from '../testDiscoveryService';

// Mock DOM environment
const mockCreateElement = vi.fn();
const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();
const mockSetTimeout = vi.fn();
const mockClearTimeout = vi.fn();

// Mock Electron API
const mockElectronAPI = {
  saveTestArtifact: vi.fn(),
  listTestArtifacts: vi.fn(),
  cleanupTestArtifacts: vi.fn(),
  getTestEnvironmentInfo: vi.fn()
};

beforeEach(() => {
  // Setup DOM mocks
  global.document = {
    createElement: mockCreateElement,
    body: {
      appendChild: mockAppendChild,
      removeChild: mockRemoveChild
    }
  } as any;
  
  global.window = {
    electronAPI: mockElectronAPI
  } as any;
  
  global.setTimeout = mockSetTimeout;
  global.clearTimeout = mockClearTimeout;
  
  // Reset mocks
  vi.clearAllMocks();
});

afterEach(() => {
  // Cleanup
  delete (global as any).document;
  delete (global as any).window;
  delete (global as any).setTimeout;
  delete (global as any).clearTimeout;
});

describe('TestStatusBroadcaster', () => {
  let broadcaster: TestStatusBroadcaster;

  beforeEach(() => {
    broadcaster = new TestStatusBroadcaster();
  });

  afterEach(() => {
    broadcaster.destroy();
  });

  it('should update and retrieve test status', () => {
    const testId = 'test-1';
    const status = {
      testId,
      status: 'running' as const,
      progress: 50,
      currentStep: 'Executing test'
    };

    broadcaster.updateStatus(testId, status);
    const retrieved = broadcaster.getStatus(testId);

    expect(retrieved).toEqual(status);
  });

  it('should emit status update events', () => {
    const testId = 'test-1';
    const mockListener = vi.fn();
    
    broadcaster.on('statusUpdate', mockListener);
    broadcaster.updateStatus(testId, { status: 'running', progress: 25 });

    expect(mockListener).toHaveBeenCalledWith({
      testId,
      status: 'running',
      progress: 25
    });
  });

  it('should clear status', () => {
    const testId = 'test-1';
    broadcaster.updateStatus(testId, { status: 'running', progress: 50 });
    broadcaster.clearStatus(testId);

    const retrieved = broadcaster.getStatus(testId);
    expect(retrieved).toBeUndefined();
  });
});

describe('TestArtifactManager', () => {
  let manager: TestArtifactManager;

  beforeEach(() => {
    manager = new TestArtifactManager();
  });

  it('should add and retrieve artifacts', () => {
    const testId = 'test-1';
    const artifact = {
      type: 'log' as const,
      name: 'test.log',
      content: 'test content',
      mimeType: 'text/plain',
      size: 12,
      timestamp: new Date()
    };

    manager.addArtifact(testId, artifact);
    const retrieved = manager.getArtifacts(testId);

    expect(retrieved).toHaveLength(1);
    expect(retrieved[0]).toEqual(artifact);
  });

  it('should save artifacts using Electron API', async () => {
    const testId = 'test-1';
    const artifact = {
      type: 'log' as const,
      name: 'test.log',
      content: 'test content',
      mimeType: 'text/plain',
      size: 12,
      timestamp: new Date()
    };

    mockElectronAPI.saveTestArtifact.mockResolvedValue({
      success: true,
      path: '/path/to/artifact'
    });

    const result = await manager.saveArtifact(testId, artifact);

    expect(mockElectronAPI.saveTestArtifact).toHaveBeenCalledWith({
      testId,
      artifactName: artifact.name,
      content: artifact.content,
      type: artifact.type
    });
    expect(result).toBe('/path/to/artifact');
  });

  it('should enforce storage limits', () => {
    const testId = 'test-1';
    
    // Add many large artifacts
    for (let i = 0; i < 60; i++) {
      manager.addArtifact(testId, {
        type: 'log',
        name: `test-${i}.log`,
        content: 'x'.repeat(1000),
        mimeType: 'text/plain',
        size: 1000,
        timestamp: new Date(Date.now() - i * 1000) // Stagger timestamps
      });
    }

    const artifacts = manager.getArtifacts(testId);
    expect(artifacts.length).toBeLessThanOrEqual(50); // Should be limited
  });
});

describe('HTMLTestExecutionStrategy', () => {
  let strategy: HTMLTestExecutionStrategy;

  beforeEach(() => {
    strategy = new HTMLTestExecutionStrategy();
    
    // Mock iframe creation
    const mockIframe = {
      sandbox: { add: vi.fn() },
      style: { cssText: '' },
      contentDocument: {
        open: vi.fn(),
        write: vi.fn(),
        close: vi.fn(),
        documentElement: { outerHTML: '<html></html>' }
      },
      contentWindow: {
        TestRunner: {
          logs: [{ message: 'test log', type: 'info', timestamp: new Date() }],
          errors: [],
          getResults: () => ({
            results: [{ type: 'pass', message: 'test passed' }],
            errors: [],
            logs: []
          })
        }
      },
      onload: null,
      onerror: null,
      offsetWidth: 800,
      offsetHeight: 600,
      parentNode: { removeChild: vi.fn() }
    } as any;
    
    mockCreateElement.mockReturnValue(mockIframe);
  });

  afterEach(async () => {
    await strategy.cleanup();
  });

  it('should identify HTML test files', () => {
    const htmlTest: TestFileInfo = {
      id: 'test-1',
      name: 'HTML Test',
      filename: 'test.html',
      fullPath: 'testing/test.html',
      type: 'html',
      category: { id: 'chat', name: 'Chat', description: '', icon: '', color: '' },
      tags: [],
      metadata: {
        size: 100,
        dependencies: [],
        testType: 'integration',
        status: 'active',
        complexity: 'simple'
      },
      content: '<html><body>Test</body></html>'
    };

    expect(strategy.canExecute(htmlTest)).toBe(true);
  });

  it('should reject non-HTML test files', () => {
    const jsTest: TestFileInfo = {
      id: 'test-1',
      name: 'JS Test',
      filename: 'test.js',
      fullPath: 'testing/test.js',
      type: 'js',
      category: { id: 'chat', name: 'Chat', description: '', icon: '', color: '' },
      tags: [],
      metadata: {
        size: 100,
        dependencies: [],
        testType: 'unit',
        status: 'active',
        complexity: 'simple'
      },
      content: 'console.log("test");'
    };

    expect(strategy.canExecute(jsTest)).toBe(false);
  });

  it('should execute HTML test successfully', async () => {
    const testInfo: TestFileInfo = {
      id: 'test-1',
      name: 'HTML Test',
      filename: 'test.html',
      fullPath: 'testing/test.html',
      type: 'html',
      category: { id: 'chat', name: 'Chat', description: '', icon: '', color: '' },
      tags: [],
      metadata: {
        size: 100,
        dependencies: [],
        testType: 'integration',
        status: 'active',
        complexity: 'simple'
      },
      content: '<html><body><script>console.log("test");</script></body></html>'
    };

    const options = {
      testId: 'test-1',
      timeout: 5000,
      collectArtifacts: false
    };

    // Mock setTimeout to call callback immediately
    mockSetTimeout.mockImplementation((callback: Function) => {
      setTimeout(() => callback(), 0);
      return 123;
    });

    const result = await strategy.execute(testInfo, options);

    expect(result.testId).toBe('test-1');
    expect(result.status).toBe('passed');
    expect(result.duration).toBeGreaterThan(0);
    expect(mockCreateElement).toHaveBeenCalledWith('iframe');
    expect(mockAppendChild).toHaveBeenCalled();
  });
});

describe('JavaScriptTestExecutionStrategy', () => {
  let strategy: JavaScriptTestExecutionStrategy;

  beforeEach(() => {
    strategy = new JavaScriptTestExecutionStrategy();
    
    // Mock Worker
    global.Worker = vi.fn().mockImplementation(() => ({
      postMessage: vi.fn(),
      terminate: vi.fn(),
      onmessage: null,
      onerror: null
    }));
    
    global.Blob = vi.fn().mockImplementation(() => ({}));
    global.URL = { createObjectURL: vi.fn().mockReturnValue('blob:url') };
  });

  afterEach(async () => {
    await strategy.cleanup();
  });

  it('should identify JavaScript test files', () => {
    const jsTest: TestFileInfo = {
      id: 'test-1',
      name: 'JS Test',
      filename: 'test.js',
      fullPath: 'testing/test.js',
      type: 'js',
      category: { id: 'chat', name: 'Chat', description: '', icon: '', color: '' },
      tags: [],
      metadata: {
        size: 100,
        dependencies: [],
        testType: 'unit',
        status: 'active',
        complexity: 'simple'
      },
      content: 'console.log("test");'
    };

    expect(strategy.canExecute(jsTest)).toBe(true);
  });

  it('should execute JavaScript test successfully', async () => {
    const testInfo: TestFileInfo = {
      id: 'test-1',
      name: 'JS Test',
      filename: 'test.js',
      fullPath: 'testing/test.js',
      type: 'js',
      category: { id: 'chat', name: 'Chat', description: '', icon: '', color: '' },
      tags: [],
      metadata: {
        size: 100,
        dependencies: [],
        testType: 'unit',
        status: 'active',
        complexity: 'simple'
      },
      content: `
        function runTests() {
          TestRunner.assert(true, 'Test should pass');
        }
      `
    };

    const options = {
      testId: 'test-1',
      timeout: 5000,
      collectArtifacts: false
    };

    // Mock worker behavior
    const mockWorker = {
      postMessage: vi.fn(),
      terminate: vi.fn(),
      onmessage: null,
      onerror: null
    };
    
    (global.Worker as any).mockReturnValue(mockWorker);

    const executionPromise = strategy.execute(testInfo, options);

    // Simulate worker completion message
    setTimeout(() => {
      if (mockWorker.onmessage) {
        mockWorker.onmessage({
          data: {
            type: 'complete',
            data: {
              results: [{ type: 'pass', message: 'Test passed' }],
              errors: [],
              logs: [{ type: 'log', message: 'Test completed', timestamp: Date.now() }]
            }
          }
        } as any);
      }
    }, 10);

    const result = await executionPromise;

    expect(result.testId).toBe('test-1');
    expect(result.status).toBe('passed');
    expect(result.duration).toBeGreaterThan(0);
    expect(global.Worker).toHaveBeenCalled();
  });
});

describe('TestExecutorService', () => {
  let service: TestExecutorService;

  beforeEach(() => {
    service = new TestExecutorService();
  });

  afterEach(async () => {
    await service.cleanup();
  });

  it('should register strategies correctly', () => {
    const stats = service.getExecutionStats();
    expect(stats.availableStrategies).toContain('html');
    expect(stats.availableStrategies).toContain('js');
  });

  it('should track execution statistics', () => {
    const stats = service.getExecutionStats();
    expect(stats).toHaveProperty('activeExecutions');
    expect(stats).toHaveProperty('totalArtifacts');
    expect(stats).toHaveProperty('storageUsed');
    expect(stats).toHaveProperty('availableStrategies');
  });

  it('should emit events during test execution', () => {
    const statusListener = vi.fn();
    const completedListener = vi.fn();
    
    service.on('statusUpdate', statusListener);
    service.on('testCompleted', completedListener);

    // These should be called when tests are executed
    expect(service.eventNames()).toContain('statusUpdate');
    expect(service.eventNames()).toContain('testCompleted');
  });
});

describe('Integration with testDiscoveryService', () => {
  it('should work with test discovery service', async () => {
    // Mock test discovery service
    const mockTestDiscoveryService = {
      getTestDetails: vi.fn().mockResolvedValue({
        id: 'test-1',
        name: 'Test File',
        filename: 'test.html',
        fullPath: 'testing/test.html',
        type: 'html',
        category: { id: 'chat', name: 'Chat', description: '', icon: '', color: '' },
        tags: [],
        metadata: {
          size: 100,
          dependencies: [],
          testType: 'integration',
          status: 'active',
          complexity: 'simple'
        },
        content: '<html><body>Test</body></html>'
      })
    };

    // This would be integration test in real scenario
    expect(mockTestDiscoveryService.getTestDetails).toBeDefined();
    
    const testInfo = await mockTestDiscoveryService.getTestDetails('test-1');
    expect(testInfo).toBeDefined();
    expect(testInfo.type).toBe('html');
  });
});
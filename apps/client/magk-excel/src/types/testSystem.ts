/**
 * Test System Types
 * Centralized type definitions for the integrated test system
 */

// Core test file information
export interface TestFileInfo {
  id: string;
  name: string;
  filename: string;
  fullPath: string;
  type: 'html' | 'js' | 'md' | 'xlsx';
  category: TestCategory;
  title?: string;
  description?: string;
  tags: string[];
  metadata: TestMetadata;
  content?: string;
}

export interface TestCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface TestMetadata {
  size: number;
  lastModified?: Date;
  dependencies: string[];
  testType: 'unit' | 'integration' | 'e2e' | 'manual' | 'documentation';
  status: 'active' | 'deprecated' | 'experimental' | 'broken';
  complexity: 'simple' | 'medium' | 'complex';
}

// Test execution types
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

// Discovery and search types
export interface TestDiscoveryResult {
  success: boolean;
  tests: TestFileInfo[];
  categories: TestCategory[];
  stats: TestDiscoveryStats;
  error?: string;
}

export interface TestDiscoveryStats {
  totalFiles: number;
  byType: Record<string, number>;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
}

export interface TestSearchOptions {
  query?: string;
  category?: string;
  type?: string;
  status?: string;
  tags?: string[];
  sortBy?: 'name' | 'modified' | 'category' | 'complexity';
  sortOrder?: 'asc' | 'desc';
}

// File system integration types
export interface TestFileAccessResult {
  success: boolean;
  files?: string[];
  testContent?: Map<string, string>;
  error?: string;
}

export interface FileWatchOptions {
  directory: string;
  extensions?: string[];
  recursive?: boolean;
  debounceMs?: number;
}

// System health and monitoring types
export interface TestSystemHealth {
  fileSystem: {
    accessible: boolean;
    testDirectory: boolean;
    writePermissions: boolean;
    errors?: string[];
  };
  discovery: {
    operational: boolean;
    testCount: number;
    lastScan?: Date;
    errors?: string[];
  };
  execution: {
    operational: boolean;
    activeTests: number;
    artifactStorage: boolean;
    errors?: string[];
  };
  integration: {
    status: 'healthy' | 'degraded' | 'failed';
    issues: string[];
    recommendations: string[];
  };
}

export interface TestSystemMetrics {
  performance: {
    discoveryTime: number;
    executionTime: number;
    artifactSaveTime: number;
  };
  usage: {
    testsDiscovered: number;
    testsExecuted: number;
    artifactsGenerated: number;
    storageUsed: number;
  };
  reliability: {
    discoverySuccessRate: number;
    executionSuccessRate: number;
    fileAccessSuccessRate: number;
  };
}

// Environment and configuration types
export interface TestEnvironmentInfo {
  platform: string;
  arch: string;
  nodeVersion: string;
  electronVersion: string;
  chromeVersion: string;
  appDataDir: string;
  testingDir: string;
  artifactsDir: string;
  tempDir: string;
  availableMemory: number;
  totalMemory: number;
}

export interface TestConfiguration {
  discovery: {
    autoRefresh: boolean;
    refreshInterval: number;
    includeExperimental: boolean;
    contentPreload: boolean;
  };
  execution: {
    defaultTimeout: number;
    collectArtifacts: boolean;
    maxConcurrentTests: number;
    debugMode: boolean;
  };
  integration: {
    healthCheckInterval: number;
    metricsCollectionInterval: number;
    autoRecovery: boolean;
    fallbackMode: boolean;
  };
}

// Event types for the test system
export interface TestSystemEvent {
  type: 'discovery' | 'execution' | 'integration' | 'health';
  timestamp: Date;
  data: any;
}

export interface TestDiscoveryEvent extends TestSystemEvent {
  type: 'discovery';
  data: {
    action: 'started' | 'completed' | 'failed' | 'file_changed';
    result?: TestDiscoveryResult;
    error?: string;
  };
}

export interface TestExecutionEvent extends TestSystemEvent {
  type: 'execution';
  data: {
    testId: string;
    action: 'started' | 'progress' | 'completed' | 'failed' | 'stopped';
    status?: TestExecutionStatus;
    result?: TestExecutionResult;
    error?: any;
  };
}

export interface TestIntegrationEvent extends TestSystemEvent {
  type: 'integration';
  data: {
    action: 'initialized' | 'health_check' | 'metrics_updated' | 'error';
    health?: TestSystemHealth;
    metrics?: TestSystemMetrics;
    error?: any;
  };
}

// Test strategy interface for extensibility
export interface TestExecutionStrategy {
  readonly name: string;
  readonly supportedTypes: string[];
  canExecute(testInfo: TestFileInfo): boolean;
  execute(testInfo: TestFileInfo, options: TestExecutionOptions): Promise<TestExecutionResult>;
  cleanup(): Promise<void>;
}

// Hook return types for React integration
export interface UseTestDiscoveryReturn {
  discoverTestFiles: (forceRefresh?: boolean) => Promise<TestDiscoveryResult>;
  listAllTests: () => Promise<TestFileInfo[]>;
  getTestsByCategory: (categoryId: string) => Promise<TestFileInfo[]>;
  getTestDetails: (testId: string) => Promise<TestFileInfo | null>;
  searchTests: (options: TestSearchOptions) => Promise<TestFileInfo[]>;
  getTestStatus: (testId: string) => Promise<any>;
  getCategories: () => TestCategory[];
  getStats: () => TestDiscoveryStats;
  enableHotReload: () => void;
  disableHotReload: () => void;
  refresh: () => Promise<TestDiscoveryResult>;
  reset: () => void;
}

export interface UseTestExecutorReturn {
  executeTest: (options: TestExecutionOptions) => Promise<TestExecutionResult>;
  stopTest: (testId: string) => Promise<void>;
  getTestStatus: (testId: string) => TestExecutionStatus | undefined;
  getAllTestStatuses: () => TestExecutionStatus[];
  getTestArtifacts: (testId: string) => TestArtifact[];
  listTestArtifacts: (testId: string) => Promise<any[]>;
  clearTestArtifacts: (testId: string) => void;
  getStorageStats: () => any;
  getExecutionStats: () => any;
  getEnvironmentInfo: () => Promise<any>;
  onStatusUpdate: (callback: (status: TestExecutionStatus) => void) => () => void;
  onTestCompleted: (callback: (result: TestExecutionResult) => void) => () => void;
  onTestError: (callback: (error: any) => void) => () => void;
}

export interface UseTestIntegrationReturn {
  executeTest: (options: TestExecutionOptions) => Promise<TestExecutionResult>;
  discoverTests: (forceRefresh?: boolean) => Promise<TestDiscoveryResult>;
  performHealthCheck: () => Promise<TestSystemHealth>;
  getSystemHealth: () => TestSystemHealth | null;
  getSystemMetrics: () => TestSystemMetrics | null;
  isReady: () => boolean;
  cleanup: () => Promise<void>;
  onInitialized: (callback: (result: { success: boolean; error?: any }) => void) => () => void;
  onHealthCheck: (callback: (health: TestSystemHealth) => void) => () => void;
  onTestStatusUpdate: (callback: (status: any) => void) => () => void;
  onTestCompleted: (callback: (result: TestExecutionResult) => void) => () => void;
  onTestError: (callback: (error: any) => void) => () => void;
  onSystemError: (callback: (error: any) => void) => () => void;
}

export interface UseFileAccessReturn {
  getAccessibleFiles: (sessionId: string) => Promise<any>;
  getFileContent: (fileId: string) => Promise<any>;
  saveToTempStorage: (fileId: string) => Promise<string | null>;
  getFileStats: (sessionId: string) => any;
  formatFileListForChat: (sessionId: string) => string;
  discoverTestFiles: (forceRefresh?: boolean) => Promise<TestFileAccessResult>;
  readTestFile: (filename: string) => Promise<any>;
  saveTestArtifact: (testId: string, artifactName: string, content: string, type: string) => Promise<string | null>;
  watchTestFiles: (callback: (files: string[]) => void, options?: FileWatchOptions) => Promise<string | null>;
  stopWatching: (watchId: string) => void;
  getTestEnvironmentInfo: () => Promise<any>;
  listTestArtifacts: (testId: string) => Promise<any[]>;
  cleanup: () => void;
  store: any;
}
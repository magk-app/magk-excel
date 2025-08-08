/**
 * Test Integration Service
 * Provides unified integration layer between test system and file services
 * Handles error recovery, fallbacks, and system coordination
 */

import { EventEmitter } from 'events';
import { fileAccessService, TestFileAccessResult } from './fileAccessService';
import { testDiscoveryService, TestDiscoveryResult } from './testDiscoveryService';
import { testExecutorService, TestExecutionResult, TestExecutionOptions } from './testExecutorService';

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

export class TestIntegrationService extends EventEmitter {
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private metricsCollectionInterval: NodeJS.Timeout | null = null;
  private systemHealth: TestSystemHealth | null = null;
  private systemMetrics: TestSystemMetrics | null = null;
  private isInitialized = false;

  constructor() {
    super();
    this.initializeIntegration();
  }

  /**
   * Initialize the test integration service
   */
  private async initializeIntegration(): Promise<void> {
    try {
      console.log('🔧 Initializing test integration service...');

      // Set up cross-service event forwarding
      this.setupEventForwarding();

      // Perform initial health check
      await this.performHealthCheck();

      // Start monitoring
      this.startHealthMonitoring();
      this.startMetricsCollection();

      this.isInitialized = true;
      console.log('✅ Test integration service initialized');
      this.emit('initialized', { success: true });

    } catch (error) {
      console.error('❌ Failed to initialize test integration service:', error);
      this.emit('initialized', { success: false, error });
    }
  }

  /**
   * Set up event forwarding between services
   */
  private setupEventForwarding(): void {
    // Forward test executor events
    testExecutorService.on('statusUpdate', (status) => {
      this.emit('testStatusUpdate', status);
    });

    testExecutorService.on('testCompleted', (result) => {
      this.emit('testCompleted', result);
      this.updateMetricsFromExecution(result);
    });

    testExecutorService.on('testError', (error) => {
      this.emit('testError', error);
      this.handleTestError(error);
    });

    console.log('🔗 Event forwarding configured');
  }

  /**
   * Perform comprehensive system health check
   */
  async performHealthCheck(): Promise<TestSystemHealth> {
    const health: TestSystemHealth = {
      fileSystem: {
        accessible: false,
        testDirectory: false,
        writePermissions: false,
        errors: []
      },
      discovery: {
        operational: false,
        testCount: 0,
        errors: []
      },
      execution: {
        operational: false,
        activeTests: 0,
        artifactStorage: false,
        errors: []
      },
      integration: {
        status: 'failed',
        issues: [],
        recommendations: []
      }
    };

    try {
      // Check file system access
      await this.checkFileSystemHealth(health.fileSystem);

      // Check discovery service
      await this.checkDiscoveryHealth(health.discovery);

      // Check execution service
      await this.checkExecutionHealth(health.execution);

      // Determine overall integration status
      this.determineIntegrationStatus(health);

      this.systemHealth = health;
      this.emit('healthCheck', health);

      return health;

    } catch (error) {
      console.error('❌ Health check failed:', error);
      health.integration.issues.push(`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      this.systemHealth = health;
      return health;
    }
  }

  /**
   * Check file system health
   */
  private async checkFileSystemHealth(health: TestSystemHealth['fileSystem']): Promise<void> {
    try {
      // Test basic file access
      const envInfo = await fileAccessService.getTestEnvironmentInfo();
      if (envInfo) {
        health.accessible = true;
      }

      // Test directory access
      const discoveryResult = await fileAccessService.discoverTestFiles(false);
      if (discoveryResult.success) {
        health.testDirectory = true;
      } else if (discoveryResult.error) {
        health.errors?.push(discoveryResult.error);
      }

      // Test write permissions (attempt to save a test artifact)
      const testPath = await fileAccessService.saveTestArtifact(
        'health-check', 
        'health-check.txt', 
        'Health check test content', 
        'log'
      );
      if (testPath) {
        health.writePermissions = true;
      }

    } catch (error) {
      health.errors?.push(error instanceof Error ? error.message : 'Unknown file system error');
    }
  }

  /**
   * Check discovery service health
   */
  private async checkDiscoveryHealth(health: TestSystemHealth['discovery']): Promise<void> {
    try {
      const result = await testDiscoveryService.discoverTestFiles(false);
      if (result.success) {
        health.operational = true;
        health.testCount = result.tests.length;
        health.lastScan = new Date();
      } else if (result.error) {
        health.errors?.push(result.error);
      }

    } catch (error) {
      health.errors?.push(error instanceof Error ? error.message : 'Unknown discovery error');
    }
  }

  /**
   * Check execution service health
   */
  private async checkExecutionHealth(health: TestSystemHealth['execution']): Promise<void> {
    try {
      const stats = testExecutorService.getExecutionStats();
      health.operational = true;
      health.activeTests = stats.activeExecutions;
      
      // Test artifact storage capability
      const artifactStats = testExecutorService.getStorageStats();
      health.artifactStorage = artifactStats.totalArtifacts >= 0; // If we can get stats, storage works

    } catch (error) {
      health.errors?.push(error instanceof Error ? error.message : 'Unknown execution error');
    }
  }

  /**
   * Determine overall integration status
   */
  private determineIntegrationStatus(health: TestSystemHealth): void {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check critical systems
    if (!health.fileSystem.accessible) {
      issues.push('File system not accessible');
      recommendations.push('Check Electron API availability and permissions');
    }

    if (!health.fileSystem.testDirectory) {
      issues.push('Test directory not accessible');
      recommendations.push('Ensure testing directory exists and is readable');
    }

    if (!health.discovery.operational) {
      issues.push('Test discovery not operational');
      recommendations.push('Check test file discovery configuration');
    }

    if (!health.execution.operational) {
      issues.push('Test execution not operational');
      recommendations.push('Verify test execution strategies and environment');
    }

    // Determine status
    if (issues.length === 0) {
      health.integration.status = 'healthy';
    } else if (health.fileSystem.accessible && (health.discovery.operational || health.execution.operational)) {
      health.integration.status = 'degraded';
    } else {
      health.integration.status = 'failed';
    }

    health.integration.issues = issues;
    health.integration.recommendations = recommendations;
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    // Perform health checks every 5 minutes
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, 5 * 60 * 1000);

    console.log('📊 Health monitoring started');
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    // Initialize metrics
    this.systemMetrics = {
      performance: {
        discoveryTime: 0,
        executionTime: 0,
        artifactSaveTime: 0
      },
      usage: {
        testsDiscovered: 0,
        testsExecuted: 0,
        artifactsGenerated: 0,
        storageUsed: 0
      },
      reliability: {
        discoverySuccessRate: 0,
        executionSuccessRate: 0,
        fileAccessSuccessRate: 0
      }
    };

    // Update metrics every 30 seconds
    this.metricsCollectionInterval = setInterval(() => {
      this.updateSystemMetrics();
    }, 30 * 1000);

    console.log('📈 Metrics collection started');
  }

  /**
   * Update system metrics
   */
  private updateSystemMetrics(): void {
    if (!this.systemMetrics) return;

    try {
      // Update usage metrics from test executor
      const executorStats = testExecutorService.getExecutionStats();
      const storageStats = testExecutorService.getStorageStats();
      const discoveryStats = testDiscoveryService.getStats();

      this.systemMetrics.usage.testsDiscovered = discoveryStats.totalFiles;
      this.systemMetrics.usage.artifactsGenerated = storageStats.totalArtifacts;
      this.systemMetrics.usage.storageUsed = storageStats.totalSize;

      this.emit('metricsUpdated', this.systemMetrics);

    } catch (error) {
      console.warn('Failed to update system metrics:', error);
    }
  }

  /**
   * Update metrics from test execution result
   */
  private updateMetricsFromExecution(result: TestExecutionResult): void {
    if (!this.systemMetrics) return;

    this.systemMetrics.usage.testsExecuted++;
    this.systemMetrics.performance.executionTime = result.duration;

    if (result.artifacts.length > 0) {
      this.systemMetrics.usage.artifactsGenerated += result.artifacts.length;
    }
  }

  /**
   * Handle test execution errors
   */
  private handleTestError(error: { testId: string; error: any }): void {
    console.warn(`⚠️ Test execution error for ${error.testId}:`, error.error);
    
    // Could implement automatic recovery logic here
    // For now, just emit for logging/monitoring
    this.emit('systemError', {
      type: 'test_execution',
      testId: error.testId,
      error: error.error,
      timestamp: new Date()
    });
  }

  /**
   * Execute test with integrated error handling and fallbacks
   */
  async executeTestWithIntegration(options: TestExecutionOptions): Promise<TestExecutionResult> {
    try {
      // Pre-execution health check
      if (!this.systemHealth || this.systemHealth.integration.status === 'failed') {
        await this.performHealthCheck();
      }

      if (this.systemHealth?.integration.status === 'failed') {
        throw new Error('System health check failed - cannot execute test');
      }

      // Execute with monitoring
      const startTime = Date.now();
      const result = await testExecutorService.executeTest(options);
      const endTime = Date.now();

      // Update performance metrics
      if (this.systemMetrics) {
        this.systemMetrics.performance.executionTime = endTime - startTime;
      }

      return result;

    } catch (error) {
      console.error('❌ Integrated test execution failed:', error);
      throw error;
    }
  }

  /**
   * Discover tests with integrated error handling and fallbacks
   */
  async discoverTestsWithIntegration(forceRefresh: boolean = false): Promise<TestDiscoveryResult> {
    try {
      // Attempt discovery with file integration
      const startTime = Date.now();
      const result = await testDiscoveryService.discoverTestFiles(forceRefresh);
      const endTime = Date.now();

      // Update performance metrics
      if (this.systemMetrics) {
        this.systemMetrics.performance.discoveryTime = endTime - startTime;
      }

      return result;

    } catch (error) {
      console.error('❌ Integrated test discovery failed:', error);
      // Return fallback result
      return {
        success: false,
        tests: [],
        categories: testDiscoveryService.getCategories(),
        stats: { totalFiles: 0, byType: {}, byCategory: {}, byStatus: {} },
        error: error instanceof Error ? error.message : 'Discovery failed'
      };
    }
  }

  /**
   * Get current system health
   */
  getSystemHealth(): TestSystemHealth | null {
    return this.systemHealth;
  }

  /**
   * Get current system metrics
   */
  getSystemMetrics(): TestSystemMetrics | null {
    return this.systemMetrics;
  }

  /**
   * Check if integration service is ready
   */
  isReady(): boolean {
    return this.isInitialized && this.systemHealth?.integration.status !== 'failed';
  }

  /**
   * Cleanup integration service
   */
  async cleanup(): Promise<void> {
    try {
      // Stop monitoring
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
        this.healthCheckInterval = null;
      }

      if (this.metricsCollectionInterval) {
        clearInterval(this.metricsCollectionInterval);
        this.metricsCollectionInterval = null;
      }

      // Cleanup individual services
      await testExecutorService.cleanup();
      testDiscoveryService.cleanup();
      fileAccessService.cleanup();

      // Clear listeners
      this.removeAllListeners();

      this.isInitialized = false;
      console.log('🧹 Test integration service cleaned up');

    } catch (error) {
      console.error('Error during test integration cleanup:', error);
    }
  }
}

// Export singleton instance
export const testIntegrationService = new TestIntegrationService();

// Export hook for React components
export function useTestIntegration() {
  return {
    // Integrated operations
    executeTest: (options: TestExecutionOptions) => testIntegrationService.executeTestWithIntegration(options),
    discoverTests: (forceRefresh?: boolean) => testIntegrationService.discoverTestsWithIntegration(forceRefresh),
    
    // System monitoring
    performHealthCheck: () => testIntegrationService.performHealthCheck(),
    getSystemHealth: () => testIntegrationService.getSystemHealth(),
    getSystemMetrics: () => testIntegrationService.getSystemMetrics(),
    isReady: () => testIntegrationService.isReady(),
    
    // Cleanup
    cleanup: () => testIntegrationService.cleanup(),
    
    // Event subscriptions
    onInitialized: (callback: (result: { success: boolean; error?: any }) => void) => {
      testIntegrationService.on('initialized', callback);
      return () => testIntegrationService.off('initialized', callback);
    },
    
    onHealthCheck: (callback: (health: TestSystemHealth) => void) => {
      testIntegrationService.on('healthCheck', callback);
      return () => testIntegrationService.off('healthCheck', callback);
    },
    
    onTestStatusUpdate: (callback: (status: any) => void) => {
      testIntegrationService.on('testStatusUpdate', callback);
      return () => testIntegrationService.off('testStatusUpdate', callback);
    },
    
    onTestCompleted: (callback: (result: TestExecutionResult) => void) => {
      testIntegrationService.on('testCompleted', callback);
      return () => testIntegrationService.off('testCompleted', callback);
    },
    
    onTestError: (callback: (error: any) => void) => {
      testIntegrationService.on('testError', callback);
      return () => testIntegrationService.off('testError', callback);
    },
    
    onSystemError: (callback: (error: any) => void) => {
      testIntegrationService.on('systemError', callback);
      return () => testIntegrationService.off('systemError', callback);
    }
  };
}
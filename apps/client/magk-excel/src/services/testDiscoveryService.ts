/**
 * Test Discovery Service
 * Provides comprehensive test file discovery and management for the developer test panel
 * Handles both HTML and JavaScript test files with metadata extraction and categorization
 */

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
  metadata: {
    size: number;
    lastModified?: Date;
    dependencies: string[];
    testType: 'unit' | 'integration' | 'e2e' | 'manual' | 'documentation';
    status: 'active' | 'deprecated' | 'experimental' | 'broken';
    complexity: 'simple' | 'medium' | 'complex';
  };
  content?: string;
}

export interface TestCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface TestDiscoveryResult {
  success: boolean;
  tests: TestFileInfo[];
  categories: TestCategory[];
  stats: {
    totalFiles: number;
    byType: Record<string, number>;
    byCategory: Record<string, number>;
    byStatus: Record<string, number>;
  };
  error?: string;
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

class TestDiscoveryService {
  private testFiles: Map<string, TestFileInfo> = new Map();
  private categories: Map<string, TestCategory> = new Map();
  private lastScanTime: Date | null = null;
  private watchMode: boolean = false;
  private fileWatcher: any = null;

  constructor() {
    this.initializeCategories();
  }

  /**
   * Initialize predefined test categories based on observed patterns
   */
  private initializeCategories(): void {
    const defaultCategories: TestCategory[] = [
      {
        id: 'chat',
        name: 'Chat & Communication',
        description: 'Tests for chat functionality, API integration, and messaging',
        icon: '💬',
        color: '#4f46e5'
      },
      {
        id: 'excel',
        name: 'Excel Processing',
        description: 'Tests for Excel file handling, data processing, and exports',
        icon: '📊',
        color: '#059669'
      },
      {
        id: 'mcp',
        name: 'MCP Integration',
        description: 'Tests for Model Context Protocol server integration',
        icon: '🔌',
        color: '#dc2626'
      },
      {
        id: 'workflow',
        name: 'Workflow Engine',
        description: 'Tests for workflow creation, execution, and management',
        icon: '⚡',
        color: '#7c3aed'
      },
      {
        id: 'file',
        name: 'File Management',
        description: 'Tests for file upload, persistence, and processing',
        icon: '📁',
        color: '#ea580c'
      },
      {
        id: 'persistence',
        name: 'Data Persistence',
        description: 'Tests for data storage, retrieval, and state management',
        icon: '💾',
        color: '#0891b2'
      },
      {
        id: 'ui',
        name: 'User Interface',
        description: 'Tests for UI components, interactions, and user flows',
        icon: '🎨',
        color: '#be185d'
      },
      {
        id: 'integration',
        name: 'System Integration',
        description: 'End-to-end integration tests and system-wide functionality',
        icon: '🔗',
        color: '#65a30d'
      },
      {
        id: 'api',
        name: 'API Testing',
        description: 'Tests for API endpoints, requests, and responses',
        icon: '🌐',
        color: '#2563eb'
      },
      {
        id: 'smithery',
        name: 'Smithery Integration',
        description: 'Tests for Smithery server browser and installation',
        icon: '🔨',
        color: '#9333ea'
      }
    ];

    defaultCategories.forEach(category => {
      this.categories.set(category.id, category);
    });
  }

  /**
   * Discover all test files in the testing directory
   */
  async discoverTestFiles(forceRefresh: boolean = false): Promise<TestDiscoveryResult> {
    try {
      // Skip scan if recent and not forced
      if (!forceRefresh && this.lastScanTime && 
          Date.now() - this.lastScanTime.getTime() < 30000) {
        return this.formatDiscoveryResult();
      }

      console.log('🔍 Discovering test files...');
      
      // Use Electron API if available for file system access
      let testFiles: string[] = [];
      
      if (window.electronAPI?.readDirectory) {
        try {
          const testingDir = 'testing';
          const result = await window.electronAPI.readDirectory(testingDir);
          if (result.success && result.files) {
            testFiles = result.files;
          } else {
            console.warn('Could not read testing directory:', result.error);
            testFiles = this.getPredefinedTestFiles();
          }
        } catch (error) {
          console.warn('Could not read testing directory via Electron API:', error);
          // Fallback to predefined list based on current structure
          testFiles = this.getPredefinedTestFiles();
        }
      } else {
        // Browser environment fallback
        testFiles = this.getPredefinedTestFiles();
      }

      // Clear existing data if forced refresh
      if (forceRefresh) {
        this.testFiles.clear();
      }

      // Process each test file
      for (const filename of testFiles) {
        try {
          const testInfo = await this.analyzeTestFile(filename);
          if (testInfo) {
            this.testFiles.set(testInfo.id, testInfo);
          }
        } catch (error) {
          console.warn(`Failed to analyze test file ${filename}:`, error);
        }
      }

      this.lastScanTime = new Date();
      
      console.log(`✅ Discovered ${this.testFiles.size} test files across ${this.categories.size} categories`);
      
      return this.formatDiscoveryResult();

    } catch (error) {
      console.error('❌ Test discovery failed:', error);
      return {
        success: false,
        tests: [],
        categories: Array.from(this.categories.values()),
        stats: { totalFiles: 0, byType: {}, byCategory: {}, byStatus: {} },
        error: error instanceof Error ? error.message : 'Unknown discovery error'
      };
    }
  }

  /**
   * Get predefined test files (fallback for browser environment)
   */
  private getPredefinedTestFiles(): string[] {
    return [
      'test-chat-api.html',
      'test-chat-complete.html', 
      'test-chat-final.html',
      'test-chat-fix.html',
      'test-chat-fixed.html',
      'test-chat-immediate.html',
      'test-chat-store.html',
      'test-chat-streaming.html',
      'test-excel-functionality.html',
      'test-excel-path-resolution.html',
      'test-file-persistence.html',
      'test-filesystem-mcp.html',
      'test-upload.html',
      'test-workflow-creation-flow.html',
      'test-workflow-creation.html',
      'test-demos.js',
      'test-mcp-complete.js',
      'test-mcp-debug.js',
      'test-mcp-integration.js',
      'test-workflow-store.js',
      'test_smithery_api.js',
      'test-smithery-integration.md',
      'test-sample.xlsx'
    ];
  }

  /**
   * Analyze a test file and extract metadata
   */
  private async analyzeTestFile(filename: string): Promise<TestFileInfo | null> {
    try {
      const fullPath = `testing/${filename}`;
      const fileExtension = filename.split('.').pop()?.toLowerCase() || '';
      
      // Determine file type
      const type = this.getFileType(fileExtension);
      if (!type) return null;

      // Generate unique ID
      const id = `test-${filename.replace(/[^a-zA-Z0-9]/g, '-')}`;

      // Extract metadata based on file type
      let content = '';
      let title = '';
      let description = '';
      let dependencies: string[] = [];

      // Try to read file content if in Electron environment
      if (window.electronAPI?.readFile) {
        try {
          const result = await window.electronAPI.readFile(fullPath);
          if (result.success && result.content) {
            content = result.content;
          } else {
            console.warn(`Could not read content for ${filename}:`, result.error);
          }
        } catch (error) {
          console.warn(`Could not read content for ${filename}:`, error);
        }
      }

      // Parse content based on file type
      if (content) {
        const parsed = this.parseFileContent(content, type);
        title = parsed.title;
        description = parsed.description;
        dependencies = parsed.dependencies;
      }

      // Fallback title/description based on filename
      if (!title) {
        title = this.generateTitleFromFilename(filename);
      }
      if (!description) {
        description = this.generateDescriptionFromFilename(filename);
      }

      // Categorize the test
      const category = this.categorizeTest(filename, title, description, dependencies);

      // Determine test complexity and status
      const complexity = this.assessComplexity(content, dependencies, filename);
      const status = this.determineStatus(filename, content);
      const testType = this.determineTestType(filename, content, dependencies);

      const testInfo: TestFileInfo = {
        id,
        name: title,
        filename,
        fullPath,
        type,
        category,
        title,
        description,
        tags: this.extractTags(filename, content, dependencies),
        metadata: {
          size: content.length || 0,
          lastModified: new Date(), // Would be actual file stats in real implementation
          dependencies,
          testType,
          status,
          complexity
        },
        content: content.substring(0, 1000) // Store first 1000 chars for preview
      };

      return testInfo;

    } catch (error) {
      console.error(`Error analyzing test file ${filename}:`, error);
      return null;
    }
  }

  /**
   * Determine file type from extension
   */
  private getFileType(extension: string): TestFileInfo['type'] | null {
    switch (extension) {
      case 'html': return 'html';
      case 'js': return 'js';
      case 'md': return 'md';
      case 'xlsx': return 'xlsx';
      default: return null;
    }
  }

  /**
   * Parse file content to extract metadata
   */
  private parseFileContent(content: string, type: TestFileInfo['type']): {
    title: string;
    description: string;
    dependencies: string[];
  } {
    let title = '';
    let description = '';
    let dependencies: string[] = [];

    try {
      switch (type) {
        case 'html':
          // Extract title from HTML
          const titleMatch = content.match(/<title>(.*?)<\/title>/i);
          if (titleMatch) title = titleMatch[1].trim();

          // Extract description from meta or comments
          const descMatch = content.match(/<!--\s*(.*?)\s*-->/s);
          if (descMatch) description = descMatch[1].trim();

          // Find script imports/dependencies
          const scriptMatches = content.match(/import.*?from\s+['"]([^'"]+)['"]/g) || [];
          dependencies = scriptMatches.map(match => {
            const importMatch = match.match(/from\s+['"]([^'"]+)['"]/);
            return importMatch ? importMatch[1] : '';
          }).filter(Boolean);

          break;

        case 'js':
          // Extract title and description from comments
          const jsCommentMatch = content.match(/\/\*\*\s*(.*?)\s*\*\//s);
          if (jsCommentMatch) {
            const comment = jsCommentMatch[1];
            const lines = comment.split('\n').map(line => line.replace(/^\s*\*\s?/, '').trim());
            title = lines[0] || '';
            description = lines.slice(1).join(' ').trim();
          }

          // Find imports
          const importMatches = content.match(/import.*?from\s+['"]([^'"]+)['"]/g) || [];
          const requireMatches = content.match(/require\(['"]([^'"]+)['"]\)/g) || [];
          
          dependencies = [
            ...importMatches.map(match => {
              const m = match.match(/from\s+['"]([^'"]+)['"]/);
              return m ? m[1] : '';
            }),
            ...requireMatches.map(match => {
              const m = match.match(/require\(['"]([^'"]+)['"]\)/);
              return m ? m[1] : '';
            })
          ].filter(Boolean);

          break;

        case 'md':
          // Extract title from first heading
          const headingMatch = content.match(/^#\s+(.+)/m);
          if (headingMatch) title = headingMatch[1].trim();

          // Extract description from first paragraph
          const paraMatch = content.match(/^(?!#)(.+)$/m);
          if (paraMatch) description = paraMatch[1].trim();

          break;
      }
    } catch (error) {
      console.warn('Error parsing file content:', error);
    }

    return { title, description, dependencies };
  }

  /**
   * Generate title from filename
   */
  private generateTitleFromFilename(filename: string): string {
    return filename
      .replace(/\.[^.]+$/, '') // Remove extension
      .replace(/test-?/i, '') // Remove 'test' prefix
      .replace(/[-_]/g, ' ') // Replace dashes/underscores with spaces
      .replace(/\b\w/g, l => l.toUpperCase()) // Title case
      .trim();
  }

  /**
   * Generate description from filename
   */
  private generateDescriptionFromFilename(filename: string): string {
    const base = filename.replace(/\.[^.]+$/, '').toLowerCase();
    
    if (base.includes('chat')) return 'Tests chat functionality and communication features';
    if (base.includes('excel')) return 'Tests Excel file processing and data handling';
    if (base.includes('mcp')) return 'Tests Model Context Protocol integration';
    if (base.includes('workflow')) return 'Tests workflow creation and execution';
    if (base.includes('file') || base.includes('upload')) return 'Tests file management and upload functionality';
    if (base.includes('persistence')) return 'Tests data persistence and storage';
    if (base.includes('smithery')) return 'Tests Smithery server integration';
    if (base.includes('api')) return 'Tests API endpoints and responses';
    
    return `Test file for ${this.generateTitleFromFilename(filename).toLowerCase()}`;
  }

  /**
   * Categorize test based on filename and content
   */
  private categorizeTest(filename: string, title: string, description: string, dependencies: string[]): TestCategory {
    const content = `${filename} ${title} ${description}`.toLowerCase();
    
    // Check dependencies for clues
    const hasElectron = dependencies.some(dep => dep.includes('electron'));
    const hasMCP = dependencies.some(dep => dep.includes('mcp'));
    const hasWorkflow = dependencies.some(dep => dep.includes('workflow'));

    // Categorize based on content analysis
    if (content.includes('chat') || content.includes('message')) {
      return this.categories.get('chat')!;
    }
    if (content.includes('excel') || content.includes('xlsx') || filename.includes('xlsx')) {
      return this.categories.get('excel')!;
    }
    if (content.includes('mcp') || hasMCP) {
      return this.categories.get('mcp')!;
    }
    if (content.includes('workflow') || hasWorkflow) {
      return this.categories.get('workflow')!;
    }
    if (content.includes('file') || content.includes('upload') || content.includes('persistence')) {
      return this.categories.get('file')!;
    }
    if (content.includes('smithery')) {
      return this.categories.get('smithery')!;
    }
    if (content.includes('api') || content.includes('endpoint')) {
      return this.categories.get('api')!;
    }
    if (hasElectron || content.includes('integration')) {
      return this.categories.get('integration')!;
    }

    // Default to UI category
    return this.categories.get('ui')!;
  }

  /**
   * Assess test complexity
   */
  private assessComplexity(content: string, dependencies: string[], filename: string): TestFileInfo['metadata']['complexity'] {
    let score = 0;
    
    // File size factor
    if (content.length > 5000) score += 2;
    else if (content.length > 2000) score += 1;
    
    // Dependencies factor
    if (dependencies.length > 5) score += 2;
    else if (dependencies.length > 2) score += 1;
    
    // Complexity indicators in content
    const complexityIndicators = ['async', 'await', 'promise', 'class', 'interface', 'socket', 'stream'];
    score += complexityIndicators.reduce((acc, indicator) => {
      return acc + (content.toLowerCase().includes(indicator) ? 1 : 0);
    }, 0);

    // Filename complexity hints
    if (filename.includes('complete') || filename.includes('integration') || filename.includes('full')) score += 1;
    
    if (score >= 5) return 'complex';
    if (score >= 2) return 'medium';
    return 'simple';
  }

  /**
   * Determine test status
   */
  private determineStatus(filename: string, content: string): TestFileInfo['metadata']['status'] {
    const lower = filename.toLowerCase();
    
    if (lower.includes('deprecated') || lower.includes('old')) return 'deprecated';
    if (lower.includes('experimental') || lower.includes('wip')) return 'experimental';
    if (lower.includes('broken') || lower.includes('disabled')) return 'broken';
    
    // Check content for status indicators
    if (content.includes('TODO') || content.includes('FIXME')) return 'experimental';
    
    return 'active';
  }

  /**
   * Determine test type
   */
  private determineTestType(filename: string, content: string, dependencies: string[]): TestFileInfo['metadata']['testType'] {
    const lower = filename.toLowerCase();
    
    if (lower.includes('integration') || lower.includes('e2e')) return 'integration';
    if (lower.includes('unit')) return 'unit';
    if (lower.includes('manual') || filename.endsWith('.md')) return 'manual';
    if (filename.endsWith('.md') || lower.includes('doc')) return 'documentation';
    
    // Analyze content for test type indicators
    if (content.includes('describe') || content.includes('it(') || content.includes('test(')) return 'unit';
    if (dependencies.some(dep => dep.includes('selenium') || dep.includes('playwright'))) return 'e2e';
    
    return 'integration'; // Default for most test files
  }

  /**
   * Extract tags from filename and content
   */
  private extractTags(filename: string, content: string, dependencies: string[]): string[] {
    const tags = new Set<string>();
    
    // Tags from filename
    const filenameParts = filename.toLowerCase().replace(/\.[^.]+$/, '').split('-');
    filenameParts.forEach(part => {
      if (part !== 'test' && part.length > 2) {
        tags.add(part);
      }
    });

    // Tags from dependencies
    dependencies.forEach(dep => {
      if (dep.includes('electron')) tags.add('electron');
      if (dep.includes('mcp')) tags.add('mcp');
      if (dep.includes('workflow')) tags.add('workflow');
      if (dep.includes('excel')) tags.add('excel');
    });

    // Tags from content analysis
    const contentLower = content.toLowerCase();
    if (contentLower.includes('websocket')) tags.add('websocket');
    if (contentLower.includes('async')) tags.add('async');
    if (contentLower.includes('api')) tags.add('api');
    if (contentLower.includes('ui')) tags.add('ui');

    return Array.from(tags);
  }

  /**
   * Format discovery results
   */
  private formatDiscoveryResult(): TestDiscoveryResult {
    const tests = Array.from(this.testFiles.values());
    const categories = Array.from(this.categories.values());

    // Calculate statistics
    const stats = {
      totalFiles: tests.length,
      byType: tests.reduce((acc, test) => {
        acc[test.type] = (acc[test.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byCategory: tests.reduce((acc, test) => {
        acc[test.category.id] = (acc[test.category.id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byStatus: tests.reduce((acc, test) => {
        acc[test.metadata.status] = (acc[test.metadata.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    return {
      success: true,
      tests,
      categories,
      stats
    };
  }

  /**
   * Get all tests
   */
  async listAllTests(): Promise<TestFileInfo[]> {
    if (this.testFiles.size === 0) {
      await this.discoverTestFiles();
    }
    return Array.from(this.testFiles.values());
  }

  /**
   * Get tests by category
   */
  async getTestsByCategory(categoryId: string): Promise<TestFileInfo[]> {
    const tests = await this.listAllTests();
    return tests.filter(test => test.category.id === categoryId);
  }

  /**
   * Get test details by ID
   */
  async getTestDetails(testId: string): Promise<TestFileInfo | null> {
    if (this.testFiles.size === 0) {
      await this.discoverTestFiles();
    }
    return this.testFiles.get(testId) || null;
  }

  /**
   * Search tests with filters
   */
  async searchTests(options: TestSearchOptions): Promise<TestFileInfo[]> {
    const tests = await this.listAllTests();
    let filtered = tests;

    // Apply filters
    if (options.query) {
      const query = options.query.toLowerCase();
      filtered = filtered.filter(test => 
        test.name.toLowerCase().includes(query) ||
        test.description?.toLowerCase().includes(query) ||
        test.filename.toLowerCase().includes(query) ||
        test.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (options.category) {
      filtered = filtered.filter(test => test.category.id === options.category);
    }

    if (options.type) {
      filtered = filtered.filter(test => test.type === options.type);
    }

    if (options.status) {
      filtered = filtered.filter(test => test.metadata.status === options.status);
    }

    if (options.tags && options.tags.length > 0) {
      filtered = filtered.filter(test => 
        options.tags!.some(tag => test.tags.includes(tag))
      );
    }

    // Apply sorting
    if (options.sortBy) {
      filtered.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (options.sortBy) {
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'modified':
            aValue = a.metadata.lastModified?.getTime() || 0;
            bValue = b.metadata.lastModified?.getTime() || 0;
            break;
          case 'category':
            aValue = a.category.name.toLowerCase();
            bValue = b.category.name.toLowerCase();
            break;
          case 'complexity':
            const complexityOrder = { simple: 0, medium: 1, complex: 2 };
            aValue = complexityOrder[a.metadata.complexity];
            bValue = complexityOrder[b.metadata.complexity];
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return options.sortOrder === 'desc' ? 1 : -1;
        if (aValue > bValue) return options.sortOrder === 'desc' ? -1 : 1;
        return 0;
      });
    }

    return filtered;
  }

  /**
   * Get test execution status (mock implementation)
   */
  async getTestStatus(testId: string): Promise<{
    status: 'idle' | 'running' | 'passed' | 'failed';
    lastRun?: Date;
    duration?: number;
    error?: string;
  }> {
    // This would integrate with actual test runner in real implementation
    return {
      status: 'idle',
      lastRun: undefined,
      duration: undefined
    };
  }

  /**
   * Enable hot-reloading for development
   */
  enableHotReload(): void {
    if (this.watchMode) return;
    
    this.watchMode = true;
    console.log('🔥 Hot reload enabled for test discovery');
    
    // In real implementation, would watch file system changes
    // For now, just refresh periodically
    setInterval(async () => {
      if (this.watchMode) {
        await this.discoverTestFiles(true);
      }
    }, 5000);
  }

  /**
   * Disable hot-reloading
   */
  disableHotReload(): void {
    this.watchMode = false;
    if (this.fileWatcher) {
      // Would cleanup file system watchers here
      this.fileWatcher = null;
    }
    console.log('❄️ Hot reload disabled for test discovery');
  }

  /**
   * Get available categories
   */
  getCategories(): TestCategory[] {
    return Array.from(this.categories.values());
  }

  /**
   * Get discovery statistics
   */
  getStats(): TestDiscoveryResult['stats'] {
    const tests = Array.from(this.testFiles.values());
    return {
      totalFiles: tests.length,
      byType: tests.reduce((acc, test) => {
        acc[test.type] = (acc[test.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byCategory: tests.reduce((acc, test) => {
        acc[test.category.id] = (acc[test.category.id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byStatus: tests.reduce((acc, test) => {
        acc[test.metadata.status] = (acc[test.metadata.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  /**
   * Refresh test discovery
   */
  async refresh(): Promise<TestDiscoveryResult> {
    return await this.discoverTestFiles(true);
  }

  /**
   * Reset service state
   */
  reset(): void {
    this.testFiles.clear();
    this.lastScanTime = null;
    this.disableHotReload();
    console.log('🔄 Test discovery service reset');
  }
}

// Export singleton instance
export const testDiscoveryService = new TestDiscoveryService();

// Export hook for React components
export function useTestDiscovery() {
  return {
    discoverTestFiles: (forceRefresh?: boolean) => testDiscoveryService.discoverTestFiles(forceRefresh),
    listAllTests: () => testDiscoveryService.listAllTests(),
    getTestsByCategory: (categoryId: string) => testDiscoveryService.getTestsByCategory(categoryId),
    getTestDetails: (testId: string) => testDiscoveryService.getTestDetails(testId),
    searchTests: (options: TestSearchOptions) => testDiscoveryService.searchTests(options),
    getTestStatus: (testId: string) => testDiscoveryService.getTestStatus(testId),
    getCategories: () => testDiscoveryService.getCategories(),
    getStats: () => testDiscoveryService.getStats(),
    enableHotReload: () => testDiscoveryService.enableHotReload(),
    disableHotReload: () => testDiscoveryService.disableHotReload(),
    refresh: () => testDiscoveryService.refresh(),
    reset: () => testDiscoveryService.reset()
  };
}
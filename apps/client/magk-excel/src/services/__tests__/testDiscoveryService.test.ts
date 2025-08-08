/**
 * Test Discovery Service Test Suite
 * Comprehensive tests for test file discovery and management functionality
 */

import { testDiscoveryService, TestFileInfo, TestSearchOptions } from '../testDiscoveryService';

// Mock electron API
const mockElectronAPI = {
  readDirectory: jest.fn(),
  readFile: jest.fn(),
  fileAPI: {
    readDirectory: jest.fn(),
    readFile: jest.fn(),
  }
};

// Mock window.electronAPI
Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true
});

describe('TestDiscoveryService', () => {
  beforeEach(() => {
    // Reset mocks and service state
    jest.clearAllMocks();
    testDiscoveryService.reset();
  });

  describe('discoverTestFiles', () => {
    it('should discover test files using predefined list when Electron API fails', async () => {
      mockElectronAPI.readDirectory.mockRejectedValue(new Error('Directory not found'));
      
      const result = await testDiscoveryService.discoverTestFiles();
      
      expect(result.success).toBe(true);
      expect(result.tests.length).toBeGreaterThan(0);
      expect(result.categories.length).toBeGreaterThan(0);
      expect(result.stats.totalFiles).toBeGreaterThan(0);
    });

    it('should categorize tests correctly based on filename', async () => {
      const result = await testDiscoveryService.discoverTestFiles();
      
      // Check for specific categorizations
      const chatTests = result.tests.filter(test => test.category.id === 'chat');
      const excelTests = result.tests.filter(test => test.category.id === 'excel');
      const mcpTests = result.tests.filter(test => test.category.id === 'mcp');
      const workflowTests = result.tests.filter(test => test.category.id === 'workflow');
      
      expect(chatTests.length).toBeGreaterThan(0);
      expect(excelTests.length).toBeGreaterThan(0);
      expect(mcpTests.length).toBeGreaterThan(0);
      expect(workflowTests.length).toBeGreaterThan(0);
    });

    it('should extract proper metadata for different file types', async () => {
      const result = await testDiscoveryService.discoverTestFiles();
      
      // Check HTML files
      const htmlTests = result.tests.filter(test => test.type === 'html');
      expect(htmlTests.length).toBeGreaterThan(0);
      htmlTests.forEach(test => {
        expect(test.filename).toMatch(/\.html$/);
        expect(test.title).toBeDefined();
        expect(test.metadata.testType).toBeDefined();
      });

      // Check JS files
      const jsTests = result.tests.filter(test => test.type === 'js');
      expect(jsTests.length).toBeGreaterThan(0);
      jsTests.forEach(test => {
        expect(test.filename).toMatch(/\.js$/);
        expect(test.title).toBeDefined();
        expect(test.metadata.testType).toBeDefined();
      });
    });

    it('should assess complexity correctly', async () => {
      const result = await testDiscoveryService.discoverTestFiles();
      
      // Find tests with different complexity levels
      const simpleTests = result.tests.filter(test => test.metadata.complexity === 'simple');
      const mediumTests = result.tests.filter(test => test.metadata.complexity === 'medium');
      const complexTests = result.tests.filter(test => test.metadata.complexity === 'complex');
      
      expect(simpleTests.length + mediumTests.length + complexTests.length).toBe(result.tests.length);
      
      // Complex tests should typically have more indicators
      complexTests.forEach(test => {
        expect(
          test.filename.includes('complete') || 
          test.filename.includes('integration') || 
          test.filename.includes('full')
        ).toBeTruthy();
      });
    });
  });

  describe('searchTests', () => {
    beforeEach(async () => {
      await testDiscoveryService.discoverTestFiles();
    });

    it('should filter tests by query string', async () => {
      const allTests = await testDiscoveryService.listAllTests();
      const searchResult = await testDiscoveryService.searchTests({ query: 'chat' });
      
      expect(searchResult.length).toBeLessThanOrEqual(allTests.length);
      searchResult.forEach(test => {
        const matchesQuery = 
          test.name.toLowerCase().includes('chat') ||
          test.description?.toLowerCase().includes('chat') ||
          test.filename.toLowerCase().includes('chat') ||
          test.tags.some(tag => tag.toLowerCase().includes('chat'));
        expect(matchesQuery).toBe(true);
      });
    });

    it('should filter tests by category', async () => {
      const chatTests = await testDiscoveryService.searchTests({ category: 'chat' });
      
      chatTests.forEach(test => {
        expect(test.category.id).toBe('chat');
      });
    });

    it('should filter tests by type', async () => {
      const htmlTests = await testDiscoveryService.searchTests({ type: 'html' });
      
      htmlTests.forEach(test => {
        expect(test.type).toBe('html');
      });
    });

    it('should filter tests by status', async () => {
      const activeTests = await testDiscoveryService.searchTests({ status: 'active' });
      
      activeTests.forEach(test => {
        expect(test.metadata.status).toBe('active');
      });
    });

    it('should filter tests by tags', async () => {
      const taggedTests = await testDiscoveryService.searchTests({ tags: ['api'] });
      
      taggedTests.forEach(test => {
        expect(test.tags).toContain('api');
      });
    });

    it('should sort tests correctly', async () => {
      const nameAscTests = await testDiscoveryService.searchTests({ 
        sortBy: 'name', 
        sortOrder: 'asc' 
      });
      
      const nameDescTests = await testDiscoveryService.searchTests({ 
        sortBy: 'name', 
        sortOrder: 'desc' 
      });
      
      expect(nameAscTests.length).toBeGreaterThan(0);
      expect(nameDescTests.length).toBeGreaterThan(0);
      
      // Check sorting order
      for (let i = 0; i < nameAscTests.length - 1; i++) {
        expect(nameAscTests[i].name.toLowerCase()).toBeLessThanOrEqual(
          nameAscTests[i + 1].name.toLowerCase()
        );
      }
      
      for (let i = 0; i < nameDescTests.length - 1; i++) {
        expect(nameDescTests[i].name.toLowerCase()).toBeGreaterThanOrEqual(
          nameDescTests[i + 1].name.toLowerCase()
        );
      }
    });
  });

  describe('getTestsByCategory', () => {
    beforeEach(async () => {
      await testDiscoveryService.discoverTestFiles();
    });

    it('should return tests only from specified category', async () => {
      const chatTests = await testDiscoveryService.getTestsByCategory('chat');
      
      chatTests.forEach(test => {
        expect(test.category.id).toBe('chat');
      });
    });

    it('should return empty array for non-existent category', async () => {
      const nonExistentTests = await testDiscoveryService.getTestsByCategory('non-existent');
      
      expect(nonExistentTests).toEqual([]);
    });
  });

  describe('getTestDetails', () => {
    beforeEach(async () => {
      await testDiscoveryService.discoverTestFiles();
    });

    it('should return test details for valid test ID', async () => {
      const allTests = await testDiscoveryService.listAllTests();
      const firstTest = allTests[0];
      
      const testDetails = await testDiscoveryService.getTestDetails(firstTest.id);
      
      expect(testDetails).toEqual(firstTest);
    });

    it('should return null for invalid test ID', async () => {
      const testDetails = await testDiscoveryService.getTestDetails('non-existent-test');
      
      expect(testDetails).toBeNull();
    });
  });

  describe('getTestStatus', () => {
    it('should return idle status for all tests', async () => {
      await testDiscoveryService.discoverTestFiles();
      const allTests = await testDiscoveryService.listAllTests();
      const firstTest = allTests[0];
      
      const status = await testDiscoveryService.getTestStatus(firstTest.id);
      
      expect(status.status).toBe('idle');
      expect(status.lastRun).toBeUndefined();
      expect(status.duration).toBeUndefined();
    });
  });

  describe('getCategories', () => {
    it('should return all available categories', () => {
      const categories = testDiscoveryService.getCategories();
      
      expect(categories.length).toBeGreaterThan(0);
      
      // Check for specific categories
      const categoryIds = categories.map(cat => cat.id);
      expect(categoryIds).toContain('chat');
      expect(categoryIds).toContain('excel');
      expect(categoryIds).toContain('mcp');
      expect(categoryIds).toContain('workflow');
      expect(categoryIds).toContain('file');
    });

    it('should have proper category structure', () => {
      const categories = testDiscoveryService.getCategories();
      
      categories.forEach(category => {
        expect(category.id).toBeDefined();
        expect(category.name).toBeDefined();
        expect(category.description).toBeDefined();
        expect(category.icon).toBeDefined();
        expect(category.color).toBeDefined();
        expect(category.color).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });
  });

  describe('getStats', () => {
    beforeEach(async () => {
      await testDiscoveryService.discoverTestFiles();
    });

    it('should return accurate statistics', () => {
      const stats = testDiscoveryService.getStats();
      
      expect(stats.totalFiles).toBeGreaterThan(0);
      expect(typeof stats.byType).toBe('object');
      expect(typeof stats.byCategory).toBe('object');
      expect(typeof stats.byStatus).toBe('object');
      
      // Check that sum of type counts equals total files
      const typeSum = Object.values(stats.byType).reduce((sum, count) => sum + count, 0);
      expect(typeSum).toBe(stats.totalFiles);
      
      // Check that sum of category counts equals total files
      const categorySum = Object.values(stats.byCategory).reduce((sum, count) => sum + count, 0);
      expect(categorySum).toBe(stats.totalFiles);
      
      // Check that sum of status counts equals total files
      const statusSum = Object.values(stats.byStatus).reduce((sum, count) => sum + count, 0);
      expect(statusSum).toBe(stats.totalFiles);
    });
  });

  describe('hot reload functionality', () => {
    it('should enable and disable hot reload correctly', () => {
      // Enable hot reload
      testDiscoveryService.enableHotReload();
      expect(testDiscoveryService['watchMode']).toBe(true);
      
      // Disable hot reload
      testDiscoveryService.disableHotReload();
      expect(testDiscoveryService['watchMode']).toBe(false);
    });
  });

  describe('refresh functionality', () => {
    it('should refresh test discovery', async () => {
      const initialResult = await testDiscoveryService.discoverTestFiles();
      const refreshResult = await testDiscoveryService.refresh();
      
      expect(refreshResult.success).toBe(true);
      expect(refreshResult.tests.length).toBe(initialResult.tests.length);
    });
  });

  describe('reset functionality', () => {
    it('should reset service state', async () => {
      await testDiscoveryService.discoverTestFiles();
      const statsBeforeReset = testDiscoveryService.getStats();
      expect(statsBeforeReset.totalFiles).toBeGreaterThan(0);
      
      testDiscoveryService.reset();
      
      const statsAfterReset = testDiscoveryService.getStats();
      expect(statsAfterReset.totalFiles).toBe(0);
    });
  });

  describe('file content parsing', () => {
    it('should handle files with Electron API content', async () => {
      const mockHtmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Test Chat API - Complete Flow</title>
        </head>
        <body>
          <!-- This is a test for chat functionality -->
          <script>
            import { ChatService } from './chatService.js';
            import { MCPManager } from './mcpManager.js';
          </script>
        </body>
        </html>
      `;
      
      mockElectronAPI.readFile.mockResolvedValue(mockHtmlContent);
      mockElectronAPI.readDirectory.mockResolvedValue(['test-chat-api.html']);
      
      const result = await testDiscoveryService.discoverTestFiles(true);
      
      expect(result.success).toBe(true);
      const chatTest = result.tests.find(test => test.filename === 'test-chat-api.html');
      expect(chatTest).toBeDefined();
      expect(chatTest?.title).toBe('Test Chat API - Complete Flow');
      expect(chatTest?.category.id).toBe('chat');
    });

    it('should handle JavaScript files with proper parsing', async () => {
      const mockJsContent = `
        /**
         * Test script to verify MCP server integration
         * This test checks MCP connectivity and tool listing
         */
        import { MCPManager } from '../electron/mcp-manager.js';
        
        async function testMCPIntegration() {
          console.log('Testing MCP Integration...');
          const mcpManager = new MCPManager();
        }
      `;
      
      mockElectronAPI.readFile.mockResolvedValue(mockJsContent);
      mockElectronAPI.readDirectory.mockResolvedValue(['test-mcp-integration.js']);
      
      const result = await testDiscoveryService.discoverTestFiles(true);
      
      expect(result.success).toBe(true);
      const mcpTest = result.tests.find(test => test.filename === 'test-mcp-integration.js');
      expect(mcpTest).toBeDefined();
      expect(mcpTest?.title).toBe('Test script to verify MCP server integration');
      expect(mcpTest?.category.id).toBe('mcp');
      expect(mcpTest?.metadata.dependencies).toContain('../electron/mcp-manager.js');
    });
  });

  describe('error handling', () => {
    it('should handle discovery errors gracefully', async () => {
      // Simulate error in discovery process
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // Mock catastrophic failure
      mockElectronAPI.readDirectory.mockImplementation(() => {
        throw new Error('Catastrophic failure');
      });
      
      const result = await testDiscoveryService.discoverTestFiles(true);
      
      // Should still return valid structure with error
      expect(result.success).toBe(true); // Falls back to predefined list
      expect(result.tests).toBeDefined();
      expect(result.categories).toBeDefined();
      expect(result.stats).toBeDefined();
      
      console.error = originalConsoleError;
    });
  });
});

describe('useTestDiscovery hook', () => {
  it('should provide all service methods', () => {
    const { useTestDiscovery } = require('../testDiscoveryService');
    const hook = useTestDiscovery();
    
    expect(hook.discoverTestFiles).toBeDefined();
    expect(hook.listAllTests).toBeDefined();
    expect(hook.getTestsByCategory).toBeDefined();
    expect(hook.getTestDetails).toBeDefined();
    expect(hook.searchTests).toBeDefined();
    expect(hook.getTestStatus).toBeDefined();
    expect(hook.getCategories).toBeDefined();
    expect(hook.getStats).toBeDefined();
    expect(hook.enableHotReload).toBeDefined();
    expect(hook.disableHotReload).toBeDefined();
    expect(hook.refresh).toBeDefined();
    expect(hook.reset).toBeDefined();
    
    expect(typeof hook.discoverTestFiles).toBe('function');
    expect(typeof hook.listAllTests).toBe('function');
    expect(typeof hook.getTestsByCategory).toBe('function');
    expect(typeof hook.getTestDetails).toBe('function');
    expect(typeof hook.searchTests).toBe('function');
    expect(typeof hook.getTestStatus).toBe('function');
    expect(typeof hook.getCategories).toBe('function');
    expect(typeof hook.getStats).toBe('function');
    expect(typeof hook.enableHotReload).toBe('function');
    expect(typeof hook.disableHotReload).toBe('function');
    expect(typeof hook.refresh).toBe('function');
    expect(typeof hook.reset).toBe('function');
  });
});
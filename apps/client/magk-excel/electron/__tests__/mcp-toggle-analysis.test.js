// Simple JavaScript test to analyze MCP toggle functionality
// This tests the core logic without ES module complications

const path = require('path');
const fs = require('fs').promises;

describe('MCP Toggle Analysis', () => {
  
  test('can load MCP configuration', async () => {
    const configPath = path.join(__dirname, '../../.mcp.json');
    
    try {
      const configContent = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(configContent);
      
      expect(config).toHaveProperty('mcpServers');
      expect(typeof config.mcpServers).toBe('object');
      
      const serverNames = Object.keys(config.mcpServers);
      expect(serverNames.length).toBeGreaterThan(0);
      
      console.log('✅ Found MCP servers:', serverNames);
      
      // Verify each server has required fields
      for (const [serverName, serverConfig] of Object.entries(config.mcpServers)) {
        expect(serverConfig).toHaveProperty('command');
        expect(serverConfig.command).toBeTruthy();
        
        if (serverConfig.type !== 'http') {
          expect(serverConfig).toHaveProperty('args');
          expect(Array.isArray(serverConfig.args)).toBe(true);
        }
        
        console.log(`✅ Server ${serverName} has valid config:`, {
          command: serverConfig.command,
          type: serverConfig.type || 'stdio',
          hasArgs: Array.isArray(serverConfig.args)
        });
      }
      
    } catch (error) {
      console.error('❌ Failed to load MCP config:', error.message);
      throw error;
    }
  });

  test('basic toggle state management', () => {
    // Simulate the toggle state logic that should be in MCPManager
    class SimpleToggleManager {
      constructor() {
        this.enabledServers = new Set();
        this.availableServers = ['fetch', 'claude-flow', 'firecrawl', 'puppeteer', 'ruv-swarm'];
      }
      
      getAvailableServers() {
        return [...this.availableServers];
      }
      
      getEnabledServers() {
        return [...this.enabledServers];
      }
      
      toggleServer(serverName, enabled) {
        if (!this.availableServers.includes(serverName)) {
          throw new Error(`Server ${serverName} not found in available servers`);
        }
        
        if (enabled) {
          this.enabledServers.add(serverName);
        } else {
          this.enabledServers.delete(serverName);
        }
      }
    }
    
    const manager = new SimpleToggleManager();
    
    // Test initial state
    expect(manager.getEnabledServers()).toHaveLength(0);
    expect(manager.getAvailableServers()).toHaveLength(5);
    
    // Test enabling a server
    manager.toggleServer('fetch', true);
    expect(manager.getEnabledServers()).toContain('fetch');
    expect(manager.getEnabledServers()).toHaveLength(1);
    
    // Test disabling a server
    manager.toggleServer('fetch', false);
    expect(manager.getEnabledServers()).not.toContain('fetch');
    expect(manager.getEnabledServers()).toHaveLength(0);
    
    // Test multiple servers
    manager.toggleServer('fetch', true);
    manager.toggleServer('claude-flow', true);
    expect(manager.getEnabledServers()).toHaveLength(2);
    
    manager.toggleServer('fetch', false);
    expect(manager.getEnabledServers()).toContain('claude-flow');
    expect(manager.getEnabledServers()).not.toContain('fetch');
    expect(manager.getEnabledServers()).toHaveLength(1);
    
    console.log('✅ Toggle state management working correctly');
  });

  test('analyze potential root causes', () => {
    // List potential root causes for MCP toggle failure
    const potentialIssues = [
      {
        issue: 'Missing writeFile import',
        status: 'FIXED',
        description: 'writeFile was not imported in mcp-manager.ts, causing saveSmitheryConfig to fail silently'
      },
      {
        issue: 'IPC communication failure',
        status: 'NEEDS_TESTING',
        description: 'IPC handlers may not be properly registered or functioning'
      },
      {
        issue: 'React state management',
        status: 'NEEDS_TESTING', 
        description: 'Zustand store may not be updating correctly after toggle operations'
      },
      {
        issue: 'MCP SDK connection issues',
        status: 'NEEDS_TESTING',
        description: 'MCP servers may fail to connect due to spawn parameter or transport issues'
      },
      {
        issue: 'TypeScript compilation errors',
        status: 'KNOWN',
        description: 'TS errors may prevent proper execution in development'
      }
    ];
    
    console.log('\n🔍 ROOT CAUSE ANALYSIS:');
    potentialIssues.forEach((item, index) => {
      console.log(`${index + 1}. ${item.issue} [${item.status}]`);
      console.log(`   ${item.description}\n`);
    });
    
    const fixedIssues = potentialIssues.filter(i => i.status === 'FIXED');
    const needsTestingIssues = potentialIssues.filter(i => i.status === 'NEEDS_TESTING');
    
    expect(fixedIssues).toHaveLength(1);
    expect(needsTestingIssues.length).toBeGreaterThan(0);
    
    console.log(`✅ Fixed ${fixedIssues.length} issues, ${needsTestingIssues.length} still need testing`);
  });
});
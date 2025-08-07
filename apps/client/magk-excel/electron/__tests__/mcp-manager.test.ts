import { MCPManager } from '../mcp-manager';
import { readFile } from 'fs/promises';

// Mock the MCP SDK
jest.mock('@modelcontextprotocol/sdk/client/index.js', () => ({
  Client: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
    listTools: jest.fn().mockResolvedValue({ tools: [{ name: 'test-tool', description: 'Test tool' }] }),
    listResources: jest.fn().mockResolvedValue({ resources: [] }),
    callTool: jest.fn().mockResolvedValue({ content: [{ type: 'text', text: 'test result' }] })
  }))
}));

jest.mock('@modelcontextprotocol/sdk/client/stdio.js', () => ({
  StdioClientTransport: jest.fn().mockImplementation(() => ({
    close: jest.fn().mockResolvedValue(undefined)
  }))
}));

jest.mock('@modelcontextprotocol/sdk/client/streamableHttp.js', () => ({
  StreamableHTTPClientTransport: jest.fn().mockImplementation(() => ({
    close: jest.fn().mockResolvedValue(undefined)
  }))
}));

// Mock child_process
jest.mock('child_process', () => ({
  spawn: jest.fn()
}));

// Mock fs/promises
jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
  writeFile: jest.fn().mockResolvedValue(undefined)
}));

const mockReadFile = readFile as jest.MockedFunction<typeof readFile>;

describe('MCPManager', () => {
  let mcpManager: MCPManager;

  beforeEach(() => {
    mcpManager = new MCPManager();
    jest.clearAllMocks();
  });

  describe('Configuration Loading', () => {
    it('should load MCP configuration from .mcp.json', async () => {
      const mockConfig = {
        mcpServers: {
          'test-server': {
            command: 'npx',
            args: ['test-package'],
            type: 'stdio',
            displayName: 'Test Server',
            description: 'Test description'
          }
        }
      };

      mockReadFile.mockResolvedValueOnce(JSON.stringify(mockConfig));

      await mcpManager.loadConfig();

      expect(mockReadFile).toHaveBeenCalledWith(
        expect.stringContaining('.mcp.json'),
        'utf-8'
      );

      const availableServers = mcpManager.getAvailableServers();
      expect(availableServers).toContain('test-server');
    });

    it('should handle missing configuration file gracefully', async () => {
      mockReadFile.mockRejectedValueOnce(new Error('ENOENT: no such file or directory'));

      await expect(mcpManager.loadConfig()).rejects.toThrow();
    });
  });

  describe('Server Toggle Functionality', () => {
    beforeEach(async () => {
      const mockConfig = {
        mcpServers: {
          'fetch': {
            command: 'npx',
            args: ['mcp-server-fetch'],
            type: 'stdio',
            displayName: 'Fetch API',
            description: 'HTTP requests and API calling'
          },
          'claude-flow': {
            command: 'npx',
            args: ['claude-flow@alpha', 'mcp', 'start'],
            type: 'stdio',
            displayName: 'Claude Flow',
            description: 'Workflow automation and orchestration tools'
          }
        }
      };

      mockReadFile.mockResolvedValueOnce(JSON.stringify(mockConfig));
      await mcpManager.loadConfig();
    });

    it('should enable server when toggled on', async () => {
      const serverName = 'fetch';
      
      // Initially no servers should be enabled
      expect(mcpManager.getEnabledServers()).toHaveLength(0);
      
      // Toggle server on
      await mcpManager.toggleServer(serverName, true);
      
      // Server should now be enabled
      const enabledServers = mcpManager.getEnabledServers();
      expect(enabledServers).toContain(serverName);
      expect(enabledServers).toHaveLength(1);
    });

    it('should disable server when toggled off', async () => {
      const serverName = 'fetch';
      
      // Enable server first
      await mcpManager.toggleServer(serverName, true);
      expect(mcpManager.getEnabledServers()).toContain(serverName);
      
      // Toggle server off
      await mcpManager.toggleServer(serverName, false);
      
      // Server should no longer be enabled
      const enabledServers = mcpManager.getEnabledServers();
      expect(enabledServers).not.toContain(serverName);
      expect(enabledServers).toHaveLength(0);
    });

    it('should handle multiple server toggles correctly', async () => {
      const server1 = 'fetch';
      const server2 = 'claude-flow';
      
      // Enable both servers
      await mcpManager.toggleServer(server1, true);
      await mcpManager.toggleServer(server2, true);
      
      let enabledServers = mcpManager.getEnabledServers();
      expect(enabledServers).toContain(server1);
      expect(enabledServers).toContain(server2);
      expect(enabledServers).toHaveLength(2);
      
      // Disable one server
      await mcpManager.toggleServer(server1, false);
      
      enabledServers = mcpManager.getEnabledServers();
      expect(enabledServers).not.toContain(server1);
      expect(enabledServers).toContain(server2);
      expect(enabledServers).toHaveLength(1);
    });

    it('should not change state when toggling to same state', async () => {
      const serverName = 'fetch';
      
      // Server starts disabled
      expect(mcpManager.getEnabledServers()).not.toContain(serverName);
      
      // Toggle off when already disabled (should be no-op)
      await mcpManager.toggleServer(serverName, false);
      expect(mcpManager.getEnabledServers()).not.toContain(serverName);
      
      // Enable server
      await mcpManager.toggleServer(serverName, true);
      expect(mcpManager.getEnabledServers()).toContain(serverName);
      
      // Toggle on when already enabled (should be no-op)
      await mcpManager.toggleServer(serverName, true);
      expect(mcpManager.getEnabledServers()).toContain(serverName);
      expect(mcpManager.getEnabledServers()).toHaveLength(1);
    });
  });

  describe('Tool and Resource Management', () => {
    beforeEach(async () => {
      const mockConfig = {
        mcpServers: {
          'test-server': {
            command: 'npx',
            args: ['test-package'],
            type: 'stdio',
            displayName: 'Test Server'
          }
        }
      };

      mockReadFile.mockResolvedValueOnce(JSON.stringify(mockConfig));
      await mcpManager.loadConfig();
      await mcpManager.toggleServer('test-server', true);
    });

    it('should list tools from enabled servers', async () => {
      const tools = await mcpManager.listTools();
      
      expect(tools).toHaveLength(1);
      expect(tools[0]).toEqual({
        name: 'test-tool',
        description: 'Test tool',
        server: 'test-server'
      });
    });

    it('should list tools from specific server', async () => {
      const tools = await mcpManager.listTools('test-server');
      
      expect(tools).toHaveLength(1);
      expect(tools[0].name).toBe('test-tool');
    });

    it('should handle tool calls correctly', async () => {
      const result = await mcpManager.callTool('test-server', 'test-tool', { param: 'value' });
      
      expect(result).toEqual({
        content: [{ type: 'text', text: 'test result' }]
      });
    });
  });

  describe('Error Handling', () => {
    it('should throw error for unknown server in toggle', async () => {
      mockReadFile.mockResolvedValueOnce(JSON.stringify({ mcpServers: {} }));
      await mcpManager.loadConfig();
      
      await expect(mcpManager.toggleServer('unknown-server', true))
        .rejects.toThrow('Server unknown-server not found');
    });

    it('should throw error when calling tool on disconnected server', async () => {
      mockReadFile.mockResolvedValueOnce(JSON.stringify({ mcpServers: {} }));
      await mcpManager.loadConfig();
      
      await expect(mcpManager.callTool('unknown-server', 'tool', {}))
        .rejects.toThrow('Not connected to server: unknown-server');
    });
  });
});
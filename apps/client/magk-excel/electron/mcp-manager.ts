import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { spawn } from 'child_process';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface MCPServerConfig {
  command: string;
  args?: string[];
  type?: 'stdio' | 'http';
  env?: Record<string, string>;
  url?: string;
  config?: Record<string, any>;
  isSmithery?: boolean;
  qualifiedName?: string;
  displayName?: string;
  description?: string;
}

export interface MCPServersConfig {
  mcpServers: Record<string, MCPServerConfig>;
}

export class MCPManager {
  private clients: Map<string, Client> = new Map();
  private transports: Map<string, StdioClientTransport | StreamableHTTPClientTransport> = new Map();
  private config: MCPServersConfig | null = null;
  private enabledServers: Set<string> = new Set();
  private smitheryServers: Map<string, MCPServerConfig> = new Map();

  async loadConfig(): Promise<void> {
    try {
      // Look for .mcp.json in the apps/client/magk-excel directory
      const configPath = path.join(__dirname, '../.mcp.json');
      const configContent = await readFile(configPath, 'utf-8');
      this.config = JSON.parse(configContent);
      console.log('✅ MCP config loaded:', this.config);
    } catch (error) {
      console.error('❌ Failed to load MCP config:', error);
      throw error;
    }
  }

  async connectToServer(serverName: string): Promise<void> {
    // Check if it's a static config server
    const staticServer = this.config?.mcpServers[serverName];
    // Check if it's a Smithery server
    const smitheryServer = this.smitheryServers.get(serverName);
    
    const serverConfig = staticServer || smitheryServer;
    
    if (!serverConfig) {
      throw new Error(`Server ${serverName} not found in config or Smithery registry`);
    }
    
    // If already connected, don't reconnect
    if (this.enabledServers.has(serverName)) {
      console.log(`⚠️ Server ${serverName} already connected`);
      return;
    }
    
    try {
      console.log(`🔌 Attempting to connect to MCP server: ${serverName} (${serverConfig.type || 'stdio'})`);
      
      let transport: StdioClientTransport | StreamableHTTPClientTransport;
      
      // Create appropriate transport based on server type
      if (serverConfig.type === 'http' || serverConfig.url) {
        // HTTP transport for Smithery hosted servers
        if (!serverConfig.url) {
          throw new Error(`HTTP server ${serverName} missing URL`);
        }
        console.log(`🌐 Using HTTP transport for ${serverName}: ${serverConfig.url}`);
        transport = new StreamableHTTPClientTransport(new URL(serverConfig.url));
      } else {
        // Default to stdio transport for local servers
        const cleanEnv: Record<string, string> = {};
        if (process.env) {
          Object.entries(process.env).forEach(([key, value]) => {
            if (value !== undefined) {
              cleanEnv[key] = value;
            }
          });
        }
        if (serverConfig.env) {
          Object.entries(serverConfig.env).forEach(([key, value]) => {
            cleanEnv[key] = value;
          });
        }
        
        console.log(`💻 Using stdio transport for ${serverName}: ${serverConfig.command} ${(serverConfig.args || []).join(' ')}`);
        
        transport = new StdioClientTransport({
          command: serverConfig.command,
          args: serverConfig.args || [],
          env: cleanEnv
        });
      }

      // Create client
      const client = new Client({
        name: `magk-excel-${serverName}`,
        version: '1.0.0'
      });

      // Connect with shorter timeout to fail fast
      console.log(`⏱️ Connecting to ${serverName} with 10 second timeout...`);
      const connectPromise = client.connect(transport);
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error(`Connection timeout after 10 seconds - ${serverName} may not be installed or available`)), 10000)
      );
      
      await Promise.race([connectPromise, timeoutPromise]);
      
      // Store references
      this.clients.set(serverName, client);
      this.transports.set(serverName, transport);
      this.enabledServers.add(serverName);

      console.log(`✅ Successfully connected to MCP server: ${serverName}`);
      
      // List available tools
      try {
        const tools = await client.listTools();
        console.log(`📋 Available tools from ${serverName}: ${tools.tools?.length || 0} tools`);
      } catch (toolError) {
        console.warn(`⚠️ Could not list tools from ${serverName}:`, toolError);
      }
    } catch (error) {
      console.error(`❌ Failed to connect to ${serverName}:`, error);
      
      // Clean up any partial connections
      this.clients.delete(serverName);
      this.transports.delete(serverName);
      this.enabledServers.delete(serverName);
      
      // Re-throw with more helpful error message
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          throw new Error(`${serverName} connection timeout - package may not be installed. Try: npm install -g ${serverConfig.args?.[0] || serverConfig.command}`);
        } else if (error.message.includes('ENOENT')) {
          throw new Error(`${serverName} command not found - ensure ${serverConfig.command} is installed`);
        } else {
          throw new Error(`${serverName} connection failed: ${error.message}`);
        }
      }
      throw error;
    }
  }

  async disconnectFromServer(serverName: string): Promise<void> {
    const client = this.clients.get(serverName);
    const transport = this.transports.get(serverName);

    if (client || transport) {
      try {
        console.log(`🔌 Disconnecting from MCP server: ${serverName}`);
        
        if (client) {
          await client.close();
        }
        if (transport) {
          await transport.close();
        }
        
        this.clients.delete(serverName);
        this.transports.delete(serverName);
        this.enabledServers.delete(serverName);
        
        console.log(`✅ Successfully disconnected from MCP server: ${serverName}`);
      } catch (error) {
        console.warn(`⚠️ Error during disconnect from ${serverName}:`, error);
        
        // Still clean up references even if disconnect failed
        this.clients.delete(serverName);
        this.transports.delete(serverName);
        this.enabledServers.delete(serverName);
      }
    } else {
      console.log(`⚠️ Server ${serverName} was not connected`);
    }
  }

  async toggleServer(serverName: string, enabled: boolean): Promise<void> {
    console.log(`🔄 Toggle request: ${serverName} -> ${enabled ? 'ON' : 'OFF'}`);
    
    try {
      if (enabled && !this.enabledServers.has(serverName)) {
        console.log(`📤 Enabling server: ${serverName}`);
        await this.connectToServer(serverName);
      } else if (!enabled && this.enabledServers.has(serverName)) {
        console.log(`📥 Disabling server: ${serverName}`);
        await this.disconnectFromServer(serverName);
      } else {
        console.log(`⚠️ Server ${serverName} already in desired state (${enabled ? 'enabled' : 'disabled'})`);
      }
      
      console.log(`✅ Toggle completed for ${serverName}. Enabled servers: [${Array.from(this.enabledServers).join(', ')}]`);
    } catch (error) {
      console.error(`❌ Toggle failed for ${serverName}:`, error);
      throw error;
    }
  }

  async callTool(serverName: string, toolName: string, args: any): Promise<any> {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`Not connected to server: ${serverName}`);
    }

    try {
      console.log(`🛠️ Calling tool ${toolName} on ${serverName} with args:`, args);
      const result = await client.callTool({
        name: toolName,
        arguments: args
      });
      console.log(`✅ Tool result:`, result);
      return result;
    } catch (error) {
      console.error(`❌ Tool call failed:`, error);
      throw error;
    }
  }

  async listTools(serverName?: string): Promise<any[]> {
    if (serverName) {
      const client = this.clients.get(serverName);
      if (!client) {
        throw new Error(`Not connected to server: ${serverName}`);
      }
      const tools = await client.listTools();
      return tools.tools || [];
    }

    // List all tools from all connected servers
    const allTools = [];
    for (const [name, client] of this.clients) {
      const tools = await client.listTools();
      for (const tool of (tools.tools || [])) {
        allTools.push({
          ...tool,
          server: name
        });
      }
    }
    return allTools;
  }

  async listResources(serverName?: string): Promise<any[]> {
    if (serverName) {
      const client = this.clients.get(serverName);
      if (!client) {
        throw new Error(`Not connected to server: ${serverName}`);
      }
      const resources = await client.listResources();
      return resources.resources || [];
    }

    // List all resources from all connected servers
    const allResources = [];
    for (const [name, client] of this.clients) {
      const resources = await client.listResources();
      for (const resource of (resources.resources || [])) {
        allResources.push({
          ...resource,
          server: name
        });
      }
    }
    return allResources;
  }

  async readResource(serverName: string, uri: string): Promise<any> {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`Not connected to server: ${serverName}`);
    }

    const result = await client.readResource({ uri });
    return result;
  }

  getEnabledServers(): string[] {
    return Array.from(this.enabledServers);
  }

  getAvailableServers(): string[] {
    const staticServers = this.config ? Object.keys(this.config.mcpServers) : [];
    const smitheryServerNames = Array.from(this.smitheryServers.keys());
    return [...staticServers, ...smitheryServerNames];
  }

  /**
   * Add a Smithery server to the available servers
   */
  async addSmitheryServer(serverName: string, config: MCPServerConfig): Promise<void> {
    console.log(`📝 Adding Smithery server: ${serverName}`);
    
    // Validate required fields for Smithery servers
    if (config.isSmithery && !config.url) {
      throw new Error(`Smithery server ${serverName} must have a URL`);
    }
    
    // Store in Smithery servers map
    this.smitheryServers.set(serverName, {
      ...config,
      isSmithery: true,
      type: config.type || 'http'
    });
    
    // Persist to smithery config file
    await this.saveSmitheryConfig();
    
    console.log(`✅ Added Smithery server: ${serverName}`);
  }

  /**
   * Remove a Smithery server
   */
  async removeSmitheryServer(serverName: string): Promise<void> {
    console.log(`🗑️ Removing Smithery server: ${serverName}`);
    
    // Disconnect if currently connected
    if (this.enabledServers.has(serverName)) {
      await this.disconnectFromServer(serverName);
    }
    
    // Remove from map
    this.smitheryServers.delete(serverName);
    
    // Persist changes
    await this.saveSmitheryConfig();
    
    console.log(`✅ Removed Smithery server: ${serverName}`);
  }

  /**
   * Get server configuration (static or Smithery)
   */
  getServerConfig(serverName: string): MCPServerConfig | undefined {
    return this.config?.mcpServers[serverName] || this.smitheryServers.get(serverName);
  }

  /**
   * Check if server is from Smithery
   */
  isSmitheryServer(serverName: string): boolean {
    return this.smitheryServers.has(serverName);
  }

  /**
   * Get all Smithery servers
   */
  getSmitheryServers(): Record<string, MCPServerConfig> {
    const result: Record<string, MCPServerConfig> = {};
    for (const [name, config] of this.smitheryServers) {
      result[name] = config;
    }
    return result;
  }

  /**
   * Load Smithery servers from config file
   */
  private async loadSmitheryConfig(): Promise<void> {
    try {
      const configPath = path.join(__dirname, '../.smithery.json');
      const configContent = await readFile(configPath, 'utf-8');
      const smitheryConfig = JSON.parse(configContent);
      
      if (smitheryConfig.smitheryServers) {
        for (const [name, config] of Object.entries(smitheryConfig.smitheryServers)) {
          this.smitheryServers.set(name, config as MCPServerConfig);
        }
        console.log(`✅ Loaded ${this.smitheryServers.size} Smithery servers`);
      }
    } catch (error) {
      // File doesn't exist or is invalid - that's OK, we'll create it when needed
      console.log('📝 No existing Smithery config found, will create when needed');
    }
  }

  /**
   * Save Smithery servers to config file
   */
  private async saveSmitheryConfig(): Promise<void> {
    try {
      const configPath = path.join(__dirname, '../.smithery.json');
      const smitheryConfig = {
        smitheryServers: this.getSmitheryServers(),
        lastUpdated: new Date().toISOString()
      };
      
      await writeFile(configPath, JSON.stringify(smitheryConfig, null, 2));
      console.log('💾 Saved Smithery configuration');
    } catch (error) {
      console.error('❌ Failed to save Smithery config:', error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    console.log('🔌 Shutting down all MCP connections...');
    for (const serverName of this.enabledServers) {
      await this.disconnectFromServer(serverName);
    }
  }

  /**
   * Initialize the MCP manager including loading Smithery servers
   */
  async initialize(): Promise<void> {
    await this.loadConfig();
    await this.loadSmitheryConfig();
  }
}

// Create singleton instance
export const mcpManager = new MCPManager();
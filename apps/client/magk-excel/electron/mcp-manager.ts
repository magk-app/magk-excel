import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { excelMCPTool, ExcelMCPTool } from '../src/services/excel/ExcelMCPTool';
import { pdfMCPTool, PDFMCPTool } from '../src/services/pdf/PDFMCPTool';
import { persistenceMCPTool, PersistenceAccessTool } from '../src/services/persistence/PersistenceMCPTool';
import { filesystemMCPTool, FilesystemMCPTool } from '../src/services/persistence/FilesystemMCPTool';

function getModuleDir(): string {
  if (typeof __dirname === 'string') {
    return __dirname;
  }

  return path.join(process.env.APP_ROOT ?? process.cwd(), 'dist-electron');
}

export function isAllowedSmitheryUrl(url: unknown): url is string {
  if (typeof url !== 'string') {
    return false;
  }

  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'https:' &&
      parsedUrl.hostname === 'server.smithery.ai' &&
      !parsedUrl.username &&
      !parsedUrl.password;
  } catch {
    return false;
  }
}

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
      const configPath = path.join(getModuleDir(), '../.mcp.json');
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
    const isSmitheryConfig = !staticServer && !!smitheryServer;
    
    const serverConfig = staticServer || smitheryServer;
    
    if (!serverConfig) {
      throw new Error(`Server ${serverName} not found in config or Smithery registry`);
    }

    if (isSmitheryConfig && !isAllowedSmitheryUrl(serverConfig.url)) {
      throw new Error(`Invalid Smithery URL for server ${serverName}`);
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
      if (isSmitheryConfig || serverConfig.type === 'http' || serverConfig.url) {
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
      // Handle built-in Excel, PDF, Persistence, and Filesystem servers
      if (serverName === 'excel' || serverName === 'pdf' || serverName === 'persistence' || serverName === 'filesystem') {
        if (enabled) {
          this.enabledServers.add(serverName);
          console.log(`✅ Built-in ${serverName} server enabled`);
        } else {
          this.enabledServers.delete(serverName);
          console.log(`✅ Built-in ${serverName} server disabled`);
        }
        return;
      }

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
    // Handle built-in Excel operations
    if (serverName === 'excel' && (toolName.startsWith('excel_') || toolName === 'write_values')) {
      console.log('🔧 Handling built-in Excel operation:', toolName);
      
      // Map write_values to excel_write_to_sheet for compatibility
      const mappedName = toolName === 'write_values' ? 'excel_write_to_sheet' : toolName;
      
      return await excelMCPTool.handleToolCall({
        name: mappedName,
        arguments: args
      });
    }

    // Handle built-in PDF operations
    if (serverName === 'pdf' && toolName.startsWith('pdf_')) {
      console.log('🔧 Handling built-in PDF operation:', toolName);
      return await pdfMCPTool.handleToolCall({
        name: toolName,
        arguments: args
      });
    }

    // Handle built-in Persistence operations
    if (serverName === 'persistence' && toolName.startsWith('persistence_')) {
      console.log('🔧 Handling built-in Persistence operation:', toolName);
      return await persistenceMCPTool.handleToolCall({
        name: toolName,
        arguments: args
      });
    }

    // Handle built-in Filesystem operations
    if (serverName === 'filesystem' && (toolName.startsWith('read_') || toolName.startsWith('write_') || 
                                      toolName.startsWith('list_') || toolName.startsWith('search_') ||
                                      toolName.startsWith('get_') || toolName.startsWith('create_') ||
                                      toolName.startsWith('move_') || toolName.startsWith('copy_') ||
                                      toolName.startsWith('delete_'))) {
      console.log('🔧 Handling built-in Filesystem operation:', toolName);
      return await FilesystemMCPTool.handleToolCall({
        name: toolName,
        arguments: args
      });
    }

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
    if (serverName === 'excel') {
      // Return built-in Excel tools
      return ExcelMCPTool.getToolDefinitions().map(tool => ({
        ...tool,
        server: 'excel'
      }));
    }

    if (serverName === 'pdf') {
      // Return built-in PDF tools
      return PDFMCPTool.getToolDefinitions().map(tool => ({
        ...tool,
        server: 'pdf'
      }));
    }

    if (serverName === 'persistence') {
      // Return built-in Persistence tools
      return PersistenceAccessTool.getToolDefinitions().map(tool => ({
        ...tool,
        server: 'persistence'
      }));
    }

    if (serverName === 'filesystem') {
      // Return built-in Filesystem tools
      return FilesystemMCPTool.getToolDefinitions().map(tool => ({
        ...tool,
        server: 'filesystem'
      }));
    }

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
    
    // Add built-in Excel tools
    for (const tool of ExcelMCPTool.getToolDefinitions()) {
      allTools.push({
        ...tool,
        server: 'excel'
      });
    }
    
    // Add built-in PDF tools
    for (const tool of PDFMCPTool.getToolDefinitions()) {
      allTools.push({
        ...tool,
        server: 'pdf'
      });
    }

    // Add built-in Persistence tools
    for (const tool of PersistenceAccessTool.getToolDefinitions()) {
      allTools.push({
        ...tool,
        server: 'persistence'
      });
    }

    // Add built-in Filesystem tools
    for (const tool of FilesystemMCPTool.getToolDefinitions()) {
      allTools.push({
        ...tool,
        server: 'filesystem'
      });
    }
    
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
      
      try {
        const resources = await client.listResources();
        return resources.resources || [];
      } catch (error: any) {
        // Handle servers that don't support resources (MCP error -32601: Method not found)
        if (error.code === -32601) {
          console.log(`📋 Server ${serverName} does not support resources (tools-only server)`);
          return [];
        }
        throw error;
      }
    }

    // List all resources from all connected servers
    const allResources = [];
    for (const [name, client] of this.clients) {
      try {
        const resources = await client.listResources();
        for (const resource of (resources.resources || [])) {
          allResources.push({
            ...resource,
            server: name
          });
        }
      } catch (error: any) {
        // Handle servers that don't support resources
        if (error.code === -32601) {
          console.log(`📋 Server ${name} does not support resources (tools-only server)`);
          continue;
        }
        console.warn(`⚠️ Failed to list resources from ${name}:`, error);
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
    const builtInServers = ['excel', 'pdf', 'persistence']; // Built-in Excel, PDF, and Persistence servers
    const staticServers = this.config ? Object.keys(this.config.mcpServers) : [];
    const smitheryServerNames = Array.from(this.smitheryServers.keys());
    
    // Use a Set to remove duplicates (excel appears in both builtIn and static)
    const allServers = new Set([...builtInServers, ...staticServers, ...smitheryServerNames]);
    return Array.from(allServers);
  }

  /**
   * Add a Smithery server to the available servers
   */
  async addSmitheryServer(serverName: string, config: MCPServerConfig): Promise<void> {
    console.log(`📝 Adding Smithery server: ${serverName}`);
    
    const url = config?.url;
    if (!isAllowedSmitheryUrl(url)) {
      throw new Error(`Smithery server ${serverName} must have a valid HTTPS URL`);
    }

    const sanitizedConfig: MCPServerConfig = {
      command: '',
      type: 'http',
      url,
      isSmithery: true,
    };
    for (const field of ['qualifiedName', 'displayName', 'description'] as const) {
      if (typeof config?.[field] === 'string') {
        sanitizedConfig[field] = config[field];
      }
    }
    if (config?.config !== undefined) {
      sanitizedConfig.config = config.config;
    }

    this.smitheryServers.set(serverName, sanitizedConfig);
    
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
      const configPath = path.join(getModuleDir(), '../.smithery.json');
      const configContent = await readFile(configPath, 'utf-8');
      const smitheryConfig = JSON.parse(configContent);
      
      if (smitheryConfig.smitheryServers) {
        for (const [name, config] of Object.entries(smitheryConfig.smitheryServers)) {
          if (!isAllowedSmitheryUrl((config as MCPServerConfig).url)) {
            console.warn(`⚠️ Skipping Smithery server with invalid URL: ${name}`);
            continue;
          }
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
      const configPath = path.join(getModuleDir(), '../.smithery.json');
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
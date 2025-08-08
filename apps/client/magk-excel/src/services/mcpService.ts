import { create } from 'zustand';
import { MCPServerInfo, MCPTool, MCPResource } from '../electron';
import { smitheryClient, SmitheryServerInfo, SmitheryServerDetails } from './smitheryClient';

interface MCPState {
  // Server management
  availableServers: string[];
  enabledServers: string[];
  isLoading: boolean;
  error: string | null;
  
  // Tools and resources
  tools: MCPTool[];
  resources: MCPResource[];
  
  // Smithery integration
  smitheryServers: SmitheryServerInfo[];
  smitheryLoading: boolean;
  smitheryError: string | null;
  selectedCategory: string | null;
  searchQuery: string;
  
  // Actions
  initialize: () => Promise<void>;
  toggleServer: (serverName: string, enabled: boolean) => Promise<void>;
  loadTools: () => Promise<void>;
  loadResources: () => Promise<void>;
  callTool: (serverName: string, toolName: string, args: any) => Promise<any>;
  readResource: (serverName: string, uri: string) => Promise<any>;
  
  // Smithery actions
  searchSmitheryServers: (query: string) => Promise<void>;
  getPopularServers: () => Promise<void>;
  installSmitheryServer: (qualifiedName: string, config?: Record<string, any>) => Promise<void>;
  removeSmitheryServer: (serverName: string) => Promise<void>;
  getServersByCategory: (category: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string | null) => void;
  
  reset: () => void;
}

export const useMCPStore = create<MCPState>((set, get) => ({
  availableServers: [],
  enabledServers: [],
  isLoading: false,
  error: null,
  tools: [],
  resources: [],
  
  // Smithery state
  smitheryServers: [],
  smitheryLoading: false,
  smitheryError: null,
  selectedCategory: null,
  searchQuery: '',

  initialize: async () => {
    set({ isLoading: true, error: null });
    try {
      const config = await window.mcpAPI.loadConfig();
      
      // Define default servers that should be enabled
      const defaultEnabledServers = ['excel', 'executor', 'persistent', 'filesystem'];
      
      // Merge default enabled servers with config
      const enabledServers = [...new Set([...config.enabledServers, ...defaultEnabledServers])];
      
      set({ 
        availableServers: config.availableServers,
        enabledServers: enabledServers,
        isLoading: false 
      });
      
      // Enable default servers if they're available but not enabled
      for (const serverName of defaultEnabledServers) {
        if (config.availableServers.includes(serverName) && !config.enabledServers.includes(serverName)) {
          try {
            await window.mcpAPI.toggleServer(serverName, true);
            console.log(`✅ Enabled default server: ${serverName}`);
          } catch (error) {
            console.warn(`Failed to enable default server ${serverName}:`, error);
          }
        }
      }
      
      // Load tools and resources after initialization
      await get().loadTools();
      await get().loadResources();
    } catch (error) {
      set({ 
        error: `Failed to initialize MCP: ${error}`,
        isLoading: false 
      });
    }
  },

  toggleServer: async (serverName: string, enabled: boolean) => {
    set({ isLoading: true, error: null });
    try {
      const result = await window.mcpAPI.toggleServer(serverName, enabled);
      set({ 
        enabledServers: result.enabledServers,
        isLoading: false 
      });
      
      // Reload tools and resources after toggling
      await get().loadTools();
      await get().loadResources();
    } catch (error) {
      set({ 
        error: `Failed to toggle server ${serverName}: ${error}`,
        isLoading: false 
      });
    }
  },

  loadTools: async () => {
    try {
      const tools = await window.mcpAPI.listTools();
      set({ tools });
    } catch (error) {
      console.error('Failed to load tools:', error);
    }
  },

  loadResources: async () => {
    try {
      const resources = await window.mcpAPI.listResources();
      set({ resources });
    } catch (error) {
      console.error('Failed to load resources:', error);
    }
  },

  callTool: async (serverName: string, toolName: string, args: any) => {
    set({ error: null });
    try {
      return await window.mcpAPI.callTool(serverName, toolName, args);
    } catch (error) {
      set({ error: `Failed to call tool ${toolName}: ${error}` });
      throw error;
    }
  },

  readResource: async (serverName: string, uri: string) => {
    set({ error: null });
    try {
      return await window.mcpAPI.readResource(serverName, uri);
    } catch (error) {
      set({ error: `Failed to read resource ${uri}: ${error}` });
      throw error;
    }
  },

  // Smithery actions
  searchSmitheryServers: async (query: string) => {
    set({ smitheryLoading: true, smitheryError: null });
    try {
      const response = await smitheryClient.searchServers(query);
      set({ 
        smitheryServers: response.servers,
        smitheryLoading: false,
        searchQuery: query
      });
    } catch (error) {
      set({ 
        smitheryError: `Failed to search servers: ${error}`,
        smitheryLoading: false 
      });
    }
  },

  getPopularServers: async () => {
    set({ smitheryLoading: true, smitheryError: null });
    try {
      const servers = await smitheryClient.getPopularServers();
      set({ 
        smitheryServers: servers,
        smitheryLoading: false 
      });
    } catch (error) {
      set({ 
        smitheryError: `Failed to load popular servers: ${error}`,
        smitheryLoading: false 
      });
    }
  },

  installSmitheryServer: async (qualifiedName: string, config?: Record<string, any>) => {
    set({ smitheryLoading: true, smitheryError: null });
    try {
      console.log(`🚀 Installing Smithery server: ${qualifiedName}`, config);
      
      // Install server through Smithery client
      const result = await smitheryClient.installServer(qualifiedName, config);
      console.log('📦 Smithery install result:', result);
      
      if (!result.success) {
        const errorMsg = result.error || 'Installation failed';
        console.error('❌ Smithery installation failed:', errorMsg);
        throw new Error(errorMsg);
      }
      
      if (!result.connectionUrl) {
        const errorMsg = 'No connection URL provided by Smithery';
        console.error('❌ Missing connection URL:', result);
        throw new Error(errorMsg);
      }
      
      // Generate server name
      const serverName = result.serverInfo.displayName.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
      console.log(`📝 Generated server name: ${serverName}`);
      
      // Prepare server config
      const serverConfig = {
        command: '', // Not used for HTTP servers
        type: 'http' as const,
        url: result.connectionUrl,
        isSmithery: true,
        qualifiedName: qualifiedName,
        displayName: result.serverInfo.displayName,
        description: result.serverInfo.description,
        config: config
      };
      console.log('⚙️ Server config:', serverConfig);
      
      // Add to MCP manager
      console.log('🔌 Adding server to MCP manager...');
      await window.mcpAPI.addSmitheryServer(serverName, serverConfig);
      console.log('✅ Server added to MCP manager');
      
      // Refresh available servers
      console.log('🔄 Refreshing server list...');
      await get().initialize();
      console.log('✅ Server list refreshed');
      
      set({ smitheryLoading: false });
      console.log('🎉 Installation completed successfully');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('❌ Installation failed with error:', errorMsg, error);
      set({ 
        smitheryError: `Failed to install server: ${errorMsg}`,
        smitheryLoading: false 
      });
      throw error;
    }
  },

  removeSmitheryServer: async (serverName: string) => {
    set({ isLoading: true, error: null });
    try {
      await window.mcpAPI.removeSmitheryServer(serverName);
      
      // Refresh available servers
      await get().initialize();
    } catch (error) {
      set({ 
        error: `Failed to remove server: ${error}`,
        isLoading: false 
      });
      throw error;
    }
  },

  getServersByCategory: async (category: string) => {
    set({ smitheryLoading: true, smitheryError: null });
    try {
      const servers = await smitheryClient.getServersByCategory(category);
      set({ 
        smitheryServers: servers,
        smitheryLoading: false,
        selectedCategory: category
      });
    } catch (error) {
      set({ 
        smitheryError: `Failed to load servers for category: ${error}`,
        smitheryLoading: false 
      });
    }
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  setSelectedCategory: (category: string | null) => {
    set({ selectedCategory: category });
  },

  reset: () => {
    set({
      availableServers: [],
      enabledServers: [],
      isLoading: false,
      error: null,
      tools: [],
      resources: [],
      smitheryServers: [],
      smitheryLoading: false,
      smitheryError: null,
      selectedCategory: null,
      searchQuery: ''
    });
  }
}));

// Helper function to find tool by name
export function findMCPTool(tools: MCPTool[], toolName: string): MCPTool | undefined {
  return tools.find(tool => tool.name === toolName);
}

// Helper function to group tools by server
export function groupToolsByServer(tools: MCPTool[]): Record<string, MCPTool[]> {
  return tools.reduce((acc, tool) => {
    const server = tool.server || 'unknown';
    if (!acc[server]) acc[server] = [];
    acc[server].push(tool);
    return acc;
  }, {} as Record<string, MCPTool[]>);
}
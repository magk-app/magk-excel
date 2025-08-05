import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

export interface SmitheryServerInfo {
  qualifiedName: string;
  displayName: string;
  description: string;
  homepage?: string;
  iconUrl?: string;
  useCount: number;
  isDeployed: boolean;
  remote: boolean;
  createdAt: string;
  tags?: string[];
  category?: string;
  verified?: boolean;
}

export interface SmitheryServerDetails extends SmitheryServerInfo {
  configSchema?: any;
  exampleConfig?: any;
  documentation?: string;
  version?: string;
  author?: string;
  license?: string;
  dependencies?: string[];
}

export interface SmitherySearchResponse {
  servers: SmitheryServerInfo[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalPages: number;
    totalCount: number;
  };
}

export interface SmitheryInstallResult {
  success: boolean;
  serverInfo: SmitheryServerDetails;
  connectionUrl?: string;
  configRequired: boolean;
  error?: string;
}

export interface SmitheryConnectionConfig {
  apiKey?: string;
  serverUrl?: string;
  timeout?: number;
  maxRetries?: number;
}

export class SmitheryClient {
  private baseUrl = 'https://registry.smithery.ai';
  private apiKey?: string;
  private timeout = 10000;
  private maxRetries = 3;

  constructor(config?: SmitheryConnectionConfig) {
    // Environment variables are not available in renderer process
    // API key must be provided via config or set manually
    
    if (config?.apiKey) this.apiKey = config.apiKey;
    if (config?.serverUrl) this.baseUrl = config.serverUrl;
    if (config?.timeout) this.timeout = config.timeout;
    if (config?.maxRetries) this.maxRetries = config.maxRetries;
  }

  /**
   * Search for MCP servers in the Smithery registry
   */
  async searchServers(query: string, page = 1, pageSize = 10): Promise<SmitherySearchResponse> {
    try {
      const params = new URLSearchParams({
        q: query,
        page: page.toString(),
        pageSize: pageSize.toString()
      });

      const response = await this.makeRequest(`/servers?${params.toString()}`);
      
      // Fix deployment status - all servers from Smithery registry should be deployable
      // The API might return 'deployed' instead of 'isDeployed' or might not have this field
      if (response.servers) {
        response.servers = response.servers.map((server: any) => ({
          ...server,
          // If searching for verified servers or if the server has a qualifiedName, it should be deployable
          isDeployed: server.isDeployed ?? server.deployed ?? server.verified ?? true,
          // Ensure verified field is set for verified searches
          verified: query.includes('is:verified') ? true : (server.verified ?? false)
        }));
      }
      
      console.log(`🔍 Search results: ${response.servers?.length || 0} servers (query: ${query})`);
      return response as SmitherySearchResponse;
    } catch (error) {
      console.error('Failed to search Smithery servers:', error);
      throw new Error(`Server search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get popular/featured MCP servers
   */
  async getPopularServers(limit = 20): Promise<SmitheryServerInfo[]> {
    if (!this.apiKey) {
      throw new Error('Smithery API key is required. Please configure your API key to browse popular servers.');
    }

    try {
      const response = await this.searchServers('is:verified', 1, limit);
      return response.servers.sort((a, b) => b.useCount - a.useCount);
    } catch (error) {
      console.error('Failed to fetch popular servers:', error);
      throw new Error(`Failed to fetch popular servers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get detailed information about a specific server
   */
  async getServerDetails(qualifiedName: string): Promise<SmitheryServerDetails> {
    try {
      const response = await this.makeRequest(`/servers/${encodeURIComponent(qualifiedName)}`);
      return response as SmitheryServerDetails;
    } catch (error) {
      console.error(`Failed to get server details for ${qualifiedName}:`, error);
      throw new Error(`Server details fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get servers by category
   */
  async getServersByCategory(category: string): Promise<SmitheryServerInfo[]> {
    try {
      // Remove the is:deployed filter since we're handling deployment status ourselves
      const response = await this.searchServers(`category:${category}`);
      return response.servers;
    } catch (error) {
      console.error(`Failed to get servers for category ${category}:`, error);
      return [];
    }
  }

  /**
   * Install and configure a Smithery MCP server
   */
  async installServer(qualifiedName: string, config?: Record<string, any>): Promise<SmitheryInstallResult> {
    try {
      console.log(`🔍 Getting server details for: ${qualifiedName}`);
      
      // Get server details first
      const serverDetails = await this.getServerDetails(qualifiedName);
      console.log(`📋 Server details:`, {
        displayName: serverDetails.displayName,
        isDeployed: serverDetails.isDeployed,
        configRequired: !!serverDetails.configSchema
      });
      
      // For local servers (not deployed on Smithery), we would need Smithery CLI
      // For now, we'll focus on hosted servers which are the majority
      if (!serverDetails.isDeployed) {
        console.warn(`⚠️ ${serverDetails.displayName} is a local server that requires Smithery CLI installation`);
        // We'll still try to connect in case it's already installed locally
      }

      // Build connection URL
      console.log(`🔗 Building connection URL for ${qualifiedName} with config:`, config);
      const connectionUrl = this.buildConnectionUrl(qualifiedName, config);
      console.log(`🌐 Connection URL: ${connectionUrl}`);

      // Test connection to ensure it works
      console.log(`🧪 Testing connection to ${connectionUrl}...`);
      const testResult = await this.testConnection(connectionUrl, serverDetails);
      console.log(`🔬 Connection test result:`, testResult);

      const result = {
        success: testResult.success,
        serverInfo: serverDetails,
        connectionUrl: testResult.success ? connectionUrl : undefined,
        configRequired: !!serverDetails.configSchema && Object.keys(serverDetails.configSchema.properties || {}).length > 0,
        error: testResult.error
      };
      
      console.log(`📦 Final install result:`, {
        success: result.success,
        connectionUrl: result.connectionUrl,
        configRequired: result.configRequired,
        error: result.error
      });
      
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown installation error';
      console.error(`❌ Failed to install server ${qualifiedName}:`, errorMsg, error);
      return {
        success: false,
        serverInfo: {} as SmitheryServerDetails,
        configRequired: false,
        error: errorMsg
      };
    }
  }

  /**
   * Test connection to a Smithery MCP server
   */
  async testConnection(connectionUrl: string, serverInfo: SmitheryServerDetails): Promise<{ success: boolean; error?: string }> {
    let client: Client | null = null;
    let transport: StreamableHTTPClientTransport | null = null;

    try {
      // Create HTTP transport for Smithery hosted servers
      transport = new StreamableHTTPClientTransport(new URL(connectionUrl));
      
      client = new Client({
        name: 'magk-excel-test',
        version: '1.0.0'
      });

      // Test connection with timeout
      const connectPromise = client.connect(transport);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), this.timeout)
      );

      await Promise.race([connectPromise, timeoutPromise]);

      // Test basic functionality
      await client.listTools();
      
      return { success: true };
    } catch (error) {
      console.error(`Connection test failed for ${serverInfo.displayName}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Connection test failed'
      };
    } finally {
      // Clean up test connection
      try {
        if (client) await client.close();
        if (transport) await transport.close();
      } catch (cleanupError) {
        console.warn('Failed to cleanup test connection:', cleanupError);
      }
    }
  }

  /**
   * Get server categories for filtering
   */
  async getCategories(): Promise<string[]> {
    try {
      // This would ideally come from a dedicated API endpoint
      // For now, we'll use common categories based on popular servers
      return [
        'AI & ML',
        'Data & Analytics', 
        'Development Tools',
        'Cloud Services',
        'Databases',
        'Communication',
        'File Management',
        'Web Scraping',
        'APIs & Integration',
        'Productivity'
      ];
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      return [];
    }
  }

  /**
   * Build connection URL for Smithery hosted server
   */
  private buildConnectionUrl(qualifiedName: string, config?: Record<string, any>): string {
    const baseUrl = `https://server.smithery.ai/${qualifiedName}/mcp`;
    
    // Always add parameters (at minimum for API key authentication)
    const params = new URLSearchParams();
    
    // Add API key if provided (required for authentication)
    if (this.apiKey) {
      params.append('api_key', this.apiKey);
      console.log('🔑 Added API key to connection URL');
    } else {
      console.warn('⚠️ No API key available for Smithery connection');
    }

    // Add configuration parameters if provided
    if (config && Object.keys(config).length > 0) {
      console.log('⚙️ Adding config parameters:', config);
      Object.entries(config).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const finalUrl = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
    console.log(`🔗 Built connection URL: ${finalUrl.replace(/api_key=[^&]+/, 'api_key=***')}`);
    return finalUrl;
  }

  /**
   * Make HTTP request to Smithery API (authentication optional for public endpoints)
   */
  private async makeRequest(endpoint: string): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };

    // Add authorization header if API key is available (optional for public registry)
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    let lastError: Error | null = null;

    // Retry logic
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      let response: Response | null = null;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        response = await fetch(url, {
          headers,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          // Special handling for 401 - try without auth for public endpoints
          if (response.status === 401 && this.apiKey && attempt === 1) {
            console.warn('Authentication failed, trying public endpoint without API key');
            const publicResponse = await fetch(url, {
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              },
              signal: controller.signal
            });
            
            if (publicResponse.ok) {
              return await publicResponse.json();
            }
          }
          
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown request error');
        
        if (attempt === this.maxRetries) {
          break;
        }

        // Wait before retry (exponential backoff)
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, attempt - 1) * 1000)
        );
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }

  /**
   * Update API configuration
   */
  updateConfig(config: SmitheryConnectionConfig): void {
    if (config.apiKey !== undefined) this.apiKey = config.apiKey;
    if (config.serverUrl !== undefined) this.baseUrl = config.serverUrl;
    if (config.timeout !== undefined) this.timeout = config.timeout;
    if (config.maxRetries !== undefined) this.maxRetries = config.maxRetries;
  }

  /**
   * Check if API key is configured
   */
  isAuthenticated(): boolean {
    return !!this.apiKey;
  }

  /**
   * Load API key from environment variables (not available in renderer process)
   * This method is kept for compatibility but will always return undefined
   * in the renderer process context.
   */
  private loadApiKeyFromEnv(): string | undefined {
    // Environment variables are not available in renderer process
    // API key must be provided via constructor config or setApiKey method
    console.warn('⚠️ Environment variables not available in renderer process. Use setApiKey() method instead.');
    return undefined;
  }

  /**
   * Set API key manually (for runtime configuration)
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    console.log('✅ Smithery API key configured manually');
  }

  /**
   * Get current API key status
   */
  getApiKeyStatus(): { configured: boolean; source: string } {
    if (!this.apiKey) {
      return { configured: false, source: 'none' };
    }
    
    // In renderer process, all API keys are set manually via setApiKey() or constructor
    return { configured: true, source: 'manual' };
  }
}

// Create singleton instance
export const smitheryClient = new SmitheryClient();
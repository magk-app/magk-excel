export interface IpcRenderer {
  on(channel: string, listener: (event: any, ...args: any[]) => void): void;
  off(channel: string, ...listeners: Array<(...args: any[]) => void>): void;
  send(channel: string, ...args: any[]): void;
  invoke(channel: string, ...args: any[]): Promise<any>;
}

export interface MCPServerInfo {
  availableServers: string[];
  enabledServers: string[];
}

export interface MCPTool {
  name: string;
  description?: string;
  inputSchema?: any;
  server?: string;
}

export interface MCPResource {
  uri: string;
  name?: string;
  description?: string;
  mimeType?: string;
  server?: string;
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

export interface MCPAPI {
  loadConfig(): Promise<MCPServerInfo>;
  toggleServer(serverName: string, enabled: boolean): Promise<{ enabledServers: string[] }>;
  listTools(serverName?: string): Promise<MCPTool[]>;
  listResources(serverName?: string): Promise<MCPResource[]>;
  callTool(serverName: string, toolName: string, args: any): Promise<any>;
  readResource(serverName: string, uri: string): Promise<any>;
  
  // Smithery integration
  addSmitheryServer(serverName: string, config: MCPServerConfig): Promise<void>;
  removeSmitheryServer(serverName: string): Promise<void>;
  getServerConfig(serverName: string): Promise<MCPServerConfig | undefined>;
  isSmitheryServer(serverName: string): Promise<boolean>;
  getSmitheryServers(): Promise<Record<string, MCPServerConfig>>;
}

export interface PersistentFileInfo {
  name: string;
  size: number;
  modified: Date;
  path: string;
}

export interface FileAPI {
  downloadFile(filePath: string): Promise<{ success: boolean; savedPath?: string; error?: string }>;
  openFile(filePath: string): Promise<{ success: boolean; error?: string }>;
  showInFolder(filePath: string): Promise<{ success: boolean; error?: string }>;
  getExcelDirectory(): Promise<string>;
  
  // Persistent file operations
  getAppDataDirectory(): Promise<string>;
  writePersistentFile(fileName: string, content: string, subDir?: string): Promise<{ success: boolean; filePath?: string; error?: string }>;
  readPersistentFile(fileName: string, subDir?: string): Promise<{ success: boolean; content?: string; error?: string }>;
  listPersistentFiles(subDir?: string): Promise<{ success: boolean; files?: PersistentFileInfo[]; error?: string }>;
  deletePersistentFile(fileName: string, subDir?: string): Promise<{ success: boolean; error?: string }>;
}

declare global {
  interface Window {
    ipcRenderer: IpcRenderer;
    mcpAPI: MCPAPI;
    fileAPI: FileAPI;
    electronAPI?: FileAPI; // Alias for backward compatibility
  }
}
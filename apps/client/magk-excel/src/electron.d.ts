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

export interface FoundFileInfo {
  path: string;
  size: number;
  modified: Date;
}

export interface DownloadOptions {
  defaultPath?: string;
  showDialog?: boolean;
  autoSave?: boolean;
}

export interface DownloadFromContentOptions {
  content: string | Buffer;
  fileName: string;
  mimeType?: string;
  encoding?: 'base64' | 'utf8' | 'binary';
  autoSave?: boolean;
}

export interface DownloadResult {
  success: boolean;
  savedPath?: string;
  fileName?: string;
  error?: string;
}

export interface TestArtifactInfo {
  name: string;
  path: string;
  size: number;
  modified: Date;
  type: string;
}

export interface TestEnvironmentInfo {
  platform: string;
  arch: string;
  nodeVersion: string;
  electronVersion: string;
  chromeVersion: string;
  appDataDir: string;
  testingDir: string;
  artifactsDir: string;
  tempDir: string;
  availableMemory: number;
  totalMemory: number;
}

export interface TestFileWatchOptions {
  directory: string;
  extensions?: string[];
  recursive?: boolean;
  debounceMs?: number;
}

export interface TestDiscoveryResult {
  success: boolean;
  files?: string[];
  testContent?: { [filename: string]: string };
  error?: string;
}

export interface FileAPI {
  downloadFile(filePath: string, options?: DownloadOptions): Promise<DownloadResult>;
  downloadFromContent(options: DownloadFromContentOptions): Promise<DownloadResult>;
  openFile(filePath: string): Promise<{ success: boolean; error?: string }>;
  showInFolder(filePath: string): Promise<{ success: boolean; error?: string }>;
  getExcelDirectory(): Promise<string>;
  
  // Persistent file operations
  getAppDataDirectory(): Promise<string>;
  writePersistentFile(fileName: string, content: string, subDir?: string): Promise<{ success: boolean; filePath?: string; error?: string }>;
  readPersistentFile(fileName: string, subDir?: string): Promise<{ success: boolean; content?: string; error?: string }>;
  listPersistentFiles(subDir?: string): Promise<{ success: boolean; files?: PersistentFileInfo[]; error?: string }>;
  deletePersistentFile(fileName: string, subDir?: string): Promise<{ success: boolean; error?: string }>;
  
  // Temporary file operations
  saveTempFile(params: { fileId: string, fileName: string, content: string }): Promise<{ success: boolean; tempFilePath?: string; error?: string }>;
  cleanupTempFiles(olderThanHours?: number): Promise<{ success: boolean; cleaned?: number; error?: string }>;
  findFileByName(fileName: string): Promise<{ success: boolean; files?: FoundFileInfo[]; error?: string }>;
  
  // Directory operations (for test discovery)
  readDirectory(dirPath: string): Promise<{ success: boolean; files?: string[]; error?: string }>;
  readFile(filePath: string): Promise<{ success: boolean; content?: string; error?: string }>;
  
  // Enhanced test discovery operations
  discoverTestFiles(options?: { forceRefresh?: boolean; loadContent?: boolean }): Promise<TestDiscoveryResult>;
  watchTestFiles(options: TestFileWatchOptions): Promise<{ success: boolean; watchId?: string; error?: string }>;
  stopWatchingFiles(watchId: string): Promise<{ success: boolean; error?: string }>;
  
  // Test Executor APIs
  saveTestArtifact(params: { 
    testId: string; 
    artifactName: string; 
    content: string; 
    type: string; 
  }): Promise<{ success: boolean; path?: string; error?: string }>;
  listTestArtifacts(testId: string): Promise<{ 
    success: boolean; 
    artifacts?: TestArtifactInfo[]; 
    error?: string; 
  }>;
  cleanupTestArtifacts(testId?: string): Promise<{ success: boolean; error?: string }>;
  getTestEnvironmentInfo(): Promise<{ 
    success: boolean; 
    info?: TestEnvironmentInfo; 
    error?: string; 
  }>;
  
  // File system integration helpers
  validateTestEnvironment(): Promise<{ success: boolean; issues?: string[]; recommendations?: string[] }>;
  optimizeTestFileAccess(): Promise<{ success: boolean; optimizations?: string[]; error?: string }>;
}

declare global {
  interface Window {
    ipcRenderer: IpcRenderer;
    mcpAPI: MCPAPI;
    fileAPI: FileAPI;
    electronAPI?: FileAPI; // Alias for backward compatibility
  }
}
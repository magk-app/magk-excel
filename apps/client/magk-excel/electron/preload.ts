import { ipcRenderer, contextBridge } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },

  // You can expose other APTs you need here.
  // ...
})

// Expose MCP API
contextBridge.exposeInMainWorld('mcpAPI', {
  loadConfig: () => ipcRenderer.invoke('mcp:load-config'),
  toggleServer: (serverName: string, enabled: boolean) => 
    ipcRenderer.invoke('mcp:toggle-server', serverName, enabled),
  listTools: (serverName?: string) => 
    ipcRenderer.invoke('mcp:list-tools', serverName),
  listResources: (serverName?: string) => 
    ipcRenderer.invoke('mcp:list-resources', serverName),
  callTool: (serverName: string, toolName: string, args: any) => 
    ipcRenderer.invoke('mcp:call-tool', serverName, toolName, args),
  readResource: (serverName: string, uri: string) => 
    ipcRenderer.invoke('mcp:read-resource', serverName, uri),
  
  // Smithery integration
  addSmitheryServer: (serverName: string, config: any) => 
    ipcRenderer.invoke('mcp:add-smithery-server', serverName, config),
  removeSmitheryServer: (serverName: string) => 
    ipcRenderer.invoke('mcp:remove-smithery-server', serverName),
  getServerConfig: (serverName: string) => 
    ipcRenderer.invoke('mcp:get-server-config', serverName),
  isSmitheryServer: (serverName: string) => 
    ipcRenderer.invoke('mcp:is-smithery-server', serverName),
  getSmitheryServers: () => 
    ipcRenderer.invoke('mcp:get-smithery-servers')
})

// File API object
const fileAPI = {
  downloadFile: (filePath: string, options?: { defaultPath?: string, showDialog?: boolean, autoSave?: boolean }) => 
    ipcRenderer.invoke('download-file', filePath, options),
  downloadFromContent: (options: { content: string | Buffer, fileName: string, mimeType?: string, encoding?: 'base64' | 'utf8' | 'binary', autoSave?: boolean }) => 
    ipcRenderer.invoke('download-from-content', options),
  openFile: (filePath: string) => 
    ipcRenderer.invoke('open-file', filePath),
  showInFolder: (filePath: string) => 
    ipcRenderer.invoke('show-in-folder', filePath),
  getExcelDirectory: () => 
    ipcRenderer.invoke('get-excel-directory'),
  
  // Persistent file operations
  getAppDataDirectory: () => 
    ipcRenderer.invoke('get-app-data-directory'),
  writePersistentFile: (fileName: string, content: string, subDir?: string) => 
    ipcRenderer.invoke('write-persistent-file', fileName, content, subDir),
  readPersistentFile: (fileName: string, subDir?: string) => 
    ipcRenderer.invoke('read-persistent-file', fileName, subDir),
  listPersistentFiles: (subDir?: string) => 
    ipcRenderer.invoke('list-persistent-files', subDir),
  deletePersistentFile: (fileName: string, subDir?: string) => 
    ipcRenderer.invoke('delete-persistent-file', fileName, subDir),
  
  // Temporary file operations
  saveTempFile: (params: { fileId: string, fileName: string, content: string }) => 
    ipcRenderer.invoke('save-temp-file', params),
  cleanupTempFiles: (olderThanHours?: number) => 
    ipcRenderer.invoke('cleanup-temp-files', olderThanHours),
  findFileByName: (fileName: string) => 
    ipcRenderer.invoke('find-file-by-name', fileName)
}

// Expose File API for Excel downloads and persistent file operations
contextBridge.exposeInMainWorld('fileAPI', fileAPI)

// Expose as electronAPI for backward compatibility  
contextBridge.exposeInMainWorld('electronAPI', {
  ...fileAPI,
  
  // Test executor APIs
  readFile: (filePath: string) => 
    ipcRenderer.invoke('test:read-file', filePath),
  readDirectory: (dirPath: string) => 
    ipcRenderer.invoke('test:read-directory', dirPath),
  saveTestArtifact: (params: { testId: string, artifactName: string, content: string, type: string }) => 
    ipcRenderer.invoke('test:save-artifact', params),
  listTestArtifacts: (testId: string) => 
    ipcRenderer.invoke('test:list-artifacts', testId),
  cleanupTestArtifacts: (testId?: string) => 
    ipcRenderer.invoke('test:cleanup-artifacts', testId),
  getTestEnvironmentInfo: () => 
    ipcRenderer.invoke('test:get-environment-info')
})

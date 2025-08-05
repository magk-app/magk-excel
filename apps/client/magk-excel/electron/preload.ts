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

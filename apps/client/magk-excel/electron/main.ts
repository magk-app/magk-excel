import { app, BrowserWindow, ipcMain } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { mcpManager } from './mcp-manager.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// Setup IPC handlers for MCP
function setupMCPHandlers() {
  ipcMain.handle('mcp:load-config', async () => {
    await mcpManager.loadConfig()
    return {
      availableServers: mcpManager.getAvailableServers(),
      enabledServers: mcpManager.getEnabledServers()
    }
  })

  ipcMain.handle('mcp:toggle-server', async (_, serverName: string, enabled: boolean) => {
    await mcpManager.toggleServer(serverName, enabled)
    return {
      enabledServers: mcpManager.getEnabledServers()
    }
  })

  ipcMain.handle('mcp:list-tools', async (_, serverName?: string) => {
    return await mcpManager.listTools(serverName)
  })

  ipcMain.handle('mcp:list-resources', async (_, serverName?: string) => {
    return await mcpManager.listResources(serverName)
  })

  ipcMain.handle('mcp:call-tool', async (_, serverName: string, toolName: string, args: any) => {
    return await mcpManager.callTool(serverName, toolName, args)
  })

  ipcMain.handle('mcp:read-resource', async (_, serverName: string, uri: string) => {
    return await mcpManager.readResource(serverName, uri)
  })

  // Smithery integration handlers
  ipcMain.handle('mcp:add-smithery-server', async (_, serverName: string, config: any) => {
    return await mcpManager.addSmitheryServer(serverName, config)
  })

  ipcMain.handle('mcp:remove-smithery-server', async (_, serverName: string) => {
    return await mcpManager.removeSmitheryServer(serverName)
  })

  ipcMain.handle('mcp:get-server-config', async (_, serverName: string) => {
    return mcpManager.getServerConfig(serverName)
  })

  ipcMain.handle('mcp:is-smithery-server', async (_, serverName: string) => {
    return mcpManager.isSmitheryServer(serverName)
  })

  ipcMain.handle('mcp:get-smithery-servers', async () => {
    return mcpManager.getSmitheryServers()
  })
}

app.whenReady().then(async () => {
  // Initialize MCP manager
  try {
    await mcpManager.initialize()
    console.log('✅ MCP Manager initialized')
  } catch (error) {
    console.error('❌ Failed to initialize MCP Manager:', error)
  }

  // Setup IPC handlers
  setupMCPHandlers()

  // Create window
  createWindow()
})

// Cleanup on quit
app.on('before-quit', async () => {
  await mcpManager.shutdown()
})

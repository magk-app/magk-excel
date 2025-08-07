import { app, BrowserWindow, ipcMain, Menu, shell, dialog } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'
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

function createMenu() {
  const template: any[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Session',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            win?.webContents.send('menu-new-session')
          }
        },
        {
          label: 'Open',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            win?.webContents.send('menu-open')
          }
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            win?.webContents.send('menu-save')
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit()
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: 'Select All', accelerator: 'CmdOrCtrl+A', role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: 'Force Reload', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
        { label: 'Toggle Developer Tools', accelerator: 'F12', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: 'Actual Size', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { label: 'Zoom In', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { type: 'separator' },
        { label: 'Toggle Fullscreen', accelerator: 'F11', role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Tools',
      submenu: [
        {
          label: 'MCP Servers',
          click: () => {
            win?.webContents.send('menu-mcp-servers')
          }
        },
        {
          label: 'Workflow Editor',
          click: () => {
            win?.webContents.send('menu-workflow-editor')
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About MAGK Excel',
          click: () => {
            win?.webContents.send('menu-about')
          }
        },
        {
          label: 'Documentation',
          click: () => {
            shell.openExternal('https://github.com/magk-team/magk-excel/wiki')
          }
        },
        {
          label: 'Report Issue',
          click: () => {
            shell.openExternal('https://github.com/magk-team/magk-excel/issues')
          }
        }
      ]
    }
  ]

  // macOS specific menu adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: 'MAGK Excel',
      submenu: [
        { label: 'About MAGK Excel', role: 'about' },
        { type: 'separator' },
        { label: 'Services', role: 'services', submenu: [] },
        { type: 'separator' },
        { label: 'Hide MAGK Excel', accelerator: 'Command+H', role: 'hide' },
        { label: 'Hide Others', accelerator: 'Command+Shift+H', role: 'hideOthers' },
        { label: 'Show All', role: 'unhide' },
        { type: 'separator' },
        { label: 'Quit MAGK Excel', accelerator: 'Command+Q', click: () => app.quit() }
      ]
    })
  }

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

function createWindow() {
  win = new BrowserWindow({
    title: 'MAGK Excel',
    icon: path.join(process.env.VITE_PUBLIC, 'icons', 'icon.png'),
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
    try {
      return await mcpManager.listResources(serverName)
    } catch (error) {
      console.error('Error in mcp:list-resources handler:', error)
      // Return empty array instead of failing completely
      return []
    }
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
  
  // File download handlers
  ipcMain.handle('download-file', async (_, filePath: string) => {
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return { success: false, error: 'File not found' }
      }
      
      // Open save dialog
      const result = await dialog.showSaveDialog(win!, {
        defaultPath: path.basename(filePath),
        filters: [
          { name: 'Excel Files', extensions: ['xlsx', 'xls'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      })
      
      if (!result.canceled && result.filePath) {
        // Copy file to selected location
        fs.copyFileSync(filePath, result.filePath)
        return { success: true, savedPath: result.filePath }
      }
      
      return { success: false, error: 'Save canceled' }
    } catch (error) {
      console.error('Download error:', error)
      return { success: false, error: error.message }
    }
  })
  
  ipcMain.handle('open-file', async (_, filePath: string) => {
    try {
      // Open file with default application
      await shell.openPath(filePath)
      return { success: true }
    } catch (error) {
      console.error('Open file error:', error)
      return { success: false, error: error.message }
    }
  })
  
  ipcMain.handle('show-in-folder', async (_, filePath: string) => {
    try {
      // Show file in file explorer
      shell.showItemInFolder(filePath)
      return { success: true }
    } catch (error) {
      console.error('Show in folder error:', error)
      return { success: false, error: error.message }
    }
  })
  
  // Get default Excel files directory
  ipcMain.handle('get-excel-directory', async () => {
    const excelDir = process.env.EXCEL_FILES_PATH || 
                     process.env.MAGK_EXCEL_PATH ||
                     path.join(os.homedir(), 'Downloads', 'MAGK-Excel')
    
    // Ensure directory exists
    if (!fs.existsSync(excelDir)) {
      fs.mkdirSync(excelDir, { recursive: true })
    }
    
    return excelDir
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

  // Create menu
  createMenu()

  // Create window
  createWindow()
})

// Cleanup on quit
app.on('before-quit', async () => {
  await mcpManager.shutdown()
})

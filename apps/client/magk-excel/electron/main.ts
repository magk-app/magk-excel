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

// App data directory for persistent storage
const APP_DATA_DIR = path.join(app.getPath('userData'), 'PersistentFiles')
const ALLOWED_DIRS_FILE = path.join(app.getPath('userData'), 'allowed-dirs.json')

/**
 * Set up the app data directory and configure filesystem MCP server
 */
function setupAppDataDirectory() {
  try {
    // Create the app data directory if it doesn't exist
    if (!fs.existsSync(APP_DATA_DIR)) {
      fs.mkdirSync(APP_DATA_DIR, { recursive: true })
      console.log('✅ Created app data directory:', APP_DATA_DIR)
    }

    // Create subdirectories for different file types
    const subDirs = ['excel', 'pdf', 'uploads', 'temp']
    subDirs.forEach(subDir => {
      const fullPath = path.join(APP_DATA_DIR, subDir)
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true })
      }
    })

    // Configure allowed directories for filesystem MCP server
    const allowedDirs = [APP_DATA_DIR]
    
    // Set environment variable for filesystem MCP server
    process.env.FILESYSTEM_ALLOWED_DIRECTORIES = allowedDirs.join(';')
    
    // Save allowed directories to file for reference
    fs.writeFileSync(ALLOWED_DIRS_FILE, JSON.stringify({
      allowedDirectories: allowedDirs,
      appDataDir: APP_DATA_DIR,
      lastUpdated: new Date().toISOString()
    }, null, 2))

    console.log('✅ Configured filesystem MCP server with allowed directories:', allowedDirs)
    return APP_DATA_DIR
  } catch (error) {
    console.error('❌ Failed to setup app data directory:', error)
    throw error
  }
}

/**
 * Get the path to the app data directory
 */
function getAppDataDirectory(): string {
  return APP_DATA_DIR
}

/**
 * Write a file to the persistent storage directory
 */
function writeFileToPersistentStorage(fileName: string, content: string | Buffer, subDir?: string): string {
  const targetDir = subDir ? path.join(APP_DATA_DIR, subDir) : APP_DATA_DIR
  
  // Ensure target directory exists
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true })
  }
  
  const filePath = path.join(targetDir, fileName)
  fs.writeFileSync(filePath, content)
  console.log('💾 Saved file to persistent storage:', filePath)
  return filePath
}

/**
 * Read a file from the persistent storage directory
 */
function readFileFromPersistentStorage(fileName: string, subDir?: string): Buffer | null {
  try {
    const targetDir = subDir ? path.join(APP_DATA_DIR, subDir) : APP_DATA_DIR
    const filePath = path.join(targetDir, fileName)
    
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath)
    }
    
    return null
  } catch (error) {
    console.error('❌ Failed to read file from persistent storage:', error)
    return null
  }
}

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
      // Use CommonJS preload built as preload.cjs
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  })

  // Set Content Security Policy for security
  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
          "connect-src 'self' ws: wss: https: data: http://localhost:*; " +
          "img-src 'self' data: https:; " +
          "media-src 'self' data:; " +
          "font-src 'self' data:;"
        ]
      }
    })
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
  
  // Enhanced file download handlers
  ipcMain.handle('download-file', async (_, filePath: string, options?: { 
    defaultPath?: string, 
    showDialog?: boolean,
    autoSave?: boolean 
  }) => {
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return { success: false, error: 'File not found' }
      }

      const fileName = path.basename(filePath)
      const fileExt = path.extname(fileName)
      let targetPath: string

      if (options?.autoSave) {
        // Auto-save to Downloads/MAGK-Excel directory
        const excelDir = path.join(os.homedir(), 'Downloads', 'MAGK-Excel')
        if (!fs.existsSync(excelDir)) {
          fs.mkdirSync(excelDir, { recursive: true })
        }
        
        // Generate unique filename if file already exists
        let counter = 0
        const baseName = path.parse(fileName).name
        targetPath = path.join(excelDir, fileName)
        
        while (fs.existsSync(targetPath)) {
          counter++
          const newName = `${baseName}_${counter}${fileExt}`
          targetPath = path.join(excelDir, newName)
        }
      } else {
        // Show save dialog
        const result = await dialog.showSaveDialog(win!, {
          defaultPath: options?.defaultPath || fileName,
          filters: [
            { name: 'Excel Files', extensions: ['xlsx', 'xls'] },
            { name: 'PDF Files', extensions: ['pdf'] },
            { name: 'CSV Files', extensions: ['csv'] },
            { name: 'All Files', extensions: ['*'] }
          ]
        })
        
        if (result.canceled || !result.filePath) {
          return { success: false, error: 'Save canceled' }
        }
        
        targetPath = result.filePath
      }
      
      // Copy file to target location
      fs.copyFileSync(filePath, targetPath)
      
      console.log(`📥 File downloaded successfully: ${targetPath}`)
      return { 
        success: true, 
        savedPath: targetPath,
        fileName: path.basename(targetPath)
      }
    } catch (error) {
      console.error('Download error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Download file from URL or base64 content
  ipcMain.handle('download-from-content', async (_, options: {
    content: string | Buffer,
    fileName: string,
    mimeType?: string,
    encoding?: 'base64' | 'utf8' | 'binary',
    autoSave?: boolean
  }) => {
    try {
      const { content, fileName, mimeType, encoding = 'utf8', autoSave = false } = options
      
      // Prepare file content
      let fileBuffer: Buffer
      if (Buffer.isBuffer(content)) {
        fileBuffer = content
      } else if (encoding === 'base64') {
        fileBuffer = Buffer.from(content, 'base64')
      } else if (content.startsWith('data:')) {
        // Handle data URL
        const base64Data = content.split(',')[1]
        fileBuffer = Buffer.from(base64Data, 'base64')
      } else {
        fileBuffer = Buffer.from(content, encoding as BufferEncoding)
      }

      let targetPath: string
      
      if (autoSave) {
        // Auto-save to Downloads/MAGK-Excel directory
        const excelDir = path.join(os.homedir(), 'Downloads', 'MAGK-Excel')
        if (!fs.existsSync(excelDir)) {
          fs.mkdirSync(excelDir, { recursive: true })
        }
        
        // Generate unique filename if file already exists
        let counter = 0
        const baseName = path.parse(fileName).name
        const fileExt = path.extname(fileName)
        targetPath = path.join(excelDir, fileName)
        
        while (fs.existsSync(targetPath)) {
          counter++
          const newName = `${baseName}_${counter}${fileExt}`
          targetPath = path.join(excelDir, newName)
        }
      } else {
        // Show save dialog
        const fileExt = path.extname(fileName)
        const filters = []
        
        if (['.xlsx', '.xls'].includes(fileExt.toLowerCase())) {
          filters.push({ name: 'Excel Files', extensions: ['xlsx', 'xls'] })
        } else if (fileExt.toLowerCase() === '.pdf') {
          filters.push({ name: 'PDF Files', extensions: ['pdf'] })
        } else if (fileExt.toLowerCase() === '.csv') {
          filters.push({ name: 'CSV Files', extensions: ['csv'] })
        }
        filters.push({ name: 'All Files', extensions: ['*'] })
        
        const result = await dialog.showSaveDialog(win!, {
          defaultPath: fileName,
          filters
        })
        
        if (result.canceled || !result.filePath) {
          return { success: false, error: 'Save canceled' }
        }
        
        targetPath = result.filePath
      }
      
      // Write file
      fs.writeFileSync(targetPath, fileBuffer)
      
      console.log(`📥 File downloaded from content: ${targetPath}`)
      return { 
        success: true, 
        savedPath: targetPath,
        fileName: path.basename(targetPath)
      }
    } catch (error) {
      console.error('Download from content error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })
  
  ipcMain.handle('open-file', async (_, filePath: string) => {
    try {
      // Open file with default application
      await shell.openPath(filePath)
      return { success: true }
    } catch (error) {
      console.error('Open file error:', error)
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })
  
  ipcMain.handle('show-in-folder', async (_, filePath: string) => {
    try {
      // Show file in file explorer
      shell.showItemInFolder(filePath)
      return { success: true }
    } catch (error) {
      console.error('Show in folder error:', error)
      return { success: false, error: error instanceof Error ? error.message : String(error) }
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

  // File persistence handlers
  ipcMain.handle('get-app-data-directory', () => {
    return getAppDataDirectory()
  })

  ipcMain.handle('write-persistent-file', async (_, fileName: string, content: string, subDir?: string) => {
    try {
      // Decode base64 content if it's a data URL
      let fileContent: Buffer
      if (content.startsWith('data:')) {
        const base64Data = content.split(',')[1]
        fileContent = Buffer.from(base64Data, 'base64')
      } else {
        fileContent = Buffer.from(content, 'utf8')
      }
      
      const filePath = writeFileToPersistentStorage(fileName, fileContent, subDir)
      return { success: true, filePath }
    } catch (error) {
      console.error('❌ Failed to write persistent file:', error)
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  ipcMain.handle('read-persistent-file', async (_, fileName: string, subDir?: string) => {
    try {
      const content = readFileFromPersistentStorage(fileName, subDir)
      if (content) {
        return { success: true, content: content.toString('base64') }
      } else {
        return { success: false, error: 'File not found' }
      }
    } catch (error) {
      console.error('❌ Failed to read persistent file:', error)
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  ipcMain.handle('list-persistent-files', async (_, subDir?: string) => {
    try {
      const targetDir = subDir ? path.join(APP_DATA_DIR, subDir) : APP_DATA_DIR
      
      if (!fs.existsSync(targetDir)) {
        return { success: true, files: [] }
      }
      
      const files = fs.readdirSync(targetDir).filter(file => {
        const filePath = path.join(targetDir, file)
        return fs.statSync(filePath).isFile()
      }).map(file => {
        const filePath = path.join(targetDir, file)
        const stats = fs.statSync(filePath)
        return {
          name: file,
          size: stats.size,
          modified: stats.mtime,
          path: filePath
        }
      })
      
      return { success: true, files }
    } catch (error) {
      console.error('❌ Failed to list persistent files:', error)
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  ipcMain.handle('delete-persistent-file', async (_, fileName: string, subDir?: string) => {
    try {
      const targetDir = subDir ? path.join(APP_DATA_DIR, subDir) : APP_DATA_DIR
      const filePath = path.join(targetDir, fileName)
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
        console.log('🗑️ Deleted persistent file:', filePath)
        return { success: true }
      } else {
        return { success: false, error: 'File not found' }
      }
    } catch (error) {
      console.error('❌ Failed to delete persistent file:', error)
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  // Temporary file operations
  ipcMain.handle('save-temp-file', async (_, params: { fileId: string, fileName: string, content: string }) => {
    try {
      const { fileId, fileName, content } = params
      
      // Create temp directory if it doesn't exist
      const tempDir = path.join(APP_DATA_DIR, 'temp')
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true })
      }
      
      // Create a unique filename to avoid conflicts
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_')
      const uniqueFileName = `${fileId}_${sanitizedFileName}`
      const tempFilePath = path.join(tempDir, uniqueFileName)
      
      // Decode base64 content if it's a data URL
      let fileContent: Buffer
      if (content.startsWith('data:')) {
        const base64Data = content.split(',')[1]
        fileContent = Buffer.from(base64Data, 'base64')
      } else {
        fileContent = Buffer.from(content, 'base64')
      }
      
      fs.writeFileSync(tempFilePath, fileContent)
      console.log('💾 Saved temp file:', tempFilePath)
      
      return { success: true, tempFilePath }
    } catch (error) {
      console.error('❌ Failed to save temp file:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Clean up old temp files
  ipcMain.handle('cleanup-temp-files', async (_, olderThanHours: number = 24) => {
    try {
      const tempDir = path.join(APP_DATA_DIR, 'temp')
      
      if (!fs.existsSync(tempDir)) {
        return { success: true, cleaned: 0 }
      }
      
      const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000)
      const files = fs.readdirSync(tempDir)
      let cleanedCount = 0
      
      for (const file of files) {
        const filePath = path.join(tempDir, file)
        const stats = fs.statSync(filePath)
        
        if (stats.isFile() && stats.mtime.getTime() < cutoffTime) {
          fs.unlinkSync(filePath)
          cleanedCount++
          console.log('🗑️ Cleaned up old temp file:', filePath)
        }
      }
      
      console.log(`🧹 Cleaned up ${cleanedCount} temp files older than ${olderThanHours} hours`)
      return { success: true, cleaned: cleanedCount }
    } catch (error) {
      console.error('❌ Failed to cleanup temp files:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Find files by name in various directories
  ipcMain.handle('find-file-by-name', async (_, fileName: string) => {
    try {
      const searchDirectories = [
        path.join(APP_DATA_DIR, 'temp'),
        path.join(APP_DATA_DIR, 'excel'),
        path.join(APP_DATA_DIR, 'uploads'),
        APP_DATA_DIR,
        path.join(os.homedir(), 'Downloads', 'MAGK-Excel'),
        os.tmpdir()
      ]
      
      const foundFiles: { path: string, size: number, modified: Date }[] = []
      
      for (const dir of searchDirectories) {
        if (!fs.existsSync(dir)) continue
        
        const files = fs.readdirSync(dir)
        for (const file of files) {
          const filePath = path.join(dir, file)
          const stats = fs.statSync(filePath)
          
          if (stats.isFile() && (file === fileName || file.includes(fileName) || fileName.includes(file))) {
            foundFiles.push({
              path: filePath,
              size: stats.size,
              modified: stats.mtime
            })
          }
        }
      }
      
      // Sort by modification time, newest first
      foundFiles.sort((a, b) => b.modified.getTime() - a.modified.getTime())
      
      console.log(`🔍 Found ${foundFiles.length} files matching "${fileName}":`, foundFiles.map(f => f.path))
      return { success: true, files: foundFiles }
    } catch (error) {
      console.error('❌ Failed to find file by name:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Test executor IPC handlers
  ipcMain.handle('test:read-file', async (_, filePath: string) => {
    try {
      // Security check - only allow reading from testing directory and app data
      const allowedPaths = [
        path.join(process.cwd(), 'testing'),
        path.join(APP_DATA_DIR, 'tests'),
        APP_DATA_DIR
      ]
      
      const normalizedPath = path.normalize(filePath)
      const isAllowed = allowedPaths.some(allowedPath => 
        normalizedPath.startsWith(path.normalize(allowedPath))
      )
      
      if (!isAllowed && !filePath.startsWith('testing/')) {
        throw new Error('Access denied: file path not allowed')
      }
      
      // Resolve relative paths
      let fullPath = filePath
      if (!path.isAbsolute(filePath)) {
        fullPath = path.join(process.cwd(), filePath)
      }
      
      if (!fs.existsSync(fullPath)) {
        throw new Error(`File not found: ${fullPath}`)
      }
      
      const content = fs.readFileSync(fullPath, 'utf-8')
      return { success: true, content }
    } catch (error) {
      console.error('❌ Failed to read test file:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  })

  ipcMain.handle('test:read-directory', async (_, dirPath: string) => {
    try {
      // Security check - only allow reading testing directory
      if (!dirPath.startsWith('testing') && dirPath !== 'testing') {
        throw new Error('Access denied: only testing directory is allowed')
      }
      
      const fullPath = path.join(process.cwd(), dirPath)
      
      if (!fs.existsSync(fullPath)) {
        throw new Error(`Directory not found: ${fullPath}`)
      }
      
      const files = fs.readdirSync(fullPath)
        .filter(file => {
          const filePath = path.join(fullPath, file)
          const stats = fs.statSync(filePath)
          return stats.isFile() && /\.(html|js|md|xlsx)$/i.test(file)
        })
        .sort()
      
      return { success: true, files }
    } catch (error) {
      console.error('❌ Failed to read test directory:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  })

  ipcMain.handle('test:save-artifact', async (_, params: {
    testId: string
    artifactName: string
    content: string
    type: string
  }) => {
    try {
      const { testId, artifactName, content, type } = params
      
      // Create test artifacts directory
      const artifactsDir = path.join(APP_DATA_DIR, 'test-artifacts', testId)
      if (!fs.existsSync(artifactsDir)) {
        fs.mkdirSync(artifactsDir, { recursive: true })
      }
      
      // Save artifact
      const filePath = path.join(artifactsDir, artifactName)
      
      // Handle different content types
      if (content.startsWith('data:')) {
        // Handle data URLs (screenshots, etc.)
        const base64Data = content.split(',')[1]
        const buffer = Buffer.from(base64Data, 'base64')
        fs.writeFileSync(filePath, buffer)
      } else {
        // Handle text content
        fs.writeFileSync(filePath, content, 'utf-8')
      }
      
      console.log(`💾 Saved test artifact: ${filePath}`)
      return { success: true, path: filePath }
    } catch (error) {
      console.error('❌ Failed to save test artifact:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  })

  ipcMain.handle('test:list-artifacts', async (_, testId: string) => {
    try {
      const artifactsDir = path.join(APP_DATA_DIR, 'test-artifacts', testId)
      
      if (!fs.existsSync(artifactsDir)) {
        return { success: true, artifacts: [] }
      }
      
      const files = fs.readdirSync(artifactsDir)
        .filter(file => {
          const filePath = path.join(artifactsDir, file)
          return fs.statSync(filePath).isFile()
        })
        .map(file => {
          const filePath = path.join(artifactsDir, file)
          const stats = fs.statSync(filePath)
          return {
            name: file,
            path: filePath,
            size: stats.size,
            modified: stats.mtime,
            type: path.extname(file).slice(1) || 'unknown'
          }
        })
        .sort((a, b) => b.modified.getTime() - a.modified.getTime())
      
      return { success: true, artifacts: files }
    } catch (error) {
      console.error('❌ Failed to list test artifacts:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  })

  ipcMain.handle('test:cleanup-artifacts', async (_, testId?: string) => {
    try {
      const baseDir = path.join(APP_DATA_DIR, 'test-artifacts')
      
      if (testId) {
        // Clean specific test artifacts
        const testDir = path.join(baseDir, testId)
        if (fs.existsSync(testDir)) {
          fs.rmSync(testDir, { recursive: true, force: true })
          console.log(`🗑️ Cleaned test artifacts for: ${testId}`)
        }
      } else {
        // Clean all old artifacts (older than 24 hours)
        if (fs.existsSync(baseDir)) {
          const cutoffTime = Date.now() - (24 * 60 * 60 * 1000)
          const testDirs = fs.readdirSync(baseDir)
          let cleanedCount = 0
          
          for (const testDir of testDirs) {
            const testPath = path.join(baseDir, testDir)
            const stats = fs.statSync(testPath)
            
            if (stats.isDirectory() && stats.mtime.getTime() < cutoffTime) {
              fs.rmSync(testPath, { recursive: true, force: true })
              cleanedCount++
            }
          }
          
          console.log(`🗑️ Cleaned ${cleanedCount} old test artifact directories`)
        }
      }
      
      return { success: true }
    } catch (error) {
      console.error('❌ Failed to cleanup test artifacts:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  })

  ipcMain.handle('test:get-environment-info', async () => {
    try {
      const info = {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        electronVersion: process.versions.electron,
        chromeVersion: process.versions.chrome,
        appDataDir: APP_DATA_DIR,
        testingDir: path.join(process.cwd(), 'testing'),
        artifactsDir: path.join(APP_DATA_DIR, 'test-artifacts'),
        tempDir: os.tmpdir(),
        availableMemory: os.freemem(),
        totalMemory: os.totalmem()
      }
      
      return { success: true, info }
    } catch (error) {
      console.error('❌ Failed to get environment info:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  })
}

app.whenReady().then(async () => {
  // Setup app data directory and filesystem configuration
  try {
    setupAppDataDirectory()
    console.log('✅ App data directory configured')
  } catch (error) {
    console.error('❌ Failed to setup app data directory:', error)
  }

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

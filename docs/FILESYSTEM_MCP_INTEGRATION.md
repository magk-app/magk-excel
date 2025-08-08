# Filesystem MCP Integration

This document describes the implementation of filesystem MCP (Model Context Protocol) server integration in the MAGK Excel Electron application.

## Overview

The filesystem MCP integration provides secure file access for AI assistants through a standardized protocol. It allows the AI to read, write, and manage files in designated directories while maintaining security boundaries.

## Architecture

### Components

1. **MCP Filesystem Server Configuration** (`.mcp.json`)
   - Configured to run `@modelcontextprotocol/server-filesystem`
   - Restricted to allowed directories via environment variables

2. **App Data Directory Management** (`electron/main.ts`)
   - Creates and manages persistent storage directory
   - Sets up allowed directories for MCP server
   - Provides IPC handlers for file operations

3. **Filesystem MCP Tool** (`src/services/persistence/FilesystemMCPTool.ts`)
   - Bridges MCP filesystem operations with our FilePersistenceStore
   - Provides standardized filesystem tools (read, write, list, search, etc.)

4. **Enhanced FilePersistenceStore** (`src/stores/filePersistenceStore.ts`)
   - Syncs persistent files with app data directory
   - Maintains 2.5MB limit for persistent files
   - Automatically saves/deletes files in app data directory

## Directory Structure

```
{userData}/PersistentFiles/
├── excel/          # Excel and CSV files
├── pdf/            # PDF files
├── uploads/        # Text, JSON, XML, HTML files
└── temp/           # Temporary processing files
```

Where `{userData}` is the Electron app's user data directory:
- Windows: `%APPDATA%/MAGK Excel/`
- macOS: `~/Library/Application Support/MAGK Excel/`
- Linux: `~/.config/MAGK Excel/`

## File Size Limits

- **Temporary files**: 10MB maximum
- **Persistent files**: 2.5MB maximum (MCP compatibility)
- **Auto-persistence**: PDF and Excel files are automatically made persistent

## Available Tools

The filesystem MCP integration provides the following standardized tools:

### File Reading
- `read_text_file(path)` - Read text content from a file
- `read_media_file(path)` - Read binary content from a file (returns data URL)

### File Writing
- `write_file(path, content)` - Write content to a file

### Directory Operations
- `list_directory(path?)` - List files in a directory (defaults to root)
- `search_files(path, pattern)` - Search for files matching a regex pattern
- `create_directory(path)` - Create a directory (auto-handled)

### File Management
- `get_file_info(path)` - Get detailed file information
- `delete_file(path)` - Delete a file
- `move_file(source, destination)` - Move/rename a file (not implemented)
- `copy_file(source, destination)` - Copy a file (not implemented)

## Security Features

1. **Restricted Directory Access**
   - Only allows access to the app's persistent storage directory
   - No access to system files or user documents outside the app folder

2. **File Size Limits**
   - Enforces 2.5MB limit for persistent files
   - Prevents disk space abuse

3. **Type-based Organization**
   - Automatically organizes files by type into subdirectories
   - Makes it easier to manage and locate files

## Usage Examples

### Enabling the Filesystem Server

```typescript
// Through MCP API
await window.mcpAPI.toggleServer('filesystem', true);

// Check available tools
const tools = await window.mcpAPI.listTools('filesystem');
```

### Writing a File

```typescript
// Direct API
await window.electronAPI.writePersistentFile('data.txt', 'Hello World!');

// Through MCP
await window.mcpAPI.callTool('filesystem', 'write_file', {
  path: 'data.txt',
  content: 'Hello World!'
});
```

### Reading a File

```typescript
// Direct API
const result = await window.electronAPI.readPersistentFile('data.txt');
const content = atob(result.content); // Decode base64

// Through MCP
const result = await window.mcpAPI.callTool('filesystem', 'read_text_file', {
  path: 'data.txt'
});
```

### Listing Files

```typescript
// Direct API
const result = await window.electronAPI.listPersistentFiles();

// Through MCP
const result = await window.mcpAPI.callTool('filesystem', 'list_directory', {
  path: '' // Empty string for root directory
});
```

## Integration with FilePersistenceStore

The filesystem MCP integration automatically syncs with the existing FilePersistenceStore:

1. **Adding Files**: When files are added as persistent, they're saved to the app data directory
2. **Removing Files**: When files are removed, they're deleted from the app data directory
3. **Toggling Persistence**: Moving files between temporary and persistent automatically manages app data directory

## Configuration

### Environment Variables

The main process sets up the following environment variable for the MCP server:

```bash
FILESYSTEM_ALLOWED_DIRECTORIES=/path/to/app/data/PersistentFiles
```

### MCP Server Configuration

In `.mcp.json`:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["--yes", "@modelcontextprotocol/server-filesystem"],
      "type": "stdio",
      "displayName": "Filesystem",
      "description": "Read and write files in allowed directories",
      "env": {
        "FILESYSTEM_ALLOWED_DIRECTORIES": ""
      }
    }
  }
}
```

## Testing

Use the test file `test-filesystem-mcp.html` to verify the integration:

1. Open the Electron app in development mode
2. Navigate to the test HTML file
3. Test each operation to ensure proper functionality

## Error Handling

The implementation includes comprehensive error handling:

- **File not found errors** are handled gracefully
- **Permission errors** are caught and logged
- **Size limit violations** prevent file operations
- **MCP server unavailability** is detected and reported

## Future Enhancements

1. **File Encryption**: Encrypt sensitive files at rest
2. **Compression**: Compress large files to save space
3. **Backup Integration**: Sync with cloud storage services
4. **Version Control**: Track file changes and versions
5. **Advanced Search**: Full-text search within files

## Troubleshooting

### Common Issues

1. **MCP server not starting**
   - Ensure `@modelcontextprotocol/server-filesystem` is installed
   - Check that Node.js and npm are available

2. **Files not persisting**
   - Verify app data directory permissions
   - Check file size limits (2.5MB for persistent files)

3. **Tools not available**
   - Ensure filesystem server is enabled in MCP toggle
   - Check console for MCP connection errors

### Debug Information

Enable debug logging by setting the environment variable:
```bash
DEBUG=mcp:*
```

This will show detailed MCP communication logs in the Electron console.

## Related Files

- `/.mcp.json` - MCP server configuration
- `/electron/main.ts` - App data directory setup
- `/electron/mcp-manager.ts` - MCP server management
- `/src/services/persistence/FilesystemMCPTool.ts` - Filesystem tool implementation
- `/src/stores/filePersistenceStore.ts` - File persistence store integration
- `/test-filesystem-mcp.html` - Integration test file

## API Reference

See the TypeScript interfaces in:
- `src/electron.d.ts` - Type definitions for IPC APIs
- `src/services/persistence/FilesystemMCPTool.ts` - Tool implementations
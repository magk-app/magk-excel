/**
 * Filesystem MCP Tool - Provides file system operations through MCP
 * 
 * This tool acts as a bridge between our FilePersistenceStore and the
 * MCP filesystem server, providing secure file access within allowed directories.
 */

// Import the FileAPI type for proper typing
import type { FileAPI } from '../../electron.d.js';

export interface FilesystemToolCall {
  name: string;
  arguments: Record<string, any>;
}

export interface FilesystemToolResult {
  content?: any;
  isError?: boolean;
  _meta?: {
    progressToken?: string;
  };
}

export class FilesystemMCPTool {
  /**
   * Handle filesystem tool calls
   */
  static async handleToolCall(toolCall: FilesystemToolCall): Promise<FilesystemToolResult> {
    const { name, arguments: args } = toolCall;

    try {
      console.log(`🔧 Filesystem MCP Tool: ${name}`, args);

      switch (name) {
        case 'read_text_file':
          return await this.readTextFile(args.path);
          
        case 'read_media_file':
          return await this.readMediaFile(args.path);
          
        case 'write_file':
          return await this.writeFile(args.path, args.content);
          
        case 'list_directory':
          return await this.listDirectory(args.path);
          
        case 'search_files':
          return await this.searchFiles(args.path, args.pattern);
          
        case 'create_directory':
          return await this.createDirectory(args.path);
          
        case 'get_file_info':
          return await this.getFileInfo(args.path);
          
        case 'move_file':
          return await this.moveFile(args.source, args.destination);
          
        case 'copy_file':
          return await this.copyFile(args.source, args.destination);
          
        case 'delete_file':
          return await this.deleteFile(args.path);
          
        default:
          throw new Error(`Unknown filesystem tool: ${name}`);
      }
    } catch (error) {
      console.error(`❌ Filesystem MCP Tool Error (${name}):`, error);
      return {
        content: `Error: ${error instanceof Error ? error.message : String(error)}`,
        isError: true
      };
    }
  }

  /**
   * Read a text file from persistent storage
   */
  private static async readTextFile(filePath: string): Promise<FilesystemToolResult> {
    try {
      const result = await (window.fileAPI as FileAPI)?.readPersistentFile(filePath);
      
      if (result?.success && result.content) {
        // Decode base64 content to text
        const textContent = atob(result.content);
        return {
          content: textContent
        };
      } else {
        return {
          content: `Error reading file: ${result?.error || 'File not found'}`,
          isError: true
        };
      }
    } catch (error) {
      return {
        content: `Error reading text file: ${error instanceof Error ? error.message : String(error)}`,
        isError: true
      };
    }
  }

  /**
   * Read a media file (binary) from persistent storage
   */
  private static async readMediaFile(filePath: string): Promise<FilesystemToolResult> {
    try {
      const result = await (window.fileAPI as FileAPI)?.readPersistentFile(filePath);
      
      if (result?.success && result.content) {
        return {
          content: `data:application/octet-stream;base64,${result.content}`
        };
      } else {
        return {
          content: `Error reading file: ${result?.error || 'File not found'}`,
          isError: true
        };
      }
    } catch (error) {
      return {
        content: `Error reading media file: ${error instanceof Error ? error.message : String(error)}`,
        isError: true
      };
    }
  }

  /**
   * Write content to a file in persistent storage
   */
  private static async writeFile(filePath: string, content: string): Promise<FilesystemToolResult> {
    try {
      // Extract filename from path
      const fileName = filePath.split(/[/\\]/).pop() || 'unknown_file';
      
      // Determine subdirectory based on file extension
      let subDir: string | undefined;
      const ext = fileName.split('.').pop()?.toLowerCase();
      if (ext) {
        if (['xlsx', 'xls', 'csv'].includes(ext)) {
          subDir = 'excel';
        } else if (['pdf'].includes(ext)) {
          subDir = 'pdf';
        } else if (['txt', 'json', 'xml', 'html'].includes(ext)) {
          subDir = 'uploads';
        }
      }
      
      const result = await (window.fileAPI as FileAPI)?.writePersistentFile(fileName, content, subDir);
      
      if (result?.success) {
        return {
          content: `File written successfully: ${result.filePath}`
        };
      } else {
        return {
          content: `Error writing file: ${result?.error || 'Unknown error'}`,
          isError: true
        };
      }
    } catch (error) {
      return {
        content: `Error writing file: ${error instanceof Error ? error.message : String(error)}`,
        isError: true
      };
    }
  }

  /**
   * List files in a directory
   */
  private static async listDirectory(dirPath?: string): Promise<FilesystemToolResult> {
    try {
      // If no path specified, list the root persistent directory
      const subDir = dirPath ? dirPath.replace(/^[/\\]/, '') : undefined;
      
      const result = await (window.fileAPI as FileAPI)?.listPersistentFiles(subDir);
      
      if (result?.success) {
        const fileList = result.files.map((file: any) => ({
          name: file.name,
          size: file.size,
          modified: file.modified,
          type: 'file'
        }));
        
        return {
          content: JSON.stringify(fileList, null, 2)
        };
      } else {
        return {
          content: `Error listing directory: ${result?.error || 'Unknown error'}`,
          isError: true
        };
      }
    } catch (error) {
      return {
        content: `Error listing directory: ${error instanceof Error ? error.message : String(error)}`,
        isError: true
      };
    }
  }

  /**
   * Search for files matching a pattern
   */
  private static async searchFiles(searchPath: string, pattern: string): Promise<FilesystemToolResult> {
    try {
      const result = await (window.fileAPI as FileAPI)?.listPersistentFiles();
      
      if (result?.success) {
        const regex = new RegExp(pattern, 'i');
        const matchingFiles = result.files
          .filter((file: any) => regex.test(file.name))
          .map((file: any) => ({
            name: file.name,
            path: file.path,
            size: file.size,
            modified: file.modified
          }));
        
        return {
          content: JSON.stringify(matchingFiles, null, 2)
        };
      } else {
        return {
          content: `Error searching files: ${result?.error || 'Unknown error'}`,
          isError: true
        };
      }
    } catch (error) {
      return {
        content: `Error searching files: ${error instanceof Error ? error.message : String(error)}`,
        isError: true
      };
    }
  }

  /**
   * Create a directory (placeholder - directories are auto-created)
   */
  private static async createDirectory(dirPath: string): Promise<FilesystemToolResult> {
    return {
      content: `Directory creation is handled automatically when files are written.`
    };
  }

  /**
   * Get file information
   */
  private static async getFileInfo(filePath: string): Promise<FilesystemToolResult> {
    try {
      const fileName = filePath.split(/[/\\]/).pop() || filePath;
      const result = await (window.fileAPI as FileAPI)?.listPersistentFiles();
      
      if (result?.success) {
        const fileInfo = result.files.find((file: any) => file.name === fileName);
        
        if (fileInfo) {
          return {
            content: JSON.stringify(fileInfo, null, 2)
          };
        } else {
          return {
            content: `File not found: ${fileName}`,
            isError: true
          };
        }
      } else {
        return {
          content: `Error getting file info: ${result?.error || 'Unknown error'}`,
          isError: true
        };
      }
    } catch (error) {
      return {
        content: `Error getting file info: ${error instanceof Error ? error.message : String(error)}`,
        isError: true
      };
    }
  }

  /**
   * Move/rename a file
   */
  private static async moveFile(sourcePath: string, destPath: string): Promise<FilesystemToolResult> {
    return {
      content: `File move operations are not currently supported through the persistent storage system.`,
      isError: true
    };
  }

  /**
   * Copy a file
   */
  private static async copyFile(sourcePath: string, destPath: string): Promise<FilesystemToolResult> {
    return {
      content: `File copy operations are not currently supported through the persistent storage system.`,
      isError: true
    };
  }

  /**
   * Delete a file
   */
  private static async deleteFile(filePath: string): Promise<FilesystemToolResult> {
    try {
      const fileName = filePath.split(/[/\\]/).pop() || filePath;
      const result = await (window.fileAPI as FileAPI)?.deletePersistentFile(fileName);
      
      if (result?.success) {
        return {
          content: `File deleted successfully: ${fileName}`
        };
      } else {
        return {
          content: `Error deleting file: ${result?.error || 'Unknown error'}`,
          isError: true
        };
      }
    } catch (error) {
      return {
        content: `Error deleting file: ${error instanceof Error ? error.message : String(error)}`,
        isError: true
      };
    }
  }

  /**
   * Get available filesystem tool definitions
   */
  static getToolDefinitions() {
    return [
      {
        name: 'read_text_file',
        description: 'Read the contents of a text file from persistent storage',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'The path to the file to read'
            }
          },
          required: ['path']
        }
      },
      {
        name: 'read_media_file',
        description: 'Read the contents of a binary file from persistent storage',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'The path to the file to read'
            }
          },
          required: ['path']
        }
      },
      {
        name: 'write_file',
        description: 'Write content to a file in persistent storage',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'The path where the file should be written'
            },
            content: {
              type: 'string',
              description: 'The content to write to the file'
            }
          },
          required: ['path', 'content']
        }
      },
      {
        name: 'list_directory',
        description: 'List files in a directory within persistent storage',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'The directory path to list (optional, defaults to root)'
            }
          }
        }
      },
      {
        name: 'search_files',
        description: 'Search for files matching a pattern in persistent storage',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'The path to search in'
            },
            pattern: {
              type: 'string',
              description: 'The pattern to search for (regex supported)'
            }
          },
          required: ['path', 'pattern']
        }
      },
      {
        name: 'get_file_info',
        description: 'Get detailed information about a file',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'The path to the file'
            }
          },
          required: ['path']
        }
      },
      {
        name: 'delete_file',
        description: 'Delete a file from persistent storage',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'The path to the file to delete'
            }
          },
          required: ['path']
        }
      }
    ];
  }
}

// Export singleton instance
export const filesystemMCPTool = new FilesystemMCPTool();
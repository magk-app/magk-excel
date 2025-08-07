/**
 * MCP Tool for accessing persistent files
 * Allows the AI to read and work with files stored in the persistence system
 */

import { useFilePersistenceStore } from '../../stores/filePersistenceStore';

export interface PersistenceMCPTool {
  name: string;
  description: string;
  inputSchema: any;
  handleToolCall: (args: any) => Promise<any>;
}

export class PersistenceAccessTool {
  static getToolDefinitions() {
    return [
      {
        name: 'persistence_list_files',
        description: 'List all persistent and temporary files available in the current session',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'Session ID to list files for (optional, defaults to current session)'
            },
            filterType: {
              type: 'string',
              enum: ['all', 'persistent', 'temporary'],
              description: 'Filter files by type (default: all)'
            }
          }
        }
      },
      {
        name: 'persistence_read_file',
        description: 'Read the content of a persistent or temporary file',
        inputSchema: {
          type: 'object',
          properties: {
            fileId: {
              type: 'string',
              description: 'The ID of the file to read'
            },
            asText: {
              type: 'boolean',
              description: 'Whether to decode the content as text (for text files)'
            }
          },
          required: ['fileId']
        }
      },
      {
        name: 'persistence_get_file_info',
        description: 'Get detailed information about a specific file',
        inputSchema: {
          type: 'object',
          properties: {
            fileId: {
              type: 'string',
              description: 'The ID of the file to get info for'
            }
          },
          required: ['fileId']
        }
      },
      {
        name: 'persistence_search_files',
        description: 'Search for files by name or type',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query for file name'
            },
            fileType: {
              type: 'string',
              description: 'Filter by MIME type (e.g., "application/pdf", "text/csv")'
            },
            sessionId: {
              type: 'string',
              description: 'Session ID to search within (optional)'
            }
          }
        }
      }
    ];
  }

  static async handleToolCall(toolCall: { name: string; arguments: any }): Promise<any> {
    const { name, arguments: args } = toolCall;
    const store = useFilePersistenceStore.getState();

    switch (name) {
      case 'persistence_list_files': {
        const sessionId = args.sessionId || store.currentSessionId || 'default';
        const filterType = args.filterType || 'all';
        
        const sessionFiles = store.getSessionFiles(sessionId);
        
        let files = sessionFiles;
        if (filterType === 'persistent') {
          files = sessionFiles.filter(f => f.isPersistent);
        } else if (filterType === 'temporary') {
          files = sessionFiles.filter(f => !f.isPersistent);
        }
        
        return {
          success: true,
          sessionId,
          fileCount: files.length,
          files: files.map(f => ({
            id: f.id,
            name: f.name,
            type: f.type,
            size: f.size,
            isPersistent: f.isPersistent,
            uploadedAt: f.uploadedAt,
            tags: f.tags,
            description: f.description
          }))
        };
      }
      
      case 'persistence_read_file': {
        const { fileId, asText } = args;
        const file = store.getFile(fileId);
        
        if (!file) {
          return {
            success: false,
            error: `File not found: ${fileId}`
          };
        }
        
        let textContent = undefined;
        if (asText) {
          try {
            // Decode base64 to text
            const decoded = atob(file.content);
            textContent = decoded;
          } catch (e) {
            console.error('Failed to decode as text:', e);
          }
        }
        
        return {
          success: true,
          file: {
            id: file.id,
            name: file.name,
            type: file.type,
            size: file.size,
            isPersistent: file.isPersistent,
            content: file.content, // Base64
            textContent, // Decoded text if requested
            uploadedAt: file.uploadedAt
          }
        };
      }
      
      case 'persistence_get_file_info': {
        const { fileId } = args;
        const file = store.getFile(fileId);
        
        if (!file) {
          return {
            success: false,
            error: `File not found: ${fileId}`
          };
        }
        
        return {
          success: true,
          file: {
            id: file.id,
            name: file.name,
            type: file.type,
            size: file.size,
            isPersistent: file.isPersistent,
            uploadedAt: file.uploadedAt,
            sessionId: file.sessionId,
            tags: file.tags,
            description: file.description,
            sizeFormatted: formatFileSize(file.size)
          }
        };
      }
      
      case 'persistence_search_files': {
        const { query, fileType, sessionId } = args;
        
        let files: any[] = [];
        if (sessionId) {
          files = store.getSessionFiles(sessionId);
        } else {
          // Get all files from all sessions
          const allTemp = Array.from(store.temporaryFiles.values());
          const allPersistent = Array.from(store.persistentFiles.values());
          files = [...allTemp, ...allPersistent];
        }
        
        // Apply filters
        if (query) {
          const lowerQuery = query.toLowerCase();
          files = files.filter(f => 
            f.name.toLowerCase().includes(lowerQuery) ||
            (f.description && f.description.toLowerCase().includes(lowerQuery)) ||
            (f.tags && f.tags.some((t: string) => t.toLowerCase().includes(lowerQuery)))
          );
        }
        
        if (fileType) {
          files = files.filter(f => f.type === fileType);
        }
        
        return {
          success: true,
          query,
          fileType,
          matchCount: files.length,
          files: files.map(f => ({
            id: f.id,
            name: f.name,
            type: f.type,
            size: f.size,
            isPersistent: f.isPersistent,
            uploadedAt: f.uploadedAt,
            sessionId: f.sessionId
          }))
        };
      }
      
      default:
        return {
          success: false,
          error: `Unknown tool: ${name}`
        };
    }
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// Export singleton instance for easy use
export const persistenceMCPTool = {
  getToolDefinitions: PersistenceAccessTool.getToolDefinitions,
  handleToolCall: PersistenceAccessTool.handleToolCall
};
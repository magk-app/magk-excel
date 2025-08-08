#!/usr/bin/env node

/**
 * Filesystem MCP Server
 * Provides filesystem access capabilities
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class FilesystemMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'filesystem-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler('tools/list', async () => ({
      tools: [
        {
          name: 'read_file',
          description: 'Read contents of a file',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'File path to read',
              },
              encoding: {
                type: 'string',
                description: 'File encoding (default: utf-8)',
              },
            },
            required: ['path'],
          },
        },
        {
          name: 'write_file',
          description: 'Write contents to a file',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'File path to write',
              },
              content: {
                type: 'string',
                description: 'Content to write',
              },
              encoding: {
                type: 'string',
                description: 'File encoding (default: utf-8)',
              },
            },
            required: ['path', 'content'],
          },
        },
        {
          name: 'list_directory',
          description: 'List contents of a directory',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'Directory path',
              },
              recursive: {
                type: 'boolean',
                description: 'List recursively',
              },
            },
            required: ['path'],
          },
        },
        {
          name: 'create_directory',
          description: 'Create a directory',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'Directory path to create',
              },
              recursive: {
                type: 'boolean',
                description: 'Create parent directories if needed',
              },
            },
            required: ['path'],
          },
        },
        {
          name: 'delete_file',
          description: 'Delete a file',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'File path to delete',
              },
            },
            required: ['path'],
          },
        },
        {
          name: 'file_exists',
          description: 'Check if a file exists',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'File path to check',
              },
            },
            required: ['path'],
          },
        },
      ],
    }));

    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'read_file':
          return await this.readFile(args);
        case 'write_file':
          return await this.writeFile(args);
        case 'list_directory':
          return await this.listDirectory(args);
        case 'create_directory':
          return await this.createDirectory(args);
        case 'delete_file':
          return await this.deleteFile(args);
        case 'file_exists':
          return await this.fileExists(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  async readFile(args) {
    try {
      const { path: filePath, encoding = 'utf-8' } = args;
      const content = await fs.readFile(filePath, encoding);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              content,
              path: filePath,
            }),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message,
            }),
          },
        ],
      };
    }
  }

  async writeFile(args) {
    try {
      const { path: filePath, content, encoding = 'utf-8' } = args;
      await fs.writeFile(filePath, content, encoding);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `File written successfully: ${filePath}`,
            }),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message,
            }),
          },
        ],
      };
    }
  }

  async listDirectory(args) {
    try {
      const { path: dirPath, recursive = false } = args;
      
      if (recursive) {
        const results = await this.walkDirectory(dirPath);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                files: results,
                path: dirPath,
              }),
            },
          ],
        };
      } else {
        const files = await fs.readdir(dirPath);
        const details = await Promise.all(
          files.map(async (file) => {
            const filePath = path.join(dirPath, file);
            const stats = await fs.stat(filePath);
            return {
              name: file,
              path: filePath,
              isDirectory: stats.isDirectory(),
              size: stats.size,
              modified: stats.mtime,
            };
          })
        );
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                files: details,
                path: dirPath,
              }),
            },
          ],
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message,
            }),
          },
        ],
      };
    }
  }

  async walkDirectory(dir, fileList = []) {
    const files = await fs.readdir(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = await fs.stat(filePath);
      
      if (stats.isDirectory()) {
        await this.walkDirectory(filePath, fileList);
      } else {
        fileList.push({
          name: file,
          path: filePath,
          size: stats.size,
          modified: stats.mtime,
        });
      }
    }
    
    return fileList;
  }

  async createDirectory(args) {
    try {
      const { path: dirPath, recursive = true } = args;
      await fs.mkdir(dirPath, { recursive });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `Directory created: ${dirPath}`,
            }),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message,
            }),
          },
        ],
      };
    }
  }

  async deleteFile(args) {
    try {
      const { path: filePath } = args;
      await fs.unlink(filePath);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `File deleted: ${filePath}`,
            }),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message,
            }),
          },
        ],
      };
    }
  }

  async fileExists(args) {
    try {
      const { path: filePath } = args;
      await fs.access(filePath);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              exists: true,
              path: filePath,
            }),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              exists: false,
              path: args.path,
            }),
          },
        ],
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Filesystem MCP Server running on stdio');
  }
}

const server = new FilesystemMCPServer();
server.run().catch(console.error);
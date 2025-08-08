#!/usr/bin/env node

/**
 * Persistent Storage MCP Server
 * Provides persistent storage capabilities across sessions
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class PersistentMCPServer {
  constructor() {
    this.storageDir = path.join(os.homedir(), '.magk-excel', 'persistent-storage');
    this.server = new Server(
      {
        name: 'persistent-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.initStorage();
    this.setupToolHandlers();
  }

  async initStorage() {
    try {
      await fs.mkdir(this.storageDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create storage directory:', error);
    }
  }

  setupToolHandlers() {
    this.server.setRequestHandler('tools/list', async () => ({
      tools: [
        {
          name: 'store_data',
          description: 'Store data persistently',
          inputSchema: {
            type: 'object',
            properties: {
              key: {
                type: 'string',
                description: 'Storage key',
              },
              value: {
                type: 'object',
                description: 'Data to store',
              },
              sessionId: {
                type: 'string',
                description: 'Session identifier',
              },
            },
            required: ['key', 'value'],
          },
        },
        {
          name: 'retrieve_data',
          description: 'Retrieve persistent data',
          inputSchema: {
            type: 'object',
            properties: {
              key: {
                type: 'string',
                description: 'Storage key',
              },
              sessionId: {
                type: 'string',
                description: 'Session identifier',
              },
            },
            required: ['key'],
          },
        },
        {
          name: 'list_keys',
          description: 'List all stored keys',
          inputSchema: {
            type: 'object',
            properties: {
              sessionId: {
                type: 'string',
                description: 'Session identifier',
              },
            },
          },
        },
        {
          name: 'delete_data',
          description: 'Delete persistent data',
          inputSchema: {
            type: 'object',
            properties: {
              key: {
                type: 'string',
                description: 'Storage key',
              },
              sessionId: {
                type: 'string',
                description: 'Session identifier',
              },
            },
            required: ['key'],
          },
        },
      ],
    }));

    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'store_data':
          return await this.storeData(args);
        case 'retrieve_data':
          return await this.retrieveData(args);
        case 'list_keys':
          return await this.listKeys(args);
        case 'delete_data':
          return await this.deleteData(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  async storeData(args) {
    try {
      const { key, value, sessionId = 'default' } = args;
      const filePath = path.join(this.storageDir, `${sessionId}_${key}.json`);
      
      await fs.writeFile(filePath, JSON.stringify(value, null, 2));
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `Data stored successfully for key: ${key}`,
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

  async retrieveData(args) {
    try {
      const { key, sessionId = 'default' } = args;
      const filePath = path.join(this.storageDir, `${sessionId}_${key}.json`);
      
      const data = await fs.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(data);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              data: parsed,
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
              error: error.code === 'ENOENT' ? 'Key not found' : error.message,
            }),
          },
        ],
      };
    }
  }

  async listKeys(args) {
    try {
      const { sessionId = 'default' } = args;
      const files = await fs.readdir(this.storageDir);
      
      const keys = files
        .filter(f => f.startsWith(`${sessionId}_`) && f.endsWith('.json'))
        .map(f => f.replace(`${sessionId}_`, '').replace('.json', ''));
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              keys,
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

  async deleteData(args) {
    try {
      const { key, sessionId = 'default' } = args;
      const filePath = path.join(this.storageDir, `${sessionId}_${key}.json`);
      
      await fs.unlink(filePath);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `Data deleted successfully for key: ${key}`,
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
              error: error.code === 'ENOENT' ? 'Key not found' : error.message,
            }),
          },
        ],
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Persistent Storage MCP Server running on stdio');
  }
}

const server = new PersistentMCPServer();
server.run().catch(console.error);
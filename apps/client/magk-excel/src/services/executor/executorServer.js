#!/usr/bin/env node

/**
 * Executor MCP Server
 * Provides command execution capabilities
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');

const execAsync = promisify(exec);

class ExecutorMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'executor-mcp',
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
          name: 'execute_command',
          description: 'Execute a shell command',
          inputSchema: {
            type: 'object',
            properties: {
              command: {
                type: 'string',
                description: 'The command to execute',
              },
              cwd: {
                type: 'string',
                description: 'Working directory for the command',
              },
            },
            required: ['command'],
          },
        },
        {
          name: 'run_script',
          description: 'Run a script file',
          inputSchema: {
            type: 'object',
            properties: {
              scriptPath: {
                type: 'string',
                description: 'Path to the script file',
              },
              args: {
                type: 'array',
                items: { type: 'string' },
                description: 'Arguments to pass to the script',
              },
            },
            required: ['scriptPath'],
          },
        },
      ],
    }));

    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'execute_command':
          return await this.executeCommand(args);
        case 'run_script':
          return await this.runScript(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  async executeCommand(args) {
    try {
      const { command, cwd } = args;
      const options = cwd ? { cwd } : {};
      
      console.error(`Executing command: ${command}`);
      const { stdout, stderr } = await execAsync(command, options);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              stdout,
              stderr,
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

  async runScript(args) {
    try {
      const { scriptPath, args: scriptArgs = [] } = args;
      const command = `node ${scriptPath} ${scriptArgs.join(' ')}`;
      
      console.error(`Running script: ${command}`);
      const { stdout, stderr } = await execAsync(command);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              stdout,
              stderr,
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

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Executor MCP Server running on stdio');
  }
}

const server = new ExecutorMCPServer();
server.run().catch(console.error);
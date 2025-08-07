/**
 * Mock MCP Server Launcher
 * Used to start mock MCP servers for development
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration for mock servers
const mockServers = {
  excel: {
    script: path.join(__dirname, 'mockExcelServer.js'),
    port: 9001,
    enabled: true
  },
  pdf: {
    script: path.join(__dirname, 'mockPdfServer.js'),
    port: 9002,
    enabled: true
  },
  firecrawl: {
    script: path.join(__dirname, 'mockFirecrawlServer.js'),
    port: 9003,
    enabled: true
  },
  puppeteer: {
    script: path.join(__dirname, 'mockPuppeteerServer.js'),
    port: 9004,
    enabled: true
  },
  fetch: {
    script: path.join(__dirname, 'mockFetchServer.js'),
    port: 9005,
    enabled: true
  }
};

// Launch all enabled mock servers
function launchMockServers() {
  Object.entries(mockServers).forEach(([name, config]) => {
    if (config.enabled) {
      try {
        // Create the mock server file if it doesn't exist
        if (!fs.existsSync(config.script)) {
          fs.writeFileSync(
            config.script,
            createMockServerScript(name, config.port)
          );
        }
        
        // Launch the server
        const server = spawn('node', [config.script], {
          stdio: 'pipe',
          env: { ...process.env, PORT: config.port.toString() }
        });
        
        server.stdout.on('data', (data) => {
          console.log(`[Mock ${name}] ${data.toString().trim()}`);
        });
        
        server.stderr.on('data', (data) => {
          console.error(`[Mock ${name} Error] ${data.toString().trim()}`);
        });
        
        server.on('exit', (code) => {
          console.log(`Mock ${name} server exited with code ${code}`);
        });
        
        console.log(`Started mock ${name} server on port ${config.port}`);
      } catch (error) {
        console.error(`Failed to start mock ${name} server:`, error);
      }
    }
  });
}

// Create a basic mock server script
function createMockServerScript(serviceName, port) {
  return `/**
 * Mock ${serviceName.toUpperCase()} MCP Server
 */

const http = require('http');
const serviceImpl = require('./Mock${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}Service.js');

const server = http.createServer((req, res) => {
  if (req.method === 'POST') {
    let body = '';
    
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        const request = JSON.parse(body);
        console.log('[${serviceName}] Received request:', request);
        
        // Process the JSON-RPC request
        if (request.jsonrpc === '2.0' && request.method) {
          let result;
          
          if (request.method === 'ping') {
            result = await serviceImpl.ping();
          } else {
            result = await serviceImpl[request.method](request.params);
          }
          
          // Send the response
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            jsonrpc: '2.0',
            id: request.id,
            result
          }));
        } else {
          throw new Error('Invalid JSON-RPC request');
        }
      } catch (error) {
        console.error('[${serviceName}] Error processing request:', error);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          jsonrpc: '2.0',
          id: request.id,
          error: { message: error.message }
        }));
      }
    });
  } else {
    res.writeHead(405);
    res.end('Method not allowed');
  }
});

const PORT = process.env.PORT || ${port};
server.listen(PORT, () => {
  console.log(\`Mock ${serviceName} server listening on port \${PORT}\`);
});
`;
}

// Create basic service implementation file
function createMockServiceImplementation(serviceName) {
  return `/**
 * Mock ${serviceName.toUpperCase()} Service
 */

class Mock${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}Service {
  constructor() {
    console.log('Mock ${serviceName.toUpperCase()} Service initialized');
  }
  
  async ping() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
  
  // Add service-specific methods here
}

module.exports = new Mock${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}Service();
`;
}

// Create service implementation files if they don't exist
function createMockServiceImplementations() {
  Object.entries(mockServers).forEach(([name, config]) => {
    if (config.enabled) {
      const implPath = path.join(
        __dirname, 
        `Mock${name.charAt(0).toUpperCase() + name.slice(1)}Service.js`
      );
      
      if (!fs.existsSync(implPath) && name !== 'excel') {
        // Excel service is already created
        fs.writeFileSync(implPath, createMockServiceImplementation(name));
      }
    }
  });
}

// Initialize and launch servers
createMockServiceImplementations();
launchMockServers();

module.exports = {
  launchMockServers,
  mockServers
};
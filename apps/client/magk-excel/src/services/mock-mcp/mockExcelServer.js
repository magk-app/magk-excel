/**
 * Mock Excel MCP Server
 */

const http = require('http');
const serviceImpl = require('./MockExcelService.js');

const server = http.createServer((req, res) => {
  if (req.method === 'POST') {
    let body = '';
    
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        const request = JSON.parse(body);
        console.log('[Excel] Received request:', request);
        
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
        console.error('[Excel] Error processing request:', error);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          jsonrpc: '2.0',
          id: request.id || null,
          error: { message: error.message }
        }));
      }
    });
  } else {
    res.writeHead(405);
    res.end('Method not allowed');
  }
});

const PORT = process.env.PORT || 9001;
server.listen(PORT, () => {
  console.log(`Mock Excel server listening on port ${PORT}`);
});
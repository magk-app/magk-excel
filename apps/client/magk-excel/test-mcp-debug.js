#!/usr/bin/env node

/**
 * MCP Server Debug Test Script
 * Tests direct connection to MCP servers to isolate toggle issues
 */

import { spawn } from 'child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

// Load actual MCP server configurations from .mcp.json
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let MCP_SERVERS = {};

try {
  const mcpConfig = JSON.parse(readFileSync(join(__dirname, '.mcp.json'), 'utf8'));
  MCP_SERVERS = Object.entries(mcpConfig.mcpServers).reduce((acc, [name, config]) => {
    acc[name] = {
      command: config.command,
      args: config.args || [],
      displayName: config.displayName,
      description: config.description,
      env: config.env || {}
    };
    return acc;
  }, {});
  
  console.log(`📋 Loaded ${Object.keys(MCP_SERVERS).length} MCP servers from .mcp.json`);
} catch (error) {
  console.error('❌ Failed to load .mcp.json:', error.message);
  process.exit(1);
}

async function testServerConnection(serverName, config) {
  console.log(`\n🔍 Testing MCP Server: ${serverName}`);
  console.log(`   Command: ${config.command} ${config.args.join(' ')}`);
  console.log(`   Description: ${config.description}`);
  
  let transport = null;
  let client = null;
  
  try {
    // Step 1: Check if command exists
    console.log('   📋 Step 1: Checking if command exists...');
    const testSpawn = spawn(config.command, ['--version'], { stdio: 'pipe' });
    
    await new Promise((resolve, reject) => {
      testSpawn.on('close', (code) => {
        if (code === 0 || code === 1) { // npm returns 1 for some --version calls
          console.log('   ✅ Command available');
          resolve();
        } else {
          reject(new Error(`Command not available (exit code: ${code})`));
        }
      });
      testSpawn.on('error', (err) => {
        reject(new Error(`Command error: ${err.message}`));
      });
      
      // Timeout after 5 seconds
      setTimeout(() => {
        testSpawn.kill();
        reject(new Error('Command check timeout'));
      }, 5000);
    });

    // Step 2: Create transport
    console.log('   🚇 Step 2: Creating stdio transport...');
    const cleanEnv = { ...process.env, ...config.env };
    
    transport = new StdioClientTransport({
      command: config.command,
      args: config.args,
      env: cleanEnv
    });
    console.log('   ✅ Transport created');

    // Step 3: Create client  
    console.log('   🤖 Step 3: Creating MCP client...');
    client = new Client({
      name: `test-client-${serverName}`,
      version: '1.0.0'
    });
    console.log('   ✅ Client created');

    // Step 4: Connect with timeout
    console.log('   🔌 Step 4: Connecting to server...');
    const connectPromise = client.connect(transport);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`Connection timeout after 15 seconds`)), 15000)
    );
    
    await Promise.race([connectPromise, timeoutPromise]);
    console.log('   ✅ Successfully connected!');

    // Step 5: List capabilities
    console.log('   📋 Step 5: Listing server capabilities...');
    try {
      const tools = await client.listTools();
      console.log(`   📋 Available tools: ${tools.tools?.length || 0}`);
      if (tools.tools && tools.tools.length > 0) {
        tools.tools.slice(0, 3).forEach(tool => {
          console.log(`      - ${tool.name}${tool.description ? ': ' + tool.description : ''}`);
        });
        if (tools.tools.length > 3) {
          console.log(`      + ${tools.tools.length - 3} more tools...`);
        }
      }
    } catch (toolError) {
      console.warn('   ⚠️ Could not list tools:', toolError.message);
    }

    try {
      const resources = await client.listResources();
      console.log(`   📁 Available resources: ${resources.resources?.length || 0}`);
    } catch (resourceError) {
      console.warn('   ⚠️ Could not list resources:', resourceError.message);
    }

    // Step 6: Test a simple tool call (if available)
    try {
      const tools = await client.listTools();
      if (tools.tools && tools.tools.length > 0) {
        const testTool = tools.tools[0];
        console.log(`   🛠️ Step 6: Testing tool call: ${testTool.name}`);
        
        // Only test if it's a safe tool with simple args
        if (testTool.name === 'fetch' && testTool.inputSchema) {
          const result = await client.callTool({
            name: 'fetch',
            arguments: { 
              url: 'https://httpbin.org/json',
              method: 'GET'
            }
          });
          console.log('   ✅ Tool call successful:', result.content?.[0]?.text ? 'Got response' : 'No content');
        } else {
          console.log('   ⏭️ Skipping tool test (not a safe test tool)');
        }
      }
    } catch (toolCallError) {
      console.warn('   ⚠️ Tool call failed:', toolCallError.message);
    }

    console.log(`   🎉 ${serverName} connection test PASSED`);
    return { success: true, server: serverName };

  } catch (error) {
    console.error(`   ❌ ${serverName} connection test FAILED:`, error.message);
    return { success: false, server: serverName, error: error.message };
  } finally {
    // Cleanup
    try {
      if (client) {
        console.log('   🧹 Cleaning up client...');
        await client.close();
      }
      if (transport) {
        console.log('   🧹 Cleaning up transport...');
        await transport.close();
      }
    } catch (cleanupError) {
      console.warn('   ⚠️ Cleanup error:', cleanupError.message);
    }
  }
}

async function runAllTests() {
  console.log('🚀 MCP Server Connectivity Test Suite');
  console.log('=====================================');
  
  const results = [];
  
  for (const [serverName, config] of Object.entries(MCP_SERVERS)) {
    const result = await testServerConnection(serverName, config);
    results.push(result);
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📊 Test Results Summary');
  console.log('======================');
  
  const passed = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Passed: ${passed.length}/${results.length}`);
  console.log(`❌ Failed: ${failed.length}/${results.length}`);
  
  if (passed.length > 0) {
    console.log('\n✅ Working servers:');
    passed.forEach(r => console.log(`   - ${r.server}`));
  }
  
  if (failed.length > 0) {
    console.log('\n❌ Failed servers:');
    failed.forEach(r => console.log(`   - ${r.server}: ${r.error}`));
  }
  
  console.log('\n🔍 Next Steps:');
  if (failed.length > 0) {
    console.log('   1. Install missing MCP servers:');
    failed.forEach(r => {
      const config = MCP_SERVERS[r.server];
      console.log(`      npm install -g ${config.args[0]}`);
    });
  }
  
  if (passed.length > 0) {
    console.log('   2. Working servers can be used for MCP integration testing');
    console.log('   3. Check Electron main process console for MCP manager errors');
    console.log('   4. Verify React component state updates after toggle operations');
  }
  
  process.exit(failed.length > 0 ? 1 : 0);
}

// Handle uncaught errors
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught exception:', err);
  process.exit(1);
});

// Run tests
runAllTests().catch(err => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
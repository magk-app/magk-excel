// Test script to verify MCP server integration
import { MCPManager } from '../electron/mcp-manager.js';

async function testMCPIntegration() {
  console.log('🧪 Testing MCP Integration...\n');
  
  const mcpManager = new MCPManager();
  
  try {
    // Test 1: Initialize and load config
    console.log('1️⃣ Testing initialization...');
    await mcpManager.initialize();
    
    const availableServers = mcpManager.getAvailableServers();
    const enabledServers = mcpManager.getEnabledServers();
    
    console.log(`✅ Available servers: ${availableServers.join(', ')}`);
    console.log(`✅ Enabled servers: ${enabledServers.join(', ')}\n`);
    
    // Test 2: Try to connect to a simple server (fetch)
    console.log('2️⃣ Testing server connection (fetch)...');
    
    if (availableServers.includes('fetch')) {
      try {
        await mcpManager.toggleServer('fetch', true);
        console.log('✅ Successfully connected to fetch server');
        
        // Test tool listing
        const tools = await mcpManager.listTools('fetch');
        console.log(`✅ Found ${tools.length} tools from fetch server`);
        
        // Disconnect
        await mcpManager.toggleServer('fetch', false);
        console.log('✅ Successfully disconnected from fetch server\n');
      } catch (error) {
        console.error('❌ Failed to connect to fetch server:', error.message);
      }
    } else {
      console.log('⚠️ Fetch server not available in config\n');
    }
    
    // Test 3: Try another server (claude-flow)
    console.log('3️⃣ Testing server connection (claude-flow)...');
    
    if (availableServers.includes('claude-flow')) {
      try {
        await mcpManager.toggleServer('claude-flow', true);
        console.log('✅ Successfully connected to claude-flow server');
        
        // Test tool listing
        const tools = await mcpManager.listTools('claude-flow');
        console.log(`✅ Found ${tools.length} tools from claude-flow server`);
        
        // Disconnect
        await mcpManager.toggleServer('claude-flow', false);
        console.log('✅ Successfully disconnected from claude-flow server\n');
      } catch (error) {
        console.error('❌ Failed to connect to claude-flow server:', error.message);
      }
    } else {
      console.log('⚠️ Claude-flow server not available in config\n');
    }
    
    // Test 4: Multiple server handling
    console.log('4️⃣ Testing multiple server handling...');
    
    const testServers = availableServers.slice(0, 2); // Test first 2 servers
    for (const serverName of testServers) {
      try {
        console.log(`   🔌 Connecting to ${serverName}...`);
        await mcpManager.toggleServer(serverName, true);
        console.log(`   ✅ Connected to ${serverName}`);
      } catch (error) {
        console.log(`   ❌ Failed to connect to ${serverName}: ${error.message}`);
      }
    }
    
    const enabledAfterTest = mcpManager.getEnabledServers();
    console.log(`✅ Enabled servers after test: ${enabledAfterTest.join(', ')}\n`);
    
    // Cleanup
    console.log('🧹 Cleaning up connections...');
    await mcpManager.shutdown();
    console.log('✅ All connections closed\n');
    
    console.log('🎉 MCP Integration Test Complete!');
    
  } catch (error) {
    console.error('❌ MCP Integration Test Failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
testMCPIntegration().catch(error => {
  console.error('❌ Unhandled test error:', error);
  process.exit(1);
});
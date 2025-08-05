// Test script to check Smithery API response structure
import https from 'https';

async function testSmitheryAPI() {
  const baseUrl = 'https://registry.smithery.ai';
  
  console.log('🔍 Testing Smithery API endpoints...\n');
  
  // Test 1: Public search endpoint (should work without API key)
  try {
    console.log('1. Testing public search endpoint:');
    const searchResponse = await makeRequest(`${baseUrl}/servers?q=is:verified&page=1&pageSize=5`);
    console.log('✅ Search response received');
    console.log('📊 Response structure:', {
      hasServers: Array.isArray(searchResponse.servers),
      serverCount: searchResponse.servers?.length || 0,
      firstServerKeys: searchResponse.servers && searchResponse.servers[0] ? Object.keys(searchResponse.servers[0]).sort() : [],
      sampleServer: searchResponse.servers && searchResponse.servers[0] ? {
        qualifiedName: searchResponse.servers[0].qualifiedName,
        displayName: searchResponse.servers[0].displayName,
        isDeployed: searchResponse.servers[0].isDeployed,
        hasIsDeployedField: 'isDeployed' in searchResponse.servers[0]
      } : 'no servers'
    });
    
    if (searchResponse.servers && searchResponse.servers[0]) {
      console.log('\n🔎 First server full structure:');
      console.log(JSON.stringify(searchResponse.servers[0], null, 2));
    }
  } catch (error) {
    console.error('❌ Search endpoint failed:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 2: Server details endpoint
  try {
    console.log('2. Testing server details endpoint (first server from search):');
    const searchResponse = await makeRequest(`${baseUrl}/servers?q=is:verified&page=1&pageSize=1`);
    
    if (searchResponse.servers && searchResponse.servers[0]) {
      const qualifiedName = searchResponse.servers[0].qualifiedName;
      console.log(`🎯 Getting details for: ${qualifiedName}`);
      
      const detailsResponse = await makeRequest(`${baseUrl}/servers/${encodeURIComponent(qualifiedName)}`);
      console.log('✅ Details response received');
      console.log('📊 Details structure:', {
        hasIsDeployedField: 'isDeployed' in detailsResponse,
        isDeployed: detailsResponse.isDeployed,
        allKeys: Object.keys(detailsResponse).sort()
      });
      
      console.log('\n🔎 Server details full structure:');
      console.log(JSON.stringify(detailsResponse, null, 2));
    }
  } catch (error) {
    console.error('❌ Details endpoint failed:', error.message);
  }
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'MAGK-Excel-Test/1.0.0'
      }
    }, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        try {
          if (response.statusCode !== 200) {
            reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
            return;
          }
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (error) {
          reject(new Error(`Failed to parse JSON: ${error.message}`));
        }
      });
    });
    
    request.on('error', (error) => {
      reject(error);
    });
    
    request.setTimeout(10000, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

testSmitheryAPI().catch(console.error);